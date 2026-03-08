/**
 * Test script: insert 3 sample event_leads and verify Supabase connection.
 * Run from project root: node scripts/test-supabase.js
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

const fs = require("fs");
const path = require("path");

// Load .env.local into process.env (no dotenv dependency)
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
          val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Set them in .env.local or in the environment.");
  process.exit(1);
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(url, key);

const SAMPLE_SOURCE = "test_script";

const THREE_SAMPLES = [
  {
    event_name: "Test Conference Berlin 2025",
    organizer_name: "Test Org e.V.",
    organizer_website: "https://example.com",
    contact_email: "test@example.com",
    linkedin_url: null,
    country: "DE",
    city: "Berlin",
    venue_name: "Test Venue Berlin",
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
    event_name: "Test Festival Vienna",
    organizer_name: "Test Kultur GmbH",
    organizer_website: null,
    contact_email: "info@testfest.at",
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
    event_name: "Test Summit Zurich",
    organizer_name: "Test Hub AG",
    organizer_website: "https://testhub.ch",
    contact_email: "hello@testhub.ch",
    linkedin_url: "https://linkedin.com/company/testhub",
    country: "CH",
    city: "Zurich",
    venue_name: "Kongresshaus Zurich",
    event_url: "https://testhub.ch/summit",
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

async function main() {
  console.log("Supabase URL:", url.replace(/https?:\/\//, ""));
  console.log("Inserting 3 sample event_leads (source = test_script)...\n");

  const { data: inserted, error: insertError } = await supabase
    .from("event_leads")
    .insert(THREE_SAMPLES)
    .select("id, event_name, organizer_name, country, city, source, created_at");

  if (insertError) {
    console.error("Insert failed:", insertError.message);
    if (insertError.code) console.error("Code:", insertError.code);
    process.exit(1);
  }

  console.log("Inserted", inserted?.length ?? 0, "rows.");
  if (inserted && inserted.length > 0) {
    inserted.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.event_name} (${row.city}, ${row.country}) [id: ${row.id}]`);
    });
  }

  console.log("\nReading back from event_leads where source = 'test_script'...");
  const { data: rows, error: selectError } = await supabase
    .from("event_leads")
    .select("*")
    .eq("source", SAMPLE_SOURCE)
    .order("created_at", { ascending: false });

  if (selectError) {
    console.error("Select failed:", selectError.message);
    process.exit(1);
  }

  console.log("Found", rows?.length ?? 0, "rows.");
  if (rows && rows.length > 0) {
    rows.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.event_name} | ${r.organizer_name} | ${r.lead_score}`);
    });
  }

  console.log("\n✓ Connection verified. Discovery engine can use the same Supabase client and .env.local.");
  console.log("  To remove test data: DELETE FROM event_leads WHERE source = 'test_script';");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
