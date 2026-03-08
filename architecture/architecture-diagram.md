# System architecture — diagrams

## 1. High-level component diagram

```mermaid
flowchart TB
    subgraph External["External sources"]
        EB[Eventbrite]
        TM[Ticketmaster]
        LI[LinkedIn]
        CONF[Conference listings]
        FEST[Festivals]
        CITY[City portals]
    end

    subgraph Ingestion["Lead discovery"]
        Apify[Apify]
        PB[PhantomBuster]
        Cron[Cron / Scheduler]
    end

    subgraph Core["Core platform"]
        Next[Next.js App]
        API[API Routes]
        Supabase[(Supabase)]
    end

    subgraph AI["AI layer"]
        OpenAI[OpenAI API]
        RAG[RAG + pgvector]
        Qual[Lead qualification]
    end

    subgraph Outreach["Outreach"]
        SendGrid[SendGrid]
        Waalaxy[Waalaxy / PhantomBuster]
    end

    subgraph Conversion["Conversion & community"]
        Chat[Website chat]
        Voice[Vapi / Retell]
        Stripe[Stripe]
    end

    subgraph Analytics["Analytics"]
        Metabase[Metabase]
    end

    External --> Apify
    External --> PB
    Cron --> Apify
    Cron --> PB
    Apify --> API
    PB --> API
    API --> Supabase
    Supabase --> Qual
    Qual --> OpenAI
    Supabase --> RAG
    RAG --> OpenAI
    API --> SendGrid
    API --> Waalaxy
    Next --> Chat
    Chat --> RAG
    Next --> API
    Voice --> API
    API --> Stripe
    Supabase --> Metabase
```

## 2. Data flow: discovery → qualification → outreach

```mermaid
sequenceDiagram
    participant Cron
    participant Apify
    participant API
    participant Supabase
    participant OpenAI
    participant SendGrid

    Cron->>Apify: Run discovery (Eventbrite, etc.)
    Apify->>API: POST /api/discovery/ingest
    API->>Supabase: raw_discoveries, leads, lead_events
    API->>Supabase: Enqueue qualification
    Note over Supabase: Qualification job
    Supabase->>API: Get unqualified events
    API->>OpenAI: Score + tier
    OpenAI->>API: JSON scores
    API->>Supabase: Update lead_events (tier A/B/C)
    API->>Supabase: Tier A/B → outreach_started_at
    API->>SendGrid: Add to sequence / send step 1
```

## 3. Website conversion flow (user journey)

```mermaid
flowchart LR
    A[Landing] --> B[Movement]
    A --> C[Product]
    A --> D[Regulations]
    B --> E[Pricing calculator]
    C --> E
    D --> E
    E --> F[Event config / Quote]
    F --> G[Checkout / Proposal]
    G --> H[Onboarding]
    Chat[Chat widget] --> A
    Chat --> E
    Voice[Phone] --> E
```

## 4. RAG and AI agents

```mermaid
flowchart LR
    User[User]
    Chat[Chat widget]
    Voice[Voice agent]
    API[Next.js API]
    Embed[OpenAI Embed]
    Vector[(pgvector)]
    LLM[OpenAI GPT]
    KB[(Knowledge base docs)]

    User --> Chat
    User --> Voice
    Chat --> API
    Voice --> API
    API --> Embed
    API --> Vector
    Vector --> API
    KB --> Embed
    Embed --> Vector
    API --> LLM
    LLM --> API
    API --> Chat
```

## 5. Deployment (Vercel + Supabase)

```mermaid
flowchart TB
    subgraph Vercel["Vercel"]
        Next[Next.js]
        Cron[Vercel Cron]
    end

    subgraph Supabase["Supabase"]
        DB[(PostgreSQL)]
        Auth[Auth]
        Edge[Edge Functions]
    end

    subgraph External["External APIs"]
        SendGrid[SendGrid]
        OpenAI[OpenAI]
        Apify[Apify]
        Stripe[Stripe]
        Vapi[Vapi/Retell]
    end

    Next --> DB
    Next --> Auth
    Next --> SendGrid
    Next --> OpenAI
    Next --> Apify
    Next --> Stripe
    Vapi --> Next
    Cron --> Next
    Next --> Edge
```

---

*Render Mermaid in GitHub, Notion, or https://mermaid.live to view diagrams.*
