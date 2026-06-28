import type { Vehicle } from "@globefly/shared";
import { t } from "../i18n";

export interface UpgradeState {
  // ── Plane performance ─────────────────────────────
  maxSpeedMult: number;
  boostSpeedMult: number;
  boostDurationMult: number;
  /** Retained so legacy `quick_climb`/`quick_brake` saves don't throw. No new card touches it. */
  altSpeedMult: number;
  bankMult: number;
  /** Retained so legacy `quick_brake` saves don't throw. */
  brakeDecelMult: number;
  /** Max gremlin paintball HP = round(PL_HP_MAX * this). */
  planeGremlinHpMaxMult: number;

  // ── Carpet performance ────────────────────────────
  carpetSpeedMult: number;
  carpetBoostSpeedMult: number;
  carpetBoostDurationMult: number;
  carpetBankMult: number;
  /** Trigger-circle radius multiplier for the carpet portal. */
  carpetPortalRadiusMult: number;
  /** Retained for legacy saves; portal teleports no longer award XP. */
  carpetPortalXpMult: number;
  /** XP bonus on landmark selfie quest completions. */
  carpetSelfieXpMult: number;

  // ── Boat performance ──────────────────────────────
  boatSpeedMult: number;
  boatTurnMult: number;
  boatAccelMult: number;
  /** Diamond XP multiplier while boat is at >=80% of its max speed. */
  boatHighSpeedDiamondMult: number;

  // ── Boat fishing (OceanFish) ────────────────────────
  /** Multiplier on fishing catch / exit chord radii. */
  fishCatchRadiusMult: number;
  /** Multiplier on capture bar fill rate. */
  fishFillRateMult: number;
  /** XP multiplier for fish catches (applied in awardXP). */
  fishXpMult: number;
  /** How many fish can be hooked at once (1–3). */
  fishMaxConcurrent: number;

  // ── Paintball (plane-only) ────────────────────────
  paintballSpeedMult: number;
  paintballRangeMult: number;
  /** Double-Tap burst fire: 2 paintballs ~90ms apart, longer post-burst cooldown. */
  paintballDoubleTapEnabled: boolean;

  // ── Gremlin heart pickups (plane world) ───────────
  /** Heal amount = round(HEAL_HP * this). */
  heartHealMult: number;
  /** Extra heart collectibles; spawned via GremlinHearts.addBonusHearts. */
  worldHeartCountBonus: number;

  // ── Shared economy ────────────────────────────────
  diamondXpMult: number;
  deliveryXpMult: number;
  /** Extra world diamonds; RingManager.spawnBonusDiamonds. */
  diamondCountBonus: number;

  // ── Combo tuning (diamond streaks) — multipliers on base Game constants. ─
  comboWindowMs: number;
  comboMaxSteps: number;
  comboRatePerStep: number;

  // ── Spawn-count bonuses (only rainbows are live) ──
  extraRainbows: number;
  extraFireflies: number;
  extraLanterns: number;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: "performance" | "economy";
  apply: (state: UpgradeState) => void;
}

function defaultState(): UpgradeState {
  return {
    maxSpeedMult: 1,
    boostSpeedMult: 1,
    boostDurationMult: 1,
    altSpeedMult: 1,
    bankMult: 1,
    brakeDecelMult: 1,
    planeGremlinHpMaxMult: 1,

    carpetSpeedMult: 1,
    carpetBoostSpeedMult: 1,
    carpetBoostDurationMult: 1,
    carpetBankMult: 1,
    carpetPortalRadiusMult: 1,
    carpetPortalXpMult: 1,
    carpetSelfieXpMult: 1,

    boatSpeedMult: 1,
    boatTurnMult: 1,
    boatAccelMult: 1,
    boatHighSpeedDiamondMult: 1,

    fishCatchRadiusMult: 1,
    fishFillRateMult: 1,
    fishXpMult: 1,
    fishMaxConcurrent: 1,

    paintballSpeedMult: 1,
    paintballRangeMult: 1,
    paintballDoubleTapEnabled: false,

    heartHealMult: 1,
    worldHeartCountBonus: 0,

    diamondXpMult: 1,
    deliveryXpMult: 1,
    diamondCountBonus: 0,

    comboWindowMs: 1,
    comboMaxSteps: 1,
    comboRatePerStep: 1,

    extraRainbows: 0,
    extraFireflies: 0,
    extraLanterns: 0,
  };
}

/** Shared pool — drawn for any vehicle. */
const SHARED_UPGRADES: UpgradeDefinition[] = [
  {
    id: "prospector",
    name: t("Prospector", "淘金者"),
    description: t("+25% XP per diamond", "每颗钻石经验 +25%"),
    category: "economy",
    apply: (s) => { s.diamondXpMult *= 1.25; },
  },
  {
    id: "diamond_sky",
    name: t("Diamond Sky", "钻石天空"),
    description: t("+4 diamonds in the world", "世界中钻石 +4"),
    category: "economy",
    apply: (s) => { s.diamondCountBonus += 4; },
  },
];

/** Plane ability pool — drawn only while flying the biplane. */
const PLANE_UPGRADES: UpgradeDefinition[] = [
  {
    id: "tailwind",
    name: t("Tailwind", "顺风"),
    description: t("+20% cruise speed", "巡航速度 +20%"),
    category: "performance",
    apply: (s) => { s.maxSpeedMult *= 1.2; },
  },
  {
    id: "afterburner",
    name: t("Afterburner", "加力燃烧"),
    description: t("+18% boost speed", "加速速度 +18%"),
    category: "performance",
    apply: (s) => { s.boostSpeedMult *= 1.18; },
  },
  {
    id: "nitro_tank",
    name: t("Nitro Tank", "氮气罐"),
    description: t("+30% boost duration", "加速持续时间 +30%"),
    category: "performance",
    apply: (s) => { s.boostDurationMult *= 1.30; },
  },
  {
    id: "tight_turn",
    name: t("Tight Turn", "急转弯"),
    description: t("+18% turning responsiveness", "转向响应 +18%"),
    category: "performance",
    apply: (s) => { s.bankMult *= 1.18; },
  },
  {
    id: "sharpshooter",
    name: t("Sharpshooter", "神射手"),
    description: t("Paintball speed +30%, range +25%", "颜料弹速度 +30%，射程 +25%"),
    category: "performance",
    apply: (s) => {
      s.paintballSpeedMult *= 1.30;
      s.paintballRangeMult *= 1.25;
    },
  },
  {
    id: "double_tap",
    name: t("Double Tap", "连发"),
    description: t("Fire two paintballs in rapid succession; slower post-burst cooldown", "快速连发两枚颜料弹；连发后冷却更长"),
    category: "performance",
    apply: (s) => { s.paintballDoubleTapEnabled = true; },
  },
  {
    id: "long_shot",
    name: t("Long Shot", "远程射击"),
    description: t("+20% biplane paintball range", "双翼机颜料弹射程 +20%"),
    category: "performance",
    apply: (s) => { s.paintballRangeMult *= 1.2; },
  },
  {
    id: "hull_reinforced",
    name: t("Reinforced Hull", "强化机身"),
    description: t("+20% max biplane HP", "双翼机最大生命值 +20%"),
    category: "performance",
    apply: (s) => { s.planeGremlinHpMaxMult *= 1.2; },
  },
  {
    id: "bountiful_hearts",
    name: t("Bountiful Hearts", "丰盛之心"),
    description: t("Heart pick-ups restore +30% more HP", "拾取爱心额外恢复 +30% 生命值"),
    category: "performance",
    apply: (s) => { s.heartHealMult *= 1.3; },
  },
  {
    id: "heart_orchard",
    name: t("Heart Orchard", "爱心果园"),
    description: t("+3 heart pick-ups in the world", "世界中爱心拾取物 +3"),
    category: "economy",
    apply: (s) => { s.worldHeartCountBonus += 3; },
  },
];

/** Carpet ability pool. */
const CARPET_UPGRADES: UpgradeDefinition[] = [
  {
    id: "silk_wind",
    name: t("Silk Wind", "丝绸之风"),
    description: t("+12% carpet cruise speed", "飞毯巡航速度 +12%"),
    category: "performance",
    apply: (s) => { s.carpetSpeedMult *= 1.12; },
  },
  {
    id: "tight_tassels",
    name: t("Tight Tassels", "紧实流苏"),
    description: t("+18% bank responsiveness", "倾斜响应 +18%"),
    category: "performance",
    apply: (s) => { s.carpetBankMult *= 1.18; },
  },
  {
    id: "leaf_flourish",
    name: t("Leaf Flourish", "落叶飞舞"),
    description: t("+40% XP from landmark selfie quests", "地标自拍任务经验 +40%"),
    category: "economy",
    apply: (s) => { s.carpetSelfieXpMult *= 1.40; },
  },
];

/** Removed carpet cards — not drawn, but `apply` must run for restored saves. */
const LEGACY_CARPET_UPGRADES: UpgradeDefinition[] = [
  {
    id: "thermal_surge",
    name: "Thermal Surge",
    description: "(removed)",
    category: "performance",
    apply: (s) => {
      s.carpetBoostDurationMult *= 1.35;
      s.carpetBoostSpeedMult *= 1.10;
    },
  },
  {
    id: "wide_portal",
    name: "Wide Portal",
    description: "(removed)",
    category: "performance",
    apply: (s) => { s.carpetPortalRadiusMult *= 1.30; },
  },
];

/** Boat ability pool — fishing-focused + handling + speed. */
const BOAT_UPGRADES: UpgradeDefinition[] = [
  {
    id: "keel_cut",
    name: t("Keel Cut", "破浪龙骨"),
    description: t("+18% cruise speed", "巡航速度 +18%"),
    category: "performance",
    apply: (s) => { s.boatSpeedMult *= 1.18; },
  },
  {
    id: "steady_rudder",
    name: t("Steady Rudder", "稳舵"),
    description: t("+22% turning responsiveness", "转向响应 +22%"),
    category: "performance",
    apply: (s) => { s.boatTurnMult *= 1.22; },
  },
  {
    id: "wide_cast",
    name: t("Wide Cast", "远投"),
    description: t("+15% fishing range radius", "捕鱼范围半径 +15%"),
    category: "performance",
    apply: (s) => { s.fishCatchRadiusMult *= 1.15; },
  },
  {
    id: "quick_reel",
    name: t("Quick Reel", "快速收线"),
    description: t("+22% catch speed", "捕获速度 +22%"),
    category: "performance",
    apply: (s) => { s.fishFillRateMult *= 1.22; },
  },
  {
    id: "twin_lines",
    name: t("Twin Lines", "双线"),
    description: t("Fish two targets at once", "同时捕捉两个目标"),
    category: "performance",
    apply: (s) => { s.fishMaxConcurrent = Math.min(2, s.fishMaxConcurrent + 1); },
  },
  {
    id: "fish_bounty",
    name: t("Fish Bounty", "渔获丰收"),
    description: t("+25% XP from fish catches", "捕鱼经验 +25%"),
    category: "economy",
    apply: (s) => { s.fishXpMult *= 1.25; },
  },
];

/** Old boat cards — not drawn, but `apply` must run for restored saves. */
const LEGACY_BOAT_UPGRADES: UpgradeDefinition[] = [
  {
    id: "foam_surge",
    name: "Foam Surge",
    description: "+35% acceleration from standstill",
    category: "performance",
    apply: (s) => { s.boatAccelMult *= 1.35; },
  },
  {
    id: "wake_rider",
    name: "Wake Rider",
    description: "+25% diamond XP when at 80% max speed or higher",
    category: "economy",
    apply: (s) => { s.boatHighSpeedDiamondMult *= 1.25; },
  },
];

/**
 * Removed or renamed cards: keep `apply` as no-ops so save IDs do not
 * re-run old logic when the state model changed.
 */
const LEGACY_ECONOMY_CARDS: UpgradeDefinition[] = [
  {
    id: "magnet_field",
    name: "Magnet Field",
    description: "(removed)",
    category: "economy",
    apply: () => {},
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "(removed)",
    category: "economy",
    apply: () => {},
  },
  {
    id: "combo_hunter",
    name: "Combo Hunter",
    description: "(removed)",
    category: "economy",
    apply: () => {},
  },
  {
    id: "rainbow_finder",
    name: "Rainbow Finder",
    description: "(removed)",
    category: "economy",
    apply: () => {},
  },
  {
    id: "generous_tip",
    name: "Generous Tip",
    description: "(removed)",
    category: "economy",
    apply: () => {},
  },
  {
    id: "frequent_flyer",
    name: "Frequent Flyer",
    description: "(removed)",
    category: "economy",
    apply: () => {},
  },
];

const ALL_POOLS: UpgradeDefinition[][] = [
  SHARED_UPGRADES,
  PLANE_UPGRADES,
  CARPET_UPGRADES,
  BOAT_UPGRADES,
  LEGACY_BOAT_UPGRADES,
  LEGACY_CARPET_UPGRADES,
  LEGACY_ECONOMY_CARDS,
];

function vehiclePool(vehicle: Vehicle): UpgradeDefinition[] {
  if (vehicle === "plane") return PLANE_UPGRADES;
  if (vehicle === "carpet") return CARPET_UPGRADES;
  return BOAT_UPGRADES;
}

function findUpgradeDef(id: string): UpgradeDefinition | undefined {
  for (const pool of ALL_POOLS) {
    const def = pool.find((u) => u.id === id);
    if (def) return def;
  }
  return undefined;
}

/** Fisher-Yates shuffle (in-place). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export class UpgradeManager {
  state: UpgradeState = defaultState();
  readonly appliedIds = new Set<string>();
  /** Vehicle this manager draws cards for. Defaults to "plane" for callers that haven't plumbed it through yet. */
  private vehicle: Vehicle = "plane";

  setVehicle(vehicle: Vehicle) {
    this.vehicle = vehicle;
  }

  /**
   * Hybrid draw: at least 1 card from the vehicle-specific pool, up to 2 from the shared pool,
   * topped up from whatever remains if the ideal mix can't be filled.
   */
  drawCards(count = 3): UpgradeDefinition[] {
    const vPool = vehiclePool(this.vehicle).filter((u) => !this.appliedIds.has(u.id));
    const sPool = SHARED_UPGRADES.filter((u) => !this.appliedIds.has(u.id));

    const picked: UpgradeDefinition[] = [];
    const seen = new Set<string>();

    const vehicleTarget = Math.min(1, count, vPool.length);
    const shuffledV = shuffle([...vPool]);
    for (let i = 0; i < vehicleTarget; i++) {
      const def = shuffledV[i]!;
      picked.push(def);
      seen.add(def.id);
    }

    const sharedTarget = Math.min(count - picked.length, 2, sPool.length);
    const shuffledS = shuffle([...sPool]);
    for (let i = 0; i < sharedTarget; i++) {
      const def = shuffledS[i]!;
      if (seen.has(def.id)) continue;
      picked.push(def);
      seen.add(def.id);
    }

    if (picked.length < count) {
      const leftover = [
        ...shuffledV.slice(vehicleTarget),
        ...shuffledS.slice(sharedTarget),
      ].filter((u) => !seen.has(u.id));
      shuffle(leftover);
      for (const def of leftover) {
        if (picked.length >= count) break;
        picked.push(def);
        seen.add(def.id);
      }
    }

    return picked;
  }

  /** Apply an upgrade by id. No-ops if already applied or id unknown (supports old save compat). */
  apply(id: string) {
    if (this.appliedIds.has(id)) return;
    const def = findUpgradeDef(id);
    this.appliedIds.add(id);
    if (!def) return;
    def.apply(this.state);
  }

  /** Replay a batch of previously-earned upgrade IDs onto a fresh state. */
  restoreUpgrades(ids: string[]) {
    for (const id of ids) this.apply(id);
  }

  /** Reset to defaults (call on session teardown). */
  reset() {
    this.state = defaultState();
    this.appliedIds.clear();
  }
}
