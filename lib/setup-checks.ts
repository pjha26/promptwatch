import { parseAlertStatus } from "./alert-status";
import { parseHealthResponse } from "./collector-health";
import { parseIdentityReport } from "./crawler-identity";
import { parseAutomaticRefresh } from "./identity-refresh";
import { parseSiteSettings } from "./site-settings";

function check<T>(result: PromiseSettledResult<unknown>, parse: (value: unknown) => T) {
  try {
    if (result.status === "rejected") throw new Error("Check unavailable");
    return { data: parse(result.value), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export function parseSetupChecks(
  results: [
    PromiseSettledResult<unknown>,
    PromiseSettledResult<unknown>,
    PromiseSettledResult<unknown>,
    PromiseSettledResult<unknown>,
  ],
) {
  return {
    site: check(results[0], (value) =>
      parseSiteSettings((value as { site?: unknown } | null)?.site),
    ),
    health: check(results[1], parseHealthResponse),
    alerts: check(results[2], parseAlertStatus),
    identity: check(results[3], (value) => ({
      ...parseIdentityReport(value),
      automaticRefresh: parseAutomaticRefresh(
        (value as { automaticRefresh?: unknown }).automaticRefresh,
      ),
    })),
  };
}
