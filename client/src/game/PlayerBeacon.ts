/**
 * A soft vertical beam of light above a player, visible from afar.
 * Billboard quad that always faces the camera, fades at both ends.
 */
import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
  Color,
  Camera,
  Vector3,
  Matrix4,
  Quaternion,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  type Texture,
} from "three";

const BEAM_HEIGHT = 3.0;
const BEAM_WIDTH = 0.04;
/** Warm gold ✦ that floats above an AI-companion pilot's beam (matches the
 *  "· ✦ Companion" name-tag marker), so you can spot pairable pilots from afar. */
const MARK_SIZE = 0.5;

const beaconVert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const beaconFrag = `
uniform vec3 uColor;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  float yFade = vUv.y * (1.0 - vUv.y) * 4.0;
  yFade = pow(yFade, 0.6);
  float xFade = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
  float a = yFade * xFade * uAlpha * 0.35;
  gl_FragColor = vec4(uColor, a);
}
`;

const _camPos = new Vector3();
const _beamPos = new Vector3();
const _toCamera = new Vector3();
const _surfaceUp = new Vector3();
const _right = new Vector3();
const _forward = new Vector3();
const _mat = new Matrix4();

export class PlayerBeacon {
  readonly mesh: Mesh;
  private material: ShaderMaterial;
  /** Lazily-created ✦ marker for AI-companion pilots (child of {@link mesh}). */
  private companionMark: Sprite | null = null;
  private companionMarkMat: SpriteMaterial | null = null;
  private alpha = 1;
  private static markTex: Texture | null = null;

  constructor(color: number = 0xffffff) {
    const geom = new PlaneGeometry(BEAM_WIDTH, BEAM_HEIGHT, 1, 16);
    geom.translate(0, BEAM_HEIGHT * 0.5, 0);

    const col = new Color(color);
    this.material = new ShaderMaterial({
      vertexShader: beaconVert,
      fragmentShader: beaconFrag,
      uniforms: {
        uColor: { value: [col.r, col.g, col.b] },
        uAlpha: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    });

    this.mesh = new Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
  }

  setColor(hex: number) {
    const col = new Color(hex);
    this.material.uniforms.uColor.value = [col.r, col.g, col.b];
  }

  /** Multiplies beam intensity (0 = off), for remote player moon-cutscene fade. */
  setOpacityMultiplier(opacity: number) {
    const a = Math.max(0, Math.min(1, opacity));
    this.alpha = a;
    this.material.uniforms.uAlpha.value = a;
    if (this.companionMarkMat) this.companionMarkMat.opacity = a;
  }

  /** Show/hide the floating ✦ that marks a pilot who has an AI companion. */
  setHasCompanion(on: boolean) {
    if (on && !this.companionMark) {
      this.companionMarkMat = new SpriteMaterial({
        map: PlayerBeacon.getMarkTexture(),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        opacity: this.alpha,
      });
      const s = new Sprite(this.companionMarkMat);
      s.scale.setScalar(MARK_SIZE);
      // Local +Y maps to the surface-normal (see update()), so this floats just
      // above the beam tip, along the radial, and the Sprite always faces camera.
      s.position.set(0, BEAM_HEIGHT + 0.22, 0);
      s.frustumCulled = false;
      this.companionMark = s;
      this.mesh.add(s);
    }
    if (this.companionMark) this.companionMark.visible = on;
  }

  /** A small glowing gold ✦ rendered to a canvas, shared across all beacons. */
  private static getMarkTexture(): Texture {
    if (PlayerBeacon.markTex) return PlayerBeacon.markTex;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(size * 0.78)}px Georgia, 'Times New Roman', serif`;
    ctx.shadowColor = "rgba(255, 214, 130, 0.95)";
    ctx.shadowBlur = size * 0.16;
    ctx.fillStyle = "#fff2cf";
    // Two passes so the glow builds up nicely.
    ctx.fillText("✦", size / 2, size / 2 + size * 0.03);
    ctx.fillText("✦", size / 2, size / 2 + size * 0.03);
    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 4;
    PlayerBeacon.markTex = tex;
    return tex;
  }

  /** Orient beam along surface normal, billboard around it to face camera. */
  update(camera: Camera) {
    camera.getWorldPosition(_camPos);
    _beamPos.copy(this.mesh.position);

    _surfaceUp.copy(_beamPos).normalize();

    _toCamera.subVectors(_camPos, _beamPos);
    _right.crossVectors(_surfaceUp, _toCamera);
    if (_right.lengthSq() < 1e-10) _right.set(1, 0, 0);
    _right.normalize();

    _forward.crossVectors(_right, _surfaceUp).normalize();

    _mat.makeBasis(_right, _surfaceUp, _forward);
    this.mesh.quaternion.setFromRotationMatrix(_mat);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    // The ✦ texture is shared/static, so only the per-instance material is freed.
    this.companionMarkMat?.dispose();
  }
}
