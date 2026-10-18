import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { detectBot } from "@/lib/botSignatures";
import { createRedis } from "@/lib/redis";
import { applyCrawlerPolicy } from "@/lib/crawler-policy";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const administrative = /^\/(?:api|dashboard|auth|login|signup)(?:\/|$)/.test(pathname);
  const bot = administrative ? null : detectBot(request.headers.get("user-agent") ?? "");
  if (bot) {
    try {
      const blocked = await applyCrawlerPolicy(
        createRedis(),
        bot.id,
        new Date().toISOString().slice(0, 10),
      );
      if (blocked)
        return NextResponse.json({ error: "Access denied by site policy" }, { status: 403 });
    } catch {
      // Fail open only when policy cannot be read; keep the website available.
      console.error("[crawler] Policy unavailable; request allowed without a confirmed policy.");
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)",
  ],
};
