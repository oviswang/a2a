import { type Group, type Scene, Vector3, Mesh, type Material } from "three";
import { createPackageQuestBeamGroup } from "./PackageQuest";
import { surfaceDisplacementAt } from "./TerrainSurface";

const REF_UP = new Vector3(0, 1, 0);
/** How long a placed waypoint pillar stays before fading out (seconds). */
const LIFETIME = 12;
const SPAWN_ANIM = 0.6;
/** Lift above the terrain surface so the pillar's base clears the ground. */
const LIFT = 0.02;

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * A single reusable vertical "light pillar" the AI companion drops at a
 * navigation waypoint (set_waypoint / drop_beacon). Reuses the package-quest
 * beam visual; aligns to the globe surface normal; spawn-bounces in, pulses,
 * and auto-hides after {@link LIFETIME}.
 */
export class WaypointBeacon {
  private readonly group: Group;
  private readonly timeU = { value: 0 };
  private readonly scene: Scene;
  private readonly globeRadius: number;
  private readonly seed: number;
  private readonly terrainType: string;
  private life = -1; // -1 = inactive
  private readonly n = new Vector3();

  constructor(scene: Scene, globeRadius: number, seed: number, terrainType: string) {
    this.scene = scene;
    this.globeRadius = globeRadius;
    this.seed = seed;
    this.terrainType = terrainType;
    this.group = createPackageQuestBeamGroup(0x9ad1ff, {
      timeUniform: this.timeU,
      height: 1.4,
      width: 0.07,
    });
    this.group.visible = false;
    scene.add(this.group);
  }

  /** Place the pillar at a globe surface point (given its outward unit normal). */
  show(normal: Vector3): void {
    this.n.copy(normal).normalize();
    const disp = surfaceDisplacementAt(this.seed, this.terrainType, this.n.x, this.n.y, this.n.z);
    const r = this.globeRadius + disp + LIFT;
    this.group.position.set(this.n.x * r, this.n.y * r, this.n.z * r);
    this.group.quaternion.setFromUnitVectors(REF_UP, this.n);
    this.life = 0;
    this.group.visible = true;
  }

  update(dt: number): void {
    if (this.life < 0) return;
    this.life += dt;
    this.timeU.value += dt;
    if (this.life >= LIFETIME) {
      this.life = -1;
      this.group.visible = false;
      return;
    }
    // Spawn bounce in, then a gentle fade-out scale near the end.
    let scale = 1;
    if (this.life < SPAWN_ANIM) scale = easeOutBack(this.life / SPAWN_ANIM);
    const remaining = LIFETIME - this.life;
    if (remaining < 1) scale *= remaining; // ease out over the final second
    this.group.scale.setScalar(Math.max(0.001, scale));
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as Material | Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
  }
}
