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
  pouchyBrandIconUrl,
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
  /** A finalized utterance from a live voice call — BOTH the user's words and the
   *  companion's spoken replies — so the app can log the spoken conversation into
   *  the same transcript as text chat (and drive commands off user utterances). */
  onCallTranscript?: (role: "user" | "assistant", text: string) => void;
  /** The live voice call ended for good — a drop we couldn't transparently recover
   *  (NOT a user-initiated stopVoice) — so the UI can flip its voice button off. */
  onVoiceEnded?: () => void;
}

export type CompanionStatus =
  | { state: "connecting" }
  | { state: "ready"; scopes: string[] }
  | { state: "disabled"; reason: string };

const RETAINED_MIN_INTERVAL_MS = 1500;

export class CompanionManager {
  private client: CompanionClient | null = null;
  private call: CompanionCall | null = null;
  /** True while a voice call is being opened (connectCall is async) — closes the
   *  race where rapid taps would start several concurrent calls. */
  private connecting = false;
  /** Bumped on every start/stop so an in-flight connect can detect it's stale. */
  private callGen = 0;
  /** The user wants voice ON. Stays true across a transient drop (so the button
   *  stays lit while we transparently reconnect); cleared by stopVoice / give-up. */
  private wantVoice = false;
  /** A voice call's close() consolidates memory AND ends the whole Pouchy session
   *  server-side. Once that's happened, the next voice call (and any text turn)
   *  would fail on the dead session, so we rebuild the session first. */
  private sessionEnded = false;
  /** Consecutive transparent reconnect attempts since the last user-initiated
   *  start — bounded so repeated drops don't churn connect/disconnect endlessly. */
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** Remembered so a transparent reconnect re-wires the speaking indicator. */
  private speakingCb: ((speaking: boolean) => void) | undefined;
  private static readonly MAX_AUTO_RECONNECTS = 1;
  private static readonly RECONNECT_BACKOFF_MS = 900;
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
    return this.establish();
  }

  /** Create the SDK client, wire the streams, handshake, and open the reply
   *  stream. Shared by connect() and refreshSession() (rebuilding after a voice
   *  call ended the session). */
  private async establish(): Promise<boolean> {
    try {
      this.client = createCompanion({
        baseUrl: POUCHY_BASE_URL,
        token: this.opts.token,
        surface: SURFACE,
        modalities: ["text", "call"],
        contextKinds: [
          "game.world",
          "game.player.*",
          "game.quest.*",
          "game.event.*",
          "game.situation",
          "game.rendezvous",
          "game.phase",
          "game.coop",
        ],
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
      this.disabled = false;
      this.sessionEnded = false;
      this.opts.onStatus?.({ state: "ready", scopes: ack.grantedScopes });
      return true;
    } catch (e) {
      this.disable(e instanceof Error ? e.message : String(e));
      return false;
    }
  }

  /** Re-establish a fresh Pouchy session after a previous one was ended. A voice
   *  call's close() consolidates memory AND ends the whole session server-side
   *  (POST /session/{id}/end), so afterwards a new voice call — or any text turn —
   *  would fail on the dead session. We can't selectively keep the session alive
   *  through close() (the SDK couples them), so we rebuild the client cleanly. */
  private async refreshSession(): Promise<boolean> {
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
    this.retained.clear(); // force a full state re-sync onto the new session
    this.ready = false;
    return this.establish();
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

  /** Public, token-free Pouchy brand icon — safe to drop into an <img src>. */
  brandIconUrl(size: 256 | 512 | 1024 = 256): string {
    return pouchyBrandIconUrl(POUCHY_BASE_URL, size);
  }

  /** The connected companion's chosen display name (captured from getAvatar),
   *  or null. Used to label this player's "ghost" for other players later. */
  get companionDisplayName(): string | null {
    return this.companionName;
  }
  private companionName: string | null = null;

  /** The connected companion's 2D portrait URL, when one exists (null for the
   *  built-in models, which are VRM-only today). Used to swap the voice button's
   *  icon from the brand mark to the actual "virtual human". Also captures the
   *  companion's display name as a side effect. */
  async getAvatarImageUrl(): Promise<string | null> {
    if (!this.isReady || !this.client) return null;
    try {
      const avatar = await this.client.getAvatar();
      if (avatar.name) this.companionName = avatar.name;
      return avatar.imageUrl ?? null;
    } catch {
      return null;
    }
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

  /** True when a call is open, currently being opened, OR the user wants voice on
   *  (covering the brief gap of a transparent reconnect). Callers treat all of
   *  these as "busy" so they never start a second concurrent call. */
  get inCall(): boolean {
    return this.call != null || this.connecting || this.wantVoice;
  }

  /** Open the live voice co-pilot. EL Convai needs @elevenlabs/client (peer dep,
   *  resolved by the bundler); OpenAI Realtime needs nothing extra. Guarded so
   *  rapid taps / overlapping calls can't spawn multiple talking agents. */
  async startVoiceCopilot(onSpeakingChange?: (speaking: boolean) => void): Promise<boolean> {
    if (this.disabled || !this.client || this.call || this.connecting) return false;
    this.wantVoice = true;
    this.reconnectAttempts = 0;
    this.speakingCb = onSpeakingChange;
    this.clearReconnectTimer();
    // A prior voice call's close() ended the Pouchy session — rebuild before dialing.
    if (this.sessionEnded) {
      const ok = await this.refreshSession();
      if (!ok) {
        this.wantVoice = false;
        return false;
      }
    }
    return this.openCall();
  }

  /** Dial the live call on the current (alive) session. Shared by the user-start
   *  path and the transparent reconnect after a drop. */
  private async openCall(): Promise<boolean> {
    if (!this.client || this.call || this.connecting) return false;
    this.connecting = true;
    const gen = ++this.callGen;
    try {
      const call = await this.client.connectCall({
        locale: this.opts.locale,
        onSpeakingChange: this.speakingCb,
        onTranscript: (e) => {
          if (e.text) this.opts.onCallTranscript?.(e.role, e.text);
        },
        onError: () => this.onCallDropped(gen),
      });
      // If we were stopped (or restarted) while connecting, discard this call. Its
      // close() ends the session, so mark it for a rebuild on the next start.
      if (gen !== this.callGen) {
        try {
          call.close();
        } catch {
          /* ignore */
        }
        this.sessionEnded = true;
        return false;
      }
      this.call = call;
      return true;
    } catch {
      return false;
    } finally {
      if (gen === this.callGen) this.connecting = false;
    }
  }

  /** A live call dropped on its own (transport hiccup, EL onDisconnect, provider
   *  expiry). The provider already tore its own side down (mic released). Crucially
   *  we do NOT call the wrapped close() here — that would end the still-alive Pouchy
   *  session (killing text chat too and forcing a costly rebuild). We just drop our
   *  handle and, if the user still wants voice, transparently reconnect once. */
  private onCallDropped(gen: number): void {
    if (gen !== this.callGen) return; // superseded by a stop/restart
    this.call = null;
    this.connecting = false;
    if (!this.wantVoice) return;
    if (this.reconnectAttempts >= CompanionManager.MAX_AUTO_RECONNECTS) {
      // Repeated drops — stop churning (the user disliked connect/disconnect loops)
      // and let them re-tap intentionally.
      this.wantVoice = false;
      this.opts.onVoiceEnded?.();
      return;
    }
    this.reconnectAttempts++;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.wantVoice) return;
      void this.openCall().then((ok) => {
        if (!ok && this.wantVoice) {
          this.wantVoice = false;
          this.opts.onVoiceEnded?.();
        }
      });
    }, CompanionManager.RECONNECT_BACKOFF_MS);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** Push a line of live context into the active voice call WITHOUT making the
   *  companion speak (staged for its next turn) — used to keep the voice agent
   *  aware of the current game state, since retained world-state doesn't reach it. */
  injectCallContext(text: string): void {
    if (!this.call || !text) return;
    try {
      this.call.injectEvent(text, false);
    } catch {
      /* best-effort */
    }
  }

  /** User-initiated stop. Releases the mic + consolidates memory via the wrapped
   *  close() — which also ends the whole Pouchy session, so we flag a rebuild for
   *  the next start. */
  stopVoice(): void {
    this.wantVoice = false;
    this.clearReconnectTimer();
    this.callGen++; // invalidate any in-flight connect / pending drop handler
    this.connecting = false;
    if (this.call) {
      try {
        this.call.close();
      } catch {
        /* idempotent */
      }
      this.sessionEnded = true;
      this.call = null;
    }
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
