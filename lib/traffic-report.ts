export interface TrafficHistory {
  days: string[];
  bots: {
    id: string;
    name: string;
    hitsByDay: number[];
    blockedByDay: number[];
  }[];
}

export type ReportPeriod = 7 | 30;

export function reportDays(now = new Date()): string[] {
  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() - 29 + index);
    return day.toISOString().slice(0, 10);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseTrafficHistory(value: unknown): TrafficHistory {
  const invalid = () => new Error("Traffic data is invalid. Please try again later.");
  if (!isRecord(value) || !Array.isArray(value.days) || !Array.isArray(value.bots)) {
    throw invalid();
  }

  const days: string[] = [];
  if (value.days.length === 0 || value.days.length > 30) throw invalid();
  for (const day of value.days) {
    if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw invalid();
    const timestamp = Date.parse(`${day}T00:00:00.000Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== day) {
      throw invalid();
    }
    if (days.length && timestamp - Date.parse(days[days.length - 1]) !== 86_400_000) {
      throw invalid();
    }
    days.push(day);
  }

  const ids = new Set<string>();
  const bots = value.bots.map((bot) => {
    if (
      !isRecord(bot) ||
      typeof bot.id !== "string" ||
      !bot.id.trim() ||
      ids.has(bot.id) ||
      typeof bot.name !== "string" ||
      !bot.name.trim()
    )
      throw invalid();
    ids.add(bot.id);

    for (const counts of [bot.hitsByDay, bot.blockedByDay]) {
      if (
        !Array.isArray(counts) ||
        counts.length !== days.length ||
        counts.some((count) => !Number.isSafeInteger(count) || (count as number) < 0)
      )
        throw invalid();
    }
    return {
      id: bot.id,
      name: bot.name,
      hitsByDay: [...(bot.hitsByDay as number[])],
      blockedByDay: [...(bot.blockedByDay as number[])],
    };
  });
  return { days, bots };
}

export interface ReportFilters {
  crawlerId?: string;
  outcome?: "all" | "allowed" | "blocked";
  startDate?: string;
  endDate?: string;
}

export function buildTrafficReport(
  history: TrafficHistory,
  period: ReportPeriod,
  filters: ReportFilters = {},
) {
  const periodStart = Math.max(0, history.days.length - period);
  const start = filters.startDate ? history.days.indexOf(filters.startDate) : periodStart;
  const end = filters.endDate ? history.days.indexOf(filters.endDate) + 1 : history.days.length;
  if (start < periodStart || end <= start || end > history.days.length)
    throw new Error("Choose a valid UTC date range within the selected period.");
  if (filters.outcome && !["all", "allowed", "blocked"].includes(filters.outcome))
    throw new Error("Choose a valid outcome.");
  const selected = filters.crawlerId
    ? history.bots.filter((bot) => bot.id === filters.crawlerId)
    : history.bots;
  if (filters.crawlerId && !selected.length)
    throw new Error("Choose a crawler from the current report.");
  const bots = selected.map((bot) => ({
    ...bot,
    hitsByDay: filters.outcome === "blocked" ? bot.hitsByDay.map(() => 0) : bot.hitsByDay,
    blockedByDay: filters.outcome === "allowed" ? bot.blockedByDay.map(() => 0) : bot.blockedByDay,
  }));
  const scope = [
    "Deployment-wide",
    filters.crawlerId ? `crawler: ${selected[0].name}` : null,
    filters.outcome && filters.outcome !== "all" ? `outcome: ${filters.outcome}` : null,
  ]
    .filter(Boolean)
    .join("; ");
  const daily = history.days.slice(start, end).map((date, index) => {
    const allowed = bots.reduce((sum, bot) => sum + bot.hitsByDay[start + index], 0);
    const blocked = bots.reduce((sum, bot) => sum + bot.blockedByDay[start + index], 0);
    return { date, allowed, blocked, total: allowed + blocked };
  });
  const crawlers = bots
    .map((bot) => {
      const allowed = bot.hitsByDay.slice(start, end).reduce((sum, count) => sum + count, 0);
      const blocked = bot.blockedByDay.slice(start, end).reduce((sum, count) => sum + count, 0);
      return { id: bot.id, name: bot.name, allowed, blocked, total: allowed + blocked };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const allowed = daily.reduce((sum, day) => sum + day.allowed, 0);
  const blocked = daily.reduce((sum, day) => sum + day.blocked, 0);
  const total = allowed + blocked;
  const previousTotal =
    period === 7 && start >= 7 && !filters.startDate && !filters.endDate
      ? bots.reduce(
          (sum, bot) =>
            sum +
            bot.hitsByDay.slice(start - 7, start).reduce((subtotal, count) => subtotal + count, 0) +
            bot.blockedByDay
              .slice(start - 7, start)
              .reduce((subtotal, count) => subtotal + count, 0),
          0,
        )
      : null;

  return {
    scope,
    daily,
    crawlers,
    allowed,
    blocked,
    total,
    blockRate: total ? (blocked / total) * 100 : 0,
    activeCrawlers: crawlers.filter((bot) => bot.total > 0).length,
    previousTotal,
    changePercent:
      previousTotal !== null && previousTotal > 0
        ? ((total - previousTotal) / previousTotal) * 100
        : null,
  };
}

export type TrafficReport = ReturnType<typeof buildTrafficReport>;

function csvCell(value: string | number): string {
  if (typeof value === "number") return String(value);
  // Quoting alone does not stop spreadsheet programs from evaluating formulas.
  const safe = /^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/u.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function trafficReportCsv(report: TrafficReport, kind: "daily" | "crawlers"): string {
  const rows: (string | number)[][] =
    kind === "daily"
      ? [
          ["Scope", "Date (UTC)", "Allowed by bot policy", "Blocked", "Observed requests"],
          ...report.daily.map((day) => [
            report.scope,
            day.date,
            day.allowed,
            day.blocked,
            day.total,
          ]),
        ]
      : [
          [
            "Scope",
            "Start date (UTC)",
            "End date (UTC)",
            "Crawler ID",
            "Crawler name",
            "Allowed by bot policy",
            "Blocked",
            "Observed requests",
          ],
          ...report.crawlers.map((bot) => [
            report.scope,
            report.daily[0].date,
            report.daily[report.daily.length - 1].date,
            bot.id,
            bot.name,
            bot.allowed,
            bot.blocked,
            bot.total,
          ]),
        ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
