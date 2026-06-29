/**
 * Display-only prettifier for the companion's chat text.
 *
 * The agent sometimes annotates its replies with bracketed emotion cues like
 * "[惊讶]" / "[happy]". We swap those for a matching emoji when RENDERING the
 * message, purely cosmetically — nothing here is ever sent back to the SDK, so
 * the agent's voice / spoken expression is unaffected. Bracket contents we don't
 * recognise (e.g. a "[a2a:slug]" world code) are left exactly as-is.
 */

/** Emotion keyword (Chinese raw / English lowercased) → emoji. */
const EMOTE_MAP: Record<string, string> = {
  // surprise
  "惊讶": "😲", "吃惊": "😲", "震惊": "😲", "惊": "😲",
  surprised: "😲", surprise: "😲", shock: "😲", shocked: "😲", gasp: "😲",
  // happy / smile
  "开心": "😊", "高兴": "😊", "快乐": "😊", "微笑": "🙂", "愉快": "😊",
  happy: "😊", smile: "🙂", smiling: "🙂", joy: "😊", glad: "😊",
  // laugh
  "大笑": "😄", "笑": "😄", "哈哈": "😄", "偷笑": "😆", "傻笑": "😄",
  laugh: "😄", laughing: "😄", lol: "😄", haha: "😄", grin: "😄",
  // sad / cry
  "难过": "😢", "伤心": "😢", "失落": "😢", "委屈": "🥺",
  sad: "😢", upset: "😢",
  "哭": "😭", "大哭": "😭", "流泪": "😢",
  cry: "😭", crying: "😭", sob: "😭",
  // angry
  "生气": "😠", "愤怒": "😠", "恼火": "😠",
  angry: "😠", mad: "😠", annoyed: "😠",
  // shy / blush
  "害羞": "😳", "脸红": "😳", "羞涩": "😳",
  shy: "😳", blush: "😳", blushing: "😳", embarrassed: "😳",
  // love
  "爱心": "❤️", "喜欢": "❤️", "爱": "❤️", "心动": "💖",
  love: "❤️", heart: "❤️", adore: "❤️",
  // excited
  "兴奋": "🤩", "激动": "🤩", "惊喜": "🤩",
  excited: "🤩", thrilled: "🤩", amazed: "🤩",
  // thinking / confused
  "思考": "🤔", "疑惑": "🤔", "困惑": "🤔", "纳闷": "🤔", "想": "🤔",
  thinking: "🤔", think: "🤔", confused: "🤔", hmm: "🤔", curious: "🤔",
  // wink
  "眨眼": "😉", wink: "😉", winking: "😉",
  // worried
  "担心": "😟", "忧虑": "😟", "不安": "😟",
  worried: "😟", worry: "😟", concerned: "😟", nervous: "😟",
  // scared
  "害怕": "😨", "恐惧": "😨", "惊恐": "😱",
  scared: "😨", fear: "😨", afraid: "😨", frightened: "😨",
  // smug / proud
  "得意": "😏", "傲娇": "😏", "自豪": "😌", "骄傲": "😌",
  smug: "😏", proud: "😌",
  // cheer / encourage
  "加油": "💪", "鼓励": "💪", "打气": "💪",
  cheer: "💪", encourage: "💪", fighting: "💪",
  // clap
  "鼓掌": "👏", "拍手": "👏",
  clap: "👏", applause: "👏", bravo: "👏",
  // sleepy / tired
  "困": "😴", "累": "😴", "疲惫": "😴", "犯困": "😴",
  sleepy: "😴", tired: "😴", yawn: "😴",
  // cool
  "酷": "😎", "帅": "😎",
  cool: "😎", awesome: "😎",
  // awkward / sweat
  "无奈": "😅", "汗": "😅", "尴尬": "😅", "苦笑": "😅",
  sweat: "😅", awkward: "😅", oops: "😅",
  // playful
  "调皮": "😜", "淘气": "😜", "俏皮": "😜", "吐舌": "😜",
  playful: "😜", cheeky: "😜", silly: "😜",
  // wave / greet
  "挥手": "👋", "打招呼": "👋", "招手": "👋",
  wave: "👋", waving: "👋", hi: "👋", hello: "👋", hey: "👋",
  // celebrate
  "庆祝": "🎉", "撒花": "🎉", "欢呼": "🎉",
  celebrate: "🎉", party: "🎉", yay: "🎉", hooray: "🎉",
  // misc positive
  "星星": "⭐", star: "⭐", sparkle: "✨", sparkles: "✨", "闪亮": "✨",
  ok: "👌", okay: "👌",
  "感谢": "🙏", "谢谢": "🙏", "感激": "🙏",
  thanks: "🙏", thankyou: "🙏", grateful: "🙏",
  "点赞": "👍", "赞": "👍", "棒": "👍",
  thumbsup: "👍", good: "👍", nice: "👍",
  "晕": "😵", dizzy: "😵",
  "无语": "😑", speechless: "😑",
};

/** Brackets we treat as emotion-cue delimiters (ASCII + full-width). */
const EMOTE_RE = /[\[【]\s*([^\[\]【】]{1,12})\s*[\]】]/g;

/** Replace recognised bracketed emotion cues with an emoji; leave the rest. */
export function emotifyCompanionText(text: string): string {
  if (!text) return text;
  return text.replace(EMOTE_RE, (full, inner: string) => {
    const raw = inner.trim();
    const norm = raw.toLowerCase().replace(/[\s_·!.！。~～]/g, "");
    const emoji = EMOTE_MAP[raw] ?? EMOTE_MAP[norm];
    return emoji ?? full;
  });
}
