import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { DateTime } from "luxon";
import { z } from "zod";
import { behaviorInsightsService } from "./behaviorInsights.js";
import { tradeEntriesForUser } from "./tradeEntries.js";
import { userPreferencesService } from "./userPreferences.js";

const WINDOW_DAYS = 2;

const extractionSchema = z.object({
  reinforced: z.array(z.object({ insightId: z.string(), evidenceQuote: z.string() })),
  newInsights: z.array(z.object({ text: z.string(), evidenceQuote: z.string() })),
  noticedNothing: z.boolean(),
});

const SYSTEM_PROMPT = `Você é um analista de comportamento de traders.

Extraia destes comentários os padrões de comportamentos repetitivos do trader.

Não existem comportamentos anteriores registrados para reforçar — portanto, todo padrão identificado deve ser incluído em "newInsights"; o campo "reinforced" deve permanecer vazio.

Regras:
- Cada "text" (o próprio padrão) deve ter no máximo 1 frase sucinta e objetiva que descreva o comportamento.
- Só inclua um padrão se ele for evidenciado por 2 ou mais comentários diferentes — nunca invente um padrão a partir de um único comentário.
- Para cada padrão em "newInsights", preencha "evidenceQuote" com uma citação (ou paráfrase muito próxima) de um dos comentários que evidencia o padrão — serve apenas para fundamentar a extração.
- Se nenhum padrão repetitivo puder ser identificado com confiança, defina "noticedNothing" como true e deixe "newInsights" vazio.
- Seja específico sobre o tipo de situação que evidencia o padrão — evite frases vagas como "seja mais disciplinado".

Exemplos de padrões bem formulados:
- Entrar em trades atrasado devido à hesitação, resultando em piores stops e risco-retorno
- Colocar stops muito apertados (no ou abaixo do stop técnico), sendo tirado de trades que depois funcionaram
- Leitura precisa da ação do preço e da estrutura de barras (barras de sinal, barras especiais, reversões de duas barras, setups de reversão à média)
- Emoções guiando as decisões, levando à passividade no momento da entrada
- Não reentrar após ser stopado, perdendo o sinal válido subsequente`;

function serializeComments(comments: string[]): string {
  return comments.map((text, i) => `Comentário ${i + 1}: "${text}"`).join("\n\n");
}

export type BehaviorInsightExtractionOutcome =
  | { skipped: true; reason: "already_extracted" }
  | { skipped: true; reason: "no_comments" }
  | { skipped: false; created: Awaited<ReturnType<typeof behaviorInsightsService.create>> };

export const behaviorInsightExtractionService = {
  extractForUser: async (userId: string): Promise<BehaviorInsightExtractionOutcome> => {
    if (await behaviorInsightsService.hasAny(userId)) {
      return { skipped: true, reason: "already_extracted" };
    }

    const allEntries = await tradeEntriesForUser(userId);
    const commented = allEntries.filter((e) => e.comment && e.comment.trim() !== "");
    if (commented.length === 0) {
      return { skipped: true, reason: "no_comments" };
    }

    const preferences = await userPreferencesService.get(userId);
    const timezone = preferences?.timezone ?? "UTC";

    const earliestOpenedAtMs = Math.min(...commented.map((e) => e.openedAt.getTime()));
    const windowStart = DateTime.fromMillis(earliestOpenedAtMs).setZone(timezone).startOf("day");
    const windowEnd = windowStart.plus({ days: WINDOW_DAYS });

    const windowEntries = commented.filter((e) => {
      const openedAt = DateTime.fromJSDate(e.openedAt).setZone(timezone);
      return openedAt >= windowStart && openedAt < windowEnd;
    });

    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: extractionSchema,
      system: SYSTEM_PROMPT,
      prompt: serializeComments(windowEntries.map((e) => e.comment as string)),
    });

    if (object.newInsights.length === 0) {
      return { skipped: false, created: [] };
    }

    const created = await behaviorInsightsService.create(
      userId,
      object.newInsights.map((i) => i.text),
    );
    return { skipped: false, created };
  },
};
