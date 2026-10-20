import { NextResponse } from "next/server";
import { collectCrawlerRequest, createRedis } from "@promptwatch/collector";

export async function middleware(request) {
  const denied = await collectCrawlerRequest(request, {
    store: createRedis,
    publicPathPrefixes: "/,/docs",
    enabled: process.env.PROMPTWATCH_COLLECTOR_ENABLED !== "false",
    verifyVercelIp: process.env.PROMPTWATCH_IP_VERIFICATION === "vercel",
    isVercel: process.env.VERCEL === "1",
  });
  if (denied) return denied;
  const response = NextResponse.next();
  response.headers.set("x-site-middleware", "kept");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)",
  ],
};
