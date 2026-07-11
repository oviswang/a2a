import { Router } from "express";
import type { Request } from "express";

/**
 * Mints a short-lived Pouchy companion SESSION token for the browser, using the
 * owner's Secret Key (backend env only — never sent to the client). The frontend
 * calls this instead of asking the player to paste a PAT.
 *
 *   POST /api/pouchy-session   body: { visitorId }
 *     → 200 { token, expiresIn }        (session_token, seconds)
 *     → 503 { error }                    (companion not configured — no env)
 *     → 429 { error }                    (rate limited)
 *     → 502 { error }                    (upstream mint failed)
 *
 * Upstream contract (Pouchy platform):
 *   POST {POUCHY_BASE}/v1/sessions
 *   Authorization: Bearer <POUCHY_SECRET_KEY>
 *   { agent: <POUCHY_AGENT_ID>, external_user_id: "a2afun_<visitorId>" }
 *   → 201 { session_token, expires_in, instance }
 */

// Use the canonical `www.` host directly. The apex `pouchy.ai` 30x-redirects
// POST /v1/sessions to `www.pouchy.ai`, and Node's fetch (undici) STRIPS the
// Authorization header on that cross-origin redirect → verify sees no key →
// 401 "invalid or revoked" for ANY key. Hitting www directly = no redirect =
// the Bearer survives. (Confirmed via redirected=true finalUrl=www… logging.)
const POUCHY_BASE = (process.env.POUCHY_BASE_URL || "https://www.pouchy.ai").replace(/\/+$/, "");
const MAX_VISITOR_ID = 48;
/** Min interval between mints per (ip, visitor) — basic anti-abuse. */
const MINT_MIN_INTERVAL_MS = 4000;

/** Keep only alnum + underscore, length-capped (matches the platform's
 *  external_user_id charset; illegal chars would 400 upstream). */
function sanitizeVisitorId(raw: unknown): string {
  return (typeof raw === "string" ? raw : "")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, MAX_VISITOR_ID);
}

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : (fwd ?? "").split(",")[0];
  return (first || req.socket.remoteAddress || "").trim();
}

export function createPouchySessionRouter() {
  const router = Router();
  // In-memory rate-limit: last mint time per (ip|visitor). Pruned when it grows.
  const lastMintAt = new Map<string, number>();

  router.post("/", async (req, res) => {
    try {
      // Trim so a stray trailing newline / space from pasting into the host's
      // env panel doesn't corrupt the Bearer header (a common 401 cause).
      const secret = process.env.POUCHY_SECRET_KEY?.trim();
      const agentId = process.env.POUCHY_AGENT_ID?.trim();
      // Not configured → companion simply unavailable (graceful; the client shows
      // no companion, exactly like the old "no token" state).
      if (!secret || !agentId) {
        res.status(503).json({ error: "companion_not_configured" });
        return;
      }

      const visitorId = sanitizeVisitorId(req.body?.visitorId ?? req.body?.playerId);
      if (!visitorId) {
        res.status(400).json({ error: "visitorId required" });
        return;
      }

      const key = `${clientIp(req)}|${visitorId}`;
      const now = Date.now();
      const last = lastMintAt.get(key) ?? 0;
      if (now - last < MINT_MIN_INTERVAL_MS) {
        res.status(429).json({ error: "slow_down" });
        return;
      }
      lastMintAt.set(key, now);
      if (lastMintAt.size > 5000) {
        for (const [k, t] of lastMintAt) {
          if (now - t > 60_000) lastMintAt.delete(k);
        }
      }

      const upstream = await fetch(`${POUCHY_BASE}/v1/sessions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          agent: agentId,
          external_user_id: `a2afun_${visitorId}`,
        }),
      });

      if (!upstream.ok) {
        const detail = await upstream.text().catch(() => "");
        // Log a NON-SECRET fingerprint so a wrong/old/truncated key is instantly
        // diagnosable (per Pouchy's guidance): first 12 + last 4 chars (= the
        // dashboard's displayed key id) + exact length (a live key is 51 chars) +
        // the raw (pre-trim) length to catch stray whitespace. 16 of 51 chars
        // can't reconstruct the key; only printed on failure.
        const rawLen = (process.env.POUCHY_SECRET_KEY ?? "").length;
        // Also log WHERE the request actually landed. If pouchy.ai 30x-redirects
        // POST to www.pouchy.ai (cross-origin), undici STRIPS the Authorization
        // header on the redirect → verify sees no key → "invalid" for ANY key.
        // `redirected`/`finalUrl` prove/refute that; the Vercel/deployment headers
        // reveal whether /v1/sessions is even the same deploy as /api/version
        // (a stale deploy would still emit the pre-fix error wording).
        const via =
          upstream.headers.get("x-vercel-id") ??
          upstream.headers.get("x-matched-path") ??
          upstream.headers.get("server") ??
          "";
        console.error(
          `pouchy-session mint failed: ${upstream.status} ${detail.slice(0, 160)} ` +
            `(keyId=${secret.slice(0, 12)}…${secret.slice(-4)} keyLen=${secret.length} ` +
            `rawLen=${rawLen} agent=${agentId} base=${POUCHY_BASE} ` +
            `reqUrl=${POUCHY_BASE}/v1/sessions finalUrl=${upstream.url} ` +
            `redirected=${upstream.redirected} via=${via})`,
        );
        res.status(502).json({ error: "mint_failed" });
        return;
      }

      const data = (await upstream.json()) as {
        session_token?: string;
        expires_in?: number;
      };
      if (!data.session_token) {
        console.error("pouchy-session mint: response missing session_token");
        res.status(502).json({ error: "mint_failed" });
        return;
      }

      // Only the short-lived session token + its lifetime reach the browser.
      // The Secret Key and the `instance` block never leave the server.
      res.json({ token: data.session_token, expiresIn: data.expires_in ?? 3600 });
    } catch (err) {
      console.error("pouchy-session POST failed:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
