/**
 * Lightweight inline bilingual helper.
 *
 * English is the source string and the fallback; Chinese is shown only when the
 * browser's preferred language is Chinese. Detection runs once at module load:
 * the default is English, and any `zh*` locale (zh, zh-CN, zh-TW, zh-HK, ...)
 * switches the whole UI to Chinese. There is no central dictionary — every call
 * site passes both languages, e.g. `t("Throttle", "油门")`, so the translation
 * lives next to the text it replaces.
 */

function detectChinese(): boolean {
  try {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (!nav) return false;
    const langs =
      Array.isArray(nav.languages) && nav.languages.length > 0
        ? nav.languages
        : [nav.language];
    return langs.some(
      (l) => typeof l === "string" && l.toLowerCase().startsWith("zh"),
    );
  } catch {
    return false;
  }
}

/** True when the UI should render in Chinese. Resolved once at load. */
export const IS_ZH: boolean = detectChinese();

/**
 * Pick the locale-appropriate string. `zh` is optional; when omitted (or when
 * the browser is not Chinese) the English `en` string is returned unchanged.
 */
export function t(en: string, zh?: string): string {
  return IS_ZH && zh !== undefined ? zh : en;
}

// Reflect the active language on <html lang> for a11y / correct font shaping.
if (typeof document !== "undefined") {
  document.documentElement.lang = IS_ZH ? "zh" : "en";
}
