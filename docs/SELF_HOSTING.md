# Single-owner product setup

This release manages **one site per deployment**. Use a dedicated Upstash Redis
database per installation. Unrelated sites must not share these counters or rules.

## Required setup before exposing the dashboard

1. Configure the four Supabase/Upstash variables listed in `.env.example`.
2. Create the intended owner's account using the existing sign-up flow. In
   Supabase **Authentication > Users**, copy that user's UUID into the server-only
   `PROMPTWATCH_OWNER_ID` environment variable. Restart/redeploy after changing it.
   Any other account receives 403 from administration APIs. An unset/invalid owner
   setting leaves authenticated administration closed with a setup message.
3. Run `supabase/migrations/202610180001_lock_legacy_bot_policies.sql` in your
   Supabase SQL editor as the project administrator. It retains the old policy
   table/rows while enabling RLS and removing browser-role access. This closes
   the direct PostgREST path left open by the old schema. A fresh installation
   that only uses Supabase Auth does not need the old application tables.
4. Disable public sign-up in Supabase after creating the owner if you do not need
   additional accounts. Set the auth Site URL and Google callback allowlist to
   your actual deployment. Keep Redis tokens private and restrict project access.

No owner is inferred from the first person to sign in. No privileged service-role
key is required by this application. Never use a service-role key as the public
anonymous key.

## Policies and existing data

Redis is the authoritative policy store because the middleware reads Redis on
each detected request. Saving a policy writes the same `policy:{botId}` key once;
the UI confirms the stored value by reloading policies. A failed or ambiguous
response requires reload before another update. Missing rules default to Allow;
malformed rules and read outages are errors, not displayed as confirmed defaults.

Existing `bot:{id}:{UTC date}` and `blocked:{id}:{UTC date}` keys remain intact.
The old Supabase policy table is no longer read or written by the application.
Rules that existed only there were never confirmed as enforced; the UI now shows
the Redis value actually used by the collector. Export old rows before manually
reconciling them if necessary. No automatic data migration or deletion occurs.

A confirmed Block returns 403 even if writing its analytics counter fails.
If the policy itself cannot be read, public requests fail open to preserve site
availability and a generic server error is logged. This is crawler management,
not an origin firewall or protection against forged User-Agent headers.
Administrative/authentication routes are excluded from crawler policy evaluation
so a crawler rule cannot lock the owner out of recovery controls.

Traffic APIs, reports, policies and the read-only Redis connectivity check all
require the configured owner and return private, non-cached responses. Errors do
not include Redis credentials, database details, or stack traces. Auth callbacks
accept only local return paths.

## Public page analytics

`PROMPTWATCH_PUBLIC_PATH_PREFIXES` is a comma-separated allowlist. It defaults to
`/`, which records the homepage only. To collect public documentation and blog
paths as well, set `PROMPTWATCH_PUBLIC_PATH_PREFIXES=/,/docs,/blog`, then restart
the deployment. `/docs` matches itself and descendants, not `/docs-other`.
Do not include directories containing customer data, private identifiers, or
one-time links. Only enable prefixes whose complete URL paths are public.

The collector strips query strings/fragments, rejects malformed or encoded
separator/control characters, and excludes known private/admin/auth segments.
It also rejects email-like paths, UUID/long hexadecimal identifiers, and
JWT-shaped path segments. These conservative filters may omit some legitimate
public pages; the allowlist is still the installer's privacy boundary.

Daily allowed and blocked page hashes each retain at most **200 distinct paths**.
Existing paths continue counting when the cap is reached. New paths past the cap
are omitted, while per-bot totals continue counting. Both hashes expire after
30 days. Limits are enforced inside the same Redis script as request counting,
so concurrent requests cannot expand a hash past the cap.

Top Pages reads the last 30 UTC days through an owner-only endpoint. It ranks
allowed plus blocked activity and displays both outcomes separately. The first
recorded path date is shown; older bot totals cannot be backfilled into paths.
Paths removed from the configured allowlist disappear from reports immediately;
their already-stored daily hashes expire normally. Page totals are therefore a
bounded, allowlisted subset of all crawler requests, not an exhaustive URL log.

`paths:started_at` stores only the first path-collection date and does not expire.
It is not an uptime or ingestion-health signal. A timeout/service failure shows
an error with retry instead of a false zero-page result.

## Crawler identities

HTTP token matching now covers training/search/user-requested agents from
OpenAI, Anthropic, and Perplexity, plus the existing CCBot and Bytespider tokens.
Matching is case-insensitive and checks token boundaries to avoid incidental
substring matches. User-Agent headers remain forgeable; IP verification is not
implemented. A reported match is not proof of a successful page response or an
AI citation.

`Google-Extended` and `Applebot-Extended` remain readable as historical IDs, but
are not classified as HTTP crawlers or offered as editable HTTP blocking rules.
Their content-use directives belong in the site's robots.txt. Existing historical
keys are preserved, including counts from the earlier classifier.

Vendor references: [OpenAI](https://developers.openai.com/api/docs/bots),
[Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler),
[Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers),
[Google](https://developers.google.cn/crawling/docs/crawlers-fetchers/google-common-crawlers?hl=en),
and [Apple](https://support.apple.com/en-gb/119829).

## Verification and operations

Action Centre and Overview now use recorded crawler counters with owner-only
review decisions saved in Redis. See [recommendation rules](CRAWLER_ACTIONS.md)
for thresholds, rolling windows, decision retention and interpretation limits.
Reviewing a recommendation never changes access policies.

Open `/dashboard/health` to check Redis connectivity, the last recorded collector
request, and any saved collector failure. Missing evidence is shown as unknown:
quiet traffic is not declared healthy or broken. Instrumentation starts with
this version; older counters are not fabricated into health records.

The **Run storage self-check** button is an owner-only mutation. It executes the
real counter script against isolated diagnostic keys, reads the result back,
and removes those keys. Diagnostic keys also expire after 60 seconds. A successful
check stores its timestamp in `collector:health` but does not increment traffic
totals, change policies, or prove that middleware is installed on another site.
It does not clear a collector failure; later recorded traffic supplies that
evidence. Failure markers are best-effort because an outage can prevent saving
them too. Health metadata expires after 30 days without refresh/activity.

Redis clients have a two-second request-lifetime budget with automatic retries
disabled. An unconfirmed counter write is not automatically replayed. A confirmed
Block remains blocked when analytics fails; an unreadable policy still fails open.

Once the services are active, run these operator checks locally without printing
credentials:

```powershell
npx --no-install tsx scripts/verify-services.ts
# Explicit storage write/read check using temporary diagnostic keys:
npx --no-install tsx scripts/verify-services.ts --self-check
```

The first command is read-only. It reports missing owner configuration and probes
Redis plus the Supabase Auth service. It does not verify owner login, deployed
RLS, or the legacy-policy migration. The optional self-check writes only temporary
diagnostic keys and the self-check timestamp. Do not publish `.env.local`.

Run the tests, type check, lint and production build before updating an installation.
After deployment verify owner login, a second account being denied, an Allow and
Block request, and the dashboard totals. Use a disposable Redis database when
testing outages; do not disable the production database to exercise failures.

The SQL migration and environment configuration are deployment steps. They are
provided in Git, not automatically applied by a GitHub push. If your GitHub is
connected to Vercel, each pushed commit may trigger its configured deployment.
