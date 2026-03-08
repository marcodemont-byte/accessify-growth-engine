-- =============================================================================
-- Organizer contacts (from crawling organizer websites)
-- Join key to event_leads: organizer_name (same value in both tables).
-- One row per organizer: unique constraint on organizer_name.
-- Run in Supabase SQL Editor (after event_leads if you use it).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organizer_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_name TEXT NOT NULL,
  website TEXT NOT NULL,
  contact_email TEXT,
  linkedin_url TEXT,
  contact_name TEXT,
  contact_role TEXT,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per organizer (matches script upsert onConflict: organizer_name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizer_contacts_organizer_name
  ON organizer_contacts (organizer_name);

CREATE INDEX IF NOT EXISTS idx_organizer_contacts_source
  ON organizer_contacts (source);

-- Auto-set updated_at on row update
CREATE OR REPLACE FUNCTION set_organizer_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organizer_contacts_updated_at ON organizer_contacts;
CREATE TRIGGER trigger_organizer_contacts_updated_at
  BEFORE UPDATE ON organizer_contacts
  FOR EACH ROW
  EXECUTE PROCEDURE set_organizer_contacts_updated_at();

COMMENT ON TABLE organizer_contacts IS 'Discovered organizer contact info from crawling websites. Link to event_leads via organizer_name.';
COMMENT ON COLUMN organizer_contacts.organizer_name IS 'Matches event_leads.organizer_name for joining.';
COMMENT ON COLUMN organizer_contacts.source IS 'Discovery source, e.g. website_crawl.';
