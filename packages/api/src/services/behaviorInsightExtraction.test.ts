import { describe, expect, it } from "vitest";
import { validateDiscoveryOutput } from "./behaviorInsightExtraction.js";

describe("validateDiscoveryOutput", () => {
  it("keeps a well-formed pattern, trimming its text and carrying quote and type", () => {
    const result = validateDiscoveryOutput({
      patterns: [{ text: "  Vender cedo demais  ", evidenceQuote: "vendi cedo", type: "dont" }],
    });
    expect(result.patterns).toEqual([{ text: "Vender cedo demais", evidenceQuote: "vendi cedo", type: "dont" }]);
  });

  it("drops empty/whitespace-only pattern text", () => {
    const result = validateDiscoveryOutput({
      patterns: [{ text: "   ", evidenceQuote: "...", type: "dont" }],
    });
    expect(result.patterns).toEqual([]);
  });

  it("dedupes identical pattern text within one response, keeping the first quote", () => {
    const result = validateDiscoveryOutput({
      patterns: [
        { text: "Vender cedo demais", evidenceQuote: "a", type: "dont" },
        { text: "Vender cedo demais", evidenceQuote: "b", type: "dont" },
      ],
    });
    expect(result.patterns).toEqual([{ text: "Vender cedo demais", evidenceQuote: "a", type: "dont" }]);
  });

  it("returns an empty list when the LLM output is empty", () => {
    const result = validateDiscoveryOutput({ patterns: [] });
    expect(result).toEqual({ patterns: [] });
  });
});
