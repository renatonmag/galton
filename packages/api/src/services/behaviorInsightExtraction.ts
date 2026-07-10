import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "../db/index.js";
import { behaviorInsightsService } from "./behaviorInsights.js";
import { sessionsService } from "./sessions.js";
import { tradeEntriesForSessions } from "./tradeEntries.js";

const reinforcementSchema = z.object({
  reinforced: z.array(z.object({ insightId: z.string(), evidenceQuote: z.string() })),
  noticedNothing: z.boolean(),
});

const discoverySchema = z.object({
  promoted: z.array(z.object({ emergentId: z.string(), evidenceQuote: z.string() })),
  newEmergent: z.array(z.object({ text: z.string(), evidenceQuote: z.string(), type: z.enum(["do", "dont"]) })),
});

const REINFORCEMENT_SYSTEM_PROMPT = `Você é um analista de comportamento de traders.

Você recebe uma lista de padrões de comportamento já identificados anteriormente para este trader (cada um com um ID) e um novo lote de comentários de trades.

Sua tarefa é verificar, para cada padrão já identificado, se ele aparece novamente nos comentários abaixo — não invente padrões novos, não avalie nada que não esteja na lista fornecida.

Regras:
- Só inclua um padrão em "reinforced" se houver evidência clara dele nos comentários deste lote.
- Para cada padrão reforçado, preencha "evidenceQuote" com uma citação do comentário que evidencia a recorrência.
- Um mesmo padrão não deve aparecer mais de uma vez em "reinforced", mesmo que apareça em múltiplos comentários do lote.
- Se nenhum dos padrões da lista aparecer nos comentários, defina "noticedNothing" como true e deixe "reinforced" vazio.
- Existem dois tipos de padrão: "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido. "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.`;

const DISCOVERY_SYSTEM_PROMPT = `Você é um analista de comportamento de traders.

Você recebe três blocos de informação: (1) padrões já ativos e confirmados para este trader — NÃO os recrie nem os reporte novamente, eles já são tratados por outro processo; (2) candidatos emergentes — padrões observados uma única vez até agora, cada um com um ID; e (3) os comentários do diario de trades de UM único dia.

Sua tarefa, olhando apenas para os comentários deste dia:
- Se um comentário evidenciar um padrão que já está na lista de candidatos emergentes, inclua-o em "promoted", referenciando exatamente o ID fornecido para aquele candidato — nunca invente um ID que não esteja na lista.
- Se um comentário evidenciar um padrão que já está na lista de padrões ativos, ignore-o completamente — não o inclua em "promoted" nem em "newEmergent".
- Se um comentário evidenciar um padrão genuinamente novo (que não corresponde a nenhum padrão ativo nem a nenhum candidato emergente), inclua-o em "newEmergent".

Além disso, classifique cada padrão novo em "type":
- "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido.
- "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.
Não misture os dois — todo item em "newEmergent" deve trazer o "type" correto.

Regras:
- Cada "text" (o próprio padrão) deve ter no máximo 1 frase sucinta e objetiva que descreva o comportamento.
- Um mesmo padrão não deve aparecer mais de uma vez em "promoted" nem em "newEmergent", mesmo que apareça em múltiplos comentários deste dia.
- Para cada item em "promoted" e em "newEmergent", preencha "evidenceQuote" com uma citação de um comentário deste dia que evidencia o padrão.
- Um único dia de comentários nunca é evidência suficiente para confirmar um padrão como definitivo — apenas classifique corretamente; a confirmação entre dias é feita automaticamente pelo sistema.
- Se nenhum padrão novo ou candidato reconhecido aparecer nos comentários deste dia, deixe ambas as listas vazias.

Exemplos de padrões bem formulados:
- Entrar em trades atrasado devido à hesitação, resultando em piores stops e risco-retorno
- Colocar stops muito apertados (no ou abaixo do stop técnico), sendo tirado de trades que depois funcionaram
- Leitura precisa da ação do preço e da estrutura de barras (barras de sinal, barras especiais, reversões de duas barras, setups de reversão à média)
- Emoções guiando as decisões, levando à passividade no momento da entrada
- Não reentrar após ser stopado, perdendo o sinal válido subsequente`;

function serializeComments(comments: string[]): string {
  return comments.map((text, i) => `Comentário ${i + 1}: "${text}"`).join("\n\n");
}

function serializeInsightCandidates(insights: { id: string; text: string }[]): string {
  return insights.map((insight) => `ID ${insight.id}: ${insight.text}`).join("\n");
}

const EMERGENT_HORIZON_SESSIONS = 10;

export function filterEmergentByHorizon(
  candidates: { id: string; text: string; lastSeen: Date }[],
  processedSessions: { id: string; openedAt: Date }[],
  horizon: number = EMERGENT_HORIZON_SESSIONS,
): { inHorizon: { id: string; text: string; lastSeen: Date }[]; evictedIds: string[] } {
  const inHorizon: { id: string; text: string; lastSeen: Date }[] = [];
  const evictedIds: string[] = [];
  for (const candidate of candidates) {
    const sessionsSinceLastSeen = processedSessions.filter((s) => s.openedAt > candidate.lastSeen).length;
    if (sessionsSinceLastSeen >= horizon) {
      evictedIds.push(candidate.id);
    } else {
      inHorizon.push(candidate);
    }
  }
  return { inHorizon, evictedIds };
}

export type BehaviorInsightForwardOutcome =
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
    newEmergent: { text: string; evidenceQuote: string; type: "do" | "dont" }[];
  },
): {
  promoted: { id: string; evidenceQuote: string }[];
  newEmergent: { text: string; evidenceQuote: string; type: "do" | "dont" }[];
} {
  const candidateIds = new Set(emergentCandidates.map((c) => c.id));
  const seenIds = new Set<string>();
  const promoted: { id: string; evidenceQuote: string }[] = [];
  for (const p of llmOutput.promoted) {
    if (!candidateIds.has(p.emergentId) || seenIds.has(p.emergentId)) continue;
    seenIds.add(p.emergentId);
    promoted.push({ id: p.emergentId, evidenceQuote: p.evidenceQuote });
  }

  const seenTexts = new Set<string>();
  const newEmergent: { text: string; evidenceQuote: string; type: "do" | "dont" }[] = [];
  for (const n of llmOutput.newEmergent) {
    const text = n.text.trim();
    if (text.length === 0 || seenTexts.has(text)) continue;
    seenTexts.add(text);
    newEmergent.push({ text, evidenceQuote: n.evidenceQuote, type: n.type });
  }

  return { promoted, newEmergent };
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

  let reinforced: { id: string; evidenceQuote: string }[] = [];
  if (day.reinforceProcessed === null && activeInsights.length > 0 && commented.length > 0) {
    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: reinforcementSchema,
      system: REINFORCEMENT_SYSTEM_PROMPT,
      prompt: `Padrões conhecidos:\n${serializeInsightCandidates(activeInsights)}\n\n${serializeComments(
        commented.map((e) => e.comment as string),
      )}`,
    });
    const seen = new Set<string>();
    for (const r of object.reinforced) {
      if (seen.has(r.insightId)) continue;
      seen.add(r.insightId);
      reinforced.push({ id: r.insightId, evidenceQuote: r.evidenceQuote });
    }
  }

  let promoted: { id: string; evidenceQuote: string }[] = [];
  let newEmergent: { text: string; evidenceQuote: string; type: "do" | "dont" }[] = [];
  if (day.newInsightsProcessed === null && commented.length > 0) {
    const emergentCandidates = await behaviorInsightsService.listEmergent(userId);
    const processedSessions = await sessionsService.listProcessedForDiscovery(userId);
    const { inHorizon } = filterEmergentByHorizon(emergentCandidates, processedSessions);

    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: discoverySchema,
      system: DISCOVERY_SYSTEM_PROMPT,
      prompt: `Padrões ativos (não recriar):\n${serializeInsightCandidates(activeInsights)}\n\nCandidatos emergentes:\n${serializeInsightCandidates(
        inHorizon,
      )}\n\n${serializeComments(commented.map((e) => e.comment as string))}`,
    });
    ({ promoted, newEmergent } = validateDiscoveryOutput(inHorizon, object));
  }

  await db.transaction(async (tx) => {
    if (reinforced.length > 0) {
      await behaviorInsightsService.update(reinforced, tx);
    }
    if (promoted.length > 0) {
      await behaviorInsightsService.promoteEmergent(promoted, tx);
    }
    if (newEmergent.length > 0) {
      await behaviorInsightsService.stageEmergent(userId, newEmergent, tx);
    }
    if (day.reinforceProcessed === null) {
      await sessionsService.stampReinforceProcessed(sessionIds, tx);
    }
    if (day.newInsightsProcessed === null) {
      await sessionsService.stampNewInsightsProcessed(sessionIds, tx);
    }
  });

  return { reinforcedCount: reinforced.length, promotedCount: promoted.length };
}

export const behaviorInsightExtractionService = {
  runForwardPass: async (userId: string): Promise<BehaviorInsightForwardOutcome> => {
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
        console.error(
          `[behaviorInsightExtraction] forward pass failed on session ${day.id} ` +
            `(userId=${userId}, sessionsProcessed=${sessionsProcessed}):`,
          err,
        );
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
    const eligible = await sessionsService.listEligibleForForwardPass(userId);
    return eligible.length;
  },
};
