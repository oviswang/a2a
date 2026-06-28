/**
 * CompanionUI — the in-game surface for the Pouchy companion.
 *
 * Renders (all under the HUD root, with its own injected <style id="companion-styles">):
 *  - a companion toggle button + a voice button in the HUD top-right bar;
 *  - a chat panel (transcript + input) — a bottom sheet on mobile;
 *  - an "invite friends to this world" row (gated on the social.message scope);
 *  - inbound "sky letters" (A2A friend messages) with a Join action.
 *
 * It is purely presentational: it calls back out for every action and is told
 * what to show. All strings are localized via t(). No SDK or Three.js imports.
 */
import { t } from "../i18n";
import type { CompanionStatus } from "./CompanionManager";

export interface CompanionUIOptions {
  mobile: boolean;
  brandIconUrl?: string;
  onSendText: (text: string) => void;
  /** Toggle the voice co-pilot; UI reflects state via setVoiceActive(). */
  onToggleVoice: () => void;
  onInviteFriends: () => void;
  onJoinWorld: (slug: string) => void;
  /** Phase 4: pair companions with a co-present player. */
  onPairNearby: () => void;
}

export class CompanionUI {
  private readonly root: HTMLElement;
  private readonly opts: CompanionUIOptions;

  private sideStack!: HTMLElement;
  private toggleBtn!: HTMLButtonElement;
  private voiceBtn!: HTMLButtonElement;
  private voiceImg!: HTMLImageElement;
  private panel!: HTMLElement;
  private transcript!: HTMLElement;
  private input!: HTMLInputElement;
  private statusDot!: HTMLElement;
  private inviteRow!: HTMLElement;
  private inviteBtn!: HTMLButtonElement;
  private letterStack!: HTMLElement;

  private canInvite = false;
  private open = false;
  private disposed = false;

  constructor(hudRoot: HTMLElement, opts: CompanionUIOptions) {
    this.root = hudRoot;
    this.opts = opts;
    this.injectStyles();
    this.build();
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  private build() {
    // A vertical stack of companion buttons that sits below the top-right bar
    // (mute/fullscreen) rather than crowding into it.
    this.sideStack = document.createElement("div");
    this.sideStack.className = "cmp-side-stack";

    this.toggleBtn = document.createElement("button");
    this.toggleBtn.type = "button";
    this.toggleBtn.className = "hud-mute-btn cmp-toggle-btn";
    this.toggleBtn.setAttribute("aria-label", t("Companion", "AI 伙伴"));
    this.toggleBtn.innerHTML = `<svg class="cmp-toggle-glyph" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span class="cmp-status-dot" data-state="off"></span>`;
    this.statusDot = this.toggleBtn.querySelector(".cmp-status-dot")!;
    this.toggleBtn.addEventListener("click", () => this.togglePanel());

    this.voiceBtn = document.createElement("button");
    this.voiceBtn.type = "button";
    this.voiceBtn.className = "hud-mute-btn cmp-voice-btn";
    this.voiceBtn.setAttribute("aria-label", t("Voice co-pilot", "语音陪飞"));
    this.voiceImg = document.createElement("img");
    this.voiceImg.className = "cmp-voice-img";
    this.voiceImg.alt = "Pouchy";
    if (this.opts.brandIconUrl) {
      this.voiceImg.src = this.opts.brandIconUrl;
      // If the avatar ever fails to load, fall back to the brand mark.
      this.voiceImg.addEventListener("error", () => {
        if (this.opts.brandIconUrl && this.voiceImg.src !== this.opts.brandIconUrl) {
          this.voiceImg.src = this.opts.brandIconUrl;
        }
      });
    }
    this.voiceBtn.appendChild(this.voiceImg);
    this.voiceBtn.style.display = "none";
    this.voiceBtn.addEventListener("click", () => this.opts.onToggleVoice());

    this.sideStack.appendChild(this.toggleBtn);
    this.sideStack.appendChild(this.voiceBtn);
    this.root.appendChild(this.sideStack);

    // Chat panel.
    this.panel = document.createElement("div");
    this.panel.className = `cmp-panel${this.opts.mobile ? " cmp-panel--mobile" : ""}`;
    this.panel.style.display = "none";
    this.panel.innerHTML = `
      <div class="cmp-panel-head">
        <span class="cmp-panel-title">${t("Your companion", "你的 AI 伙伴")}</span>
        <button type="button" class="cmp-panel-close" aria-label="${t("Close", "关闭")}">✕</button>
      </div>
      <div class="cmp-invite-row" style="display:none">
        <span class="cmp-invite-text"></span>
        <button type="button" class="cmp-invite-btn"></button>
        <button type="button" class="cmp-pair-btn"></button>
      </div>
      <div class="cmp-transcript" aria-live="polite"></div>
      <form class="cmp-input-row">
        <input class="cmp-input" type="text" autocomplete="off"
          placeholder="${t("Say something to your companion…", "和你的伙伴说点什么…")}" />
        <button type="submit" class="cmp-send-btn" aria-label="${t("Send", "发送")}">➤</button>
      </form>
    `;
    this.transcript = this.panel.querySelector(".cmp-transcript")!;
    this.input = this.panel.querySelector(".cmp-input")!;
    this.inviteRow = this.panel.querySelector(".cmp-invite-row")!;
    this.inviteBtn = this.panel.querySelector(".cmp-invite-btn")!;
    this.inviteBtn.textContent = t("Invite friends", "邀请好友");
    const pairBtn = this.panel.querySelector(".cmp-pair-btn") as HTMLButtonElement;
    pairBtn.textContent = t("Pair nearby", "与附近玩家配对");
    this.panel.querySelector(".cmp-panel-close")!.addEventListener("click", () => this.togglePanel(false));
    this.inviteBtn.addEventListener("click", () => this.opts.onInviteFriends());
    pairBtn.addEventListener("click", () => this.opts.onPairNearby());
    this.panel.querySelector(".cmp-input-row")!.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) return;
      this.input.value = "";
      this.appendUserMessage(text);
      this.opts.onSendText(text);
    });
    this.root.appendChild(this.panel);

    // Sky-letter stack (always mounted; independent of the panel).
    this.letterStack = document.createElement("div");
    this.letterStack.className = "cmp-letter-stack";
    this.root.appendChild(this.letterStack);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  togglePanel(open?: boolean) {
    this.open = open ?? !this.open;
    this.panel.style.display = this.open ? "flex" : "none";
    this.toggleBtn.classList.toggle("cmp-active", this.open);
    if (this.open) setTimeout(() => this.input.focus(), 30);
  }

  setStatus(status: CompanionStatus) {
    const state = status.state === "ready" ? "on" : status.state === "connecting" ? "connecting" : "off";
    this.statusDot.dataset.state = state;
    const ready = status.state === "ready";
    // Voice button appears once connected (call scope is in the default bundle).
    this.voiceBtn.style.display = ready ? "flex" : "none";
    if (status.state === "disabled") {
      this.appendSystemMessage(
        t("Companion couldn't connect. Check your token.", "伙伴连接失败，请检查你的令牌。"),
      );
    }
  }

  /** Swap the voice button's icon to the connected companion's portrait when one
   *  is available; otherwise it keeps showing the Pouchy brand mark. */
  setCompanionAvatar(url: string | null) {
    if (url) this.voiceImg.src = url;
    else if (this.opts.brandIconUrl) this.voiceImg.src = this.opts.brandIconUrl;
  }

  setVoiceActive(active: boolean) {
    this.voiceBtn.classList.toggle("cmp-active", active);
    this.voiceBtn.setAttribute(
      "aria-label",
      active ? t("Stop voice", "结束语音") : t("Voice co-pilot", "语音陪飞"),
    );
  }

  /** Show the invite control once the world is known and the scope is present. */
  setWorldInvite(slug: string, worldName: string, canInvite: boolean) {
    this.canInvite = canInvite;
    if (!canInvite) {
      this.inviteRow.style.display = "none";
      return;
    }
    this.inviteRow.style.display = "flex";
    (this.inviteRow.querySelector(".cmp-invite-text") as HTMLElement).textContent = t(
      `World code: ${slug}`,
      `世界代码：${slug}`,
    );
    void worldName;
  }

  appendAssistantMessage(text: string) {
    this.appendRow("assistant", text);
  }
  appendUserMessage(text: string) {
    this.appendRow("user", text);
  }
  private appendSystemMessage(text: string) {
    this.appendRow("system", text);
  }

  private appendRow(kind: "assistant" | "user" | "system", text: string) {
    if (this.disposed) return;
    const row = document.createElement("div");
    row.className = `cmp-msg cmp-msg--${kind}`;
    row.textContent = text;
    this.transcript.appendChild(row);
    this.transcript.scrollTop = this.transcript.scrollHeight;
    // Keep the transcript bounded.
    while (this.transcript.childElementCount > 60) this.transcript.firstElementChild?.remove();
  }

  /** Render an inbound A2A friend message as a cozy "sky letter". */
  showSkyLetter(fromName: string, content: string, joinSlug: string | null) {
    if (this.disposed) return;
    const letter = document.createElement("div");
    letter.className = "cmp-letter";
    const head = document.createElement("div");
    head.className = "cmp-letter-head";
    head.textContent = t(`✉ Sky letter from ${fromName}`, `✉ 来自 ${fromName} 的空中来信`);
    const body = document.createElement("div");
    body.className = "cmp-letter-body";
    body.textContent = content;
    letter.appendChild(head);
    letter.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "cmp-letter-actions";
    if (joinSlug) {
      const join = document.createElement("button");
      join.type = "button";
      join.className = "cmp-letter-join";
      join.textContent = t("Join their world", "加入他们的世界");
      join.addEventListener("click", () => {
        this.opts.onJoinWorld(joinSlug);
        letter.remove();
      });
      actions.appendChild(join);
    }
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "cmp-letter-dismiss";
    dismiss.textContent = t("Dismiss", "忽略");
    dismiss.addEventListener("click", () => letter.remove());
    actions.appendChild(dismiss);
    letter.appendChild(actions);

    this.letterStack.appendChild(letter);
    requestAnimationFrame(() => letter.classList.add("cmp-letter--in"));
    // Auto-dismiss after a while if untouched.
    setTimeout(() => letter.remove(), 30000);
  }

  dispose() {
    this.disposed = true;
    this.sideStack?.remove();
    this.toggleBtn?.remove();
    this.voiceBtn?.remove();
    this.panel?.remove();
    this.letterStack?.remove();
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  private injectStyles() {
    if (document.getElementById("companion-styles")) return;
    const s = document.createElement("style");
    s.id = "companion-styles";
    s.textContent = `
      .cmp-side-stack {
        position: absolute;
        top: max(72px, calc(64px + env(safe-area-inset-top)));
        right: 36px;
        display: flex; flex-direction: column; align-items: center; gap: 8px;
        z-index: 2; pointer-events: auto;
      }
      .cmp-toggle-btn, .cmp-voice-btn { position: relative; }
      .cmp-toggle-glyph { display: block; }
      .cmp-voice-img {
        width: 22px; height: 22px; border-radius: 50%; object-fit: cover;
        display: block; pointer-events: none;
      }
      .cmp-status-dot {
        position: absolute; top: 5px; right: 5px; width: 7px; height: 7px;
        border-radius: 50%; background: rgba(255,255,255,0.25);
      }
      .cmp-status-dot[data-state="on"] { background: #5ad17a; box-shadow: 0 0 6px #5ad17a; }
      .cmp-status-dot[data-state="connecting"] { background: #e6c34a; }
      .hud-mute-btn.cmp-active { background: rgba(120,180,255,0.28); color: #fff; }

      .cmp-panel {
        position: absolute; top: 80px; right: max(12px, env(safe-area-inset-right));
        width: 320px; max-width: calc(100vw - 24px); max-height: 60vh;
        display: flex; flex-direction: column; gap: 8px;
        background: rgba(16, 22, 36, 0.93); backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.14); border-radius: 16px;
        padding: 12px; z-index: 12; pointer-events: auto;
        font-family: 'Domine', Georgia, serif; color: rgba(255,255,255,0.94);
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      }
      .cmp-panel--mobile {
        top: auto; left: auto;
        right: max(8px, env(safe-area-inset-right));
        width: min(340px, 88vw); max-width: 88vw;
        bottom: max(300px, calc(290px + env(safe-area-inset-bottom)));
        max-height: 42vh; border-radius: 16px;
      }
      .cmp-panel-head { display: flex; align-items: center; justify-content: space-between; }
      .cmp-panel-title { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.04em; }
      .cmp-panel-close {
        background: none; border: none; color: rgba(255,255,255,0.6);
        font-size: 0.9rem; cursor: pointer; padding: 4px;
      }
      .cmp-invite-row {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        background: rgba(255,255,255,0.06); border-radius: 10px; padding: 7px 10px;
      }
      .cmp-invite-text { font-size: 0.74rem; color: rgba(255,255,255,0.78); }
      .cmp-invite-btn, .cmp-pair-btn {
        background: rgba(120,180,255,0.22); color: #fff; border: none; border-radius: 8px;
        padding: 6px 12px; font-size: 0.72rem; font-weight: 600; cursor: pointer; white-space: nowrap;
      }
      .cmp-pair-btn { background: rgba(180,140,255,0.24); }
      .cmp-transcript {
        flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;
        font-size: 0.82rem; line-height: 1.4; min-height: 80px;
      }
      .cmp-msg { padding: 7px 11px; border-radius: 12px; max-width: 85%; word-break: break-word; }
      .cmp-msg--assistant { background: rgba(255,255,255,0.10); align-self: flex-start; border-bottom-left-radius: 4px; }
      .cmp-msg--user { background: rgba(120,180,255,0.22); align-self: flex-end; border-bottom-right-radius: 4px; }
      .cmp-msg--system { background: rgba(230,120,120,0.16); align-self: center; font-size: 0.74rem; opacity: 0.85; }
      .cmp-input-row { display: flex; gap: 6px; }
      .cmp-input {
        flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10);
        border-radius: 10px; padding: 9px 12px; color: #fff; font: inherit; font-size: 0.82rem; outline: none;
      }
      .cmp-send-btn {
        background: rgba(120,180,255,0.3); color: #fff; border: none; border-radius: 10px;
        width: 40px; cursor: pointer; font-size: 0.9rem;
      }

      .cmp-letter-stack {
        position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
        display: flex; flex-direction: column; gap: 8px; z-index: 13;
        width: min(360px, 88vw); pointer-events: none;
      }
      .cmp-letter {
        pointer-events: auto; background: rgba(28, 22, 44, 0.82); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 12px 14px;
        font-family: 'Domine', Georgia, serif; color: rgba(255,255,255,0.92);
        opacity: 0; transform: translateY(-8px); transition: opacity 0.35s ease, transform 0.35s ease;
        box-shadow: 0 8px 28px rgba(0,0,0,0.4);
      }
      .cmp-letter--in { opacity: 1; transform: translateY(0); }
      .cmp-letter-head { font-size: 0.74rem; font-weight: 700; color: rgba(255,255,255,0.7); margin-bottom: 5px; }
      .cmp-letter-body { font-size: 0.86rem; line-height: 1.4; margin-bottom: 10px; }
      .cmp-letter-actions { display: flex; gap: 8px; justify-content: flex-end; }
      .cmp-letter-join {
        background: rgba(120,180,255,0.3); color: #fff; border: none; border-radius: 8px;
        padding: 7px 14px; font-size: 0.76rem; font-weight: 600; cursor: pointer;
      }
      .cmp-letter-dismiss {
        background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); border: none; border-radius: 8px;
        padding: 7px 12px; font-size: 0.76rem; cursor: pointer;
      }
    `;
    document.head.appendChild(s);
  }
}
