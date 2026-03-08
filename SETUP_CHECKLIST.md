# Setup checklist — DACH lead discovery engine

Use this checklist before running discovery. **Mock mode only needs Supabase.**

---

## 1. Supabase

- [ ] **Create a project** at [supabase.com](https://supabase.com) (or use an existing one).
- [ ] **Get credentials:**
  - **Project URL:** Project Settings → API → `Project URL` (e.g. `https://xxxx.supabase.co`)
  - **Service role key:** Project Settings → API → `service_role` (under "Project API keys"). Keep this secret; server-only.
- [ ] **Run the v1 schema:**
  - In Supabase: **SQL Editor** → New query.
  - Paste the full contents of **`database/event_leads_schema.sql`**.
  - Run the query. You should see success and two tables: `event_leads`, `discovery_runs`.
- [ ] **Confirm tables:** In **Table Editor**, check that `event_leads` and `discovery_runs` exist and that `event_leads` has columns: `event_name`, `organizer_name`, `organizer_website`, `contact_email`, `linkedin_url`, `country`, `city`, `venue_name`, `event_url`, `event_type`, `event_date`, `estimated_audience_size`, `languages_count`, `international_visitors_score`, `public_visibility`, `accessibility_relevance`, `lead_score`, `source`, `created_at`.

---

## 2. Apify (optional for v1 — only for future live scraping)

- [ ] **Sign up** at [apify.com](https://apify.com).
- [ ] **Get API token:** Apify Console → Settings → Integrations → **API token** (or [console.apify.com/account/integrations](https://console.apify.com/account/integrations)).
- [ ] **Store token** in `.env.local` as `APIFY_API_TOKEN=apify_api_xxx`.  
  v1 uses **mock data only**; you can leave this unset until you enable live discovery.

---

## 3. Local env file

- [ ] Copy the example env file:
  ```bash
  cp .env.local.example .env.local
  ```
- [ ] Edit `.env.local` and set at least:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
  ```
- [ ] (Optional) `APIFY_API_TOKEN=...` for future live runs.  
- [ ] (Optional) `DISCOVERY_API_KEY=...` to require `X-API-Key` header on discovery API.  
- [ ] (Optional) `USE_MOCK_DISCOVERY=true` to force mock even when calling with `?mock=false`.

---

## 4. Install and build

- [ ] Install dependencies: `npm install`
- [ ] Build: `npm run build` (should succeed; Supabase env only needed at **runtime** when you call the discovery API).
- [ ] Start dev server: `npm run dev`.

---

## 5. Quick test

- [ ] **Health (no Supabase needed):**  
  `curl http://localhost:3000/api/health`  
  → Expect `{"ok":true,...}`.
- [ ] **Discovery (Supabase required):**  
  `curl -X POST http://localhost:3000/api/discovery/run`  
  → Expect `{"ok":true,"recordsCreated":8,"mode":"mock",...}` (or similar). Then in Supabase **Table Editor** → `event_leads` you should see 8 DACH sample rows.

---

**Summary:** For v1 you only need **Supabase** (schema + env). Apify is for a later live-scraping phase.
