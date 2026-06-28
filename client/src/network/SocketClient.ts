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
  GhostPairInvite,
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
  emitPairRequest(toId: string) {
    this.socket.emit("pair:request", toId);
  }
  emitPairRespond(toId: string, accept: boolean, visitorToken?: string, visitorId?: string) {
    this.socket.emit("pair:respond", toId, accept, visitorToken, visitorId);
  }
  onPairIncoming(cb: (ev: PairRequestEvent) => void) {
    this.socket.on("pair:incoming", cb);
  }
  onPairAnswered(cb: (ev: PairAnswerEvent) => void) {
    this.socket.on("pair:answered", cb);
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

  disconnect() {
    this.socket.disconnect();
  }
}
