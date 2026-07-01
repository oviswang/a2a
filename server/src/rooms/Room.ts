import type { Socket } from "socket.io";
import { Quaternion, Vector3 } from "three";
import type {
  FlagCaptureEndEvent,
  FlagCaptureStartEvent,
  FlagCollectedEvent,
  FlagDroppedEvent,
  FlagSpawnedEvent,
  FlagStolenEvent,
  FlagSyncEvent,
  PaintballFiredEvent,
  PaintballHitEvent,
  PaintballUpgradeFlags,
  PlayerState,
  ServerToClientEvents,
  ClientToServerEvents,
  Vehicle,
  WorldObjectiveState,
  BrazierSlot,
  ObjectiveBrazierEvent,
  LeviathanState,
} from "@globefly/shared";

// Shared co-op objective constants — keep in sync with shared/types.ts (the server
// imports shared TYPES but, like the flag/paintball constants, keeps its own value
// copies so it never runtime-imports values from the shared source package).
const BRAZIER_COUNT = 5;
const MOONSTONE_RUIN_COUNT = 2;
const BRAZIER_BURN_MS = 45_000;
const BRAZIER_MOON_PAUSE_MS = 60_000;
const MOON_DURATION_MS = 300_000;
// Co-op Leviathan hunt (keep in sync with shared/types.ts).
const LEVIATHAN_MAX_HP_BASE = 100;
const LEVIATHAN_HP_PER_PLAYER = 40;
const LEVIATHAN_DURATION_MS = 180_000;
const LEVIATHAN_ENGAGE_WINDOW_MS = 4_000;
const LEVIATHAN_HIT_DAMAGE = 4;
const LEVIATHAN_MIN_HUNTERS = 2;
const LEVIATHAN_HIT_COOLDOWN_MS = 700;
const LEVIATHAN_HAUL_RADIUS = 1.1;
/** Wait this long after a giant leaves before another may surface. */
const LEVIATHAN_COOLDOWN_MS = 60_000;
import {
  FLAG_AUTO_RESPAWN_MS,
  FLAG_CAPTURE_DURATION_MS,
  FLAG_CAPTURE_GRACE_MS,
  FLAG_CAPTURE_RADIUS,
  FLAG_COLLECT_RADIUS,
  FLAG_HOVER_ALTITUDE,
  FLAG_IMMUNITY_MS,
  FLAG_SPAWN_DELAY_MS,
} from "../flagConstants.js";
import {
  PAINTBALL_BURST_WINDOW_MS,
  PAINTBALL_COOLDOWN_MS,
  PAINTBALL_RANGE_MULT_MAX,
  PAINTBALL_SPEED_MULT_MAX,
} from "../paintball/constants.js";
import { cartesianFromSpherical, computePaintballShot } from "../paintball/hitTest.js";
import { surfaceDisplacementAt } from "../terrain/TerrainSurface.js";

const REF_UP = new Vector3(0, 1, 0);

interface PaintballUpgradeRecord {
  doubleTap: boolean;
  speedMult: number;
  rangeMult: number;
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

interface ConnectedPlayer {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  state: PlayerState;
}

interface ChallengerEntry {
  startMs: number;
  outOfRangeSinceMs: number | null;
}

type HotFlagMode = "inactive" | "free" | "held";

function isFlagVehicle(vehicle: Vehicle | undefined): boolean {
  return vehicle === "carpet" || vehicle === undefined || vehicle === "plane";
}

function randomUnitQuaternion(target: Quaternion): Quaternion {
  const u1 = Math.random();
  const u2 = Math.random() * Math.PI * 2;
  const u3 = Math.random() * Math.PI * 2;
  const sq1 = Math.sqrt(1 - u1);
  const sq2 = Math.sqrt(u1);
  return target.set(
    sq1 * Math.sin(u2),
    sq1 * Math.cos(u2),
    sq2 * Math.sin(u3),
    sq2 * Math.cos(u3),
  );
}

const _qFlag = new Quaternion();
/** Scratch for flag spawn / drop / free pickup only — never alias two live positions in one scope. */
const _vFlag = new Vector3();
const _vCarrier = new Vector3();
const _vOtherPlayer = new Vector3();
/** Scratch reserved for Leviathan math (never aliased with the flag scratch). */
const _qLev = new Quaternion();
const _vLevA = new Vector3();
const _vLevB = new Vector3();

function playerWorldPos(state: PlayerState, globeRadius: number, out: Vector3): Vector3 {
  _qFlag.set(state.qx, state.qy, state.qz, state.qw);
  return out.copy(cartesianFromSpherical(_qFlag, state.altitude, globeRadius));
}

/** A player's position projected onto the unit sphere (altitude ignored). */
function playerUnitPos(state: PlayerState, out: Vector3): Vector3 {
  _qLev.set(state.qx, state.qy, state.qz, state.qw);
  return out.copy(REF_UP).applyQuaternion(_qLev).normalize();
}

// Soft per-room cap. The relay broadcasts each player's full state to every other
// player ~20x/s, so traffic grows ~O(N²); 30 keeps it reasonable while raising A2A
// density. Going much higher (50+) would want area-of-interest culling first.
export const MAX_PLAYERS = 30;

export class Room {
  readonly slug: string;
  /** World globe radius — used for paintball raycast (matches Prisma world row). */
  readonly globeRadius: number;
  /** Matches client Globe terrain (Prisma `World.seed`). */
  readonly worldSeed: number;
  /** Matches client terrain preset id (Prisma `World.terrainType`). */
  readonly terrainType: string;
  private players = new Map<string, ConnectedPlayer>();
  /** Rolling pair of the two most recent paintball shot timestamps per socket (ms). */
  private paintballShotHistory = new Map<string, number[]>();
  /** Client-reported paintball upgrade flags per socket (server validates / clamps). */
  private paintballUpgrades = new Map<string, PaintballUpgradeRecord>();
  /** Players temporarily outside world-space flag play (e.g. carpet cosmic void). */
  private flagSuppressedPlayers = new Set<string>();

  private hotFlagMode: HotFlagMode = "inactive";
  private hotFlagX = 0;
  private hotFlagY = 0;
  private hotFlagZ = 0;
  private hotFlagHolderId: string | null = null;
  private hotFlagImmuneUntilMs = 0;
  private hotFlagChallengers = new Map<string, ChallengerEntry>();
  private hotFlagSpawnTimer: ReturnType<typeof setTimeout> | null = null;
  private hotFlagFreeRespawnTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Shared co-op objective: one moon countdown + five braziers for the whole room ──
  private braziers: BrazierSlot[] = Array.from({ length: BRAZIER_COUNT }, () => ({
    lit: false,
    eternal: false,
    burnEndsAt: null,
  }));
  private moonElapsedMs = 0;
  /** Epoch ms a temporary all-five-lit pause ends; null = not paused. */
  private moonPauseEndsAt: number | null = null;
  private moonFrozen = false;
  private objectiveSaved = false;
  private objectiveTimer: ReturnType<typeof setInterval> | null = null;
  private lastObjectiveSyncMs = 0;
  private static readonly OBJECTIVE_TICK_MS = 1000;
  private static readonly OBJECTIVE_SYNC_MS = 3000;

  // ── Co-op Leviathan hunt (server-authoritative shared sea giant) ──
  private leviathanActive = false;
  private leviathanHp = 0;
  private leviathanMaxHp = 0;
  /** Unit-sphere position (multiply by globeRadius for world position). */
  private readonly leviathanPos = new Vector3(0, 1, 0);
  private leviathanExpiresAt = 0;
  private leviathanCooldownUntil = 0;
  private lastLeviathanSyncMs = 0;
  private lastLeviathanHunters = 0;
  /** socketId → epoch ms of that boat's most recent haul (for engaged-hunter count). */
  private leviathanHaulers = new Map<string, number>();
  /** Display names that landed a hit this fight (for the victory shout-out). */
  private leviathanContributors = new Set<string>();

  constructor(slug: string, globeRadius: number, worldSeed: number, terrainType: string) {
    this.slug = slug;
    this.globeRadius = globeRadius;
    this.worldSeed = worldSeed;
    this.terrainType = terrainType;
  }

  get playerCount() {
    return this.players.size;
  }

  get isEmpty() {
    return this.players.size === 0;
  }

  get isFull() {
    return this.players.size >= MAX_PLAYERS;
  }

  /** How many present players have a Pouchy companion (for A2A rendezvous). */
  get companionCount(): number {
    let n = 0;
    for (const { state } of this.players.values()) if (state.hasCompanion) n++;
    return n;
  }

  /** A co-present player by socket id (for same-room A2A pairing relay). */
  getPlayer(id: string): ConnectedPlayer | undefined {
    return this.players.get(id);
  }

  private broadcastFlagSpawned(ev: FlagSpawnedEvent) {
    for (const [, p] of this.players) {
      p.socket.emit("flag:spawned", ev);
    }
  }

  private broadcastFlagCollected(ev: FlagCollectedEvent) {
    for (const [, p] of this.players) {
      p.socket.emit("flag:collected", ev);
    }
  }

  private broadcastFlagCaptureStart(ev: FlagCaptureStartEvent) {
    for (const [, p] of this.players) {
      p.socket.emit("flag:capture_start", ev);
    }
  }

  private broadcastFlagCaptureEnd(ev: FlagCaptureEndEvent) {
    for (const [, p] of this.players) {
      p.socket.emit("flag:capture_end", ev);
    }
  }

  private broadcastFlagStolen(ev: FlagStolenEvent) {
    for (const [, p] of this.players) {
      p.socket.emit("flag:stolen", ev);
    }
  }

  private broadcastFlagDropped(ev: FlagDroppedEvent) {
    for (const [, p] of this.players) {
      p.socket.emit("flag:dropped", ev);
    }
  }

  private broadcastFlagCleared() {
    for (const [, p] of this.players) {
      p.socket.emit("flag:cleared");
    }
  }

  private clearHotFlagTimers() {
    if (this.hotFlagSpawnTimer != null) {
      clearTimeout(this.hotFlagSpawnTimer);
      this.hotFlagSpawnTimer = null;
    }
    if (this.hotFlagFreeRespawnTimer != null) {
      clearTimeout(this.hotFlagFreeRespawnTimer);
      this.hotFlagFreeRespawnTimer = null;
    }
  }

  private clearAllChallengersWithBroadcast() {
    for (const id of this.hotFlagChallengers.keys()) {
      this.broadcastFlagCaptureEnd({ challengerId: id });
    }
    this.hotFlagChallengers.clear();
  }

  private startFreeFlagRespawnTimer() {
    if (this.hotFlagFreeRespawnTimer != null) {
      clearTimeout(this.hotFlagFreeRespawnTimer);
      this.hotFlagFreeRespawnTimer = null;
    }
    this.hotFlagFreeRespawnTimer = setTimeout(() => {
      this.hotFlagFreeRespawnTimer = null;
      if (this.hotFlagMode !== "free" || this.players.size === 0) return;
      this.spawnHotFlagAtRandomPosition();
    }, FLAG_AUTO_RESPAWN_MS);
  }

  private spawnHotFlagAtRandomPosition() {
    randomUnitQuaternion(_qFlag);
    _vFlag.copy(REF_UP).applyQuaternion(_qFlag).normalize();
    const surfaceAlt = surfaceDisplacementAt(
      this.worldSeed,
      this.terrainType,
      _vFlag.x,
      _vFlag.y,
      _vFlag.z,
    );
    const pos = cartesianFromSpherical(_qFlag, surfaceAlt + FLAG_HOVER_ALTITUDE, this.globeRadius);
    this.hotFlagMode = "free";
    this.hotFlagX = pos.x;
    this.hotFlagY = pos.y;
    this.hotFlagZ = pos.z;
    this.hotFlagHolderId = null;
    this.hotFlagImmuneUntilMs = 0;
    this.clearAllChallengersWithBroadcast();
    this.broadcastFlagSpawned({ x: pos.x, y: pos.y, z: pos.z });
    this.startFreeFlagRespawnTimer();
  }

  private scheduleHotFlagSpawnIfNeeded() {
    if (this.players.size < 2) return;
    if (this.hotFlagMode !== "inactive") return;
    if (this.hotFlagSpawnTimer != null) return;
    this.hotFlagSpawnTimer = setTimeout(() => {
      this.hotFlagSpawnTimer = null;
      if (this.players.size < 2) return;
      this.spawnHotFlagAtRandomPosition();
    }, FLAG_SPAWN_DELAY_MS);
  }

  // ── Shared co-op objective ────────────────────────────────────────────────
  private buildObjectiveState(): WorldObjectiveState {
    const now = Date.now();
    return {
      moonElapsedMs: this.moonElapsedMs,
      moonDurationMs: MOON_DURATION_MS,
      paused: this.moonPauseEndsAt != null && now < this.moonPauseEndsAt,
      pauseEndsAt: this.moonPauseEndsAt,
      frozen: this.moonFrozen,
      saved: this.objectiveSaved,
      braziers: this.braziers.map((b) => ({ ...b })),
    };
  }

  private broadcastObjectiveSync() {
    this.lastObjectiveSyncMs = Date.now();
    const state = this.buildObjectiveState();
    for (const [, p] of this.players) p.socket.emit("objective:sync", state);
  }

  private broadcastObjectiveBrazier(ev: ObjectiveBrazierEvent) {
    for (const [, p] of this.players) p.socket.emit("objective:brazier", ev);
  }

  private startObjectiveTimerIfNeeded() {
    if (this.objectiveTimer != null || this.players.size === 0) return;
    this.objectiveTimer = setInterval(() => this.tickObjective(), Room.OBJECTIVE_TICK_MS);
  }

  private clearObjectiveTimer() {
    if (this.objectiveTimer != null) {
      clearInterval(this.objectiveTimer);
      this.objectiveTimer = null;
    }
  }

  /** Reset the shared objective for a fresh attempt (on a shared loss, or when the
   *  room empties so a future session starts clean). */
  private resetObjective() {
    this.moonElapsedMs = 0;
    this.moonPauseEndsAt = null;
    this.moonFrozen = false;
    this.objectiveSaved = false;
    for (const b of this.braziers) {
      b.lit = false;
      b.eternal = false;
      b.burnEndsAt = null;
    }
  }

  private tickObjective() {
    if (this.players.size === 0) return;
    const now = Date.now();
    this.tickLeviathan(now);
    let changed = false;

    // Expire temporary brazier flames.
    for (let i = 0; i < this.braziers.length; i++) {
      const b = this.braziers[i]!;
      if (b.lit && !b.eternal && b.burnEndsAt != null && now >= b.burnEndsAt) {
        b.lit = false;
        b.burnEndsAt = null;
        this.broadcastObjectiveBrazier({ index: i, lit: false, eternal: false });
        changed = true;
      }
    }

    if (!this.moonFrozen && !this.objectiveSaved) {
      const stillPaused = this.moonPauseEndsAt != null && now < this.moonPauseEndsAt;
      if (this.moonPauseEndsAt != null && now >= this.moonPauseEndsAt) {
        this.moonPauseEndsAt = null;
        changed = true;
      }
      if (!stillPaused) {
        this.moonElapsedMs += Room.OBJECTIVE_TICK_MS;
        if (this.moonElapsedMs >= MOON_DURATION_MS) {
          // Shared loss — the whole room fails together, then the objective rewinds.
          for (const [, p] of this.players) p.socket.emit("world:lost");
          this.resetObjective();
          this.broadcastObjectiveSync();
          return;
        }
      }
    }

    if (changed || now - this.lastObjectiveSyncMs >= Room.OBJECTIVE_SYNC_MS) {
      this.broadcastObjectiveSync();
    }
  }

  /** A player flew into brazier `index` and lit it (eternal = spent an Eternal Flame).
   *  Applies it to the shared state, broadcasts, and resolves win/pause. Returns whether
   *  it was accepted (rejected when already eternal / already-lit-and-only-temp, so the
   *  caller can refund a wasted flame on a simultaneous-light race). */
  lightBrazier(socketId: string, index: number, eternal: boolean): { accepted: boolean } {
    if (!this.players.has(socketId)) return { accepted: false };
    if (!Number.isInteger(index) || index < 0 || index >= BRAZIER_COUNT) return { accepted: false };
    if (this.objectiveSaved || this.moonFrozen) return { accepted: false };
    const b = this.braziers[index]!;
    // Already permanent → nothing to do. Already temp-lit and this is only temp → no-op.
    if (b.eternal) return { accepted: false };
    if (b.lit && !eternal) return { accepted: false };

    const now = Date.now();
    b.lit = true;
    b.eternal = !!eternal;
    b.burnEndsAt = b.eternal ? null : now + BRAZIER_BURN_MS;
    const by = this.players.get(socketId)?.state.name;
    this.broadcastObjectiveBrazier({ index, lit: true, eternal: b.eternal, by });

    const allEternal = this.braziers.every((x) => x.lit && x.eternal);
    const allLit = this.braziers.every((x) => x.lit);
    if (allEternal) {
      this.objectiveSaved = true;
      this.moonFrozen = true;
      this.moonPauseEndsAt = null;
      for (const [, p] of this.players) p.socket.emit("world:saved", { method: "eternal_flames" });
    } else if (allLit) {
      this.moonPauseEndsAt = now + BRAZIER_MOON_PAUSE_MS;
    }
    this.broadcastObjectiveSync();
    return { accepted: true };
  }

  // ── Co-op Leviathan hunt ──────────────────────────────────────────────────
  private buildLeviathanState(): LeviathanState | null {
    if (!this.leviathanActive) return null;
    return {
      active: true,
      hp: this.leviathanHp,
      maxHp: this.leviathanMaxHp,
      x: this.leviathanPos.x,
      y: this.leviathanPos.y,
      z: this.leviathanPos.z,
      hunters: this.leviathanHaulers.size,
      expiresAt: this.leviathanExpiresAt,
    };
  }

  private broadcastLeviathanSync() {
    this.lastLeviathanSyncMs = Date.now();
    this.lastLeviathanHunters = this.leviathanHaulers.size;
    const state = this.buildLeviathanState();
    for (const [, p] of this.players) p.socket.emit("leviathan:sync", state);
  }

  /** Runs each objective tick; spawns / expires / re-syncs the shared giant. */
  private tickLeviathan(now: number) {
    if (this.leviathanActive) {
      for (const [id, t] of this.leviathanHaulers) {
        if (now - t > LEVIATHAN_ENGAGE_WINDOW_MS) this.leviathanHaulers.delete(id);
      }
      if (now >= this.leviathanExpiresAt) {
        this.fleeLeviathan();
        return;
      }
      if (
        this.leviathanHaulers.size !== this.lastLeviathanHunters ||
        now - this.lastLeviathanSyncMs >= Room.OBJECTIVE_SYNC_MS
      ) {
        this.broadcastLeviathanSync();
      }
    } else {
      this.maybeSpawnLeviathan(now);
    }
  }

  private maybeSpawnLeviathan(now: number) {
    if (now < this.leviathanCooldownUntil) return;
    const boats = Array.from(this.players.values()).filter((p) => p.state.vehicle === "boat");
    if (boats.length < LEVIATHAN_MIN_HUNTERS) return;
    const anchor = boats[Math.floor(Math.random() * boats.length)]!;
    this.spawnLeviathanNear(anchor.state, boats.length);
  }

  /** Surface a giant next to `anchor` (guaranteed reachable ocean), nudged off the hull. */
  private spawnLeviathanNear(anchor: PlayerState, boatCount: number) {
    playerUnitPos(anchor, _vLevA);
    randomUnitQuaternion(_qLev);
    _vLevB.copy(REF_UP).applyQuaternion(_qLev);
    _vLevB.addScaledVector(_vLevA, -_vLevB.dot(_vLevA)); // project to tangent plane
    if (_vLevB.lengthSq() < 1e-6) _vLevB.set(1, 0, 0);
    _vLevB.normalize();
    this.leviathanPos.copy(_vLevA).addScaledVector(_vLevB, 0.25).normalize();

    this.leviathanMaxHp = LEVIATHAN_MAX_HP_BASE + LEVIATHAN_HP_PER_PLAYER * Math.max(1, boatCount);
    this.leviathanHp = this.leviathanMaxHp;
    this.leviathanActive = true;
    this.leviathanExpiresAt = Date.now() + LEVIATHAN_DURATION_MS;
    this.leviathanHaulers.clear();
    this.leviathanContributors.clear();
    this.broadcastLeviathanSync();
  }

  /** A boat reports it's hauling the giant. Server validates range + the co-op
   *  min-hunters rule + a per-boat rate limit before applying any damage. */
  haulLeviathan(socketId: string) {
    if (!this.leviathanActive) return;
    const player = this.players.get(socketId);
    if (!player) return;
    if (player.state.vehicle !== "boat") return;
    playerUnitPos(player.state, _vLevA);
    const chord = _vLevA.distanceTo(this.leviathanPos) * this.globeRadius;
    if (chord > LEVIATHAN_HAUL_RADIUS) return;

    const now = Date.now();
    const last = this.leviathanHaulers.get(socketId) ?? 0;
    this.leviathanHaulers.set(socketId, now);
    const hunters = this.leviathanHaulers.size;

    if (hunters >= LEVIATHAN_MIN_HUNTERS && now - last >= LEVIATHAN_HIT_COOLDOWN_MS) {
      this.leviathanHp = Math.max(0, this.leviathanHp - LEVIATHAN_HIT_DAMAGE);
      const nm = player.state.name;
      if (nm) this.leviathanContributors.add(nm);
      if (this.leviathanHp <= 0) {
        this.defeatLeviathan();
        return;
      }
      this.broadcastLeviathanSync();
    } else if (hunters !== this.lastLeviathanHunters) {
      this.broadcastLeviathanSync();
    }
  }

  private defeatLeviathan() {
    const hunters = Array.from(this.leviathanContributors);
    for (const [, p] of this.players) p.socket.emit("leviathan:defeated", { hunters });
    this.clearLeviathan(true);
  }

  private fleeLeviathan() {
    for (const [, p] of this.players) p.socket.emit("leviathan:fled");
    this.clearLeviathan(true);
  }

  private clearLeviathan(withCooldown: boolean) {
    this.leviathanActive = false;
    this.leviathanHp = 0;
    this.leviathanHaulers.clear();
    this.leviathanContributors.clear();
    this.lastLeviathanHunters = 0;
    if (withCooldown) this.leviathanCooldownUntil = Date.now() + LEVIATHAN_COOLDOWN_MS;
    this.broadcastLeviathanSync();
  }

  /** Carpet co-op: relay a moonstone lift to the rest of the room so a teammate
   *  raising the other stone can trigger the shared union on both clients. */
  relayMoonstoneLift(fromSocketId: string, index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= MOONSTONE_RUIN_COUNT) return;
    for (const [id, p] of this.players) {
      if (id === fromSocketId) continue;
      p.socket.emit("moonstone:lifted", { index, fromId: fromSocketId });
    }
  }

  forceFlagSpawn() {
    if (this.hotFlagSpawnTimer != null) {
      clearTimeout(this.hotFlagSpawnTimer);
      this.hotFlagSpawnTimer = null;
    }
    this.spawnHotFlagAtRandomPosition();
  }

  setFlagSuppressed(socketId: string, suppressed: boolean) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (suppressed) {
      this.flagSuppressedPlayers.add(socketId);
      if (this.hotFlagChallengers.delete(socketId)) {
        this.broadcastFlagCaptureEnd({ challengerId: socketId });
      }
      if (this.hotFlagMode === "held" && this.hotFlagHolderId === socketId) {
        this.dropFlagFromHolder(player.state);
      }
      return;
    }

    this.flagSuppressedPlayers.delete(socketId);
    this.scheduleHotFlagSpawnIfNeeded();
  }

  private buildFlagSync(): FlagSyncEvent {
    if (this.hotFlagMode === "inactive") {
      return { free: false };
    }
    if (this.hotFlagMode === "free") {
      return { free: true, x: this.hotFlagX, y: this.hotFlagY, z: this.hotFlagZ };
    }
    const holder = this.hotFlagHolderId ? this.players.get(this.hotFlagHolderId) : undefined;
    return {
      free: false,
      holderId: this.hotFlagHolderId ?? undefined,
      holderName: holder?.state.name,
      immuneUntilMs: this.hotFlagImmuneUntilMs,
    };
  }

  private dropFlagFromHolder(state: PlayerState) {
    const pos = playerWorldPos(state, this.globeRadius, _vFlag);
    this.hotFlagMode = "free";
    this.hotFlagX = pos.x;
    this.hotFlagY = pos.y;
    this.hotFlagZ = pos.z;
    this.hotFlagHolderId = null;
    this.hotFlagImmuneUntilMs = 0;
    this.clearAllChallengersWithBroadcast();
    this.broadcastFlagDropped({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      droppedById: state.id,
      droppedByName: state.name,
    });
    this.startFreeFlagRespawnTimer();
  }

  private processHotFlagAfterMove() {
    const now = Date.now();

    if (this.hotFlagMode === "free") {
      for (const [id, pl] of this.players) {
        if (this.flagSuppressedPlayers.has(id)) continue;
        if (!isFlagVehicle(pl.state.vehicle)) continue;
        const ppos = playerWorldPos(pl.state, this.globeRadius, _vFlag);
        const dx = ppos.x - this.hotFlagX;
        const dy = ppos.y - this.hotFlagY;
        const dz = ppos.z - this.hotFlagZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < FLAG_COLLECT_RADIUS) {
          if (this.hotFlagFreeRespawnTimer != null) {
            clearTimeout(this.hotFlagFreeRespawnTimer);
            this.hotFlagFreeRespawnTimer = null;
          }
          this.hotFlagMode = "held";
          this.hotFlagHolderId = id;
          this.hotFlagImmuneUntilMs = 0;
          this.clearAllChallengersWithBroadcast();
          this.broadcastFlagCollected({ holderId: id, holderName: pl.state.name });
          return;
        }
      }
      return;
    }

    if (this.hotFlagMode !== "held" || !this.hotFlagHolderId) return;

    const carrier = this.players.get(this.hotFlagHolderId);
    if (!carrier) {
      this.hotFlagMode = "inactive";
      this.hotFlagHolderId = null;
      this.clearAllChallengersWithBroadcast();
      return;
    }

    playerWorldPos(carrier.state, this.globeRadius, _vCarrier);
    const immune = now < this.hotFlagImmuneUntilMs;

    for (const [cid, entry] of [...this.hotFlagChallengers.entries()]) {
      const ch = this.players.get(cid);
      if (!ch || this.flagSuppressedPlayers.has(cid) || !isFlagVehicle(ch.state.vehicle)) {
        this.hotFlagChallengers.delete(cid);
        this.broadcastFlagCaptureEnd({ challengerId: cid });
        continue;
      }
      const cpos = playerWorldPos(ch.state, this.globeRadius, _vOtherPlayer);
      const dx = cpos.x - _vCarrier.x;
      const dy = cpos.y - _vCarrier.y;
      const dz = cpos.z - _vCarrier.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const inRange = dist < FLAG_CAPTURE_RADIUS && !immune;

      if (inRange) {
        entry.outOfRangeSinceMs = null;
        if (now - entry.startMs >= FLAG_CAPTURE_DURATION_MS) {
          const newHolderId = cid;
          const newHolder = ch;
          const previousHolderId = this.hotFlagHolderId!;
          const previousHolderName = carrier.state.name;
          const losers = [...this.hotFlagChallengers.keys()].filter((x) => x !== newHolderId);
          this.hotFlagHolderId = newHolderId;
          this.hotFlagImmuneUntilMs = now + FLAG_IMMUNITY_MS;
          for (const oid of losers) {
            this.broadcastFlagCaptureEnd({ challengerId: oid });
          }
          this.hotFlagChallengers.clear();
          this.broadcastFlagStolen({
            newHolderId,
            newHolderName: newHolder.state.name,
            previousHolderId,
            previousHolderName,
            immuneUntilMs: this.hotFlagImmuneUntilMs,
          });
          return;
        }
      } else {
        if (entry.outOfRangeSinceMs == null) {
          entry.outOfRangeSinceMs = now;
        } else if (now - entry.outOfRangeSinceMs >= FLAG_CAPTURE_GRACE_MS) {
          this.hotFlagChallengers.delete(cid);
          this.broadcastFlagCaptureEnd({ challengerId: cid });
        }
      }
    }

    if (immune) return;

    for (const [id, pl] of this.players) {
      if (id === this.hotFlagHolderId) continue;
      if (this.flagSuppressedPlayers.has(id)) continue;
      if (!isFlagVehicle(pl.state.vehicle)) continue;
      if (this.hotFlagChallengers.has(id)) continue;
      const ppos = playerWorldPos(pl.state, this.globeRadius, _vOtherPlayer);
      const dx = ppos.x - _vCarrier.x;
      const dy = ppos.y - _vCarrier.y;
      const dz = ppos.z - _vCarrier.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < FLAG_CAPTURE_RADIUS) {
        const startMs = Date.now();
        this.hotFlagChallengers.set(id, { startMs, outOfRangeSinceMs: null });
        this.broadcastFlagCaptureStart({
          challengerId: id,
          challengerName: pl.state.name,
          startMs,
        });
      }
    }
  }

  addPlayer(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    name: string,
    vehicle: Vehicle = "plane",
    hasCompanion = false,
  ): PlayerState | null {
    if (this.isFull) return null;
    const state: PlayerState = {
      id: socket.id,
      name,
      vehicle,
      hasCompanion,
      qx: 0,
      qy: 0,
      qz: 0,
      qw: 1,
      heading: 0,
      pitch: 0,
      altitude: 0.55,
      speed: 1.0,
      bankAngle: 0,
      rollAngle: 0,
      timestamp: Date.now(),
    };

    this.players.set(socket.id, { socket, state });

    // Notify existing players
    for (const [id, player] of this.players) {
      if (id !== socket.id) {
        player.socket.emit("player:joined", state);
      }
    }

    // Send current world state to the new player
    const allPlayers = Array.from(this.players.values())
      .filter((p) => p.socket.id !== socket.id)
      .map((p) => p.state);
    socket.emit("world:state", allPlayers);
    socket.emit("flag:sync", this.buildFlagSync());
    // Shared co-op objective: hand the joiner the room's current moon + brazier state
    // (so a late joiner inherits the in-progress countdown), and run the moon timer.
    socket.emit("objective:sync", this.buildObjectiveState());
    socket.emit("leviathan:sync", this.buildLeviathanState());
    this.startObjectiveTimerIfNeeded();

    this.scheduleHotFlagSpawnIfNeeded();

    return state;
  }

  removePlayer(socketId: string) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (this.hotFlagChallengers.has(socketId)) {
      this.hotFlagChallengers.delete(socketId);
      this.broadcastFlagCaptureEnd({ challengerId: socketId });
    }

    if (this.hotFlagMode === "held" && this.hotFlagHolderId === socketId) {
      this.dropFlagFromHolder(player.state);
    }

    this.players.delete(socketId);
    this.paintballShotHistory.delete(socketId);
    this.paintballUpgrades.delete(socketId);
    this.flagSuppressedPlayers.delete(socketId);
    this.leviathanHaulers.delete(socketId);
    // Drop an active giant when the world empties so a future session starts clean.
    if (this.players.size === 0 && this.leviathanActive) this.clearLeviathan(false);

    for (const [, p] of this.players) {
      p.socket.emit("player:left", socketId);
    }

    if (this.players.size === 0) {
      this.clearHotFlagTimers();
      this.hotFlagMode = "inactive";
      this.hotFlagHolderId = null;
      this.hotFlagImmuneUntilMs = 0;
      this.clearAllChallengersWithBroadcast();
      // Stop the moon while empty, but KEEP the shared objective state: a player who
      // briefly leaves and rejoins within the room's TTL (e.g. switching vehicle) keeps
      // their moon/brazier progress. The state is discarded only when the empty room is
      // deleted (RoomManager EMPTY_ROOM_TTL) — a fresh Room then starts a fresh objective.
      this.clearObjectiveTimer();
      return;
    }

    if (this.players.size < 2 && this.hotFlagSpawnTimer != null) {
      clearTimeout(this.hotFlagSpawnTimer);
      this.hotFlagSpawnTimer = null;
    }
  }

  /** Client pushes its paintball upgrade flags so the hit test / cooldown mirror them. */
  setPaintballUpgrades(socketId: string, flags: PaintballUpgradeFlags) {
    if (!this.players.has(socketId)) return;
    if (!flags || typeof flags !== "object") return;
    const record: PaintballUpgradeRecord = {
      doubleTap: flags.doubleTap === true,
      speedMult: clamp(Number(flags.speedMult) || 1, 1, PAINTBALL_SPEED_MULT_MAX),
      rangeMult: clamp(Number(flags.rangeMult) || 1, 1, PAINTBALL_RANGE_MULT_MAX),
    };
    this.paintballUpgrades.set(socketId, record);
  }

  /** Server-authoritative paintball: validates cooldown and vehicle; broadcasts to room. */
  firePaintball(socketId: string) {
    const me = this.players.get(socketId);
    if (!me) return;

    const veh = me.state.vehicle === "boat" ? "boat" : me.state.vehicle === "carpet" ? "carpet" : "plane";
    if (veh !== "plane") return;

    const now = Date.now();
    const upgrades = this.paintballUpgrades.get(socketId);
    const doubleTap = upgrades?.doubleTap === true;
    const speedMult = upgrades ? upgrades.speedMult : 1;
    const rangeMult = upgrades ? upgrades.rangeMult : 1;

    const history = this.paintballShotHistory.get(socketId) ?? [];
    const last1 = history[history.length - 1] ?? 0;
    const last2 = history[history.length - 2] ?? 0;

    if (doubleTap) {
      // Burst allowed: up to 2 shots per PAINTBALL_BURST_WINDOW_MS; no sub-cooldown between shot 1 and shot 2.
      if (last2 > 0 && now - last2 < PAINTBALL_BURST_WINDOW_MS) return;
    } else {
      // Classic single-shot cooldown.
      if (now - last1 < PAINTBALL_COOLDOWN_MS) return;
    }

    history.push(now);
    if (history.length > 2) history.splice(0, history.length - 2);
    this.paintballShotHistory.set(socketId, history);

    const others = Array.from(this.players.entries())
      .filter(([id]) => id !== socketId)
      .map(([id, p]) => ({ id, state: p.state }));

    const result = computePaintballShot(me.state, socketId, others, this.globeRadius, {
      speedMult,
      rangeMult,
    });

    const firedPayload: PaintballFiredEvent = {
      shooterId: socketId,
      ...result.fired,
    };
    for (const [, p] of this.players) {
      p.socket.emit("paintball:fired", firedPayload);
    }

    if (result.hit) {
      const hitPayload: PaintballHitEvent = {
        shooterId: socketId,
        victimId: result.hit.victimId,
        color: result.hit.color,
        splatSeed: result.hit.splatSeed,
      };
      for (const [, p] of this.players) {
        p.socket.emit("paintball:hit", hitPayload);
      }
    }
  }

  updatePlayer(socketId: string, state: Omit<PlayerState, "id">) {
    const player = this.players.get(socketId);
    if (!player) return;

    const fullState: PlayerState = {
      ...state,
      id: socketId,
      name: player.state.name,
      vehicle: state.vehicle || player.state.vehicle,
      // Identity is set at join and NOT resent on every move — preserve it so it
      // isn't wiped on the first move (which would zero out the A2A companionCount).
      hasCompanion: player.state.hasCompanion,
      companionName: state.companionName ?? player.state.companionName,
      visitorId: state.visitorId ?? player.state.visitorId,
    };
    player.state = fullState;

    // Broadcast to all other players
    for (const [id, other] of this.players) {
      if (id !== socketId) {
        other.socket.emit("player:update", fullState);
      }
    }

    this.processHotFlagAfterMove();
  }
}
