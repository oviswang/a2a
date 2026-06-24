# Deploy (Vercel + Railway — original architecture)

Two services:

- **Backend + Postgres** → Railway (Express + Socket.io + Prisma, `server/Dockerfile`)
- **Frontend** → Vercel (static Vite/Three.js bundle, `vercel.json`)

Do Railway first so you have the backend URL to give the frontend.

## 1. Backend on Railway

1. <https://railway.app> → **New Project** → **Deploy from GitHub repo** → pick
   `oviswang/a2a` (branch `main`). Railway reads `railway.toml` and builds
   `server/Dockerfile`.
2. **New → Database → PostgreSQL** in the same project.
3. App service → **Variables**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `CLIENT_URL` = your Vercel URL (for CORS; you can fill this after step 2
     below — any `*.vercel.app` origin is already allowed, so it's only needed
     for a custom domain).
   - `PORT` is injected by Railway automatically.
4. App service → **Settings → Networking → Generate Domain**. Note this URL —
   it's the **backend URL** (e.g. `https://<app>.up.railway.app`).

On boot the container runs `prisma migrate deploy` (creates tables) and seeds
20 starter worlds, then starts the API.

## 2. Frontend on Vercel

1. <https://vercel.com> → **Add New… → Project** → import `oviswang/a2a`.
   Vercel reads `vercel.json` (`buildCommand: npm run build -w client`,
   `outputDirectory: client/dist`). Keep the defaults.
2. **Settings → Environment Variables** (Production) — point the client at the
   backend. Pick **one**:
   - `SERVER_URL` = your Railway backend URL  ← recommended (read at runtime via
     `/api/server-url`, change it without rebuilding), **or**
   - commit the URL into `client/.env.production` as
     `VITE_SERVER_URL=https://<app>.up.railway.app` (baked in at build time).
3. Deploy. Open the Vercel URL and play.

> Without a backend URL configured the client falls back to `localhost:3001`
> and multiplayer won't connect in production — so step 2 is required.

## How the client finds the backend

`client/src/runtime/resolveServerUrl.ts`, first match wins:
1. `VITE_SERVER_URL` (build-time, from `client/.env.production`)
2. `GET /api/server-url` (Vercel serverless `api/server-url.js`, reads
   `SERVER_URL` / `VITE_SERVER_URL` — runtime, no rebuild)
3. `FALLBACK_PRODUCTION_SERVER_URL` in `src/config/productionServerUrl.ts`
4. Local dev → `http://localhost:3001`

## Redeploys

Push to `main` → both Railway and Vercel rebuild automatically (Vercel also via
`.github/workflows/vercel-deploy.yml` if you add the `VERCEL_*` secrets).
