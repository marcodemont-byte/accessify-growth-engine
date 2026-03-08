# Accessify Growth Engine — file structure

High-level layout of the repository (excluding `node_modules`, `.next`, and build artifacts).

```
accessify-growth-engine/
├── app/
│   ├── layout.tsx                 # Root layout, globals.css, dark theme
│   ├── globals.css                # Tailwind + CSS variables
│   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Sign-in (Supabase Auth)
│   ├── (dashboard)/               # Route group: protected
│   │   ├── layout.tsx            # Sidebar, topbar, DashboardContentGuard
│   │   ├── error.tsx              # Dashboard-area error UI
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Dashboard overview
│   │   │   ├── error.tsx         # Page error UI
│   │   │   └── dashboard-charts.tsx
│   │   ├── events/
│   │   ├── organizers/
│   │   ├── contacts/
│   │   ├── pipeline/
│   │   └── settings/
│   └── api/
│       ├── health/route.ts
│       ├── discovery/run/route.ts
│       ├── events/route.ts
│       ├── events/[id]/status/route.ts
│       └── organizers/[name]/route.ts
├── components/
│   ├── ui/                        # shadcn-style (card, button, badge, etc.)
│   ├── dashboard/                # Sidebar, Topbar
│   ├── error-boundary.tsx
│   └── dashboard-content-guard.tsx
├── lib/
│   ├── supabase/                 # server.ts, client.ts, middleware.ts
│   ├── dashboard-queries.ts
│   ├── scoring.ts
│   ├── utils.ts
│   └── ...
├── database/
│   ├── event_leads_schema.sql
│   ├── organizer_contacts_schema.sql
│   ├── contact_people_schema.sql
│   ├── schema.sql
│   ├── verify_event_leads_and_rls.sql
│   └── migrations/
│       ├── 001_replace_livestream_with_scoring_fields.sql
│       ├── 002_add_venue_name_and_event_url.sql
│       └── 003_dashboard_pipeline_fields.sql
├── scripts/
│   ├── run-discovery.js
│   ├── run-organizer-discovery.js
│   ├── run-person-enrichment.js
│   ├── seed-dach-events-mvp.js
│   └── test-supabase.js
├── types/                         # TS declarations (e.g. react-simple-maps, d3-geo)
├── docs/                          # Markdown documentation
│   ├── README.md                  # Docs index
│   ├── SETUP.md
│   ├── RUNNING.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DASHBOARD.md
│   └── SUPABASE_SETUP.md
├── .env.local.example
├── README.md                      # Main project readme (GitHub)
├── FILE_STRUCTURE.md              # This file
├── HOW_TO_RUN.md
├── SETUP_CHECKLIST.md
├── CONTRIBUTING.md
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
└── middleware.ts                  # Supabase session + auth redirects
```

## Notes

- **App Router:** All pages and layouts live under `app/`. Route groups like `(dashboard)` do not affect the URL path.
- **API routes:** Under `app/api/`; each route has a `route.ts` (GET/POST handlers).
- **Database:** Run base schema files first, then migrations in numeric order (see [docs/SETUP.md](docs/SETUP.md)).
- **Documentation:** Start at [docs/README.md](docs/README.md) or the main [README.md](README.md).
