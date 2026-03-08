/**
 * Types for the lead discovery engine.
 * Aligned with Supabase schema: leads, lead_events, discovery_runs.
 */

export type DACHCountry = "DE" | "AT" | "CH";

export interface LeadInsert {
  organizer_company: string;
  organizer_website?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  linkedin_url?: string | null;
  source: string;
  custom_metadata?: Record<string, unknown>;
}

export interface LeadEventInsert {
  lead_id: string;
  event_name: string;
  event_type?: string | null;
  event_date?: string | null; // ISO date
  location_city?: string | null;
  location_country?: string | null;
  estimated_audience_size?: number | null;
  has_livestream?: boolean;
  source: string;
  source_url?: string | null;
  raw_discovery_payload?: Record<string, unknown>;
}

export interface DiscoveryRunInsert {
  source: string;
  status?: "running" | "success" | "failed";
  metadata?: Record<string, unknown>;
}

export interface NormalizedDiscovery {
  lead: LeadInsert;
  event: Omit<LeadEventInsert, "lead_id">;
  /** Optional: keep raw item for dedupe key or logging */
  raw?: Record<string, unknown>;
}

/**
 * Generic shape from Apify event scrapers (Eventbrite, etc.).
 * Normalizers map from this to NormalizedDiscovery.
 */
export interface ApifyEventItem {
  title?: string;
  name?: string;
  eventName?: string;
  url?: string;
  link?: string;
  eventUrl?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string;
  location?: string;
  venue?: string | { name?: string; city?: string; country?: string; address?: string };
  city?: string;
  country?: string;
  organizer?: string | { name?: string; url?: string; email?: string; linkedin?: string };
  organizerName?: string;
  organizerUrl?: string;
  organizerEmail?: string;
  organizerLinkedIn?: string;
  description?: string;
  category?: string;
  eventType?: string;
  isOnline?: boolean;
  isVirtual?: boolean;
  capacity?: number;
  attendees?: number;
  image?: string;
  [key: string]: unknown;
}

export interface DiscoverySourceConfig {
  id: string;
  name: string;
  actorId: string;
  /** Actor input for this source */
  getInput: () => Record<string, unknown>;
  /** Map actor dataset items to NormalizedDiscovery[] */
  normalizer: (items: ApifyEventItem[]) => NormalizedDiscovery[];
}

export interface DiscoveryRunResult {
  runId: string;
  source: string;
  status: "success" | "failed";
  leadsCreated: number;
  eventsCreated: number;
  errorMessage?: string;
}
