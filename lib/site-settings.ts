export const SITE_SETTINGS_KEY = "settings:site";

export interface SiteSettings {
  name: string;
  url: string;
  revision: string;
  updatedAt: string;
}

export function parseSiteInput(value: unknown): Pick<SiteSettings, "name" | "url"> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Provide a site name and URL.");
  const row = value as Record<string, unknown>;
  if (typeof row.name !== "string" || typeof row.url !== "string")
    throw new Error("Provide a site name and URL.");
  const name = row.name.trim();
  if (!name || name.length > 100 || /[\u0000-\u001f\u007f]/u.test(name))
    throw new Error("Site name must contain 1–100 characters without control characters.");
  if (!row.url.trim() || row.url.length > 2048)
    throw new Error("Provide an HTTP or HTTPS site origin, such as https://example.com.");
  let url: URL;
  try {
    url = new URL(row.url.trim());
  } catch {
    throw new Error("Provide a valid HTTP or HTTPS site URL.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Use the site origin only, without credentials, paths, queries or fragments.");
  return { name, url: url.origin };
}

export function parseSiteSettings(value: unknown): SiteSettings | null {
  if (value === null) return null;
  const input = parseSiteInput(value);
  const row = value as Record<string, unknown>;
  if (
    row.name !== input.name ||
    row.url !== input.url ||
    typeof row.revision !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.revision) ||
    typeof row.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(row.updatedAt)) ||
    new Date(row.updatedAt).toISOString() !== row.updatedAt
  )
    throw new Error("Stored site settings are invalid.");
  return { ...input, revision: row.revision, updatedAt: row.updatedAt };
}

export async function saveSiteSettings(
  store: { set(key: string, value: SiteSettings): Promise<unknown> },
  value: unknown,
): Promise<SiteSettings> {
  const settings = {
    ...parseSiteInput(value),
    revision: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  if ((await store.set(SITE_SETTINGS_KEY, settings)) !== "OK")
    throw new Error("Site settings write was not confirmed.");
  return settings;
}
