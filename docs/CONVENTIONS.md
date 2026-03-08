# Projekt-Konventionen (für AI & Team)

**Für die Zukunft verbindlich:**

1. **Dokumentation in Markdown**
   - Alle Abläufe, Pipelines, APIs und Entscheidungen in **MD-Dateien** unter `docs/` (oder projektroot) dokumentieren.
   - Neue Features oder Scripts: zugehörige Doku anlegen oder bestehende Docs aktualisieren.
   - Keine rein mündlichen oder Chat-only Spezifikationen für Produktion; alles Relevante in MD festhalten.

2. **Outreach & Leads: maximal professionell**
   - Alle Schritte für **Reach-out**, Lead-Nutzung und Kontaktaufnahme professionell und nachvollziehbar dokumentieren.
   - Datenqualität, Quellen, Einschränkungen und rechtliche Hinweise (z. B. DSGVO, Opt-in) in eigenen Docs beschreiben.
   - Templates, Prozesse und Verantwortlichkeiten klar in MD festhalten (siehe `docs/OUTREACH.md`).

3. **Einheitliche Struktur**
   - `docs/` für fachliche und technische Doku; `sources/` für Datenquellen und Seed-Dateien; `database/` für Schema und Migrationen.
   - Neue MD-Dateien mit klarer Überschrift, Kurzbeschreibung und Inhaltsverzeichnis bei längeren Docs.

Diese Konventionen gelten für alle zukünftigen Änderungen am Projekt.

---

## Cursor-Regel (optional)

Damit die KI diese Konventionen dauerhaft beachtet: Die Datei **docs/.cursor-rule-documentation-outreach.mdc** in **.cursor/rules/** kopieren (z. B. als `documentation-outreach.mdc`). Dann wendet Cursor die Regel automatisch an.
