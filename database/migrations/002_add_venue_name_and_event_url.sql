-- Migration: add venue_name and event_url to event_leads
-- Run this if you already have event_leads without these columns.

ALTER TABLE event_leads
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS event_url TEXT;

COMMENT ON COLUMN event_leads.venue_name IS 'Name of the venue where the event takes place.';
COMMENT ON COLUMN event_leads.event_url IS 'URL of the event page or listing.';
