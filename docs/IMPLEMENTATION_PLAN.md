# Promptwatch: review and implementation plan

Reviewed on 18 October 2026 against local commit `bc24dcf` and the linked
[repository](https://github.com/pjha26/promptwatch). The working tree was clean.

## Direction

### Product continuation, 18 October 2026

The owner selected **single-owner, self-hosted product first** and authorized
implementation changes and GitHub commits/pushes for each verified milestone.
The original new-files-only restriction below describes milestone A, not this
continuation. Preserve existing data and the core collector/dashboard contract.

Milestone B now uses a server-configured owner UUID, protected administration
APIs, Redis as the single policy authority, and a migration locking the legacy
SQL policy table. Deployment setup is documented in `SELF_HOSTING.md`.

Progress: A was committed and pushed as `a55aad9`. B passes 17 focused tests,
TypeScript, targeted ESLint, the production build, and a built-app auth smoke
test covering all existing administration APIs with Redis disabled. The owner
environment variable and SQL migration must be configured by the installer.

### Resumed analytics milestone, 19 October 2026

B was committed and pushed as `2f44ac8`. The next implementation covers the
public-path portion of C: allowlisted, query-free daily counters; 200-path limits
per outcome; 30-day retention; a protected Top Pages API; and dashboard views
that include blocked-only crawler/page activity. Old per-bot keys remain intact.

The classifier now distinguishes HTTP agents from robots-only content-use
controls, adds documented search/user-requested agents, and checks token
boundaries without case sensitivity. Historical IDs/counts remain readable.
Chart labels use UTC, and mobile crawler counts wrap within their cards.

Validation: 23 focused tests, TypeScript, targeted ESLint, production build,
anonymous-API smoke tests, and an isolated browser harness using simulated
traffic/page/policy responses. The browser checks cover page failure/retry,
malformed/empty responses, blocked-only traffic, robots-only policy controls,
mobile containment, UTC labels from a US timezone, and policy-save recovery.
The harness does not establish a live authenticated Supabase/Redis connection.
Lua execution against a real Redis instance remains unverified locally; no
production services were written to for these checks.

Remaining C work: verified IP identity, response delivery/status/latency evidence,
and measured Redis/collector performance budgets. D–F remain roadmap milestones,
not completed product features. Do not infer citations or successful page
delivery from crawler counters.

### Tracking-health milestone, 19 October 2026

Add owner-only `/dashboard/health` and `/api/tracking-health`, timestamp successful
collector writes in the existing counting script, and save best-effort policy/read
failure markers without changing enforcement decisions. Redis connectivity,
historical collector evidence, and manual storage diagnostics are shown separately.
The fake green workspace indicator was replaced by the real single-owner context.

A manual self-check uses the actual counter script with isolated, expiring keys;
it cannot prove public routing or continuous uptime. Automatic Redis retries are
disabled and request lifetimes bounded so failed checks do not hold requests open.
Focused health/parser/failure tests accompany the existing collection regressions.

Live checks and owner configuration are pending while the owner reactivates the
services and supplies the intended UUID. Do not grant ownership to an inferred
account, apply production migrations, or manufacture successful live checks.

Health validation: 28 focused tests passed, along with TypeScript, targeted lint,
the production build, and signed-out API smoke tests (Redis disabled). An isolated
browser checked waiting/recorded/failure states, self-check semantics, stale-status
removal, refresh recovery, and mobile controls using simulated responses.

Make Promptwatch a trustworthy answer to three questions: **who is crawling my
site, what are they reading, and are my access rules working?** Build that loop
before investing in prompt rankings, billing, or more visual effects. Crawler
visits alone do not prove that an AI answer cited a site.

Preservation rule for this iteration: add new files only. Keep the landing page,
auth, dashboard, middleware, schema, dependencies, and existing API contracts
unchanged. No production writes, migrations, commits, pushes, or deployment.
The original trial briefs in `docs/` describe an older mock-only assignment;
the current product and this request have moved beyond that scope.

## What is actually implemented

| Area                               | Evidence                                                      | Status / limit                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing page and visual foundation | `app/page.tsx`, `app/layout.tsx`, theme and scroll components | Implemented; preserve the existing design.                                                                                                                                                  |
| Email/password and Google sign-in  | Login, signup, callback, `utils/supabase/`                    | Implemented in code; provider setup and live delivery not verified. Dashboard routes are protected by middleware.                                                                           |
| Crawler detection                  | `lib/botSignatures.ts`, `middleware.ts`                       | Seven configured signatures; matching a User-Agent is a claim of identity, not verification. Review vendor-specific robots tokens before expanding coverage.                                |
| Bot policies and enforcement       | Settings, `api/bot-policies`, middleware                      | Allow/Block already exist, including 403 responses and blocked counters. Throttling does not exist. README is outdated here.                                                                |
| Live traffic and overview          | `api/bot-stats`, history API, `useTrafficData`                | Reads 30 days of Redis counters, including blocked counts. No path-level data. Redis availability and live totals not independently verified.                                               |
| Action Centre                      | `useActionState`, `deriveActions`, seed scripts               | Derivation, filters, and local status persistence exist, but events come from seeded JSON. Overview actions are therefore demo-derived.                                                     |
| Prompts and competitors            | Their dashboard page files                                    | Hard-coded example data and local interactions; no real model queries or citation collection.                                                                                               |
| Workspace/settings/notifications   | Top bar, settings, SQL schema                                 | Workspace UI is static. Site save and notification toggles are local state, API key is a placeholder, deletion is a no-op. Schema exists but does not make runtime traffic workspace-aware. |

## Ranked gaps

1. **Ownership and isolation:** Redis keys (`policy:{bot}`, `bot:{bot}:{date}`)
   and `bot_policies` are global. Any signed-in user can change shared policy
   through the current API. `bot_policies` has no RLS in the supplied schema.
   Decide single-owner deployment versus multi-workspace SaaS before onboarding
   unrelated customers. Supplied SQL is not proof of deployed database settings.
2. **API protection and diagnostics:** current traffic endpoints do not check
   authentication; `api/test-redis` publicly writes a test key; policy GET can
   return a stack trace. Restrict these before production expansion.
3. **Policy correctness:** settings optimistically updates without checking
   `response.ok`. A successful database write followed by a failed Redis write
   can leave the saved rule different from enforcement. Middleware deliberately
   fails open on Redis errors; a failed blocked-counter write can also bypass a
   block. Make this behavior explicit and test it before promising protection.
4. **Crawler semantics:** the detector treats `Google-Extended` and
   `Applebot-Extended` as HTTP crawler signatures. Google's documentation says
   Google-Extended has no separate HTTP User-Agent; Apple says Applebot-Extended
   does not crawl. These are controls for use of content, so substring matches
   cannot substantiate genuine traffic from these identities. See the
   [Google crawler reference](https://developers.google.cn/crawling/docs/crawlers-fetchers/google-common-crawlers?hl=en)
   and [Applebot reference](https://support.apple.com/en-gb/119829).
5. **Truthful reporting:** Top Pages has no data source; Action Centre is seeded;
   prompts and competitors show examples. Distinguish observed traffic from
   verified crawler identity, successful page delivery, and actual citations.
6. **Cost and reproducibility:** history currently issues 420 individual Redis
   reads per load. `npm run lint` invokes `next lint`, which works in the installed
   Next.js 15 but is deprecated ahead of Next.js 16. Setup lacks environment
   variable instructions.

These findings remain unchanged in existing files during this iteration.

## Implementation sequence

### A. Add a read-only reporting slice — this iteration

This can ship separately while the ownership work is designed. It provides a
useful report without changing collection, policy enforcement, or existing UI.

- Add `/dashboard/reports`, with a server-side session check and existing
  dashboard styling; document the direct URL to preserve the current sidebar.
- Add an authenticated, non-cached report endpoint that reads existing Redis
  counters with one batched `MGET`. No new storage or writes.
- Show 7-day and 30-day reports: observed requests, requests passed by bot
  policy, blocked requests, block rate, active crawlers, daily totals, and a
  ranked crawler breakdown. Include crawlers that only have blocked requests.
- Compare 7 days with the preceding 7 only when the data window supports it;
  handle a zero baseline honestly. Do not invent a 30-day comparison from only
  30 days of retained counters.
- Download daily and crawler CSVs for the selected period. Escape spreadsheet
  formulas and quoted/multiline fields. Never export secrets or visitor IDs.
- Include loading, retry, refresh, auth-expired, and no-traffic states. Use UTC
  dates, explain that today is partial, and label the existing deployment-wide
  scope. A missing Redis counter means zero recorded hits, not proven uptime.

Acceptance: aggregation and CSV boundary tests pass; TypeScript and lint checks
cover new files; unauthenticated API access returns 401; build is attempted;
Git confirms that every tracked pre-existing file is unchanged. Document any
baseline failures or unavailable live/browser verification.

### B. Establish ownership and safe policy updates — next required milestone

This requires small, deliberate edits to existing middleware/APIs/schema and
therefore is outside this iteration's new-files-only boundary.

- Choose an owner-only deployment first, or implement verified workspace
  membership throughout. For SaaS, scope every Redis key and policy row by
  workspace, with database RLS and membership checks at every boundary.
- Use an additive migration and a controlled fallback for existing counters;
  do not rename/delete old keys or rewrite historical data in place.
- Protect existing APIs, remove/restrict the write diagnostic route, return
  generic errors, validate request bodies, and avoid logging secrets.
- Make policy save failures visible and reversible in the UI; define which
  store is authoritative and how failed cache synchronization is repaired.
- Test two-user isolation, denied API requests, failed Redis writes, and
  block behavior during an outage before enabling new customer workspaces.

Exit: users cannot see or change another site's data; saved policy and effective
policy agree or show an explicit failure; existing traffic remains available.

### C. Collect the evidence customers need

- Add bounded per-path daily counters alongside existing totals; strip query
  strings and exclude private/dashboard/auth paths. Bound path cardinality and
  retention so arbitrary URLs cannot create unlimited keys.
- Wire Top Pages to actual data with a clearly marked collection start date.
- Record enough status/latency information to distinguish a policy pass from
  a successfully delivered page. Batch reads and define a Redis cost budget.
- Maintain vendor-documented bot categories, robots controls, and optional
  verified IP identity; do not treat robots-only control tokens as confirmed
  HTTP crawler identities.

Exit: a controlled allowed request and blocked request reconcile across totals,
daily reports, and paths; private URLs/query values never appear in reports.

### D. Turn observations into useful actions

- Derive real crawler actions (new crawler, sudden request increase, repeated
  blocking, important content not visited), with evidence and observation dates.
- Keep seeded examples explicitly labeled and preserve the existing derivation
  and local-state behavior until the real source is ready.
- Persist workspace settings and action decisions with RLS; replace placeholder
  API keys only when a real authenticated ingestion API exists.
- Add opt-in email/webhook summaries only after durable delivery, deduplication,
  and retry handling exist. Do not show a notification as enabled without delivery.

Exit: every recommendation links to measured evidence; failures differ from an
empty queue; action state survives a different browser for the same account.

### E. Make installation and operations repeatable

- Document environment setup without credentials, add meaningful CI checks,
  migrate the deprecated lint command, and maintain a fresh-checkout setup check.
- Package the collector for another Next.js site; verify site ownership and
  rotate/revoke ingestion credentials. Validate and rate-limit incoming events.
- Measure latency with Redis healthy and unavailable; add ingestion-health and
  retention indicators before calling zero traffic a healthy installation.
- Add policy audit history and throttling only after ownership is enforced.

Exit: a second real site installs successfully; requests stay available during
an analytics outage; performance/cost limits and data deletion are documented.

### F. Explore citation intelligence after the core loop is trustworthy

Run a small, budgeted prompt-monitoring experiment using supported provider
APIs. Store provider, model, timestamp, source URL, and evidence for each claimed
citation. Measure repeatability and false positives before productizing trends,
competitor rankings, or paid plans. Crawler access is not citation attribution.

## Validation and handoff

- Baseline: full TypeScript check passed before changes. Existing lint findings
  and build results are recorded in `docs/TRAFFIC_REPORTS.md` after execution.
- Use installed Node 22, TypeScript, tsx, and ESLint; add no dependencies.
- Do not seed, write to live services, change policies, or inspect env values.
- Add tests only for report calculations, payload validation, and safe exports.
- Keep all existing product files byte-for-byte intact; future milestones are
  a prioritized roadmap, not claims of completed implementation.
