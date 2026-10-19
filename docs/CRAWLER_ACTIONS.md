# Recommendations from recorded crawler activity

Action Centre and the Overview queue now read owner-only `/api/actions`, using
the same Redis counters as traffic reports. Seeded monitoring events and browser
local storage are no longer used by these views. Existing seed files and old
browser decisions are retained but are not imported into the real queue.

## Rules

Analysis covers the latest seven completed UTC days; today is excluded because
it is partial. Observed requests include both allowed and blocked requests.
Only configured HTTP crawler identities are included, not robots-only controls.

| Recommendation | Trigger | Priority |
| --- | --- | --- |
| Traffic increase | At least 20 requests and twice the preceding seven days, with at least 10 requests in that baseline | Medium; high at four times the baseline and at least 100 requests |
| Access review | At least 10 blocked requests across at least two days | Medium; high at 100 blocked requests |
| Recent discovery | First positive counter in retained history falls in the current window, with at least five requests | Low |

Each card includes counts, observation dates and a link to traffic or policies.
These are deterministic review prompts, not automatic policy changes. Historical
blocks do not establish the current rule. Missing or expired counters may hide
earlier activity; recent discovery does not mean a crawler never visited before.
User-Agent matches do not prove crawler identity, delivered pages, or citations.
Zero recorded requests are not proof of collector uptime.

## Saved review decisions

The owner can mark a recommendation reviewed, dismiss it, or reopen it. Decisions
are written to Redis and shown only after confirmation; they survive browser
reloads and are shared across the owner's browsers. A failed or ambiguous save
requires refresh before another change, so the UI does not claim an unconfirmed
decision was saved. Read failures show an error instead of an empty queue.

Decisions are stored in `actions:decisions:{event date}` hashes with 60-day expiry
after the latest write to that hash. Traffic-increase and access-review IDs use
the analysis end date, so a new daily window creates a new review opportunity.
Discovery IDs use the first observed date. Only currently triggered actions are
listed, including in the reviewed/dismissed filter; this is not a durable audit
archive. Existing crawler counters and access policies are unchanged by reviews.

## Verification limits

Local coverage includes rule thresholds, complete-day windows, identity and
response validation, signed-out API denial, and browser flows with simulated
responses for filters, reviews across reload, reopen, save ambiguity, and errors.
Live owner login and actual Redis script execution remain deployment checks
until services are active and the intended owner UUID has been configured.
