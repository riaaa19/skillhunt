# SkillHunt API

## Prerequisites

- Node.js 18+
- A Supabase project with its PostgreSQL database
- The Supabase SQL editor or CLI

Copy `server/.env.example` to `server/.env` and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT` (default `4000`) and `FRONTEND_URL` (default `http://localhost:5173`). Keep the service-role key server-only and never commit it.

Run `server/sql/schema.sql` in Supabase, then seed illustrative data:

```bash
npm install
npm run seed
npm run dev:server
```

The Vite frontend remains available with `npm run dev`; its `/api` requests are proxied to port 4000.

## Endpoints

- `GET /api/health`
- `GET /api/workshops?search=pottery&maxPrice=2000&page=1&limit=24`
- `GET /api/workshops/featured`
- `GET /api/workshops/:id`
- `GET /api/workshops/categories`
- `GET /api/workshops/instructors`
- `GET /api/workshops/calendar?startDate=2026-10-01&endDate=2026-12-31`
- `POST /api/registrations`
- `GET /api/registrations/:id`

Registration JSON:

```json
{
  "participant_name": "Asha Rao",
  "email": "asha@example.com",
  "phone": "+91 9876543210",
  "workshop_id": "workshop-uuid",
  "session_id": "session-uuid"
}
```

Capacity and duplicate checks run inside the `create_registration` PostgreSQL function while locking the session row, so concurrent requests cannot overbook a session.
