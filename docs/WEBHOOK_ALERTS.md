# Optional webhook alerts

This feature is off by default. Configure it only on the owner dashboard sharing
the tracked site's dedicated Redis database. It adds no network calls or rules
to public middleware. Email, weekly summaries and external API keys are not
implemented.

## Setup

1. Complete [owner/service setup](SELF_HOSTING.md). Keep the owner UUID private
   server configuration; an unset owner prevents scheduled administration.
2. Provide an HTTPS endpoint that you operate. Put its full URL in the server-only
   `PROMPTWATCH_WEBHOOK_URL`; credentials in the URL and redirects are rejected.
   The endpoint is trusted operator configuration, never a browser-supplied URL.
3. Generate a separate random base64url/hex secret of 32–256 characters. Set
   `PROMPTWATCH_WEBHOOK_SECRET` and configure the receiver with the same secret.
   Never use a Redis token, owner UUID or public browser variable as this secret.
4. Set a valid `CRON_SECRET` as described in [scheduled refresh](AUTOMATIC_FEED_REFRESH.md),
   then explicitly set `PROMPTWATCH_ALERTS_ENABLED=true` and redeploy.
5. Open Settings → Webhook delivery status. **Check and deliver alerts** checks
   actual recorded evidence; it can send real requests. There is no fake test
   traffic or automatic sample alert. Reload history to confirm recorded results.

`vercel.json` schedules `/api/cron/alerts` daily at 03:30 UTC (09:00 IST).
Scheduling is not an exact-time or delivery guarantee. A manual owner check can
also process eligible retries. The cron endpoint requires Bearer `CRON_SECRET`
and valid owner setup when enabled; the owner API uses the existing authenticated
session and same-origin JSON. Disabled cron calls do no work. The status API
does not reveal the endpoint or signing secret.

## Events and meaning

- Active traffic-spike recommendations use the existing completed-UTC-window
  rules and evidence. Accepted/dismissed recommendations are excluded.
- Collector failures require a saved failure marker with no later recorded
  request superseding it. Markers are best-effort, not continuous uptime checks.
- Incomplete official-feed refreshes use the last confirmed partial/failed run.
  A missed cron with no recorded completion does not produce an invented failure.

Quiet traffic is not an outage. A Redis outage can prevent both detecting and
storing a failure and prevents this worker from safely delivering. Use an
independent external monitor if outage notification is required. A daily check
can miss transient failures that recover before it runs. These are notifications
about recorded evidence, not real-time page-delivery or citation monitoring.

## Receiver contract

The JSON body includes `schemaVersion: 1`, `eventId`, `type`, `title`,
`occurredAt` (UTC), and `details` (bounded evidence strings). No raw visitor IP,
query string, credential or individual request log is sent.

Headers:

- `X-Promptwatch-Event-Id`: stable ID for this event, reused on retries.
- `X-Promptwatch-Timestamp`: Unix seconds for this attempt.
- `X-Promptwatch-Signature`: `v1=` plus the hex HMAC-SHA256 of
  `<timestamp>.<exact raw JSON body>` using the signing secret.

Verify the signature using a constant-time comparison **before** parsing or
acting on the event. Reject timestamps outside your replay window (for example,
five minutes). Deduplicate `eventId` durably for at least seven days, including
across receiver restarts. Persist or enqueue the accepted event before returning
a 2xx response. Other responses, redirects and a five-second timeout count as
failed attempts. Response bodies are not retained or exposed.

## Queue and recovery limits

`alerts:state` retains at most 100 entries, with seven-day event retention
(never beyond seven days from the evidence timestamp). Each entry has at most
three attempts: a failed first attempt becomes eligible after one hour; a
failed second attempt after 24 hours. Eligibility waits for the next scheduled
or manual check. There is no sub-hour retry scheduler. Each run sends at most
four requests. New events in the same signal group have a 24-hour cooldown;
an existing pending event also suppresses another event in its group.

An expiring, token-owned `alerts:lock` prevents overlap. Queue and attempt
checkpoints are persisted before sending, and updates require the current lock
token. A crash can consume an attempt without sending; a lost reply can mean
the receiver accepted it even though delivery is recorded as failed/pending.
Exactly-once delivery is not promised. Receiver deduplication is required.
Pending delivery is cancelled when its group has no current active evidence;
stale evidence expires. A retry can retain the earlier snapshot while a newer
rolling-window event in the same group remains active.

The last completed run records attempts, receiver acceptances, failures and
queue-overflow count. Overflow does not evict pending events. Later checks can
discover still-current omitted evidence. An interrupted run may show per-event
checkpoints alongside an older last-completed run. The state key expires after
30 days without worker activity; expired entries are removed during later runs
and omitted from the UI. This is bounded operational history, not an audit log.

To pause delivery, set `PROMPTWATCH_ALERTS_ENABLED=false` and redeploy. Retained
history remains readable; eligible events may resume after re-enabling. To rotate
the receiver URL/secret, pause first, configure both ends and re-enable after
reviewing pending deliveries: pending events use the newly configured endpoint.
Exhausted events are not automatically retried again under the same ID.
