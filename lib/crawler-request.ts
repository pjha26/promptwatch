import { detectBot } from "./botSignatures";
import { applyCrawlerPolicy, type CrawlerStore } from "./crawler-policy";
import { publicAnalyticsPath } from "./public-paths";
import { verifyCrawlerIdentity } from "./crawler-identity";

export interface CollectorOptions {
  store: () => CrawlerStore;
  publicPathPrefixes?: string;
  enabled?: boolean;
  verifyVercelIp?: boolean;
  isVercel?: boolean;
  throttlingEnabled?: boolean;
}

/** Return a policy-denial response, or null so the site's own middleware can continue. */
export async function collectCrawlerRequest(
  request: Request,
  options: CollectorOptions,
): Promise<Response | null> {
  if (options.enabled === false) return null;
  const pathname = new URL(request.url).pathname;
  if (
    /^\/(?:api|dashboard|auth|login|signup|admin|account|private|internal|settings|reset-password|verify|_next)(?:\/|$)/i.test(
      pathname,
    )
  )
    return null;
  const bot = detectBot(request.headers.get("user-agent") ?? "");
  if (!bot) return null;
  try {
    const at = new Date().toISOString();
    const store = options.store();
    const identity = options.verifyVercelIp
      ? verifyCrawlerIdentity(store, bot.id, request.headers, options.isVercel === true)
      : undefined;
    const blocked = await applyCrawlerPolicy(
      store,
      bot.id,
      at.slice(0, 10),
      publicAnalyticsPath(pathname, options.publicPathPrefixes ?? "/"),
      at,
      identity,
      options.throttlingEnabled === true,
    );
    return blocked
      ? Response.json({ error: "Access denied by site policy" }, { status: 403 })
      : null;
  } catch {
    // Fail open only when policy cannot be read; keep the website available.
    console.error("[crawler] Policy unavailable; request allowed without a confirmed policy.");
    return null;
  }
}
