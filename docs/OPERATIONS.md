# Retention, export and recovery

One deployment and dedicated Redis database represent one tracked website.
Changing the saved site URL does not partition existing data. Use a new dedicated
database for a different website; keep the earlier installation's history separate.

## What is retained

| Data | Retention and limits |
| --- | --- |
| `bot:{id}:{UTC date}`, `blocked:{id}:{UTC date}`, `limited:{id}:{UTC date}` | Separate allowed/blocked/HTTP 429 counters expire after 30 days |
| `pages:{UTC date}`, `blocked-pages:{UTC date}`, `limited-pages:{UTC date}` | 30 days; at most 200 paths per day/outcome |
| `identity:{UTC date}` | 30-day aggregate observations; no raw IPs |
| `identity:feed:{botId}` | Official ranges cached for 24 hours |
| `collector:health` | 30 days without new health/collector activity |
| `identity:refresh:last` | Last confirmed feed refresh, 30 days |
| `actions:decisions:{date}` | 60 days from a write to that date bucket |
| `policy:{botId}`, `policy:history` | Policies persist; history keeps latest 200 actual changes |
| `throttle:rules`, `throttle:history` | Rules persist; latest 200 actual owner changes |
| `throttle:window:{botId}`, `throttle:samples:{botId}` | Quota expires just after minute reset; 60 sample slots, expires after one hour idle |
| `throttle:would:{botId}:{UTC date}` | 30-day hypothetical observation exceedances; already included in allowed counts |
| `settings:site`, `paths:started_at` | Persistent deployment metadata |
| `alerts:state` | State key expires after 30 days without a worker write; individual events retained at most 7 days; at most 100 entries |

TTL is set/refreshed when the corresponding key is written, not an immutable
archive deadline. Traffic and path gaps cannot be recovered from missing counters.
Retained page data is a bounded public subset, not a complete request log.
Legacy Supabase rows are separate from authoritative Redis policies and are not
deleted by application upgrades. Short-lived job locks and diagnostic keys expire
automatically; do not manually remove an active worker's lock to force overlap.

## Export and backup before maintenance

Use Reports to download daily and crawler CSVs for the selected retained period.
Filters also apply to exports; reset them for deployment-wide totals. CSVs contain
aggregate traffic, not a complete Redis backup: they do not include rules, policy
history, site settings, review decisions or delivery state.

Before an upgrade, migration or manual repair, use the storage provider's backup
facilities appropriate to your installation. Keep the snapshot encrypted with
restricted operator access, record its UTC time and application revision, and
test restore into a separate disposable database. Do not commit a snapshot,
credential dump or customer data to GitHub. An untested snapshot is not a verified
recovery path. Store authentication-service configuration separately and securely.

Bulk deletion is not implemented in the application. Do not use a broad database
flush, wildcard delete, or copy another website's data into this installation.
Any future deletion workflow needs an owner-visible scope/preview, explicit
confirmation, backup review and coordination with collection/background workers.
No destructive cleanup command is included or executed by this release.

## Recovery sequence

1. Identify whether the failure is authentication/configuration, Redis access,
   collector installation, feed freshness or webhook delivery using their separate
   dashboard states. Missing traffic by itself is not a diagnosis.
2. Pause optional webhook delivery and automatic feed refresh through their
   server environment switches before changing endpoints or restoring state.
   Do not guess a replacement owner UUID or disable owner checks for access.
3. If Redis is unavailable, restore access first. Public policy reads currently
   fail open; a previously confirmed Block remains enforced only when its rule
   could be read. Analytics failures do not reverse a confirmed Block. Independent
   monitoring is needed to alert through an outage of this shared storage.
4. For corrupt values, preserve a backup before repair. Reload policies/history
   after uncertain writes; never assume a timeout means the write did not happen.
   Do not turn unreadable data into an empty or healthy dashboard result.
5. If restoring a snapshot, validate it in isolation first. Check authoritative
   rules, settings, counter dates, TTLs and key types before connecting the tracked
   site. Stored review/delivery history may be older than the real external events.
   A restore can replay pending webhook events; receivers must deduplicate IDs.
6. Redeploy the last known working revision and matching collector archive if a
   code rollback is required. Keep the intended rules and owner configuration;
   a rollback does not reverse a database migration or restore expired counters.
7. Recheck owner access, storage self-check, one controlled disposable-site
   Allow/Block sequence, reports and existing site authentication. Re-enable
   optional jobs only after their configuration and retained state are reviewed.

Record recovery outcomes without secrets. These procedures prepare an operator;
actual backup/restore, live access and production failure recovery are still
release checks, not operations already performed by the development tests.
