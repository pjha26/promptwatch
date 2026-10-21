import { createHash, timingSafeEqual } from "node:crypto";

export function cronSecretConfigured(secret?: string): boolean {
  return !!secret && /^[A-Za-z0-9_-]{32,256}$/.test(secret);
}

export function cronAccessStatus(authorization: string | null, secret?: string): 200 | 401 | 503 {
  if (!cronSecretConfigured(secret)) return 503;
  if (!authorization) return 401;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`)) ? 200 : 401;
}
