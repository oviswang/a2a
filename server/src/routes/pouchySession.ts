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

const POUCHY_BASE = (process.env.POUCHY_BASE_URL || "https://pouchy.ai").replace(/\/+$/, "");
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
        // Log the key TYPE prefix + length (not the secret) so a wrong/truncated
        // key is diagnosable: expect prefix "pchy_sk_" and a full-length value.
        console.error(
          `pouchy-session mint failed: ${upstream.status} ${detail.slice(0, 200)} ` +
            `(keyPrefix=${secret.slice(0, 8)} keyLen=${secret.length} agent=${agentId})`,
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
