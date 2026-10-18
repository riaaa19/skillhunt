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
