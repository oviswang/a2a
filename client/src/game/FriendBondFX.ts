import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  type Camera,
  Line,
  LineBasicMaterial,
  Vector3,
} from "three";

/** A paired A2A friend present in the world this frame. */
export interface FriendInWorld {
  name: string;
  /** World-space position of the friend's vehicle. */
  pos: Vector3;
  /** Friendship level (0+); ≥3 shows a "BFF" tag + a golden tether. */
  bondLevel?: number;
}

/** Straight-line world distance → a friendly "metres" number for the pointer. */
const DIST_SCALE = 100;
/** Draw the light tether to the nearest friend within this world distance. */
const TETHER_RANGE = 2.4;
/** Pop a heart when you pass this close, then cool down. */
const HEART_RANGE = 0.55;
const HEART_COOLDOWN_MS = 5000;

/**
 * "Friends, together" flight FX for paired A2A friends co-present in a world:
 *  ① an off-screen edge arrow pointing to each friend (+ distance) so you can find
 *     each other on the little globe;
 *  ② a glowing tether between you and the nearest friend when you're close, and a
 *     heart burst when you pass each other.
 * Purely cosmetic + local (both clients run the same detection, so both see it).
 */
export class FriendBondFX {
  private readonly container: HTMLDivElement;
  private readonly arrows = new Map<string, HTMLDivElement>();
  private readonly tether: Line;
  private readonly tetherPos: BufferAttribute;
  private readonly tetherMat: LineBasicMaterial;
  private readonly heartCooldown = new Map<string, number>();
  private time = 0;
  private nowMs = 0;
  private readonly scene: { add(o: Line): void; remove(o: Line): void };

  // scratch
  private readonly forward = new Vector3();
  private readonly toFriend = new Vector3();
  private readonly ndc = new Vector3();
  private readonly mid = new Vector3();

  constructor(scene: { add(o: Line): void; remove(o: Line): void }, hudRoot: HTMLElement) {
    this.scene = scene;
    FriendBondFX.injectStyles();
    this.container = document.createElement("div");
    this.container.className = "friend-fx";
    this.container.setAttribute("aria-hidden", "true");
    hudRoot.appendChild(this.container);

    const geom = new BufferGeometry();
    this.tetherPos = new BufferAttribute(new Float32Array(6), 3);
    geom.setAttribute("position", this.tetherPos);
    this.tetherMat = new LineBasicMaterial({
      color: 0xffc6dd,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.tether = new Line(geom, this.tetherMat);
    this.tether.frustumCulled = false;
    this.tether.renderOrder = 999;
    scene.add(this.tether);
  }

  /** Call every frame with the paired friends currently in this world. */
  update(
    localPos: Vector3,
    camera: Camera,
    domElement: HTMLElement,
    friends: FriendInWorld[],
    dtSeconds: number,
  ) {
    this.time += dtSeconds;
    this.nowMs += dtSeconds * 1000;
    const w = domElement.clientWidth;
    const h = domElement.clientHeight;

    camera.getWorldDirection(this.forward);
    const seen = new Set<string>();
    let nearest: FriendInWorld | null = null;
    let nearestD = Infinity;

    for (const f of friends) {
      seen.add(f.name);
      const d = localPos.distanceTo(f.pos);
      if (d < nearestD) { nearestD = d; nearest = f; }

      // On-screen test.
      this.toFriend.subVectors(f.pos, camera.position);
      const inFront = this.toFriend.dot(this.forward) > 0;
      this.ndc.copy(f.pos).project(camera);
      const onScreen = inFront && Math.abs(this.ndc.x) <= 1 && Math.abs(this.ndc.y) <= 1;

      let arrow = this.arrows.get(f.name);
      if (onScreen) {
        // The name pill already marks them — hide the edge arrow.
        if (arrow) arrow.style.opacity = "0";
        continue;
      }
      if (!arrow) {
        arrow = document.createElement("div");
        arrow.className = "friend-arrow";
        arrow.innerHTML =
          '<span class="friend-arrow-chevron">➤</span>' +
          '<span class="friend-arrow-label"></span>';
        this.container.appendChild(arrow);
        this.arrows.set(f.name, arrow);
      }
      // Direction toward the friend in screen space (invert when behind camera).
      let nx = this.ndc.x;
      let ny = this.ndc.y;
      if (!inFront) { nx = -nx; ny = -ny; }
      const ang = Math.atan2(ny, nx);
      const rx = 0.84, ry = 0.8; // keep the arrow inside the safe area
      const ex = Math.cos(ang) * rx;
      const ey = Math.sin(ang) * ry;
      const px = (ex * 0.5 + 0.5) * w;
      const py = (-ey * 0.5 + 0.5) * h;
      const screenAng = (Math.atan2(py - h / 2, px - w / 2) * 180) / Math.PI;
      arrow.style.left = `${px}px`;
      arrow.style.top = `${py}px`;
      arrow.style.opacity = "1";
      const chevron = arrow.firstElementChild as HTMLElement;
      chevron.style.transform = `rotate(${screenAng}deg)`;
      const label = arrow.lastElementChild as HTMLElement;
      const bff = (f.bondLevel ?? 0) >= 3 ? "❤︎ " : "";
      label.textContent = `${bff}${f.name} · ${Math.round((d * DIST_SCALE) / 10) * 10}m`;
    }

    // Drop arrows for friends who left.
    for (const [name, el] of [...this.arrows]) {
      if (!seen.has(name)) { el.remove(); this.arrows.delete(name); }
    }

    // ② Tether + heart to the nearest friend.
    if (nearest && nearestD <= TETHER_RANGE) {
      this.tetherPos.setXYZ(0, localPos.x, localPos.y, localPos.z);
      this.tetherPos.setXYZ(1, nearest.pos.x, nearest.pos.y, nearest.pos.z);
      this.tetherPos.needsUpdate = true;
      const pulse = 0.55 + 0.25 * Math.sin(this.time * 4);
      const fade = 1 - Math.min(1, nearestD / TETHER_RANGE);
      this.tetherMat.opacity = pulse * fade;
      // Close friends get a warmer, golden tether.
      this.tetherMat.color.setHex((nearest.bondLevel ?? 0) >= 3 ? 0xffe1a8 : 0xffc6dd);

      if (nearestD <= HEART_RANGE) {
        const last = this.heartCooldown.get(nearest.name) ?? -Infinity;
        if (this.nowMs - last >= HEART_COOLDOWN_MS) {
          this.heartCooldown.set(nearest.name, this.nowMs);
          this.mid.addVectors(localPos, nearest.pos).multiplyScalar(0.5);
          this.spawnHeart(this.mid, camera, domElement);
        }
      }
    } else {
      this.tetherMat.opacity = 0;
    }
  }

  private spawnHeart(worldPos: Vector3, camera: Camera, domElement: HTMLElement) {
    this.ndc.copy(worldPos).project(camera);
    if (this.ndc.z > 1) return; // behind camera
    const w = domElement.clientWidth;
    const h = domElement.clientHeight;
    const x = (this.ndc.x * 0.5 + 0.5) * w;
    const y = (-this.ndc.y * 0.5 + 0.5) * h;
    const el = document.createElement("div");
    el.className = "friend-heart";
    el.textContent = "❤️";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.container.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  /** Hide everything (e.g. no friends in world / entering a cutscene). */
  clear() {
    this.tetherMat.opacity = 0;
    for (const [, el] of this.arrows) el.style.opacity = "0";
  }

  dispose() {
    this.scene.remove(this.tether);
    this.tether.geometry.dispose();
    this.tetherMat.dispose();
    this.container.remove();
    this.arrows.clear();
  }

  private static injectStyles() {
    if (document.getElementById("friend-fx-styles")) return;
    const s = document.createElement("style");
    s.id = "friend-fx-styles";
    s.textContent = `
      .friend-fx { position: fixed; inset: 0; z-index: 6; pointer-events: none;
        font-family: 'Domine', Georgia, serif; }
      .friend-arrow { position: absolute; transform: translate(-50%, -50%);
        display: flex; align-items: center; gap: 6px; white-space: nowrap;
        opacity: 0; transition: opacity 0.15s ease; }
      .friend-arrow-chevron { color: #ff9ec4; font-size: 1.1rem;
        text-shadow: 0 0 8px rgba(255,120,170,0.9); display: inline-block; }
      .friend-arrow-label { font-size: 0.64rem; font-weight: 600;
        color: rgba(255,235,244,0.95); background: rgba(40,16,28,0.5);
        padding: 2px 7px; border-radius: 10px; backdrop-filter: blur(6px);
        text-shadow: 0 1px 3px rgba(0,0,0,0.6); }
      .friend-heart { position: absolute; transform: translate(-50%, -50%);
        font-size: 1.8rem; pointer-events: none;
        animation: friend-heart-rise 1.6s ease-out forwards; }
      @keyframes friend-heart-rise {
        0% { opacity: 0; transform: translate(-50%, -40%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -55%) scale(1.15); }
        100% { opacity: 0; transform: translate(-50%, -160%) scale(1); }
      }
      @media (max-width: 480px) {
        .friend-arrow-chevron { font-size: 0.95rem; }
        .friend-arrow-label { font-size: 0.58rem; backdrop-filter: none; }
      }
    `;
    document.head.appendChild(s);
  }
}
