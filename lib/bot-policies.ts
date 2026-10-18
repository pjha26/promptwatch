import { botSignatures } from "./botSignatures";

export type BotPolicy = "allow" | "block";

export function parsePolicyUpdate(value: unknown): { botId: string; policy: BotPolicy } {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Invalid policy");
  const { botId, policy } = value as Record<string, unknown>;
  if (
    typeof botId !== "string" ||
    !botSignatures.some((bot) => bot.id === botId) ||
    (policy !== "allow" && policy !== "block")
  ) {
    throw new Error("Invalid policy");
  }
  return { botId, policy };
}

export function readPolicies(values: unknown[]): BotPolicy[] {
  if (values.length !== botSignatures.length) throw new Error("Incomplete policies");
  return values.map((value) => {
    if (value === null) return "allow";
    if (value !== "allow" && value !== "block") throw new Error("Invalid enforced policy");
    return value;
  });
}
