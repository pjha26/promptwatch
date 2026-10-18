# Traffic reports

The first additive milestone from [the implementation plan](IMPLEMENTATION_PLAN.md).
All pre-existing tracked files are unchanged. No new dependencies or schema changes.

## Open the feature

Use the project's existing Supabase and Upstash configuration. The new
`.env.example` lists the required variable names without credentials. Keep your
existing `.env.local`; if you do not have one, copy `.env.example` to `.env.local`
and supply values from your own projects. The Supabase URL and anonymous key
are used by browser auth; never put the Redis token in a `NEXT_PUBLIC_` variable.

From the repository directory:

```powershell
npm run dev
```

Sign in, then open **`/dashboard/reports`** directly, for example
`http://localhost:3000/dashboard/reports`. The sidebar is intentionally unchanged
to honor the preservation boundary. The new page links back to AI Traffic.

Select 7 or 30 days, refresh on demand, and download either the daily breakdown
or crawler totals as CSV. CSV dates and filenames reflect the selected window.

## Data and security contract

- `/api/traffic-report` validates the session before creating a Redis client or
  reading counters. It returns 401 for signed-out requests, 503 for configuration
  or service failures, and `Cache-Control: private, no-store` on all responses.
- The page also checks the session on the server. The existing middleware
  independently protects the dashboard route.
- Uses one logical Redis `MGET` for the existing 420 allowed/blocked daily keys,
  rather than making 420 separate reads. No writes, seeds, or policy changes.
- The report preserves **deployment-wide scope**. Every signed-in account has
  access to the same global data, consistent with existing collection. Session
  protection is not workspace authorization; do not offer isolated customer
  accounts until milestone B is implemented.
- Observed requests = allowed-by-bot-policy + blocked. Allowed is not proof of a
  successful page response. Blocked-only crawlers count as active.
- Dates use UTC and include the current partial day. The 7-day comparison uses
  the preceding 7 calendar days; a zero baseline has no percentage change.
  There is no 30-day comparison because only 30 days of counters are available.
- Missing counters count as zero recorded activity; no ingestion-health history
  exists to distinguish quiet traffic, expired counters, or collection outages.
- User-Agent matching does not verify crawler identity or demonstrate citations.
  Existing signature definitions and historical counts are preserved as-is.
- Validates dates, count arrays, crawler identifiers, and nonnegative integer
  counts before displaying/exporting. CSV text is quoted and formula-prefixed
  content is neutralized. Downloads include no credentials or visitor identifiers.
- Refresh clears the previous report while loading; errors cannot leave stale
  totals looking current. Requests time out in the browser after 15 seconds and
  are cancelled on navigation. Expired sessions show a sign-in link.

## Files

| File                                      | Purpose                                                     |
| ----------------------------------------- | ----------------------------------------------------------- |
| `app/dashboard/reports/page.tsx`          | Server auth check and page metadata                         |
| `app/dashboard/reports/ReportsClient.tsx` | Report UI, periods, refresh/retry and downloads             |
| `app/api/traffic-report/route.ts`         | Authenticated batched counter read                          |
| `lib/traffic-report.ts`                   | UTC dates, response validation, totals, comparisons and CSV |
| `tests/traffic-report.test.ts`            | Boundary and reconciliation checks                          |
| `.env.example`                            | Required configuration names, no credentials                |

## Verification

Verified on 18 October 2026 with Node 22.13.1 and installed Next.js 15.5.19:

- **10 tests passed**: UTC/leap-year boundaries; totals reconciliation; blocked-only
  activity; comparison windows; zero baseline; short histories; malformed dates,
  counts and identities; selected-period CSV; formula and multiline escaping.
- **TypeScript passed** for the whole project. **ESLint passed with zero warnings
  for new code**. Existing `npm run lint` also passes, with six warnings in
  pre-existing files and a deprecation notice for `next lint`.
- **Production build passed.** The sandboxed attempt encountered font DNS and
  build-directory permission restrictions; running with the required build
  access succeeded without changing the existing font setup. Existing Edge
  warnings remain for Supabase/Upstash's use of `process.version`.
- **Built-app auth smoke test passed**: report API returned 401 with `private,
no-store`; signed-out navigation to `/dashboard/reports` redirected to login.
- **Isolated browser UI checks passed**, using simulated history responses and a
  link shim: period switching, rendered totals, blocked-only crawler, actual CSV
  download, mobile controls, refresh failure/retry, empty data, invalid payload,
  and expired auth. No browser runtime errors. Desktop/mobile layout was inspected;
  wide tables scroll within keyboard-focusable regions.
- **Existing tracked-file preservation checked with `git diff --exit-code`.**

Re-run the checks without installing a test framework:

```powershell
npx --no-install tsx --test tests/traffic-report.test.ts
npx --no-install tsc --noEmit --incremental false
npx --no-install eslint app/dashboard/reports app/api/traffic-report lib/traffic-report.ts tests/traffic-report.test.ts --max-warnings 0
npm run lint
npm run build
git diff --exit-code
```

The browser checks used an isolated local harness, not a real authenticated
Supabase/Redis session. Successful live counter reads, provider delivery,
deployed RLS settings, and full signed-in end-to-end behavior were not verified.
Nothing was seeded, migrated, pushed, deployed, or written to production services.

## Next work

Milestone B is the priority: ownership/isolation, existing API protection, and
reliable policy synchronization. Those changes reach existing code and are
documented separately in the plan rather than silently changing it here.
