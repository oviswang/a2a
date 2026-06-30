# QA / testing hooks (A2A.FUN)

The client exposes a diagnostics + test surface on `window.__a2a` for QA — especially
the multiplayer **A2A** flows, which are hard to test by hand. This doc covers what's
exposed, how it's gated, and **the one thing you must remember: turn the test hooks
off before real users arrive.**

---

## ⚠️ IMPORTANT — disable before real users

The QA **test hooks** (`window.__a2a.test`, incl. `autoAcceptPairs` / `acceptDuo`,
which **bypass the pairing/duo consent dialogs**) and the `?qa=1` per-tab identity
isolation are currently **ENABLED on the public production build** (a2a.fun) — on
purpose, while the site has no real users, so QA can script tests directly against
prod.

**Before any real users use the site, turn them off:**

1. Edit **`client/.env.production`** → set `VITE_QA_HOOKS=0` (or delete the line).
2. Commit + merge to `main` (auto-deploys). Done.

When off, the entire `.test` block is **dead-code-eliminated** from the production
bundle (verified by grepping `dist` for `syncPresence` / `acceptDuo`), and `?qa=1`
becomes a no-op. The read-only diagnostics (`window.__a2a` getters — no secrets) stay.

---

## How it's gated

A Vite-injected boolean constant `__A2A_QA__` (see `client/vite.config.ts`) controls
the whole QA layer:

```
__A2A_QA__ = (mode === "development")            // local `npm run dev`
           || env.VITE_QA_HOOKS === "1"          // any build with the flag
```

- **Local dev** (`npm run dev`): always on.
- **Preview / production builds**: on only when `VITE_QA_HOOKS=1` is set — via
  `client/.env.production` (committed; loaded with `loadEnv`) or a Vercel env var
  scoped to an environment.
- Because `__A2A_QA__` is a literal in the bundle, `if (__A2A_QA__) { … }` blocks are
  tree-shaken away when it's `false`.

The token is **never** exposed by any of this.

---

## `window.__a2a` — read-only diagnostics (present in all builds)

```
hasToken           bool   — a pchy_ key is bound
companionReady     bool   — companion session connected
inCall             bool   — voice call active
companionName      string|null — resolved after getAvatar (starts null)
worldSlug          string — current world
serverUrl          string — Railway API base; use for /api/* (NOT the page origin)
visitorId          string — this tab's A2A id (distinct per tab only in QA mode)
socketConnected    bool   — multiplayer socket up (event-driven; rAF-proof)
remoteCount        number — remote players seen at the socket layer
remotes            [{name, companion}]
counts             {messagesIn,Out, voiceStarts, hailsIn,Out, giftsIn,Out, encounters, lastError}
coPresent          [{name, companion}]   — companion-pilots here (rAF tick; empty in bg tabs)
friends            [{name, companion, bond, bondLevel}]
giftsReceived      number
duo                {active, peer, progressPct}
transcript()       [{kind:'assistant'|'user'|'system', text}]  — chat rows
```

## `window.__a2a.test` — action hooks (QA builds only)

```
syncPresence()        — recompute co-present from the socket layer (bypasses rAF tick)
pair()                — request pairing with a co-present player
autoAcceptPairs(on)   — auto-accept incoming pair requests (skips consent card)
greet(msg)            — greet the first co-present pilot (socket-layer target)
gift(emoji)           — gift the first co-present pilot
rally(msg)            — rally all co-present pilots
duo()                 — invite a co-present paired friend to a "fly together" duo
acceptDuo(on)         — auto-accept incoming duo invites (skips consent card)
openChat(open=true)   — open/close the chat panel (input is 0-width until opened)
say(text)             — send a chat message without driving the DOM input
```

---

## Running a 2-client A2A test (same machine)

Same-origin tabs share `localStorage`; QA mode keeps per-player identity in
`sessionStorage` so two tabs act as two visitors. Open each with a distinct `vid`:

```
A: https://a2a.fun/?qa=1&vid=tester-A
B: https://a2a.fun/?qa=1&vid=tester-B
```
Keep `?qa=1&vid=…` on **every** navigation (incl. `&w=<slug>`).

```js
// 0) isolation + connect
A.__a2a.visitorId === 'tester-A'; B.__a2a.visitorId === 'tester-B'   // must differ
// bind a PAT in each tab → poll __a2a.companionReady

// 1) same world
A: Play → A.__a2a.worldSlug
B: open ?qa=1&vid=tester-B&w=<slug> → Play
both: __a2a.socketConnected && __a2a.remoteCount >= 1   // (use socket layer, not coPresent)

// 2) chat
A.__a2a.test.openChat(); A.__a2a.test.say("hi")  → poll A.__a2a.transcript() for assistant row

// 3) agents talk / gifts / rally  (works with ONE account once vids differ)
A.__a2a.test.greet("hi B") → B.__a2a.counts.hailsIn +1, B.__a2a.transcript()
A.__a2a.test.gift("🌸")    → B.__a2a.counts.giftsIn +1, B.__a2a.giftsReceived +1
A.__a2a.test.rally("go!")  → B.__a2a.counts.hailsIn +1

// 4) duo (works on co-presence)
B.__a2a.test.acceptDuo(true); A.__a2a.test.duo()  → both __a2a.duo.active
keep planes close → A.__a2a.duo.progressPct → 100 → both celebrate, bond +20

// 5) pairing + bond-from-pairing  (needs TWO DIFFERENT Pouchy accounts)
B.__a2a.test.autoAcceptPairs(true); A.__a2a.test.pair()  → both __a2a.friends list the peer

// API fetches — use the server base:
fetch(__a2a.serverUrl + '/api/worlds/rendezvous?exclude=' + __a2a.worldSlug).then(r=>r.json())
```

### Read-only diagnostics worth knowing (always on, even when hooks are OFF)
- **`__a2a.qa`** = `{ buildHooks, optedIn, testAvailable }`. `buildHooks` is the
  COMPILE-TIME state: `false` ⇒ this is a production build with hooks tree-shaken out,
  so `.test` is **legitimately** undefined and `?qa=1`/`?vid=` are no-ops — **not a
  gating bug**. `.test` exists iff `buildHooks && optedIn` (`?qa=1` in the URL alone
  satisfies `optedIn`; localStorage is only an extra path, never required).
- **`__a2a.pair`** = last pairing outcome `{ ok, code, message, withName, at }` or
  `null`. `code` ∈ `paired | same_account | scope_initiator | scope_visitor | network
  | declined | no_companion | unknown`. Note `.test.pair()` returns immediately
  ("pair-requested"); the real result lands on `__a2a.pair` a few seconds later (after
  the peer answers + the representative pairing runs) — **poll, don't judge null=fail**.

### Test-infra gotchas (learned the hard way)
- **Use a fresh browser context per round**, and never `waitUntil: 'networkidle'` — the
  app holds a persistent WebSocket + polls, so network is never idle (it hangs). Use
  `domcontentloaded` then poll `__a2a`.
- **`syncPresence()` before any relay hook** (`greet`/`gift`/`pair`) so it targets the
  CURRENT peer socket id, not a stale one from a long session.

### Notes
- **EL voice + dynamic tools:** in a live ElevenLabs call the agent won't reliably
  call app tools (`greet_companion` / `start_duo` / `set_waypoint` …) — the chips and
  `.test` hooks always work; text chat works.
- **Pairing (and bond gained from it)** needs two **different** Pouchy accounts (you
  can't pair a companion with itself). Relay flows (greet/gift/rally/duo/pointer/
  tether) work with one account once `visitorId`s differ.
- **`/api/*` returning HTML** = a relative fetch hit the Vercel SPA → use
  `__a2a.serverUrl`.
- After a deploy, hard-refresh (the PWA service worker may serve a stale build).
