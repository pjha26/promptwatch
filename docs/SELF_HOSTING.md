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

## Verification and operations

Run the tests, type check, lint and production build before updating an installation.
After deployment verify owner login, a second account being denied, an Allow and
Block request, and the dashboard totals. Use a disposable Redis database when
testing outages; do not disable the production database to exercise failures.

The SQL migration and environment configuration are deployment steps. They are
provided in Git, not automatically applied by a GitHub push. If your GitHub is
connected to Vercel, each pushed commit may trigger its configured deployment.
