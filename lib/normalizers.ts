import type {
  ApifyEventItem,
  NormalizedDiscovery,
  LeadInsert,
  LeadEventInsert,
} from "@/types/discovery";

const DACH_COUNTRIES = ["Germany", "Austria", "Switzerland", "DE", "AT", "CH", "Österreich", "Schweiz"];

function isDACH(item: ApifyEventItem): boolean {
  const country =
    typeof item.country === "string"
      ? item.country
      : (item.venue as { country?: string })?.country ?? "";
  const location = (item.location ?? item.venue ?? "") as string;
  const combined = `${country} ${location}`.toLowerCase();
  return DACH_COUNTRIES.some(
    (c) => combined.includes(c.toLowerCase()) || combined.includes("germany") || combined.includes("berlin") || combined.includes("munich") || combined.includes("vienna") || combined.includes("zurich")
  );
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function extractOrganizer(item: ApifyEventItem): {
  name: string;
  website?: string;
  email?: string;
  linkedin?: string;
} {
  const org = item.organizer;
  if (typeof org === "object" && org !== null) {
    const o = org as Record<string, unknown>;
    return {
      name: (o.name as string) ?? "Unknown Organizer",
      website: (o.url as string) ?? (o.website as string),
      email: (o.email as string) ?? (item.organizerEmail as string),
      linkedin: (o.linkedin as string) ?? (item.organizerLinkedIn as string),
    };
  }
  return {
    name: typeof org === "string" ? org : (item.organizerName as string) ?? "Unknown Organizer",
    website: item.organizerUrl as string | undefined,
    email: item.organizerEmail as string | undefined,
    linkedin: item.organizerLinkedIn as string | undefined,
  };
}

function extractVenue(item: ApifyEventItem): { city?: string; country?: string } {
  const v = item.venue;
  if (typeof v === "object" && v !== null) {
    return {
      city: (v as { city?: string }).city ?? item.city,
      country: (v as { country?: string }).country ?? item.country,
    };
  }
  return {
    city: item.city as string | undefined,
    country: item.country as string | undefined,
  };
}

/**
 * Normalize Eventbrite-style Apify output to our schema.
 * Handles multiple common field names from different scrapers.
 */
export function normalizeEventbriteItem(
  item: ApifyEventItem,
  source: string
): NormalizedDiscovery | null {
  const eventName =
    item.title ?? item.name ?? item.eventName ?? (item as { eventTitle?: string }).eventTitle;
  if (!eventName || typeof eventName !== "string") return null;

  const organizer = extractOrganizer(item);
  const venue = extractVenue(item);

  const lead: LeadInsert = {
    organizer_company: organizer.name.trim() || "Unknown Organizer",
    organizer_website: organizer.website ?? null,
    contact_email: organizer.email ?? null,
    linkedin_url: organizer.linkedin ?? null,
    source,
  };

  const eventDate = parseDate(
    item.startDate ?? item.endDate ?? item.date ?? (item as { start?: string }).start
  );

  const event: Omit<LeadEventInsert, "lead_id"> = {
    event_name: eventName.trim(),
    event_type: (item.category ?? item.eventType ?? "event") as string,
    event_date: eventDate,
    location_city: venue.city ?? null,
    location_country: venue.country ?? null,
    estimated_audience_size:
      typeof item.capacity === "number"
        ? item.capacity
        : typeof item.attendees === "number"
          ? item.attendees
          : null,
    has_livestream: Boolean(item.isOnline ?? item.isVirtual ?? (item as { online?: boolean }).online),
    source,
    source_url: item.url ?? item.link ?? item.eventUrl ?? null,
    raw_discovery_payload: item as Record<string, unknown>,
  };

  return { lead, event, raw: item as Record<string, unknown> };
}

/**
 * Normalize a full dataset from an Eventbrite (or similar) scraper.
 * Filters to DACH when possible; otherwise keeps all items and relies on actor input (DACH URLs).
 */
export function normalizeEventbriteDataset(
  items: ApifyEventItem[],
  source: string,
  filterDACHOnly = true
): NormalizedDiscovery[] {
  const results: NormalizedDiscovery[] = [];
  for (const item of items) {
    if (filterDACHOnly && !isDACH(item)) continue;
    const norm = normalizeEventbriteItem(item, source);
    if (norm) results.push(norm);
  }
  return results;
}
