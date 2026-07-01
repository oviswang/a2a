import { t } from "../i18n";
import type { FishRarity } from "../game/OceanFish";

export interface ReelOptions {
  species: string;
  rarity: FishRarity;
  /** Called exactly once when the tug resolves. */
  onResult: (win: boolean) => void;
}

/** Tuning per rarity — rarer fish move faster and give a smaller catch bar. */
interface ReelTuning {
  barFrac: number; // player bar height as fraction of track
  fishSpeed: number; // how briskly the fish re-targets (per second)
  fillRate: number; // progress/sec while the fish is inside the bar
  drainRate: number; // progress/sec while it's outside
  color: string;
}
function tuningFor(rarity: FishRarity): ReelTuning {
  if (rarity === "epic")
    return { barFrac: 0.2, fishSpeed: 2.6, fillRate: 0.42, drainRate: 0.3, color: "#ffcc33" };
  if (rarity === "rare")
    return { barFrac: 0.28, fishSpeed: 1.9, fillRate: 0.5, drainRate: 0.26, color: "#66ccff" };
  return { barFrac: 0.34, fishSpeed: 1.5, fillRate: 0.58, drainRate: 0.22, color: "#cfe3ff" };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "reel-styles";
  s.textContent = `
    .reel-overlay {
      position: fixed; inset: 0; z-index: 45; touch-action: none;
      display: flex; align-items: center; justify-content: center;
      background: radial-gradient(ellipse at center, rgba(6,12,24,0.15), rgba(6,12,24,0.5));
      opacity: 0; transition: opacity 0.15s ease; user-select: none;
    }
    .reel-overlay.reel-overlay--in { opacity: 1; }
    .reel-stage { display: flex; align-items: center; gap: 18px; }
    .reel-title {
      position: absolute; top: 14%; left: 50%; transform: translateX(-50%);
      color: #eaf2ff; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    }
    .reel-title-main { font-size: 20px; font-weight: 700; }
    .reel-title-sub { font-size: 13px; opacity: 0.8; margin-top: 3px; }
    .reel-track {
      position: relative; width: 46px; height: 58vh; max-height: 460px;
      border-radius: 26px; background: rgba(10,18,34,0.72);
      border: 2px solid rgba(255,255,255,0.16); overflow: hidden;
    }
    .reel-bar {
      position: absolute; left: 4px; right: 4px; border-radius: 20px;
      background: rgba(120, 230, 160, 0.32);
      border: 1px solid rgba(140, 245, 175, 0.7);
    }
    .reel-fish {
      position: absolute; left: 50%; transform: translate(-50%, -50%);
      font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    }
    .reel-progress-track {
      position: relative; width: 12px; height: 58vh; max-height: 460px;
      border-radius: 8px; background: rgba(10,18,34,0.72);
      border: 1px solid rgba(255,255,255,0.14); overflow: hidden;
    }
    .reel-progress-fill {
      position: absolute; left: 0; right: 0; bottom: 0; height: 0%;
      background: linear-gradient(#8affc0, #38d98a);
    }
    .reel-hint {
      position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.85); font-size: 14px; text-align: center;
      text-shadow: 0 2px 6px rgba(0,0,0,0.6);
    }
  `;
  document.head.appendChild(s);
}

/**
 * A self-contained "reel it in" tug (Stardew-style bar). Hold anywhere / Space to
 * lift the catch bar; keep the fish inside it to fill the catch meter to the top.
 * If the meter empties, the line snaps. Resolves exactly once via {@link ReelOptions.onResult}.
 */
export function startReelMinigame(opts: ReelOptions) {
  injectStyles();
  const tune = tuningFor(opts.rarity);

  const overlay = document.createElement("div");
  overlay.className = "reel-overlay";

  const title = document.createElement("div");
  title.className = "reel-title";
  title.innerHTML =
    `<div class="reel-title-main" style="color:${tune.color}">${opts.species}</div>` +
    `<div class="reel-title-sub">${t("It's biting — reel it in!", "上钩了 —— 起竿！")}</div>`;
  overlay.appendChild(title);

  const stage = document.createElement("div");
  stage.className = "reel-stage";

  const progTrack = document.createElement("div");
  progTrack.className = "reel-progress-track";
  const progFill = document.createElement("div");
  progFill.className = "reel-progress-fill";
  progTrack.appendChild(progFill);

  const track = document.createElement("div");
  track.className = "reel-track";
  const bar = document.createElement("div");
  bar.className = "reel-bar";
  const fish = document.createElement("div");
  fish.className = "reel-fish";
  fish.textContent = "🐟";
  track.append(bar, fish);

  stage.append(progTrack, track);
  overlay.appendChild(stage);

  const hint = document.createElement("div");
  hint.className = "reel-hint";
  hint.textContent = t("Hold to reel · release to give line", "按住起竿 · 松开放线");
  overlay.appendChild(hint);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("reel-overlay--in"));

  // ── State (normalized 0..1 along the track; 0 = bottom, 1 = top) ──
  const barH = tune.barFrac; // fraction of track height
  let barPos = 0.5; // center of the player bar (0..1)
  let barVel = 0;
  let fishPos = 0.5;
  let fishTarget = 0.5;
  let retargetIn = 0;
  let progress = 0.35; // start with a little slack so a miss isn't instant-loss
  let holding = false;
  let resolved = false;
  let raf = 0;
  let last = performance.now();

  const onDown = (e: Event) => { e.preventDefault(); holding = true; };
  const onUp = () => { holding = false; };
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); holding = true; }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp") holding = false;
  };
  overlay.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKeyUp);

  const finish = (win: boolean) => {
    if (resolved) return;
    resolved = true;
    cancelAnimationFrame(raf);
    overlay.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKeyUp);
    overlay.classList.remove("reel-overlay--in");
    setTimeout(() => overlay.remove(), 180);
    opts.onResult(win);
  };

  // Deterministic-ish fish wander without Math.random dependency concerns.
  let seed = (opts.species.length * 2654435761) >>> 0;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const step = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Fish picks a new target every so often; darts more for rarer fish.
    retargetIn -= dt;
    if (retargetIn <= 0) {
      fishTarget = 0.08 + rand() * 0.84;
      retargetIn = 0.35 + rand() * (1.2 / tune.fishSpeed);
    }
    fishPos += (fishTarget - fishPos) * Math.min(1, tune.fishSpeed * dt);

    // Player bar: hold = lift (up), release = gravity (down).
    const accel = holding ? 1.7 : -1.5;
    barVel += accel * dt;
    barVel *= 0.86; // damping
    barPos += barVel * dt;
    if (barPos < barH / 2) { barPos = barH / 2; barVel = 0; }
    if (barPos > 1 - barH / 2) { barPos = 1 - barH / 2; barVel = 0; }

    // In-bar test → fill or drain the catch meter.
    const inBar = Math.abs(fishPos - barPos) <= barH / 2;
    progress += (inBar ? tune.fillRate : -tune.drainRate) * dt;
    progress = Math.max(0, Math.min(1, progress));

    // Render (top = high value).
    bar.style.height = `${barH * 100}%`;
    bar.style.bottom = `${(barPos - barH / 2) * 100}%`;
    bar.style.background = inBar ? "rgba(120,230,160,0.5)" : "rgba(120,230,160,0.28)";
    fish.style.bottom = `${fishPos * 100}%`;
    progFill.style.height = `${progress * 100}%`;

    if (progress >= 1) return finish(true);
    if (progress <= 0) return finish(false);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  // Safety: never let a stuck minigame block the game — auto-resolve as a win
  // (the player hooked it) after a generous cap.
  setTimeout(() => finish(progress >= 0.5), 30000);
}
