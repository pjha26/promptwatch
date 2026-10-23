import {
  parseThrottleHistory,
  parseThrottleRule,
  THROTTLE_BOTS,
  type ThrottleRule,
} from "./throttle-rules";

export interface ThrottleSnapshot {
  collectorEnabled: boolean;
  checkedAt: string;
  date: string;
  rows: {
    botId: string;
    rule: ThrottleRule | null;
    samples: { minute: number; count: number }[];
    wouldLimitToday: number;
  }[];
  history: ReturnType<typeof parseThrottleHistory>;
}

export function parseMinuteSamples(value: unknown, nowMinute: number) {
  if (value === null) return [];
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 60)
    throw new Error("Invalid minute samples");
  const samples = Object.entries(value).map(([slot, raw]) => {
    const row = (typeof raw === "string" ? JSON.parse(raw) : raw) as {
      minute: number;
      count: number;
    };
    if (
      !/^(?:[0-9]|[1-5][0-9])$/.test(slot) ||
      !row ||
      !Number.isSafeInteger(row.minute) ||
      row.minute < 0 ||
      row.minute % 60 !== Number(slot) ||
      !Number.isSafeInteger(row.count) ||
      row.count < 1 ||
      row.minute > nowMinute
    )
      throw new Error("Invalid minute sample");
    return { minute: row.minute, count: row.count };
  });
  return samples.filter((row) => row.minute > nowMinute - 60).sort((a, b) => a.minute - b.minute);
}

export function parseThrottleSnapshot(value: unknown): ThrottleSnapshot {
  const row = value as ThrottleSnapshot;
  if (
    !row ||
    typeof row.collectorEnabled !== "boolean" ||
    typeof row.checkedAt !== "string" ||
    !Number.isFinite(Date.parse(row.checkedAt)) ||
    new Date(row.checkedAt).toISOString() !== row.checkedAt ||
    typeof row.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
    !Number.isFinite(Date.parse(row.date)) ||
    new Date(row.date).toISOString().slice(0, 10) !== row.date ||
    !Array.isArray(row.rows) ||
    row.rows.length !== THROTTLE_BOTS.length
  )
    throw new Error("Invalid throttle snapshot");
  const nowMinute = Math.floor(Date.parse(row.checkedAt) / 60_000);
  return {
    collectorEnabled: row.collectorEnabled,
    checkedAt: row.checkedAt,
    date: row.date,
    history: parseThrottleHistory(row.history),
    rows: row.rows.map((bot, index) => {
      if (
        !bot ||
        bot.botId !== THROTTLE_BOTS[index].id ||
        !Array.isArray(bot.samples) ||
        !Number.isSafeInteger(bot.wouldLimitToday) ||
        bot.wouldLimitToday < 0
      )
        throw new Error("Invalid throttle row");
      const slots: Record<string, unknown> = {};
      for (const sample of bot.samples) {
        const slot = sample?.minute % 60;
        if (slots[slot] !== undefined) throw new Error("Duplicate minute sample");
        slots[slot] = sample;
      }
      const samples = parseMinuteSamples(slots, nowMinute);
      if (samples.length !== bot.samples.length) throw new Error("Stale minute samples");
      return {
        botId: bot.botId,
        rule: parseThrottleRule(bot.rule),
        samples,
        wouldLimitToday: bot.wouldLimitToday,
      };
    }),
  };
}
