import type { TradeEntry } from "@/lib/api";

export type Result = "open" | "profit" | "loss" | "breakeven";

export function computeLocalDecision(entries: TradeEntry[]): {
  ratio: number;
  decision: "TRADE" | "NO_TRADE";
} {
  let profit = 0,
    loss = 0,
    breakeven = 0;
  for (const e of entries) {
    if (e.result === "profit") profit++;
    else if (e.result === "loss") loss++;
    else if (e.result === "breakeven") breakeven++;
  }
  const denominator = profit + loss + breakeven;
  if (denominator === 0) return { ratio: 0, decision: "TRADE" };
  const ratio = (profit + breakeven) / denominator;
  return { ratio, decision: ratio >= 0.5 ? "TRADE" : "NO_TRADE" };
}
