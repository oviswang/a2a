/**
 * GhostPlanes — "ghost" vehicles of players who flew this world before.
 *
 * The server persists past visitors (non-secret: name, vehicle, companion name);
 * here we spawn a translucent vehicle for each — a ghost PLANE, CARPET, or BOAT
 * matching the visitor's real craft — that wanders the globe with a name pill. When
 * the local player flies near one, a callback fires so the AI companion can narrate
 * who they were (and, later, offer to reconnect / pair with them).
 *
 * Purely cosmetic + social flavour: no networking, no collision, not pairable as a
 * live player (real A2A pairing still needs both players live — see Phase C).
 */
import { Group, Scene, Vector3, Quaternion, type Camera, type Material, type Mesh } from "three";
import type { Vehicle } from "@globefly/shared";
import { createBiplane } from "./BiplaneMesh";
import { createBoat } from "./BoatMesh";
import { createCarpet } from "./CarpetMesh";
import {
  moveOnSphere,
  buildPlaneMatrix,
  buildBoatMatrix,
  cartesianFromSpherical,
  seededRandom,
} from "./SphericalMath";

export interface GhostVisitor {
  visitorId: string;
  displayName: string;
  vehicle: Vehicle;
  companionName?: string | null;
}

const GHOST_OPACITY = 0.55;
const SPEED = 0.45; // world-units/sec — a touch slower than NPCs
const WANDER_HEADING_DELTA = 0.9;
const TURN_RATE = 0.55;
const WANDER_MIN = 3;
const WANDER_MAX = 8;
const NARRATE_PROXIMITY = 0.7; // world-space distance to ENTER an encounter
const EXIT_PROXIMITY = 1.15; // must leave past this before an encounter can re-fire
const REENCOUNTER_COOLDOWN = 25; // per-ghost seconds before it can greet again
const ALT_PLANE = 0.52;
const ALT_CARPET = 0.5;
const ALT_BOAT = 0.0;
/** Min seconds between any two ghost narrations, so encounters don't spam. */
const NARRATE_GAP = 14;

function ghostAltitude(v: Vehicle): number {
  return v === "boat" ? ALT_BOAT : v === "carpet" ? ALT_CARPET : ALT_PLANE;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class GhostPlane {
  readonly group: Group;
  readonly visitor: GhostVisitor;
  readonly vehicle: Vehicle;
  private readonly altitude: number;
  private readonly globeRadius: number;
  qPosition: Quaternion;
  private heading: number;
  private targetHeading: number;
  private wanderTimer = 0;
  private wanderInterval: number;
  private headingTurnRate = 0;
  private currentBank = 0;
  private bobTime = Math.random() * Math.PI * 2;
  /** Whether the player is currently within encounter range (entry/exit hysteresis). */
  inRange = false;
  /** Per-ghost cooldown before it can greet again after the player leaves. */
  cooldown = 0;
  private readonly posScratch = new Vector3();

  constructor(visitor: GhostVisitor, globeRadius: number) {
    this.visitor = visitor;
    this.vehicle = visitor.vehicle;
    this.altitude = ghostAltitude(this.vehicle);
    this.globeRadius = globeRadius;

    const rnd = seededRandom(hashSeed(visitor.visitorId));
    const theta = rnd() * Math.PI * 2;
    const phi = Math.acos(2 * rnd() - 1);
    const n = new Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
    ).normalize();
    this.qPosition = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), n);
    this.heading = rnd() * Math.PI * 2;
    this.targetHeading = this.heading;
    this.wanderInterval = WANDER_MIN + rnd() * (WANDER_MAX - WANDER_MIN);

    // A cool, ghostly tint per vehicle.
    const color = this.vehicle === "boat" ? 0x9fc8ff : this.vehicle === "carpet" ? 0xc6a8ff : 0xa8d8ff;
    this.group =
      this.vehicle === "boat" ? createBoat(color) : this.vehicle === "carpet" ? createCarpet(color) : createBiplane(color);
    this.group.matrixAutoUpdate = false;
    this.applyGhostLook(this.group);
  }

  private applyGhostLook(root: Group) {
    root.traverse((o) => {
      const mesh = o as Mesh;
      const mat = mesh.material as (Material & { transparent?: boolean; opacity?: number }) | Material[] | undefined;
      const apply = (m: Material & { transparent?: boolean; opacity?: number; depthWrite?: boolean }) => {
        m.transparent = true;
        m.opacity = GHOST_OPACITY;
        m.depthWrite = false;
      };
      if (Array.isArray(mat)) mat.forEach(apply);
      else if (mat) apply(mat as Material & { transparent?: boolean; opacity?: number });
    });
  }

  worldPosition(out: Vector3): Vector3 {
    return out.copy(cartesianFromSpherical(this.qPosition, this.altitude, this.globeRadius));
  }

  update(dt: number) {
    this.wanderTimer += dt;
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      this.targetHeading += (Math.random() - 0.5) * 2 * WANDER_HEADING_DELTA;
      this.wanderInterval = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN);
    }
    let diff = this.targetHeading - this.heading;
    diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
    const maxStep = TURN_RATE * dt;
    const step = Math.max(-maxStep, Math.min(maxStep, diff));
    this.heading += step;
    this.headingTurnRate = step / Math.max(dt, 1e-6);

    const arc = (SPEED * dt) / this.globeRadius;
    this.qPosition = moveOnSphere(this.qPosition, this.heading, arc);

    if (this.vehicle === "boat") {
      this.bobTime += dt;
      const m = buildBoatMatrix(
        this.qPosition,
        this.heading,
        this.altitude + Math.sin(this.bobTime * 1.6) * 0.012,
        this.globeRadius,
        Math.sin(this.bobTime * 1.1 + 1.3) * 0.05,
        Math.sin(this.bobTime * 0.9 + 2.7) * 0.06,
      );
      this.group.matrix.copy(m);
    } else {
      const targetBank = Math.max(-0.45, Math.min(0.45, this.headingTurnRate * 0.55));
      this.currentBank += (targetBank - this.currentBank) * (1 - Math.exp(-4.5 * dt));
      this.group.matrix.copy(
        buildPlaneMatrix(this.qPosition, this.heading, 0, this.currentBank, this.altitude, this.globeRadius),
      );
      const prop = this.group.userData.propeller as Group | undefined;
      if (prop) prop.rotation.z -= (SPEED * 15 + 8) * dt;
    }
    this.group.matrixWorldNeedsUpdate = true;
  }

  /** World-space distance from the player to this ghost. */
  distanceTo(playerWorldPos: Vector3): number {
    this.worldPosition(this.posScratch);
    return playerWorldPos.distanceTo(this.posScratch);
  }

  dispose() {
    this.group.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as Material | Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
  }
}

export class GhostPlanes {
  private readonly ghosts: GhostPlane[] = [];
  private readonly scene: Scene;
  private readonly labelContainer: HTMLDivElement;
  private readonly labels = new Map<string, HTMLDivElement>();
  private readonly playerScratch = new Vector3();
  private readonly anchor = new Vector3();
  private readonly up = new Vector3();
  private readonly fwd = new Vector3();
  private readonly toPoint = new Vector3();
  private narrateCooldown = 0;
  /** Fired once when the player first flies near a given ghost. */
  onEncounter?: (visitor: GhostVisitor) => void;

  constructor(scene: Scene, globeRadius: number, visitors: GhostVisitor[], hudRoot: HTMLElement) {
    this.scene = scene;
    GhostPlanes.injectStyles();
    this.labelContainer = document.createElement("div");
    this.labelContainer.className = "ghost-names";
    this.labelContainer.setAttribute("aria-hidden", "true");
    hudRoot.appendChild(this.labelContainer);

    for (const v of visitors) {
      const g = new GhostPlane(v, globeRadius);
      this.scene.add(g.group);
      this.ghosts.push(g);
    }
  }

  get count(): number {
    return this.ghosts.length;
  }

  update(dt: number, playerWorldPos: Vector3, camera: Camera, domElement: HTMLElement) {
    this.narrateCooldown = Math.max(0, this.narrateCooldown - dt);
    for (const g of this.ghosts) {
      g.update(dt);
      g.cooldown = Math.max(0, g.cooldown - dt);
      const dist = g.distanceTo(playerWorldPos);
      if (!g.inRange && dist < NARRATE_PROXIMITY) {
        g.inRange = true;
        if (g.cooldown <= 0 && this.narrateCooldown <= 0) {
          g.cooldown = REENCOUNTER_COOLDOWN;
          this.narrateCooldown = NARRATE_GAP;
          this.onEncounter?.(g.visitor);
        }
      } else if (g.inRange && dist > EXIT_PROXIMITY) {
        g.inRange = false;
      }
      this.updateLabel(g, playerWorldPos, camera, domElement);
    }
  }

  private updateLabel(g: GhostPlane, playerWorldPos: Vector3, camera: Camera, domElement: HTMLElement) {
    let el = this.labels.get(g.visitor.visitorId);
    if (!el) {
      el = document.createElement("div");
      el.className = "ghost-name-pill";
      el.textContent = g.visitor.companionName
        ? `${g.visitor.displayName} · ✦ ${g.visitor.companionName}`
        : g.visitor.displayName;
      this.labelContainer.appendChild(el);
      this.labels.set(g.visitor.visitorId, el);
    }

    g.worldPosition(this.anchor);
    if (this.anchor.distanceToSquared(playerWorldPos) > 4 * 4) {
      el.classList.remove("ghost-name-pill--visible");
      return;
    }
    this.up.copy(this.anchor).normalize();
    this.anchor.addScaledVector(this.up, g.vehicle === "boat" ? 0.11 : 0.15);

    camera.getWorldDirection(this.fwd);
    this.toPoint.subVectors(this.anchor, camera.position);
    if (this.toPoint.dot(this.fwd) <= 0.02) {
      el.classList.remove("ghost-name-pill--visible");
      return;
    }
    this.anchor.project(camera);
    const onScreen =
      this.anchor.z > -1 && this.anchor.z < 1 && Math.abs(this.anchor.x) < 1.1 && Math.abs(this.anchor.y) < 1.1;
    if (!onScreen) {
      el.classList.remove("ghost-name-pill--visible");
      return;
    }
    el.style.left = `${(this.anchor.x * 0.5 + 0.5) * domElement.clientWidth}px`;
    el.style.top = `${(-this.anchor.y * 0.5 + 0.5) * domElement.clientHeight}px`;
    el.classList.add("ghost-name-pill--visible");
  }

  setVisible(visible: boolean) {
    for (const g of this.ghosts) g.group.visible = visible;
    this.labelContainer.style.display = visible ? "" : "none";
  }

  dispose() {
    for (const g of this.ghosts) {
      this.scene.remove(g.group);
      g.dispose();
    }
    this.ghosts.length = 0;
    this.labelContainer.remove();
    this.labels.clear();
  }

  private static injectStyles() {
    if (document.getElementById("ghost-names-styles")) return;
    const s = document.createElement("style");
    s.id = "ghost-names-styles";
    s.textContent = `
      .ghost-names { position: fixed; inset: 0; z-index: 4; pointer-events: none; font-family: 'Domine', Georgia, serif; }
      .ghost-name-pill {
        position: absolute; left: 0; top: 0; transform: translate(-50%, -100%); margin-top: 2px;
        padding: 4px 10px; max-width: min(220px, 55vw); overflow: hidden; text-overflow: ellipsis;
        white-space: nowrap; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.02em;
        color: rgba(220, 235, 255, 0.85); background: rgba(40, 56, 92, 0.42);
        border: 1px solid rgba(180, 210, 255, 0.35); border-radius: 999px; backdrop-filter: blur(4px);
        opacity: 0; transition: opacity 0.25s ease;
      }
      .ghost-name-pill--visible { opacity: 0.85; }
    `;
    document.head.appendChild(s);
  }
}
