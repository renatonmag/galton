import type { Stats, TradeEntry } from "@/lib/api";
import {
  computeDecision,
  decisionFromRatio,
  ratioFromCounts,
} from "@galton/api/lib/successRatio";

export type Result = "open" | "profit" | "loss" | "breakeven";
export type Direction = "buy" | "sell";

export function computeLocalDecision(entries: TradeEntry[]): {
  ratio: number;
  decision: "TRADE" | "NO_TRADE";
} {
  const { ratio, decision } = computeDecision(entries);
  return { ratio: ratio ?? 0, decision };
}

// Mirrors the server's scope: the decision is computed over all of the
// user's closed entries across every session, not just one session.
export function pendingDecisionFromStats(stats: Stats | undefined): {
  ratio: number;
  decision: "TRADE" | "NO_TRADE";
} {
  const ratio = stats
    ? ratioFromCounts({ profit: stats.profit, loss: stats.loss, breakeven: stats.breakeven })
    : null;
  return { ratio: ratio ?? 0, decision: decisionFromRatio(ratio) };
}
