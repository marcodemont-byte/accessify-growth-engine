# Version / Stand der Anwendung

Dokumentation des aktuellen Funktionsumfangs als **saubere Basisversion** zum Weiteraufbau.

**Stand:** März 2025  
**Version (package.json):** 0.1.0

---

## Überblick

- **Event Discovery & Leads** — DACH-Events in `event_leads`, Pipeline (Status, Owner, Notes, Priority).
- **Event-Phasen & Priorisierung** — Zeitlogik (Zu früh / Vorbereiten / Aktionszone / Zu spät), Sortierung nach Handlungsbedarf, KPI „Brauchen Coverage“.
- **Event-Kategorien** — Regelbasierte Kategorisierung (sport, kultur, business, bildung, oeffentlicher_sektor, community, other, unknown), Backfill für bestehende Zeilen.
- **Dashboard** — KPIs, Charts (Land, Coverage, Timeline), Top-Opportunities, Events-Tabelle mit Phase und Kategorie.
- **Auth** — Supabase Auth (E-Mail/Passwort), Session-Cookie, Redirect ungeschützter Nutzer auf `/login`.

---

## Wichtige Dateien (Referenz)

| Bereich | Datei | Zweck |
|--------|--------|--------|
| **Phasenlogik** | `lib/event-phases.ts` | `getEventPhase()`, `getSortPriority()`, `hasCoverage()`, `EVENT_PHASE_LABELS` |
| **Kategorisierung** | `lib/event-categorization.ts` | `classifyEventCategory()`, `EVENT_CATEGORIES`, Keyword-Regeln |
| **Dashboard-Daten** | `lib/dashboard-queries.ts` | `getDashboardStats`, `getEventLeads`, `getEventLeadsSortedByPriority`, Kategorie-Filter |
| **Ingestion** | `lib/event-leads.ts` | `insertEventLead()` ruft `classifyEventCategory()`; setzt `event_category`, `category_confidence`, `category_source` |
| **Backfill** | `scripts/backfill-event-categories.js` | Kategorien für bestehende `event_leads` nachziehen |
| **Backfill API** | `app/api/admin/backfill-event-categories/route.ts` | POST: gleiche Backfill-Logik per HTTP |
| **Supabase Server** | `lib/supabase/server.ts` | Server-Client für RSC/API (gleiche URL/Key wie Client/Middleware) |
| **Supabase Middleware** | `lib/supabase/middleware.ts` | Session-Refresh, Redirect nicht eingeloggt → `/login` |
| **Events-Seite** | `app/(dashboard)/events/page.tsx` | Lädt `getEventLeadsSortedByPriority` mit Filtern (inkl. Kategorie) |
| **Events-Tabelle** | `app/(dashboard)/events/events-table.tsx` | Phase-Badge, Kategorie-Badge, Filter (Land, Status, Kategorie, Score) |

---

## Datenbank-Migrationen (Reihenfolge)

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `database/event_leads_schema.sql` | Basis `event_leads`, `discovery_runs` |
| 2 | `database/organizer_contacts_schema.sql` | `organizer_contacts` |
| 3 | `database/contact_people_schema.sql` | `contact_people` |
| 4 | `database/migrations/001_replace_livestream_with_scoring_fields.sql` | Scoring-Felder |
| 5 | `database/migrations/002_add_venue_name_and_event_url.sql` | `venue_name`, `event_url` |
| 6 | `database/migrations/003_dashboard_pipeline_fields.sql` | `status`, `owner`, `notes`, `priority` |
| 7 | `database/migrations/004_event_category_fields.sql` | `event_category`, `category_confidence`, `category_source` |

Nach Migration 004: Backfill ausführen, damit bestehende Zeilen echte Kategorien erhalten (siehe [BACKFILL_EVENT_CATEGORIES.md](BACKFILL_EVENT_CATEGORIES.md)).

---

## Event-Phasen (Zeitlogik)

- **Zu früh:** > 90 Tage bis Event
- **Vorbereiten:** 90–61 Tage
- **Aktionszone:** 60–14 Tage
- **Zu spät:** < 14 Tage
- **Vorbei:** Datum in der Vergangenheit

Sortierung in der Events-Tabelle: Vorbereiten ohne Coverage zuerst, dann Aktionszone, Zu früh, Zu spät.  
KPI **„Brauchen Coverage“:** Events im Fenster Vorbereiten (90–61 Tage) ohne Kontaktdaten (E-Mail/LinkedIn).

---

## Event-Kategorien

Werte in `event_leads.event_category`:

`sport`, `kultur`, `business`, `bildung`, `oeffentlicher_sektor`, `community`, `other`, `unknown`

- **Erkennung:** `classifyEventCategory(event_name, organizer_name, event_url)` in `lib/event-categorization.ts`, Keyword-Regeln pro Kategorie.
- **Bei Insert:** Automatisch in `insertEventLead()`; `category_source = 'auto_rule'`.
- **Bestehende Zeilen:** Script `npm run backfill:event-categories` oder POST `/api/admin/backfill-event-categories`.

---

## NPM-Skripte

| Befehl | Beschreibung |
|--------|----------------|
| `npm run dev` | Dev-Server |
| `npm run build` | Production-Build |
| `npm run discovery:run` | Discovery (Mock standard) |
| `npm run backfill:event-categories` | Kategorien für bestehende `event_leads` backfillen |
| Weitere | Siehe `package.json` und [RUNNING.md](RUNNING.md) |

---

## Aufbau darauf

- **Neue KPIs / Charts:** Anbindung in `lib/dashboard-queries.ts` und `app/(dashboard)/dashboard/page.tsx` bzw. `dashboard-charts.tsx`.
- **Neue Event-Felder:** Migration in `database/migrations/` anlegen, dann Typen in `types/event-leads.ts` und `lib/dashboard-queries.ts` (EventLead) anpassen.
- **Kategorien erweitern:** Keywords in `lib/event-categorization.ts` (`CLASSIFY_RULES`) ergänzen; Backfill bei Bedarf erneut ausführen.
- **Phasen-Schwellen ändern:** `lib/event-phases.ts` (`getEventPhase()`: 90, 61, 60, 14 Tage).

Weitere Architektur: [ARCHITECTURE.md](ARCHITECTURE.md), [API.md](API.md), [DASHBOARD.md](DASHBOARD.md).
