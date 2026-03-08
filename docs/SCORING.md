# Lead scoring — event leads

Accessify is a **low-latency accessibility layer for physical live events** (not a livestream platform). Discovery and scoring **prioritize events where**: many languages are spoken, large international audiences attend, accessibility is important, and public visibility is high. Livestream presence is **not** a scoring factor.

## Scoring factors and weights

| Factor | Weight | Description |
|--------|--------|-------------|
| **Estimated audience size** | 25% | Larger physical audiences = higher score (log-like scale). |
| **Languages count** | 20% | Number of languages likely spoken or offered at the event (0–20). |
| **International visitors** | 20% | 0–1 score for proportion or likelihood of international attendees. |
| **Event category** | 15% | Conference, festival, trade fair, sports, cultural events score highest. |
| **Accessibility relevance** | 15% | Sector/mission fit (public, education, culture, health, regulation). |
| **Public visibility** | 5% | How visible or public the event is (media, open registration). |

**Not used:** livestream probability, online-only indicators.

## Event categories (priority)

High-priority types (higher base category score): conference, festival, trade_fair, sports, cultural, concert, exhibition, summit, forum.

Medium: meetup, workshop, seminar. Others get a neutral base score.

## Implementation

- **Formula:** `lib/scoring.ts` — `computeLeadScore(input)` returns 0–100.
- **Sample data:** `data/sample-event-leads.ts` uses `computeLeadScore()` so each mock row has a consistent lead_score.
- **Schema:** `event_leads` table has `languages_count`, `international_visitors_score`, `public_visibility`, `accessibility_relevance`, `lead_score` (no `livestream_probability`).

## Migration from old schema

If you had `livestream_probability`, run `database/migrations/001_replace_livestream_with_scoring_fields.sql` to add the new columns and drop livestream.
