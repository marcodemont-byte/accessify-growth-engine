# API and external integrations

## Summary table

| Service | Purpose | Auth | Key endpoints / actions |
|--------|---------|------|--------------------------|
| **Supabase** | DB, auth, vector store | Service key + anon key | REST or client lib; RPC for complex logic |
| **OpenAI** | Embeddings, chat, qualification | API key | Embeddings, Chat Completions |
| **SendGrid** | Email send + events | API key | Mail send, contact list, webhooks |
| **Apify** | Scraping / discovery | API token | Run actor, get dataset |
| **PhantomBuster / Waalaxy** | LinkedIn | OAuth / API | Run workflow; export or webhook for sync |
| **Stripe** | Payments | Secret key | Checkout, Payment Intents, webhooks |
| **Vapi / Retell** | Voice AI | API key | Create call, webhook for events |
| **Calendly / Cal.com** | Demo booking | API + webhook | Webhook: invitee.created |
| **Metabase** | Analytics | Metabase user | Connect to Supabase DB |

---

## 1. Supabase

- **Docs:** https://supabase.com/docs
- **Auth:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server); `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client).
- **Use:** Insert/update leads, lead_events, lead_activities; RAG chunks in pgvector; auth for logged-in areas.
- **Webhooks:** Optional Database webhooks to trigger Edge Functions (e.g. on new lead_events for qualification).

---

## 2. OpenAI

- **Docs:** https://platform.openai.com/docs
- **Auth:** `OPENAI_API_KEY`
- **Endpoints:**
  - Embeddings: `text-embedding-3-small` for RAG chunks and query.
  - Chat: `gpt-4o` or `gpt-4o-mini` for qualification (JSON) and RAG reply.
- **Qualification:** POST with lead-qualification prompt; parse JSON and validate tier.

---

## 3. SendGrid

- **Docs:** https://docs.sendgrid.com
- **Auth:** `SENDGRID_API_KEY`
- **Actions:**
  - Send single email (Mail Send API) for sequence steps.
  - Add/update contacts and list membership for newsletter and sequences.
  - **Webhook:** Event webhook (delivered, open, click, bounce, unsubscribe) → POST to your API route → insert `lead_activities`, update `outreach_paused_reason` on unsubscribe.

---

## 4. Apify

- **Docs:** https://docs.apify.com
- **Auth:** `APIFY_API_TOKEN`
- **Flow:** Trigger actor run (e.g. Eventbrite Scraper, Google Maps) with input (e.g. location = Germany, Switzerland, Austria). Poll or webhook for run completion. Fetch dataset → normalize → insert into `raw_discoveries` then `leads` / `lead_events`.

---

## 5. PhantomBuster / Waalaxy

- **PhantomBuster:** https://phantombuster.com/api
- **Waalaxy:** Use dashboard + CSV export or API if available.
- **Flow:** Run LinkedIn automation (connection requests, messages). Export results or receive webhook; sync “last action” and “next step” to Supabase (e.g. custom field or `lead_activities`).

---

## 6. Stripe

- **Docs:** https://stripe.com/docs
- **Auth:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Flow:** Create Checkout Session or Payment Intent from pricing/configure step. On success webhook (`checkout.session.completed` or `payment_intent.succeeded`), create/update `customers`, create order, trigger onboarding (e.g. redirect to onboarding page or send email).

---

## 7. Vapi / Retell

- **Vapi:** https://docs.vapi.ai
- **Retell:** https://docs.retellai.com
- **Auth:** Provider API key.
- **Webhook:** On “demo requested” or “call end” with collected name/email, POST to your API → upsert `leads`, insert `lead_activities`, optionally send confirmation email and calendar link.

---

## 8. Calendly / Cal.com

- **Calendly:** https://developer.calendly.com (webhooks)
- **Cal.com:** Webhook on booking created.
- **Flow:** Webhook payload contains invitee email, name, event type. Your API route upserts `leads`, inserts `lead_activities` (demo_booked), optionally pauses email sequence.

---

## 9. Metabase (or Retool)

- **Metabase:** Add Supabase as data source (connection string or Supabase’s “SQL database” settings). Build dashboards from `leads`, `lead_events`, `lead_activities`, `access_shaper_events`.
- **Retool:** Similar; connect to Supabase, build grids and charts.

---

## Environment variables (example)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_WEBHOOK_VERIFY_KEY=

# Apify
APIFY_API_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Optional
CALENDLY_WEBHOOK_SECRET=
VAPI_WEBHOOK_SECRET=
```

Store in Vercel Environment Variables and Supabase secrets; never commit keys.
