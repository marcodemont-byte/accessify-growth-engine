# Backfill event categories for existing event_leads

So that **existing** rows get real `event_category`, `category_confidence`, and `category_source` (not just future inserts), run the backfill once after the columns exist.

## Exact command to run

From the project root:

```bash
npm run backfill:event-categories
```

Or call the API (with dev server running):

```bash
curl -X POST http://localhost:3000/api/admin/backfill-event-categories
```

(If you use `DISCOVERY_API_KEY`, add: `-H "x-api-key: YOUR_KEY"`.)

## What the backfill does (exact logic)

1. **Select rows to update**  
   Fetches up to 5000 rows from `event_leads` with:
   - `id`, `event_name`, `organizer_name`, `event_url`, `event_category`, `category_confidence`, `category_source`

2. **Filter (needsBackfill)**  
   A row is updated if **any** of:
   - `event_category` is `NULL`, `''`, or (case-insensitive) `'unknown'` or `'Unbekannt'`
   - `category_source` is `NULL` or `''`

3. **Per-row update (JS/Supabase)**  
   For each selected row:
   - Run `classifyEventCategory({ event_name, organizer_name, event_url })` → `category`, `confidence`
   - Execute:
   ```js
   supabase.from("event_leads").update({
     event_category: category,
     category_confidence: confidence,
     category_source: "auto_rule",
   }).eq("id", row.id).select("id").single()
   ```
   - Count success only if the update returns one row (no error and `updatedRow` present).

4. **classifyEventCategory()**  
   Implemented in `lib/event-categorization.ts`: normalizes `event_name` + `organizer_name` + `event_url`, scores keyword rules per category (sport, kultur, business, bildung, oeffentlicher_sektor, community), returns best match or `other`/`unknown`, and a 0–1 confidence.

## Why rows might still show unknown/NULL

- **Backfill never run** – You must run the command or API once after the columns exist.
- **Wrong env** – Script/API must use `SUPABASE_SERVICE_ROLE_KEY` (and `NEXT_PUBLIC_SUPABASE_URL`) from `.env.local` so updates are allowed (service role bypasses RLS).
- **RLS** – If you use a key that is subject to RLS, ensure there is an UPDATE policy for that role; the script and API use the service role, which bypasses RLS.
- **Selection** – Rows are included if `event_category` is empty/unknown (any case) or `category_source` is not set; the script now also treats `category_source = NULL` as “needs backfill”.

## Step 0: Add columns (if not already present)

If `event_category` / `category_confidence` / `category_source` don’t exist yet, run in **Supabase Dashboard** → **SQL Editor** the contents of `database/migrations/004_event_category_fields.sql`, then run the backfill command above.
