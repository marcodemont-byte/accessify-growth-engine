# Step 1: Supabase database setup for event_leads

This guide walks you through creating the Supabase project, running the schema, configuring `.env.local`, and verifying the connection from the discovery engine.

---

## 1. Create the Supabase project

1. **Sign in or sign up**  
   Go to [supabase.com](https://supabase.com) and log in (or create an account).

2. **New project**  
   - Click **“New project”**.  
   - Choose your **Organization** (or create one).  
   - Fill in:  
     - **Name:** e.g. `accessify-growth-engine`  
     - **Database password:** choose a strong password and **store it safely** (you need it for direct DB access; the app uses the API keys below).  
     - **Region:** pick one close to you (e.g. Frankfurt for DACH).  
   - Click **“Create new project”** and wait until the project is ready (1–2 minutes).

3. **Get the API credentials**  
   - In the left sidebar go to **Project Settings** (gear icon).  
   - Open **API** in the left menu.  
   - You’ll need:  
     - **Project URL** — e.g. `https://xxxxxxxxxxxx.supabase.co`  
     - **Project API keys** → **service_role** (secret) — click “Reveal” and copy.  
   - Use the **anon** key only for public client-side use; for the discovery engine and test script use the **service_role** key (server-side only, never in the browser).

---

## 2. Where to run the SQL schema

1. In the Supabase dashboard, open **SQL Editor** (left sidebar).  
2. Click **“New query”**.  
3. Open the file **`database/event_leads_schema.sql`** from this repo and copy its **entire** contents.  
4. Paste into the SQL Editor.  
5. Click **“Run”** (or press Cmd/Ctrl + Enter).  
6. You should see a success message. The editor may show “Success. No rows returned” — that’s normal for `CREATE TABLE` / `CREATE INDEX`.

**What this creates**

- **`event_leads`** — table for discovered event leads (event_name, organizer_name, contact_email, country, city, venue_name, event_url, event_type, event_date, estimated_audience_size, languages_count, international_visitors_score, public_visibility, accessibility_relevance, lead_score, source, created_at).  
- **`discovery_runs`** — table for logging each discovery run (source, status, records_created, etc.).  
- Indexes and a unique constraint on `(event_name, organizer_name, event_date)` for deduplication.

**Check**

- Go to **Table Editor** in the left sidebar.  
- You should see **`event_leads`** and **`discovery_runs`**.  
- Open **`event_leads`** and confirm the columns match the schema (no data yet is fine).

---

## 3. Create the `.env.local` configuration

1. In the project root, copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Edit **`.env.local`** and set your Supabase values (from step 1):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
   ```
   - Replace `https://xxxxxxxxxxxx.supabase.co` with your **Project URL**.  
   - Replace `eyJ...` with your **service_role** key (the long JWT).  
3. **Do not commit `.env.local`** — it should already be in `.gitignore`.  
4. For step 4 and 5 you only need these two variables; Apify and other keys are optional for the test.

---

## 4. Add a simple test script (insert 3 sample events)

A test script is provided to insert 3 sample event leads and then read them back to verify the connection.

**Run it:**

```bash
npm install
node scripts/test-supabase.js
```

Or with explicit env (if you prefer not to use `.env.local` for the script):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node scripts/test-supabase.js
```

**What it does**

- Loads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (or the environment).  
- Inserts **3 sample rows** into `event_leads` with `source = 'test_script'`.  
- Reads them back and prints the result.  
- On success, prints a short note and how to delete the test rows if you want.

If you see the 3 events printed and no error, the database connection and schema are working.

---

## 5. Verify the connection between the discovery engine and Supabase

**Option A: Use the discovery API (recommended)**

1. Start the Next.js app (it uses `.env.local` automatically):
   ```bash
   npm run dev
   ```
2. In another terminal, trigger mock discovery (writes sample DACH events into `event_leads`):
   ```bash
   curl -X POST http://localhost:3000/api/discovery/run
   ```
3. You should get a JSON response with `"ok": true` and `"recordsCreated": 8` (or similar).  
4. In Supabase **Table Editor** → **event_leads**, you should see 8 new rows with `source = 'mock_dach'`.

**Option B: Health and then discovery**

1. `curl http://localhost:3000/api/health` — should return `{"ok":true,...}`.  
2. `curl -X POST http://localhost:3000/api/discovery/run` — should return success and record count.  
3. Check **event_leads** and **discovery_runs** in Supabase to confirm rows were added.

**Option C: List discovery runs**

- `curl http://localhost:3000/api/discovery/run` — returns recent discovery runs (after at least one POST).  
- Requires Supabase to be configured; if env is missing you’ll get an error, which confirms the app is using the DB.

Once the test script and the discovery API both succeed, the connection between the discovery engine and Supabase is verified.

---

## Summary checklist

- [ ] Supabase project created; Project URL and service_role key copied.  
- [ ] **SQL Editor** → ran full contents of `database/event_leads_schema.sql`.  
- [ ] **Table Editor** → `event_leads` and `discovery_runs` exist with expected columns.  
- [ ] `.env.local` created from `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.  
- [ ] `node scripts/test-supabase.js` runs and prints 3 inserted events.  
- [ ] `npm run dev` and `curl -X POST http://localhost:3000/api/discovery/run` succeed; new rows appear in `event_leads`.
