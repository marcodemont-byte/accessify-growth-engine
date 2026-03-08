# Organizer contact discovery

Organizer contact discovery crawls each **event_lead** organizer’s website, extracts contact emails and LinkedIn company URLs, and stores them in **organizer_contacts**. Rows are linked to **event_leads** by **organizer_name** (same value in both tables).

## Table: organizer_contacts

| Column          | Type        | Description |
|-----------------|-------------|-------------|
| id              | UUID        | Primary key |
| organizer_name  | TEXT        | **Links to event_leads.organizer_name** |
| website         | TEXT        | Crawled URL (normalized with https) |
| contact_email   | TEXT        | First preferred email found (info@, contact@, hello@, events@) |
| linkedin_url    | TEXT        | First LinkedIn company URL found |
| contact_name    | TEXT        | Optional (not populated by crawler yet) |
| contact_role    | TEXT        | Optional (not populated by crawler yet) |
| source          | TEXT        | e.g. `website_crawl` |
| created_at      | TIMESTAMPTZ | |
| updated_at      | TIMESTAMPTZ | |

- **Unique:** `(organizer_name, website)`. Re-running discovery upserts by this key.

## How to run

1. Apply the schema in Supabase (if not already):

   Run the SQL in **database/organizer_contacts_schema.sql** in the Supabase SQL Editor.

2. Ensure **event_leads** has rows with **organizer_website** set (e.g. from event discovery).

3. From the project root:

   ```bash
   npm run organizer:discover
   ```

The script:

- Selects distinct `(organizer_name, organizer_website)` from **event_leads** where `organizer_website` is not null
- Normalizes URLs (adds `https://` if missing)
- Fetches each homepage (with a 2s delay between requests)
- Extracts emails matching **info@**, **contact@**, **hello@**, **events@**
- Extracts **LinkedIn company** URLs (`linkedin.com/company/...`)
- Upserts into **organizer_contacts** (update on conflict on `organizer_name`, `website`)

## Linking to event_leads

Join in SQL:

```sql
SELECT el.event_name, el.organizer_name, el.country, el.city,
       oc.website, oc.contact_email, oc.linkedin_url
FROM event_leads el
LEFT JOIN organizer_contacts oc ON oc.organizer_name = el.organizer_name
WHERE el.event_date >= CURRENT_DATE
ORDER BY el.event_date, el.organizer_name;
```

No foreign key is defined; the link is the shared **organizer_name** value.

## Env

Uses the same **.env.local** as event discovery: **NEXT_PUBLIC_SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY**.
