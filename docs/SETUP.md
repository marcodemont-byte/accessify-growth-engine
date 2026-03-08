# Setup guide

This guide covers environment, Supabase, schema, migrations, and auth so you can run the app and dashboard locally.

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account ([supabase.com](https://supabase.com))

## 1. Supabase project

1. Create a new project (or use an existing one).
2. Note:
   - **Project URL** — Project Settings → API → Project URL
   - **anon key** — Project Settings → API → anon public
   - **service_role key** — Project Settings → API → service_role (keep secret; server-only)

## 2. Database schema

Run the following in **Supabase → SQL Editor** in this order:

| Order | File | Purpose |
| ----- | ---- | ------- |
| 1 | `database/event_leads_schema.sql` | Tables: `event_leads`, `discovery_runs` |
| 2 | `database/organizer_contacts_schema.sql` | Table: `organizer_contacts` |
| 3 | `database/contact_people_schema.sql` | Table: `contact_people` |
| 4 | `database/migrations/001_replace_livestream_with_scoring_fields.sql` | Scoring fields on `event_leads` |
| 5 | `database/migrations/002_add_venue_name_and_event_url.sql` | Venue and event URL columns |
| 6 | `database/migrations/003_dashboard_pipeline_fields.sql` | Pipeline: `status`, `owner`, `notes`, `priority` |

After running, confirm in **Table Editor** that `event_leads`, `discovery_runs`, `organizer_contacts`, and `contact_people` exist and that `event_leads` has the expected columns (including `status`, `owner`, `notes`, `priority`).

## 3. Authentication

1. In Supabase: **Authentication → Users**.
2. **Add user** → create one or more users with **email** and **password**.
3. Only these users can sign in to the dashboard (no public signup).

## 4. Environment variables

In the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set at least:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

- **NEXT_PUBLIC_SUPABASE_URL** — Required for app and build.
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** — Required for Auth and client; needed for `npm run build` and dashboard login.
- **SUPABASE_SERVICE_ROLE_KEY** — Used by server-side scripts (discovery, enrichment); optional if you only use the dashboard.

Optional:

- `APIFY_API_TOKEN` — For live scraping (future).
- `DISCOVERY_API_KEY` — If you protect the discovery API with an `X-API-Key` header.

Do not commit `.env.local` (it should be in `.gitignore`).

## 5. Install and verify

```bash
npm install
npm run build
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000).
- You should be redirected to `/login`. Sign in with a user created in step 3.
- After login you should reach `/dashboard`.

Health check (no auth):

```bash
curl http://localhost:3000/api/health
```

Expected: `{"ok":true,"service":"accessify-growth-engine",...}`.

## Troubleshooting

- **Blank dashboard / login redirect loop** — Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set and that Auth is enabled in Supabase with at least one user.
- **Build fails** — Ensure both `NEXT_PUBLIC_*` vars are set; Tailwind and app code depend on them at build time.
- **Discovery or scripts fail** — Check `SUPABASE_SERVICE_ROLE_KEY` and that the schema (including migrations) has been applied.

For more detail on Supabase and a connection test script, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
