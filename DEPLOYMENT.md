# Deployment

This is a monorepo:

- `frontend/`: Next.js app for Vercel.
- `backend/`: Ruby on Rails API for Render or Railway.
- Database: external Microsoft SQL Server.

## Frontend on Vercel

Create a Vercel project using `frontend` as the root directory.

- Framework preset: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `.next`

Set these environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain
BACKEND_URL=https://your-backend-domain
```

`NEXT_PUBLIC_API_URL` is used by client-side API calls. `BACKEND_URL` is used by the Next.js rewrite in `next.config.mjs` for `/api/*`.

## Backend on Render

Use `backend` as the root directory. The included `backend/render.yaml` deploys the Rails app with the existing Dockerfile.

Required environment variables:

```env
RAILS_MASTER_KEY=
FRONTEND_URL=https://your-vercel-domain
DB_HOST=
DB_PORT=1433
DB_NAME=
DB_USERNAME=
DB_PASSWORD=
JWT_SECRET=
GAME_SERVER_TOKEN=
DISCORD_WEBHOOK_URL=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://your-vercel-domain/vi/discord/callback
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
RCON_HOST=
RCON_PORT=25575
RCON_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Set `FRONTEND_URL` to the deployed Vercel URL. Use comma-separated URLs if you need preview and production domains.

## Backend on Railway

Create a Railway service from the `backend` directory. The included `backend/railway.json` tells Railway to build from the Dockerfile and use `/up` as the health check path.

Use the same backend environment variables listed for Render.

## Deployment order

1. Deploy the backend first on Render or Railway.
2. Copy the backend public URL.
3. Set `NEXT_PUBLIC_API_URL` and `BACKEND_URL` on Vercel.
4. Deploy the frontend.
5. Set `FRONTEND_URL` on the backend to the final Vercel URL and redeploy the backend.
