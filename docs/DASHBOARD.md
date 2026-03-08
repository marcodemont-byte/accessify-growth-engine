# Event Intelligence Dashboard

Internal control surface for event discovery, organizer enrichment, and sales lead management.

> **Docs:** [Documentation index](README.md)

## Tech stack

- **Next.js** (App Router)
- **Supabase** (database + auth)
- **Tailwind CSS** + **shadcn-style** components (Radix UI)
- **lucide-react** icons
- **recharts** for charts
- Deployable on **Vercel**

## Prerequisites

1. **Supabase project** with:
   - `event_leads`, `organizer_contacts`, `contact_people` tables
   - **Auth** enabled (Email provider)
   - Pipeline fields on `event_leads` (see below)

2. **Environment variables** in `.env.local` (required for `npm run build` and auth):
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (required for Auth and for build)
   - `SUPABASE_SERVICE_ROLE_KEY` — (optional for dashboard; used by scripts)

   Get the anon key from **Supabase Dashboard → Project Settings → API → anon public**. If either public env var is missing, the build may fail during static generation.

## Database: pipeline fields

Run the migration so the dashboard can use status, owner, notes, and priority:

1. In Supabase **SQL Editor**, run the contents of **`database/migrations/003_dashboard_pipeline_fields.sql`**.

## Create internal users

1. In Supabase go to **Authentication → Users**.
2. **Add user** → create users with email + password for your team.
3. Only these users can sign in to the dashboard (no public signup).

## Run locally

From the project root:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to **/login** if not authenticated, or **/dashboard** if already logged in.

## Deploy to Vercel

1. **Connect** the repo to Vercel (GitHub/GitLab/Bitbucket).
2. **Environment variables** in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Optional) `SUPABASE_SERVICE_ROLE_KEY` if you run server-side scripts that need it)
3. **Build command:** `npm run build`
4. **Output:** Next.js (default)
5. Deploy. The dashboard will be available at your Vercel URL.

## Pages

| Path         | Description                                  |
| ------------ | -------------------------------------------- |
| `/login`     | Email sign-in (required for dashboard)      |
| `/dashboard` | Overview: KPIs, charts, top opportunities    |
| `/events`    | Event leads table with filters and detail   |
| `/organizers`| Organizers with event count and detail      |
| `/contacts`  | Company + person contacts with filters      |
| `/pipeline`  | Kanban board; drag events to change status  |
| `/settings`  | Placeholder for team/roles (future)         |

## Auth and roles

- Only **authenticated** users can access dashboard routes.
- Unauthenticated users are redirected to **/login**.
- The app is prepared for future **admin / sales** roles (e.g. in Settings); for now, all authenticated users have the same access.
