# Optional crawler IP observations

This version supports websites receiving requests **directly through Vercel**.
It supplements User-Agent matches with published IP-range membership. It does
not change Allow/Block enforcement, verify citations, or prove page delivery.

## Enable after owner setup

1. Keep the existing owner and Redis setup from `SELF_HOSTING.md`.
2. Open `/dashboard/identity` and refresh each supported crawler's official feed.
   Refresh is owner-only, same-origin JSON, and stores public IP ranges in Redis.
   It does not generate test visits or store visitor addresses.
3. On the tracked Vercel deployment, set `PROMPTWATCH_IP_VERIFICATION=vercel`,
   then redeploy. Leave it `disabled` elsewhere. The runtime must also have
   Vercel's platform-provided `VERCEL=1`; do not simulate that variable on another
   host. Configure the dashboard similarly if it is a separate Vercel deployment.
4. Refresh supported feeds at least daily. Each expires after **24 hours**.
   Refresh is manual in this release; no scheduler or continuous verification
   guarantee is included. Old valid data is not replaced with an error response.
5. Check the observation counts separately from the existing traffic totals.
   Only requests counted after opt-in contribute; old traffic is not backfilled.

Only `x-vercel-forwarded-for` is read, and only after explicit opt-in in a Vercel
runtime. Missing/invalid addresses and comma-separated chains are unavailable.
There is no fallback to client-supplied `x-forwarded-for` or `x-real-ip`.
Do not enable this mode behind another proxy without revisiting the trust model.
See [Vercel's request-header documentation](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).

## Meaning of each observation

| Status | Meaning |
| --- | --- |
| Vendor range match (`verified`) | The claimed bot's trusted client IP matched a range in its fresh official feed |
| `unverified` | The IP did not match that fresh feed; this alone does not prove impersonation |
| `unavailable` | No trusted IP, missing/expired/malformed feed, storage failure, or an unsupported runtime |
| `unsupported` | This version has no configured official feed for that crawler |

Supported feeds are GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, and
Perplexity-User. Sources are the JSON links in the
[OpenAI crawler reference](https://developers.openai.com/api/docs/bots) and
[Perplexity crawler reference](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).
Other configured crawlers retain their existing traffic and policy behavior.
Robots-only controls are excluded. A range match is evidence of network origin
for the claimed agent, not cryptographic authentication of a particular process.

## Bounds, privacy and failures

Feed downloads use fixed HTTPS endpoints, a five-second total deadline, a 256KiB
response cap and at most 2,048 validated IPv4/IPv6 ranges per feed. Arbitrary
redirects are rejected. The one accepted redirect is the officially linked
Perplexity `.com` URL to its exact corresponding `www.perplexity.ai` JSON path;
further redirects are rejected. This transition was checked on 21 October 2026.
Malformed or unexpectedly broad ranges fail the entire refresh.

`identity:feed:{botId}` stores the validated feed and fetch time, expiring after
24 hours. Requests never fetch vendor websites: the cached feed read is started
with the policy read and uses the same Redis client's two-second budget. The
SDK batches those two reads; an eligible request uses three Redis commands in
two HTTP requests, followed by no automatic retries. Disabled mode retains its
existing two-command collection path.

`identity:{UTC date}` hashes contain only `{botId}:{status}` counts, bounded to
the configured HTTP bots and four statuses, with 30-day retention. They are
updated in the existing counting script, which adds no write round trip. The
dashboard reads 30 daily hashes plus five feed values in one pipeline. **Raw
client IPs are used only in memory and are never saved, returned or logged.**

Identity counts include both allowed and blocked requests and can have collection
gaps. Identity-store corruption does not cancel ordinary counting. A verification
failure becomes unavailable; it cannot override a confirmed Block or activate a
new rule. Traffic reports, Action Centre rules and old counter names are retained.

## Verification

Tests cover IPv4/IPv6 boundaries, malformed addresses, proxy-header rejection,
feed freshness/schema/size/redirects, status-only writes, and transport batching.
The disposable Redis CI check exercises the actual Lua script with and without
paths/identity fields, plus a corrupt optional identity key. An isolated browser
checks disabled/misconfigured modes, feed refresh failures, stale-data removal,
UTC and mobile cards. Public vendor feed downloads were checked without writing
the user's Redis. Actual Vercel header delivery, live owner access and real bot
traffic remain deployment verification steps.
