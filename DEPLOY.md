# Deploy (single service on Railway)

This repo is wired so **one** Railway service serves the whole game — the API
server also hosts the built web client, so there's a single public URL and no
separate Vercel frontend.

## Steps (all in the browser, ~5 min)

1. **Create the project**
   - Go to <https://railway.app> → **New Project** → **Deploy from GitHub repo**
   - Pick `oviswang/a2a` (branch `main`).
   - Railway reads `railway.toml` and builds `server/Dockerfile` automatically.

2. **Add a database**
   - In the project: **New** → **Database** → **PostgreSQL**.

3. **Point the app at the database**
   - Open the **app service** → **Variables** → add:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`  (reference the Postgres service)
   - `PORT` is provided by Railway automatically; the server reads it.
   - `CLIENT_URL` is **not** needed (client is same-origin).

4. **Get a public URL**
   - App service → **Settings** → **Networking** → **Generate Domain**.

On boot the container runs `prisma migrate deploy` (creates tables) and seeds
20 starter worlds, then starts the server. Open the generated domain and play.

## How it works

- `server/Dockerfile` is a multi-stage build: it compiles the client
  (`npm run build -w client`) and copies `client/dist` into the runtime image.
- The Express server serves `client/dist` as static files with an SPA fallback
  (`server/src/index.ts`), while `/api/*` and Socket.io stay on the same origin.
- The client resolves its API/Socket.io base URL to the current origin in
  production (`client/src/runtime/resolveServerUrl.ts`), so no build-time URL
  config is required.

## Redeploys

Push to `main` → Railway rebuilds and redeploys automatically.

## Optional: add a Vercel frontend (custom domain)

The Railway URL above is already a complete, playable deployment. Add Vercel
only if you want the client on a separate (e.g. nicer) domain:

1. <https://vercel.com> → **Add New… → Project** → import `oviswang/a2a`.
   - Vercel reads `vercel.json` (`buildCommand: npm run build -w client`,
     `outputDirectory: client/dist`). Leave the defaults.
2. **Project → Settings → Environment Variables** (Production), add:
   - `SERVER_URL` = your Railway URL (e.g. `https://<app>.up.railway.app`)
   - This is **required** — without it the Vercel frontend can't find the game
     server and multiplayer won't connect. It's read at runtime via
     `/api/server-url`, so no rebuild is needed when the URL changes.
3. Deploy. The Vercel domain now serves the client and talks to the Railway API.

CORS already allows any `*.vercel.app` origin; for a custom (non-vercel) domain,
set `CLIENT_URL` on the Railway service to that domain.
