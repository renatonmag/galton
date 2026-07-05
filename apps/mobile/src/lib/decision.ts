import type { TradeEntry } from "@/lib/api";
import { computeDecision } from "@galton/api/lib/successRatio";

export type Result = "open" | "profit" | "loss" | "breakeven";
export type Direction = "buy" | "sell";

export function computeLocalDecision(entries: TradeEntry[]): {
  ratio: number;
  decision: "TRADE" | "NO_TRADE";
} {
  const { ratio, decision } = computeDecision(entries);
  return { ratio: ratio ?? 0, decision };
}
