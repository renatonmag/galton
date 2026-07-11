import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const INPUT_PATH = fileURLToPath(new URL("../../../../docs/prompts/comments.json", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../../../../docs/prompts/comments_extraction.json", import.meta.url));

const extractionSchema = z.object({
  expectedBehaviors: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["do", "dont"]),
      evidenceQuotes: z.array(z.string()),
    }),
  ),
});

type ExpectedBehavior = z.infer<typeof extractionSchema>["expectedBehaviors"][number];

const SYSTEM_PROMPT = `Este é um comentário de um diário de trade. Extraia deste texto os principais padrões comportamentais.

Um padrão é um pensamento completo, com causa e consequência. Não repita padrões semelhantes.

Classifique cada padrão em "type":
- "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido.
- "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.

Regras:
- Cada "text" deve ter no máximo 1 frase sucinta e objetiva que descreva o comportamento, incluindo causa e consequência.
- Para cada padrão, preencha "evidenceQuotes" com uma ou mais citações literais do comentário que evidenciam o padrão.
- Não repita padrões semelhantes — cada padrão deve ser distinto.`;

type ExtractionEntry = { comment: string; expectedBehaviors: ExpectedBehavior[] };

async function main() {
  const comments = JSON.parse(readFileSync(INPUT_PATH, "utf-8")) as { comment: string }[];
  const results: ExtractionEntry[] = [];

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i].comment;
    try {
      const { object } = await generateObject({
        model: openai("gpt-5.4-mini"),
        schema: extractionSchema,
        system: SYSTEM_PROMPT,
        prompt: comment,
      });
      results.push({ comment, expectedBehaviors: object.expectedBehaviors });
      console.log(`[${i + 1}/${comments.length}] ${object.expectedBehaviors.length} behaviors`);
    } catch (err) {
      console.error(`[${i + 1}/${comments.length}] failed:`, err instanceof Error ? err.message : err);
      results.push({ comment, expectedBehaviors: [] });
    }
    // Persist after each iteration so partial progress survives interruption.
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  }

  console.log(`Done. Wrote ${results.length} entries to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
