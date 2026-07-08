import { describe, expect, it } from "vitest";
import { filterEmergentByHorizon, validateDiscoveryOutput } from "./behaviorInsightExtraction.js";

describe("validateDiscoveryOutput", () => {
  const candidates = [
    { id: "e1", text: "Entrar atrasado por hesitação" },
    { id: "e2", text: "Stop muito apertado" },
  ];

  it("keeps promoted ids that match a known emergent candidate, carrying the quote", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [{ emergentId: "e1", evidenceQuote: "hesitei de novo" }],
      newEmergent: [],
    });
    expect(result.promoted).toEqual([{ id: "e1", evidenceQuote: "hesitei de novo" }]);
  });

  it("drops promoted ids that don't match any candidate (hallucinated id)", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [{ emergentId: "does-not-exist", evidenceQuote: "..." }],
      newEmergent: [],
    });
    expect(result.promoted).toEqual([]);
  });

  it("dedupes repeated valid promoted ids, keeping the first quote", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [
        { emergentId: "e1", evidenceQuote: "a" },
        { emergentId: "e1", evidenceQuote: "b" },
      ],
      newEmergent: [],
    });
    expect(result.promoted).toEqual([{ id: "e1", evidenceQuote: "a" }]);
  });

  it("drops empty/whitespace-only newEmergent text", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [],
      newEmergent: [{ text: "   ", evidenceQuote: "..." }],
    });
    expect(result.newEmergent).toEqual([]);
  });

  it("dedupes identical newEmergent text within one response, keeping the first quote", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [],
      newEmergent: [
        { text: "Vender cedo demais", evidenceQuote: "a" },
        { text: "Vender cedo demais", evidenceQuote: "b" },
      ],
    });
    expect(result.newEmergent).toEqual([{ text: "Vender cedo demais", evidenceQuote: "a" }]);
  });

  it("returns empty arrays when the LLM output is empty", () => {
    const result = validateDiscoveryOutput(candidates, { promoted: [], newEmergent: [] });
    expect(result).toEqual({ promoted: [], newEmergent: [] });
  });
});

describe("filterEmergentByHorizon", () => {
  const day = (n: number) => new Date(`2026-01-${String(n).padStart(2, "0")}T12:00:00Z`);
  const processedSessions = Array.from({ length: 12 }, (_, i) => ({ id: `s${i + 1}`, openedAt: day(i + 1) }));

  it("keeps a candidate well within the horizon (just created)", () => {
    const candidates = [{ id: "e1", text: "x", lastSeen: day(12) }];
    const result = filterEmergentByHorizon(candidates, processedSessions, 10);
    expect(result.inHorizon.map((c) => c.id)).toEqual(["e1"]);
    expect(result.evictedIds).toEqual([]);
  });

  it("keeps a candidate exactly at the boundary (9 sessions since lastSeen, N=10)", () => {
    const candidates = [{ id: "e1", text: "x", lastSeen: day(3) }];
    const result = filterEmergentByHorizon(candidates, processedSessions, 10);
    expect(result.inHorizon.map((c) => c.id)).toEqual(["e1"]);
    expect(result.evictedIds).toEqual([]);
  });

  it("evicts a candidate exactly past the boundary (10 sessions since lastSeen, N=10)", () => {
    const candidates = [{ id: "e1", text: "x", lastSeen: day(2) }];
    const result = filterEmergentByHorizon(candidates, processedSessions, 10);
    expect(result.inHorizon).toEqual([]);
    expect(result.evictedIds).toEqual(["e1"]);
  });

  it("evicts a candidate well past the horizon", () => {
    const candidates = [{ id: "e1", text: "x", lastSeen: day(1) }];
    const result = filterEmergentByHorizon(candidates, processedSessions, 10);
    expect(result.evictedIds).toEqual(["e1"]);
  });

  it("partitions a mixed list into in-horizon and evicted independently", () => {
    const candidates = [
      { id: "keep", text: "x", lastSeen: day(12) },
      { id: "evict", text: "y", lastSeen: day(1) },
    ];
    const result = filterEmergentByHorizon(candidates, processedSessions, 10);
    expect(result.inHorizon.map((c) => c.id)).toEqual(["keep"]);
    expect(result.evictedIds).toEqual(["evict"]);
  });

  it("keeps everything when processedSessions is empty (no history yet)", () => {
    const candidates = [{ id: "e1", text: "x", lastSeen: day(1) }];
    const result = filterEmergentByHorizon(candidates, [], 10);
    expect(result.inHorizon.map((c) => c.id)).toEqual(["e1"]);
    expect(result.evictedIds).toEqual([]);
  });
});
