# Fastest MVP: 50 real usable organizer leads

Simple, reliable pipeline: **curated sources** → **event_leads** → **organizer contact enrichment**. No Eventbrite.

---

## Pipeline overview

1. **Discovery** – Load events from `sources/*.json`. Only insert into `event_leads` when **event_name** and **organizer_website** are both present. Other fields: organizer_name, country, city, event_date, event_url (all optional but recommended).
2. **Enrichment** – Crawl each `organizer_website`, extract **contact_email** (info@, contact@, hello@, events@) and **LinkedIn company URL**, store in **organizer_contacts** (linked to event_leads via organizer_name).

Schema is unchanged: `event_leads` + `organizer_contacts` (see database/).

---

## Target source types (for your curated lists)

- Trade fair calendars  
- Conference directories  
- Festival websites  
- City event calendars  
- Sports event calendars  

Use these to fill the JSON files with events where you know the **organizer_website** so enrichment can find contacts.

---

## MVP path: 3 steps to 50 leads

### Step 1: Add 50+ events to curated sources

- Edit **sources/dach-events-mvp.json** (or add more `.json` files in **sources/**).
- Each object must have at least:
  - **event_name**
  - **organizer_website**
- Recommended: organizer_name, country (DE|AT|CH), city, event_date (YYYY-MM-DD), event_url.
- Only rows with both **event_name** and **organizer_website** are inserted.

Example:

```json
{
  "event_name": "Tech Conference 2025",
  "organizer_name": "Tech e.V.",
  "organizer_website": "https://www.tech-ev.de",
  "country": "DE",
  "city": "Berlin",
  "event_date": "2025-06-01",
  "event_url": "https://www.tech-ev.de/2025"
}
```

The repo includes **sources/dach-events-mvp.json** with 15 example DACH events. Copy the structure and add more (e.g. from trade fair calendars, conference lists, festival sites) until you have 50+.

### Step 2: Run discovery (insert into event_leads)

From project root:

```bash
npm run discovery:run
```

- Reads all **sources/*.json**.
- Inserts only rows with **event_name** and **organizer_website**.
- Output: fetched events, normalized count, inserted rows, skipped duplicates.

### Step 3: Run organizer contact enrichment (organizer_contacts)

From project root:

```bash
npm run organizer:discover
```

- For each distinct organizer in **event_leads** that has **organizer_website**, crawls the site.
- Extracts **contact_email** (info@, contact@, hello@, events@) and **LinkedIn company** URL.
- Upserts into **organizer_contacts** (link to event_leads via **organizer_name**).

---

## Summary: fastest path to 50 leads

| Step | Command | What it does |
|------|--------|----------------|
| 1 | (Edit files) | Add 50+ events to **sources/dach-events-mvp.json** with **event_name** + **organizer_website**. |
| 2 | `npm run discovery:run` | Load sources → insert into **event_leads** (only when event_name and organizer_website present). |
| 3 | `npm run organizer:discover` | Crawl organizer_website → fill **organizer_contacts** (contact_email, linkedin_url). |

Then use **event_leads** + **organizer_contacts** (join on organizer_name) for your 50+ usable organizer leads.

---

## Optional: add more source files

- Add **sources/trade-fairs.json**, **sources/conferences.json**, etc.
- Same format: array of objects with at least event_name and organizer_website.
- Discovery loads all **sources/*.json** and uses the filename (without .json) as the **source** value in event_leads.
