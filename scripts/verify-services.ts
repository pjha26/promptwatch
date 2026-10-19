import { loadEnvConfig } from "@next/env";
import { createRedis } from "../lib/redis";
import { ownerAccessStatus } from "../lib/owner-access";
import { checkCollectorStorage } from "../lib/tracking-health";

loadEnvConfig(process.cwd());

async function main() {
  const owner = process.env.PROMPTWATCH_OWNER_ID;
  console.log(
    `Owner setting: ${ownerAccessStatus(owner ?? null, owner) === 200 ? "configured UUID (account membership not verified)" : "missing or invalid"}`,
  );
  let failed = ownerAccessStatus(owner ?? null, owner) !== 200;
  try {
    if ((await createRedis().ping()) !== "PONG") throw new Error("No storage reply");
    console.log("Redis read-only connectivity: passed");
  } catch {
    failed = true;
    console.log("Redis connectivity: unavailable; verify private service configuration");
  }
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!base || !key) throw new Error("Auth not configured");
    const response = await fetch(new URL("/auth/v1/health", base), {
      headers: { apikey: key },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error("Auth unreachable");
    console.log("Supabase auth service connectivity: passed (login and RLS not verified)");
  } catch {
    failed = true;
    console.log("Supabase auth service connectivity: unavailable; verify service configuration");
  }
  if (process.argv.includes("--self-check")) {
    try {
      await checkCollectorStorage();
      console.log(
        "Collector script read/write self-check: passed; diagnostic keys cleaned up; traffic counters unchanged",
      );
    } catch {
      failed = true;
      console.log("Collector storage self-check: could not be confirmed");
    }
  }
  if (failed) process.exitCode = 1;
}
void main();
