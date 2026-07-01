import type { FishSpecies } from "../game/OceanFish";

/** Per-species body colour (used when the species has been caught). */
const SPECIES_COLOR: Record<string, string> = {
  sardine: "#aebccb",
  mackerel: "#5aa896",
  anchovy: "#c7d2de",
  herring: "#8fb2cc",
  silverscale: "#79d0ff",
  moonperch: "#b79cff",
  rainbowfin: "#ff9ecb",
  golden_marlin: "#ffd24a",
  abyss_dragonfish: "#ff6a44",
  starmark_ray: "#9b6cff",
  mystery_octopus: "#b06cd0",
  leviathan: "#3f97a0",
};

type Shape = "fish" | "long" | "marlin" | "ray" | "octopus" | "kraken";
const SPECIES_SHAPE: Record<string, Shape> = {
  golden_marlin: "marlin",
  abyss_dragonfish: "long",
  starmark_ray: "ray",
  mystery_octopus: "octopus",
  leviathan: "kraken",
};

/** Draw a side-view fish facing right. */
function drawFish(ctx: CanvasRenderingContext2D, S: number, color: string, long: boolean, marlin: boolean) {
  const cx = S * 0.52;
  const cy = S * 0.52;
  const len = long ? S * 0.66 : S * 0.56;
  const h = long ? S * 0.26 : S * 0.34;
  ctx.fillStyle = color;

  // Tail fin
  const tx = cx - len * 0.42;
  ctx.beginPath();
  ctx.moveTo(tx, cy);
  ctx.lineTo(tx - S * 0.15, cy - S * 0.16);
  ctx.lineTo(tx - S * 0.09, cy);
  ctx.lineTo(tx - S * 0.15, cy + S * 0.16);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(cx + len * 0.5, cy);
  ctx.quadraticCurveTo(cx, cy - h * 0.55, cx - len * 0.42, cy - h * 0.26);
  ctx.lineTo(cx - len * 0.42, cy + h * 0.26);
  ctx.quadraticCurveTo(cx, cy + h * 0.55, cx + len * 0.5, cy);
  ctx.closePath();
  ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(cx - len * 0.06, cy - h * 0.46);
  ctx.lineTo(cx + len * 0.12, cy - h * 0.78);
  ctx.lineTo(cx + len * 0.22, cy - h * 0.4);
  ctx.closePath();
  ctx.fill();

  // Marlin bill
  if (marlin) {
    ctx.strokeStyle = color;
    ctx.lineWidth = S * 0.05;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + len * 0.5, cy);
    ctx.lineTo(cx + len * 0.5 + S * 0.18, cy - S * 0.03);
    ctx.stroke();
  }
}

function drawEye(ctx: CanvasRenderingContext2D, S: number) {
  const ex = S * 0.66;
  const ey = S * 0.48;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(ex, ey, S * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20,26,40,0.92)";
  ctx.beginPath();
  ctx.arc(ex + S * 0.012, ey, S * 0.028, 0, Math.PI * 2);
  ctx.fill();
}

/** Manta-ray top view. */
function drawRay(ctx: CanvasRenderingContext2D, S: number, color: string) {
  const cx = S * 0.5;
  const cy = S * 0.46;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - S * 0.3);
  ctx.quadraticCurveTo(cx + S * 0.44, cy - S * 0.12, cx + S * 0.3, cy + S * 0.12);
  ctx.quadraticCurveTo(cx + S * 0.12, cy + S * 0.08, cx, cy + S * 0.2);
  ctx.quadraticCurveTo(cx - S * 0.12, cy + S * 0.08, cx - S * 0.3, cy + S * 0.12);
  ctx.quadraticCurveTo(cx - S * 0.44, cy - S * 0.12, cx, cy - S * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = S * 0.04;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy + S * 0.16);
  ctx.lineTo(cx, cy + S * 0.42);
  ctx.stroke();
}

/** Octopus / kraken: mantle + tentacles. */
function drawOctopus(ctx: CanvasRenderingContext2D, S: number, color: string, big: boolean, caught: boolean) {
  const cx = S * 0.5;
  const cy = big ? S * 0.4 : S * 0.42;
  const r = big ? S * 0.23 : S * 0.19;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();

  const n = big ? 8 : 6;
  ctx.lineWidth = big ? S * 0.055 : S * 0.05;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5;
    const x0 = cx + t * r * 1.5;
    const wob = i % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x0, cy + r * 0.85);
    ctx.quadraticCurveTo(x0 + wob * S * 0.07, cy + r * 1.55, x0 + wob * S * 0.02, cy + r * 2.05);
    ctx.stroke();
  }

  if (caught) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const dx of [-r * 0.4, r * 0.4]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy - r * 0.1, S * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(20,26,40,0.9)";
    for (const dx of [-r * 0.4, r * 0.4]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy - r * 0.1, S * 0.022, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Build a small canvas icon for a species — coloured when caught, dark
 *  silhouette when undiscovered. Matches the game's hand-drawn fish look. */
export function makeFishIcon(sp: FishSpecies, caught: boolean, px = 34): HTMLCanvasElement {
  const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const S = Math.round(px * dpr);
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  c.style.width = `${px}px`;
  c.style.height = `${px}px`;
  const ctx = c.getContext("2d");
  if (!ctx) return c;

  const shape: Shape = SPECIES_SHAPE[sp.key] ?? "fish";
  const color = caught ? SPECIES_COLOR[sp.key] ?? "#9fb2c8" : "#3a4763";
  ctx.globalAlpha = caught ? 1 : 0.55;

  switch (shape) {
    case "ray":
      drawRay(ctx, S, color);
      break;
    case "octopus":
      drawOctopus(ctx, S, color, false, caught);
      break;
    case "kraken":
      drawOctopus(ctx, S, color, true, caught);
      break;
    case "marlin":
      drawFish(ctx, S, color, true, true);
      if (caught) drawEye(ctx, S);
      break;
    case "long":
      drawFish(ctx, S, color, true, false);
      if (caught) drawEye(ctx, S);
      break;
    default:
      drawFish(ctx, S, color, false, false);
      if (caught) drawEye(ctx, S);
  }
  return c;
}
