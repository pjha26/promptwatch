# Single-owner release checklist

This is the remaining operator sequence, not a claim that production checks
have passed. The intended owner's UUID and reactivated Supabase/Redis services
are still pending. No production migration, ownership setting, webhook endpoint
or new opt-in capability has been activated by the implementation work.

## 1. Activate owner access and storage

- [ ] Reactivate the intended Supabase and dedicated Upstash Redis projects.
- [ ] Follow [single-owner setup](SELF_HOSTING.md), configure the intended owner's
  UUID, and review/apply the supplied legacy-access migration where applicable.
  Back up legacy rows before reconciliation. Never infer the owner from a login.
- [ ] Confirm signed-out administration requests receive 401, another signed-in
  account receives 403, and the intended owner can load Settings and Reports.
- [ ] Save the site's name/origin, reload, and confirm they persist. This records
  metadata; it does not verify ownership or install the collector.
- [ ] Check Tracking Health and run the isolated storage self-check. Do not
  interpret that result as proof that the tracked site's middleware is installed.

Record the deployment revision, UTC time and pass/fail results without passwords,
API keys, session cookies or full environment dumps.

## 2. Prove the complete tracked-site flow

Use a disposable deployment and fresh dedicated Redis database for controlled
requests. Synthetic checks are not real crawler traffic and must not be mixed
with an existing website's production history.

- [ ] Follow [collector installation](COLLECTOR_INSTALLATION.md). Preserve the
  site's existing authentication/redirect middleware. If using a separate
  dashboard, disable only its collector so it cannot mix its visits into totals.
- [ ] Start with the homepage-only public-path allowlist. Match configuration
  between the dashboard and tracked site; add other public paths deliberately.
- [ ] Send a human request and confirm it does not increment crawler totals.
- [ ] Send one controlled matched-crawler request with Allow; confirm it proceeds
  and adds exactly one allowed counter and eligible public-path count.
- [ ] Change that rule to Block, confirm read-back and history, then send a
  controlled matched request. Confirm 403 and one blocked counter. Restore the
  intended rule and verify it again. Requests continuing through middleware do
  not prove a successful page response or an AI citation.
- [ ] Confirm queries/private paths are omitted and existing site auth still works.
- [ ] Compare Reports totals, crawler/daily tables and filtered CSV exports.
- [ ] Measure deployed request latency and outage behavior using
  [the performance procedure](COLLECTOR_PERFORMANCE.md). Local simulated latency
  is not a production benchmark. Use isolated services for failure injection.

## 3. Activate optional observations and delivery

- [ ] For the confirmed direct-Vercel deployment, follow
  [identity setup](CRAWLER_IDENTITY.md). Verify actual header handling and fresh
  ranges; a spoofed User-Agent is only a synthetic matching check. Keep raw IPs
  out of logs and stored evidence.
- [ ] If enabling [automatic feed refresh](AUTOMATIC_FEED_REFRESH.md), confirm a
  real protected invocation and recorded per-feed results after deployment.
  A schedule entry or configured secret alone does not prove it ran.
- [ ] Configure [the selected webhook channel](WEBHOOK_ALERTS.md) only when the
  receiver verifies signatures and durably deduplicates event IDs. Enable it
  explicitly, observe a real eligible event, and confirm both receiver acceptance
  and recorded delivery. Exercise failures/retries in a disposable receiver.
- [ ] Confirm a real scheduled alert check. Daily checks can miss transient
  failures; independent uptime monitoring remains a separate operator decision.

## 4. Decide whether throttling is needed

Throttling is deliberately **not implemented** before real usage and deployed
latency are measured. Record which crawler needs limits, its normal/burst volume,
and whether a limit should be shared by all of that crawler's User-Agent matches.
User-Agent-based limits are spoofable and are not security-grade identity limits.

If evidence justifies the feature, implement one optional atomic per-crawler
window: confirmed Block continues to take precedence; limited requests receive
429 plus `Retry-After`; limited counts remain separate from blocks and allowed
traffic. Preserve the documented availability behavior during storage failures.
Keep it off by default and test concurrent requests, boundary times, outages and
the installed collector package before enabling it. Do not retrofit rate limits
into historical counts or silently change existing Allow/Block rules.

## 5. Prepare and recover a release

- [ ] Pin a known passing Git revision and retain the deployment configuration
  securely outside this repository. Keep credentials out of release artifacts.
- [ ] Run `npm ci` and `npm run check`; require the hosted workflow's Redis and
  installed-consumer checks to pass for that revision.
- [ ] Run `npm run collector:pack`, retain the generated archive with the release,
  and record its checksum. Install that exact archive on the tracked site.
  Rebuild/reinstall when collector source changes; version `0.1.0` is a private
  preview, not a registry-managed release or a promise of compatibility.
- [ ] Review [retention and recovery](OPERATIONS.md). Export retained reports
  before maintenance, and test restoration using an isolated database.
- [ ] Document the last known working revision and the operator responsible for
  rollback. A code rollback does not undo rules, migrations or data changes.

Deferred beyond this release: SaaS customer isolation, billing, prompt rankings,
competitor citation collection, email summaries, public API keys and bulk data
deletion. These are separate features, not dependencies of the crawler-control
loop. Existing demo citation screens must not be sold as real measurements.
