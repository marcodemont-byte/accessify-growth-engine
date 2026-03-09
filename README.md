# Accessify Growth Engine

Internal **event discovery and lead management** platform for the DACH region. Discover events, enrich organizer and contact data, and manage leads through a pipeline—with a dark-themed dashboard and Supabase backend.

## Features

- **Event discovery** — Mock/sample DACH data or live scraping (Apify), stored in Supabase
- **Dashboard** — KPIs (incl. „Brauchen Coverage“), events-by-country map (DACH), lead coverage charts, top opportunities
- **Event phases & prioritization** — Time-based phases (Zu früh / Vorbereiten / Aktionszone / Zu spät), events table sorted by urgency
- **Event categories** — Rule-based categories (sport, kultur, business, bildung, etc.); auto on insert, backfill for existing rows
- **Events, Organizers, Contacts** — Tables with filters (country, status, category, score) and detail views
- **Pipeline** — Kanban board to move event leads through stages (new → review → contacted → won/lost)
- **Auth** — Email/password sign-in via Supabase Auth; session cookie; no public signup

## Tech stack

| Layer      | Stack |
| ---------- | ----- |
| Framework  | Next.js 14 (App Router) |
| Database   | Supabase (PostgreSQL) |
| Auth       | Supabase Auth (email) |
| UI         | Tailwind CSS, Radix UI (shadcn-style), Lucide icons |
| Charts     | Recharts, react-simple-maps (DACH map) |
| Deploy     | Vercel-ready |

## Quick start

```bash
git clone <repo-url>
cd accessify-growth-engine
npm install
cp .env.local.example .env.local   # then set Supabase URL + keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to **/login**; after sign-in you can use **/dashboard**.

**Required:** A Supabase project with the app schema applied. See [Setup](#setup) below.

## Setup

1. **Supabase** — Create a project at [supabase.com](https://supabase.com). Run the SQL files in order:
   - `database/event_leads_schema.sql`
   - `database/organizer_contacts_schema.sql`
   - `database/contact_people_schema.sql`
   - `database/migrations/001_replace_livestream_with_scoring_fields.sql`
   - `database/migrations/002_add_venue_name_and_event_url.sql`
   - `database/migrations/003_dashboard_pipeline_fields.sql`
   - `database/migrations/004_event_category_fields.sql` (event_category, category_confidence, category_source)
   - Then run the category backfill once: `npm run backfill:event-categories` (see [docs/BACKFILL_EVENT_CATEGORIES.md](docs/BACKFILL_EVENT_CATEGORIES.md))
2. **Auth** — In Supabase: Authentication → Users → add users (email + password). Only these users can log in.
3. **Environment** — In `.env.local` set:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key (for Auth and client)
   - `SUPABASE_SERVICE_ROLE_KEY` — for server-side scripts (optional for dashboard)

Detailed steps: [docs/SETUP.md](docs/SETUP.md) and [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md).

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server (default port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run discovery:run` | Run discovery (mock by default) |
| `npm run discovery:run:sample` | Run discovery with sample flag |
| `npm run organizer:discover` | Organizer discovery script |
| `npm run person:enrich` | Person enrichment script |
| `npm run sources:seed` | Seed DACH events (MVP) |
| `npm run backfill:event-categories` | Backfill event_category for existing event_leads |
| `npm run test:supabase` | Test Supabase connection |

More: [docs/RUNNING.md](docs/RUNNING.md), [HOW_TO_RUN.md](HOW_TO_RUN.md).

## Documentation

| Document | Description |
| -------- | ----------- |
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/VERSION.md](docs/VERSION.md) | **Version / Stand der Anwendung** — saubere Basisversion, wichtige Dateien, Aufbau darauf |
| [docs/SETUP.md](docs/SETUP.md) | Full setup (Supabase, env, migrations, auth) |
| [docs/RUNNING.md](docs/RUNNING.md) | Run locally, scripts, deploy |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | App structure, routes, lib |
| [docs/DASHBOARD.md](docs/DASHBOARD.md) | Dashboard pages and behaviour |
| [docs/API.md](docs/API.md) | API routes reference |
| [docs/BACKFILL_EVENT_CATEGORIES.md](docs/BACKFILL_EVENT_CATEGORIES.md) | Event category backfill (command, logic) |
| [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) | Pre-run checklist |
| [HOW_TO_RUN.md](HOW_TO_RUN.md) | Step-by-step run guide |
| [FILE_STRUCTURE.md](FILE_STRUCTURE.md) | Repo file layout |

## Project structure (high level)

```
app/
  (dashboard)/     # Protected routes: dashboard, events, organizers, contacts, pipeline, settings
  login/           # Sign-in page
  api/             # Health, discovery, events, organizers
database/          # SQL schema and migrations
lib/               # Supabase client, dashboard queries, scoring, discovery
components/        # UI (shadcn-style) and dashboard widgets
docs/              # Markdown documentation
```

See [FILE_STRUCTURE.md](FILE_STRUCTURE.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Version & Aufbau

Der aktuelle Stand (Event-Phasen, Event-Kategorien, Backfill, Auth) ist als **saubere Basisversion** in [docs/VERSION.md](docs/VERSION.md) festgehalten. Dort findest du die wichtigsten Dateien, die Reihenfolge der Migrationen und Hinweise, wie du darauf aufbauen kannst.

## License

Private / internal use. See [LICENSE](LICENSE) if present.
