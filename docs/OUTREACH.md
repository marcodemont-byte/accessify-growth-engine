# Outreach: professioneller Aufbau und Nutzung der Leads

Dieses Dokument beschreibt den **professionellen Aufbau** der Lead-Daten und die **saubere Nutzung** für Outreach (E-Mail, LinkedIn, Events). Es dient als zentrale Referenz für Prozesse, Qualität und Compliance.

---

## 1. Datenbasis und Herkunft

### 1.1 Lead-Pipeline (Kurzüberblick)

| Stufe | Tabelle / Quelle | Inhalt |
|-------|------------------|--------|
| 1. Discovery | `event_leads` | Events mit event_name, organizer_name, organizer_website, country, city, event_date, event_url (nur DACH). |
| 2. Enrichment | `organizer_contacts` | Pro Organizer: website, contact_email, linkedin_url (aus Crawl von organizer_website). Verknüpfung über `organizer_name`. |

- **Nur Einträge mit gesetztem `organizer_website`** werden für Enrichment genutzt; nur vollständige, valide Datensätze für Outreach verwenden.
- Quellen: kuratierte Listen (z. B. Messen, Konferenzen, Festivals, Stadt-/Sportevents), keine unsicheren Scraper-Ergebnisse für den ersten Kontakt.

### 1.2 Verwendete Quellen (Beispiele)

- Offizielle Messen-/Veranstalter-Webseiten (AUMA, Messe Frankfurt, Messe München, Koelnmesse, etc.)
- Konferenz- und Festival-Webseiten (Salzburger Festspiele, Art Basel, Bits & Pretzels, etc.)
- Städtische und touristische Event-Kalender (Städte, Regionen)
- Offizielle Sportveranstalter (Marathons, Großevents)

Details und konkrete URLs liegen in den Scripts/Kommentaren (z. B. `scripts/seed-dach-events-mvp.js`) und in `sources/README.md`.

---

## 2. Datenqualität für Outreach

### 2.1 Mindestanforderungen pro Lead

Für **seriösen Erstkontakt** nur Leads nutzen, bei denen mindestens gilt:

- **event_leads:** `event_name`, `organizer_name`, `organizer_website`, `country`, `city`, `event_date` (oder plausibel), `event_url` vorhanden und plausibel.
- **organizer_contacts:** Für E-Mail-Outreach mindestens `contact_email` vorhanden; für LinkedIn-Outreach `linkedin_url` nutzbar.

Fehlende oder unsichere E-Mail-Adressen nicht erfinden; bei Bedarf manuell prüfen oder Segment „nur LinkedIn“ führen.

### 2.2 Deduplizierung und Aktualität

- Deduplizierung über **event_name + organizer_name + event_date** (bereits in Pipeline berücksichtigt).
- Vor größeren Kampagnen: Stichproben auf Aktualität (event_date, erreichbare URLs, ggf. aktuelle Ansprechpartner).

---

## 3. Nutzung für Outreach

### 3.1 Typische Abfrage (Event-Leads mit Kontakt)

```sql
SELECT
  el.event_name,
  el.organizer_name,
  el.country,
  el.city,
  el.event_date,
  el.event_url,
  oc.website AS organizer_website,
  oc.contact_email,
  oc.linkedin_url
FROM event_leads el
LEFT JOIN organizer_contacts oc ON oc.organizer_name = el.organizer_name
WHERE el.event_date >= CURRENT_DATE
  AND (oc.contact_email IS NOT NULL OR oc.linkedin_url IS NOT NULL)
ORDER BY el.event_date, el.country, el.organizer_name;
```

- Nur Leads mit mindestens E-Mail **oder** LinkedIn für Outreach verwenden.
- Nach Bedarf filtern nach Land, Stadt, Zeitraum oder Event-Typ.

### 3.2 Empfohlener Prozess

1. **Segment wählen** (z. B. nur DE, nur Konferenzen, nur nächste 3 Monate).
2. **Export** aus Supabase (CSV/Excel) mit obigen Feldern.
3. **Stichproben** prüfen (E-Mail erreichbar, LinkedIn-Profil passt zum Organisator).
4. **Ansprache** personalisiert und sachlich (Event-Kontext, konkreter Nutzen, klare Handlungsaufforderung).
5. **Tracking** (Kanal, Datum, Antwort/Öffnung) außerhalb der DB oder in eigener Tabelle führen.

---

## 4. Rechtliche und ethische Hinweise

- **DSGVO / Datenschutz:** Kontaktdaten nur für legitime, transparente B2B-Kommunikation nutzen. Rechtsgrundlage und Zweck (z. B. Anbahnung von Geschäftsbeziehungen im B2B-Kontext) dokumentieren; Opt-out in jeder E-Mail anbieten.
- **Impressum und Datenschutzerklärung:** Vor Versand prüfen, dass eigene Seiten (Impressum, Datenschutz) den geplanten Versand abdecken.
- **Kein Spam:** Keine Massenmails ohne Kontext; Ansprache individualisieren und an konkrete Events/Organisatoren anbinden.
- **Quellen:** Nur Daten aus öffentlichen oder legitim beschafften Quellen nutzen; keine gekauften Listen ohne Einwilligung für Erstkontakt verwenden.

---

## 5. Templates und Ansprechformen (Rahmen)

- **E-Mail:** Kurze Betreffzeile mit Event- und Organisator-Bezug; im Text Event namentlich nennen, konkreten Mehrwert nennen, eine klare Bitte formulieren, Opt-out-Link anbieten.
- **LinkedIn:** Persönliche Ansprache, Bezug zum Event/ zur Rolle des Empfängers herstellen; keine Copy-Paste-Nachrichten in Serie.
- **Dokumentation:** Alle genutzten Vorlagen (E-Mail, LinkedIn) in einer eigenen Datei oder einem Abschnitt (z. B. `docs/OUTREACH_TEMPLATES.md`) versionieren und kurz begründen.

---

## 6. Wartung und Erweiterung

- **Neue Quellen:** In `sources/` und in den Scripts dokumentieren; nur vertrauenswürdige, öffentliche oder genehmigte Quellen.
- **Schema-Änderungen:** In `database/` dokumentieren; Auswirkungen auf Discovery- und Enrichment-Scripts in den zugehörigen MD-Dateien (z. B. `docs/ORGANIZER_CONTACTS.md`, `docs/DISCOVERY_MVP.md`) beschreiben.
- **Outreach-Prozess:** Änderungen an Kriterien, Segmenten oder Templates hier in `OUTREACH.md` (und ggf. in `OUTREACH_TEMPLATES.md`) nachziehen.

---

**Stand:** Dokumentation für professionellen Reach-out und nachvollziehbare Lead-Nutzung. Bei neuen Features oder Quellen: MD-Dateien anlegen bzw. aktualisieren (siehe `docs/CONVENTIONS.md`).
