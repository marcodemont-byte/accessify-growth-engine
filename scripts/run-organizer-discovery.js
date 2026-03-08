/**
 * Organizer contact discovery: for each event_lead organizer with a website,
 * crawl homepage + contact/team/impressum pages, extract contact emails from
 * mailto links, visible text, meta tags, and PDF links; extract LinkedIn company
 * URLs; store in organizer_contacts.
 *
 * Run from project root: npm run organizer:discover
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");

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

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(url, key);

const SOURCE = "website_crawl";
const REQUEST_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 15000;

// Pages to crawl per organizer (base = homepage)
const CRAWL_PATHS = ["", "/contact", "/kontakt", "/impressum", "/about", "/team", "/ueber-uns"];

// Preferred email prefixes (order for picking "best" contact)
const EMAIL_PREFIXES = ["info@", "contact@", "hello@", "events@", "team@", "office@"];
// Broader pattern: any valid-looking email (visible text, meta, PDF)
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/g;
const LINKEDIN_COMPANY_REGEX = /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+/gi;

function normalizeWebsite(website) {
  if (!website || typeof website !== "string") return null;
  const s = website.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return "https://" + s;
  return s.replace(/\/+$/, "");
}

function buildCrawlUrls(baseUrl) {
  const base = normalizeWebsite(baseUrl);
  if (!base) return [];
  return CRAWL_PATHS.map((p) => (p === "" ? base : base + p));
}

/** Extract emails from HTML: mailto links, meta tags, visible text. Returns unique lowercased emails. */
function extractEmailsFromPage(html) {
  const seen = new Set();
  const withOrder = [];

  function add(email) {
    const lower = (email || "").trim().toLowerCase();
    if (!lower || seen.has(lower)) return;
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(lower)) return;
    seen.add(lower);
    const prefix = EMAIL_PREFIXES.find((pre) => lower.startsWith(pre));
    withOrder.push({ email: lower, order: prefix != null ? EMAIL_PREFIXES.indexOf(prefix) : 999 });
  }

  try {
    const $ = cheerio.load(html || "");
    $("script, style, noscript").remove();

    // 1) mailto: links
    $('a[href^="mailto:"]').each((_, a) => {
      const href = $(a).attr("href") || "";
      const m = href.match(/mailto:([^?&#\s,]+)/i);
      if (m) add(m[1].trim());
    });

    // 2) Meta tags (og:email, or any meta with content containing @)
    $("meta[content]").each((_, el) => {
      const content = $(el).attr("content") || "";
      const list = content.match(EMAIL_REGEX);
      if (list) list.forEach((e) => add(e));
    });

    // 3) Visible text
    const text = $("body").text() || "";
    const matches = text.match(EMAIL_REGEX) || [];
    matches.forEach((e) => add(e));

    // 4) Raw HTML (e.g. hidden spans, data attributes)
    const raw = $.html();
    (raw.match(EMAIL_REGEX) || []).forEach((e) => add(e));
  } catch (_) {
    (html.match(EMAIL_REGEX) || []).forEach((e) => add(e));
  }

  withOrder.sort((a, b) => a.order - b.order);
  return withOrder.map((o) => o.email);
}

/** Extract emails from PDF-like response (binary buffer, try to find email strings). */
function extractEmailsFromPdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) return [];
  const seen = new Set();
  try {
    const asText = buffer.toString("latin1");
    const matches = asText.match(EMAIL_REGEX) || [];
    return [...new Set(matches.map((m) => m.toLowerCase()))];
  } catch {
    return [];
  }
}

/** Find PDF links in HTML; resolve relative to baseUrl. */
function findPdfLinks(html, baseUrl) {
  const urls = [];
  try {
    const $ = cheerio.load(html || "");
    const base = baseUrl.replace(/\/?$/, "") + "/";
    $('a[href*=".pdf"]').each((_, a) => {
      let href = ($(a).attr("href") || "").trim();
      if (!href) return;
      try {
        const resolved = new URL(href, base).href;
        if (/\.pdf(\?|$)/i.test(resolved)) urls.push(resolved);
      } catch (_) {}
    });
  } catch (_) {}
  return [...new Set(urls)];
}

function pickBestEmail(emails) {
  if (!emails || emails.length === 0) return null;
  const preferred = emails.find((e) => EMAIL_PREFIXES.some((p) => e.toLowerCase().startsWith(p)));
  return preferred || emails[0];
}

function extractLinkedInUrls(html) {
  const matches = (html || "").match(LINKEDIN_COMPANY_REGEX) || [];
  const seen = new Set();
  const out = [];
  for (const m of matches) {
    const norm = m.replace(/\/$/, "").toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

async function fetchWithTimeout(href, asBinary = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(href, {
      signal: controller.signal,
      headers: { "User-Agent": "AccessifyOrganizerDiscovery/1.0 (contact discovery)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    if (asBinary) return Buffer.from(await res.arrayBuffer());
    return await res.text();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("Fetching distinct organizers from event_leads (with website)...");

  const { data: leads, error: selectError } = await supabase
    .from("event_leads")
    .select("organizer_name, organizer_website")
    .not("organizer_website", "is", null);

  if (selectError) {
    console.error("Failed to fetch event_leads:", selectError.message);
    process.exit(1);
  }

  const byKey = new Map();
  for (const row of leads || []) {
    const name = (row.organizer_name || "").trim();
    const web = normalizeWebsite(row.organizer_website);
    if (!name || !web) continue;
    byKey.set(name + "|" + web, { organizer_name: name, website: web });
  }
  const organizers = [...byKey.values()];

  if (organizers.length === 0) {
    console.log("No organizers with website found in event_leads.");
    return;
  }

  console.log("Found", organizers.length, "organizer(s) with website. Crawling (delay", REQUEST_DELAY_MS, "ms between requests)...\n");

  const rows = [];
  let failures = 0;
  let contactsWithEmail = 0;
  let contactsWithLinkedIn = 0;

  for (let i = 0; i < organizers.length; i++) {
    const { organizer_name, website } = organizers[i];
    let contact_email = null;
    let linkedin_url = null;
    const allEmails = [];
    const allLinkedIn = [];
    const seenEmail = new Set();

    try {
      const urls = buildCrawlUrls(website);
      for (const pageUrl of urls) {
        const html = await fetchWithTimeout(pageUrl);
        await delay(REQUEST_DELAY_MS);
        if (!html) continue;

        for (const e of extractEmailsFromPage(html)) {
          if (!seenEmail.has(e)) {
            seenEmail.add(e);
            allEmails.push(e);
          }
        }
        for (const u of extractLinkedInUrls(html)) {
          if (!allLinkedIn.includes(u)) allLinkedIn.push(u);
        }

        // PDF links on this page: fetch and extract emails from PDF body
        const pdfLinks = findPdfLinks(html, website);
        for (const pdfUrl of pdfLinks.slice(0, 3)) {
          const buf = await fetchWithTimeout(pdfUrl, true);
          await delay(REQUEST_DELAY_MS);
          if (buf && Buffer.isBuffer(buf)) {
            for (const e of extractEmailsFromPdfBuffer(buf)) {
              if (!seenEmail.has(e)) {
                seenEmail.add(e);
                allEmails.push(e);
              }
            }
          }
        }
      }

      contact_email = pickBestEmail(allEmails);
      linkedin_url = allLinkedIn.length > 0 ? allLinkedIn[0] : null;
      if (contact_email) contactsWithEmail++;
      if (linkedin_url) contactsWithLinkedIn++;
      console.log(organizer_name + " | email: " + (contact_email ? "yes" : "no") + " | linkedin: " + (linkedin_url ? "yes" : "no"));

      rows.push({
        organizer_name,
        website,
        contact_email,
        linkedin_url,
        contact_name: null,
        contact_role: null,
        source: SOURCE,
      });
    } catch (err) {
      failures++;
      console.log(organizer_name + " | email: no | linkedin: no | (error: " + (err.message || String(err)) + ")");
      rows.push({
        organizer_name,
        website,
        contact_email: null,
        linkedin_url: null,
        contact_name: null,
        contact_role: null,
        source: SOURCE,
      });
    }

    await delay(REQUEST_DELAY_MS);
  }

  if (rows.length === 0) {
    console.log("\nNo rows to upsert.");
    return;
  }

  const { data: inserted, error: upsertError } = await supabase
    .from("organizer_contacts")
    .upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })), {
      onConflict: "organizer_name",
    })
    .select("id, organizer_name, website, contact_email, linkedin_url");

  if (upsertError) {
    console.error("Failed to upsert organizer_contacts:", upsertError.message);
    process.exit(1);
  }

  console.log("\n--- Summary ---");
  console.log("Organizers processed: " + organizers.length);
  console.log("Contacts with email:  " + contactsWithEmail);
  console.log("Contacts with LinkedIn: " + contactsWithLinkedIn);
  console.log("Failures:            " + failures);
  console.log("Rows in organizer_contacts: " + (inserted?.length ?? rows.length));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
