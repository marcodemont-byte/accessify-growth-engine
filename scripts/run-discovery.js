/**
 * Discovery runner: live (curated sources) by default, or sample with --sample.
 * Live mode: loads sources/*.json, inserts into event_leads only when event_name AND organizer_website are present.
 * Then run organizer:discover to enrich organizer_contacts (contact_email, linkedin_url).
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local. Create it with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

require("dotenv").config({ path: envPath, override: true });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

if (url.includes("your-project-ref")) {
  console.error("Replace your-project-ref in NEXT_PUBLIC_SUPABASE_URL with your real Supabase URL.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const isSample = argv.includes("--sample");
const isLive = !isSample;

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(url, key);

const SAMPLE_SOURCE = "discovery_run";
const LIVE_SOURCE = "curated";

// DACH country names/codes for filtering and normalization
const COUNTRY_TO_CODE = {
  germany: "DE",
  deutschland: "DE",
  austria: "AT",
  österreich: "AT",
  switzerland: "CH",
  schweiz: "CH",
};
const DACH_CODES = new Set(["DE", "AT", "CH"]);

function countryToCode(country) {
  if (!country || typeof country !== "string") return null;
  const n = country.trim().toLowerCase();
  if (DACH_CODES.has(n.toUpperCase())) return n.toUpperCase();
  return COUNTRY_TO_CODE[n] || null;
}

function parseDate(val) {
  if (!val) return null;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function clampNum(val, min, max) {
  if (val == null || val === "") return min;
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

const ORGANIZER_PLACEHOLDER = "—"; // schema requires NOT NULL; avoid "Unknown"

/**
 * Normalize HTML-scraper event (event_name, organizer_name, city, event_date, event_url, country) into event_leads row.
 * Only includes rows where event_name and event_url are non-null; no "Event" or "Unknown" placeholders.
 */
function normalizeScrapedEvent(item) {
  const eventName = (item.event_name ?? item.title ?? "").trim();
  const eventUrl = (item.event_url ?? item.url ?? "").trim();
  const organizerName = (item.organizer_name ?? "").trim();
  const eventDate = item.event_date ?? parseDate(item.startDate ?? item.start_date);
  const countryCode = item.country && DACH_CODES.has(item.country) ? item.country : countryToCode(item.country);
  if (!countryCode || !DACH_CODES.has(countryCode)) return null;
  if (!eventName || !eventUrl) return null;
  if (eventName.length < 3 || /^(event|unknown|untitled|tbd|n\/a)$/i.test(eventName)) return null;

  return {
    event_name: eventName,
    organizer_name: organizerName && !/^(unknown|event|n\/a|tbd)$/i.test(organizerName) ? organizerName : ORGANIZER_PLACEHOLDER,
    organizer_website: null,
    contact_email: null,
    linkedin_url: null,
    country: countryCode,
    city: (item.city ?? "").trim() || null,
    venue_name: null,
    event_url: eventUrl,
    event_type: null,
    event_date: eventDate,
    estimated_audience_size: null,
    languages_count: 1,
    international_visitors_score: 0.5,
    public_visibility: 0.8,
    accessibility_relevance: 0.5,
    lead_score: 50,
    source: LIVE_SOURCE,
  };
}

/**
 * Load all events from sources/*.json (curated). Returns flat array of { ...item, _sourceFile }.
 */
function loadCuratedSources() {
  const sourcesDir = path.join(projectRoot, "sources");
  if (!fs.existsSync(sourcesDir)) return [];
  const files = fs.readdirSync(sourcesDir).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const file of files) {
    const filePath = path.join(sourcesDir, file);
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw);
      const arr = Array.isArray(data) ? data : [];
      const sourceLabel = path.basename(file, ".json");
      arr.forEach((item) => out.push({ ...item, _sourceFile: sourceLabel }));
    } catch (err) {
      console.error("Skip " + file + ":", err.message);
    }
  }
  return out;
}

/**
 * Normalize curated event into event_leads row. Only returns row if event_name AND organizer_website are present.
 */
function normalizeCuratedEvent(item, sourceLabel) {
  const eventName = (item.event_name ?? item.title ?? "").trim();
  const organizerWebsite = (item.organizer_website ?? item.organizer_website_url ?? "").trim();
  if (!eventName || !organizerWebsite) return null;
  const countryCode = item.country && DACH_CODES.has(String(item.country).toUpperCase()) ? String(item.country).toUpperCase() : countryToCode(item.country);
  if (!countryCode || !DACH_CODES.has(countryCode)) return null;

  const organizerName = (item.organizer_name ?? "").trim();
  const city = (item.city ?? "").trim() || null;
  const eventDate = parseDate(item.event_date ?? item.date ?? item.start_date) || null;
  const eventUrl = (item.event_url ?? item.url ?? item.event_link ?? "").trim() || null;

  return {
    event_name: eventName,
    organizer_name: organizerName || ORGANIZER_PLACEHOLDER,
    organizer_website: organizerWebsite,
    contact_email: null,
    linkedin_url: null,
    country: countryCode,
    city,
    venue_name: null,
    event_url: eventUrl,
    event_type: null,
    event_date: eventDate,
    estimated_audience_size: null,
    languages_count: 1,
    international_visitors_score: 0.5,
    public_visibility: 0.8,
    accessibility_relevance: 0.5,
    lead_score: 50,
    source: sourceLabel || LIVE_SOURCE,
  };
}

function dedupeByEventOrganizerDate(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.event_name}|${r.organizer_name}|${r.event_date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const THREE_SAMPLES = [
  {
    event_name: "Accessibility Summit Berlin 2025",
    organizer_name: "Accessify e.V.",
    organizer_website: "https://example.com",
    contact_email: "events@example.com",
    linkedin_url: null,
    country: "DE",
    city: "Berlin",
    venue_name: "Berlin Congress Center",
    event_url: "https://example.com/berlin-2025",
    event_type: "conference",
    event_date: "2025-06-01",
    estimated_audience_size: 500,
    languages_count: 2,
    international_visitors_score: 0.6,
    public_visibility: 0.8,
    accessibility_relevance: 0.85,
    lead_score: 72,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "Inclusive Culture Festival Vienna",
    organizer_name: "Kultur Inklusiv GmbH",
    organizer_website: null,
    contact_email: "info@kultur-inklusiv.at",
    linkedin_url: null,
    country: "AT",
    city: "Vienna",
    venue_name: "Stadthalle Vienna",
    event_url: null,
    event_type: "festival",
    event_date: "2025-07-15",
    estimated_audience_size: 2000,
    languages_count: 3,
    international_visitors_score: 0.7,
    public_visibility: 0.9,
    accessibility_relevance: 0.75,
    lead_score: 68,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "DACH Accessibility Summit Zurich",
    organizer_name: "Access Hub AG",
    organizer_website: "https://accesshub.ch",
    contact_email: "hello@accesshub.ch",
    linkedin_url: "https://linkedin.com/company/accesshub",
    country: "CH",
    city: "Zurich",
    venue_name: "Kongresshaus Zurich",
    event_url: "https://accesshub.ch/summit",
    event_type: "conference",
    event_date: "2025-09-10",
    estimated_audience_size: 800,
    languages_count: 4,
    international_visitors_score: 0.85,
    public_visibility: 0.85,
    accessibility_relevance: 0.9,
    lead_score: 78,
    source: SAMPLE_SOURCE,
  },
];

function fail(err) {
  const msg = err?.message || String(err);
  const cause = err?.cause?.message || err?.cause;
  console.error("Discovery failed:", msg);
  if (cause) console.error("Cause:", cause);
  process.exit(1);
}

async function runSampleMode() {
  console.log("mode: sample");
  try {
    const { data, error } = await supabase
      .from("event_leads")
      .insert(THREE_SAMPLES)
      .select("id, event_name, organizer_name, country, city, source, created_at");

    if (error) {
      console.error("Discovery failed:", error.message);
      if (error.code) console.error("Code:", error.code);
      process.exit(1);
    }

    const inserted = data?.length ?? 0;
    console.log("fetched events:     N/A (sample)");
    console.log("normalized events:  " + THREE_SAMPLES.length);
    console.log("inserted rows:      " + inserted);
    console.log("skipped duplicates: 0");
  } catch (err) {
    fail(err);
  }
}

async function runLiveMode() {
  console.log("mode: live (curated sources)");
  const rawItems = loadCuratedSources();
  const fetchedCount = rawItems.length;

  const normalized = rawItems
    .map((item) => normalizeCuratedEvent(item, item._sourceFile))
    .filter(Boolean);
  const normalizedCount = normalized.length;
  const deduped = dedupeByEventOrganizerDate(normalized);

  if (deduped.length === 0) {
    console.log("fetched events:     " + fetchedCount);
    console.log("normalized events:  " + normalizedCount + " (only event_name + organizer_website)");
    console.log("inserted rows:      0");
    console.log("skipped duplicates: 0");
    if (fetchedCount === 0) console.log("Add .json files to sources/ (see sources/README.md).");
    return;
  }

  const { data: inserted, error } = await supabase
    .from("event_leads")
    .upsert(deduped, {
      onConflict: "event_name,organizer_name,event_date",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    console.error("Discovery failed (Supabase insert):", error.message);
    if (error.code) console.error("Code:", error.code);
    process.exit(1);
  }

  const insertedCount = inserted?.length ?? 0;
  const skippedDuplicates = deduped.length - insertedCount;
  console.log("fetched events:     " + fetchedCount);
  console.log("normalized events:  " + normalizedCount + " (event_name + organizer_website required)");
  console.log("inserted rows:      " + insertedCount);
  console.log("skipped duplicates: " + skippedDuplicates);
}

async function main() {
  if (isSample) return runSampleMode();
  return runLiveMode();
}

main().catch(fail);
