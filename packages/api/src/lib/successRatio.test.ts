import { describe, expect, it } from "vitest";
import { computeDecision, computeRatio, decisionFromRatio, ratioFromCounts } from "./successRatio.js";

describe("computeRatio", () => {
  it("returns null when there are no closed entries", () => {
    expect(computeRatio([])).toBeNull();
    expect(computeRatio([{ result: "open" }])).toBeNull();
  });

  it("counts breakeven as a win alongside profit", () => {
    expect(
      computeRatio([{ result: "profit" }, { result: "breakeven" }, { result: "loss" }]),
    ).toBeCloseTo(2 / 3);
  });

  it("returns 1 when every closed entry is a win", () => {
    expect(computeRatio([{ result: "profit" }, { result: "profit" }])).toBe(1);
  });

  it("returns 0 when every closed entry is a loss", () => {
    expect(computeRatio([{ result: "loss" }, { result: "loss" }])).toBe(0);
  });

  it("ignores open entries mixed in with closed ones", () => {
    expect(computeRatio([{ result: "open" }, { result: "profit" }])).toBe(1);
  });
});

describe("decisionFromRatio", () => {
  it("defaults to TRADE when the ratio is null (no data)", () => {
    expect(decisionFromRatio(null)).toBe("TRADE");
  });

  it("is TRADE exactly at the 0.5 threshold", () => {
    expect(decisionFromRatio(0.5)).toBe("TRADE");
  });

  it("is NO_TRADE just below the threshold", () => {
    expect(decisionFromRatio(0.49)).toBe("NO_TRADE");
  });
});

describe("computeDecision", () => {
  it("combines ratio and decision from a single entry list", () => {
    expect(
      computeDecision([{ result: "profit" }, { result: "loss" }, { result: "loss" }]),
    ).toEqual({ ratio: 1 / 3, decision: "NO_TRADE" });
  });

  it("defaults to TRADE with a null ratio when there is no history", () => {
    expect(computeDecision([])).toEqual({ ratio: null, decision: "TRADE" });
  });
});

describe("ratioFromCounts", () => {
  it("matches computeRatio for the same tallies", () => {
    const counts = { profit: 3, loss: 1, breakeven: 1 };
    expect(ratioFromCounts(counts)).toBeCloseTo(4 / 5);
  });

  it("returns null for a zero denominator", () => {
    expect(ratioFromCounts({ profit: 0, loss: 0, breakeven: 0 })).toBeNull();
  });
});
