# Curated event sources (organizer-first)

Discovery uses **curated JSON files** in this folder for a simple, reliable pipeline. No Eventbrite.

## Target source types

- Trade fair calendars  
- Conference directories  
- Festival websites  
- City event calendars  
- Sports event calendars  

## Required fields (only these are used)

| Field | Required | Notes |
|-------|----------|--------|
| event_name | ✅ | |
| organizer_website | ✅ | **Rows are only inserted if both event_name and organizer_website are set.** |
| organizer_name | | Recommended |
| country | | DE, AT, CH (DACH) |
| city | | |
| event_date | | YYYY-MM-DD |
| event_url | | Event page or registration |

## File format

Add one or more `.json` files. Each file must export an **array** of objects:

```json
[
  {
    "event_name": "DACH 2025 Conference",
    "organizer_name": "Oeschger Centre, University of Bern",
    "organizer_website": "https://www.unibe.ch",
    "country": "CH",
    "city": "Bern",
    "event_date": "2025-06-23",
    "event_url": "https://dach2025.oeschger.unibe.ch"
  }
]
```

- `country` can be `"DE"`, `"AT"`, `"CH"` or full name (e.g. `"Germany"`).  
- Discovery loads all `sources/*.json` files and inserts into `event_leads` (source = filename, e.g. `curated`).  
- **Only rows with both `event_name` and `organizer_website` are inserted.**

## MVP: 50 organizer leads

1. Add 50+ events to `sources/dach-events-mvp.json` (or more files).  
2. Run: `npm run discovery:run`  
3. Run: `npm run organizer:discover` (crawls organizer_website → contact_email, linkedin_url into `organizer_contacts`).

See **docs/DISCOVERY_MVP.md** for the full path.
