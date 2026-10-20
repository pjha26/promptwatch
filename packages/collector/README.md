# @promptwatch/collector (local preview)

A private, locally packed collector for one Next.js 15 site per Promptwatch
deployment. It uses the same source as Promptwatch's own middleware. Node 22 is
required. This package has not been published to an npm registry.

Build the archive from the Promptwatch repository:

```sh
npm ci
npm run collector:pack
```

Install `artifacts/promptwatch-collector-0.1.0.tgz` in the website you control:

```sh
npm install /absolute/path/to/promptwatch-collector-0.1.0.tgz
```

Add this to the site's existing `middleware.ts`, keeping its own session/auth
handling after the collector returns `null`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { collectCrawlerRequest, createRedis } from "@promptwatch/collector";

export async function middleware(request: NextRequest) {
  const denied = await collectCrawlerRequest(request, {
    store: createRedis,
    enabled: process.env.PROMPTWATCH_COLLECTOR_ENABLED !== "false",
    publicPathPrefixes: process.env.PROMPTWATCH_PUBLIC_PATH_PREFIXES ?? "/",
    verifyVercelIp: process.env.PROMPTWATCH_IP_VERIFICATION === "vercel",
    isVercel: process.env.VERCEL === "1",
  });
  if (denied) return denied;
  // Continue your existing middleware/session logic here.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)",
  ],
};
```

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` **only on the server**.
Use one dedicated database shared by this site and its owner dashboard. The
dashboard needs Supabase owner setup; the collector does not. Do not put tokens
in public environment variables, browser code or request headers.

If the dashboard is a separate deployment, set its
`PROMPTWATCH_COLLECTOR_ENABLED=false` so it does not mix its own traffic with the
tracked site. Keep the collector enabled on the tracked site. Use matching
public-path prefixes in both deployments; the default records the homepage only.

IP observations are disabled by default. Enable only on a directly hosted Vercel
site after refreshing official feeds through the owner dashboard. Feeds expire
after 24 hours and require manual refresh in this preview. Do not imitate
`VERCEL=1` on another hosting provider.

The helper returns a 403 for a confirmed Block and `null` otherwise. Unreadable
policies fail open; counter failures never cancel a confirmed Block. It excludes
administration/auth routes and leaves your own middleware responsible for them.
Collection has the same retention/path bounds and two-second Redis lifetime
budget as Promptwatch. A permitted request is not evidence of page delivery or
an AI citation. This is crawler management, not a firewall.

Locally packed installation is checked against a separate Next.js fixture using
controlled storage replies. Actual Lua scripts run in disposable Redis CI tests.
Real second-site deployment and Vercel ingress remain operator verification steps.
Other Next.js major versions and hosting adapters are not claimed as verified.
