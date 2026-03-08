# How to run the project — step by step

## Prerequisites

- Node.js 18+ and npm.
- A Supabase project (see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md); full setup: [docs/SETUP.md](./docs/SETUP.md)).

---

## Step 1: Clone / open the project

```bash
cd /path/to/accessify-growth-engine
```

(Or open the folder in your editor.)

---

## Step 2: Install dependencies

```bash
npm install
```

---

## Step 3: Configure environment

1. Copy the example env file (if present), or create `.env.local`.
2. Edit `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Project Settings → API.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Project Settings → API (anon public key; required for the dashboard login).
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings → API (service_role key; for scripts).

---

## Step 4: Apply the database schema in Supabase

1. Open your Supabase project → **SQL Editor**.
2. Open the file **`database/event_leads_schema.sql`** in this repo.
3. Copy its full contents into the SQL Editor and run the query.
4. Confirm in **Table Editor** that tables **`event_leads`** and **`discovery_runs`** exist.

---

## Step 5: Run the app locally

```bash
npm run dev
```

You should see something like:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

---

## Step 6: Verify the app is running

In another terminal (or browser):

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"ok":true,"service":"accessify-growth-engine","version":"1.0","timestamp":"..."}
```

---

## Step 7: Run discovery (mock — writes sample DACH data to Supabase)

```bash
curl -X POST http://localhost:3000/api/discovery/run
```

Or with explicit mock flag:

```bash
curl -X POST "http://localhost:3000/api/discovery/run?mock=true"
```

Expected response (example):

```json
{
  "ok": true,
  "runId": "...",
  "source": "mock_dach",
  "status": "success",
  "recordsCreated": 8,
  "mode": "mock"
}
```

---

## Step 8: Check the data in Supabase

1. Supabase → **Table Editor** → **event_leads**.
2. You should see 8 rows (DACH-only sample events: Germany, Austria, Switzerland).
3. Columns include: `event_name`, `organizer_name`, `organizer_website`, `contact_email`, `linkedin_url`, `country`, `city`, `venue_name`, `event_url`, `event_type`, `event_date`, `estimated_audience_size`, `languages_count`, `international_visitors_score`, `public_visibility`, `accessibility_relevance`, `lead_score`, `source`, `created_at`.

---

## Step 9: List recent discovery runs (optional)

```bash
curl http://localhost:3000/api/discovery/run
```

Returns the latest discovery runs (source, status, `records_created`, etc.).

---

## Summary

| Step | Command / action |
|------|------------------|
| 1 | `cd accessify-growth-engine` |
| 2 | `npm install` |
| 3 | Copy `.env.local.example` → `.env.local`, set Supabase URL and service key |
| 4 | Run `database/event_leads_schema.sql` in Supabase SQL Editor |
| 5 | `npm run dev` |
| 6 | `curl http://localhost:3000/api/health` |
| 7 | `curl -X POST http://localhost:3000/api/discovery/run` |
| 8 | Inspect `event_leads` in Supabase Table Editor |

**First version is DACH-only and uses mock/sample data.** Live scraping (Apify) can be added later; until then, discovery always uses the sample dataset and writes to `event_leads`.
