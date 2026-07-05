export type Result = "open" | "profit" | "loss" | "breakeven";

export const TRADE_THRESHOLD = 0.5;

export function computeCounts(entries: { result: Result }[]): {
  profit: number;
  loss: number;
  breakeven: number;
} {
  let profit = 0;
  let loss = 0;
  let breakeven = 0;
  for (const e of entries) {
    if (e.result === "profit") profit++;
    else if (e.result === "loss") loss++;
    else if (e.result === "breakeven") breakeven++;
  }
  return { profit, loss, breakeven };
}

export function ratioFromCounts(counts: {
  profit: number;
  loss: number;
  breakeven: number;
}): number | null {
  const denominator = counts.profit + counts.loss + counts.breakeven;
  if (denominator === 0) return null;
  return (counts.profit + counts.breakeven) / denominator;
}

export function computeRatio(entries: { result: Result }[]): number | null {
  return ratioFromCounts(computeCounts(entries));
}

export function decisionFromRatio(ratio: number | null): "TRADE" | "NO_TRADE" {
  if (ratio === null) return "TRADE";
  return ratio >= TRADE_THRESHOLD ? "TRADE" : "NO_TRADE";
}

export function computeDecision(entries: { result: Result }[]): {
  ratio: number | null;
  decision: "TRADE" | "NO_TRADE";
} {
  const ratio = computeRatio(entries);
  return { ratio, decision: decisionFromRatio(ratio) };
}
