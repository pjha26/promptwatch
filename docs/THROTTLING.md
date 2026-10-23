# Optional crawler minute observations

Start with **Observe only** at `/dashboard/throttling`. This milestone records
minute samples and hypothetical quota exceedances; it never denies a request.
Existing Allow/Block rules remain authoritative. No production limit is guessed.

## Setup

1. Finish owner access and service setup. Use a dedicated Redis database for the
   one tracked website. Save a crawler's Observe rule with an explicitly chosen
   candidate limit of 1–100000 requests per minute.
2. Set server-only `PROMPTWATCH_THROTTLING_ENABLED=true` on the tracked collector
   deployment and redeploy. The default is false. Rules alone do not activate
   collector integration. On a separate site, install the updated private preview
   collector archive and pass `throttlingEnabled` as shown in its README.
3. Review samples in a disposable deployment first. Synthetic requests are tests,
   not real crawler traffic. Measure deployed latency before production activation.
   On a separate dashboard the displayed integration flag belongs to that dashboard;
   verify the tracked site's own environment and installed archive separately.

Quotas apply to all matching requests for that crawler on the tracked site,
regardless of path or client IP. No visitor IP is retained. User-Agent matching
can be forged and does not provide security-grade identity or firewall protection.
Confirmed Blocks bypass optional quota storage and do not consume quota.

## Window and storage contract

The first version uses fixed **UTC one-minute windows**, with Redis's server
clock selecting the window atomically. Counter reset is not a background task.
A rule revision resets that crawler's quota even within the same minute. Saving
an unchanged rule is a no-op; its revision and history do not change. Boundary
bursts can reach a full quota immediately before and after a reset. This is not
a sliding-window or smoothing algorithm.

- `throttle:rules`: persistent known-crawler hash, with mode, limit, revision and
  update time. Absent rules are off. No automatic migration changes old policies.
- `throttle:history`: latest 200 actual owner rule changes, saved atomically with
  each update. Previous/new rule and UTC time are retained, not immutable history.
- `throttle:window:{botId}`: one current revision/minute/count hash per crawler,
  expiring just after the minute boundary (at most 61 seconds).
- `throttle:samples:{botId}`: at most 60 minute slots in normal operation. A slot
  is overwritten when its minute cycles; the hash expires after one hour idle.
- `throttle:would:{botId}:{UTC date}`: hypothetical above-quota request count
  with 30-day retention. These requests still proceed in observation mode and
  remain included in ordinary allowed counts; do not add would-limit to totals.

Samples include active-rule requests that passed the Allow/Block check, not
blocked traffic. Current-minute samples are partial; the API filters stale slots.
Missing samples do not prove zero traffic or collector health. Rule changes,
off periods and storage failures can leave gaps. The API labels the daily
counter's requested UTC date separately from its Redis clock timestamp.

Collector integration uses the existing policy read and one script invocation,
with no additional healthy-path network round trip. The existing two-second
Redis client deadline and no-replay behavior remain. An unreadable policy still
fails open; a confirmed Block stays blocked even if analytics fail. Optional
quota failures preserve availability and record a best-effort `throttle-check`
health marker. An uncertain write is not replayed; samples/counts may be incomplete.
Analytics failures within the script are reported separately from quota checking.

## Owner workflow and tests

The owner-only API validates same-origin JSON mutations and returns private,
non-cached responses. The UI reloads storage before confirming a save and disables
further edits after uncertain or malformed responses until reload succeeds.
Enabling integration is an operator deployment action, not a browser toggle.

Tests cover schema validation, observation bounds, Block precedence, unavailable
quota storage and non-replay. Real Redis CI tests exercise Lua concurrency,
minute resets, revision changes, no-op history, TTLs and 60-slot bounds. The
installed-package fixture checks observation leaves the tracked site's middleware
in control. Local browser fixtures use simulated owner APIs, not live services.

Enforcement and distinct rate-limited reporting are the next milestone. Keep
integration off until real owner/service access and the tracked installation are
verified. Nothing in development activates a production rule or deployment flag.
