# Automatic crawler-feed refresh

Promptwatch can refresh the five supported official IP feeds through a protected
Vercel cron endpoint. The feature is **disabled by default**. It does not change
crawler policies, generate visits, send notifications, or store visitor IPs.
The current owner UUID and service reactivation remain deployment prerequisites.

## Enable on the owner dashboard deployment

1. Complete owner/services setup from `SELF_HOSTING.md`. Use the intended owner's
   Supabase UUID; no account is inferred automatically.
2. Generate a random private secret locally, for example:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Store it as the server-only production variable `CRON_SECRET` in Vercel.
   Accepted values are 32–256 base64url/hex characters. Never commit or paste the
   value into this chat, browser settings or a public environment variable.
3. Set `PROMPTWATCH_AUTO_REFRESH_FEEDS=true` on **the dashboard deployment**, which
   shares the tracked site's dedicated Redis database. Keep it false elsewhere
   so multiple deployments do not each schedule the same job. This switch is
   independent of `PROMPTWATCH_IP_VERIFICATION` on the collector.
4. Deploy the included `vercel.json`. It schedules `/api/cron/identity-feeds` once
   daily at **03:00 UTC (08:30 Asia/Calcutta)**. This default supports Hobby plans.
   Vercel's Hobby delivery may occur anywhere within that UTC hour, so it is not
   an exact-time promise. See [Vercel scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
5. Verify the deployed cron entry and its logs in Vercel. Check **Automatic feed
   refresh** on `/dashboard/identity`, reload observations after a run, and check
   each feed's actual fetch time and freshness. A configured switch is not proof
   that the scheduler delivered a request.

Vercel supplies `Authorization: Bearer <CRON_SECRET>` to the endpoint. Enabled
jobs reject missing/incorrect authentication and incomplete owner configuration
before touching Redis or downloading feeds. Disabled jobs return only a harmless
`disabled` status without doing work. Dashboard APIs still require owner login;
the cron secret grants only this feed-refresh capability. See
[Vercel cron authentication](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).

## Freshness and recovery

Feeds retain the existing **24-hour** freshness/expiry rule. A daily schedule can
leave a gap if a run is late, missed, or fails. Stale or missing feeds become
`unavailable`; they are never extended into a false verified result. Manual
per-feed refresh remains available in the owner dashboard.

On a plan supporting more frequent schedules, an operator can change the same
entry to `0 */6 * * *` and redeploy. Do not deploy a sub-daily expression on Hobby,
where Vercel rejects it. More frequent runs reduce gaps but do not guarantee
delivery or vendor availability. This release does not add a retry scheduler.

The job refreshes feeds independently using the existing bounded downloader.
One vendor failure does not cancel successful feeds. A failed or unconfirmed
store write is counted as failed even if its reply was lost; check the actual
feed freshness before retrying. Valid old data is not replaced by an error.
Outcomes are `success`, `partial`, or `failed`, with one result per configured
feed. Partial/failed completion returns 503 so deployment logs show the problem.
Vercel does not automatically retry a failed cron invocation; use the manual
refresh or an authenticated rerun after resolving the issue.

`identity:refresh:lock` is a 120-second lease. Concurrent runs return `busy`
(202) without downloading. Completion/release scripts compare the unique lease
token, so a late invocation cannot clear a replacement lease or overwrite its
recorded completion. A killed invocation's lease expires automatically. Repeated
completed invocations simply re-read feeds; they do not increment visitor counts.
The route's execution budget is 60 seconds. Completion creates a fresh Redis
client because downloads can outlast a client's two-second lifetime budget.

`identity:refresh:last` stores only the last confirmed completion and five feed
outcomes for 30 days. It is not a full run history or an uptime monitor. Failures
before storage confirmation may leave the previous completion visible; check
its timestamp and deployment logs. Errors expose no cron secret or vendor stack.

## Verification limits

Local tests cover authorization, disabled/setup guards, busy leases, independent
feed failures, partial outcomes, uncertain completion and strict result parsing.
Browser fixtures cover status modes, UTC/mobile layout, failed reads and stale
status removal. Disposable Redis CI tests check the actual lease/completion Lua,
TTL, token mismatch and replacement-lease protection. All use isolated data;
no production refresh, live scheduler activation, or owner configuration was
performed automatically. Verify those after reactivation.
