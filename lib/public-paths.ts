const PRIVATE_SEGMENTS = new Set([
  "api",
  "dashboard",
  "auth",
  "login",
  "signup",
  "admin",
  "account",
  "private",
  "internal",
  "settings",
  "reset",
  "reset-password",
  "verify",
  "callback",
  "_next",
]);

export const DAILY_PATH_LIMIT = 200;

export function publicAnalyticsPath(value: string, allowedPrefixes = "/"): string | null {
  let path: string;
  try {
    path = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  } catch {
    return null;
  }
  if (
    !path.startsWith("/") ||
    path.length > 256 ||
    /[\\%?#\u0000-\u001f\u007f@]/.test(path) ||
    path.includes("//")
  )
    return null;
  const segments = path.split("/");
  if (
    segments.some(
      (segment) =>
        PRIVATE_SEGMENTS.has(segment.toLowerCase()) ||
        segment === "." ||
        segment === ".." ||
        /^[a-f0-9-]{32,}$/i.test(segment) ||
        /^[\w-]{16,}\.[\w-]+\.[\w-]+$/.test(segment),
    )
  )
    return null;
  const prefixes = allowedPrefixes
    .split(",")
    .map((prefix) => prefix.trim().replace(/\/$/, "") || "/");
  return prefixes.some(
    (prefix) =>
      prefix.startsWith("/") &&
      (path === prefix || (prefix !== "/" && path.startsWith(prefix + "/"))),
  )
    ? path
    : null;
}

export function aggregatePublicPages(
  rows: unknown[],
  allowedPrefixes = "/",
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    if (row === null) continue;
    if (typeof row !== "object" || Array.isArray(row) || Object.keys(row).length > DAILY_PATH_LIMIT)
      throw new Error("Invalid page counters");
    for (const [path, count] of Object.entries(row)) {
      if (publicAnalyticsPath(path, allowedPrefixes) !== path) continue;
      if (
        !Number.isSafeInteger(count) ||
        count < 0 ||
        !Number.isSafeInteger((totals[path] ?? 0) + count)
      )
        throw new Error("Invalid page count");
      if (count > 0) totals[path] = (totals[path] ?? 0) + count;
    }
  }
  return totals;
}
