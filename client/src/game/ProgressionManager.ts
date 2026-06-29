import type { Vehicle } from "@globefly/shared";
import { UpgradeManager } from "./UpgradeManager";

const STORAGE_KEY = "globefly_vehicle_progress";
const NAME_KEY = "globefly_player_name";
const UNLOCK_ACK_KEY = "globefly_unlocks_ack";
const PLAYER_WORLD_STATE_KEY = "globefly_player_world_state_v1";
/** Campsite bookmark; cleared with `clearAll` for a full local reset. */
const CAMPSITE_KEY = "globefly_campsite_v2";
const LEGACY_CAMPSITE_KEY = "globefly_campsite";
/** Pouchy companion access token (PAT, `pchy_…`). Opt-in; stored locally only. */
const COMPANION_TOKEN_KEY = "globefly_companion_token";
/** A2A friends roster (non-secret visitorIds + display info only). */
const FRIENDS_KEY = "globefly_a2a_friends_v1";

/** A paired A2A friend, identified by their stable non-secret visitorId. */
export interface CompanionFriend {
  visitorId: string;
  name: string;
  companionName?: string;
  pairedAt: number;
  /** Friendship bond points, grown by playing together (time, gifts, duos). */
  bond?: number;
}

/** Bond points → friendship level (1 ❤️ at 10, then a gentle curve). Lv0 = new. */
export function friendBondLevel(bond: number | undefined): number {
  const b = bond ?? 0;
  if (b < 10) return 0;
  return Math.floor(Math.sqrt(b / 10)); // 10→1, 40→2, 90→3, 160→4, 250→5 …
}

/** A2A sky gifts received from other companions (kept on the player's profile). */
const GIFTS_KEY = "globefly_a2a_gifts_v1";

export interface ReceivedGift {
  gift: string;
  fromName: string;
  fromCompanion?: string;
  at: number;
}

/** Carpet unlocks when any vehicle has reached at least this level. */
export const UNLOCK_CARPET_MIN_MAX_LEVEL = 2;
/** Boat unlocks when plane or carpet reaches this level (boat’s own level does not count). */
export const UNLOCK_BOAT_PLANE_OR_CARPET_LEVEL = 4;
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600, 8200];

export interface SavedVehicleProgress {
  xp: number;
  level: number;
  appliedUpgradeIds: string[];
  /** 0xRRGGBB hull / body color chosen for this vehicle. */
  vehicleColor?: number;
}

export interface SavedPlayerWorldState {
  /** Once true, every world loads with the fused moonstone ring already active. */
  moonstoneUnionComplete?: boolean;
  /** Once true, braziers spawn already risen instead of hidden underground. */
  braziersRevealed?: boolean;
  /** Absolute wall-clock expiry per brazier slot; null means currently unlit. */
  brazierBurnEndsAtMs?: (number | null)[];
  /** Prevents replaying the first-burnout hint once the player has already seen it. */
  brazierFizzleHintShown?: boolean;
  /** Per-slot eternal flame: stays lit forever (Gremlin King reward). */
  brazierEternal?: boolean[];
  /** Inventory of unused eternal flames (from Gremlin King); consumed when lighting a brazier. */
  eternalFlameCount?: number;
  /** After the first Gremlin King kill, further kills never award another eternal flame. */
  gremlinKingEternalFlameClaimed?: boolean;
  /** Once true, collecting all six sky jellyfish no longer awards a bonus eternal flame. */
  jellyfishSetEternalFlameClaimed?: boolean;
  /** After the 3rd package delivery, further deliveries never award the heirloom eternal flame. */
  packageThirdDeliveryEternalFlameClaimed?: boolean;
  /** After the boat “mystery octopus” eternal flame, it never spawns or rewards again. */
  boatMysteryOctopusEternalFlameClaimed?: boolean;
  /** All five braziers lit with eternal flames — moon approach frozen indefinitely. */
  moonFrozenByEternalFlames?: boolean;
  /** Saved moon `elapsed` seconds when frozen (restored each run). */
  moonFrozenElapsedSec?: number;
  /** One-time lobby celebration after the eternal-flame win sequence (cleared when dismissed). */
  pendingEternalVictoryCelebration?: boolean;
  /**
   * How many times the player has completed the full moon impact → menu flow.
   * Drives approach duration: 0 → 5 min, 1 → 7 min, 2+ → 10 min (see `moonApproachDurationSec`).
   */
  completedMoonApproachRunCount?: number;
  /** After the first moon-crash run, Freeplay can be chosen in the lobby (moon stays distant). */
  freeplayModeUnlocked?: boolean;
  /** One-time lobby popup when {@link freeplayModeUnlocked} first becomes true. */
  pendingFreeplayUnlockCelebration?: boolean;
  /** After the player dismisses the Freeplay intro modal; also clears {@link pendingFreeplayUnlockCelebration}. */
  freeplayUnlockModalAcked?: boolean;
  /** Lobby checkbox: next flight uses freeplay if {@link freeplayModeUnlocked}. */
  freeplayLobbyToggle?: boolean;
  /**
   * Once true, the cosmic void portals are permanently removed from the world.
   * Set after the player survives all three void waves and collects the eternal flame.
   */
  voidPortalsClosed?: boolean;
  /** Per-vehicle first-time controls tutorial completion. */
  vehicleTutorialsCompleted?: Partial<Record<Vehicle, boolean>>;
  /** One-time eternal flame from completing the time-trial race. */
  raceEternalFlameClaimed?: boolean;
}

type AllVehicleProgress = Partial<Record<Vehicle, SavedVehicleProgress>>;

export class ProgressionManager {
  private xp = 0;
  private level = 1;
  private readonly vehicle: Vehicle;
  readonly upgrades = new UpgradeManager();

  onXPChanged: ((xp: number, xpForNext: number, xpForCurrent: number, level: number) => void) | null = null;
  onLevelUp: ((level: number) => void) | null = null;

  constructor(vehicle: Vehicle) {
    this.vehicle = vehicle;
    this.upgrades.setVehicle(vehicle);
  }

  /** Load saved progression from localStorage and replay upgrades. */
  restore() {
    const saved = ProgressionManager.loadVehicle(this.vehicle);
    if (!saved) return;
    this.xp = saved.xp;
    this.level = saved.level;
    this.upgrades.restoreUpgrades(saved.appliedUpgradeIds);
  }

  /**
   * Single entry point for all XP gains.
   * Recomputes level, fires callbacks, and auto-saves.
   */
  addXP(amount: number) {
    if (amount <= 0) return;
    const prevLevel = this.level;
    this.xp += amount;
    this.level = this.computeLevel();

    this.onXPChanged?.(this.xp, this.getXPForNextLevel(), this.getXPForCurrentLevel(), this.level);

    this.save();
    if (this.level > prevLevel) {
      this.onLevelUp?.(this.level);
    }
  }

  /** Persist current state to localStorage. */
  save() {
    const all = ProgressionManager.loadAll();
    const prev = all[this.vehicle];
    all[this.vehicle] = {
      xp: this.xp,
      level: this.level,
      appliedUpgradeIds: [...this.upgrades.appliedIds],
      vehicleColor: prev?.vehicleColor,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { /* storage full or unavailable — silently degrade */ }
  }

  /** Save the vehicle's hull color so it persists across playthroughs. */
  saveVehicleColor(color: number) {
    const all = ProgressionManager.loadAll();
    const prev = all[this.vehicle] ?? { xp: 0, level: 1, appliedUpgradeIds: [] };
    prev.vehicleColor = color;
    all[this.vehicle] = prev;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {}
  }

  /** Return the saved hull color, or undefined if none stored. */
  getSavedVehicleColor(): number | undefined {
    return ProgressionManager.loadVehicle(this.vehicle)?.vehicleColor;
  }

  getXP() { return this.xp; }
  getLevel() { return this.level; }

  getXPForNextLevel(): number {
    const idx = this.level;
    if (idx < LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[idx]!;
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]! + (idx - LEVEL_THRESHOLDS.length + 1) * 2000;
  }

  getXPForCurrentLevel(): number {
    const idx = this.level - 1;
    if (idx >= 0 && idx < LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[idx]!;
    return 0;
  }

  private computeLevel(): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.xp >= LEVEL_THRESHOLDS[i]!) return i + 1;
    }
    return 1;
  }

  // ── Static helpers ──

  static loadAll(): AllVehicleProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AllVehicleProgress;
    } catch { /* corrupt data — start fresh */ }
    return {};
  }

  static loadVehicle(vehicle: Vehicle): SavedVehicleProgress | undefined {
    return ProgressionManager.loadAll()[vehicle];
  }

  /** Max `level` among saved vehicles; missing slots count as 0. */
  static maxLevelAcrossSlots(all: AllVehicleProgress = ProgressionManager.loadAll()): number {
    return Math.max(
      0,
      all.plane?.level ?? 0,
      all.boat?.level ?? 0,
      all.carpet?.level ?? 0,
    );
  }

  static isVehicleUnlocked(
    vehicle: Vehicle,
    all: AllVehicleProgress = ProgressionManager.loadAll(),
  ): boolean {
    if (vehicle === "plane") return true;
    if (vehicle === "carpet") {
      return ProgressionManager.maxLevelAcrossSlots(all) >= UNLOCK_CARPET_MIN_MAX_LEVEL;
    }
    if (vehicle === "boat") {
      const pl = all.plane?.level ?? 0;
      const ca = all.carpet?.level ?? 0;
      return pl >= UNLOCK_BOAT_PLANE_OR_CARPET_LEVEL || ca >= UNLOCK_BOAT_PLANE_OR_CARPET_LEVEL;
    }
    return false;
  }

  /** Saved level for that vehicle, or `null` if never played (no save). */
  static savedLevelOrNull(vehicle: Vehicle): number | null {
    const s = ProgressionManager.loadAll()[vehicle];
    return s != null ? s.level : null;
  }

  // ── One-time unlock celebration (lobby popup) — shown in progression order ──

  static getPendingUnlockCelebrations(): ("carpet" | "boat")[] {
    const all = ProgressionManager.loadAll();
    const ack = ProgressionManager.loadUnlockAck();
    const out: ("carpet" | "boat")[] = [];
    if (ProgressionManager.isVehicleUnlocked("carpet", all) && !ack.carpet) out.push("carpet");
    if (ProgressionManager.isVehicleUnlocked("boat", all) && !ack.boat) out.push("boat");
    return out;
  }

  static acknowledgeUnlockCelebration(kind: "carpet" | "boat") {
    const ack = ProgressionManager.loadUnlockAck();
    ack[kind] = true;
    try { localStorage.setItem(UNLOCK_ACK_KEY, JSON.stringify(ack)); } catch {}
  }

  static loadUnlockAck(): { carpet?: boolean; boat?: boolean } {
    try {
      const raw = localStorage.getItem(UNLOCK_ACK_KEY);
      if (raw) return JSON.parse(raw) as { carpet?: boolean; boat?: boolean };
    } catch {}
    return {};
  }

  static clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NAME_KEY);
      localStorage.removeItem(UNLOCK_ACK_KEY);
      localStorage.removeItem(PLAYER_WORLD_STATE_KEY);
      localStorage.removeItem(CAMPSITE_KEY);
      localStorage.removeItem(LEGACY_CAMPSITE_KEY);
      localStorage.removeItem(COMPANION_TOKEN_KEY);
      localStorage.removeItem(FRIENDS_KEY);
      localStorage.removeItem(GIFTS_KEY);
    } catch {}
  }

  // ── Player name persistence ──

  static loadPlayerName(): string | null {
    try {
      return localStorage.getItem(NAME_KEY);
    } catch { return null; }
  }

  static savePlayerName(name: string) {
    try { localStorage.setItem(NAME_KEY, name); } catch {}
  }

  // ── QA per-tab isolation ──
  // Same-origin tabs SHARE localStorage, so two tabs would share one identity
  // (token + visitorId + friends + gifts) — making 2P A2A untestable in one
  // browser profile. In QA mode (?qa=1) we keep the per-player identity in
  // sessionStorage instead, which is per-tab, so two tabs act as two visitors.
  /** QA tooling (the sessionStorage per-tab isolation AND window.__a2a.test) is
   *  compiled in only for local dev (`npm run dev`) and preview builds
   *  (`VITE_QA_HOOKS=1`) — NEVER the public production build, so consent-bypassing
   *  test hooks never ship to real users. */
  static qaHooksAllowed(): boolean {
    return __A2A_QA__;
  }
  private static qaMode(): boolean {
    if (!__A2A_QA__) return false;
    try {
      return new URLSearchParams(window.location.search).has("qa") ||
        localStorage.getItem("a2a_qa") === "1";
    } catch { return false; }
  }
  /** Storage for per-player identity: sessionStorage in QA mode, else localStorage. */
  private static idStore(): Storage {
    try { return ProgressionManager.qaMode() ? window.sessionStorage : window.localStorage; }
    catch { return window.localStorage; }
  }

  // ── Pouchy companion token persistence (opt-in; local only) ──

  static loadCompanionToken(): string | null {
    try {
      const t = ProgressionManager.idStore().getItem(COMPANION_TOKEN_KEY);
      return t && t.trim() ? t.trim() : null;
    } catch { return null; }
  }

  static saveCompanionToken(token: string) {
    try { ProgressionManager.idStore().setItem(COMPANION_TOKEN_KEY, token.trim()); } catch {}
  }

  static clearCompanionToken() {
    try { ProgressionManager.idStore().removeItem(COMPANION_TOKEN_KEY); } catch {}
  }

  static loadCompanionAutoVoice(): boolean {
    try {
      const v = localStorage.getItem("globefly_companion_autovoice");
      if (v === "1") return true;
      if (v === "0") return false;
      // No explicit choice yet: default ON when a companion token is already
      // bound, so a connected player gets voice auto-connected without opting in.
      return ProgressionManager.loadCompanionToken() != null;
    } catch { return false; }
  }

  static saveCompanionAutoVoice(on: boolean) {
    try { localStorage.setItem("globefly_companion_autovoice", on ? "1" : "0"); } catch {}
  }

  /** Stable, anonymous per-browser id used as the A2A pairing `visitorId`
   *  (never the secret token). Created on first use. */
  static loadOrCreateVisitorId(): string {
    try {
      const store = ProgressionManager.idStore();
      // QA: allow a deterministic per-tab id via ?vid=… so two tabs are two visitors.
      if (ProgressionManager.qaMode()) {
        const vid = new URLSearchParams(window.location.search).get("vid");
        if (vid) { store.setItem("globefly_visitor_id", vid); return vid; }
      }
      let id = store.getItem("globefly_visitor_id");
      if (!id) {
        id = "v_" + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
        store.setItem("globefly_visitor_id", id);
      }
      return id;
    } catch {
      return "v_anon";
    }
  }

  /** A2A friends we've paired with in-game (by stable non-secret visitorId), so we
   *  can show a roster with online status. Tokens are NEVER stored here. */
  static loadFriends(): CompanionFriend[] {
    try {
      const raw = ProgressionManager.idStore().getItem(FRIENDS_KEY);
      if (raw) return JSON.parse(raw) as CompanionFriend[];
    } catch {}
    return [];
  }

  /** Record (or refresh) a paired A2A friend. Dedupes by visitorId. */
  static addFriend(friend: CompanionFriend) {
    if (!friend.visitorId) return;
    try {
      const all = ProgressionManager.loadFriends().filter((f) => f.visitorId !== friend.visitorId);
      all.unshift(friend);
      ProgressionManager.idStore().setItem(FRIENDS_KEY, JSON.stringify(all.slice(0, 100)));
    } catch {}
  }

  /** Grow the friendship bond with a paired friend. Returns the new level (or -1
   *  if the friend isn't in the roster). */
  static addBond(visitorId: string, amount: number): number {
    if (!visitorId || amount <= 0) return -1;
    try {
      const all = ProgressionManager.loadFriends();
      const f = all.find((x) => x.visitorId === visitorId);
      if (!f) return -1;
      const before = friendBondLevel(f.bond);
      f.bond = (f.bond ?? 0) + amount;
      ProgressionManager.idStore().setItem(FRIENDS_KEY, JSON.stringify(all.slice(0, 100)));
      const after = friendBondLevel(f.bond);
      return after > before ? after : friendBondLevel(f.bond);
    } catch {
      return -1;
    }
  }

  /** Sky gifts other companions have sent us (most recent first). */
  static loadReceivedGifts(): ReceivedGift[] {
    try {
      const raw = ProgressionManager.idStore().getItem(GIFTS_KEY);
      if (raw) return JSON.parse(raw) as ReceivedGift[];
    } catch {}
    return [];
  }

  static addReceivedGift(g: ReceivedGift) {
    try {
      const all = ProgressionManager.loadReceivedGifts();
      all.unshift(g);
      ProgressionManager.idStore().setItem(GIFTS_KEY, JSON.stringify(all.slice(0, 200)));
    } catch {}
  }

  static loadPlayerWorldState(): SavedPlayerWorldState {
    try {
      const raw = localStorage.getItem(PLAYER_WORLD_STATE_KEY);
      if (raw) return JSON.parse(raw) as SavedPlayerWorldState;
    } catch {}
    return {};
  }

  static savePlayerWorldState(state: SavedPlayerWorldState) {
    try { localStorage.setItem(PLAYER_WORLD_STATE_KEY, JSON.stringify(state)); } catch {}
  }
}
