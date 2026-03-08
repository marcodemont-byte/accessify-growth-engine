/**
 * Rule-based event categorization for discovery/normalization pipeline.
 * Uses event_name, organizer_name, event_url to assign one of the fixed categories.
 */

export const EVENT_CATEGORIES = [
  "sport",
  "kultur",
  "business",
  "bildung",
  "oeffentlicher_sektor",
  "community",
  "other",
  "unknown",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface CategorizationResult {
  category: EventCategory;
  confidence: number;
  source: string;
}

/** Normalize for matching: lowercase, collapse spaces, strip accents. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build one string from all inputs for keyword scan. */
function combinedText(input: {
  event_name?: string | null;
  organizer_name?: string | null;
  event_url?: string | null;
}): string {
  const parts = [
    input.event_name ?? "",
    input.organizer_name ?? "",
    input.event_url ?? "",
  ];
  return normalize(parts.join(" "));
}

/** Rule-based classification keywords per category (used by classifyEventCategory). */
const CLASSIFY_RULES: Record<
  "sport" | "kultur" | "business" | "bildung" | "oeffentlicher_sektor" | "community",
  string[]
> = {
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

const CLASSIFY_ORDER = [
  "sport",
  "kultur",
  "business",
  "bildung",
  "oeffentlicher_sektor",
  "community",
] as const;

const AUTO_RULE_SOURCE = "auto_rule";

/**
 * Classify event category from event_name, organizer_name, event_url.
 * Used by ingestion and backfill. Returns source "auto_rule".
 * Categories: sport, kultur, business, bildung, oeffentlicher_sektor, community, other, unknown.
 */
export function classifyEventCategory(input: {
  event_name?: string | null;
  organizer_name?: string | null;
  event_url?: string | null;
}): CategorizationResult {
  const text = combinedText(input);
  if (!text) {
    return { category: "unknown", confidence: 0, source: AUTO_RULE_SOURCE };
  }

  let bestCategory: EventCategory = "other";
  let bestScore = 0;

  for (const cat of CLASSIFY_ORDER) {
    const keywords = CLASSIFY_RULES[cat];
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
    return { category: "other", confidence: 0.3, source: AUTO_RULE_SOURCE };
  }

  const confidence = Math.min(1, 0.5 + bestScore * 0.12);
  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    source: AUTO_RULE_SOURCE,
  };
}

/**
 * Categorize an event (alias for pipeline). Returns same shape as classifyEventCategory.
 */
export function categorizeEvent(input: {
  event_name?: string | null;
  organizer_name?: string | null;
  event_url?: string | null;
}): CategorizationResult {
  return classifyEventCategory(input);
}
