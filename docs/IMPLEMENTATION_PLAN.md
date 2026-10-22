# Promptwatch: review and implementation plan

Reviewed on 18 October 2026 against local commit `bc24dcf` and the linked
[repository](https://github.com/pjha26/promptwatch). The working tree was clean.

## Direction

### Read-only deployment setup, 22 October 2026

Added a linked Setup page using four existing owner-protected APIs, without new
database keys, services, writes or automatic activation. Site settings, Redis
reachability, collector evidence, identity configuration, feed refresh and webhook
delivery are separate states. Available checks survive another source's failure;
all sources are validated and bounded by a shared fetch timeout. The page states
the limits of URL attribution, separate-site configuration and historical evidence.

Unit checks cover missing details, quiet collection, optional disabled state,
partial failure and malformed responses. An isolated browser with actual CSS
verified missing/saved details, recorded/degraded/unknown evidence, configured
delivery without completion proof, errors and reload recovery at desktop/mobile
sizes. Signed-out build smoke now checks the new page's login redirect too.

### Core-focused Overview and demo labels, 22 October 2026

Overview now shows allowed requests, blocked requests, active crawlers including
blocked-only traffic, and saved review actions. Citation examples remain available
under Demo previews, with prominent notices explaining that no real AI queries or
citation measurement occur and local preview edits reset on reload. Webhook Alerts
has a direct navigation entry. Existing example data and preview interactions remain.

The shared traffic hook reuses the existing response parser, clears stale values,
cancels superseded requests and has a bounded timeout. Bad data is unavailable,
not a zero counter or a rendering exception. Local full checks passed (80 tests,
lint, types, production build and anonymous API smoke). An isolated browser with
real generated CSS verified metrics, blocked-only activity, malformed data, retry,
zero states and both preview notices. Live owner access remains pending setup.

### Remaining release sequence, 22 October 2026

Site settings, evidence filters and optional webhook delivery are implemented and
their hosted checks passed (`d185790`, `48affb3`, `8fff812`), including the new
real-Redis delivery checkpoints and unchanged installed-collector fixture.
All 80 local tests passed with localhost networking permitted; lint, types,
production build and anonymous API smoke also passed. Added a concrete `RELEASE_CHECKLIST.md` separating
implemented capabilities from owner/service activation, actual tracked-site
deployment and receiver verification. `OPERATIONS.md` covers bounded retention,
CSV export limits, backups and safe recovery without performing production work.

Live owner and second-site checks remain pending the intended UUID and reactivated
services. Usage-dependent throttling remains a conditional next milestone after
production evidence, with its enforcement/counting contract written in the release
checklist. No new access rules, deletion controls, ownership setting, service
migration, scheduled job or external notification was enabled during development.

### Optional webhook alerts, 22 October 2026

The owner selected a webhook as the first channel. Added opt-in server-configured
HTTPS delivery for active traffic spikes, saved unresolved collector failures,
and partial/failed feed refreshes. Public collection and enforcement are unchanged.
Signed bounded payloads, durable pre-send checkpoints, token-owned overlap
protection, group cooldowns, three-attempt backoff and a four-send run limit keep
delivery bounded. The owner can inspect history and manually run eligible work;
a protected daily cron is included. No live endpoint or secret was configured.

The queue depends on Redis, so independent outage notification and transient
failures between daily checks remain outside this feature. Lost acknowledgements
can repeat an event: receiver deduplication is required. Setup, retention,
rotation and retry limits are in `WEBHOOK_ALERTS.md`.

Local checks passed: lint, TypeScript, production build, anonymous API checks
and the full regression suite. Isolated browser checks covered disabled/setup/
ready states, recorded success, failed confirmation, malformed status and
exhausted attempts. Unit checks cover signing, durable attempts, backoff,
deduplication, overflow, recovery cancellation and lost acknowledgements. CI
also runs the real Redis checkpoint/token-replacement tests. Hosted delivery,
cron execution and a real receiver remain unverified until explicitly configured.

### Evidence filters, 22 October 2026

Added crawler, outcome and inclusive UTC date filters to Reports using the
existing retained counters. Totals, breakdowns and exports share one calculation;
CSV scope records the selection. Invalid ranges remain visible as errors.
Custom ranges do not manufacture previous-week comparisons. No collector or
storage format changes, and no unsupported per-crawler page attribution.

Validation passed: 70 tests, lint, TypeScript, production build and anonymous
API smoke checks. An isolated browser verified filtered totals, a downloaded
scoped CSV, invalid-date recovery and reset using the actual Reports component.

### Product settings, 22 October 2026

Replaced demo site details with validated owner-only Redis persistence and
read-back confirmation. Removed fake API credentials, notification switches,
upgrade promises and the no-op deletion action. Existing enforcement, counts
and policy controls are unchanged. Tests cover input/storage validation,
normalization and unconfirmed writes; anonymous API checks include settings.

Next sequence: live owner/services and second-site verification (waiting for
the owner's UUID and reactivated services); evidence filters using existing
retained counters; optional webhook delivery (owner's selected channel);
throttling only after real usage demonstrates a need; release operations docs.
Do not treat blocked live checks as completed or enable services by guessing
credentials. Keep all new delivery and enforcement options off by default.

### Automatic IP-feed refresh, 21 October 2026

Added an opt-in, secret-authenticated Vercel job using the existing feed refresh
logic. The included daily schedule supports Hobby plans. It remains dormant
until explicitly enabled with a valid cron secret and owner setting. No owner
or service configuration was changed while the user reactivates the project.

Refreshes are independent, with success/partial/failed results. A token-owned
120-second Redis lease prevents overlap; completion cannot clear a replacement
lease or overwrite its result. Last confirmed completion is retained for 30
days and shown separately from configuration and current feed freshness. The
24-hour freshness rule and manual controls remain unchanged, so delayed/missed
runs are not portrayed as continuous healthy verification.

Local `npm run check` passed: all 67 tests, zero-warning lint, TypeScript,
production build and signed-out API checks (including cron authorization and
setup guards). Isolated browser checks passed for status modes, per-feed
outcomes, UTC/mobile layout and recovery from invalid/unavailable status data.
CI also exercises the real Redis lease/completion scripts and replacement-token
protection; hosted results are checked after pushing. Setup and platform limits
are in `AUTOMATIC_FEED_REFRESH.md`. Actual activation is still a deployment step.

### Local collector package, 21 October 2026

IP observations were pushed as `5059101`; the hosted workflow passed, including
the real Redis scripts. Extracted the existing middleware request handling into
one shared Web Request helper used by this application and a private local
collector archive. The package has no Supabase/dashboard dependency and retains
the existing counting, paths, policy, health and optional IP behavior.

A separate dashboard can explicitly disable its own collector without changing
authentication, preventing mixed site traffic. Package instructions explain the
single tracked-site database boundary, server-only credentials, how to retain a
site's existing middleware, and how to distribute the local archive. No registry
publication or production deployment is performed. A temporary independent
Next.js fixture installs the actual archive and checks Edge middleware behavior
against isolated storage responses; real deployment verification remains pending.

Local validation passed: all 60 tests, zero-warning lint, TypeScript, production
build and signed-out API smoke checks. The independent installed-package fixture
also built successfully and passed human/Allow/Block, private query omission,
retained site middleware, API exclusion and storage-failure checks. CI now runs
that fixture too; the hosted result is checked after pushing.

### Optional direct-Vercel identity observations, 21 October 2026

The owner confirmed that the tracked site receives requests directly through
Vercel. Implemented explicit opt-in IP-range observations for the five configured
agents with OpenAI/Perplexity feeds. Only Vercel's client-IP header is used; raw
IPs are never retained. Missing, expired, invalid and failed checks are separate
from non-matching fresh ranges. Observations do not change access decisions.

Owner-only feed refresh validates bounds and schema before replacing cached
data, with a 24-hour TTL and no vendor requests in public middleware. Daily
status hashes expire after 30 days and reuse the current counting script;
old counters, paths, health and policy behavior are retained. Setup, limits,
vendor references and pending Vercel deployment verification are documented in
`CRAWLER_IDENTITY.md`. Feed refresh is manual; automatic alert delivery and
throttling are still later milestones.

Local validation passed: 57 tests, zero-warning lint, TypeScript, production
build and anonymous API smoke checks. Isolated browser checks covered status
modes, refresh and failure recovery, UTC and mobile containment. All five public
vendor feeds were validated without Redis writes. The hosted Redis check also
covers identity fields with/without paths and a corrupt optional identity key;
its result is checked after pushing. Real Vercel ingress and owner login are
still pending deployment setup.

### Collector transport checks, completed 21 October 2026

Policy history was pushed as `d08edc5`. Its hosted workflow passed, including
the real Redis integration checks. Added actual-SDK HTTP transport checks using
an isolated local service, measuring healthy Allow/Block requests and verifying
the shared two-second deadline, no replay of uncertain writes, confirmed blocks
during count failures, and best-effort error markers. These do not change policy
or collection behavior. `COLLECTOR_PERFORMANCE.md` records the measured fixture
timings and separates them from still-pending production measurements.

Local `npm run check` passed with dummy service configuration: zero-warning lint,
TypeScript, all 47 tests, production build and signed-out API checks. Healthy
fixture timings are diagnostic; deadline and enforcement behavior are asserted.

Remaining release sequence: live owner/services verification; production latency
measurement in a disposable deployment; verified identity using the deployment's
trusted client-IP source; second-site installation; then reliable opt-in alerts
and optional throttling. Service reactivation and the owner UUID are still
pending. Do not infer ownership or treat controlled test requests as verified
real crawler traffic. No production settings or services were modified.

### Policy history milestone, 19 October 2026

The automated checks and submodule metadata fixes were pushed as `ffeb953` and
`ccb0788`. The hosted GitHub workflow passed after the metadata fix, including a
fresh lockfile install, lint, types, tests, build and signed-out API checks.

Policy writes now use one Redis script to retain the actual previous effective
rule and newest 200 changes alongside the authoritative update. No-op saves
create no entries. Settings displays owner-only history with refresh, UTC dates,
and distinct error/empty states. A policy reload failure no longer displays a
false save-success message. Existing enforcement keys are unchanged.

Local validation: 41 regression tests, zero-warning lint, TypeScript, production
build and anonymous API smoke checks passed. An isolated browser checked history
refresh, no-ops, reload persistence, UTC/mobile layout, malformed/read failures,
ambiguous saves and failed confirmation reloads using simulated API responses.
CI now adds a disposable Redis service and real Lua integration tests for policy
history, concurrent no-ops, malformed storage, bounds, collector counts, TTLs and
page caps. Local Docker is not running; actual Redis results are checked in CI
after pushing. No live Supabase or Upstash services were contacted.

### Automated checks milestone, 19 October 2026

Added a secret-free GitHub Actions workflow for pushes and pull requests, pinned
to official action commits with read-only repository permissions. Node 22 runs
the lockfile install, zero-warning product lint, TypeScript, regression tests,
production build and signed-out API smoke checks. `npm run check` provides the
same checks locally. Build and dev cleanup no longer download undeclared rimraf.

Existing unused imports and the landing-page effect dependency warning were
fixed without changing crawler behavior. The preview retains its source and
layout using an unoptimized Next image. Generated/tool directories are excluded
from lint. Local CI-equivalent checks passed with dummy auth configuration and
Redis disabled: 37 tests, types, lint, build and API smoke checks. This does not
verify live services or apply GitHub branch protection; hosted CI results must
be checked after pushing.

The first hosted run exposed two pre-existing skill gitlinks without a
`.gitmodules` manifest. Added their existing origin URLs as metadata so GitHub
checkout can clean up normally; no skill contents or product code changed.

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

### Real Action Centre milestone, 19 October 2026

Tracking Health was committed and pushed as `1b96c3f`. Action Centre and Overview
now derive evidence-backed recommendations from real counters: traffic increases,
repeated blocks, and newly observed activity over completed UTC days. Owner-only
GET/POST endpoints persist review/dismiss/reopen decisions in expiring Redis
hashes, independently of policies. Demo files and historical counters are retained.

Failures are distinguished from empty results. Ambiguous saves require a refresh
before another decision. Cards expose counts, dates, source links, and limits on
identity and discovery claims. Rules and retention are in `CRAWLER_ACTIONS.md`.
The reviewed filter covers current recommendations, not a permanent audit archive.

Validation includes 37 focused tests, TypeScript, targeted lint, production build,
signed-out API smoke checks, and an isolated browser harness covering filters,
review persistence across reload, reopen, save-failure recovery, Overview,
empty/error states and mobile cards. Browser responses are simulated; live
Supabase/Redis verification and owner setup remain pending service reactivation.

The following review tables and initial restrictions are historical baseline
findings; completed milestones above supersede them. Remaining priorities are
live installation verification, policy audit history, verified identities,
measured collection latency, and installation on a second site.

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
