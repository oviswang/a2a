/**
 * CompanionManager — owns the Pouchy Companion SDK lifecycle for A2A.FUN.
 *
 * Opt-in and self-contained: the rest of the game talks to this class, never to
 * the SDK directly, and it stays free of Three.js so it can be unit-reasoned in
 * isolation. If the token is bad or the network fails, it flips to a `disabled`
 * state where every method is a safe no-op and the game continues unchanged.
 *
 * Capabilities:
 *  - Phase 1: stream live world-state (retained state + transient moments) and
 *    relay chat replies; optional voice co-pilot (connectCall).
 *  - Phase 2: declare game tools (set_waypoint / drop_beacon) the companion can
 *    call; results route back through an injected executor.
 *  - Phase 3: A2A — invite Pouchy friends to a world (companion-mediated, via a
 *    text turn carrying a join link) and receive inbound "sky letters".
 *  - Phase 4: pair a co-present visitor (separate representative session).
 */
import {
  createCompanion,
  type CompanionClient,
  type CompanionCall,
  type CompanionToolDecl,
  type SocialMessagePayload,
  type ConfirmRequestPayload,
} from "@pouchy_ai/companion-sdk";

export const POUCHY_BASE_URL = "https://www.pouchy.ai";
/** Surface keys a resumable session; keep stable for memory continuity. */
const SURFACE = "a2a-fun";

/** A join link the companion includes in an invite and the receiver parses back
 *  out of an inbound message's plain text (social payloads are text-only). */
export function worldJoinLink(slug: string): string {
  return `https://a2a.fun/?w=${slug}`;
}
/** Pull a world slug out of arbitrary message text (`?w=`, `/w/`, or `[a2a:..]`). */
export function parseWorldSlug(text: string): string | null {
  const m =
    text.match(/[?&]w=([A-Za-z0-9_-]{6,16})/) ||
    text.match(/\/w\/([A-Za-z0-9_-]{6,16})/) ||
    text.match(/\[a2a:([A-Za-z0-9_-]{6,16})\]/);
  return m ? m[1]! : null;
}

export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ ok: boolean; result?: unknown }>;

export interface CompanionManagerOptions {
  token: string;
  locale: "en" | "zh";
  appContext: { name: string; description: string };
  tools: CompanionToolDecl[];
  /** Executes a tool the companion asked for; returns a result to report back. */
  execTool: ToolExecutor;
  /** Render an assistant reply (chat panel + bubble). */
  onMessage: (text: string) => void;
  /** An inbound A2A friend message ("sky letter"). */
  onSocialMessage: (msg: SocialMessagePayload, joinSlug: string | null) => void;
  /** A sensitive op (e.g. messaging friends) needs first-party approval in Pouchy. */
  onConfirmRequest?: (p: ConfirmRequestPayload) => void;
  /** Status changes for the UI (status dot / disabled state). */
  onStatus?: (s: CompanionStatus) => void;
}

export type CompanionStatus =
  | { state: "connecting" }
  | { state: "ready"; scopes: string[] }
  | { state: "disabled"; reason: string };

const RETAINED_MIN_INTERVAL_MS = 1500;

export class CompanionManager {
  private client: CompanionClient | null = null;
  private call: CompanionCall | null = null;
  private disabled = false;
  private ready = false;
  private scopes = new Set<string>();
  private readonly opts: CompanionManagerOptions;

  /** Last sent value + time per retained `type`, for dedupe + throttle. */
  private readonly retained = new Map<string, { json: string; at: number }>();
  private readonly unsubs: Array<() => void> = [];

  constructor(opts: CompanionManagerOptions) {
    this.opts = opts;
  }

  /** Handshake + open the reply stream. Resolves to whether it connected. */
  async connect(): Promise<boolean> {
    this.opts.onStatus?.({ state: "connecting" });
    try {
      this.client = createCompanion({
        baseUrl: POUCHY_BASE_URL,
        token: this.opts.token,
        surface: SURFACE,
        modalities: ["text", "call"],
        contextKinds: ["game.world", "game.player.*", "game.quest.*", "game.event.*"],
        tools: this.opts.tools,
        appContext: this.opts.appContext,
      });

      this.unsubs.push(
        this.client.onMessage((text) => this.opts.onMessage(text)),
        this.client.onSocialMessage((p) =>
          this.opts.onSocialMessage(p, parseWorldSlug(p.content)),
        ),
        this.client.onToolCall(async (call) => this.handleToolCall(call)),
        this.client.onError((err) => {
          if (err.code === "stream_unauthorized") this.disable(err.message);
        }),
      );
      if (this.opts.onConfirmRequest) {
        this.unsubs.push(this.client.onConfirmRequest((p) => this.opts.onConfirmRequest!(p)));
      }

      const ack = await this.client.connect();
      this.scopes = new Set(ack.grantedScopes);
      this.client.start();
      this.ready = true;
      this.opts.onStatus?.({ state: "ready", scopes: ack.grantedScopes });
      return true;
    } catch (e) {
      this.disable(e instanceof Error ? e.message : String(e));
      return false;
    }
  }

  private disable(reason: string) {
    this.disabled = true;
    this.ready = false;
    this.opts.onStatus?.({ state: "disabled", reason });
  }

  get isReady(): boolean {
    return this.ready && !this.disabled;
  }

  hasScope(scope: string): boolean {
    return this.scopes.has(scope);
  }

  private async handleToolCall(call: { id: string; name: string; args: string }) {
    if (!this.client) return;
    let args: Record<string, unknown> = {};
    try {
      args = call.args ? (JSON.parse(call.args) as Record<string, unknown>) : {};
    } catch {
      /* keep empty args */
    }
    try {
      const res = await this.opts.execTool(call.name, args);
      await this.client.sendToolResult(call.id, res);
    } catch (e) {
      await this.client.sendToolResult(call.id, {
        ok: false,
        result: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // ── World-state ───────────────────────────────────────────────────────────

  /** Latest-value state, coalesced per type. Skips unchanged values and throttles
   *  high-frequency updates so we never spam the agent's budget. */
  setRetained(type: string, data: unknown): void {
    if (!this.isReady || !this.client) return;
    const json = JSON.stringify(data);
    const prev = this.retained.get(type);
    const now = Date.now();
    if (prev && prev.json === json) return;
    if (prev && now - prev.at < RETAINED_MIN_INTERVAL_MS) return;
    this.retained.set(type, { json, at: now });
    void this.client.sendWorldState({ type, data, retained: true }).catch(() => {});
  }

  /** A discrete moment. `voiceRelevant` beats are spoken mid-call by the SDK. */
  emitMoment(
    type: string,
    data: unknown,
    opts: { salience?: number; voiceRelevant?: boolean } = {},
  ): void {
    if (!this.isReady || !this.client) return;
    void this.client
      .sendWorldState({
        type,
        data,
        retained: false,
        salience: opts.salience ?? 0.5,
        voiceRelevant: opts.voiceRelevant ?? false,
      })
      .catch(() => {});
  }

  // ── Chat + voice ────────────────────────────────────────────────────────────

  async sendText(text: string): Promise<void> {
    if (!this.isReady || !this.client) return;
    try {
      await this.client.sendText(text);
    } catch {
      /* surfaced via onError if persistent */
    }
  }

  get inCall(): boolean {
    return this.call != null;
  }

  /** Open the live voice co-pilot. EL Convai needs @elevenlabs/client (peer dep,
   *  resolved by the bundler); OpenAI Realtime needs nothing extra. */
  async startVoiceCopilot(onSpeakingChange?: (speaking: boolean) => void): Promise<boolean> {
    if (!this.isReady || !this.client || this.call) return false;
    try {
      this.call = await this.client.connectCall({
        locale: this.opts.locale,
        onSpeakingChange,
        onError: () => this.stopVoice(),
      });
      return true;
    } catch {
      return false;
    }
  }

  stopVoice(): void {
    try {
      this.call?.close();
    } catch {
      /* idempotent */
    }
    this.call = null;
  }

  // ── A2A (Phase 3) ─────────────────────────────────────────────────────────

  /** Ask the companion to invite the player's Pouchy friends to this world. The
   *  agent runs its own message_friends tool (sensitive → first-party confirm),
   *  so this is a text turn carrying the join link, not a direct send. */
  async inviteFriends(slug: string, worldName: string): Promise<void> {
    const link = worldJoinLink(slug);
    const en = `Please message my Pouchy friends inviting them to come fly with me right now in A2A.FUN. Tell them the world is "${worldName}" and to join here: ${link} (world code [a2a:${slug}]).`;
    const zh = `请给我的 Pouchy 好友发消息，邀请他们现在来 A2A.FUN 和我一起飞。告诉他们世界叫「${worldName}」，从这里加入：${link}（世界代码 [a2a:${slug}]）。`;
    await this.sendText(this.opts.locale === "zh" ? zh : en);
  }

  /** Share the "I saved the world" milestone to friends, with a join link. */
  async shareWorldSaved(slug: string, worldName: string): Promise<void> {
    const link = worldJoinLink(slug);
    const en = `Please tell my Pouchy friends I just saved the world "${worldName}" in A2A.FUN, and invite them to visit: ${link} (world code [a2a:${slug}]).`;
    const zh = `请告诉我的 Pouchy 好友，我刚在 A2A.FUN 拯救了世界「${worldName}」，并邀请他们来看看：${link}（世界代码 [a2a:${slug}]）。`;
    await this.sendText(this.opts.locale === "zh" ? zh : en);
  }

  // ── Pairing (Phase 4) ───────────────────────────────────────────────────────

  /** Pair a co-present visitor so the two companions become A2A friends. Runs a
   *  separate, short-lived REPRESENTATIVE session (needs `represent:pair` on this
   *  player's token and `social.message` on the visitor's). Returns the pairId,
   *  or null on failure. */
  async pairWithVisitor(
    visitorToken: string,
    visitorId: string,
    visitorName: string | undefined,
  ): Promise<string | null> {
    if (this.disabled) return null;
    let rep: CompanionClient | null = null;
    try {
      rep = createCompanion({
        baseUrl: POUCHY_BASE_URL,
        token: this.opts.token,
        surface: `${SURFACE}-pair`,
        appContext: this.opts.appContext,
        visitor: { id: visitorId, displayName: visitorName },
      });
      await rep.connect();
      const { pairId } = await rep.pairVisitor(visitorToken);
      return pairId;
    } catch {
      return null;
    } finally {
      try {
        rep?.stop();
      } catch {
        /* ignore */
      }
    }
  }

  // ── Teardown ────────────────────────────────────────────────────────────────

  /** Consolidate the run into the companion's long-term memory. Idempotent. */
  async endSession(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.endSession();
    } catch {
      /* best-effort */
    }
  }

  dispose(): void {
    this.stopVoice();
    for (const u of this.unsubs.splice(0)) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
    try {
      this.client?.stop();
    } catch {
      /* ignore */
    }
    this.client = null;
    this.ready = false;
    this.disabled = true;
    this.retained.clear();
  }
}
