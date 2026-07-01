import { t } from "../i18n";
import { FISH_SPECIES, fishSpeciesName, type FishRarity, type FishSpecies } from "../game/OceanFish";
import { ProgressionManager } from "../game/ProgressionManager";
import { makeFishIcon } from "./fishIcons";

const RARITY_COLOR: Record<FishRarity, string> = {
  common: "rgba(210, 224, 240, 0.9)",
  rare: "#66ccff",
  epic: "#ffcc33",
};
const RARITY_LABEL: Record<FishRarity, string> = {
  common: t("Common", "普通"),
  rare: t("Rare", "稀有"),
  epic: t("Epic", "史诗"),
};

/** How to catch a species — shown as a grey hint on undiscovered entries. */
function speciesHint(sp: FishSpecies): string {
  if (sp.key === "mystery_octopus") return t("Appears after ~12 catches", "钓满约 12 条后出现");
  if (sp.key === "leviathan") return t("Defeat the co-op Leviathan", "协作击败巨兽海妖");
  if (sp.rarity === "epic") return t("Glows gold in the water", "水里发金光");
  if (sp.rarity === "rare") return t("Glows blue in the water", "水里发蓝光");
  return t("Found while fishing", "海面钓到");
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "fishdex-styles";
  s.textContent = `
    .fishdex-overlay {
      position: fixed; inset: 0; z-index: 40;
      display: flex; align-items: center; justify-content: center;
      background: rgba(6, 10, 20, 0.55); backdrop-filter: blur(3px);
      opacity: 0; transition: opacity 0.18s ease;
    }
    .fishdex-overlay.fishdex-overlay--in { opacity: 1; }
    .fishdex-card {
      width: min(520px, 92vw); max-height: 84vh; overflow-y: auto;
      background: linear-gradient(180deg, #16203a, #0d1428);
      border: 1px solid rgba(255,255,255,0.12); border-radius: 16px;
      padding: 20px 20px 24px; color: #eaf2ff;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      transform: translateY(8px) scale(0.98); transition: transform 0.18s ease;
    }
    .fishdex-overlay--in .fishdex-card { transform: none; }
    .fishdex-head {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 12px; margin-bottom: 4px;
    }
    .fishdex-title { font-size: 20px; font-weight: 700; }
    .fishdex-count { font-size: 14px; color: rgba(255,255,255,0.7); }
    .fishdex-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 14px; }
    .fishdex-group-label {
      font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
      font-weight: 700; margin: 14px 0 8px;
    }
    .fishdex-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .fishdex-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 11px; border-radius: 10px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    }
    .fishdex-item--locked { background: rgba(255,255,255,0.02); }
    .fishdex-icon {
      width: 34px; height: 34px; flex: 0 0 auto;
      display: flex; align-items: center; justify-content: center;
    }
    .fishdex-icon canvas { display: block; }
    .fishdex-text { flex: 1 1 auto; min-width: 0; }
    .fishdex-name { font-size: 14px; font-weight: 600; }
    .fishdex-name--locked { color: rgba(255,255,255,0.55); }
    .fishdex-hint { font-size: 11px; color: rgba(255,255,255,0.42); margin-top: 1px; }
    .fishdex-num { font-size: 12px; color: rgba(255,255,255,0.55); flex: 0 0 auto; }
    .fishdex-progress {
      text-align: center; font-size: 12px; color: rgba(255,255,255,0.6);
      margin-top: 16px; font-weight: 600;
    }
    .fishdex-close {
      margin-top: 18px; width: 100%; padding: 12px; border: none; border-radius: 12px;
      background: rgba(255,255,255,0.12); color: #fff; font-size: 15px; font-weight: 600;
      cursor: pointer;
    }
    .fishdex-close:hover { background: rgba(255,255,255,0.18); }
  `;
  document.head.appendChild(s);
}

/** Open the Fishdex collection modal (lifetime species caught). */
export function showFishdexPanel() {
  injectStyles();
  const dex = ProgressionManager.loadFishdex();
  const total = FISH_SPECIES.length;
  const caught = FISH_SPECIES.filter((sp) => dex[sp.key]).length;

  const overlay = document.createElement("div");
  overlay.className = "fishdex-overlay";

  const card = document.createElement("div");
  card.className = "fishdex-card";

  const head = document.createElement("div");
  head.className = "fishdex-head";
  const title = document.createElement("div");
  title.className = "fishdex-title";
  title.textContent = t("🐟 Fishdex", "🐟 鱼类图鉴");
  const count = document.createElement("div");
  count.className = "fishdex-count";
  count.textContent = `${caught} / ${total}`;
  head.append(title, count);
  card.appendChild(head);

  const sub = document.createElement("div");
  sub.className = "fishdex-sub";
  sub.textContent = t(
    "Catch every species from your boat. Rare & epic fish glow in the water.",
    "开船捕齐每一种鱼。稀有和史诗鱼会在水里发光。",
  );
  card.appendChild(sub);

  const order: FishRarity[] = ["epic", "rare", "common"];
  for (const rarity of order) {
    const species = FISH_SPECIES.filter((sp) => sp.rarity === rarity);
    if (species.length === 0) continue;
    const label = document.createElement("div");
    label.className = "fishdex-group-label";
    label.style.color = RARITY_COLOR[rarity];
    label.textContent = RARITY_LABEL[rarity];
    card.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "fishdex-grid";
    for (const sp of species) {
      const entry = dex[sp.key];
      const item = document.createElement("div");
      item.className = "fishdex-item" + (entry ? "" : " fishdex-item--locked");

      const icon = document.createElement("div");
      icon.className = "fishdex-icon";
      // A hand-drawn creature per species — coloured when caught, dark silhouette
      // when still undiscovered.
      icon.appendChild(makeFishIcon(sp, !!entry, 34));

      const text = document.createElement("div");
      text.className = "fishdex-text";
      const name = document.createElement("div");
      name.className = "fishdex-name" + (entry ? "" : " fishdex-name--locked");
      name.textContent = entry ? fishSpeciesName(sp) : "？？？";
      text.appendChild(name);
      if (!entry) {
        const hint = document.createElement("div");
        hint.className = "fishdex-hint";
        hint.textContent = speciesHint(sp);
        text.appendChild(hint);
      }

      const num = document.createElement("div");
      num.className = "fishdex-num";
      num.textContent = entry ? `×${entry.count}` : "";

      item.append(icon, text, num);
      grid.appendChild(item);
    }
    card.appendChild(grid);
  }

  const remaining = total - caught;
  const progress = document.createElement("div");
  progress.className = "fishdex-progress";
  progress.textContent =
    remaining > 0
      ? t(`${remaining} more to complete the Fishdex`, `再捕 ${remaining} 种即可集齐图鉴`)
      : t("Fishdex complete! 🎉", "图鉴已集齐！🎉");
  card.appendChild(progress);

  const close = document.createElement("button");
  close.className = "fishdex-close";
  close.textContent = t("Close", "关闭");
  card.appendChild(close);

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("fishdex-overlay--in"));

  const dismiss = () => {
    overlay.classList.remove("fishdex-overlay--in");
    setTimeout(() => overlay.remove(), 200);
  };
  close.addEventListener("click", dismiss);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) dismiss();
  });
}
