import { NextResponse, type NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { updateSession } from '@/utils/supabase/middleware'
import { detectBot } from '@/lib/botSignatures'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function middleware(request: NextRequest) {
  // --- Bot detection & Redis logging (fire-and-forget, never blocks) ---
  try {
    const userAgent = request.headers.get('user-agent') ?? ''
    const bot = detectBot(userAgent)

    if (bot) {
      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
      const key = `bot:${bot.id}:${today}`
      const count = await redis.incr(key)

      // Set a 30-day TTL only when the key is first created,
      // so subsequent hits don't reset the expiry window.
      if (count === 1) {
        await redis.expire(key, 60 * 60 * 24 * 30) // 30 days
      }
    }
  } catch (error) {
    // Redis failure must never break the site — log and continue.
    console.error('[middleware] Redis bot-logging error:', error)
  }

  // --- Existing Supabase auth session handling ---
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - common static file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)',
  ],
}
