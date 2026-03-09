-- =============================================================================
-- Allow manual organizer contacts without website
-- Run in Supabase SQL Editor after organizer_contacts exists.
-- =============================================================================

ALTER TABLE organizer_contacts
  ALTER COLUMN website DROP NOT NULL;

COMMENT ON COLUMN organizer_contacts.website IS 'Crawled or manual URL; null for manual-only entries.';
