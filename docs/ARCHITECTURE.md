# Architecture

High-level structure of the Accessify Growth Engine codebase.

## Stack

- **Next.js 14** — App Router, React Server Components where used
- **Supabase** — PostgreSQL (via Supabase), Auth (email/password)
- **Tailwind CSS** — Styling; design tokens in `app/globals.css`
- **UI** — Radix-based components (shadcn-style) in `components/ui/`
- **Charts** — Recharts; DACH map via react-simple-maps + d3-geo

## App router layout

```
app/
├── layout.tsx              # Root layout; imports globals.css, dark theme
├── globals.css             # Tailwind + CSS variables (light/dark)
├── login/
│   ├── layout.tsx
│   └── page.tsx            # Sign-in (Supabase Auth)
├── (dashboard)/             # Route group: all routes require auth
│   ├── layout.tsx          # Sidebar + topbar + main; DashboardContentGuard
│   ├── error.tsx           # Dashboard-area error UI
│   ├── dashboard/
│   │   ├── page.tsx        # Dashboard overview (KPIs, charts, opportunities)
│   │   ├── error.tsx       # Page-level error UI
│   │   └── dashboard-charts.tsx  # Client: map, pie, line charts
│   ├── events/
│   ├── organizers/
│   ├── contacts/
│   ├── pipeline/
│   └── settings/
└── api/
    ├── health/
    ├── discovery/run/
    ├── events/
    ├── events/[id]/status/
    └── organizers/[name]/
```

- **Middleware** (`middleware.ts` at root) — Handles Supabase session refresh and redirects unauthenticated users to `/login` for dashboard routes.
- **Dashboard content guard** — Layout wraps main content in `DashboardContentGuard` (ErrorBoundary) so a single widget failure does not blank the page.

## Key directories

| Path | Purpose |
| ---- | ------- |
| `app/` | Routes, layouts, pages (App Router) |
| `components/` | Reusable UI: `ui/` (buttons, cards, etc.), `dashboard/` (sidebar, topbar), `error-boundary.tsx`, `dashboard-content-guard.tsx` |
| `lib/` | Server/client utilities: `supabase/` (server + client + middleware), `dashboard-queries.ts`, `event-phases.ts`, `event-categorization.ts`, `scoring.ts`, `utils.ts` |
| `database/` | SQL: base schema and `migrations/` |
| `scripts/` | Node scripts: discovery, organizer discover, person enrich, seed, test-supabase |
| `types/` | TypeScript declarations (e.g. for react-simple-maps, d3-geo) |

## Data flow (dashboard)

- **Dashboard page** (`app/(dashboard)/dashboard/page.tsx`) — Server component. Uses `Promise.allSettled()` to load stats, byCountry, coverage, timeline, opportunities, debug. On rejection or throw, it renders a fallback UI instead of failing.
- **DashboardCharts** — Client component; receives safe data, renders map (DACH), pie (coverage), line (timeline). Each chart is wrapped in an ErrorBoundary; empty data shows placeholders.
- **Queries** — `lib/dashboard-queries.ts`: `getDashboardStats`, `getEventsByCountry`, `getLeadCoverageStatus`, `getUpcomingTimeline`, `getTopUpcomingOpportunities`, `getEventLeadsDebug`. All use Supabase server client from `lib/supabase/server.ts`.

## Database (conceptual)

- **event_leads** — One row per discovered event; includes pipeline fields (`status`, `owner`, `notes`, `priority`) and category fields (`event_category`, `category_confidence`, `category_source`).
- **organizer_contacts** — Organizer-level contact info.
- **contact_people** — Person-level contacts.
- **discovery_runs** — Log of discovery runs.

Schema and migrations are in `database/`; run order is documented in [SETUP.md](SETUP.md).

## Auth

- Supabase Auth (email/password). Users are created in Supabase Dashboard; no in-app signup.
- `lib/supabase/server.ts` — Server client for RSC and API routes.
- `lib/supabase/client.ts` — Browser client for client components.
- `lib/supabase/middleware.ts` — Session refresh and redirect logic.
