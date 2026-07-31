import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  await redis.set("test-key", "hello from promptwatch");
  const value = await redis.get("test-key");
  return NextResponse.json({ value });
}
