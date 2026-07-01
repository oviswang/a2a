import { io, Socket } from "socket.io-client";
import type {
  FlagCaptureEndEvent,
  FlagCaptureStartEvent,
  FlagCollectedEvent,
  FlagDroppedEvent,
  FlagSpawnedEvent,
  FlagStolenEvent,
  FlagSyncEvent,
  PairRequestEvent,
  PairAnswerEvent,
  CompanionHailEvent,
  CompanionGiftEvent,
  DuoPeerEvent,
  DuoAnswerEvent,
  GhostPairInvite,
  WorldObjectiveState,
  LeviathanState,
  ObjectiveBrazierEvent,
  PaintballFiredEvent,
  PaintballHitEvent,
  PaintballUpgradeFlags,
  PlayerState,
  ServerToClientEvents,
  ClientToServerEvents,
  Vehicle,
} from "@globefly/shared";

export class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor(serverUrl: string) {
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to server:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
    });
  }

  get id(): string {
    return this.socket.id ?? "";
  }

  get connected(): boolean {
    return this.socket.connected;
  }

  joinWorld(
    slug: string,
    playerName: string,
    vehicle: Vehicle = "plane",
    reservationId?: string,
    hasCompanion = false,
    visitorId?: string,
  ) {
    this.socket.emit("world:join", slug, playerName, vehicle, reservationId, hasCompanion, visitorId);
  }

  sendMove(state: Omit<PlayerState, "id">) {
    this.socket.emit("player:move", state);
  }

  emitPaintballFire() {
    this.socket.emit("paintball:fire");
  }

  emitPaintballSetUpgrades(flags: PaintballUpgradeFlags) {
    this.socket.emit("paintball:setUpgrades", flags);
  }

  emitFlagSuppressed(suppressed: boolean) {
    this.socket.emit("flag:setSuppressed", suppressed);
  }

  forceFlagSpawn() {
    this.socket.emit("debug:forceFlagSpawn");
  }

  onPaintballFired(cb: (ev: PaintballFiredEvent) => void) {
    this.socket.on("paintball:fired", cb);
  }

  onPaintballHit(cb: (ev: PaintballHitEvent) => void) {
    this.socket.on("paintball:hit", cb);
  }

  onPlayerJoined(cb: (player: PlayerState) => void) {
    this.socket.on("player:joined", cb);
  }

  onPlayerLeft(cb: (playerId: string) => void) {
    this.socket.on("player:left", cb);
  }

  onPlayerUpdate(cb: (player: PlayerState) => void) {
    this.socket.on("player:update", cb);
  }

  onWorldState(cb: (players: PlayerState[]) => void) {
    this.socket.on("world:state", cb);
  }

  onWorldFull(cb: (slug: string) => void) {
    this.socket.on("world:full", cb);
  }

  onFlagSpawned(cb: (ev: FlagSpawnedEvent) => void) {
    this.socket.on("flag:spawned", cb);
  }

  onFlagCollected(cb: (ev: FlagCollectedEvent) => void) {
    this.socket.on("flag:collected", cb);
  }

  onFlagCaptureStart(cb: (ev: FlagCaptureStartEvent) => void) {
    this.socket.on("flag:capture_start", cb);
  }

  onFlagCaptureEnd(cb: (ev: FlagCaptureEndEvent) => void) {
    this.socket.on("flag:capture_end", cb);
  }

  onFlagStolen(cb: (ev: FlagStolenEvent) => void) {
    this.socket.on("flag:stolen", cb);
  }

  onFlagDropped(cb: (ev: FlagDroppedEvent) => void) {
    this.socket.on("flag:dropped", cb);
  }

  onFlagCleared(cb: () => void) {
    this.socket.on("flag:cleared", cb);
  }

  onFlagSync(cb: (ev: FlagSyncEvent) => void) {
    this.socket.on("flag:sync", cb);
  }

  // ── A2A companion pairing ──
  emitPairRequest(toId: string, fromVisitorId?: string, fromCompanionName?: string) {
    this.socket.emit("pair:request", toId, fromVisitorId, fromCompanionName);
  }
  emitPairRespond(
    toId: string,
    accept: boolean,
    visitorToken?: string,
    visitorId?: string,
    companionName?: string,
    reason?: "declined" | "no_companion",
  ) {
    this.socket.emit("pair:respond", toId, accept, visitorToken, visitorId, companionName, reason);
  }
  onPairIncoming(cb: (ev: PairRequestEvent) => void) {
    this.socket.on("pair:incoming", cb);
  }
  onPairAnswered(cb: (ev: PairAnswerEvent) => void) {
    this.socket.on("pair:answered", cb);
  }
  // ── A2A: companion-to-companion greetings (agents talking on encounter) ──
  emitCompanionHail(toId: string, message: string) {
    this.socket.emit("companion:hail", toId, message);
  }
  onCompanionHailed(cb: (ev: CompanionHailEvent) => void) {
    this.socket.on("companion:hailed", cb);
  }
  emitCompanionGift(toId: string, gift: string) {
    this.socket.emit("companion:gift", toId, gift);
  }
  onCompanionGifted(cb: (ev: CompanionGiftEvent) => void) {
    this.socket.on("companion:gifted", cb);
  }
  // ── A2A duo challenge ("fly together") ──
  emitDuoInvite(toId: string) {
    this.socket.emit("duo:invite", toId);
  }
  emitDuoRespond(toId: string, accept: boolean) {
    this.socket.emit("duo:respond", toId, accept);
  }
  emitDuoDone(toId: string) {
    this.socket.emit("duo:done", toId);
  }
  onDuoIncoming(cb: (ev: DuoPeerEvent) => void) {
    this.socket.on("duo:incoming", cb);
  }
  onDuoAnswered(cb: (ev: DuoAnswerEvent) => void) {
    this.socket.on("duo:answered", cb);
  }
  onDuoCompleted(cb: (ev: { fromId: string }) => void) {
    this.socket.on("duo:completed", cb);
  }
  // ── A2A Phase C: ghost pairing (cross-world invite) ──
  emitGhostPairInvite(toVisitorId: string) {
    this.socket.emit("ghostpair:invite", toVisitorId);
  }
  emitGhostPairResolved(otherVisitorId: string) {
    this.socket.emit("ghostpair:resolved", otherVisitorId);
  }
  emitGhostPairDecline(fromVisitorId: string) {
    this.socket.emit("ghostpair:decline", fromVisitorId);
  }
  onGhostPairIncoming(cb: (ev: GhostPairInvite) => void) {
    this.socket.on("ghostpair:incoming", cb);
  }
  onGhostPairNotice(cb: (ev: { name: string }) => void) {
    this.socket.on("ghostpair:notice", cb);
  }

  // ── Shared co-op objective (one moon + five braziers per world) ──
  /** Tell the server the local player lit brazier `index` (eternal = spent a flame).
   *  The ack says whether it was accepted (rejected → refund the flame). */
  emitBrazierLight(index: number, eternal: boolean, ack: (res: { accepted: boolean }) => void) {
    this.socket.emit("brazier:light", index, eternal, ack);
  }
  onObjectiveSync(cb: (state: WorldObjectiveState) => void) {
    this.socket.on("objective:sync", cb);
  }
  onObjectiveBrazier(cb: (ev: ObjectiveBrazierEvent) => void) {
    this.socket.on("objective:brazier", cb);
  }
  onWorldSaved(cb: (ev: { method: "eternal_flames" }) => void) {
    this.socket.on("world:saved", cb);
  }
  onWorldLost(cb: () => void) {
    this.socket.on("world:lost", cb);
  }

  // ── Co-op Leviathan hunt ──
  /** Tell the server this boat is hauling the shared giant right now. */
  emitLeviathanHaul() {
    this.socket.emit("leviathan:haul");
  }
  onLeviathanSync(cb: (state: LeviathanState | null) => void) {
    this.socket.on("leviathan:sync", cb);
  }
  onLeviathanDefeated(cb: (ev: { hunters: string[] }) => void) {
    this.socket.on("leviathan:defeated", cb);
  }
  onLeviathanFled(cb: () => void) {
    this.socket.on("leviathan:fled", cb);
  }

  disconnect() {
    this.socket.disconnect();
  }
}
