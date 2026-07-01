import { Group, Quaternion, Vector3 } from "three";
import { createFishVisual, type OceanFishVisual } from "./OceanFishMesh";

const _up = new Vector3(0, 1, 0);
const _u = new Vector3();
const _q = new Quaternion();

/**
 * The shared co-op Leviathan, rendered from the (scaled-up) octopus silhouette at
 * the server-synced position. Purely presentational — the server owns HP/position.
 */
export class SeaGiant {
  readonly group = new Group();
  private readonly visual: OceanFishVisual;
  private readonly globeRadius: number;
  private time = 0;

  constructor(globeRadius: number) {
    this.globeRadius = globeRadius;
    this.visual = createFishVisual("octopus");
    this.visual.group.scale.setScalar(2.8); // a proper sea giant
    this.visual.setProgress(0); // hide the little capture bar
    this.group.add(this.visual.group);
  }

  /** Place at a server unit-sphere position (x,y,z on the unit sphere). */
  setUnitPos(x: number, y: number, z: number) {
    _u.set(x, y, z).normalize();
    this.visual.group.position.copy(_u).multiplyScalar(this.globeRadius + 0.02);
    // Lay the flat silhouette tangent to the globe (local +Y → surface normal).
    this.visual.group.quaternion.copy(_q.setFromUnitVectors(_up, _u));
  }

  worldPos(out: Vector3): Vector3 {
    return out.copy(this.visual.group.position);
  }

  update(dt: number, dayWeight: number, nightWeight: number) {
    this.time += dt;
    // Gentle bob so it reads as alive.
    const bob = 1 + Math.sin(this.time * 1.3) * 0.05;
    this.visual.group.scale.setScalar(2.8 * bob);
    this.visual.setTime(this.time);
    this.visual.setShadowOpacity(0.9);
    const evening = Math.max(0, 1 - dayWeight - nightWeight);
    this.visual.setNightGlow(nightWeight, evening);
  }

  dispose() {
    this.visual.dispose();
    this.group.parent?.remove(this.group);
  }
}
