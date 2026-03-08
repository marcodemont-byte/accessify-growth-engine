/**
 * Lead scoring for Accessify event leads.
 * Focus: physical live events. Livestream is NOT a scoring factor.
 *
 * Factors and approximate weights:
 * - estimated_audience_size (25%)
 * - languages_count (20%)
 * - international_visitors_score (20%)
 * - event_category_score (15%) — conference, festival, trade_fair, sports, cultural
 * - accessibility_relevance (15%)
 * - public_visibility (5%)
 */

export const PRIORITY_EVENT_TYPES = [
  "conference",
  "festival",
  "trade_fair",
  "sports",
  "cultural",
  "concert",
  "exhibition",
  "summit",
  "forum",
] as const;

export type EventType = (typeof PRIORITY_EVENT_TYPES)[number] | string;

/** Category score 0–100: priority event types get higher base score */
export function getEventCategoryScore(eventType: string | null | undefined): number {
  if (!eventType) return 50;
  const normalized = eventType.toLowerCase().replace(/\s+/g, "_");
  if (PRIORITY_EVENT_TYPES.some((t) => normalized.includes(t))) return 85;
  if (["meetup", "workshop", "seminar", "webinar"].some((t) => normalized.includes(t)))
    return 60;
  return 50;
}

/** Audience size score 0–100: larger = higher (log-like scale) */
export function getAudienceSizeScore(size: number | null | undefined): number {
  if (size == null || size <= 0) return 40;
  if (size >= 10000) return 100;
  if (size >= 5000) return 90;
  if (size >= 2000) return 80;
  if (size >= 1000) return 70;
  if (size >= 500) return 60;
  if (size >= 200) return 50;
  return 40;
}

/** Languages count → score 0–100 (cap at 5+ languages) */
export function getLanguagesScore(count: number | null | undefined): number {
  if (count == null || count < 0) return 40;
  if (count >= 5) return 100;
  if (count >= 3) return 85;
  if (count >= 2) return 70;
  if (count >= 1) return 55;
  return 40;
}

/** 0–1 international_visitors_score → 0–100 */
export function getInternationalScore(score: number | null | undefined): number {
  if (score == null || score < 0) return 40;
  return Math.round(Math.min(1, score) * 100);
}

/** 0–1 accessibility_relevance → 0–100 */
export function getAccessibilityScore(score: number | null | undefined): number {
  if (score == null || score < 0) return 50;
  return Math.round(Math.min(1, score) * 100);
}

/** 0–1 public_visibility → 0–100 */
export function getPublicVisibilityScore(score: number | null | undefined): number {
  if (score == null || score < 0) return 50;
  return Math.round(Math.min(1, score) * 100);
}

export interface LeadScoreInput {
  estimated_audience_size?: number | null;
  languages_count?: number | null;
  international_visitors_score?: number | null;
  event_type?: string | null;
  accessibility_relevance?: number | null;
  public_visibility?: number | null;
}

const WEIGHTS = {
  audience_size: 0.25,
  languages: 0.2,
  international: 0.2,
  event_category: 0.15,
  accessibility: 0.15,
  public_visibility: 0.05,
} as const;

/**
 * Compute overall lead_score 0–100 from the six factors.
 * Livestream is not used.
 */
export function computeLeadScore(input: LeadScoreInput): number {
  const audience = getAudienceSizeScore(input.estimated_audience_size);
  const languages = getLanguagesScore(input.languages_count);
  const international = getInternationalScore(input.international_visitors_score);
  const category = getEventCategoryScore(input.event_type);
  const accessibility = getAccessibilityScore(input.accessibility_relevance);
  const visibility = getPublicVisibilityScore(input.public_visibility);

  const weighted =
    audience * WEIGHTS.audience_size +
    languages * WEIGHTS.languages +
    international * WEIGHTS.international +
    category * WEIGHTS.event_category +
    accessibility * WEIGHTS.accessibility +
    visibility * WEIGHTS.public_visibility;

  return Math.round(Math.min(100, Math.max(0, weighted)));
}
