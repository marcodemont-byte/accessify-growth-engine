/**
 * Backfill event_category, category_confidence, category_source for existing event_leads.
 *
 * Run from project root:
 *   npm run backfill:event-categories
 *   npm run backfill:event-categories -- --dry-run   # show 10 examples only, no updates
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * If event_category column is missing: either add DATABASE_URL to .env.local (Supabase
 * Postgres connection string from Project Settings → Database) and run again, or run
 * database/migrations/004_event_category_fields.sql in Supabase SQL Editor then run again.
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
const databaseUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "").trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(url, key);

async function runMigrationIfNeeded() {
  if (!databaseUrl) return false;
  try {
    const { Client } = require("pg");
    const migrationPath = path.join(projectRoot, "database", "migrations", "004_event_category_fields.sql");
    if (!fs.existsSync(migrationPath)) return false;
    const sql = fs.readFileSync(migrationPath, "utf8");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(sql);
    await client.end();
    console.log("Migration 004 applied.");
    return true;
  } catch (err) {
    if (err.message && (err.message.includes("already exists") || err.message.includes("duplicate"))) {
      console.log("Migration 004 already applied.");
      return true;
    }
    console.error("Migration failed:", err.message);
    return false;
  }
}

const DRY_RUN = process.argv.includes("--dry-run");
const SOURCE = "auto_rule";

// Rows needing backfill: category null/empty/unknown (any case) OR category_source not set
function needsBackfill(row) {
  const c = row.event_category;
  const src = row.category_source;
  const categoryEmptyOrUnknown =
    c == null ||
    c === "" ||
    (typeof c === "string" && c.toLowerCase() === "unknown") ||
    (typeof c === "string" && c.toLowerCase() === "unbekannt");
  const sourceNotSet = src == null || src === "";
  return categoryEmptyOrUnknown || sourceNotSet;
}

// Keywords per category — keep in sync with lib/event-categorization.ts classifyEventCategory()
const RULES = {
  sport: [
    "marathon", "triathlon", "cup", "championship", "race", "league",
    "half marathon", "athletics", "sports", "sport", "turnier", "tournament",
    "liga", "meisterschaft", "lauf", "sportevent", "sportverein", "athlet",
    "fitness", "olympia", "weltcup", "spiel", "match",
  ],
  kultur: [
    "festival", "concert", "theater", "opera", "museum", "art", "music",
    "kultur", "konzert", "ausstellung", "exhibition", "kunst", "musik",
    "film", "kino", "literatur", "lesung", "bühne", "stage",
  ],
  business: [
    "summit", "expo", "forum", "conference", "congress", "trade fair",
    "messe", "business", "fair", "kongress", "konferenz", "networking",
    "workshop", "b2b", "handel", "industrie", "wirtschaft", "seminar",
  ],
  bildung: [
    "university", "school", "academy", "education", "campus",
    "bildung", "bildungswerk", "hochschule", "schule", "akademie", "training",
    "weiterbildung", "bildungstag", "lern", "learn", "edtech",
  ],
  oeffentlicher_sektor: [
    "city", "government", "ministry", "municipality", "public sector", "parliament",
    "behörde", "behoerde", "öffentlich", "oeffentlich", "public", "stadt",
    "kommune", "gemeinde", "landkreis", "bund", "ministerium", "amt",
    "gov", "politik", "verwaltung",
  ],
  community: [
    "association", "community", "charity", "meetup", "club",
    "verein", "stammtisch", "netzwerk", "initiative", "gruppe", "group",
    "local", "lokal", "nachbarschaft",
  ],
};

const ORDER = ["sport", "kultur", "business", "bildung", "oeffentlicher_sektor", "community"];

function normalize(text) {
  if (typeof text !== "string") return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function combinedText(row) {
  const parts = [
    row.event_name ?? "",
    row.organizer_name ?? "",
    row.event_url ?? "",
  ];
  return normalize(parts.join(" "));
}

function classifyEventCategory(row) {
  const text = combinedText(row);
  if (!text) return { category: "unknown", confidence: 0 };

  let bestCategory = "other";
  let bestScore = 0;

  for (const cat of ORDER) {
    const keywords = RULES[cat];
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(normalize(kw))) {
        score += 1;
        if (kw.length >= 6) score += 0.5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  if (bestScore === 0) {
    return { category: "other", confidence: 0.3 };
  }
  const confidence = Math.min(1, 0.5 + bestScore * 0.12);
  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
  };
}

function printExamples(rows, limit = 10) {
  console.log("\n--- Example events and assigned categories ---\n");
  const pad = (s, n) => String(s ?? "").slice(0, n).padEnd(n);
  console.log(`${pad("event_name", 42)} | ${pad("organizer_name", 28)} | category              | confidence`);
  console.log("-".repeat(42) + "-+-" + "-".repeat(28) + "-+-" + "-".repeat(22) + "-+-" + "-".repeat(9));
  for (let i = 0; i < Math.min(limit, rows.length); i++) {
    const r = rows[i];
    const { category, confidence } = classifyEventCategory(r);
    console.log(`${pad(r.event_name, 42)} | ${pad(r.organizer_name, 28)} | ${pad(category, 22)} | ${confidence}`);
  }
  console.log("");
}

async function main() {
  await runMigrationIfNeeded();
  console.log("Fetching event_leads (all rows, then filtering for backfill)...");

  let allRows;
  let fetchError;
  try {
    const result = await supabase
      .from("event_leads")
      .select("id, event_name, organizer_name, event_url, event_category, category_confidence, category_source")
      .limit(5000);
    allRows = result.data;
    fetchError = result.error;
  } catch (e) {
    fetchError = { message: e.message };
  }

  if (fetchError) {
    if (fetchError.message && fetchError.message.includes("event_category") && fetchError.message.includes("does not exist")) {
      console.error("\nThe event_category column is missing. Do one of the following:\n");
      console.error("  1. Add DATABASE_URL (or SUPABASE_DB_URL) to .env.local with your Supabase Postgres connection string,");
      console.error("     then run this script again (it will apply the migration and backfill).\n");
      console.error("  2. Or run the migration manually: open Supabase Dashboard → SQL Editor,");
      console.error("     paste and run the contents of: database/migrations/004_event_category_fields.sql");
      console.error("     Then run: npm run backfill:event-categories\n");
    } else {
      console.error("Fetch error:", fetchError.message);
    }
    process.exit(1);
  }

  const rows = (allRows || []).filter(needsBackfill);
  const total = rows.length;

  console.log(`Found ${total} row(s) to backfill (out of ${(allRows || []).length} total).`);

  if (total === 0) {
    console.log("Nothing to backfill. Exiting.");
    return;
  }

  printExamples(rows, 10);

  if (DRY_RUN) {
    console.log("Dry run: no updates performed. Run without --dry-run to apply.");
    return;
  }

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { category, confidence } = classifyEventCategory(row);
    const payload = {
      event_category: category,
      category_confidence: confidence,
      category_source: SOURCE,
    };
    const { data: updatedRow, error: updateError } = await supabase
      .from("event_leads")
      .update(payload)
      .eq("id", row.id)
      .select("id")
      .single();

    if (updateError) {
      console.error(`Update failed for id=${row.id}:`, updateError.message);
      failed++;
    } else if (!updatedRow) {
      console.error(`Update matched no row for id=${row.id} (RLS or missing row?).`);
      failed++;
    } else {
      updated++;
      if (i === 0) {
        console.log(`  First update: id=${row.id} -> event_category=${category}, category_confidence=${confidence}, category_source=${SOURCE}`);
      }
      if (updated % 50 === 0) console.log(`  Updated ${updated}/${total}...`);
    }
  }

  console.log(`Done. Updated: ${updated}, failed: ${failed}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
