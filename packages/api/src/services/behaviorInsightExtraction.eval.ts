import "dotenv/config";

import { describe, expect, it } from "vitest";
import { runDiscovery } from "./behaviorInsightExtraction.js";
import { discoveryEvalCases, type DiscoveryEvalCase } from "./behaviorInsightExtraction.eval.fixtures.js";
import { judgePrecision, judgeRecall } from "./behaviorInsightExtraction.judge.js";

const RECALL_GATE = 0.8;

type BehaviorRow = { text: string; matched: boolean };
type ItemRow = { text: string; legit: boolean };
type CaseResult = {
  id: string;
  behaviors: BehaviorRow[];
  items: ItemRow[];
};

/** Surfaced texts = promoted candidate texts (resolved via the case's candidates) + newEmergent texts. */
function surfacedTexts(
  output: Awaited<ReturnType<typeof runDiscovery>>,
  emergentCandidates: DiscoveryEvalCase["emergentCandidates"],
): string[] {
  const byId = new Map(emergentCandidates.map((c) => [c.id, c.text]));
  const promoted = output.promoted.map((p) => byId.get(p.emergentId)).filter((t): t is string => Boolean(t));
  const newTexts = output.newEmergent.map((n) => n.text);
  return [...promoted, ...newTexts];
}

async function gradeCase(evalCase: DiscoveryEvalCase): Promise<CaseResult> {
  const output = await runDiscovery({
    comments: evalCase.comments,
    activePatterns: evalCase.activePatterns,
    emergentCandidates: evalCase.emergentCandidates,
  });
  const surfaced = surfacedTexts(output, evalCase.emergentCandidates);

  const behaviors = await Promise.all(
    evalCase.expectedBehaviors.map(async (b) => ({ text: b.text, matched: await judgeRecall(b.text, surfaced) })),
  );
  const items = await Promise.all(
    surfaced.map(async (text) => ({ text, legit: await judgePrecision(text, evalCase.comments) })),
  );

  return { id: evalCase.id, behaviors, items };
}

function printReport(results: CaseResult[]): { recall: number; precision: number } {
  let matched = 0;
  let expectedTotal = 0;
  let legit = 0;
  let surfacedTotal = 0;

  const lines: string[] = ["", "=== Discovery extraction eval ==="];
  for (const r of results) {
    lines.push(`\n[${r.id}]`);
    lines.push("  Recall (expected behaviors):");
    for (const b of r.behaviors) {
      expectedTotal += 1;
      if (b.matched) matched += 1;
      lines.push(`    ${b.matched ? "✓" : "✗ MISSED"}  ${b.text}`);
    }
    lines.push("  Precision (surfaced items):");
    if (r.items.length === 0) lines.push("    (nothing surfaced)");
    for (const item of r.items) {
      surfacedTotal += 1;
      if (item.legit) legit += 1;
      lines.push(`    ${item.legit ? "✓" : "✗ JUNK"}  ${item.text}`);
    }
  }

  const recall = expectedTotal === 0 ? 1 : matched / expectedTotal;
  const precision = surfacedTotal === 0 ? 1 : legit / surfacedTotal;
  lines.push("\n--- Aggregate ---");
  lines.push(`  Recall:    ${(recall * 100).toFixed(1)}%  (${matched}/${expectedTotal})   [gate ≥ ${RECALL_GATE * 100}%]`);
  lines.push(`  Precision: ${(precision * 100).toFixed(1)}%  (${legit}/${surfacedTotal})   [reported, ungated]`);
  // process.stdout.write, not console.log — Vitest intercepts and buffers console output.
  process.stdout.write(lines.join("\n") + "\n");

  return { recall, precision };
}

describe("behaviorInsightExtraction discovery eval", () => {
  it(
    "extracts genuine behaviors exhaustively (aggregate recall ≥ gate)",
    { timeout: 120_000 },
    async () => {
      const results = await Promise.all(discoveryEvalCases.map(gradeCase));
      const { recall } = printReport(results);
      expect(recall).toBeGreaterThanOrEqual(RECALL_GATE);
    },
  );
});
