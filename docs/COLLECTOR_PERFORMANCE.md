# Collector performance and outage checks

Run `npm run test:transport` for the actual Redis HTTP client against a temporary
localhost service. It overrides Redis configuration only in that test process,
uses a dummy token, restores configuration on exit, and never contacts Upstash.
The same test is included in `npm test` and GitHub checks.

This checks the production client's timeout and retry behavior, with simulated
service responses. Actual Lua behavior is checked separately by `test:redis`
against the disposable Redis service in CI. Neither test verifies the live site.

## Controlled local measurements

Measured on 19 October 2026, Node 22 on Windows, 20 measured requests per healthy
case after five warm-up requests, with a simulated 25ms delay per Redis command:

| Collector case | p50 | p95 | Observed behavior |
| --- | --- | --- | --- |
| Allow | 62.5ms | 77.4ms | One policy GET and one counting EVAL |
| Block | 62.8ms | 76.7ms | Same two commands; confirmed block retained |
| Policy read never replies | 2025.5ms, one sample | Not measured | One read attempted; throws for middleware's existing fail-open handling |
| Counter write never replies | 2005.3ms, one sample | Not measured | Confirmed block retained; uncertain count not replayed |

These are controlled transport-fixture results, not production benchmarks or
promised response times. They exclude authentication, public routing, rendering,
real Redis execution, geographic distance, and production concurrency. The test
prints fresh timings each run. Healthy timings are diagnostic, not a CI speed
threshold. Timeout assertions allow scheduling tolerance around the real budget.

## Current budgets and costs

The Redis client has a **two-second lifetime budget**, shared across the policy
read, count write, and any best-effort failure marker made with that client.
Automatic HTTP retries are disabled. A hung operation does not gain another
two-second budget when the collector attempts its failure marker.

A matched request normally uses one GET and one EVAL, with path and health
updates inside that script. A replied counter error can add one EVAL for a
failure marker. No Redis request is made by the collector for unmatched agents
or excluded administration routes. Lua's internal operations may have separate
provider billing implications; HTTP command counts are not a price estimate.

When [optional IP observations](CRAWLER_IDENTITY.md) are enabled for a supported
crawler with a trusted IP, one cached-feed GET is batched with the policy GET.
That means three Redis commands in two HTTP requests, still with the shared
two-second budget. Identity counts are included in the existing EVAL. The
transport test checks this batching; the baseline fixture timings above apply
to disabled mode.

A confirmed policy still governs the response if analytics fails. An unreadable
policy fails open. A lost write reply means the count may already have been
recorded; automatically replaying it could double-count, so no retry is made.
Failure markers are best-effort and may also be unavailable during an outage.

The two-second budget can add around two seconds to a detected crawler request
during an outage. It does not bound all website middleware or page work. There
is no new cache, background queue, circuit breaker or rate limiter in this change.

## Live verification before release

Once services and the intended owner are ready:

1. Use the read-only service check in `SELF_HOSTING.md`, then verify owner login
   and denial for an unrelated account. Confirm the legacy migration separately.
2. In a disposable deployment/database, send controlled matched requests with
   Allow and Block rules. Reconcile counts, paths, history and health evidence.
   These requests test matching; they do not prove a real crawler's identity.
3. Compare unmatched, allowed and blocked response timings in the intended
   deployment region. Record sample count, concurrency, p50/p95, errors and date.
4. Exercise storage failure only in that disposable deployment. Check site
   availability, fail-open behavior and retention of confirmed blocks during
   counter failures. Never disable production Redis to run these checks.
5. Agree a production latency target from these results before changing the
   timeout or introducing caching. Recheck policy freshness and counting behavior
   with any optimization; a faster but stale Block rule is not an improvement.

Production latency measurements, trusted client-IP configuration, identity
verification and a second-site installation remain pending. Identity verification
must use the actual hosting proxy's trusted IP source; an arbitrary forwarded
header cannot establish crawler identity. Alerts and throttling follow that work.
