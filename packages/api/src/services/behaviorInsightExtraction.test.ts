import { describe, expect, it } from "vitest";
import { validateDiscoveryOutput } from "./behaviorInsightExtraction.js";

describe("validateDiscoveryOutput", () => {
  const candidates = [
    { id: "e1", text: "Entrar atrasado por hesitação" },
    { id: "e2", text: "Stop muito apertado" },
  ];

  it("keeps promoted ids that match a known emergent candidate", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [{ emergentId: "e1", evidenceQuote: "..." }],
      newEmergent: [],
    });
    expect(result.promotedIds).toEqual(["e1"]);
  });

  it("drops promoted ids that don't match any candidate (hallucinated id)", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [{ emergentId: "does-not-exist", evidenceQuote: "..." }],
      newEmergent: [],
    });
    expect(result.promotedIds).toEqual([]);
  });

  it("dedupes repeated valid promoted ids", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [
        { emergentId: "e1", evidenceQuote: "a" },
        { emergentId: "e1", evidenceQuote: "b" },
      ],
      newEmergent: [],
    });
    expect(result.promotedIds).toEqual(["e1"]);
  });

  it("drops empty/whitespace-only newEmergent text", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [],
      newEmergent: [{ text: "   ", evidenceQuote: "..." }],
    });
    expect(result.newEmergentTexts).toEqual([]);
  });

  it("dedupes identical newEmergent text within one response", () => {
    const result = validateDiscoveryOutput(candidates, {
      promoted: [],
      newEmergent: [
        { text: "Vender cedo demais", evidenceQuote: "a" },
        { text: "Vender cedo demais", evidenceQuote: "b" },
      ],
    });
    expect(result.newEmergentTexts).toEqual(["Vender cedo demais"]);
  });

  it("returns empty arrays when the LLM output is empty", () => {
    const result = validateDiscoveryOutput(candidates, { promoted: [], newEmergent: [] });
    expect(result).toEqual({ promotedIds: [], newEmergentTexts: [] });
  });
});
