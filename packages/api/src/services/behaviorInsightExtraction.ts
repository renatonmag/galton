import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "../db/index.js";
import { behaviorInsightsService } from "./behaviorInsights.js";
import { sessionsService } from "./sessions.js";
import { tradeEntriesForSessions } from "./tradeEntries.js";

const WINDOW_SIZE = 2;

const extractionSchema = z.object({
  reinforced: z.array(z.object({ insightId: z.string(), evidenceQuote: z.string() })),
  newInsights: z.array(z.object({ text: z.string(), evidenceQuote: z.string() })),
  noticedNothing: z.boolean(),
});

const reinforcementSchema = z.object({
  reinforced: z.array(z.object({ insightId: z.string(), evidenceQuote: z.string() })),
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

const REINFORCEMENT_SYSTEM_PROMPT = `Você é um analista de comportamento de traders.

Você recebe uma lista de padrões de comportamento já identificados anteriormente para este trader (cada um com um ID) e um novo lote de comentários de trades.

Sua tarefa é verificar, para cada padrão já identificado, se ele aparece novamente nos comentários abaixo — não invente padrões novos, não avalie nada que não esteja na lista fornecida.

Regras:
- Só inclua um padrão em "reinforced" se houver evidência clara dele nos comentários deste lote.
- Para cada padrão reforçado, preencha "evidenceQuote" com uma citação (ou paráfrase muito próxima) do comentário que evidencia a recorrência.
- Um mesmo padrão não deve aparecer mais de uma vez em "reinforced", mesmo que apareça em múltiplos comentários do lote.
- Se nenhum dos padrões da lista aparecer nos comentários, defina "noticedNothing" como true e deixe "reinforced" vazio.`;

function serializeComments(comments: string[]): string {
  return comments.map((text, i) => `Comentário ${i + 1}: "${text}"`).join("\n\n");
}

function serializeInsightCandidates(insights: { id: string; text: string }[]): string {
  return insights.map((insight) => `ID ${insight.id}: ${insight.text}`).join("\n");
}

export function chunkIntoWindows<T>(items: T[], size: number): T[][] {
  const windows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    windows.push(items.slice(i, i + size));
  }
  return windows;
}

export type BehaviorInsightExtractionOutcome =
  | { skipped: true; reason: "already_extracted" }
  | { skipped: true; reason: "no_comments" }
  | { skipped: false; created: Awaited<ReturnType<typeof behaviorInsightsService.create>> };

export type BehaviorInsightReinforcementOutcome =
  | { skipped: true; reason: "not_bootstrapped" }
  | { skipped: true; reason: "nothing_pending" }
  | {
      skipped: false;
      windowsProcessed: number;
      sessionsProcessed: number;
      reinforcementsApplied: number;
      error?: { message: string; windowIndex: number };
    };

type EligibleSession = Awaited<ReturnType<typeof sessionsService.listEligibleForReinforcement>>[number];

async function reinforceWindow(
  userId: string,
  windowSessions: EligibleSession[],
): Promise<{ sessionsCount: number; reinforcedCount: number }> {
  const sessionIds = windowSessions.map((s) => s.id);
  const activeInsights = await behaviorInsightsService.listActive(userId);
  const entries = await tradeEntriesForSessions(sessionIds);
  const commented = entries.filter((e) => e.comment && e.comment.trim() !== "");

  let reinforcedIds: string[] = [];
  if (activeInsights.length > 0 && commented.length > 0) {
    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: reinforcementSchema,
      system: REINFORCEMENT_SYSTEM_PROMPT,
      prompt: `Padrões conhecidos:\n${serializeInsightCandidates(activeInsights)}\n\n${serializeComments(
        commented.map((e) => e.comment as string),
      )}`,
    });
    reinforcedIds = [...new Set(object.reinforced.map((r) => r.insightId))];
  }

  await db.transaction(async (tx) => {
    if (reinforcedIds.length > 0) {
      await behaviorInsightsService.update(reinforcedIds, tx);
    }
    await sessionsService.stampReinforceProcessed(sessionIds, tx);
  });

  return { sessionsCount: sessionIds.length, reinforcedCount: reinforcedIds.length };
}

export const behaviorInsightExtractionService = {
  extractForUser: async (userId: string): Promise<BehaviorInsightExtractionOutcome> => {
    if (await behaviorInsightsService.hasAny(userId)) {
      return { skipped: true, reason: "already_extracted" };
    }

    const eligible = await sessionsService.listEligibleForNewInsights(userId);
    if (eligible.length === 0) {
      return { skipped: true, reason: "no_comments" };
    }

    const sessionIds = eligible.slice(0, WINDOW_SIZE).map((s) => s.id);
    const entries = await tradeEntriesForSessions(sessionIds);
    const commented = entries.filter((e) => e.comment && e.comment.trim() !== "");

    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: extractionSchema,
      system: SYSTEM_PROMPT,
      prompt: serializeComments(commented.map((e) => e.comment as string)),
    });

    const created =
      object.newInsights.length > 0
        ? await behaviorInsightsService.create(
            userId,
            object.newInsights.map((i) => i.text),
          )
        : [];

    await sessionsService.stampBootstrapProcessed(sessionIds);
    return { skipped: false, created };
  },

  reinforceForUser: async (userId: string): Promise<BehaviorInsightReinforcementOutcome> => {
    if (!(await behaviorInsightsService.hasAny(userId))) {
      return { skipped: true, reason: "not_bootstrapped" };
    }

    const eligible = await sessionsService.listEligibleForReinforcement(userId);
    if (eligible.length === 0) {
      return { skipped: true, reason: "nothing_pending" };
    }

    const windows = chunkIntoWindows(eligible, WINDOW_SIZE);
    let windowsProcessed = 0;
    let sessionsProcessed = 0;
    let reinforcementsApplied = 0;

    for (let i = 0; i < windows.length; i++) {
      try {
        const result = await reinforceWindow(userId, windows[i]);
        windowsProcessed += 1;
        sessionsProcessed += result.sessionsCount;
        reinforcementsApplied += result.reinforcedCount;
      } catch (err) {
        return {
          skipped: false,
          windowsProcessed,
          sessionsProcessed,
          reinforcementsApplied,
          error: { message: err instanceof Error ? err.message : String(err), windowIndex: i },
        };
      }
    }

    return { skipped: false, windowsProcessed, sessionsProcessed, reinforcementsApplied };
  },

  pendingCount: async (userId: string): Promise<number> => {
    if (!(await behaviorInsightsService.hasAny(userId))) return 0;
    const eligible = await sessionsService.listEligibleForReinforcement(userId);
    return eligible.length;
  },
};
