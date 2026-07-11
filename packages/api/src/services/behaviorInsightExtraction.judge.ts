import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// LLM-as-judge grading for the discovery eval. Runs on a stronger model than
// the gpt-5.4-mini extractor, in Portuguese. Recall and precision are two
// independent passes so a single good item can't be double-counted across
// metrics. Note: gpt-5.4 is a reasoning model and does not honor `temperature`,
// so grading is not fully deterministic run-to-run.

const JUDGE_MODEL = "gpt-5.4";

const verdictSchema = z.object({
  match: z.boolean(),
  reasoning: z.string(),
});

const RECALL_SYSTEM_PROMPT = `Você é um avaliador de extração de padrões de comportamento de traders.

Recebe UM comportamento esperado e a lista de itens que o modelo efetivamente extraiu (textos).

Sua tarefa: decidir se ALGUM item extraído expressa o mesmo comportamento esperado.

Regras de correspondência (seja tolerante a detalhes):
- Corresponde se o item e o comportamento esperado denotam o MESMO comportamento de fundo, mesmo que um dos lados acrescente ou omita uma causa, emoção ou qualificador (ex.: "sai cedo" corresponde a "sai cedo por ansiedade").
- Um único item que descreve dois comportamentos ainda corresponde se expressa claramente o comportamento esperado.
- NÃO conte como correspondência uma mera sobreposição temática ou de assunto — o comportamento em si tem que estar presente.
- Defina "match" como true se houver correspondência, false caso contrário.`;

const PRECISION_SYSTEM_PROMPT = `Você é um avaliador de extração de padrões de comportamento de traders.

Recebe UM item que o modelo extraiu e os comentários do dia dos quais ele deveria ter sido extraído.

Sua tarefa: decidir se o item é um comportamento LEGÍTIMO de trading que está de fato evidenciado nos comentários.

Regras:
- "match" = true se o item descreve um comportamento real do trader que aparece nos comentários (mesmo que com outras palavras).
- "match" = false se o item é vago, genérico, inventado, ou não tem suporte nos comentários.
- Julgue apenas pela evidência nos comentários — não use nenhuma lista externa de padrões.`;

/**
 * Recall judge: does any surfaced item express the given expected behavior?
 * Rubric A — same-underlying-behavior, detail-tolerant. Wrong-bucket surfacing
 * still counts (surfacedTexts should include both promoted and new items).
 */
export async function judgeRecall(expectedText: string, surfacedTexts: string[]): Promise<boolean> {
  if (surfacedTexts.length === 0) return false;
  const { object } = await generateObject({
    model: openai(JUDGE_MODEL),
    schema: verdictSchema,
    system: RECALL_SYSTEM_PROMPT,
    prompt:
      `Comportamento esperado:\n"${expectedText}"\n\n` +
      `Itens extraídos pelo modelo:\n${surfacedTexts.map((t, i) => `${i + 1}. "${t}"`).join("\n")}`,
  });
  return object.match;
}

/**
 * Precision judge: is this surfaced item a legitimate behavior evidenced in the
 * day's comments? Grounded in the comments, NOT in the gold set — so a
 * correct-but-unlabeled extraction counts as precise, not as an error.
 */
export async function judgePrecision(surfacedText: string, comments: string[]): Promise<boolean> {
  const { object } = await generateObject({
    model: openai(JUDGE_MODEL),
    schema: verdictSchema,
    system: PRECISION_SYSTEM_PROMPT,
    prompt:
      `Item extraído:\n"${surfacedText}"\n\n` +
      `Comentários do dia:\n${comments.map((c, i) => `${i + 1}. "${c}"`).join("\n")}`,
  });
  return object.match;
}
