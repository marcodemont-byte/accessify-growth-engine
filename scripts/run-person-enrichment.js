/**
 * Person-level contact enrichment: deep crawl of contact/team/impressum pages,
 * extract person names, roles, emails; store in contact_people when confidence is high.
 * Keeps organizer_contacts as company-level; this adds person-level records.
 *
 * Run from project root: npm run person:enrich
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
const MIN_CONFIDENCE = 0.5;

// Deep-crawl paths (relative to organizer website base)
const CRAWL_PATHS = [
  "/contact",
  "/kontakt",
  "/impressum",
  "/about",
  "/team",
  "/ueber-uns",
  "/veranstalter",
];

// Prioritized roles for Accessify (order matters for scoring; add German equivalents)
const ROLE_KEYWORDS = [
  "head of events",
  "event director",
  "festival director",
  "marketing",
  "partnerships",
  "operations",
  "event manager",
  "eventleitung",
  "festivalleitung",
  "veranstaltungen",
  "partnerschaften",
  "operativ",
  "event team",
  "veranstalter",
  "leitung veranstaltungen",
  "head of marketing",
  "partnership manager",
  "operations manager",
];
const PRIORITY_ROLES = ["head of events", "event director", "festival director", "marketing", "partnerships", "operations"];

// Section headings that suggest team/management content
const TEAM_HEADING_KEYWORDS = [
  "team", "management", "about us", "unser team", "our team",
  "event team", "veranstalter", "ansprechpartner", "contact",
  "kontakt", "leitung", "staff", "crew", "über uns", "ueber uns",
];

// Any reasonable email (for extraction from page text)
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/g;
const LINKEDIN_PERSON_REGEX = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi;

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
  return CRAWL_PATHS.map((p) => base + p);
}

async function fetchWithTimeout(href) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(href, {
      signal: controller.signal,
      headers: { "User-Agent": "AccessifyPersonEnrichment/1.0 (contact discovery)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractEmailsFromText(html) {
  const matches = (html || "").match(EMAIL_REGEX) || [];
  const seen = new Set();
  return [...new Set(matches.map((m) => m.toLowerCase()))].filter((e) => {
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  });
}

function extractLinkedInPersonUrls(html) {
  const matches = (html || "").match(LINKEDIN_PERSON_REGEX) || [];
  const seen = new Set();
  return [...matches].map((m) => m.replace(/\/$/, "").toLowerCase()).filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

function textLooksLikeRole(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.trim().toLowerCase();
  if (t.length < 2 || t.length > 80) return false;
  return ROLE_KEYWORDS.some((kw) => t.includes(kw));
}

function textLooksLikeName(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.trim();
  if (t.length < 3 || t.length > 80) return false;
  // Rough: 2–4 words, at least one capital, no @, no URL
  if (/@|https?:\/\//i.test(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  return true;
}

function isTeamSectionHeading($, el) {
  const tag = (el.tagName || "").toLowerCase();
  if (!["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) return false;
  const text = $(el).text().trim().toLowerCase();
  return TEAM_HEADING_KEYWORDS.some((kw) => text.includes(kw));
}

/** Collect { email, linkText } from mailto: links */
function getMailtoLinks($) {
  const out = [];
  $('a[href^="mailto:"]').each((_, a) => {
    const href = $(a).attr("href") || "";
    const m = href.match(/mailto:([^?&#\s]+)/i);
    if (!m) return;
    const email = m[1].trim().toLowerCase();
    const linkText = $(a).text().trim();
    if (email) out.push({ email, linkText });
  });
  return out;
}

/** Parse HTML and return candidate people with confidence */
function extractPeopleFromHtml(html, organizer_name) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const mailtos = getMailtoLinks($);
  const allEmails = extractEmailsFromText(html);
  const linkedInUrls = extractLinkedInPersonUrls(html);

  const candidates = [];
  const seenKey = new Set();

  function isPriorityRole(role) {
    if (!role) return false;
    const r = role.toLowerCase();
    return PRIORITY_ROLES.some((p) => r.includes(p));
  }

  function addCandidate(full_name, role, email, linkedin_url, confidence) {
    if (role && isPriorityRole(role)) confidence = Math.min(1, confidence + 0.05);
    const key = [organizer_name, (full_name || "").toLowerCase(), (role || "").toLowerCase(), (email || "").toLowerCase()].join("|");
    if (seenKey.has(key)) return;
    seenKey.add(key);
    if (confidence < MIN_CONFIDENCE) return;
    if (!full_name && !email) return;
    candidates.push({
      full_name: full_name || null,
      role: role || null,
      email: email || null,
      linkedin_url: linkedin_url || null,
      confidence_score: Math.round(confidence * 100) / 100,
    });
  }

  // 1) mailto: with link text that looks like a name -> high confidence
  for (const { email, linkText } of mailtos) {
    const name = linkText && textLooksLikeName(linkText) ? linkText.trim() : null;
    addCandidate(name, null, email, null, name ? 0.7 : 0.5);
  }

  // 2) Find team-like sections and look for name/role/email in blocks
  const $body = $("body");
  $body.find("h1, h2, h3, h4, h5, h6").each((_, heading) => {
    if (!isTeamSectionHeading($, heading)) return;
    const $section = $(heading).nextAll().slice(0, 8); // next few siblings
    const sectionHtml = $section.length ? $section.toArray().map((el) => $(el).html()).join(" ") : "";
    const sectionText = $section.length ? $section.text() : "";

    const sectionEmails = extractEmailsFromText(sectionHtml);
    const sectionLinkedIn = extractLinkedInPersonUrls(sectionHtml);

    // Name – Role or Role: Name patterns in text
    const lines = sectionText.split(/\n/).map((s) => s.trim()).filter(Boolean);
    for (const line of lines) {
      const sep = line.match(/\s*[–\-:]\s*/);
      if (sep) {
        const [a, b] = line.split(sep[0], 2).map((s) => s.trim());
        if (a && b) {
          const isRoleA = textLooksLikeRole(a);
          const isRoleB = textLooksLikeRole(b);
          const isNameA = textLooksLikeName(a);
          const isNameB = textLooksLikeName(b);
          let name = null;
          let role = null;
          if (isNameA && isRoleB) {
            name = a;
            role = b;
          } else if (isRoleA && isNameB) {
            role = a;
            name = b;
          }
          if (name && role && ROLE_KEYWORDS.some((kw) => role.toLowerCase().includes(kw))) {
            const email = sectionEmails[0] || null;
            const linkedin_url = sectionLinkedIn[0] || null;
            addCandidate(name, role, email, linkedin_url, email ? 0.9 : 0.7);
          }
        }
      }
    }

    // In same section: any email + any role-like line
    if (sectionEmails.length > 0) {
      for (const roleLine of lines) {
        if (!textLooksLikeRole(roleLine)) continue;
        addCandidate(null, roleLine, sectionEmails[0], sectionLinkedIn[0] || null, 0.6);
      }
      if (lines.length === 0) addCandidate(null, null, sectionEmails[0], sectionLinkedIn[0] || null, 0.5);
    }
  });

  // 3) Common block patterns: div/span with class containing "team", "member", "name"
  $("[class*='team'], [class*='member'], [class*='staff']").each((_, block) => {
    const $block = $(block);
    const blockText = $block.text().trim();
    const blockHtml = $block.html() || "";
    const blockEmails = extractEmailsFromText(blockHtml);
    const blockLinkedIn = extractLinkedInPersonUrls(blockHtml);
    const lines = blockText.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 1);
    let name = null;
    let role = null;
    for (const line of lines) {
      if (textLooksLikeName(line) && !name) name = line;
      if (textLooksLikeRole(line) && ROLE_KEYWORDS.some((kw) => line.toLowerCase().includes(kw))) role = line;
    }
    if (name || blockEmails.length) {
      const email = blockEmails[0] || null;
      const linkedin_url = blockLinkedIn[0] || null;
      if (name && role) addCandidate(name, role, email, linkedin_url, email ? 0.85 : 0.65);
      else if (email) addCandidate(name, role, email, linkedin_url, 0.55);
    }
  });

  // 4) Standalone emails from impressum/contact pages with no person yet
  for (const e of allEmails) {
    const already = candidates.some((c) => c.email === e);
    if (!already) addCandidate(null, null, e, null, 0.4);
  }

  return candidates.filter((c) => c.confidence_score >= MIN_CONFIDENCE && (c.full_name || c.email));
}

function dedupeCandidates(candidates) {
  const byKey = new Map();
  for (const c of candidates) {
    const key = [c.organizer_name, (c.email || "").toLowerCase(), (c.full_name || "").toLowerCase(), (c.role || "").toLowerCase()].join("\t");
    const existing = byKey.get(key);
    if (!existing || c.confidence_score > existing.confidence_score) byKey.set(key, c);
  }
  return [...byKey.values()];
}

async function main() {
  console.log("Fetching organizers from organizer_contacts...");

  const { data: organizers, error: selectError } = await supabase
    .from("organizer_contacts")
    .select("organizer_name, website")
    .not("website", "is", null);

  if (selectError) {
    console.error("Failed to fetch organizer_contacts:", selectError.message);
    process.exit(1);
  }

  const list = (organizers || []).map((r) => ({
    organizer_name: (r.organizer_name || "").trim(),
    website: normalizeWebsite(r.website),
  })).filter((r) => r.organizer_name && r.website);

  if (list.length === 0) {
    console.log("No organizers with website found.");
    return;
  }

  console.log("Found", list.length, "organizer(s). Deep-crawling contact/team/impressum pages (delay", REQUEST_DELAY_MS, "ms)...\n");

  const allCandidates = [];
  let pagesFetched = 0;
  let pagesFailed = 0;

  for (let i = 0; i < list.length; i++) {
    const { organizer_name, website } = list[i];
    const urls = buildCrawlUrls(website);
    let found = 0;

    for (const pageUrl of urls) {
      try {
        const html = await fetchWithTimeout(pageUrl);
        await delay(REQUEST_DELAY_MS);
        if (!html) {
          pagesFailed++;
          continue;
        }
        pagesFetched++;
        const candidates = extractPeopleFromHtml(html, organizer_name);
        for (const c of candidates) {
          allCandidates.push({ organizer_name, ...c });
          found += 1;
        }
      } catch (err) {
        pagesFailed++;
      }
    }

    console.log("  [" + (i + 1) + "/" + list.length + "] " + organizer_name + " — " + found + " person candidate(s)");
  }

  const deduped = dedupeCandidates(allCandidates);
  const toInsert = deduped.map((c) => ({
    organizer_name: c.organizer_name,
    full_name: c.full_name || null,
    role: c.role || null,
    email: c.email || null,
    linkedin_url: c.linkedin_url || null,
    source: SOURCE,
    confidence_score: c.confidence_score,
  }));

  if (toInsert.length === 0) {
    console.log("\nNo contact_people records above confidence threshold. Done.");
    return;
  }

  const { data: inserted, error: upsertError } = await supabase
    .from("contact_people")
    .upsert(toInsert, { onConflict: "organizer_name,email" })
    .select("id, organizer_name, full_name, role, email, confidence_score");

  if (upsertError) {
    console.error("Failed to upsert contact_people:", upsertError.message);
    process.exit(1);
  }

  console.log("\n--- Summary ---");
  console.log("Organizers processed:  " + list.length);
  console.log("Pages fetched:         " + pagesFetched);
  console.log("Pages failed/timeout: " + pagesFailed);
  console.log("Contact people (inserted/updated): " + (inserted?.length ?? toInsert.length));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
