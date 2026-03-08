/**
 * Types for event_leads table (DACH discovery v1).
 * Scoring is based on: audience size, languages, international visitors,
 * event category, accessibility relevance, public visibility. Livestream is not used.
 */

export interface EventLeadInsert {
  event_name: string;
  organizer_name: string;
  organizer_website?: string | null;
  contact_email?: string | null;
  linkedin_url?: string | null;
  country: string;
  city?: string | null;
  venue_name?: string | null;
  event_url?: string | null;
  event_type?: string | null;
  event_date?: string | null; // YYYY-MM-DD
  estimated_audience_size?: number | null;
  /** Number of languages likely spoken or offered (0–20) */
  languages_count?: number | null;
  /** 0–1: proportion/likelihood of international visitors */
  international_visitors_score?: number | null;
  /** 0–1: how public/visible the event is */
  public_visibility?: number | null;
  /** 0–1: relevance for accessibility services */
  accessibility_relevance?: number | null;
  /** 0–100: overall lead score from scoring formula */
  lead_score?: number | null;
  source: string;
  /** Rule-based category from discovery/normalization */
  event_category?: string | null;
  /** 0–1: confidence of categorization */
  category_confidence?: number | null;
  /** How category was set: rules, manual, etc. */
  category_source?: string | null;
}

export interface EventLeadRow extends EventLeadInsert {
  id: string;
  created_at: string;
}

export interface DiscoveryRunResult {
  runId: string;
  source: string;
  status: "success" | "failed";
  recordsCreated: number;
  errorMessage?: string;
}
