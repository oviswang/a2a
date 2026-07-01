/**
 * PWA install guidance — the standard "add to home screen" flow.
 *
 * - Registers the service worker (makes the app installable + caches the shell).
 * - On Android/desktop Chromium: captures `beforeinstallprompt`, then shows our own
 *   banner with an Install button that triggers the native prompt.
 * - On iOS Safari (no install event): shows a banner with "Add to Home Screen" steps.
 * - Shows from the SECOND visit onward, then keeps re-offering on a cooldown
 *   (default 3 days) until the app is installed.
 */
import { t } from "../i18n";

const SW_PATH = "/sw.js";
const LS_VISITS = "a2a_pwa_visits";
const LS_DISMISSED_AT = "a2a_pwa_dismissed_at";
const LS_INSTALLED = "a2a_pwa_installed";

const SHOW_FROM_VISIT = 2; // second visit onward
const REPROMPT_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // re-offer every ~3 days
const SHOW_DELAY_MS = 3500; // let the lobby settle first
const AUTO_HIDE_MS = 16000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let bannerEl: HTMLElement | null = null;
let autoHideTimer: ReturnType<typeof setTimeout> | null = null;
let visits = 0;

function num(key: string): number {
  try {
    return Number(localStorage.getItem(key) || 0);
  } catch {
    return 0;
  }
}
function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode etc. */
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
}
/** iOS Safari (the only iOS browser that can add to home screen). */
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return isIos() && /version\//i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}
function alreadyInstalled(): boolean {
  return isStandalone() || localStorage.getItem(LS_INSTALLED) === "1";
}
function recentlyDismissed(): boolean {
  return Date.now() - num(LS_DISMISSED_AT) < REPROMPT_COOLDOWN_MS;
}

export function initInstallPrompt(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      // If a service worker already controls this page, a later controllerchange means
      // a NEW build has activated (skipWaiting + clients.claim) — reload ONCE so the
      // page runs the fresh deploy instead of the stale cached shell. (Skipped on the
      // first-ever install, where there is no prior controller, to avoid a needless
      // reload.) This is the fix for "new features are deployed but the client keeps
      // serving an old cached build until a manual hard-refresh."
      if (navigator.serviceWorker.controller) {
        let reloaded = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloaded) return;
          reloaded = true;
          window.location.reload();
        });
      }
      navigator.serviceWorker
        .register(SW_PATH)
        .then((reg) => {
          // Proactively check for a newer SW now and hourly, so a deploy is picked up
          // without waiting for the browser's own (up to 24h) update check.
          reg.update().catch(() => {});
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch(() => {});
    });
  }

  if (alreadyInstalled()) {
    set(LS_INSTALLED, "1");
    return;
  }

  // Count this visit.
  visits = num(LS_VISITS) + 1;
  set(LS_VISITS, String(visits));

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    scheduleShow();
  });
  window.addEventListener("appinstalled", () => {
    set(LS_INSTALLED, "1");
    hideBanner();
  });

  // iOS (and any case where beforeinstallprompt never fires) → decide on heuristics.
  scheduleShow();
}

function scheduleShow() {
  window.setTimeout(maybeShow, SHOW_DELAY_MS);
}

function maybeShow() {
  if (bannerEl || alreadyInstalled()) return;
  if (visits < SHOW_FROM_VISIT) return;
  if (recentlyDismissed()) return;
  const ios = isIosSafari();
  if (!deferredPrompt && !ios) return; // not installable on this browser
  showBanner(ios);
}

function dismiss() {
  set(LS_DISMISSED_AT, String(Date.now()));
  hideBanner();
}

function hideBanner() {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
  if (!bannerEl) return;
  const el = bannerEl;
  bannerEl = null;
  el.classList.remove("pwa-banner--in");
  setTimeout(() => el.remove(), 220);
}

function showBanner(ios: boolean) {
  injectStyles();
  const el = document.createElement("div");
  el.className = "pwa-banner";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", t("Install A2A.FUN", "安装 A2A.FUN"));

  const icon = document.createElement("img");
  icon.className = "pwa-banner-icon";
  icon.src = "/favicon-192.png";
  icon.alt = "";

  const body = document.createElement("div");
  body.className = "pwa-banner-body";
  const title = document.createElement("div");
  title.className = "pwa-banner-title";
  title.textContent = t("Install A2A.FUN", "安装 A2A.FUN");
  const desc = document.createElement("div");
  desc.className = "pwa-banner-desc";
  body.appendChild(title);
  body.appendChild(desc);

  const actions = document.createElement("div");
  actions.className = "pwa-banner-actions";

  if (ios) {
    desc.textContent = t(
      "Tap the Share button, then “Add to Home Screen”.",
      "点击底部「分享」按钮，再选择「添加到主屏幕」。",
    );
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "pwa-banner-btn pwa-banner-later";
    ok.textContent = t("Got it", "知道了");
    ok.addEventListener("click", dismiss);
    actions.appendChild(ok);
  } else {
    desc.textContent = t(
      "Add it to your home screen — faster launch, full-screen, app-like.",
      "装到主屏，启动更快、全屏沉浸、像原生 App 一样。",
    );
    const later = document.createElement("button");
    later.type = "button";
    later.className = "pwa-banner-btn pwa-banner-later";
    later.textContent = t("Later", "以后再说");
    later.addEventListener("click", dismiss);
    const install = document.createElement("button");
    install.type = "button";
    install.className = "pwa-banner-btn pwa-banner-install";
    install.textContent = t("Install", "安装");
    install.addEventListener("click", async () => {
      if (!deferredPrompt) {
        dismiss();
        return;
      }
      const dp = deferredPrompt;
      deferredPrompt = null;
      hideBanner();
      try {
        await dp.prompt();
        const choice = await dp.userChoice;
        if (choice.outcome === "accepted") set(LS_INSTALLED, "1");
        else set(LS_DISMISSED_AT, String(Date.now()));
      } catch {
        set(LS_DISMISSED_AT, String(Date.now()));
      }
    });
    actions.appendChild(later);
    actions.appendChild(install);
  }

  const close = document.createElement("button");
  close.type = "button";
  close.className = "pwa-banner-close";
  close.setAttribute("aria-label", t("Dismiss", "关闭"));
  close.textContent = "✕";
  close.addEventListener("click", dismiss);

  el.appendChild(icon);
  el.appendChild(body);
  el.appendChild(actions);
  el.appendChild(close);
  document.body.appendChild(el);
  bannerEl = el;
  requestAnimationFrame(() => el.classList.add("pwa-banner--in"));

  // Auto-hide if ignored, with the standard cooldown so it returns later.
  autoHideTimer = setTimeout(dismiss, AUTO_HIDE_MS);
}

function injectStyles() {
  if (document.getElementById("pwa-banner-styles")) return;
  const s = document.createElement("style");
  s.id = "pwa-banner-styles";
  s.textContent = `
    .pwa-banner {
      position: fixed; left: 50%; transform: translate(-50%, 16px);
      bottom: max(90px, calc(80px + env(safe-area-inset-bottom)));
      z-index: 10070; display: flex; align-items: center; gap: 12px;
      width: min(440px, calc(100vw - 24px)); padding: 12px 14px;
      border-radius: 16px; background: rgba(18, 26, 44, 0.96);
      border: 1px solid rgba(180, 210, 255, 0.28); box-shadow: 0 16px 44px rgba(0,0,0,0.5);
      backdrop-filter: blur(14px); font-family: 'Domine', Georgia, serif;
      color: rgba(235, 243, 255, 0.96); opacity: 0; transition: opacity 0.22s ease, transform 0.22s ease;
      pointer-events: auto;
    }
    .pwa-banner--in { opacity: 1; transform: translate(-50%, 0); }
    .pwa-banner-icon { width: 42px; height: 42px; border-radius: 10px; flex: none; }
    .pwa-banner-body { flex: 1; min-width: 0; }
    .pwa-banner-title { font-size: 0.86rem; font-weight: 700; }
    .pwa-banner-desc { font-size: 0.72rem; line-height: 1.35; color: rgba(220, 232, 255, 0.8); margin-top: 2px; }
    .pwa-banner-actions { display: flex; gap: 8px; flex: none; align-items: center; }
    .pwa-banner-btn { border: none; cursor: pointer; border-radius: 999px; padding: 8px 14px; font: inherit; font-size: 0.74rem; font-weight: 700; }
    .pwa-banner-later { background: rgba(255,255,255,0.10); color: rgba(235,243,255,0.85); }
    .pwa-banner-install { color: #0b1020; background: linear-gradient(135deg, #9fd0ff, #c6a8ff); }
    .pwa-banner-close { position: absolute; top: 6px; right: 8px; background: none; border: none; cursor: pointer; color: rgba(235,243,255,0.5); font-size: 0.8rem; padding: 4px; }
    @media (max-width: 480px) {
      .pwa-banner { flex-wrap: wrap; }
      .pwa-banner-actions { width: 100%; justify-content: flex-end; }
    }
  `;
  document.head.appendChild(s);
}
