-- =============================================================================
-- Event categorization: event_category, category_confidence, category_source
-- Run in Supabase SQL Editor after 003_dashboard_pipeline_fields.sql
-- =============================================================================

ALTER TABLE event_leads
  ADD COLUMN IF NOT EXISTS event_category TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS category_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS category_source TEXT;

-- Allowed values for event_category (enforced in app)
-- sport, kultur, business, bildung, oeffentlicher_sektor, community, other, unknown
ALTER TABLE event_leads DROP CONSTRAINT IF EXISTS chk_event_category;
ALTER TABLE event_leads
  ADD CONSTRAINT chk_event_category
  CHECK (event_category IS NULL OR event_category IN (
    'sport', 'kultur', 'business', 'bildung', 'oeffentlicher_sektor', 'community', 'other', 'unknown'
  ));

-- category_confidence: 0.00–1.00 when set
ALTER TABLE event_leads DROP CONSTRAINT IF EXISTS chk_category_confidence;
ALTER TABLE event_leads
  ADD CONSTRAINT chk_category_confidence
  CHECK (category_confidence IS NULL OR (category_confidence >= 0 AND category_confidence <= 1));

CREATE INDEX IF NOT EXISTS idx_event_leads_event_category ON event_leads(event_category);

COMMENT ON COLUMN event_leads.event_category IS 'Rule-based category: sport, kultur, business, bildung, oeffentlicher_sektor, community, other, unknown';
COMMENT ON COLUMN event_leads.category_confidence IS '0–1: confidence of the categorization (rules or manual).';
COMMENT ON COLUMN event_leads.category_source IS 'How category was set: rules, manual, etc.';
