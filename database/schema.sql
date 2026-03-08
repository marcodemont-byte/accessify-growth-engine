-- Accessify Growth Engine — Supabase schema
-- Run in Supabase SQL editor or via migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- for pgvector (RAG)

-- =============================================================================
-- LEAD DISCOVERY & CRM
-- =============================================================================

-- Organizer/company (one per organization)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_company TEXT NOT NULL,
  organizer_website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  linkedin_url TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  outreach_started_at TIMESTAMPTZ,
  outreach_paused_reason TEXT,
  qualification_tier TEXT CHECK (qualification_tier IN ('A', 'B', 'C')),
  custom_metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_leads_tier ON leads(qualification_tier);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_leads_email ON leads(contact_email) WHERE contact_email IS NOT NULL;

-- Events (one per event; organizer = lead_id)
CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT, -- conference, festival, sports, trade_fair, etc.
  event_date DATE,
  location_city TEXT,
  location_country TEXT,
  estimated_audience_size INT,
  has_livestream BOOLEAN DEFAULT FALSE,
  source TEXT,
  source_url TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  -- AI qualification
  qualification_score INT, -- 0-100
  qualification_tier TEXT CHECK (qualification_tier IN ('A', 'B', 'C')),
  qualification_reasoning TEXT,
  qualified_at TIMESTAMPTZ,
  raw_discovery_payload JSONB,
  UNIQUE(event_name, lead_id, event_date)
);

CREATE INDEX idx_lead_events_lead ON lead_events(lead_id);
CREATE INDEX idx_lead_events_date ON lead_events(event_date);
CREATE INDEX idx_lead_events_tier ON lead_events(qualification_tier);
CREATE INDEX idx_lead_events_discovered ON lead_events(discovered_at);

-- Discovery job log (idempotency and debugging)
CREATE TABLE discovery_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running', -- running, success, failed
  leads_created INT DEFAULT 0,
  events_created INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_discovery_runs_source ON discovery_runs(source);
CREATE INDEX idx_discovery_runs_started ON discovery_runs(started_at);

-- Raw discoveries (optional: store raw payload before normalization)
CREATE TABLE raw_discoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES discovery_runs(id),
  source TEXT,
  payload JSONB NOT NULL,
  normalized_at TIMESTAMPTZ,
  lead_event_id UUID REFERENCES lead_events(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- OUTREACH & ACTIVITIES
-- =============================================================================

-- All touchpoints (email sent, opened, clicked, reply, demo booked, etc.)
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  lead_event_id UUID REFERENCES lead_events(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL, -- email_sent, email_opened, email_clicked, email_replied, linkedin_sent, demo_booked, demo_completed, quote_requested, purchase
  channel TEXT, -- email, linkedin, website, phone
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- e.g. SendGrid message_id, subject, link clicked
  UNIQUE(lead_id, activity_type, metadata->>'message_id') -- avoid duplicate events
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_occurred ON lead_activities(occurred_at);

-- Email sequence state (which step each lead is in)
CREATE TABLE email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL DEFAULT 'default',
  step_number INT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  UNIQUE(lead_id, sequence_name, step_number)
);

CREATE INDEX idx_email_sequence_lead ON email_sequence_steps(lead_id);
CREATE INDEX idx_email_sequence_scheduled ON email_sequence_steps(scheduled_at) WHERE sent_at IS NULL;

-- =============================================================================
-- ACCESS SHAPER COMMUNITY
-- =============================================================================

-- Customers (after purchase or contract)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_lead ON customers(lead_id);
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Access Shaper events (events that use Accessify and opt into movement)
CREATE TABLE access_shaper_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  lead_event_id UUID REFERENCES lead_events(id),
  event_name TEXT NOT NULL,
  event_date DATE,
  location_city TEXT,
  location_country TEXT,
  badge_issued_at TIMESTAMPTZ DEFAULT NOW(),
  opt_in_directory BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  case_study_url TEXT,
  audiences_reached INT,
  languages_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_shaper_events_customer ON access_shaper_events(customer_id);
CREATE INDEX idx_access_shaper_events_date ON access_shaper_events(event_date);
CREATE INDEX idx_access_shaper_events_featured ON access_shaper_events(featured) WHERE featured = TRUE;

-- =============================================================================
-- NEWSLETTER
-- =============================================================================

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT, -- website, lead_magnet, outreach
  sendgrid_list_id TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribed ON newsletter_subscribers(subscribed_at) WHERE unsubscribed_at IS NULL;

-- =============================================================================
-- RAG KNOWLEDGE BASE (pgvector)
-- =============================================================================

CREATE TABLE knowledge_base_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source_type TEXT, -- blog, faq, product, compliance
  content_md TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_base_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES knowledge_base_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_kb_chunks_embedding ON knowledge_base_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- CHAT / CONVERSATIONS (optional: log for improvement)
-- =============================================================================

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT, -- anonymous or user id
  lead_id UUID REFERENCES leads(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER knowledge_base_documents_updated_at BEFORE UPDATE ON knowledge_base_documents
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (optional: enable for multi-tenant or app access)
-- =============================================================================

-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role full access" ON leads FOR ALL USING (auth.role() = 'service_role');
-- (Repeat for other tables as needed.)
