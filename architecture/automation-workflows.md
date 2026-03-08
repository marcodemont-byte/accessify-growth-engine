# Automation workflows

## 1. Lead discovery pipeline

```
[Cron: daily 06:00 UTC]
    → Trigger discovery job
        → For each source (Eventbrite, Ticketmaster, Apify actors, etc.):
            → Fetch/scrape events (DACH filter: DE, CH, AT)
            → Insert raw_discoveries (run_id, payload)
            → Normalize: match or create leads, create lead_events
            → Dedupe by (event_name, lead_id, event_date)
        → Update discovery_runs (status, counts)
    → Trigger qualification batch (see below)
```

**Idempotency:** Use `discovery_runs` and `source` + date so the same run is not applied twice. Dedupe on insert (ON CONFLICT or check before insert).

---

## 2. AI qualification pipeline

```
[Trigger: new row in lead_events with qualification_tier IS NULL]
  OR
[Cron: every 6h — batch unqualified lead_events]

    → For each unqualified lead_event:
        → Load lead + lead_event fields
        → Call OpenAI with lead-qualification prompt (JSON output)
        → Parse scores and tier
        → Update lead_events (qualification_score, qualification_tier, qualification_reasoning, qualified_at)
        → Optionally update leads.qualification_tier to “best” tier across their events
```

**Scoring:** Compute weighted total in app (see `lib/scoring.ts`):  
`0.25*audience_size + 0.20*languages + 0.20*international + 0.15*event_category + 0.15*accessibility + 0.05*public_visibility`. No livestream factor. Tier A: total ≥ 70 and event_date within 90 days; B: 40–69 or 90–180 days; C: else.

---

## 3. Outreach start (Tier A/B)

```
[Trigger: lead.qualification_tier IN ('A','B') AND lead.outreach_started_at IS NULL]

    → Set lead.outreach_started_at = NOW()
    → Add to SendGrid list or set “sequence = default”
    → Schedule email sequence step 1 (send immediately or within 1 hour)
    → If lead.linkedin_url present: add to PhantomBuster/Waalaxy workflow (manual or via their API)
```

---

## 4. Email sequence execution

```
[Cron: every 15 min]

    → Select email_sequence_steps where scheduled_at <= NOW() AND sent_at IS NULL
    → For each step:
        → Load lead, get template for step (e.g. day 1, 4, 8, 14, 21)
        → Send via SendGrid (transactional or marketing API)
        → Record lead_activities (activity_type = email_sent, metadata = message_id)
        → Set email_sequence_steps.sent_at = NOW()
        → Schedule next step (e.g. step 2 in 3 days)
```

**Pause conditions:** Before sending, check `lead.outreach_paused_reason IS NOT NULL` or lead has `demo_booked` / `purchase` activity → skip and mark sequence as paused.

---

## 5. SendGrid webhooks → activities

```
[Inbound: SendGrid event webhook]

    → Parse event (delivered, open, click, bounce, unsubscribe)
    → Find lead by email (or by message_id stored in metadata)
    → Insert lead_activities (email_opened, email_clicked, etc.) with occurred_at, metadata
    → If unsubscribe: set newsletter_subscribers.unsubscribed_at, set lead.outreach_paused_reason = 'unsubscribed'
```

---

## 6. Demo booking (Calendly/Cal.com)

```
[Inbound: Calendly/Cal.com webhook on event_type.invitee.created]

    → Parse invitee email, name, event type
    → Upsert leads (by email), set or create lead
    → Insert lead_activities (activity_type = demo_booked, metadata = event_uri, scheduled_at)
    → Optional: set lead.outreach_paused_reason = 'demo_booked' to stop sequence
    → Optional: send confirmation email or add to CRM view for sales
```

---

## 7. RAG chat request

```
[Request: POST /api/chat]

    → Get user message
    → Embed message (OpenAI embedding API)
    → Query knowledge_base_chunks (vector similarity, top k=5)
    → Build prompt with system + retrieved context + user message
    → Call OpenAI chat completion
    → If user says “book demo” and provides email/name: POST to /api/leads or /api/demo-request (upsert lead, create activity)
    → Return assistant reply (and optional suggested actions)
```

---

## 8. Voice AI webhook (Vapi/Retell)

```
[Inbound: Vapi/Retell webhook on call.end or function_called]

    → If intent = demo_requested and name/email present:
        → Upsert leads
        → Insert lead_activities (activity_type = phone_demo_request)
        → Optional: send SendGrid “We received your request” email
        → Return success to voice platform
```

---

## 9. Newsletter send (every 2 weeks)

```
[Cron: e.g. every other Monday 09:00]

    → Load latest newsletter content (from CMS or static template)
    → Get newsletter_subscribers where unsubscribed_at IS NULL
    → Send via SendGrid (campaign or batch)
    → Log send in your analytics or SendGrid dashboard
```

---

## 10. Access Shaper badge and directory

```
[Trigger: new customer or new completed project]

    → When project is delivered / contract signed:
        → Create or update access_shaper_events (customer_id, event_name, date, etc.)
        → Set badge_issued_at = NOW()
        → If opt_in_directory: event appears on public directory page (query access_shaper_events where opt_in_directory = true)
```

**Impact stats:** Aggregate from `access_shaper_events` (count events, sum audiences_reached, union languages_used) for movement and community pages.
