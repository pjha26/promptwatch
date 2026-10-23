import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildTrafficReport,
  parseTrafficHistory,
  reportDays,
  trafficReportCsv,
  type TrafficHistory,
} from "../lib/traffic-report";

function history(): TrafficHistory {
  return {
    days: reportDays(new Date("2026-10-18T23:30:00Z")),
    bots: [
      {
        id: "allowed",
        name: "AllowedBot",
        hitsByDay: Array(30).fill(2),
        blockedByDay: Array(30).fill(0),
      },
      {
        id: "blocked",
        name: "BlockedBot",
        hitsByDay: Array(30).fill(0),
        blockedByDay: Array(30).fill(3),
      },
    ],
  };
}

test("limited-only traffic reconciles totals, filters, previous weeks and CSV without double counting", () => {
  const input = history();
  input.bots.push({
    id: "limited",
    name: "LimitedBot",
    hitsByDay: Array(30).fill(0),
    blockedByDay: Array(30).fill(0),
    limitedByDay: Array(30).fill(4),
  });
  const parsed = parseTrafficHistory(input);
  assert.deepEqual(parsed.bots[0].limitedByDay, Array(30).fill(0));
  const report = buildTrafficReport(parsed, 7);
  assert.equal(report.limited, 28);
  assert.equal(report.total, 63);
  assert.equal(report.activeCrawlers, 3);
  assert.equal(report.previousTotal, 63);
  assert.equal(
    report.daily.reduce((sum, day) => sum + day.total, 0),
    63,
  );
  assert.equal(
    report.crawlers.reduce((sum, bot) => sum + bot.total, 0),
    63,
  );
  const only = buildTrafficReport(parsed, 7, { outcome: "limited" });
  assert.equal(only.total, 28);
  assert.equal(only.allowed + only.blocked, 0);
  assert.equal(only.previousTotal, 28);
  assert.match(trafficReportCsv(only, "daily"), /"Rate-limited"/);
  assert.match(trafficReportCsv(only, "crawlers"), /"LimitedBot",0,0,28,28/);
  assert.equal(buildTrafficReport(parsed, 7, { outcome: "allowed" }).limited, 0);
  for (const invalid of [null, [], [-1], Array(30).fill("4"), Array(30).fill(-1)]) {
    const value = history();
    Object.assign(value.bots[0], { limitedByDay: invalid });
    assert.throws(() => parseTrafficHistory(value));
  }
});

test("crawler, outcome and custom date filters reconcile totals and CSV scope without mutating history", () => {
  const input = history();
  const before = JSON.stringify(input);
  const report = buildTrafficReport(input, 7, {
    crawlerId: "blocked",
    outcome: "blocked",
    startDate: "2026-10-14",
    endDate: "2026-10-16",
  });
  assert.equal(report.total, 9);
  assert.equal(report.allowed, 0);
  assert.equal(report.crawlers.length, 1);
  assert.equal(report.daily.length, 3);
  assert.equal(report.previousTotal, null);
  assert.match(trafficReportCsv(report, "daily"), /crawler: BlockedBot; outcome: blocked/);
  assert.match(trafficReportCsv(report, "crawlers"), /2026-10-14.*2026-10-16/);
  assert.equal(buildTrafficReport(input, 7, { crawlerId: "blocked", outcome: "allowed" }).total, 0);
  assert.equal(JSON.stringify(input), before);
  for (const filters of [
    { crawlerId: "unknown" },
    { startDate: "2026-10-01" },
    { endDate: "2026-99-99" },
    { startDate: "2026-10-16", endDate: "2026-10-14" },
  ])
    assert.throws(() => buildTrafficReport(input, 7, filters));
  assert.equal(buildTrafficReport(input, 7, { outcome: "blocked" }).previousTotal, 21);
});

test("UTC dates stay contiguous across leap days and year boundaries", () => {
  const leap = reportDays(new Date("2024-03-01T01:00:00+05:30"));
  assert.equal(leap.length, 30);
  assert.equal(leap[29], "2024-02-29");
  assert.equal(leap[0], "2024-01-31");
  const newYear = reportDays(new Date("2026-01-01T00:00:00Z"));
  assert.deepEqual(newYear.slice(-2), ["2025-12-31", "2026-01-01"]);
});

test("7-day totals reconcile with daily rows and include blocked-only crawlers", () => {
  const input = history();
  const original = JSON.stringify(input);
  const report = buildTrafficReport(parseTrafficHistory(input), 7);
  assert.equal(report.daily.length, 7);
  assert.equal(report.daily[0].date, "2026-10-12");
  assert.equal(report.allowed, 14);
  assert.equal(report.blocked, 21);
  assert.equal(report.total, 35);
  assert.equal(report.blockRate, 60);
  assert.equal(report.activeCrawlers, 2);
  assert.equal(report.crawlers[0].id, "blocked");
  assert.equal(
    report.daily.reduce((sum, day) => sum + day.total, 0),
    report.total,
  );
  assert.equal(
    report.crawlers.reduce((sum, bot) => sum + bot.total, 0),
    report.total,
  );
  assert.equal(JSON.stringify(input), original);
});

test("weekly comparison uses exactly the preceding 7 days", () => {
  const input = history();
  input.bots = [input.bots[0]];
  input.bots[0].hitsByDay = [...Array(16).fill(999), ...Array(7).fill(1), ...Array(7).fill(3)];
  const report = buildTrafficReport(input, 7);
  assert.equal(report.total, 21);
  assert.equal(report.previousTotal, 7);
  assert.equal(report.changePercent, 200);
  input.bots[0].hitsByDay.fill(0, 23);
  assert.equal(buildTrafficReport(input, 7).changePercent, -100);
});

test("30-day reports do not manufacture an unavailable earlier period", () => {
  const report = buildTrafficReport(history(), 30);
  assert.equal(report.daily.length, 30);
  assert.equal(report.total, 150);
  assert.equal(report.previousTotal, null);
  assert.equal(report.changePercent, null);
});

test("zero baselines and empty traffic produce finite totals without invented growth", () => {
  const input = history();
  for (const bot of input.bots) {
    bot.hitsByDay.fill(0);
    bot.blockedByDay.fill(0);
  }
  const empty = buildTrafficReport(input, 7);
  assert.equal(empty.total, 0);
  assert.equal(empty.blockRate, 0);
  assert.equal(empty.activeCrawlers, 0);
  assert.equal(empty.previousTotal, 0);
  assert.equal(empty.changePercent, null);
  input.bots[0].hitsByDay[29] = 3;
  assert.equal(buildTrafficReport(input, 7).changePercent, null);
});

test("short windows use their actual dates and do not compare partial periods", () => {
  const input = history();
  input.days = input.days.slice(-3);
  for (const bot of input.bots) {
    bot.hitsByDay = bot.hitsByDay.slice(-3);
    bot.blockedByDay = bot.blockedByDay.slice(-3);
  }
  const report = buildTrafficReport(parseTrafficHistory(input), 7);
  assert.equal(report.daily.length, 3);
  assert.equal(report.total, 15);
  assert.equal(report.previousTotal, null);
});

test("malformed payloads, impossible dates, duplicates and missing dates are rejected", () => {
  for (const value of [null, [], {}, { days: [], bots: [] }, { days: ["2026-02-30"], bots: [] }]) {
    assert.throws(() => parseTrafficHistory(value), /invalid/);
  }
  for (const day of ["2026-10-17", "2026-10-19", "invalid"]) {
    const input = history();
    input.days[29] = day;
    assert.throws(() => parseTrafficHistory(input), /invalid/);
  }
  const duplicate = history();
  duplicate.bots[1].id = duplicate.bots[0].id;
  assert.throws(() => parseTrafficHistory(duplicate), /invalid/);
});

test("untrusted counts must be nonnegative safe integers aligned with dates", () => {
  for (const count of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "3", null]) {
    const input = history();
    (input.bots[0].hitsByDay as unknown[])[0] = count;
    assert.throws(() => parseTrafficHistory(input), /invalid/);
  }
  const missing = history();
  missing.bots[0].blockedByDay.pop();
  assert.throws(() => parseTrafficHistory(missing), /invalid/);
});

test("CSV exports reflect the selected window, scope and reconciled totals", () => {
  const report = buildTrafficReport(history(), 7);
  const daily = trafficReportCsv(report, "daily");
  assert.equal(daily.trimEnd().split("\r\n").length, 8);
  assert.ok(daily.includes('"Deployment-wide","2026-10-18",2,3,0,5\r\n'));
  assert.ok(!daily.includes("2026-10-11"));
  const crawlers = trafficReportCsv(report, "crawlers");
  assert.ok(crawlers.includes('"2026-10-12","2026-10-18","blocked","BlockedBot",0,21,0,21'));
});

test("CSV text quotes multiline fields and neutralizes spreadsheet formulas", () => {
  for (const text of [
    "=1+1",
    "+cmd",
    "-1+2",
    "@SUM(A1)",
    "  =1+1",
    "\tformula",
    "\rformula",
    "\nformula",
    "\uFEFF=1+1",
  ]) {
    const input = history();
    input.bots[0].id = text;
    input.bots[0].name = text;
    const csv = trafficReportCsv(buildTrafficReport(parseTrafficHistory(input), 7), "crawlers");
    assert.ok(csv.includes(`"'${text}"`), JSON.stringify(text));
  }
  const input = history();
  input.bots[0].name = 'Bot, "quoted"\nsecond line';
  assert.ok(
    trafficReportCsv(buildTrafficReport(input, 7), "crawlers").includes(
      '"Bot, ""quoted""\nsecond line"',
    ),
  );
});
