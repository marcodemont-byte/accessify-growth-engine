# RAG knowledge base — document outline

Curate and maintain these documents (markdown or PDF → text) for the RAG index. Chunk size建议: 500–800 tokens with overlap. Embed with OpenAI `text-embedding-3-small` and store in `knowledge_base_chunks`.

## 1. Product

- **product-overview.md**  
  Accessify is a low-latency accessibility layer for physical live events (not a livestream platform). Services: ultra-low latency audio capture from the event; real-time transcription; real-time translation; captions on mobile devices; optional audio description and sign language. Attendees use smartphones; no event livestream required. How it works at a high level. Languages and regions (DACH, EU).

- **faq-product.md**  
  Common questions: latency, languages supported, in-person events, setup time, requirements (attendee smartphones, internet).

## 2. Pricing

- **pricing-logic.md**  
  Pricing depends on: event type, duration, audience size, number of languages, which services (captions, translation, etc.). No exact figures if you don’t want the bot to quote; state “request a quote or use the calculator at accessify.live/pricing”.

## 3. Compliance and regulations

- **eaa-and-events.md**  
  European Accessibility Act: what it is, timeline, what it means for digital services and live experiences. Short, non-legal summary.

- **event-accessibility-checklist.md**  
  Summary of the checklist (pre-event, during, post-event) and how Accessify supports each.

## 4. Access Shapers and mission

- **mission-and-model.md**  
  “Inclusion through synergy.” Accessify Association (non-profit) + iRewind (for-profit). Roles and how they work together.

- **access-shapers-movement.md**  
  What Access Shapers are; benefits (badge, directory, impact); how to join; link to accessify.live/access-shapers.

## 5. Contact and next steps

- **contact-and-demo.md**  
  How to get a demo (website, calendar link), contact email, and “Book a demo” CTA.

---

## Chunking and metadata

- Add metadata to each chunk: `source_type` (product, pricing, compliance, mission, contact), `document_title`.
- Exclude headers/footers and duplicate navigation from chunks.
- Update chunks when product or legal content changes; re-embed and upsert into `knowledge_base_chunks`.
