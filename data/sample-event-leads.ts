/**
 * DACH-only sample event leads for mock discovery.
 * Focus: physical live events. Scoring uses audience size, languages,
 * international visitors, event category, accessibility, public visibility (no livestream).
 */

import { computeLeadScore } from "@/lib/scoring";

export interface SampleEventLead {
  event_name: string;
  organizer_name: string;
  organizer_website: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  country: string;
  city: string | null;
  venue_name: string | null;
  event_url: string | null;
  event_type: string | null;
  event_date: string | null;
  estimated_audience_size: number | null;
  languages_count: number | null;
  international_visitors_score: number | null;
  public_visibility: number | null;
  accessibility_relevance: number | null;
  lead_score: number | null;
  source: string;
}

export const SAMPLE_SOURCE = "mock_dach";

const RAW_SAMPLES: Omit<SampleEventLead, "lead_score">[] = [
  {
    event_name: "Tech Summit Berlin 2025",
    organizer_name: "Berlin Tech e.V.",
    organizer_website: "https://berlintech.events",
    contact_email: "events@berlintech.events",
    linkedin_url: "https://linkedin.com/company/berlin-tech-ev",
    country: "DE",
    city: "Berlin",
    venue_name: "Berlin Congress Center",
    event_url: "https://berlintech.events/summit-2025",
    event_type: "conference",
    event_date: "2025-06-15",
    estimated_audience_size: 1200,
    languages_count: 3,
    international_visitors_score: 0.7,
    public_visibility: 0.85,
    accessibility_relevance: 0.85,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "Kulturfest München",
    organizer_name: "Münchner Kulturverein",
    organizer_website: "https://kulturfest-muc.de",
    contact_email: "info@kulturfest-muc.de",
    linkedin_url: null,
    country: "DE",
    city: "Munich",
    venue_name: "Olympiapark München",
    event_url: "https://kulturfest-muc.de/2025",
    event_type: "festival",
    event_date: "2025-07-22",
    estimated_audience_size: 5000,
    languages_count: 2,
    international_visitors_score: 0.4,
    public_visibility: 0.9,
    accessibility_relevance: 0.9,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "European Accessibility Conference",
    organizer_name: "AccessEU gGmbH",
    organizer_website: "https://accesseu.org",
    contact_email: "conference@accesseu.org",
    linkedin_url: "https://linkedin.com/company/accesseu",
    country: "DE",
    city: "Frankfurt",
    venue_name: "Messe Frankfurt",
    event_url: "https://accesseu.org/eac-2025",
    event_type: "conference",
    event_date: "2025-09-10",
    estimated_audience_size: 800,
    languages_count: 5,
    international_visitors_score: 0.9,
    public_visibility: 0.95,
    accessibility_relevance: 1,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "Wiener Wirtschaftsforum",
    organizer_name: "Wirtschaftskammer Wien",
    organizer_website: "https://wk.wien",
    contact_email: "forum@wk.wien",
    linkedin_url: "https://linkedin.com/company/wkwien",
    country: "AT",
    city: "Vienna",
    venue_name: "Hofburg Vienna",
    event_url: "https://wk.wien/wirtschaftsforum",
    event_type: "conference",
    event_date: "2025-05-20",
    estimated_audience_size: 2000,
    languages_count: 3,
    international_visitors_score: 0.6,
    public_visibility: 0.8,
    accessibility_relevance: 0.75,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "Zürich Design Week",
    organizer_name: "Design Zurich",
    organizer_website: "https://designzurich.ch",
    contact_email: "hello@designzurich.ch",
    linkedin_url: "https://linkedin.com/company/designzurich",
    country: "CH",
    city: "Zurich",
    venue_name: "Kraftwerk Zurich",
    event_url: "https://designzurich.ch/2025",
    event_type: "festival",
    event_date: "2025-08-14",
    estimated_audience_size: 3500,
    languages_count: 4,
    international_visitors_score: 0.65,
    public_visibility: 0.75,
    accessibility_relevance: 0.7,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "Hamburg Messe Digital Health",
    organizer_name: "Hamburg Messe und Congress",
    organizer_website: "https://hamburg-messe.de",
    contact_email: "digitalhealth@hamburg-messe.de",
    linkedin_url: "https://linkedin.com/company/hamburg-messe",
    country: "DE",
    city: "Hamburg",
    venue_name: "Hamburg Messe",
    event_url: "https://hamburg-messe.de/digital-health",
    event_type: "trade_fair",
    event_date: "2025-11-05",
    estimated_audience_size: 15000,
    languages_count: 5,
    international_visitors_score: 0.85,
    public_visibility: 0.95,
    accessibility_relevance: 0.88,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "Salzburg Kultur Dialoge",
    organizer_name: "Salzburg Kultur",
    organizer_website: null,
    contact_email: "dialoge@salzburg-kultur.at",
    linkedin_url: null,
    country: "AT",
    city: "Salzburg",
    venue_name: "Salzburg Congress",
    event_url: null,
    event_type: "conference",
    event_date: "2025-10-01",
    estimated_audience_size: 400,
    languages_count: 2,
    international_visitors_score: 0.35,
    public_visibility: 0.6,
    accessibility_relevance: 0.8,
    source: SAMPLE_SOURCE,
  },
  {
    event_name: "Basel Innovation Summit",
    organizer_name: "Basel Innovation Hub",
    organizer_website: "https://basel-innovation.ch",
    contact_email: "summit@basel-innovation.ch",
    linkedin_url: "https://linkedin.com/company/basel-innovation",
    country: "CH",
    city: "Basel",
    venue_name: "Basel Convention Center",
    event_url: "https://basel-innovation.ch/summit-2025",
    event_type: "conference",
    event_date: "2025-06-30",
    estimated_audience_size: 600,
    languages_count: 3,
    international_visitors_score: 0.7,
    public_visibility: 0.8,
    accessibility_relevance: 0.82,
    source: SAMPLE_SOURCE,
  },
];

/** Sample leads with lead_score computed from scoring formula (no livestream factor). */
export const SAMPLE_EVENT_LEADS: SampleEventLead[] = RAW_SAMPLES.map((row) => ({
  ...row,
  lead_score: computeLeadScore({
    estimated_audience_size: row.estimated_audience_size,
    languages_count: row.languages_count,
    international_visitors_score: row.international_visitors_score,
    event_type: row.event_type,
    accessibility_relevance: row.accessibility_relevance,
    public_visibility: row.public_visibility,
  }),
}));
