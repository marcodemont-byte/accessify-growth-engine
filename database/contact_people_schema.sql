-- =============================================================================
-- Contact people (person-level enrichment from team/contact pages)
-- Join key to event_leads / organizer_contacts: organizer_name.
-- One row per organizer + email when email present; multiple rows per organizer
-- when only name+role (no email). Do not insert low-confidence records.
-- Run in Supabase SQL Editor after organizer_contacts.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS contact_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_name TEXT NOT NULL,
  full_name TEXT,
  role TEXT,
  linkedin_url TEXT,
  email TEXT,
  source TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per organizer per email (multiple rows with null email allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_people_organizer_email
  ON contact_people (organizer_name, email);

CREATE INDEX IF NOT EXISTS idx_contact_people_organizer_name
  ON contact_people (organizer_name);

CREATE INDEX IF NOT EXISTS idx_contact_people_role
  ON contact_people (role);

CREATE INDEX IF NOT EXISTS idx_contact_people_source
  ON contact_people (source);

CREATE INDEX IF NOT EXISTS idx_contact_people_confidence
  ON contact_people (confidence_score);

COMMENT ON TABLE contact_people IS 'Person-level contacts from team/contact/impressum pages. Link via organizer_name.';
COMMENT ON COLUMN contact_people.organizer_name IS 'Matches event_leads.organizer_name and organizer_contacts.organizer_name.';
COMMENT ON COLUMN contact_people.confidence_score IS '0-1: extraction confidence; only higher-confidence records should be stored.';
COMMENT ON COLUMN contact_people.source IS 'Discovery source, e.g. website_crawl, team_page.';
