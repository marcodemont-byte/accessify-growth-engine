-- =============================================================================
-- Event Intelligence Dashboard — pipeline fields on event_leads
-- Run in Supabase SQL Editor.
-- =============================================================================

ALTER TABLE event_leads
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS priority INTEGER;

-- Pipeline statuses: new, review, enriched, contacted, follow-up, meeting, won, lost
UPDATE event_leads SET status = 'new' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_leads_status ON event_leads(status);
CREATE INDEX IF NOT EXISTS idx_event_leads_owner ON event_leads(owner);
CREATE INDEX IF NOT EXISTS idx_event_leads_priority ON event_leads(priority);

COMMENT ON COLUMN event_leads.status IS 'Pipeline stage: new, review, enriched, contacted, follow-up, meeting, won, lost';
COMMENT ON COLUMN event_leads.owner IS 'Internal user (email) owning this lead.';
COMMENT ON COLUMN event_leads.notes IS 'Internal notes for the lead.';
COMMENT ON COLUMN event_leads.priority IS 'Priority level (higher = more important).';
