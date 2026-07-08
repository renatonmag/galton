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

const discoverySchema = z.object({
  promoted: z.array(z.object({ emergentId: z.string(), evidenceQuote: z.string() })),
  newEmergent: z.array(z.object({ text: z.string(), evidenceQuote: z.string() })),
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

const DISCOVERY_SYSTEM_PROMPT = `Você é um analista de comportamento de traders.

Você recebe três blocos de informação: (1) padrões já ativos e confirmados para este trader — NÃO os recrie nem os reporte novamente, eles já são tratados por outro processo; (2) candidatos emergentes — padrões observados uma única vez até agora, cada um com um ID; e (3) os comentários de trades de UM único dia.

Sua tarefa, olhando apenas para os comentários deste dia:
- Se um comentário evidenciar um padrão que já está na lista de candidatos emergentes, inclua-o em "promoted", referenciando exatamente o ID fornecido para aquele candidato — nunca invente um ID que não esteja na lista.
- Se um comentário evidenciar um padrão que já está na lista de padrões ativos, ignore-o completamente — não o inclua em "promoted" nem em "newEmergent".
- Se um comentário evidenciar um padrão genuinamente novo (que não corresponde a nenhum padrão ativo nem a nenhum candidato emergente), inclua-o em "newEmergent".

Regras:
- Um mesmo padrão não deve aparecer mais de uma vez em "promoted" nem em "newEmergent", mesmo que apareça em múltiplos comentários deste dia.
- Para cada item em "promoted" e em "newEmergent", preencha "evidenceQuote" com uma citação (ou paráfrase muito próxima) de um comentário deste dia que evidencia o padrão.
- Um único dia de comentários nunca é evidência suficiente para confirmar um padrão como definitivo — apenas classifique corretamente; a confirmação entre dias é feita automaticamente pelo sistema.
- Se nenhum padrão novo ou candidato reconhecido aparecer nos comentários deste dia, deixe ambas as listas vazias.`;

function serializeComments(comments: string[]): string {
  return comments.map((text, i) => `Comentário ${i + 1}: "${text}"`).join("\n\n");
}

function serializeInsightCandidates(insights: { id: string; text: string }[]): string {
  return insights.map((insight) => `ID ${insight.id}: ${insight.text}`).join("\n");
}

export type BehaviorInsightExtractionOutcome =
  | { skipped: true; reason: "already_extracted" }
  | { skipped: true; reason: "no_comments" }
  | { skipped: false; created: Awaited<ReturnType<typeof behaviorInsightsService.create>> };

export type BehaviorInsightForwardOutcome =
  | { skipped: true; reason: "not_bootstrapped" }
  | { skipped: true; reason: "nothing_pending" }
  | {
      skipped: false;
      sessionsProcessed: number;
      reinforcementsApplied: number;
      patternsPromoted: number;
      remaining: number;
      error?: { message: string; sessionId: string };
    };

export function validateDiscoveryOutput(
  emergentCandidates: { id: string; text: string }[],
  llmOutput: {
    promoted: { emergentId: string; evidenceQuote: string }[];
    newEmergent: { text: string; evidenceQuote: string }[];
  },
): { promotedIds: string[]; newEmergentTexts: string[] } {
  const candidateIds = new Set(emergentCandidates.map((c) => c.id));
  const promotedIds = [...new Set(llmOutput.promoted.map((p) => p.emergentId).filter((id) => candidateIds.has(id)))];
  const newEmergentTexts = [
    ...new Set(llmOutput.newEmergent.map((n) => n.text.trim()).filter((text) => text.length > 0)),
  ];
  return { promotedIds, newEmergentTexts };
}

type EligibleDay = Awaited<ReturnType<typeof sessionsService.listEligibleForForwardPass>>[number];

async function processDay(
  userId: string,
  day: EligibleDay,
): Promise<{ reinforcedCount: number; promotedCount: number }> {
  const sessionIds = [day.id];
  const entries = await tradeEntriesForSessions(sessionIds);
  const commented = entries.filter((e) => e.comment && e.comment.trim() !== "");
  const activeInsights = await behaviorInsightsService.listActive(userId);

  let reinforcedIds: string[] = [];
  if (day.reinforceProcessed === null && activeInsights.length > 0 && commented.length > 0) {
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

  let promotedIds: string[] = [];
  let newEmergentTexts: string[] = [];
  if (day.newInsightsProcessed === null && commented.length > 0) {
    const emergentCandidates = await behaviorInsightsService.listEmergent(userId);
    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: discoverySchema,
      system: DISCOVERY_SYSTEM_PROMPT,
      prompt: `Padrões ativos (não recriar):\n${serializeInsightCandidates(activeInsights)}\n\nCandidatos emergentes:\n${serializeInsightCandidates(
        emergentCandidates,
      )}\n\n${serializeComments(commented.map((e) => e.comment as string))}`,
    });
    ({ promotedIds, newEmergentTexts } = validateDiscoveryOutput(emergentCandidates, object));
  }

  await db.transaction(async (tx) => {
    if (reinforcedIds.length > 0) {
      await behaviorInsightsService.update(reinforcedIds, tx);
    }
    if (promotedIds.length > 0) {
      await behaviorInsightsService.promoteEmergent(promotedIds, tx);
    }
    if (newEmergentTexts.length > 0) {
      await behaviorInsightsService.stageEmergent(userId, newEmergentTexts, tx);
    }
    if (day.reinforceProcessed === null) {
      await sessionsService.stampReinforceProcessed(sessionIds, tx);
    }
    if (day.newInsightsProcessed === null) {
      await sessionsService.stampNewInsightsProcessed(sessionIds, tx);
    }
  });

  return { reinforcedCount: reinforcedIds.length, promotedCount: promotedIds.length };
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

  reinforceForUser: async (userId: string): Promise<BehaviorInsightForwardOutcome> => {
    if (!(await behaviorInsightsService.hasActive(userId))) {
      return { skipped: true, reason: "not_bootstrapped" };
    }

    const eligible = await sessionsService.listEligibleForForwardPass(userId);
    if (eligible.length === 0) {
      return { skipped: true, reason: "nothing_pending" };
    }

    let sessionsProcessed = 0;
    let reinforcementsApplied = 0;
    let patternsPromoted = 0;

    for (const day of eligible) {
      try {
        const result = await processDay(userId, day);
        sessionsProcessed += 1;
        reinforcementsApplied += result.reinforcedCount;
        patternsPromoted += result.promotedCount;
      } catch (err) {
        return {
          skipped: false,
          sessionsProcessed,
          reinforcementsApplied,
          patternsPromoted,
          remaining: eligible.length - sessionsProcessed,
          error: { message: err instanceof Error ? err.message : String(err), sessionId: day.id },
        };
      }
    }

    return { skipped: false, sessionsProcessed, reinforcementsApplied, patternsPromoted, remaining: 0 };
  },

  pendingCount: async (userId: string): Promise<number> => {
    if (!(await behaviorInsightsService.hasAny(userId))) return 0;
    const eligible = await sessionsService.listEligibleForReinforcement(userId);
    return eligible.length;
  },
};
