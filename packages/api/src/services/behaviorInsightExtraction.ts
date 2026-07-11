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

Você recebe uma lista de padrões de comportamento já identificados anteriormente para este trader (cada um com um ID) e um novo comentário de um único trade.

Sua tarefa é verificar, para cada padrão já identificado, se ele aparece novamente neste comentário — não invente padrões novos, não avalie nada que não esteja na lista fornecida.

Regras:
- Só inclua um padrão em "reinforced" se houver evidência clara dele neste comentário.
- Para cada padrão reforçado, preencha "evidenceQuote" com uma citação do comentário que evidencia a recorrência.
- Um mesmo padrão não deve aparecer mais de uma vez em "reinforced", mesmo que seja mencionado mais de uma vez neste comentário.
- Se nenhum dos padrões da lista aparecer neste comentário, defina "noticedNothing" como true e deixe "reinforced" vazio.
- Existem dois tipos de padrão: "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido. "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.`;

const DISCOVERY_SYSTEM_PROMPT = `Este é um comentário de um diário de trade. Extraia deste texto os principais padrões comportamentais.

Um padrão é um pensamento completo, com causa e consequência. Não repita padrões semelhantes.

Classifique cada padrão em "type":
- "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido.
- "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.

Regras:
- Cada "text" deve ter no máximo 1 frase sucinta e objetiva que descreva o comportamento, incluindo causa e consequência.
- Para cada padrão, preencha "evidenceQuotes" com uma ou mais citações literais do comentário que evidenciam o padrão.
- Não repita padrões semelhantes — cada padrão deve ser distinto.
- Se nenhum padrão novo ou candidato reconhecido aparecer neste comentário, deixe ambas as listas vazias.

Você recebe até quatro blocos de informação: (1) padrões já ativos e confirmados para este trader — NÃO os recrie nem os reporte novamente, eles já são tratados por outro processo; (2) candidatos emergentes — padrões observados uma única vez até agora, cada um com um ID; (3) padrões já levantados hoje em comentários anteriores deste mesmo dia — já foram registrados, trate-os como já resolvidos; e (4) o comentário do diario de trades de UM único trade.

Sua tarefa, olhando apenas para este comentário:
- Se o comentário evidenciar um padrão que já está na lista de candidatos emergentes, inclua-o em "promoted", referenciando exatamente o ID fornecido para aquele candidato — nunca invente um ID que não esteja na lista.
- Se o comentário evidenciar um padrão que já está na lista de padrões ativos, ignore-o completamente — não o inclua em "promoted" nem em "newEmergent".
- Se o comentário evidenciar um padrão que já está na lista de padrões já levantados hoje, ignore-o completamente — não o inclua em "promoted" nem em "newEmergent".
- Se o comentário evidenciar um padrão genuinamente novo (que não corresponde a nenhum padrão ativo, nem a nenhum candidato emergente, nem a nenhum padrão já levantado hoje), inclua-o em "newEmergent".

Além disso, classifique cada padrão novo em "type":
- "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido.
- "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.
Não misture os dois — todo item em "newEmergent" deve trazer o "type" correto.

Exemplos de padrões bem formulados:
- Entrou pelo espaço disponível, mas reconhece que o timing foi ruim porque a reversão já estava clara três barras antes.
- Percebeu sinais técnicos de confirmação antes da entrada, indicando que deveria ter antecipado o trade no ponto mais forte da lateralidade.
- Deixou de aproveitar uma entrada tardia ainda válida, e isso reduziu sua participação em um movimento que seguiu forte.
- Entrou impulsivamente em uma barra climática muito grande, o que levou a um trade exaustivo e encerrado em break even.
- Reconheceu a fraqueza do movimento de alta e saiu da operação, evitando tomar stop.`;

function serializeComment(comment: string): string {
  return `Comentário: "${comment}"`;
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

export type ReinforcementInput = {
  comment: string;
  activePatterns: { id: string; text: string }[];
};

export async function runReinforcement(
  input: ReinforcementInput,
): Promise<{ reinforced: { id: string; evidenceQuote: string }[] }> {
  const { object } = await generateObject({
    model: openai("gpt-5.4-mini"),
    schema: reinforcementSchema,
    system: REINFORCEMENT_SYSTEM_PROMPT,
    prompt: `Padrões conhecidos:\n${serializeInsightCandidates(input.activePatterns)}\n\n${serializeComment(
      input.comment,
    )}`,
  });
  const seen = new Set<string>();
  const reinforced: { id: string; evidenceQuote: string }[] = [];
  for (const r of object.reinforced) {
    if (seen.has(r.insightId)) continue;
    seen.add(r.insightId);
    reinforced.push({ id: r.insightId, evidenceQuote: r.evidenceQuote });
  }
  return { reinforced };
}

export type DiscoveryInput = {
  comment: string;
  activePatterns: { id: string; text: string }[];
  emergentCandidates: { id: string; text: string }[];
  alreadySurfacedToday?: string[];
};

export async function runDiscovery(input: DiscoveryInput): Promise<{
  promoted: { emergentId: string; evidenceQuote: string }[];
  newEmergent: { text: string; evidenceQuote: string; type: "do" | "dont" }[];
}> {
  const alreadySurfacedToday = input.alreadySurfacedToday ?? [];
  const surfacedSection =
    alreadySurfacedToday.length > 0
      ? `Padrões já levantados hoje (NÃO repetir, nem em promoted nem em newEmergent):\n${alreadySurfacedToday
          .map((text) => `- ${text}`)
          .join("\n")}\n\n`
      : "";
  const { object } = await generateObject({
    model: openai("gpt-5.4-mini"),
    schema: discoverySchema,
    system: DISCOVERY_SYSTEM_PROMPT,
    prompt:
      `Padrões ativos (não recriar):\n${serializeInsightCandidates(input.activePatterns)}\n\n` +
      `Candidatos emergentes:\n${serializeInsightCandidates(input.emergentCandidates)}\n\n` +
      surfacedSection +
      `${serializeComment(input.comment)}`,
  });
  return object;
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
    const perComment = await Promise.all(
      commented.map((e) => runReinforcement({ comment: e.comment as string, activePatterns: activeInsights })),
    );
    // Suppress within-day repeats: an active pattern evidenced in several comments of the
    // same day counts once (keeping the first quote), matching the old batched behavior.
    const seenIds = new Set<string>();
    reinforced = perComment.flatMap((r) => r.reinforced).filter((r) => {
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    });
  }

  let promoted: { id: string; evidenceQuote: string }[] = [];
  let newEmergent: { text: string; evidenceQuote: string; type: "do" | "dont" }[] = [];
  if (day.newInsightsProcessed === null && commented.length > 0) {
    const emergentCandidates = await behaviorInsightsService.listEmergent(userId);
    const processedSessions = await sessionsService.listProcessedForDiscovery(userId);
    const { inHorizon } = filterEmergentByHorizon(emergentCandidates, processedSessions);
    const candidateTextById = new Map(inHorizon.map((c) => [c.id, c.text]));

    // Process comments sequentially, carrying forward the patterns surfaced earlier today so
    // the discovery LLM suppresses within-day repeats (semantic, not just exact-string).
    // Cross-day confirmation is untouched: carried-forward patterns are an ignore-list, never
    // promotable emergent candidates.
    const surfacedToday: string[] = [];
    const promotedIds = new Set<string>();
    const newEmergentTexts = new Set<string>();
    for (const e of commented) {
      const object = await runDiscovery({
        comment: e.comment as string,
        activePatterns: activeInsights,
        emergentCandidates: inHorizon,
        alreadySurfacedToday: surfacedToday,
      });
      const validated = validateDiscoveryOutput(inHorizon, object);
      for (const p of validated.promoted) {
        if (promotedIds.has(p.id)) continue;
        promotedIds.add(p.id);
        promoted.push(p);
        const text = candidateTextById.get(p.id);
        if (text) surfacedToday.push(text);
      }
      for (const n of validated.newEmergent) {
        if (newEmergentTexts.has(n.text)) continue;
        newEmergentTexts.add(n.text);
        newEmergent.push(n);
        surfacedToday.push(n.text);
      }
    }
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
