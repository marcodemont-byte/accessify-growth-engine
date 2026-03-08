# Lead discovery engine — DACH events

Automatically discovers **physical live events** in the DACH region (Germany, Austria, Switzerland), extracts event and organizer data via Apify, and stores leads in Supabase. Accessify is an accessibility layer for in-person events (not a livestream platform). Discovery **prioritizes** events where: many languages are spoken, large international audiences attend, accessibility is important, and public visibility is high.

## Setup

1. **Apply the database schema** (if not already done):
   ```bash
   # In Supabase: SQL Editor → paste and run database/schema.sql
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables** — copy `.env.local.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only)
   - `APIFY_API_TOKEN` — From [Apify Console](https://console.apify.com/account/integrations)

4. **Optional**: `APIFY_EVENTBRITE_ACTOR_ID` — Override the default Eventbrite actor (must accept `startUrls` and `maxItems`).  
   **Optional**: `DISCOVERY_API_KEY` — If set, `POST/GET /api/discovery/run` require header `X-API-Key: <value>`.

## Apify actors

The default flow uses an **Eventbrite** scraper with DACH city URLs (Berlin, Munich, Vienna, Zurich, etc.). The actor is configured via `APIFY_EVENTBRITE_ACTOR_ID` (default: `compumatic/eventbrite-scraper`).

- **Expected actor input**: `{ startUrls: [{ url: "https://www.eventbrite.com/d/..." }], maxItems?: number }`
- **Expected output**: Array of items with fields such as: `title`/`name`, `url`, `startDate`/`date`, `venue`/`location`/`city`/`country`, `organizer`/`organizerName`/`organizerUrl`/`organizerEmail`/`organizerLinkedIn`, `isOnline`/`isVirtual`, `capacity`/`attendees`.

If your actor uses different field names, extend `lib/normalizers.ts` (e.g. map more keys in `ApifyEventItem` and in `normalizeEventbriteItem`).

To add more sources (e.g. Meetup, conference listings), add a runner in `lib/apify.ts` and a normalizer, then extend the `source` switch in `app/api/discovery/run/route.ts`.

## Running discovery

### Via API (e.g. cron or manual)

```bash
# Default: Eventbrite DACH, up to 100 items
curl -X POST "http://localhost:3000/api/discovery/run" \
  -H "Content-Type: application/json" \
  -d '{"maxItems": 50}'

# With API key (if DISCOVERY_API_KEY is set)
curl -X POST "http://localhost:3000/api/discovery/run" \
  -H "X-API-Key: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"maxItems": 100}'
```

**Response** (success):
```json
{
  "ok": true,
  "runId": "uuid",
  "source": "eventbrite",
  "status": "success",
  "leadsCreated": 12,
  "eventsCreated": 28
}
```

### List recent runs

```bash
curl "http://localhost:3000/api/discovery/run?limit=10" \
  -H "X-API-Key: your-secret"
```

### Local dev

```bash
npm run dev
# Then POST to http://localhost:3000/api/discovery/run
```

Note: Apify runs can take 1–5 minutes. Vercel serverless has `maxDuration = 300` for this route; for longer runs, use an async flow (start run, poll, then ingest in a second request).

## Data stored in Supabase

- **leads** — One per organizer (company name, website, email, LinkedIn, source).
- **lead_events** — One per event (name, date, location, livestream flag, source URL, raw payload). Unique on `(event_name, lead_id, event_date)`.
- **discovery_runs** — Log of each run (source, status, counts, error if failed).

Deduplication: same `organizer_company` + `source` → same lead; same `(event_name, lead_id, event_date)` → one event (re-runs do not create duplicates).

## DACH filtering

Events are included if the scraper output indicates a DACH location (e.g. country/city contains Germany, Austria, Switzerland, or cities like Berlin, Munich, Vienna, Zurich). The default Apify input uses only DACH Eventbrite discovery URLs, so most results are already DACH; the normalizer additionally filters by location when possible.
