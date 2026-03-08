# Discovery-Script (run-discovery.js) – Doku & Fixes

Diese Datei hält alles Wichtig zum Discovery-Runner und zur .env.local-Ladung fest, für die Zukunft und für Reproduzierbarkeit.

---

## 1. Was macht das Script?

- **Datei:** `scripts/run-discovery.js`
- **NPM-Script:** `discovery:run` → `node scripts/run-discovery.js`
- **Zweck:** Lädt `.env.local`, verbindet sich mit Supabase (Service-Role-Key). Zwei Modi:
  - **Live (Standard):** holt echte DACH-Events von Eventbrite per **HTTP-Scraper** (kein Browser, kein Apify): ruft die Suchseiten ab, parst eingebettetes JSON/DOM, max. 100 Events pro Land, schreibt in `event_leads` (Source: `eventbrite`). Laufzeit typisch unter 30 Sekunden.
  - **Sample:** nur mit `--sample` – fügt 3 Beispiel-Event-Leads ein (Source: `discovery_run`).

**Befehle (immer aus Projektroot):**

```bash
# Live-Modus (Standard): Eventbrite DE, AT, CH per HTTP
npm run discovery:run
npm run discovery:run:live

# Sample-Modus: 3 Testzeilen
npm run discovery:run -- --sample
npm run discovery:run:sample
```

**Live-Modus:** Kein Apify nötig. Es reichen `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Scraper: `scripts/scrapers/eventbrite-html.js`.

---

## 2. .env.local korrekt laden

### Problem

- Das Script muss **vor** dem Lesen von `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` die Datei `.env.local` laden.
- **Dotenv überschreibt standardmäßig keine bestehenden Umgebungsvariablen.** Wenn z.B. woanders schon `NEXT_PUBLIC_SUPABASE_URL` gesetzt war (anderes .env, Shell), gewinnt das und `.env.local` wird ignoriert.

### Lösung

1. **dotenv** verwenden (Paket: `dotenv`, in `devDependencies`).
2. **Absoluten Pfad** zu `.env.local` verwenden (Projektroot = ein Verzeichnis über `scripts/`):
   - `projectRoot = path.resolve(__dirname, "..")`
   - `envPath = path.join(projectRoot, ".env.local")`
3. **`override: true`** setzen, damit Werte aus `.env.local` immer gewinnen:

```javascript
require("dotenv").config({ path: envPath, override: true });
```

4. **Vor dem Lesen** der Variablen prüfen, ob `.env.local` existiert; sonst klare Fehlermeldung und Exit.

---

## 3. Platzhalter „your-project-ref“

- Wenn in `.env.local` noch `NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co` steht, muss das durch die **echte Supabase-URL** ersetzt werden.
- Das Script prüft explizit darauf und beendet mit Hinweis, falls der Platzhalter noch drin ist:
  - Kein Fallback/Placeholder für Produktion – nur echte Werte aus `.env.local` verwenden.

---

## 4. Sichere Ausgabe (Logging)

- **URL:** nur ohne Protokoll ausgeben, z.B. `url.replace(/https?:\/\//, "")`.
- **Key:** niemals den kompletten Service-Role-Key loggen. Nur ein **Prefix** (z.B. erste 12 Zeichen + Länge), z.B.:
  - `safeKeyPrefix(key)` → `"eyJhbGciOiJ…212 chars"`.
- Deutlich loggen, dass der **SUPABASE_SERVICE_ROLE_KEY** (Service Role) verwendet wird.

---

## 5. Supabase-Insert und Fehlerbehandlung

- **createClient(url, key)** verwendet hier ausdrücklich den **Service-Role-Key** aus `SUPABASE_SERVICE_ROLE_KEY` (voller Zugriff, RLS umgangen). Kein Anon-Key in diesem Script.
- Den **gesamten Supabase-Insert** in **try/catch** legen, damit auch Netzwerkfehler (z.B. `TypeError: fetch failed`) abgefangen werden.
- **Vollständige Fehlerausgabe** für Debugging:
  - Eine Hilfsfunktion `dumpError(label, err)` ausgeben:
    - `message`, `name`, `stack`
    - `cause` (und falls Objekt: `cause.message`, `cause.code`, `cause.stack`)
    - falls vorhanden: `response`, `status`, `statusCode`, `details`, `hint`
  - Sowohl im **catch** des Inserts als auch in **main().catch()** `dumpError` aufrufen.

So siehst du bei „fetch failed“ die genaue Ursache (Netzwerk, TLS, Proxy, DNS etc.).

---

## 6. Abhängigkeiten

- **dotenv** (z.B. `^16.4.5`) in `devDependencies` für das Laden von `.env.local`.
- **@supabase/supabase-js** für den Client (bereits in `dependencies`).

---

## 7. Wichtige Code-Stellen (Referenz)

| Thema | Wo / Was |
|--------|----------|
| .env.local-Pfad | `path.join(path.resolve(__dirname, ".."), ".env.local")` |
| Laden mit Override | `require("dotenv").config({ path: envPath, override: true })` |
| Platzhalter-Check | `if (url.includes("your-project-ref"))` → Exit mit Hinweis |
| Key nur als Prefix | `safeKeyPrefix(key)` (z.B. erste 12 Zeichen + Länge) |
| Service-Role | `createClient(url, key)` mit `key` aus `SUPABASE_SERVICE_ROLE_KEY` |
| Insert try/catch | `try { ... await supabase.from("event_leads").insert(...) } catch (err) { dumpError(...) }` |
| Fehler dump | `dumpError("Insert threw (e.g. fetch failed)", err)` bzw. in `main().catch` |

---

## 8. Live Discovery (Eventbrite HTTP-Scraper)

- **Quelle:** Kein Browser, kein Apify. HTTP-Requests an Eventbrite-Suchseiten (`/d/germany/events/` etc.), Parsen von eingebettetem JSON (z. B. `__NEXT_DATA__`, LD+JSON) oder DOM mit Cheerio.
- **Region:** Nur DACH (DE, AT, CH). Pro Land eine URL, parallel abgerufen; max. 100 Events pro Land.
- **Extrahierte Felder:** event_name, organizer_name, city, event_date, event_url (plus country); Rest in `event_leads` mit Defaults.
- **Deduplizierung:** In-Memory nach (event_name, organizer_name, event_date); beim Schreiben: `upsert` mit `onConflict: event_name, organizer_name, event_date` und `ignoreDuplicates: true`.

---

## 9. Testdaten wieder entfernen

In Supabase (SQL oder Dashboard):

```sql
DELETE FROM event_leads WHERE source = 'discovery_run';
DELETE FROM event_leads WHERE source = 'eventbrite';
```

---

## 10. Kurz-Checkliste vor dem Lauf

- [ ] `.env.local` im Projektroot mit **echter** Supabase-URL und **Service-Role-Key**
- [ ] Kein Platzhalter `your-project-ref` mehr in der URL
- [ ] `npm install` ausgeführt (dotenv vorhanden)
- [ ] Aus Projektroot: `npm run discovery:run` (Sample) bzw. `npm run discovery:run:live` (Live)
- [ ] Für Live: nur Supabase-Variablen nötig (kein Apify)

Wenn etwas davon fehlt, gibt das Script klare Fehlermeldungen aus (fehlende Datei, fehlende Vars, Platzhalter, oder voller Fehlerdump bei fetch/Insert).
