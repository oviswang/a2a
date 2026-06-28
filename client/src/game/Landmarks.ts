import { Quaternion, Vector3 } from "three";
import { IS_ZH } from "../i18n";

export type LandmarkType =
  | "village"
  | "peak"
  | "forest"
  | "coast"
  | "island"
  | "lighthouse"
  | "windmill"
  | "observatory"
  | "stonehenge"
  | "shrine"
  | "hotspring"
  | "mushroom"
  | "butterfly"
  | "pyramid"
  | "statue"
  | "race_banner";

export interface Landmark {
  type: LandmarkType;
  name: string;
  normal: Vector3;
  enterDot: number;
  exitDot: number;
}

const VILLAGE_ENTER_DOT = 0.995;
const VILLAGE_EXIT_DOT = 0.990;

const REF_UP = new Vector3(0, 1, 0);

/* ── Seeded RNG (same algorithm as Globe.ts) ────────────────────────── */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Name Generator ─────────────────────────────────────────────────── */

const VILLAGE_PREFIXES = [
  "Wind", "Sun", "Moon", "Stone", "River", "Cedar", "Elm", "Fox", "Hawk",
  "Oak", "Pine", "Maple", "Willow", "Fern", "Moss", "Brook", "Cliff",
  "Dawn", "Dusk", "Star", "Amber", "Sage", "Iron", "Coral", "Birch",
  "Briar", "Thorn", "Ash", "Cinder", "Frost", "Hazel", "Laurel",
];

const VILLAGE_SUFFIXES = [
  "haven", "shire", "dale", "ford", "crest", "hollow", "ridge", "brook",
  "vale", "field", "meadow", "town", "wick", "bridge", "moor", "gate",
  "well", "wood", "marsh", "glen", "stead", "worth", "bury", "ham",
];

const LIGHTHOUSE_PREFIXES = [
  "Storm", "Beacon", "Gull", "Tide", "Cape", "Drift", "Anchor", "Reef",
  "Salt", "Fog", "Ember", "North", "South", "Lantern", "Harbour", "Crag",
];

const LIGHTHOUSE_SUFFIXES = [
  " Light", " Point", " Watch", " Rock", " Bluff", " Head", " Reach", " Keep",
];

const WINDMILL_PREFIXES = [
  "Breeze", "Gale", "Harvest", "Golden", "Mill", "Grain", "Wheat", "Rustic",
  "Old", "Meadow", "Spring", "Summer", "Copper", "Iron", "Dusty", "Hilltop",
];

const WINDMILL_SUFFIXES = [
  " Mill", " Wind", " Farm", " Rise", " Knoll", " Hollow", " Wheel", " Grist",
];

const OBSERVATORY_PREFIXES = [
  "Star", "Sky", "Luna", "Astral", "Zenith", "Polar", "Crescent", "Eclipse",
  "Comet", "Solar", "Nebula", "Cosmos", "Aurora", "Meridian", "Apex", "Summit",
];

const OBSERVATORY_SUFFIXES = [
  " Observatory", " Dome", " Watch", " Peak", " Lookout", " Station", " Spire", " Summit",
];

const STONEHENGE_PREFIXES = [
  "Ancient", "Old", "Standing", "Broken", "Hollow", "Forgotten", "Worn", "Silent",
  "Mossy", "Grey", "Crooked", "Lonely", "Wandering", "Sunken", "Crumbling", "Lost",
];

const STONEHENGE_SUFFIXES = [
  " Stones", " Circle", " Ring", " Henge", " Monoliths", " Pillars", " Ruins", " Altar",
];

const SHRINE_PREFIXES = [
  "Quiet", "Moss", "Cedar", "Pine", "Bamboo", "Stone", "Red", "Morning", "Evening", "Lotus",
  "Willow", "Maple", "Silver", "Hidden", "Ancient", "Peaceful", "Misty", "River", "Hill", "Forest",
];

const SHRINE_SUFFIXES = [
  " Shrine", " Gate", " Sanctuary", " Grove", " Rest", " Torii", " Path", " Garden",
];

const HOTSPRING_PREFIXES = [
  "Misty", "Steam", "Warm", "Golden", "Cedar", "Lotus", "Moon", "Dawn", "Willow", "Stone",
  "Hidden", "Ancient", "Silver", "Cloud", "Pine", "River", "Hill", "Valley", "Sun", "Star",
];

const HOTSPRING_SUFFIXES = [
  " Hot Spring", " Springs", " Bath", " Pool", " Onsen", " Waters", " Soak", " Basin",
];

const MUSHROOM_PREFIXES = [
  "Fairy", "Pastel", "Spore", "Toadstool", "Glimmer", "Magic", "Whisper", "Dream", "Witch", "Myco", "Luminous", "Wanderer",
];

const MUSHROOM_SUFFIXES = [
  " Grove", " Garden", " Patch", " Ring", " Hollow", " Thicket", " Glade", " Shade",
];

const BUTTERFLY_PREFIXES = [
  "Monarch", "Flutter", "Painted", "Swallowtail", "Azure", "Silk", "Petal", "Nectar", "Breeze", "Sunwing", "Gossamer",
];

const BUTTERFLY_SUFFIXES = [
  " Garden", " Meadow", " Sanctuary", " Haven", " Bloom", " Rest", " Field", " Retreat",
];

const PYRAMID_PREFIXES = [
  "Sun", "Sand", "Lost", "Golden", "Ancient", "Silent", "Stone", "Desert", "Buried", "Forgotten",
  "Lonely", "Dusk", "Ember", "Crimson", "Ivory", "Sunken", "Lone",
];

const PYRAMID_SUFFIXES = [
  " Pyramid", " Monument", " Tomb", " Ziggurat", " Mausoleum", " Needle", " Spire", " Mound",
];

const STATUE_PREFIXES = [
  "Guardian", "Stone", "Bronze", "Marble", "Silent", "Forgotten", "Hero", "Sage", "Watcher", "Eternal",
  "Golden", "Weathered", "Ancient", "Lone", "Sky", "Summit", "Hollow", "Crimson", "Ivory", "Iron",
];

const STATUE_SUFFIXES = [
  " Memorial", " Monument", " Statue", " Figure", " Effigy", " Colossus", " Sentinel", " Tribute",
];

const RACE_BANNER_PREFIXES = [
  "Sky", "Cloud", "Aero", "Wind", "Storm", "Gale", "Breeze", "Sun", "Star", "Moon",
  "High", "Grand", "Apex", "Zenith", "Summit", "Crest", "Peak", "Crown",
];

const RACE_BANNER_SUFFIXES = [
  " Dash", " Run", " Sprint", " Derby", " Rally", " Circuit", " Track", " Course",
  " Trial", " Chase", " Flight", " Glide", " Soar", " Dive", " Drop", " Plunge",
];

const WORD_LISTS: Record<LandmarkType, { prefixes: string[]; suffixes: string[] }> = {
  village:      { prefixes: VILLAGE_PREFIXES, suffixes: VILLAGE_SUFFIXES },
  peak:         { prefixes: VILLAGE_PREFIXES, suffixes: VILLAGE_SUFFIXES },
  forest:       { prefixes: VILLAGE_PREFIXES, suffixes: VILLAGE_SUFFIXES },
  coast:        { prefixes: VILLAGE_PREFIXES, suffixes: VILLAGE_SUFFIXES },
  island:       { prefixes: VILLAGE_PREFIXES, suffixes: VILLAGE_SUFFIXES },
  lighthouse:   { prefixes: LIGHTHOUSE_PREFIXES, suffixes: LIGHTHOUSE_SUFFIXES },
  windmill:     { prefixes: WINDMILL_PREFIXES, suffixes: WINDMILL_SUFFIXES },
  observatory:  { prefixes: OBSERVATORY_PREFIXES, suffixes: OBSERVATORY_SUFFIXES },
  stonehenge:   { prefixes: STONEHENGE_PREFIXES,  suffixes: STONEHENGE_SUFFIXES },
  shrine:       { prefixes: SHRINE_PREFIXES,      suffixes: SHRINE_SUFFIXES },
  hotspring:    { prefixes: HOTSPRING_PREFIXES,   suffixes: HOTSPRING_SUFFIXES },
  mushroom:     { prefixes: MUSHROOM_PREFIXES,    suffixes: MUSHROOM_SUFFIXES },
  butterfly:    { prefixes: BUTTERFLY_PREFIXES,   suffixes: BUTTERFLY_SUFFIXES },
  pyramid:      { prefixes: PYRAMID_PREFIXES,     suffixes: PYRAMID_SUFFIXES },
  statue:       { prefixes: STATUE_PREFIXES,      suffixes: STATUE_SUFFIXES },
  race_banner:  { prefixes: RACE_BANNER_PREFIXES, suffixes: RACE_BANNER_SUFFIXES },
};

/**
 * Chinese morphemes for every prefix/suffix fragment used above. Suffix
 * fragments in the arrays carry a leading space (e.g. " Light"); the lookup
 * trims that before resolving, so keys here are stored without spaces. When a
 * fragment is missing the assembly falls back to the trimmed English fragment.
 */
const FRAGMENT_ZH: Record<string, string> = {
  // ── Village / peak / forest / coast / island prefixes ──
  Wind: "风", Sun: "阳", Moon: "月", Stone: "石", River: "河",
  Cedar: "杉", Elm: "榆", Fox: "狐", Hawk: "鹰", Oak: "橡",
  Pine: "松", Maple: "枫", Willow: "柳", Fern: "蕨", Moss: "苔",
  Brook: "溪", Cliff: "崖", Dawn: "晨", Dusk: "暮", Star: "星",
  Amber: "琥", Sage: "鼠尾", Iron: "铁", Coral: "珊瑚", Birch: "桦",
  Briar: "棘", Thorn: "刺", Ash: "梣", Cinder: "烬", Frost: "霜",
  Hazel: "榛", Laurel: "桂",
  // ── Village / peak / forest / coast / island suffixes ──
  haven: "港", shire: "郡", dale: "谷", ford: "津", crest: "峰",
  hollow: "坳", ridge: "岭", brook: "溪", vale: "谷", field: "野",
  meadow: "原", town: "镇", wick: "湾", bridge: "桥", moor: "荒",
  gate: "门", well: "泉", wood: "林", marsh: "沼", glen: "峡",
  stead: "庄", worth: "邑", bury: "堡", ham: "村",
  // ── Lighthouse ──
  Storm: "暴", Beacon: "烽", Gull: "鸥", Tide: "潮", Cape: "岬",
  Drift: "漂", Anchor: "锚", Reef: "礁", Salt: "盐", Fog: "雾",
  Ember: "焰", North: "北", South: "南", Lantern: "灯", Harbour: "港",
  Crag: "岩",
  Light: "灯塔", Point: "角", Watch: "瞭望", Rock: "岩", Bluff: "崖",
  Head: "岬", Reach: "湾", Keep: "塔",
  // ── Windmill ──
  Breeze: "微风", Gale: "疾风", Harvest: "丰", Golden: "金", Mill: "磨",
  Grain: "谷", Wheat: "麦", Rustic: "乡", Old: "古", Spring: "春",
  Summer: "夏", Copper: "铜", Dusty: "尘", Hilltop: "丘顶",
  Farm: "农庄", Rise: "坡", Knoll: "丘", Wheel: "轮", Grist: "磨坊",
  // ── Observatory ──
  Sky: "天", Luna: "月", Astral: "星", Zenith: "天顶", Polar: "极",
  Crescent: "弦月", Eclipse: "蚀", Comet: "彗", Solar: "日", Nebula: "云",
  Cosmos: "宇", Aurora: "极光", Meridian: "子午", Apex: "巅", Summit: "顶",
  Observatory: "天文台", Dome: "穹", Peak: "峰", Lookout: "瞭望", Station: "台",
  Spire: "尖塔",
  // ── Stonehenge ──
  Ancient: "古", Standing: "立", Broken: "残", Hollow: "空", Forgotten: "遗忘",
  Worn: "磨", Silent: "寂", Mossy: "苔", Grey: "灰", Crooked: "歪",
  Lonely: "孤", Wandering: "漂泊", Sunken: "沉", Crumbling: "崩", Lost: "失落",
  Stones: "石", Circle: "环", Ring: "圈", Henge: "石阵", Monoliths: "巨石",
  Pillars: "石柱", Ruins: "遗迹", Altar: "祭坛",
  // ── Shrine ──
  Quiet: "静", Bamboo: "竹", Red: "红", Morning: "晨", Evening: "夕",
  Lotus: "莲", Silver: "银", Hidden: "隐", Peaceful: "宁", Misty: "雾",
  Hill: "丘", Forest: "林",
  Shrine: "神社", Sanctuary: "圣域", Grove: "林", Rest: "息", Torii: "鸟居",
  Path: "径", Garden: "园",
  // ── Hotspring ──
  Steam: "汽", Warm: "暖", Cloud: "云", Valley: "谷",
  Bath: "汤", Pool: "池", Onsen: "温泉", Waters: "水", Soak: "浴",
  Basin: "盆", Springs: "泉",
  // ── Mushroom ──
  Fairy: "仙", Pastel: "彩", Spore: "孢", Toadstool: "蕈", Glimmer: "微光",
  Magic: "魔", Whisper: "私语", Dream: "梦", Witch: "巫", Myco: "菌",
  Luminous: "荧", Wanderer: "游者",
  Patch: "圃", Thicket: "丛", Glade: "空地", Shade: "荫",
  // ── Butterfly ──
  Monarch: "帝王", Flutter: "翩", Painted: "彩绘", Swallowtail: "凤蝶", Azure: "蔚",
  Silk: "丝", Petal: "瓣", Nectar: "蜜", Sunwing: "阳翼", Gossamer: "薄纱",
  Haven: "港", Bloom: "花", Retreat: "隐居",
  // ── Pyramid ──
  Sand: "沙", Desert: "漠", Buried: "埋", Crimson: "绯", Ivory: "象牙",
  Lone: "孤",
  Pyramid: "金字塔", Monument: "碑", Tomb: "陵", Ziggurat: "塔庙", Mausoleum: "墓",
  Needle: "针", Mound: "丘",
  // ── Statue ──
  Guardian: "守护", Bronze: "铜", Marble: "玉", Hero: "英雄", Watcher: "守望",
  Eternal: "永恒", Weathered: "风蚀",
  Memorial: "纪念", Statue: "雕像", Figure: "像", Effigy: "塑", Colossus: "巨像",
  Sentinel: "哨", Tribute: "颂",
  // ── Race banner ──
  Aero: "翔", High: "高", Grand: "大", Crown: "冠",
  Dash: "冲", Run: "跑", Sprint: "速", Derby: "赛", Rally: "拉力",
  Circuit: "环道", Track: "道", Course: "径", Trial: "试炼", Chase: "追逐",
  Flight: "飞", Glide: "滑翔", Soar: "翱", Dive: "俯冲", Drop: "落",
  Plunge: "坠",
  // ── Shared (hot spring two-word suffix) ──
  "Hot Spring": "温泉",
  // ── Capitalised suffix variants of lowercase prefix fragments ──
  Meadow: "原", Gate: "门", Field: "野", Crest: "峰",
};

/** Resolve one chosen fragment to its Chinese morpheme, trimming the leading
 *  space carried by suffix fragments. Falls back to the trimmed English. */
function fragmentZh(fragment: string): string {
  const key = fragment.trim();
  return FRAGMENT_ZH[key] ?? key;
}

export function generateLandmarkNames(
  seed: number,
  count: number,
  type: LandmarkType,
): string[] {
  const rand = seededRandom(seed * 7919 + type.charCodeAt(0));
  const { prefixes, suffixes } = WORD_LISTS[type];
  const used = new Set<string>();
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    let name = "";
    let retries = 0;
    do {
      const pi = Math.floor(rand() * prefixes.length);
      const si = Math.floor(rand() * suffixes.length);
      name = IS_ZH
        ? fragmentZh(prefixes[pi]) + fragmentZh(suffixes[si])
        : prefixes[pi] + suffixes[si];
      retries++;
    } while (used.has(name) && retries < 50);

    used.add(name);
    names.push(name);
  }

  return names;
}

/* ── Registry ───────────────────────────────────────────────────────── */

export class LandmarkRegistry {
  private landmarks: Landmark[] = [];

  register(landmark: Landmark) {
    this.landmarks.push(landmark);
  }

  registerVillages(
    villages: { normal: Vector3; houseCount: number }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, villages.length, "village");
    for (let i = 0; i < villages.length; i++) {
      this.landmarks.push({
        type: "village",
        name: names[i],
        normal: villages[i].normal.clone().normalize(),
        enterDot: VILLAGE_ENTER_DOT,
        exitDot: VILLAGE_EXIT_DOT,
      });
    }
  }

  registerLighthouses(
    lighthouses: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, lighthouses.length, "lighthouse");
    for (let i = 0; i < lighthouses.length; i++) {
      this.landmarks.push({
        type: "lighthouse",
        name: names[i],
        normal: lighthouses[i].normal.clone().normalize(),
        enterDot: 0.997,
        exitDot: 0.993,
      });
    }
  }

  registerWindmills(
    windmills: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, windmills.length, "windmill");
    for (let i = 0; i < windmills.length; i++) {
      this.landmarks.push({
        type: "windmill",
        name: names[i],
        normal: windmills[i].normal.clone().normalize(),
        enterDot: 0.996,
        exitDot: 0.992,
      });
    }
  }

  registerObservatories(
    observatories: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, observatories.length, "observatory");
    for (let i = 0; i < observatories.length; i++) {
      this.landmarks.push({
        type: "observatory",
        name: names[i],
        normal: observatories[i].normal.clone().normalize(),
        enterDot: 0.996,
        exitDot: 0.992,
      });
    }
  }

  registerStonehenges(
    stonehenges: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, stonehenges.length, "stonehenge");
    for (let i = 0; i < stonehenges.length; i++) {
      this.landmarks.push({
        type: "stonehenge",
        name: names[i]!,
        normal: stonehenges[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  registerShrines(
    shrines: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, shrines.length, "shrine");
    for (let i = 0; i < shrines.length; i++) {
      this.landmarks.push({
        type: "shrine",
        name: names[i]!,
        normal: shrines[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  registerHotsprings(
    hotsprings: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, hotsprings.length, "hotspring");
    for (let i = 0; i < hotsprings.length; i++) {
      this.landmarks.push({
        type: "hotspring",
        name: names[i]!,
        normal: hotsprings[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  registerMushrooms(
    mushrooms: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, mushrooms.length, "mushroom");
    for (let i = 0; i < mushrooms.length; i++) {
      this.landmarks.push({
        type: "mushroom",
        name: names[i]!,
        normal: mushrooms[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  registerButterflies(
    butterflies: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, butterflies.length, "butterfly");
    for (let i = 0; i < butterflies.length; i++) {
      this.landmarks.push({
        type: "butterfly",
        name: names[i]!,
        normal: butterflies[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  registerPyramids(
    pyramids: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, pyramids.length, "pyramid");
    for (let i = 0; i < pyramids.length; i++) {
      this.landmarks.push({
        type: "pyramid",
        name: names[i]!,
        normal: pyramids[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  registerStatues(
    statues: { normal: Vector3 }[],
    seed: number,
    /** Shown in the fly-over HUD when the eternal-victory memorial exists. */
    memorialPilotName?: string,
  ) {
    const fallback = generateLandmarkNames(seed, statues.length, "statue");
    const pilot = memorialPilotName?.trim();
    for (let i = 0; i < statues.length; i++) {
      this.landmarks.push({
        type: "statue",
        name: pilot && pilot.length > 0 ? pilot : fallback[i]!,
        normal: statues[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  registerRaceBanners(
    banners: { normal: Vector3 }[],
    seed: number,
  ) {
    const names = generateLandmarkNames(seed, banners.length, "race_banner");
    for (let i = 0; i < banners.length; i++) {
      this.landmarks.push({
        type: "race_banner",
        name: names[i]!,
        normal: banners[i]!.normal.clone().normalize(),
        enterDot: 0.995,
        exitDot: 0.991,
      });
    }
  }

  getAll(): readonly Landmark[] {
    return this.landmarks;
  }

  getByType(type: LandmarkType): Landmark[] {
    return this.landmarks.filter((lm) => lm.type === type);
  }
}

/* ── Detector ───────────────────────────────────────────────────────── */

export class LandmarkDetector {
  private active: Landmark | null = null;
  private readonly _playerNormal = new Vector3();

  onEnter: ((landmark: Landmark) => void) | null = null;
  onExit: (() => void) | null = null;

  constructor(private registry: LandmarkRegistry) {}

  update(qPosition: Quaternion) {
    this._playerNormal.copy(REF_UP).applyQuaternion(qPosition).normalize();

    const landmarks = this.registry.getAll();
    let best: Landmark | null = null;
    let bestDot = -1;

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const dot = this._playerNormal.dot(lm.normal);

      if (this.active === lm) {
        if (dot < lm.exitDot) continue;
        if (dot > bestDot) {
          best = lm;
          bestDot = dot;
        }
      } else {
        if (dot > lm.enterDot && dot > bestDot) {
          best = lm;
          bestDot = dot;
        }
      }
    }

    if (best !== this.active) {
      if (this.active && !best) {
        this.active = null;
        this.onExit?.();
      } else if (best && !this.active) {
        this.active = best;
        this.onEnter?.(best);
      } else if (best && this.active && best !== this.active) {
        this.active = best;
        this.onEnter?.(best);
      }
    }
  }
}
