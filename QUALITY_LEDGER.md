# Quality Ledger

A running record of quality-convergence rounds: what the baseline was, what was
found, what was changed and why, how it was verified, and what was consciously
left alone.

---

## Round 1 — 2026-08-31

### 1. Baseline

Measured on `claude/quality-convergence-audit-zi4ez9` (from `5392a8f`).

| Gate | Command | Baseline result |
|---|---|---|
| Lint | — | **No linter configured** (no ESLint/Biome config anywhere) |
| Typecheck (client) | `cd client && tsc --noEmit` | ✅ clean |
| Typecheck (server) | `cd server && tsc --noEmit` | ✅ clean *only after* a manual `prisma generate`; 9 errors without it |
| Unit tests | — | **None** (no test runner, no `*.test.ts` / `*.spec.ts`) |
| Integration tests | — | **None** |
| E2E | — | None automated; `docs/QA.md` documents a manual 2-browser runbook |
| Build (client) | `npm run build -w client` | ✅ 11.9s, 1.83 MB / 518 kB gzip main chunk |
| Build (root) | `npm run build` | ❌ **fails immediately** — `Missing script: "build"` in `shared` |
| Build (server) | `npm run build -w server` | ❌ **never terminates** — the script *booted the server* (`tsx src/index.ts`) instead of building |
| Dead code | manual import-graph scan | 4 unreferenced files |
| Dependencies | `npm audit` | **17 vulnerabilities** (2 critical, 9 high, 5 moderate, 1 low); `--omit=dev`: 12 (7 high) |

Notable: there is **no automated gate of any kind** in CI — `.github/workflows/vercel-deploy.yml`
only deploys.

### 2. Findings (ranked)

Ranked by severity. #11 was found after the fact — see section 7.

| # | Finding | Sev | Evidence | Cost | Risk | Conf. |
|---|---|---|---|---|---|---|
| 1 | **A reconnect never re-joins the room.** Room membership is server-side, keyed by socket id; a reconnect yields a *new* socket id, but `joinWorld` is called exactly once (`Game.ts:6435`) and `SocketClient` had no `connect` re-join. After any transport drop the player is evicted from the room permanently — invisible to others, no `player:update` / `objective:sync` / flag / leviathan traffic — while `socket.connected` (and `window.__a2a.socketConnected`) still read `true`. | **P0** | Reproduced: `scripts/reconnect-check.mts` → server `playerCount` drops 2→1, observer sees no re-join | S | Low | High |
| 2 | **Vulnerable transitive deps on the public, unauthenticated Socket.io server.** `engine.io` polling-transport connection exhaustion, `socket.io-parser` zero-attachment memory exhaustion, `ws` uninitialized-memory disclosure + fragment DoS — all directly reachable from the internet. | **P1** | `npm audit --omit=dev` → 12 vulns / 7 high | S | Low | High |
| 3 | **The documented build command is broken.** `npm run build` dies on step 1 (`shared` has no `build`), and `npm run build -w server` *starts the server*. No contributor or CI can verify a change. | **P1** | Reproduced above | S | Low | High |
| 4 | **No CI gate.** Nothing typechecks, builds, or audits on push/PR. Also nothing asserts the consent-bypassing QA hooks stay tree-shaken out of production. | **P1** | `.github/workflows/` holds only the deploy job | S | Low | High |
| 5 | **`server/.env` is never loaded at runtime.** `.env.example` says "Copy to `.env`", but only the Prisma CLI reads it — `tsx watch src/index.ts` does not, so the documented local setup crashes with `Environment variable not found: DATABASE_URL`. | P2 | Reproduced verbatim | S | Low | High |
| 6 | **Dead code.** `patch.js` / `patch2.js` / `patch3.js` (26 KB of one-off codemods, already applied to source) and `client/src/game/VoidHearts.ts` (161 lines) — zero references in any `.ts`/`.js`/`.json`/`.html`, no dynamic imports. | P2 | Import-graph scan + full-repo grep | S | Low | High |
| 7 | **`docs/QA.md` was factually wrong.** It stated the consent-bypassing QA hooks were "**ENABLED on the public production build**". `client/.env.production` has had `VITE_QA_HOOKS=0` — verified absent from `dist`. A stale security warning trains readers to ignore it. | P2 | grep of `client/dist/assets/*.js` → 0 hits | S | None | High |
| 8 | **Dashboard has no error state.** In `/dashboard`, a failed `refresh()` sets `updated.textContent = "Update failed"` but leaves the table at "Loading active worlds…" and both panels at "Loading…" forever — indistinguishable from a slow load. | P3 | `server/src/index.ts` `refresh()` catch block | S | Low | High |
| 9 | **Unbounded in-memory maps on the server.** `intentDeliverCooldown` (`server/src/index.ts`) is never pruned; `WorldVisitor` rows and worlds created via the unauthenticated `POST /api/worlds` grow without bound and escape overflow cleanup. | P3 | Code reading | M | Med | Med |
| 10 | **No timeout on any `fetch`.** Neither the client (`auto-join`, `pouchy-session`, …) nor the server's Pouchy mint uses `AbortSignal.timeout`; a hung upstream stalls the caller indefinitely. Also, the mint's failure path logs a 16-of-51-character fingerprint of `POUCHY_SECRET_KEY` — debug instrumentation for an already-closed bug (`3b52cac`). | P3 | `grep -rn "fetch(" client/src server/src` → no `AbortController` anywhere | M | Med | High |
| 11 | **The Vercel deploy workflow had never once succeeded.** `.github/workflows/vercel-deploy.yml` failed on **29 consecutive runs** (#122–#150) with `Input required and not supplied: vercel-token` — the `VERCEL_*` secrets were never set. It deployed nothing; Vercel's own Git integration is the real path (`DEPLOY.md`). A permanently red check trains everyone to ignore red checks, which is what a CI gate is for. | P2 | `actions_list` run history + job log | S | Low | High |

### 3. Changes made this round

Selected on impact × confidence ÷ (cost × risk). Findings 8–10 were **not** taken:
each is either cosmetic, or needs a second core mechanism changed in the same round.

#### (a) Replay `world:join` on every connect — finding #1

- **Root cause:** room membership is server-side and socket-id-keyed; the client
  joined once per `SocketClient` instance and never again.
- **Minimal fix:** `SocketClient` remembers the last join and emits it from its
  `connect` handler. To keep it at exactly one join per connection, `joinWorld`
  emits inline *only* when already connected (Socket.io buffers offline emits and
  flushes them on connect, so emitting in both places would double-join).
  `disconnect()` clears the memo so deliberate teardown does not resurrect a join.
- **Files:** `client/src/network/SocketClient.ts` (+42/−1).
- **Compatibility:** none. No wire-format change — the same `world:join` payload,
  just emitted again. Server untouched; `Room.addPlayer` already answers a join
  with a full resync (`world:state`, `flag:sync`, `objective:sync`, `leviathan:sync`).
- **Rollback:** revert the one file.

#### (b) Patch the reachable dependency vulnerabilities — finding #2

- `npm audit fix` — **lockfile-only**, no manifest edits, so every bump is inside
  the ranges already declared: `ws` 8.17→8.21.3, `engine.io` →6.6.9,
  `socket.io-parser` →4.2.7, `socket.io` →4.8.3, `express` →4.22.2, `nanoid` →5.1.16.
- **Files:** `package-lock.json` only.
- **Rollback:** `git checkout package-lock.json && npm ci`.

#### (c) Make the build real, add a CI gate, remove dead code — findings #3–#7

- `package.json`: root `build` no longer calls the non-existent `shared` build
  (`shared` is already typechecked by both client and server tsconfigs via
  `include: ["../shared"]`); added a `typecheck` script.
- `server/package.json`: `build` is now `prisma generate --no-hints && tsc --noEmit`
  (the server runs straight from TS via `tsx`, so "build" *is* generate+typecheck)
  instead of booting the server. `dev` gained `--env-file-if-exists=.env`.
  **`start` was left untouched on purpose** — Railway injects env vars, so the flag
  would add a Node-version constraint to the deploy path for no benefit.
- `.github/workflows/ci.yml`: new, runs on PR + default-branch push, alongside the
  existing deploy workflow. Typechecks + builds both workspaces, asserts the
  consent-bypassing QA hooks are absent from `client/dist`, and audits production
  deps at `--audit-level=critical` (threshold chosen so the gate is green today —
  see residual risks — and still catches the next critical).
- Deleted `patch.js`, `patch2.js`, `patch3.js`, `client/src/game/VoidHearts.ts`.
- `docs/QA.md`: corrected the production-hooks section to match reality, with the
  `grep client/dist` command to re-verify.
- `scripts/reconnect-check.mts`: the integration check written for (a), committed
  so the guarantee is re-runnable (needs a local server + Postgres; not in CI).

### 4. Verification

| Check | Result |
|---|---|
| Typecheck (`npm run typecheck`) | ✅ client + server clean |
| Production build (`npm run build`) | ✅ **now terminates**, exit 0 (was: broken / hung) |
| Client bundle | 1,834.50 kB → **1,834.85 kB** (+0.35 kB, gzip 518.29 → 518.41 kB) — the re-join logic; the deleted files were already tree-shaken out, so removing them does not shrink the bundle |
| Integration: reconnect | ✅ 5/5 — new socket id, **exactly one** join on first connect, **exactly one** on reconnect, fresh `world:state`, server `playerCount` back to 2 |
| Integration: regression gate | ✅ the same check **FAILS** on pre-fix code (`playerCount=1`, 0 re-joins) — it is a real gate, not a tautology |
| Dependency audit | 17 → **4** vulnerabilities; prod Socket.io stack **clean**; `npm audit --omit=dev --audit-level=critical` passes |
| Dead-code rescan | only the 3 legitimate entrypoints (`client/src/main.ts`, `server/src/index.ts`, `shared/index.ts`) remain unreferenced |
| QA-hook containment | `grep -c 'autoAcceptPairs\|acceptDuo\|syncPresence' client/dist/assets/*.js` → **0** in every chunk |
| Server boot + REST | ✅ against real Postgres 16 + `prisma migrate deploy`; `/health`, `/dashboard` (200 text/html), `/api/dashboard/worlds`, `/api/events/dashboard` all correct, incl. empty state |
| `server/.env` DX | ✅ `tsx watch --env-file-if-exists=.env` now boots (`Loaded 20 world(s) into cache`); previously crashed on `DATABASE_URL` |
| Lint | ⚠️ not run — no linter is configured in this repo (unchanged from baseline) |
| Unit tests | ⚠️ not run — no test runner in this repo (unchanged from baseline) |

**Wire / public-surface compatibility:** `shared/types.ts` unchanged; no
`ClientToServerEvents` / `ServerToClientEvents` shape changed; no server code
changed. An old client against a new server, or the reverse, behaves as before.

**Dashboard:** re-checked empty, loading and populated states plus the ≤640px
responsive collapse. Nothing on the page is focusable, so keyboard/AT surface is
unchanged. The missing *error* state is finding #8, deliberately not fixed.

### 5. Regressions

None observed. Performance: unchanged at runtime (the re-join adds one event per
reconnect); the bundle grows 0.35 kB raw / 0.12 kB gzipped. Compatibility: no
public/wire surface touched. Complexity: **−1,059 lines (~30 KB) of source
removed** against +42 lines added in `SocketClient.ts`.

### 6. Residual risks accepted this round

- **4 remaining audit findings, all unreachable by an untrusted party and with no
  in-range fix:** `prisma` → `@prisma/config` → `deepmerge-ts` stack exhaustion
  (Prisma CLI, build/deploy time, input is this repo's own schema) and `esbuild`
  dev-server arbitrary file read (Windows dev only). Re-check when Prisma ships a
  release that moves the `deepmerge-ts` pin.
- **Transient duplicate on an unclean drop.** After a *silent* network loss the
  server only evicts the old socket at ping timeout (~20–45 s), so other players
  may briefly see a stale ghost of the reconnecting player before `player:left`.
  This is bounded, self-healing, and identical to today's page-reload behaviour —
  strictly better than the pre-fix "gone forever". A proper fix (evict a
  same-`visitorId` socket on join) needs `visitorId` plumbed into `Room.addPlayer`;
  deferred so this round does not change two mechanisms at once.
- Findings **#8 (dashboard error state)**, **#9 (unbounded maps / unauthenticated
  `POST /api/worlds`)** and **#10 (no fetch timeouts; partial-secret log
  fingerprint)** remain open — see the table above.
- **No linter and no unit-test runner.** Adding either is a new mechanism, not a
  fix; the CI gate added here (typecheck + build + bundle assertion + audit) is the
  cheapest gate that pays for itself immediately.

### 7. Audit gap found after the fact

Finding #11 was **missed by the first-phase audit**: I read the contents of
`.github/workflows/` but never looked at the workflows' *run history*, so a job
that had failed 29 times running looked like a working deploy pipeline. Reading
CI config is not the same as reading CI results — check both next round.

### 8. Follow-up change (same round)

Deleted `.github/workflows/vercel-deploy.yml` and corrected the `DEPLOY.md`
"Redeploys" section, which claimed the workflow was an available deploy path.
Verified first that it was safe to remove: 29/29 runs failed, so it has deployed
nothing, and `DEPLOY.md` already documents Vercel's Git integration plus the
manual `npm run deploy:client`. No deploy capability is lost.

### 9. Stopping criteria

Stopped after three increments. The remaining open items are P3, or need a second
core mechanism changed in the same round, or are style/theoretical — none clears
impact × confidence ÷ (cost × risk) against what was already shipped.
