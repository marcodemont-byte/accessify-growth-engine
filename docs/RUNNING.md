# Running the app

How to run locally, use npm scripts, and deploy.

## Local development

```bash
npm install
npm run dev
```

Default URL: [http://localhost:3000](http://localhost:3000). To use another port:

```bash
npm run dev -- -p 3001
```

You need a configured Supabase project and `.env.local` (see [SETUP.md](SETUP.md)).

## NPM scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | Run ESLint |
| `npm run discovery:run` | Run discovery (default: mock data) |
| `npm run discovery:run:sample` | Run discovery with sample flag |
| `npm run discovery:run:live` | Run discovery in live mode |
| `npm run organizer:discover` | Run organizer discovery script |
| `npm run person:enrich` | Run person enrichment script |
| `npm run sources:seed` | Seed DACH events (MVP) |
| `npm run test:supabase` | Test Supabase connection (script) |

## Discovery API

With the dev server running:

```bash
# Run discovery (mock data by default)
curl -X POST http://localhost:3000/api/discovery/run

# Optional: force mock
curl -X POST "http://localhost:3000/api/discovery/run?mock=true"
```

Expected response shape (example):

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

List recent runs:

```bash
curl http://localhost:3000/api/discovery/run
```

## Deploy (Vercel)

1. Connect the repo to Vercel (GitHub/GitLab/Bitbucket).
2. In the Vercel project **Environment variables**, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Optional) `SUPABASE_SERVICE_ROLE_KEY` if you run server-side scripts
3. **Build command:** `npm run build`
4. **Output:** Next.js (default)
5. Deploy. The app will be available at the Vercel URL; use `/login` to sign in and `/dashboard` for the dashboard.

See also [DASHBOARD.md](DASHBOARD.md) for dashboard-specific deploy notes.
