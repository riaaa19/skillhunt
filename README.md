# skillhunt.

The project contains the scrapbook-style React frontend and a Supabase-backed Express API.

## Run locally

```bash
npm install
npm run dev:server
npm run dev
```

Set the variables in `server/.env` from `server/.env.example`, run `server/sql/schema.sql` in Supabase, and seed the illustrative data with `npm run seed`. The Vite proxy sends `/api` requests to `http://localhost:4000`.

See [server/README.md](server/README.md) for the API, database setup, deployment notes and registration payload.

The repository includes [vercel.json](vercel.json) and [api/index.js](api/index.js) for deploying the frontend and Express API together on Vercel. Configure the Supabase variables in Vercel's project environment settings; do not commit `server/.env`.
