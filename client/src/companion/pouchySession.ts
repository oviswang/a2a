import { ProgressionManager } from "../game/ProgressionManager";

/**
 * Short-lived Pouchy companion SESSION token, minted by OUR backend
 * (`POST /api/pouchy-session`) from the owner's Secret Key — the browser never
 * holds a long-lived PAT. Cached in memory with its expiry; re-minted on expiry
 * or a 401. Returns null when the companion isn't configured server-side (no
 * env), which the caller treats as "no companion" (identical to the old
 * "no token pasted" state — never an error).
 */

interface CachedSession {
  token: string;
  /** Epoch ms when the token expires. */
  expiresAt: number;
}

let cached: CachedSession | null = null;
let inflight: Promise<string | null> | null = null;

/** Last mint attempt outcome — surfaced on window.__a2a.companion for debugging
 *  "why is there no companion?" (http 404 = server route not deployed, 503 =
 *  env not configured, 502 = upstream mint failed, network = fetch threw). */
export interface PouchySessionStatus {
  ok: boolean;
  /** "ok" | "not_configured" | "mint_failed" | "http" | "network" | "no_token" | "pending" */
  reason: string;
  httpStatus: number | null;
  at: number | null;
}
let lastStatus: PouchySessionStatus = { ok: false, reason: "pending", httpStatus: null, at: null };
export function getPouchySessionStatus(): PouchySessionStatus {
  return lastStatus;
}

/** Refresh a bit before the real expiry so a call never starts on a dead token. */
const EXPIRY_SKEW_MS = 60_000;

/** Sanitize the visitor id to the platform's allowed charset (alnum + underscore,
 *  length-capped) — an illegal external_user_id is rejected 400 server-side. */
function sanitizeVisitorId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_]/g, "").slice(0, 48);
}

/**
 * Get a valid session token, minting one via the backend if needed.
 * @param serverUrl Base URL of our own game server (from Game.getServerUrl()).
 * @param force     Skip the cache and mint fresh (use after a 401).
 */
export async function getPouchySessionToken(
  serverUrl: string,
  force = false,
): Promise<string | null> {
  const now = Date.now();
  if (!force && cached && now < cached.expiresAt - EXPIRY_SKEW_MS) {
    return cached.token;
  }
  if (inflight) return inflight;

  const visitorId = sanitizeVisitorId(ProgressionManager.loadOrCreateVisitorId());
  inflight = (async () => {
    try {
      const res = await fetch(`${serverUrl}/api/pouchy-session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      // 404 = route not deployed; 503 = env not configured; 502 = upstream mint
      // failed; other 4xx/5xx = mint failed → no companion.
      if (!res.ok) {
        cached = null;
        const reason =
          res.status === 404 ? "http" : res.status === 503 ? "not_configured" : "mint_failed";
        lastStatus = { ok: false, reason, httpStatus: res.status, at: Date.now() };
        console.warn(`[companion] session mint failed: HTTP ${res.status} at ${serverUrl}/api/pouchy-session`);
        return null;
      }
      const data = (await res.json()) as { token?: string; expiresIn?: number };
      if (!data.token) {
        cached = null;
        lastStatus = { ok: false, reason: "no_token", httpStatus: res.status, at: Date.now() };
        return null;
      }
      const ttlMs = Math.max(60_000, (data.expiresIn ?? 3600) * 1000);
      cached = { token: data.token, expiresAt: Date.now() + ttlMs };
      lastStatus = { ok: true, reason: "ok", httpStatus: res.status, at: Date.now() };
      // Mirror into ProgressionManager so the existing token gates + pairing
      // (which read loadCompanionToken()) see the live session token.
      ProgressionManager.saveCompanionToken(data.token);
      return data.token;
    } catch (err) {
      cached = null;
      lastStatus = { ok: false, reason: "network", httpStatus: null, at: Date.now() };
      console.warn(`[companion] session mint request failed (network) at ${serverUrl}/api/pouchy-session`, err);
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Drop the cached token (e.g. after the SDK reports the session is unauthorized),
 *  so the next getPouchySessionToken() mints a fresh one. */
export function invalidatePouchySession(): void {
  cached = null;
  ProgressionManager.clearCompanionToken();
}
