/* A2A.FUN service worker — minimal, safe runtime caching.
 * - Navigations: network-first, so new deploys load immediately (falls back to
 *   cache when offline).
 * - Hashed static assets (immutable): cache-first for fast repeat loads + offline.
 * - Cross-origin requests (game API, Pouchy, ElevenLabs, fonts CDN): untouched.
 * Its presence + the manifest make the app installable.
 */
const VERSION = "a2a-v2";
const STATIC_CACHE = `a2a-static-${VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

const ASSET_RE = /\/assets\/|\.(?:js|mjs|css|woff2?|ttf|otf|png|jpe?g|svg|webp|gif|ico|glb|gltf|mp3|wav|ogg)$/i;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Never intercept cross-origin (API, Pouchy, ElevenLabs, font CDNs, analytics).
  if (url.origin !== self.location.origin) return;

  // App shell / navigations → network-first, BYPASSING the HTTP cache, so a new
  // deploy's index.html (with the new hashed JS) always loads on reload instead of a
  // stale cached shell. Falls back to cache only when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-store" }).catch(() =>
        caches.match(req).then((r) => r || caches.match("/")),
      ),
    );
    return;
  }

  // Immutable, hashed static assets → cache-first.
  if (ASSET_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || Promise.reject(e);
        }
      }),
    );
  }
});
