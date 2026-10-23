import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createRedis } from "@/lib/redis";
import { collectCrawlerRequest } from "@/lib/crawler-request";

export async function middleware(request: NextRequest) {
  const denied = await collectCrawlerRequest(request, {
    store: createRedis,
    enabled: process.env.PROMPTWATCH_COLLECTOR_ENABLED !== "false",
    publicPathPrefixes: process.env.PROMPTWATCH_PUBLIC_PATH_PREFIXES ?? "/",
    verifyVercelIp: process.env.PROMPTWATCH_IP_VERIFICATION === "vercel",
    isVercel: process.env.VERCEL === "1",
    throttlingEnabled: process.env.PROMPTWATCH_THROTTLING_ENABLED === "true",
  });
  if (denied) return denied;
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)",
  ],
};
