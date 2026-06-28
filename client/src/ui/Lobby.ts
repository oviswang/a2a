import type { Vehicle } from "@globefly/shared";
import { ProgressionManager } from "../game/ProgressionManager";
import {
  BOAT_HULL_PALETTE,
  CARPET_HULL_PALETTE,
  PLANE_HULL_PALETTE,
} from "../game/vehicleColors";
import { EpilogueStatuePreview } from "./EpilogueStatuePreview";
import { VehicleUnlockPreview } from "./VehicleUnlockPreview";
import { t, IS_ZH } from "../i18n";

const VEHICLE_ORDER: Vehicle[] = ["plane", "carpet", "boat"];

const LOCK_ICON_SRC = "/2D/icon_lock.svg";

const SHORT_LABELS: Record<Vehicle, string> = {
  plane: t("Biplane", "双翼机"),
  boat: t("Boat", "小船"),
  carpet: t("Carpet", "飞毯"),
};

/** Vehicle silhouettes from `client/public/2D/` (black art → inverted to match lobby `currentColor`). */
const VEHICLE_ICON_SRC: Record<Vehicle, string> = {
  plane: "/2D/icon_biplane.svg",
  carpet: "/2D/icon_carpet.svg",
  boat: "/2D/icon_boat.svg",
};

const LOBBY_DISPLAY_TITLE = "Tiny Skies";

const VIBEJAM_PORTAL_BASE = "https://vibejam.cc/portal/2026";
/** Rough cruise speed (m/s) for webring query continuity. */
const VIBEJAM_PORTAL_SPEED = "1.6";
const PORTAL_ICON_SRC = "/2D/icon_portal.svg";

/** Last per-letter animation index (non-space chars); drives tagline entrance delay. */
const LOBBY_TITLE_LAST_CHAR_I = Math.max(
  0,
  [...LOBBY_DISPLAY_TITLE].filter((ch) => ch !== " ").length - 1,
);

/** Per-letter spans for staggered entrance; `aria-label` on h1 carries the accessible name. */
function lobbyTitleLettersHtml(): string {
  let letterIndex = 0;
  return [...LOBBY_DISPLAY_TITLE]
    .map((ch) => {
      if (ch === " ") {
        return '<span class="lobby-title__space" aria-hidden="true"> </span>';
      }
      const i = letterIndex++;
      return `<span class="lobby-title__char" style="--title-char-i:${i}" aria-hidden="true">${ch}</span>`;
    })
    .join("");
}

/* ── Whimsical Name Generator ──────────────────────────────────────── */

const ADJECTIVES = [
  "Brave", "Swift", "Jolly", "Clever", "Gentle", "Daring", "Merry", "Noble",
  "Plucky", "Cozy", "Nimble", "Trusty", "Lucky", "Mighty", "Wee", "Rosy",
  "Bold", "Kind", "Keen", "Bonny", "Spry", "Peppy", "Stout", "Grand",
  "True", "Fair", "Brisk", "Warm", "Calm", "Zesty",
];
const NOUNS = [
  "Biscuit", "Sparrow", "Pebble", "Maple", "Compass", "Lantern", "Whistle",
  "Clover", "Bramble", "Feather", "Acorn", "Teacup", "Ginger", "Cobble",
  "Turnip", "Cricket", "Walnut", "Thistle", "Nutmeg", "Pudding", "Mittens",
  "Pickle", "Crumpet", "Muffin", "Starling", "Wren", "Juniper", "Ember",
  "Marble", "Truffle",
];

/** Chinese (cozy) counterparts, used when the browser language is Chinese. */
const ZH_ADJECTIVES = [
  "勇敢", "迅捷", "快乐", "机灵", "温柔", "大胆", "欢乐", "高贵",
  "活泼", "暖心", "灵巧", "可靠", "幸运", "强壮", "小小", "红润",
  "果敢", "善良", "敏锐", "俊俏", "轻快", "元气", "结实", "宏大",
  "真诚", "公正", "利落", "温暖", "沉静", "鲜活",
];
const ZH_NOUNS = [
  "饼干", "麻雀", "鹅卵石", "枫叶", "罗盘", "灯笼", "口哨",
  "三叶草", "荆棘", "羽毛", "橡果", "茶杯", "生姜", "石子",
  "萝卜", "蟋蟀", "核桃", "蓟花", "豆蔻", "布丁", "手套",
  "腌瓜", "司康", "松饼", "椋鸟", "鹪鹩", "杜松", "余烬",
  "弹珠", "松露",
];

export function generateWhimsicalName(): string {
  if (IS_ZH) {
    const adj = ZH_ADJECTIVES[Math.floor(Math.random() * ZH_ADJECTIVES.length)];
    const noun = ZH_NOUNS[Math.floor(Math.random() * ZH_NOUNS.length)];
    // Chinese nicknames read better with no separating space.
    return `${adj}${noun}`;
  }
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

/* ── Lobby ─────────────────────────────────────────────────────────── */

export interface PlayOptions {
  startAtCampsite?: boolean;
  /** Moon approach frozen for this run (lobby toggle; requires unlock). */
  freeplay?: boolean;
}

interface LobbyOptions {
  /** API base (e.g. `http://localhost:3001`) for the save feed. */
  serverUrl: string;
  playerName: string;
  mobile?: boolean;
  /** When true, unlock celebration modals wait for {@link Lobby.revealDeferredUnlockModals} (after menu transition fades). */
  deferUnlockModalsUntilMenuReveal?: boolean;
  onPlay: (vehicle: Vehicle, options?: PlayOptions) => void;
  onNameChange?: (name: string) => void;
  /** Current Pouchy companion token (masked in the UI), or null if not connected. */
  companionToken?: string | null;
  /** Player pasted / cleared their Pouchy companion token (opt-in AI co-pilot). */
  onCompanionTokenChange?: (token: string | null) => void;
  /** Whether to auto-connect voice when the game starts. */
  companionAutoVoice?: boolean;
  onCompanionAutoVoiceChange?: (on: boolean) => void;
}

export class Lobby {
  /** Auto-open the companion connect modal only once per page load. */
  private static companionModalAutoShown = false;
  private container: HTMLElement;
  private el: HTMLDivElement;
  private options: LobbyOptions;
  private selectedVehicle: Vehicle = "plane";
  private unlockQueue: ("worldSaved" | "carpet" | "boat" | "freeplay")[] = [];
  private unlockModalsDeferred = false;
  private flushUnlockModals: (() => void) | null = null;
  private unlockPreview: VehicleUnlockPreview | null = null;
  private epilogueStatuePreview: EpilogueStatuePreview | null = null;

  constructor(container: HTMLElement, options: LobbyOptions) {
    this.container = container;
    this.options = options;
    this.el = document.createElement("div");
    this.el.id = "lobby";
    if (options.mobile) this.el.classList.add("lobby--mobile");
    this.buildUI();
  }

  private static requestFullscreen(): void {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const req =
      el.requestFullscreen?.bind(el) ??
      el.webkitRequestFullscreen?.bind(el);
    if (req) void Promise.resolve(req()).catch(() => {});
  }

  private levelLine(level: number | null): string {
    const n = Math.max(1, level ?? 1);
    return t(`Level ${n}`, `等级 ${n}`);
  }

  private vehicleColorHexForSelectedVehicle(): string {
    const v = this.selectedVehicle;
    const saved = ProgressionManager.loadVehicle(v)?.vehicleColor;
    if (saved != null) {
      return `#${saved.toString(16).padStart(6, "0")}`;
    }
    const pal =
      v === "boat" ? BOAT_HULL_PALETTE : v === "carpet" ? CARPET_HULL_PALETTE : PLANE_HULL_PALETTE;
    return `#${pal[0]!.toString(16).padStart(6, "0")}`;
  }

  private vibejamPortalHref(): string {
    const params = new URLSearchParams();
    const name = this.options.playerName.trim();
    if (name.length > 0) params.set("username", name);
    params.set("color", this.vehicleColorHexForSelectedVehicle());
    params.set("speed", VIBEJAM_PORTAL_SPEED);
    try {
      params.set("ref", window.location.href.split("#")[0] ?? "");
    } catch {
      /* ignore */
    }
    const q = params.toString();
    return q.length > 0 ? `${VIBEJAM_PORTAL_BASE}?${q}` : VIBEJAM_PORTAL_BASE;
  }

  private updateVibejamPortalLink(): void {
    const a = this.el.querySelector(".lobby-vibejam-portal") as HTMLAnchorElement | null;
    if (a) a.href = this.vibejamPortalHref();
  }

  private buildVehicleButtonsHTML(): string {
    return VEHICLE_ORDER.map((v) => {
      const unlocked = ProgressionManager.isVehicleUnlocked(v);
      const level = ProgressionManager.savedLevelOrNull(v);
      const isSel = unlocked && v === this.selectedVehicle;
      const cls = `lobby-vbtn${isSel && unlocked ? " active" : ""}${unlocked ? "" : " locked"}`;
      if (!unlocked) {
        return `
        <button type="button" class="${cls}"
          data-vehicle="${v}"
          tabindex="-1"
          role="radio"
          aria-checked="false"
          aria-disabled="true"
          aria-label="${t("Locked vehicle", "未解锁的载具")}">
          <span class="lobby-vicon lobby-vicon--lock" aria-hidden="true"><img class="lobby-vicon-asset lobby-vicon-asset--lock" src="${LOCK_ICON_SRC}" alt="" width="28" height="28" decoding="async" /></span>
        </button>`;
      }
      return `
        <button type="button" class="${cls}"
          data-vehicle="${v}"
          role="radio"
          aria-checked="${isSel ? "true" : "false"}"
          aria-disabled="false">
          <span class="lobby-vicon" aria-hidden="true"><img class="lobby-vicon-asset" src="${VEHICLE_ICON_SRC[v]}" alt="" width="24" height="24" decoding="async" /></span>
          <span class="lobby-vlabel">${SHORT_LABELS[v]}</span>
          <span class="lobby-vmeta">${this.levelLine(level)}</span>
        </button>`;
    }).join("");
  }

  private buildUI() {
    this.el.innerHTML = `
      <div class="lobby-overlay">
        <div class="lobby-header">
          <div class="lobby-title-block" style="--title-last-char-i:${LOBBY_TITLE_LAST_CHAR_I}">
            <p class="lobby-tagline">${t("A Cosy Exploration Game", "一款惬意的探索游戏")}</p>
            <h1 class="lobby-title" aria-label="${LOBBY_DISPLAY_TITLE}">${lobbyTitleLettersHtml()}</h1>
          </div>
          <div class="lobby-username">
            <div class="lobby-greeting-row">
              <span class="lobby-greeting-hi">${t("Hello, ", "你好，")}</span>
              <span class="lobby-name-wrap">
                <span class="lobby-name" contenteditable="true" spellcheck="false">${this.options.playerName}</span>
                <button type="button" class="lobby-edit-btn" aria-label="${t("Edit name", "编辑名字")}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
              </span>
            </div>
            <div class="lobby-companion-row">
              <button type="button" class="lobby-companion-btn" id="lobby-companion-btn"></button>
              <a class="lobby-companion-help" href="https://www.pouchy.ai/sdk" target="_blank" rel="noopener noreferrer">${t("What's this?", "这是什么？")}</a>
            </div>
          </div>
          <div class="lobby-bar">
            <div class="lobby-vehicles" role="radiogroup" aria-label="${t("Vehicle", "载具")}">
              ${this.buildVehicleButtonsHTML()}
            </div>
            <button type="button" class="lobby-fly" id="btn-fly"><span class="lobby-fly__label">${t("GO!", "出发！")}</span></button>
          </div>
          <div class="lobby-freeplay-wrap" id="lobby-freeplay-wrap" hidden>
            <label class="lobby-freeplay-label">
              <input type="checkbox" id="lobby-freeplay-cb" />
              <span class="lobby-freeplay-text">${t("Freeplay mode — The moon will not fall on this run.", "自由模式——本局月亮不会坠落。")}</span>
            </label>
          </div>
          <div class="lobby-save-feed" id="lobby-save-feed" hidden>
            <div class="lobby-save-feed-head" aria-hidden="true">
              <span class="lobby-save-feed-deco"></span>
              <svg class="lobby-save-feed-crown" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M3 20h18v-2H3v2zm0-3V9.5L6 6l2.2 2.1L12 2l3.8 6.1L18 6l3 3.5V17H3z"/>
              </svg>
              <span class="lobby-save-feed-deco"></span>
            </div>
            <ul class="lobby-save-feed-list" aria-label="${t("Recent world saves", "最近的拯救世界记录")}"></ul>
            <p class="lobby-save-feed-empty" hidden aria-live="polite">${t("No one has saved the world yet.", "还没有人拯救过世界。")}</p>
          </div>
        </div>
        <div class="lobby-unlock-modal" id="lobby-unlock-modal" aria-hidden="true">
          <div class="lobby-unlock-backdrop"></div>
          <div class="lobby-unlock-panel" role="dialog" aria-modal="true" aria-labelledby="lobby-unlock-title">
            <div class="lobby-unlock-preview-canvas" id="lobby-unlock-preview" aria-hidden="true"></div>
            <div class="lobby-unlock-preview-canvas lobby-unlock-preview-canvas--statue" id="lobby-unlock-preview-statue" aria-hidden="true"></div>
            <h2 class="lobby-unlock-title" id="lobby-unlock-title"></h2>
            <p class="lobby-unlock-body"></p>
            <button type="button" class="lobby-unlock-ok" id="btn-unlock-ok">${t("Got it", "知道了")}</button>
          </div>
        </div>
        <div class="lobby-companion-modal" id="lobby-companion-modal" aria-hidden="true">
          <div class="lobby-companion-backdrop" id="lobby-companion-backdrop"></div>
          <div class="lobby-companion-panel" role="dialog" aria-modal="true" aria-labelledby="lobby-companion-modal-title">
            <h2 class="lobby-companion-modal-title" id="lobby-companion-modal-title">${t("AI co-pilot · Pouchy companion", "AI 陪玩 · Pouchy 伴侣")}</h2>
            <p class="lobby-companion-status" id="lobby-companion-status"></p>
            <label class="lobby-companion-field-label">${t("Companion access key (pchy_…)", "伴侣接入令牌（pchy_…）")}</label>
            <input class="lobby-companion-input" id="lobby-companion-input" type="text" autocomplete="off" spellcheck="false"
              placeholder="${t("Paste your pchy_… key", "粘贴 pchy_… 令牌")}" />
            <details class="lobby-companion-help-box" open>
              <summary>${t("How do I get a key?", "如何获取令牌？")}</summary>
              <ol class="lobby-companion-steps">
                <li>${t("Open <strong>Pouchy</strong> (pouchy.ai or the app) and tap the <strong>Wallet</strong> (top-right, the one showing your balance).", "打开 <strong>Pouchy</strong>（pouchy.ai 或 App），点右上角的<strong>钱包</strong>（显示余额的那个）。")}</li>
                <li>${t("On the wallet page, scroll down to <strong>Companion access keys</strong>.", "在「钱包余额」页向下滚动，找到<strong>「伴侣接入密钥」</strong>。")}</li>
                <li>${t("(Optional) name the key, e.g. \"A2A.FUN\".", "（可选）填个密钥名称，比如「A2A.FUN」。")}</li>
                <li>${t("Leave <strong>Allow execution</strong> OFF for basic co-pilot. Turn it ON only for A2A social (inviting friends / pairing).", "基础陪玩<strong>保持「允许执行」关闭</strong>。只有要用 A2A 社交（邀请好友 / 配对）时才打开。")}</li>
                <li>${t("Tap <strong>Generate</strong>. The pchy_… key is shown <strong>once</strong> — copy it immediately.", "点<strong>「生成密钥」</strong>。令牌 pchy_… <strong>只显示一次</strong>，请立刻复制。")}</li>
                <li>${t("Come back here, paste it, and tap Save.", "回到这里粘贴，点「保存并绑定」。")}</li>
              </ol>
            </details>
            <p class="lobby-companion-note">${t("The key is stored only on this device (localStorage) and only connects your own Pouchy companion. Voice usage is billed to your Pouchy account.", "令牌只存在你本机（localStorage），只用于连接你自己的 Pouchy 伴侣。语音费用记在你的 Pouchy 账户上。")}</p>
            <label class="lobby-companion-autovoice"><input type="checkbox" id="lobby-companion-autovoice-cb" /> <span>${t("Auto-connect voice when the game starts", "游戏开始时自动接通语音")}</span></label>
            <div class="lobby-companion-actions">
              <button type="button" class="lobby-companion-save" id="lobby-companion-save">${t("Save & connect", "保存并绑定")}</button>
              <button type="button" class="lobby-companion-later" id="lobby-companion-later">${t("Later", "稍后")}</button>
            </div>
            <button type="button" class="lobby-companion-disconnect" id="lobby-companion-disconnect">${t("Disconnect", "断开连接")}</button>
          </div>
        </div>
        <p class="lobby-attribution">${t(
          `Built with <strong class="lobby-attribution__brand">Cursor</strong>, Music by <strong class="lobby-attribution__brand">Suno</strong>, SFX by <strong class="lobby-attribution__brand">ElevenLabs</strong>, 3D Assets by <strong class="lobby-attribution__brand">Tripo3D</strong>`,
          `使用 <strong class="lobby-attribution__brand">Cursor</strong> 构建，音乐 <strong class="lobby-attribution__brand">Suno</strong>，音效 <strong class="lobby-attribution__brand">ElevenLabs</strong>，3D 素材 <strong class="lobby-attribution__brand">Tripo3D</strong>`,
        )}</p>
      </div>
    `;

    const nameEl = this.el.querySelector(".lobby-name") as HTMLElement;
    const editBtn = this.el.querySelector(".lobby-edit-btn") as HTMLElement;
    const mobile = this.options.mobile ?? false;

    if (mobile) {
      nameEl.setAttribute("contenteditable", "false");
      nameEl.style.cursor = "pointer";

      const promptName = () => {
        const result = window.prompt(t("Enter your name", "输入你的名字"), this.options.playerName);
        if (result !== null && result.trim().length > 0) {
          this.options.playerName = result.trim();
          nameEl.textContent = result.trim();
          this.options.onNameChange?.(this.options.playerName);
          this.updateVibejamPortalLink();
        }
      };
      editBtn.addEventListener("click", promptName);
      nameEl.addEventListener("click", promptName);
    } else {
      editBtn.addEventListener("click", () => {
        nameEl.focus();
        const range = document.createRange();
        range.selectNodeContents(nameEl);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });

      nameEl.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          nameEl.blur();
        }
      });

      nameEl.addEventListener("blur", () => {
        const trimmed = nameEl.textContent?.trim() || "";
        if (trimmed.length === 0) {
          nameEl.textContent = this.options.playerName;
        } else {
          this.options.playerName = trimmed;
          nameEl.textContent = trimmed;
        }
        this.options.onNameChange?.(this.options.playerName);
        this.updateVibejamPortalLink();
      });
    }

    // ── Pouchy companion token (opt-in AI co-pilot) ──
    const companionBtn = this.el.querySelector("#lobby-companion-btn") as HTMLButtonElement;
    const refreshCompanionBtn = () => {
      const tok = this.options.companionToken ?? null;
      if (tok) {
        companionBtn.textContent = t(
          `🤖 Companion connected (pchy_••${tok.slice(-4)})`,
          `🤖 AI 伙伴已连接（pchy_••${tok.slice(-4)}）`,
        );
        companionBtn.classList.add("connected");
      } else {
        companionBtn.textContent = t("🤖 Connect your Pouchy companion", "🤖 连接你的 Pouchy AI 伙伴");
        companionBtn.classList.remove("connected");
      }
    };
    refreshCompanionBtn();

    // ── Companion connect modal ──
    const cmpModal = this.el.querySelector("#lobby-companion-modal") as HTMLElement;
    const cmpInput = this.el.querySelector("#lobby-companion-input") as HTMLInputElement;
    const cmpStatus = this.el.querySelector("#lobby-companion-status") as HTMLElement;
    const cmpAutoVoice = this.el.querySelector("#lobby-companion-autovoice-cb") as HTMLInputElement;
    const cmpDisconnect = this.el.querySelector("#lobby-companion-disconnect") as HTMLButtonElement;
    const refreshModalState = () => {
      const tok = this.options.companionToken ?? null;
      cmpStatus.textContent = tok
        ? t(`Connected (pchy_••${tok.slice(-4)}). Paste a new key to replace it.`, `已连接（pchy_••${tok.slice(-4)}）。粘贴新令牌可替换。`)
        : t("Not connected. Paste a key and save to enable your AI co-pilot.", "未绑定。粘贴令牌并保存即可开启 AI 陪玩。");
      cmpInput.value = "";
      cmpAutoVoice.checked = this.options.companionAutoVoice ?? false;
      cmpDisconnect.style.display = tok ? "block" : "none";
    };
    const openCmpModal = () => {
      refreshModalState();
      cmpModal.classList.add("open");
      cmpModal.setAttribute("aria-hidden", "false");
      setTimeout(() => cmpInput.focus(), 40);
    };
    const closeCmpModal = () => {
      cmpModal.classList.remove("open");
      cmpModal.setAttribute("aria-hidden", "true");
    };
    companionBtn.addEventListener("click", openCmpModal);
    this.el.querySelector("#lobby-companion-later")!.addEventListener("click", closeCmpModal);
    this.el.querySelector("#lobby-companion-backdrop")!.addEventListener("click", closeCmpModal);
    cmpAutoVoice.addEventListener("change", () => {
      this.options.companionAutoVoice = cmpAutoVoice.checked;
      this.options.onCompanionAutoVoiceChange?.(cmpAutoVoice.checked);
    });
    cmpDisconnect.addEventListener("click", () => {
      this.options.companionToken = null;
      this.options.onCompanionTokenChange?.(null);
      refreshCompanionBtn();
      refreshModalState();
    });
    this.el.querySelector("#lobby-companion-save")!.addEventListener("click", () => {
      const trimmed = cmpInput.value.trim();
      if (!trimmed) { closeCmpModal(); return; }
      if (!trimmed.startsWith("pchy_")) {
        cmpStatus.textContent = t("That doesn't look like a pchy_ key.", "这看起来不是 pchy_ 令牌。");
        return;
      }
      this.options.companionToken = trimmed;
      this.options.onCompanionTokenChange?.(trimmed);
      refreshCompanionBtn();
      closeCmpModal();
    });

    // Auto-open on first lobby visit when no companion is connected yet.
    if (!this.options.companionToken && !Lobby.companionModalAutoShown) {
      Lobby.companionModalAutoShown = true;
      setTimeout(openCmpModal, 650);
    }

    const flyBtn = this.el.querySelector("#btn-fly") as HTMLButtonElement;
    const vehiclesEl = this.el.querySelector(".lobby-vehicles") as HTMLElement;
    const unlockModal = this.el.querySelector("#lobby-unlock-modal") as HTMLElement;
    const unlockTitle = unlockModal.querySelector(".lobby-unlock-title") as HTMLElement;
    const unlockBody = unlockModal.querySelector(".lobby-unlock-body") as HTMLElement;
    const unlockPreviewHost = this.el.querySelector("#lobby-unlock-preview") as HTMLElement;
    const unlockStatuePreviewHost = this.el.querySelector("#lobby-unlock-preview-statue") as HTMLElement;
    const unlockOk = this.el.querySelector("#btn-unlock-ok") as HTMLButtonElement;

    const setSelectedVehicle = (v: Vehicle) => {
      if (!ProgressionManager.isVehicleUnlocked(v)) return;
      this.selectedVehicle = v;
      vehiclesEl.querySelectorAll(".lobby-vbtn").forEach((btn) => {
        const el = btn as HTMLButtonElement;
        if (el.classList.contains("locked")) {
          el.setAttribute("aria-checked", "false");
          return;
        }
        const veh = el.dataset.vehicle as Vehicle;
        const on = veh === v;
        el.classList.toggle("active", on);
        el.setAttribute("aria-checked", on ? "true" : "false");
      });
      this.updateVibejamPortalLink();
    };

    vehiclesEl.querySelectorAll(".lobby-vbtn:not(.locked)").forEach((btn) => {
      btn.addEventListener("click", () => {
        const veh = (btn as HTMLButtonElement).dataset.vehicle as Vehicle;
        setSelectedVehicle(veh);
      });
    });
    vehiclesEl.querySelectorAll(".lobby-vbtn.locked").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    this.unlockQueue = [];
    if (ProgressionManager.loadPlayerWorldState().pendingEternalVictoryCelebration) {
      this.unlockQueue.push("worldSaved");
    }
    this.unlockQueue.push(...ProgressionManager.getPendingUnlockCelebrations());
    const wsUnlock = ProgressionManager.loadPlayerWorldState();
    const needsFreeplayIntro =
      wsUnlock.pendingFreeplayUnlockCelebration === true ||
      (wsUnlock.freeplayModeUnlocked === true && wsUnlock.freeplayUnlockModalAcked !== true);
    if (needsFreeplayIntro) {
      this.unlockQueue.push("freeplay");
    }

    const showNextUnlockModal = () => {
      if (this.unlockQueue.length === 0) {
        this.unlockPreview?.hide();
        this.epilogueStatuePreview?.hide();
        unlockPreviewHost.style.display = "";
        unlockStatuePreviewHost.style.display = "none";
        unlockModal.classList.remove("open");
        unlockModal.classList.remove("lobby-unlock-modal--epilogue");
        unlockModal.setAttribute("aria-hidden", "true");
        flyBtn.disabled = false;
        return;
      }
      const kind = this.unlockQueue[0]!;
      if (kind === "worldSaved") {
        this.unlockPreview?.hide();
        unlockPreviewHost.style.display = "none";
        unlockStatuePreviewHost.style.display = "block";
        if (!this.epilogueStatuePreview) {
          this.epilogueStatuePreview = new EpilogueStatuePreview(unlockStatuePreviewHost);
        }
        this.epilogueStatuePreview.show();
        unlockModal.classList.add("lobby-unlock-modal--epilogue");
        unlockTitle.textContent = t("The world is safe", "世界安全了");
        unlockBody.textContent = t(
          "All five braziers now hold Eternal Flame. The moon will not fall on this world again. Whenever you play Tiny Skies, you can wander the sky without that last threat closing in. A memorial statue has been placed on the globe as a new landmark—fly by and see it. Thank you for flying for us all.",
          "五座火盆如今都燃着永恒之火。月亮不会再坠落到这个世界上。无论何时你游玩 Tiny Skies，都可以在天空中自由翱翔，不必担心最后的威胁逼近。一座纪念雕像已作为新地标安置在地球上——飞过去看看吧。感谢你为我们大家而飞翔。",
        );
      } else if (kind === "freeplay") {
        this.epilogueStatuePreview?.hide();
        this.unlockPreview?.hide();
        unlockStatuePreviewHost.style.display = "none";
        unlockPreviewHost.style.display = "none";
        unlockModal.classList.remove("lobby-unlock-modal--epilogue");
        unlockTitle.textContent = t("Freeplay mode unlocked", "自由模式已解锁");
        unlockBody.textContent = t(
          "Freeplay is unlocked — use it whenever you want to relax, explore, and have fun without the moon bearing down on you. Before you fly, tick Freeplay mode under the vehicle bar: the moon stays in the sky and your run won't end from the cataclysm.",
          "自由模式已解锁——当你想要放松、探索、尽情游玩而不被月亮逼近困扰时就用它。起飞前，在载具栏下方勾选自由模式：月亮会留在天上，你的这一局不会因灾变而结束。",
        );
      } else {
        this.epilogueStatuePreview?.hide();
        unlockStatuePreviewHost.style.display = "none";
        unlockPreviewHost.style.display = "";
        unlockModal.classList.remove("lobby-unlock-modal--epilogue");
        if (!this.unlockPreview) {
          this.unlockPreview = new VehicleUnlockPreview(unlockPreviewHost);
        }
        this.unlockPreview?.show(kind);
        if (kind === "carpet") {
          unlockTitle.textContent = t("Magic Carpet unlocked", "魔法飞毯已解锁");
          unlockBody.textContent = t(
            "You reached level 2 on a run. Take to the skies as a sightseeing capybara on a magic carpet!",
            "你在一局中达到了等级 2。化身一只乘着魔法飞毯观光的水豚，飞向天空吧！",
          );
        } else {
          unlockTitle.textContent = t("Boat unlocked", "小船已解锁");
          unlockBody.textContent = t(
            "You reached level 4 with the biplane or carpet. The ocean is yours to sail.",
            "你用双翼机或飞毯达到了等级 4。大海任你航行。",
          );
        }
      }
      unlockModal.classList.add("open");
      unlockModal.setAttribute("aria-hidden", "false");
      flyBtn.disabled = true;
      requestAnimationFrame(() => unlockOk.focus());
    };

    unlockOk.addEventListener("click", () => {
      if (this.unlockQueue.length === 0) return;
      const kind = this.unlockQueue.shift()!;
      if (kind === "worldSaved") {
        const ws = ProgressionManager.loadPlayerWorldState();
        ProgressionManager.savePlayerWorldState({
          ...ws,
          pendingEternalVictoryCelebration: false,
        });
      } else if (kind === "freeplay") {
        const ws = ProgressionManager.loadPlayerWorldState();
        ProgressionManager.savePlayerWorldState({
          ...ws,
          pendingFreeplayUnlockCelebration: false,
          freeplayUnlockModalAcked: true,
        });
      } else {
        ProgressionManager.acknowledgeUnlockCelebration(kind);
      }
      showNextUnlockModal();
    });

    const freeplayWrap = this.el.querySelector("#lobby-freeplay-wrap") as HTMLElement;
    const freeplayCb = this.el.querySelector("#lobby-freeplay-cb") as HTMLInputElement;
    const wsLobby = ProgressionManager.loadPlayerWorldState();
    if (wsLobby.freeplayModeUnlocked) {
      freeplayWrap.hidden = false;
      freeplayCb.checked = !!wsLobby.freeplayLobbyToggle;
      freeplayCb.addEventListener("change", () => {
        const ws = ProgressionManager.loadPlayerWorldState();
        ProgressionManager.savePlayerWorldState({
          ...ws,
          freeplayLobbyToggle: freeplayCb.checked,
        });
      });
    }

    flyBtn.addEventListener("click", () => {
      if (!ProgressionManager.isVehicleUnlocked(this.selectedVehicle)) return;
      flyBtn.disabled = true;
      Lobby.requestFullscreen();
      const ws = ProgressionManager.loadPlayerWorldState();
      const freeplay = !!(ws.freeplayModeUnlocked && freeplayCb.checked);
      this.options.onPlay(this.selectedVehicle, { freeplay });
    });

    this.flushUnlockModals = () => showNextUnlockModal();

    if (this.unlockQueue.length > 0) {
      flyBtn.disabled = true;
      if (this.options.deferUnlockModalsUntilMenuReveal) {
        this.unlockModalsDeferred = true;
      } else {
        this.flushUnlockModals();
      }
    }

    this.updateVibejamPortalLink();
    this.applyStyles();
  }

  /** Call after the full-screen menu transition has cleared so unlock modals are not hidden under it. */
  revealDeferredUnlockModals() {
    if (!this.unlockModalsDeferred || this.unlockQueue.length === 0) return;
    this.unlockModalsDeferred = false;
    this.flushUnlockModals?.();
  }

  private loadSaveFeed() {
    const host = this.options.serverUrl.replace(/\/$/, "");
    const wrap = this.el.querySelector("#lobby-save-feed") as HTMLElement | null;
    const list = wrap?.querySelector(".lobby-save-feed-list") as HTMLUListElement | null;
    const emptyEl = wrap?.querySelector(".lobby-save-feed-empty") as HTMLElement | null;
    if (!wrap || !list || !emptyEl) return;

    const showFeedBlock = (hasEntries: boolean) => {
      if (hasEntries) {
        emptyEl.hidden = true;
        list.removeAttribute("aria-hidden");
      } else {
        list.replaceChildren();
        list.setAttribute("aria-hidden", "true");
        emptyEl.hidden = false;
      }
      wrap.hidden = false;
      requestAnimationFrame(() => {
        wrap.classList.add("visible");
      });
    };

    void fetch(`${host}/api/save-feed?limit=5`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("save-feed"))))
      .then((data: { entries?: { playerName: string; worldName: string }[] }) => {
        const entries = data.entries ?? [];
        if (entries.length === 0) {
          showFeedBlock(false);
          return;
        }
        list.replaceChildren(
          ...entries.map((e) => {
            const li = document.createElement("li");
            li.className = "lobby-save-feed-item";
            li.textContent = t(`${e.playerName} saved ${e.worldName}.`, `${e.playerName} 拯救了 ${e.worldName}。`);
            return li;
          }),
        );
        showFeedBlock(true);
      })
      .catch(() => {
        showFeedBlock(false);
      });
  }

  show() {
    this.container.appendChild(this.el);
    this.loadSaveFeed();
    requestAnimationFrame(() => {
      this.unlockPreview?.resize();
      this.epilogueStatuePreview?.resize();
      this.el.querySelector(".lobby-header")?.classList.add("visible");
      this.el.querySelector(".lobby-bar")?.classList.add("visible");
    });
  }

  fadeOut(onComplete: () => void) {
    const overlay = this.el.querySelector(".lobby-overlay") as HTMLElement;
    if (!overlay) { onComplete(); return; }

    let called = false;
    const onEnd = () => {
      if (called) return;
      called = true;
      clearTimeout(fallback);
      overlay.removeEventListener("transitionend", onEnd);
      onComplete();
    };

    overlay.classList.add("fade-out");
    overlay.addEventListener("transitionend", onEnd);
    const fallback = setTimeout(onEnd, 800);
  }

  dispose() {
    this.flushUnlockModals = null;
    this.unlockModalsDeferred = false;
    this.unlockPreview?.dispose();
    this.unlockPreview = null;
    this.epilogueStatuePreview?.dispose();
    this.epilogueStatuePreview = null;
    this.el.remove();
    document.getElementById("lobby-styles")?.remove();
  }

  private applyStyles() {
    if (document.getElementById("lobby-styles")) return;
    const style = document.createElement("style");
    style.id = "lobby-styles";
    style.textContent = `
      .lobby-overlay {
        position: fixed; inset: 0; z-index: 100;
        pointer-events: none;
        font-family: 'Domine', Georgia, serif;
        transition: opacity 0.6s ease-out;
      }
      .lobby-overlay.fade-out {
        opacity: 0;
        pointer-events: none;
      }

      .lobby-attribution {
        position: fixed;
        left: 0;
        right: 0;
        bottom: max(22px, calc(env(safe-area-inset-bottom, 0px) + 10px));
        margin: 0 auto;
        padding: 0 16px;
        box-sizing: border-box;
        max-width: min(40rem, calc(100% - 32px));
        text-align: center;
        font-size: clamp(0.72rem, 2.05vw, 0.84rem);
        font-weight: 400;
        line-height: 1.45;
        letter-spacing: 0.03em;
        color: #8a8a8a;
        pointer-events: none;
        z-index: 50;
        opacity: 0;
        transition: opacity 0.8s ease-out;
        transition-delay: 0.35s;
      }
      .lobby-attribution__brand {
        font-weight: 700;
        color: #767676;
      }
      .lobby-header.visible ~ .lobby-attribution {
        opacity: 1;
      }
      .lobby--mobile .lobby-attribution {
        display: none !important;
      }

      .lobby-vibejam-portal {
        position: fixed;
        left: max(12px, calc(env(safe-area-inset-left, 0px) + 8px));
        bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px));
        z-index: 102;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 44px;
        padding: 8px 14px 8px 12px;
        box-sizing: border-box;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.2);
        border: none;
        backdrop-filter: blur(12px) saturate(120%);
        -webkit-backdrop-filter: blur(12px) saturate(120%);
        pointer-events: auto;
        box-shadow: none;
        opacity: 0;
        transition: background 0.2s, transform 0.15s, opacity 0.8s ease-out;
        transition-delay: 0s, 0s, 0.35s;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.95);
        font-family: 'Domine', Georgia, serif;
        font-size: clamp(0.78rem, 1.35vw, 0.88rem);
        font-weight: 600;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }
      .lobby-vibejam-portal__label {
        line-height: 1.2;
      }
      .lobby--mobile .lobby-vibejam-portal__label {
        display: none;
      }
      .lobby--mobile .lobby-vibejam-portal {
        gap: 0;
        width: 44px;
        height: 44px;
        min-height: 44px;
        padding: 0;
      }
      .lobby-header.visible ~ .lobby-vibejam-portal {
        opacity: 1;
      }
      .lobby-vibejam-portal:hover {
        background: rgba(0, 0, 0, 0.32);
        transform: scale(1.05);
      }
      .lobby-vibejam-portal:active {
        transform: scale(0.97);
      }
      .lobby-vibejam-portal img {
        width: 26px;
        height: 26px;
        display: block;
        filter: brightness(0) invert(1);
        opacity: 0.95;
      }
      .lobby-overlay.fade-out .lobby-vibejam-portal {
        opacity: 0;
        pointer-events: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .lobby-vibejam-portal {
          transition: background 0.2s;
          opacity: 1;
        }
        .lobby-header.visible ~ .lobby-vibejam-portal {
          opacity: 1;
        }
        .lobby-vibejam-portal:hover,
        .lobby-vibejam-portal:active {
          transform: none;
        }
      }

      .lobby-header {
        position: fixed;
        top: calc(28vh - 22px);
        left: 0; right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        transition-delay: 0.3s;
      }
      .lobby-header.visible {
        opacity: 1;
        transform: translateY(0);
      }
      /* Negative margin on the tagline shrinks this block's height; padding-bottom restores
         space before .lobby-username so the greeting doesn't ride up with the title pair. */
      .lobby-title-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
        padding-bottom: clamp(0.42rem, 1.15vw, 0.72rem);
      }
      .lobby-tagline {
        font-family: 'Darumadrop One', 'Domine', Georgia, serif;
        font-size: clamp(1.05rem, 3.3vw, 1.32rem);
        font-weight: 400;
        margin: 0 0 -0.4em;
        line-height: 1.05;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.88);
        text-shadow: none;
        opacity: 0;
        transform: translate3d(0, 0.42em, 0);
        will-change: opacity, transform;
      }
      .lobby-header.visible .lobby-tagline {
        animation: lobby-tagline-in 0.52s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        animation-delay: calc(0.38s + var(--title-last-char-i) * 0.058s + 0.68s + 0.05s);
      }
      .lobby-title {
        font-family: 'Darumadrop One', 'Domine', Georgia, serif;
        font-size: clamp(3.5rem, 14vw, 8.4rem);
        font-weight: 800;
        margin: 0;
        line-height: 1;
        color: white;
        text-shadow: none;
        display: inline-flex;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 100%;
      }
      .lobby-title__char {
        display: inline-block;
        opacity: 0;
        transform: translate3d(0, 0.52em, 0);
        will-change: transform, opacity;
      }
      .lobby-header.visible .lobby-title__char {
        animation:
          lobby-title-char-in 0.68s cubic-bezier(0.28, 1.25, 0.55, 1) forwards,
          lobby-title-char-idle 5s ease-in-out infinite;
        animation-delay:
          calc(0.38s + var(--title-char-i) * 0.058s),
          calc(0.38s + var(--title-last-char-i) * 0.058s + 0.68s + 0.42s + var(--title-char-i) * 0.072s);
      }
      @keyframes lobby-title-char-in {
        0% {
          opacity: 0;
          transform: translate3d(0, 0.52em, 0);
        }
        58% {
          opacity: 1;
          transform: translate3d(0, -0.06em, 0);
        }
        78% {
          transform: translate3d(0, 0.03em, 0);
        }
        100% {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }
      @keyframes lobby-title-char-idle {
        0%,
        4.5%,
        100% {
          transform: translate3d(0, 0, 0);
        }
        2.25% {
          transform: translate3d(0, -0.072em, 0);
        }
      }
      @keyframes lobby-tagline-in {
        from {
          opacity: 0;
          transform: translate3d(0, 0.42em, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }
      .lobby-title__space {
        display: inline-block;
        white-space: pre;
      }
      @media (prefers-reduced-motion: reduce) {
        .lobby-title__char {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
        .lobby-header.visible .lobby-tagline {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
        .lobby-vbtn.locked:hover .lobby-vicon--lock {
          animation: none !important;
        }
        .lobby-vbtn:hover:not(.locked) .lobby-vicon {
          animation: none !important;
        }
        .lobby-fly:hover:not(:disabled) .lobby-fly__label {
          animation: none !important;
        }
        .lobby-attribution {
          transition: none !important;
        }
      }
      .lobby-username {
        margin: 20px 0 0;
        width: 100%;
        padding: 0 40px;
        box-sizing: border-box;
        font-size: 1.2rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 1.0);
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .lobby-greeting-row {
        display: inline-flex;
        align-items: baseline;
        flex-wrap: nowrap;
        max-width: calc(100% - 48px);
      }
      .lobby-companion-row {
        display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;
        margin-top: 14px;
      }
      /* Primary CTA: connecting the AI companion is the hero action. */
      .lobby-companion-btn {
        background: linear-gradient(135deg, rgba(120,170,255,0.32), rgba(170,130,255,0.32));
        border: 1px solid rgba(170,190,255,0.45);
        color: #fff; border-radius: 999px; padding: 11px 22px;
        font: inherit; font-size: 0.92rem; font-weight: 600; cursor: pointer;
        transition: background 0.2s, border-color 0.2s, transform 0.1s;
        box-shadow: 0 4px 18px rgba(80,110,220,0.28);
      }
      .lobby-companion-btn:hover { background: linear-gradient(135deg, rgba(120,170,255,0.45), rgba(170,130,255,0.45)); }
      .lobby-companion-btn:active { transform: scale(0.98); }
      .lobby-companion-btn.connected {
        background: rgba(90,209,122,0.16); border-color: rgba(90,209,122,0.55);
        color: #cfeeda; box-shadow: none; font-weight: 500; font-size: 0.82rem; padding: 8px 16px;
      }
      .lobby-companion-help { font-size: 0.72rem; color: rgba(255,255,255,0.45); text-decoration: underline; }

      /* De-emphasize the name (no longer a login step). */
      .lobby-greeting-hi, .lobby-name { font-size: 0.95rem; opacity: 0.8; }
      .lobby-name { font-weight: 600; }

      /* ── Companion connect modal ── */
      .lobby-companion-modal {
        position: fixed; inset: 0; z-index: 60; display: none;
        align-items: center; justify-content: center; padding: 16px;
      }
      .lobby-companion-modal.open { display: flex; }
      .lobby-companion-backdrop {
        position: absolute; inset: 0; background: rgba(6,8,18,0.62); backdrop-filter: blur(4px);
      }
      .lobby-companion-panel {
        position: relative; width: min(440px, 94vw); max-height: 90vh; overflow-y: auto;
        background: rgba(20,26,42,0.96); border: 1px solid rgba(255,255,255,0.10);
        border-radius: 18px; padding: 22px; color: rgba(255,255,255,0.92);
        font-family: 'Domine', Georgia, serif; box-shadow: 0 18px 60px rgba(0,0,0,0.5);
      }
      .lobby-companion-modal-title { font-size: 1.2rem; font-weight: 700; margin: 0 0 8px; }
      .lobby-companion-status { font-size: 0.84rem; color: rgba(255,255,255,0.62); margin: 0 0 14px; line-height: 1.45; }
      .lobby-companion-field-label { display: block; font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 6px; }
      .lobby-companion-input {
        width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; padding: 11px 13px;
        color: #fff; font: inherit; font-size: 0.9rem; outline: none; margin-bottom: 14px;
      }
      .lobby-companion-help-box { margin-bottom: 12px; }
      .lobby-companion-help-box summary {
        cursor: pointer; font-size: 0.86rem; font-weight: 600; color: #9ad1ff; list-style: revert;
      }
      .lobby-companion-steps { margin: 10px 0 0; padding-left: 22px; }
      .lobby-companion-steps li { font-size: 0.82rem; line-height: 1.5; margin-bottom: 7px; color: rgba(255,255,255,0.85); }
      .lobby-companion-steps strong { color: #fff; }
      .lobby-companion-note { font-size: 0.74rem; color: rgba(255,255,255,0.45); line-height: 1.5; margin: 6px 0 14px; }
      .lobby-companion-note code { font-family: ui-monospace, monospace; font-size: 0.92em; }
      .lobby-companion-autovoice { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: rgba(255,255,255,0.8); margin-bottom: 18px; cursor: pointer; }
      .lobby-companion-actions { display: flex; gap: 10px; }
      .lobby-companion-save {
        flex: 1; background: linear-gradient(135deg, #5b8cf0, #7a5bf0); color: #fff;
        border: none; border-radius: 10px; padding: 13px; font: inherit; font-size: 0.92rem;
        font-weight: 700; cursor: pointer;
      }
      .lobby-companion-later {
        background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); border: none;
        border-radius: 10px; padding: 13px 20px; font: inherit; font-size: 0.9rem; cursor: pointer;
      }
      .lobby-companion-disconnect {
        display: none; width: 100%; margin-top: 12px; background: none; border: none;
        color: rgba(255,140,140,0.8); font: inherit; font-size: 0.78rem; cursor: pointer; text-decoration: underline;
      }
      .lobby-greeting-hi { flex-shrink: 0; white-space: nowrap; }
      .lobby-name-wrap {
        position: relative;
        display: inline-block;
        min-width: 40px;
      }
      .lobby-name {
        font-weight: 600;
        color: rgba(255, 255, 255, 1.0);
        outline: none;
        border-bottom: 2px dashed rgba(255, 255, 255, 0.5);
        padding: 0 2px;
        min-width: 32px;
        cursor: text;
        transition: border-color 0.2s;
      }
      .lobby-name:focus { border-bottom-color: rgba(255, 255, 255, 0.7); }
      .lobby-edit-btn {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-left: 6px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 1);
        cursor: pointer;
        padding: 4px 6px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
      }

      .lobby-bar {
        position: relative;
        align-self: center;
        margin-top: 40px;
        width: min(520px, calc(100% - 80px));
        padding: 10px 12px;
        display: flex;
        align-items: stretch;
        gap: 10px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(32px) saturate(120%);
        -webkit-backdrop-filter: blur(32px) saturate(120%) brightness(0.85);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        pointer-events: auto;
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        transition-delay: 0.55s;
        z-index: 101;
        box-sizing: border-box;
      }
      .lobby-bar.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .lobby-overlay.fade-out .lobby-bar {
        transform: translateY(16px);
      }
      .lobby-overlay.fade-out .lobby-freeplay-wrap:not([hidden]) {
        transform: translateY(16px);
      }

      .lobby-freeplay-wrap {
        align-self: center;
        margin-top: 14px;
        max-width: min(520px, calc(100% - 48px));
        padding: 0 12px;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        text-align: center;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        transition-delay: 0.55s;
        z-index: 101;
      }
      .lobby-header.visible .lobby-freeplay-wrap:not([hidden]) {
        opacity: 1;
        transform: translateY(0);
      }
      .lobby-freeplay-wrap[hidden] {
        display: none !important;
      }
      .lobby-freeplay-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin: 0;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        line-height: 1.35;
        color: rgba(255, 255, 255, 0.92);
        user-select: none;
        white-space: nowrap;
      }
      @media (max-width: 480px) {
        .lobby-freeplay-label {
          font-size: 0.65rem;
          gap: 6px;
        }
        .lobby-freeplay-label input {
          width: 14px;
          height: 14px;
        }
      }
      .lobby-freeplay-label input {
        flex-shrink: 0;
        width: 15px;
        height: 15px;
        accent-color: #fff;
        cursor: pointer;
      }
      .lobby-freeplay-text {
        font: inherit;
        color: inherit;
        letter-spacing: inherit;
      }

      .lobby-vehicles {
        display: flex;
        gap: 4px;
        flex: 1;
        min-width: 0;
      }
      .lobby-vbtn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 8px 6px 10px;
        min-height: 72px;
        min-width: 0;
        border: 2px solid transparent;
        border-radius: 10px;
        background: transparent;
        color: #ffffff;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, box-shadow 0.2s, border-color 0.2s, opacity 0.2s;
        font-family: inherit;
      }
      .lobby-vbtn:hover:not(.locked):not(.active) {
        background: rgba(255, 255, 255, 0.12);
      }
      .lobby-vbtn.active {
        background: rgba(255, 255, 255, 1.0);
        color: rgba(20, 30, 50, 0.92);
      }
      .lobby-vbtn.active .lobby-vmeta { color: rgba(20, 30, 50, 0.75); }
      .lobby-vbtn.locked {
        opacity: 0.55;
        cursor: not-allowed;
        gap: 0;
      }
      .lobby-vbtn.locked .lobby-vicon--lock {
        opacity: 0.9;
        transform-origin: 50% 65%;
      }
      @keyframes lobby-tilt-wiggle {
        0%,
        100% {
          transform: rotate(0deg);
        }
        18% {
          transform: rotate(-11deg);
        }
        40% {
          transform: rotate(9deg);
        }
        62% {
          transform: rotate(-7deg);
        }
        82% {
          transform: rotate(4deg);
        }
      }
      .lobby-vbtn.locked:hover .lobby-vicon--lock {
        animation: lobby-tilt-wiggle 0.55s ease-in-out infinite;
      }
      .lobby-vbtn:hover:not(.locked) .lobby-vicon {
        transform-origin: 50% 65%;
        animation: lobby-tilt-wiggle 0.55s ease-in-out infinite;
      }
      .lobby-vicon {
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }
      .lobby-vicon-asset {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        display: block;
        filter: brightness(0) invert(1);
      }
      .lobby-vbtn.active .lobby-vicon-asset {
        filter: none;
      }
      .lobby-vicon-asset--lock { width: 28px; height: 28px; }
      .lobby-vlabel {
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.03em;
      }
      .lobby-vmeta {
        font-size: 0.68rem;
        font-weight: 600;
        line-height: 1.25;
        text-align: center;
        max-width: 100%;
        padding: 0 2px;
        opacity: 0.92;
        letter-spacing: 0.02em;
      }

      .lobby-fly {
        align-self: stretch;
        padding: 0 28px;
        border: none;
        border-radius: 10px;
        background: #000000;
        color: #ffffff;
        font-family: 'Darumadrop One', 'Domine', Georgia, serif;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        cursor: pointer;
        transition: background 0.2s, transform 0.15s, opacity 0.2s;
        flex-shrink: 0;
      }
      .lobby-fly__label {
        display: inline-block;
        transform-origin: 50% 65%;
      }
      .lobby-fly:hover:not(:disabled) {
        background: #1a1a1a;
        transform: scale(1.03);
      }
      .lobby-fly:hover:not(:disabled) .lobby-fly__label {
        animation: lobby-tilt-wiggle 0.55s ease-in-out infinite;
      }
      .lobby-fly:active:not(:disabled) {
        transform: scale(0.97);
      }
      .lobby-fly:active:not(:disabled) .lobby-fly__label {
        animation: none;
      }
      .lobby-fly:disabled {
        opacity: 0.52;
        cursor: default;
        transform: none;
      }

      .lobby-save-feed {
        position: relative;
        align-self: center;
        margin-top: 40px;
        width: min(520px, calc(100% - 80px));
        box-sizing: border-box;
        padding: 0 4px;
        pointer-events: none;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transform: translateY(8px);
        transition: opacity 0.45s ease-out, transform 0.45s ease-out, max-height 0.45s ease-out;
        transition-delay: 0.62s;
      }
      .lobby-save-feed[hidden] { display: none; }
      .lobby-save-feed:not([hidden]) {
        max-height: 220px;
      }
      .lobby-save-feed.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .lobby-save-feed-head {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 12px;
        color: #ffffff;
      }
      .lobby-save-feed-deco {
        flex: 1;
        min-width: 1.5rem;
        max-width: 5.5rem;
        height: 2px;
        border: none;
        border-radius: 1px;
      }
      .lobby-save-feed-deco:first-child {
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.5) 100%
        );
      }
      .lobby-save-feed-deco:last-child {
        background: linear-gradient(
          to left,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.5) 100%
        );
      }
      .lobby-save-feed-crown {
        flex-shrink: 0;
        display: block;
        width: 22px;
        height: 22px;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
      }
      .lobby-save-feed-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 11px;
        text-align: center;
        font-size: 0.78rem;
        font-weight: 450;
        line-height: 1.4;
        letter-spacing: 0.02em;
        color: #ffffff;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
      }
      .lobby-save-feed-item { margin: 0; }
      .lobby-save-feed-empty {
        margin: 0;
        text-align: center;
        font-size: 0.78rem;
        font-weight: 450;
        line-height: 1.4;
        letter-spacing: 0.02em;
        color: #ffffff;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
      }
      .lobby-save-feed-empty[hidden] { display: none !important; }

      .lobby-unlock-modal {
        position: fixed;
        inset: 0;
        z-index: 110;
        display: none;
        align-items: center;
        justify-content: center;
        font-family: 'Domine', Georgia, serif;
        -webkit-font-smoothing: antialiased;
      }
      .lobby-unlock-modal.open {
        display: flex;
        pointer-events: auto;
        z-index: 10050;
      }
      .lobby-unlock-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px) saturate(110%);
        -webkit-backdrop-filter: blur(10px) saturate(110%);
      }
      .lobby-unlock-panel {
        position: relative;
        z-index: 1;
        width: min(25rem, calc(100% - 48px));
        max-width: 100%;
        margin: 0 24px;
        padding: 22px 22px 20px;
        text-align: center;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(32px) saturate(120%);
        -webkit-backdrop-filter: blur(32px) saturate(120%) brightness(0.85);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        box-sizing: border-box;
      }
      /* Bleed to panel edges (no inner frame); WebGL sits on the glass card. */
      .lobby-unlock-preview-canvas {
        width: calc(100% + 44px);
        margin: -22px -22px 18px -22px;
        height: clamp(170px, 32vw, 220px);
        border-radius: 16px 16px 0 0;
        overflow: hidden;
        pointer-events: none;
      }
      .lobby-unlock-preview-canvas canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
      .lobby-unlock-title {
        font-size: clamp(1.05rem, 3.6vw, 1.25rem);
        font-weight: 800;
        margin: 0 0 10px;
        letter-spacing: 0.02em;
        color: #ffffff;
        text-shadow: none;
      }
      .lobby-unlock-body {
        font-size: 0.94rem;
        font-weight: 400;
        line-height: 1.55;
        margin: 0 0 20px;
        opacity: 0.92;
        color: rgba(255, 255, 255, 0.95);
      }
      .lobby-unlock-ok {
        width: 100%;
        padding: 12px 24px;
        min-height: 48px;
        border: none;
        border-radius: 10px;
        background: #000000;
        color: #ffffff;
        font-family: inherit;
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        cursor: pointer;
        transition: background 0.2s, transform 0.15s, box-shadow 0.3s;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.35);
      }
      .lobby-unlock-ok:hover {
        background: #1a1a1a;
        transform: scale(1.02);
        box-shadow: 0 0 18px rgba(0, 0, 0, 0.45);
      }
      .lobby-unlock-ok:active { transform: scale(0.98); }

      @media (max-width: 480px) {
        .lobby-header {
          top: calc(max(14vh, calc(env(safe-area-inset-top, 0px) + 10vh)) - 22px);
        }
        .lobby-username { font-size: 1rem; padding: 0 20px; }
        .lobby-edit-btn { padding: 8px 12px; min-width: 44px; min-height: 44px; }
        .lobby-bar {
          margin-top: 36px;
          width: min(520px, calc(100% - 40px));
          padding: 8px 8px;
          gap: 6px;
        }
        .lobby-vbtn { padding: 8px 4px 10px; min-height: 80px; }
        .lobby-vicon-asset { width: 22px; height: 22px; }
        .lobby-vicon-asset--lock { width: 26px; height: 26px; }
        .lobby-vlabel { font-size: 0.75rem; }
        .lobby-vmeta { font-size: 0.58rem; }
        .lobby-fly { padding: 0 18px; font-size: 0.9rem; min-width: 52px; min-height: 44px; }
        .lobby-save-feed {
          width: min(520px, calc(100% - 40px));
          margin-top: 32px;
        }
        .lobby-save-feed-head { gap: 10px; margin-bottom: 10px; }
        .lobby-save-feed-crown { width: 20px; height: 20px; }
        .lobby-save-feed-list { font-size: 0.72rem; gap: 10px; }
        .lobby-save-feed-empty { font-size: 0.72rem; }
        .lobby-unlock-panel {
          width: min(22rem, calc(100% - 32px));
          margin: 0 16px;
          padding: 18px 18px 16px;
        }
        .lobby-unlock-preview-canvas {
          width: calc(100% + 36px);
          margin: -18px -18px 16px -18px;
          height: clamp(150px, 42vw, 190px);
          border-radius: 16px 16px 0 0;
        }
        .lobby-unlock-body { font-size: 0.9rem; }
        .lobby-attribution {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
