-- =============================================================================
-- DACH Lead Discovery Engine — Event Leads (v1)
-- Single table for discovered event leads. DACH-only.
-- Focus: physical live events; scoring does NOT prioritize livestream.
-- Run in Supabase SQL Editor.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Event leads: one row per discovered event (organizer + event details)
CREATE TABLE event_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  organizer_website TEXT,
  contact_email TEXT,
  linkedin_url TEXT,
  country TEXT NOT NULL,
  city TEXT,
  venue_name TEXT,
  event_url TEXT,
  event_type TEXT,
  event_date DATE,
  estimated_audience_size INT,
  languages_count INT CHECK (languages_count >= 0 AND languages_count <= 20),
  international_visitors_score NUMERIC(5,2) CHECK (international_visitors_score >= 0 AND international_visitors_score <= 1),
  public_visibility NUMERIC(5,2) CHECK (public_visibility >= 0 AND public_visibility <= 1),
  accessibility_relevance NUMERIC(5,2) CHECK (accessibility_relevance >= 0 AND accessibility_relevance <= 1),
  lead_score INT CHECK (lead_score >= 0 AND lead_score <= 100),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering and listing
CREATE INDEX idx_event_leads_country ON event_leads(country);
CREATE INDEX idx_event_leads_city ON event_leads(city);
CREATE INDEX idx_event_leads_event_date ON event_leads(event_date);
CREATE INDEX idx_event_leads_event_type ON event_leads(event_type);
CREATE INDEX idx_event_leads_source ON event_leads(source);
CREATE INDEX idx_event_leads_lead_score ON event_leads(lead_score);
CREATE INDEX idx_event_leads_estimated_audience ON event_leads(estimated_audience_size);
CREATE INDEX idx_event_leads_created_at ON event_leads(created_at);

-- Dedupe: same event + organizer + date = one row
CREATE UNIQUE INDEX idx_event_leads_dedup
  ON event_leads (event_name, organizer_name, event_date);

-- Discovery run log (optional, for tracking mock/live runs)
CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  records_created INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_source ON discovery_runs(source);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_started ON discovery_runs(started_at);

COMMENT ON TABLE event_leads IS 'DACH event leads from discovery (mock or live). Physical live events focus.';
COMMENT ON COLUMN event_leads.languages_count IS 'Number of languages likely spoken or offered at the event (0–20).';
COMMENT ON COLUMN event_leads.international_visitors_score IS '0–1: likelihood or proportion of international visitors.';
COMMENT ON COLUMN event_leads.public_visibility IS '0–1: how visible/public the event is (media, open registration, etc.).';
COMMENT ON COLUMN event_leads.accessibility_relevance IS '0–1: relevance for accessibility services (sector, mission, regulation).';
COMMENT ON COLUMN event_leads.lead_score IS '0–100: overall lead score (audience size, languages, international, category, accessibility, visibility).';
COMMENT ON COLUMN event_leads.venue_name IS 'Name of the venue where the event takes place.';
COMMENT ON COLUMN event_leads.event_url IS 'URL of the event page or listing.';
