-- Migration: replace livestream_probability with new scoring fields
-- Run this if you already have event_leads with the old schema.

-- Add new columns (nullable for backfill)
ALTER TABLE event_leads
  ADD COLUMN IF NOT EXISTS languages_count INT,
  ADD COLUMN IF NOT EXISTS international_visitors_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS public_visibility NUMERIC(5,2);

ALTER TABLE event_leads
  ADD CONSTRAINT chk_languages_count CHECK (languages_count IS NULL OR (languages_count >= 0 AND languages_count <= 20)),
  ADD CONSTRAINT chk_international_visitors_score CHECK (international_visitors_score IS NULL OR (international_visitors_score >= 0 AND international_visitors_score <= 1)),
  ADD CONSTRAINT chk_public_visibility CHECK (public_visibility IS NULL OR (public_visibility >= 0 AND public_visibility <= 1));

-- Drop livestream_probability if it exists
ALTER TABLE event_leads DROP COLUMN IF EXISTS livestream_probability;

-- Index for event_type and audience if not present
CREATE INDEX IF NOT EXISTS idx_event_leads_event_type ON event_leads(event_type);
CREATE INDEX IF NOT EXISTS idx_event_leads_estimated_audience ON event_leads(estimated_audience_size);
