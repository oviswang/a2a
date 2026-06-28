/**
 * Keep the screen awake while the game is open — no dimming, lock screen, or
 * screensaver — via the Screen Wake Lock API.
 *
 * Best-effort and self-healing:
 * - silently no-ops on browsers/platforms without the API (e.g. iOS < 16.4);
 * - the browser auto-releases the lock when the tab is hidden, so we re-acquire
 *   on `visibilitychange` when the page returns to the foreground;
 * - some browsers only grant the first request inside a user gesture, so we also
 *   retry on the first pointer/key interaction.
 *
 * Note: this can only prevent the *screen* from sleeping. OS-level battery-saver
 * modes that the user has enabled may still dim the display; there is no web API
 * to override those, so that part is "if not already set" on the device side.
 */

type Releasable = { released: boolean; release: () => Promise<void>; addEventListener?: (t: string, cb: () => void) => void };

let sentinel: Releasable | null = null;
let active = false;

async function acquire(): Promise<void> {
  if (!active) return;
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<Releasable> } }).wakeLock;
    if (!wl || typeof wl.request !== "function") return;
    if (sentinel && !sentinel.released) return; // already held
    const next = await wl.request("screen");
    sentinel = next;
    next.addEventListener?.("release", () => {
      if (sentinel === next) sentinel = null;
    });
  } catch {
    /* not visible / no gesture / denied / unsupported — ignore and retry later */
  }
}

function onVisibility(): void {
  if (document.visibilityState === "visible") void acquire();
}

function onGesture(): void {
  void acquire();
}

/** Start keeping the screen awake. Idempotent. */
export function enableWakeLock(): void {
  if (active) return;
  active = true;
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pointerdown", onGesture, { passive: true });
  window.addEventListener("keydown", onGesture);
  void acquire();
}

/** Release the lock and stop re-acquiring. */
export function disableWakeLock(): void {
  active = false;
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("pointerdown", onGesture);
  window.removeEventListener("keydown", onGesture);
  try {
    void sentinel?.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
}
