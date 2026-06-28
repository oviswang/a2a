/**
 * Display-only Chinese localization for procedurally-generated NAMES.
 *
 * IMPORTANT: English remains the CANONICAL key everywhere. World names and NPC
 * names are used as lookup keys (portraits, gender, server payloads, dialogue
 * key fields, etc.). The functions here produce a Chinese *display* string for
 * rendering when the browser is Chinese (`IS_ZH`), and MUST NOT be used where a
 * stable English key is required. When `IS_ZH` is false — or when a word/name
 * has no translation — the original English string is returned unchanged.
 */

import { IS_ZH } from "./i18n";

/** Adjective half of a world name ("<Adjective> <Noun>"). */
const ADJ_ZH: Record<string, string> = {
  Emerald: "翠绿",
  Whispering: "私语",
  Golden: "金色",
  Misty: "薄雾",
  Crimson: "绯红",
  Sapphire: "蔚蓝",
  Drifting: "漂流",
  Luminous: "辉光",
  Frosted: "霜覆",
  Ancient: "远古",
  Velvet: "丝绒",
  Silent: "寂静",
  Coral: "珊瑚",
  Amber: "琥珀",
  Twilight: "暮光",
  Azure: "天青",
  Hollow: "空寂",
  Sunken: "沉没",
  Wandering: "流浪",
  Forgotten: "遗忘",
  Crystal: "水晶",
  Mossy: "苔藓",
  Starlit: "星辉",
  Ivory: "象牙",
  Painted: "彩绘",
  Dusky: "昏暝",
  Shimmering: "微光",
  Rugged: "崎岖",
  Verdant: "苍翠",
  Phantom: "幻影",
};

/** Noun half of a world name ("<Adjective> <Noun>"). */
const NOUN_ZH: Record<string, string> = {
  Archipelago: "群岛",
  Peaks: "峰峦",
  Lagoon: "潟湖",
  Tundra: "冻原",
  Meadows: "草甸",
  Reef: "礁石",
  Horizon: "天际",
  Canopy: "林冠",
  Shores: "海岸",
  Expanse: "苍茫",
  Valley: "山谷",
  Isles: "岛屿",
  Frontier: "边陲",
  Hollows: "幽谷",
  Drift: "浮洲",
  Fjords: "峡湾",
  Caldera: "火山口",
  Ravine: "深壑",
  Steppe: "草原",
  Atoll: "环礁",
  Bluffs: "崖岸",
  Cascade: "飞瀑",
  Enclave: "飞地",
  Thicket: "丛林",
  Narrows: "海峡",
  Basin: "盆地",
  Spires: "尖塔",
  Marshlands: "湿地",
  Coves: "海湾",
  Ridge: "山脊",
};

/**
 * Localize a world name of the form "<Adjective> <Noun>" for display.
 * Splits on the single space, translates each half, and joins WITHOUT a space.
 * Returns the original string unchanged when not Chinese, when the name isn't a
 * two-word name, or when either word has no translation.
 */
export function localizeWorldName(name: string): string {
  if (!IS_ZH) return name;
  const parts = name.split(" ");
  if (parts.length !== 2) return name;
  const [adj, noun] = parts;
  const zhAdj = ADJ_ZH[adj];
  const zhNoun = NOUN_ZH[noun];
  if (zhAdj === undefined || zhNoun === undefined) return name;
  return zhAdj + zhNoun;
}

/** Whimsical cozy NPC display names. Key stays the English original. */
const NPC_DISPLAY_ZH: Record<string, string> = {
  "Granny Maple": "枫婆婆",
  "Old Barnaby": "老巴纳比",
  "Professor Wren": "鹪鹩教授",
  "Captain Moss": "苔藓船长",
  "Baker Finch": "雀面包师",
  "Nana Clover": "三叶草奶奶",
  "Postmaster Quill": "羽笔邮政长",
  "Tinker Lark": "云雀修补匠",
  "Widow Hazel": "榛子寡妇",
  "Farmer Oats": "燕麦农夫",
  "Mayor Bramble": "荆棘镇长",
  "Auntie Rue": "芸香阿姨",
  "Cobbler Pip": "皮普鞋匠",
  "Shepherd Fable": "寓言牧羊人",
  "Librarian Sage": "鼠尾草图书管理员",
  "Warden Flint": "燧石守卫",
  "Tailor Wynn": "温恩裁缝",
  "Fisherman Cork": "软木渔夫",
  "Beekeeper Thyme": "百里香养蜂人",
  "Clockmaker Gale": "疾风钟表匠",
  "Professor Astrid": "阿斯特丽德教授",
  "Stargazer Orion": "猎户观星者",
  "Doctor Celeste": "塞莱斯特医生",
  "Sky Jellyfish": "天空水母",
  "Eternal Flame": "永恒之焰",
};

/**
 * Localize an NPC name for display. Returns the Chinese display name when
 * Chinese and present in the map; otherwise returns the original unchanged.
 * NEVER use the result as a lookup key — pass the raw English name for that.
 */
export function npcDisplayName(name: string): string {
  if (!IS_ZH) return name;
  return NPC_DISPLAY_ZH[name] ?? name;
}
