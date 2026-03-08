# API reference

API routes exposed by the Accessify Growth Engine.

Base URL when running locally: `http://localhost:3000` (or the port you use).

---

## Health

### `GET /api/health`

Health check. No authentication required.

**Response (example):**

```json
{
  "ok": true,
  "service": "accessify-growth-engine",
  "version": "1.0",
  "timestamp": "2025-03-07T..."
}
```

---

## Discovery

### `POST /api/discovery/run`

Run event discovery. Writes to Supabase `event_leads` (and logs to `discovery_runs`). Default behaviour uses mock/sample DACH data.

**Query parameters (optional):**

| Param | Description |
| ----- | ----------- |
| `mock` | `true` = force mock; `false` = use live (if configured) |

**Response (example):**

```json
{
  "ok": true,
  "runId": "uuid",
  "source": "mock_dach",
  "status": "success",
  "recordsCreated": 8,
  "mode": "mock"
}
```

**Requirements:** Supabase configured; `event_leads` and `discovery_runs` tables present. Optional: `X-API-Key` header if `DISCOVERY_API_KEY` is set.

### `GET /api/discovery/run`

List recent discovery runs (e.g. source, status, records_created).

---

## Events

### `GET /api/events`

List event leads (from `event_leads`). Supports filtering via query params; exact shape depends on implementation.

### `GET /api/events/[id]/status`

Get status (or related) for a specific event lead by `id`.

---

## Organizers

### `GET /api/organizers/[name]`

Get organizer-related data for the given `name` (e.g. contacts, events). Exact response shape depends on implementation.

---

## Authentication

Dashboard and dashboard-related data are protected by Supabase Auth. API routes that read/write dashboard data use the Supabase server client and rely on the session established by the app (cookies). The health and discovery endpoints are typically callable without a logged-in user.
