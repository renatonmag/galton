import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const INPUT_PATH = fileURLToPath(new URL("../../../../docs/prompts/comments_extraction.json", import.meta.url));

type ExtractionEntry = {
  comment: string;
  expectedBehaviors: { text: string; type: "do" | "dont"; evidenceQuotes: string[] }[];
};

const data = JSON.parse(readFileSync(INPUT_PATH, "utf-8")) as ExtractionEntry[];

const total = data.reduce((sum, e) => sum + e.expectedBehaviors.length, 0);
const dos = data.reduce((sum, e) => sum + e.expectedBehaviors.filter((b) => b.type === "do").length, 0);
const donts = data.reduce((sum, e) => sum + e.expectedBehaviors.filter((b) => b.type === "dont").length, 0);

console.log(`Entries (comments): ${data.length}`);
console.log(`Total expectedBehaviors: ${total}`);
console.log(`  do: ${dos}`);
console.log(`  dont: ${donts}`);
