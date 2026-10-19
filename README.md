# Promptwatch

🔗 **Hosted site:** https://promptwatch.vercel.app

The current product target is **one owner and one website per self-hosted
deployment**, with a dedicated Redis database. See [single-owner setup](docs/SELF_HOSTING.md)
before deploying or upgrading.

## What does it do?

Promptwatch is a middleware-based tool that tracks AI crawler activity on a website.
AI companies (OpenAI, Anthropic, Perplexity, etc.) send bots that constantly crawl
websites, but site owners have no visibility into this and no real way to control it.

Promptwatch detects known AI bots (GPTBot, ClaudeBot, PerplexityBot, and others) in
real time, logs how often each one visits, and shows the owner exactly which bots are
hitting their site and how much. This gives the owner the ability to decide which bots
to allow and which to restrict — control they don't currently have with a standard
website.

## Current status

**Implemented:**

- Middleware matches known HTTP crawler User-Agent tokens on public requests.
- Allow/Block policies are read and saved in Redis, the authoritative store.
- A confirmed Block returns 403 even if its analytics write fails. Policy read
  outages fail open to keep the site available.
- Traffic charts show 30 days of allowed requests, with separate blocked totals
  and blocked-only crawlers included in summaries.
- Top Pages shows allowed/blocked requests on configured public paths, with
  bounded storage and a collection start date. Query strings are not stored.
- Reports provide 7/30-day totals and daily/crawler CSV exports.
- Tracking Health separates Redis connectivity, collector evidence, and recorded
  failures, with an optional isolated storage self-check.
- Supabase authentication supports email/password and Google. Dashboard APIs and
  pages require the server-configured owner UUID.

**Still demo-backed or incomplete:**

- Action Centre and Overview recommendations use seeded monitoring events.
- Prompt/competitor screens contain examples; no real citation collection exists.
- Site settings, notifications, API key and deletion controls remain placeholders.
- Throttling, IP verification, external-site installation, and continuous uptime
  monitoring are not implemented. Crawler matches do not prove AI citations.

## How it works

Every request to the site passes through Edge Middleware before reaching a page.
The middleware reads the request's `User-Agent` header, checks it against a list of
known AI crawler signatures (`lib/botSignatures.ts`), and if it matches, reads a
policy in Upstash Redis keyed by bot. A Block rule returns 403; otherwise the
request continues. A Redis script records allowed or blocked counters by UTC
date, plus eligible public path counts. The owner dashboard reads those counters
through authenticated APIs.

### System design

```mermaid
flowchart TD
    A["Incoming Request<br/>(human or AI bot)"] --> B["Edge Middleware<br/>(middleware.ts)"]
    B --> C{"User-Agent matches<br/>a known bot?<br/>(lib/botSignatures.ts)"}
    C -- "Yes" --> P{"Redis policy"}
    P -- "Allow" --> D["Record allowed counter<br/>and eligible path"]
    P -- "Block" --> X["Record blocked counter<br/>and eligible path, return 403"]
    C -- "No" --> E["Pass through,<br/>no logging"]
    D --> F["Request continues<br/>to the page"]
    E --> F
    F --> G["Next.js App Router<br/>renders the page"]

    H["Dashboard<br/>(/dashboard, /dashboard/traffic)"] --> I["API Routes<br/>/api/bot-stats<br/>/api/bot-stats/history"]
    I --> J["Reads counters<br/>from Upstash Redis"]
    J --> H

    K["Supabase Auth"] -.-> L["Sign in / Sign up"]
    L -.-> H

    style D fill:#e63946,color:#fff
    style B fill:#0A0A0A,color:#fff
    style H fill:#0A0A0A,color:#fff
```

**Flow summary:**

1. A request hits the site (from a real user or an AI bot).
2. Edge Middleware intercepts it before it reaches any page.
3. The `User-Agent` header is checked against known bot signatures.
4. If matched, the stored policy decides whether the request proceeds or returns 403.
   Existing `bot:{botId}:{date}` and `blocked:{botId}:{date}` counters are retained.
   Path logging defaults to the homepage; enable other public prefixes explicitly.
5. The configured owner reads traffic and page counters through protected APIs.
   A User-Agent match is a claim of identity, not verified provenance.

## Tech stack

| Tool                                          | Why                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Next.js 15 (App Router) + Edge Middleware** | Bot detection has to happen before a request reaches the page, at the edge — regular server-side logic runs too late in the request lifecycle for this |
| **Upstash Redis (REST-based)**                | Fast, Edge-compatible key-value store for per-request counters; a traditional database is too slow to query on every single request                    |
| **Supabase**                                  | Authentication (email/password + Google); legacy SQL policy access must be locked using the supplied migration                                         |
| **Vercel**                                    | Deployment, free tier                                                                                                                                  |

## Setup

```bash
git clone https://github.com/pjha26/promptwatch.git
cd promptwatch
npm ci
```

Create `.env.local` from `.env.example` if it does not already exist, and fill in
your Supabase/Upstash values. Create your owner account, set
`PROMPTWATCH_OWNER_ID` to its Supabase UUID, and follow the legacy-table migration
steps in [SELF_HOSTING.md](docs/SELF_HOSTING.md). Then run:

```bash
npm run dev
```

Open http://localhost:3000, sign up or sign in, then navigate to:

- `/dashboard` — Overview
- `/dashboard/traffic` — real-time AI bot traffic
- `/dashboard/actions` — action triage queue
- `/dashboard/reports` — traffic reports and CSV downloads
- `/dashboard/health` — connection status, collector evidence and storage self-check
- `/dashboard/settings` — enforced Allow/Block rules

Public path collection is configured with `PROMPTWATCH_PUBLIC_PATH_PREFIXES`.
For example, `/,/docs,/blog` enables the homepage, docs and blog. Each UTC day
stores up to 200 distinct paths for each outcome, with 30-day retention. Reports
are not exhaustive after a cap is reached; per-bot totals keep counting.

## What's next

- Derive recommendations from actual crawler activity instead of demo events
- Persist real site settings and decisions, then add operational health checks
- Add throttling and verified crawler identity where vendors support it
- Package the middleware so other Next.js sites can install it without touching this codebase

The detailed sequence and completed milestones are in
[IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## AI tool usage

Used Claude to plan the architecture, reason through the shift from the original
assignment (citation-tracking dashboard) to the current bot-detection/control product,
and to generate implementation prompts executed via Antigravity. All generated code was
reviewed before committing — specifically the middleware logic, Redis key scheme, and
the real-data wiring for the dashboard.

Codex with Ponytail continued the product implementation: traffic reports,
single-owner authorization, Redis policy authority, bounded public-path analytics,
and focused regression tests. Local test/build results and remaining live-service
verification limits are documented with each milestone; no production database
migration or owner configuration was automatically applied.
