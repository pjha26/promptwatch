# Install the collector on another Next.js site

The local preview package in `packages/collector` reuses the existing collector
source. It adds no ingestion API, public token, workspace layer or separate
policy store. One dedicated Redis database still represents **one tracked site**.

1. Complete the dashboard's owner setup and legacy-access migration described
   in `SELF_HOSTING.md`. Keep those deployment checks separate from installation.
2. Run `npm run collector:pack` in this repository. Inspect the generated archive
   under `artifacts/`, then install that `.tgz` in the Next.js 15 website you own.
   The [package README](../packages/collector/README.md) contains the full snippet.
   It is a local archive, not a published npm package.
3. Merge `collectCrawlerRequest` into the site's existing middleware. A returned
   denial response should be returned; on `null`, continue the site's own auth,
   redirects and middleware. Do not replace existing access checks with this helper.
4. Configure server-only Redis credentials in both the collector site and its
   dashboard. For a new tracked website, use a fresh dedicated database; do not
   silently mix it with an earlier website's history. Existing databases and
   counters are not migrated or deleted by the package.
5. On the **separate dashboard**, set `PROMPTWATCH_COLLECTOR_ENABLED=false` and
   redeploy. On the **tracked site**, keep collection enabled. If Promptwatch
   itself is the tracked website, keep its existing default `true` instead.
6. Match the public-path allowlist on both deployments. Start with `/`; add only
   publicly visible paths without private identifiers. Query values are omitted.
7. Optionally follow `CRAWLER_IDENTITY.md` for direct-Vercel IP observations.
   Use the same database for the dashboard's official-feed refresh and collector
   reads. No vendor feed is downloaded during a public request.
8. In a disposable deployment, confirm one allowed and one blocked matched
   request, path totals, health evidence and the site's existing auth behavior.
   Synthetic User-Agent requests test collection, not real crawler identity.

## Verify a package change

`npm run test:collector` compiles and packs the actual archive, checks that only
compiled collector files and package documentation are shipped, installs it into
a separate temporary Next.js project, builds its Edge middleware, and tests it.
The fixture checks human requests, Allow/Block, retained site middleware, omitted
queries, excluded API paths, and read/count failures with controlled storage
replies. It uses no Supabase or production Redis services. It installs public
dependencies with lifecycle scripts disabled and removes only its own temporary
directory after verifying the cleanup path. Network access is needed for install.

GitHub checks run that consumer fixture in addition to the existing real-Redis
Lua tests and full application checks. The archive is private preview version
`0.1.0`; rebuild and reinstall it when upgrading the source. Keep the resulting
tarball or a stable private artifact path available to your deployment builder;
do not commit credentials or rely on a developer-only absolute file path during
remote deployment. Registry publishing and automatic version distribution are
not included in this release.

This fixture is a separate local Next.js application, not a deployed customer
site. Live owner login, production latency and actual second-site requests remain
pending service reactivation and the operator's deployment configuration.
