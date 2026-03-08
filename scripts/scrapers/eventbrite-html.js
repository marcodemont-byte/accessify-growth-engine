/**
 * Fast Eventbrite scraper: HTTP fetch + HTML/JSON parse. No browser.
 * Priority: (1) application/ld+json @type Event, (2) __NEXT_DATA__, (3) DOM.
 * Only returns rows with real event_name and event_url (no placeholders).
 */

const cheerio = require("cheerio");

const FETCH_TIMEOUT_MS = 12000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const PLACEHOLDER_NAMES = new Set(["event", "unknown", "untitled", "tbd", "n/a"]);
const MIN_EVENT_NAME_LENGTH = 3;

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timeout);
    return null;
  }
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

function normalizeUrl(u) {
  if (!u || typeof u !== "string") return null;
  const s = u.trim();
  if (!s) return null;
  if (s.startsWith("http")) return s.split("?")[0];
  return "https://www.eventbrite.com" + (s.startsWith("/") ? s : "/" + s).split("?")[0];
}

function isEventUrl(url) {
  if (!url) return false;
  const u = typeof url === "string" ? url : String(url);
  return /eventbrite\.com\/e\//i.test(u) || /^\/e\//.test(u);
}

function isPlaceholderName(str) {
  if (!str || typeof str !== "string") return true;
  const n = str.trim().toLowerCase();
  if (n.length < MIN_EVENT_NAME_LENGTH) return true;
  return PLACEHOLDER_NAMES.has(n);
}

function isValidEvent(e) {
  const name = (e.event_name || "").trim();
  const url = (e.event_url || "").trim();
  if (!name || !url) return false;
  if (!isEventUrl(url)) return false;
  if (isPlaceholderName(name)) return false;
  return true;
}

// --- 1. application/ld+json with @type "Event" (priority 1) ---
function extractFromLdJson(html) {
  const events = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1]);
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const item of items) {
        if (item["@type"] !== "Event") continue;
        const name = item.name ?? item.title;
        const start = item.startDate ?? item.start;
        const url = item.url ?? item.sameAs;
        if (!name || !url || !isEventUrl(url)) continue;
        const org = item.organizer;
        const orgName =
          typeof org === "string"
            ? org
            : org?.name ?? org?.legalName ?? (org && org["@type"] === "Organization" ? org.name : null);
        const loc = item.location;
        let city = null;
        if (loc) {
          if (typeof loc === "string") city = loc;
          else city = loc.address?.addressLocality ?? loc.name ?? loc.address?.addressRegion ?? null;
        }
        events.push({
          event_name: String(name).trim(),
          organizer_name: orgName ? String(orgName).trim() : null,
          city: city ? String(city).trim() : null,
          event_date: parseDate(start),
          event_url: normalizeUrl(url),
        });
      }
    } catch (_) {}
  }
  return events;
}

// --- 2. __NEXT_DATA__ (priority 2) ---
function extractFromNextData(html) {
  const events = [];
  const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!nextMatch) return events;
  try {
    const data = JSON.parse(nextMatch[1]);
    const seen = new Set();

    function walk(obj) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        obj.forEach(walk);
        return;
      }
      const url = obj.url ?? obj.event_url ?? obj.link ?? obj.eventUrl;
      const name = obj.name ?? obj.title ?? obj.event_name;
      if (
        name &&
        url &&
        isEventUrl(url) &&
        !isPlaceholderName(name) &&
        name.length >= MIN_EVENT_NAME_LENGTH
      ) {
        const eventUrl = normalizeUrl(url);
        if (seen.has(eventUrl)) return;
        seen.add(eventUrl);
        const start = obj.start?.local ?? obj.start ?? obj.start_date ?? obj.event_date ?? obj.date ?? obj.startDate;
        const org = obj.organizer?.name ?? obj.organizer_name ?? obj.organization?.name ?? obj.organizerName;
        const city =
          obj.venue?.address?.city ??
          obj.venue?.city ??
          obj.address?.city ??
          obj.location?.city ??
          obj.city ??
          obj.venue?.address?.address_locality;
        events.push({
          event_name: String(name).trim(),
          organizer_name: org ? String(org).trim() : null,
          city: city ? String(city).trim() : null,
          event_date: parseDate(start),
          event_url: eventUrl,
        });
      }
      for (const v of Object.values(obj)) walk(v);
    }
    walk(data);
  } catch (_) {}
  return events;
}

// --- 3. DOM event cards (priority 3, fallback) ---
function extractFromDom(html) {
  const $ = cheerio.load(html);
  const events = [];
  const seen = new Set();

  $('a[href*="/e/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href) return;
    const fullUrl = href.startsWith("http") ? href : "https://www.eventbrite.com" + (href.startsWith("/") ? href : "/" + href);
    const eventUrl = fullUrl.split("?")[0];
    if (!isEventUrl(eventUrl) || seen.has(eventUrl)) return;
    seen.add(eventUrl);

    const card = $a.closest(
      '[data-testid="event-card"], [class*="event-card"], [class*="discover-event"], [class*="EventCard"], article, [class*="card"]'
    );
    const root = card.length ? card : $a.closest("div").parent();

    let name = $a.text().trim();
    if (!name || isPlaceholderName(name) || name.length < MIN_EVENT_NAME_LENGTH) {
      name = $("[class*='title'], [class*='name'], h2, h3, [data-testid*='title']", root).first().text().trim();
    }
    if (!name || isPlaceholderName(name) || name.length < MIN_EVENT_NAME_LENGTH) return;

    let dateStr = $("[datetime]", root).first().attr("datetime");
    if (!dateStr) dateStr = $("[class*='date'], [class*='time'], time", root).first().text().trim();

    let org = $("[class*='organizer'], [class*='host'], [class*='provider'], [data-testid*='organizer']", root).first().text().trim();
    if (org && isPlaceholderName(org)) org = null;

    let city = $("[class*='location'], [class*='venue'], [class*='address'], [class*='city'], [data-testid*='location']", root).first().text().trim();
    if (city && isPlaceholderName(city)) city = null;

    events.push({
      event_name: name.slice(0, 500),
      organizer_name: org ? org.slice(0, 500) : null,
      city: city ? city.slice(0, 200).trim() : null,
      event_date: parseDate(dateStr),
      event_url: eventUrl,
    });
  });

  return events;
}

/**
 * Extract events in priority order: LD+JSON → __NEXT_DATA__ → DOM.
 * Dedupes by event_url; filters out placeholders and invalid rows.
 */
function extractEvents(html) {
  const byUrl = new Map();

  function addAll(list) {
    for (const e of list) {
      if (!e.event_url || !e.event_name) continue;
      if (isPlaceholderName(e.event_name)) continue;
      if (!isEventUrl(e.event_url)) continue;
      const url = normalizeUrl(e.event_url);
      if (!url) continue;
      if (!byUrl.has(url)) byUrl.set(url, e);
    }
  }

  addAll(extractFromLdJson(html));
  addAll(extractFromNextData(html));
  addAll(extractFromDom(html));

  return [...byUrl.values()].filter(isValidEvent);
}

/**
 * Fetch Eventbrite discovery page for a country and return up to limit events.
 * Only returns rows where event_name and event_url are non-null and not placeholders.
 */
async function fetchEventbriteCountry(countrySlug, limit = 100) {
  const url = `https://www.eventbrite.com/d/${countrySlug}/events/`;
  const html = await fetchHtml(url);
  if (!html) return [];

  const events = extractEvents(html);

  const out = [];
  const seen = new Set();
  for (const e of events) {
    if (out.length >= limit) break;
    if (!e.event_name || !e.event_url) continue;
    if (isPlaceholderName(e.event_name)) continue;
    const key = `${e.event_url}|${e.event_name}|${e.event_date || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const org = (e.organizer_name || "").trim();
    out.push({
      event_name: e.event_name,
      organizer_name: org && !isPlaceholderName(org) ? org : null,
      city: (e.city || "").trim() || null,
      event_date: e.event_date || null,
      event_url: e.event_url,
    });
  }
  return out;
}

/**
 * Fetch DACH countries in parallel; return combined list (max 100 per country).
 */
async function fetchEventbriteDACH(maxPerCountry = 100) {
  const [de, at, ch] = await Promise.all([
    fetchEventbriteCountry("germany", maxPerCountry),
    fetchEventbriteCountry("austria", maxPerCountry),
    fetchEventbriteCountry("switzerland", maxPerCountry),
  ]);
  return [
    ...de.map((e) => ({ ...e, country: "DE" })),
    ...at.map((e) => ({ ...e, country: "AT" })),
    ...ch.map((e) => ({ ...e, country: "CH" })),
  ];
}

module.exports = { fetchEventbriteCountry, fetchEventbriteDACH, fetchHtml, extractEvents };
