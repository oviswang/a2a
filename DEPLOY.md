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

> The original split deploy (client → Vercel, server → Railway) still works if
> you prefer it — see `README.md`. The single-service path above is the simpler
> one-URL option.
