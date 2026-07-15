import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "../db/index.js";
import { behaviorInsightsService } from "./behaviorInsights.js";
import { sessionsService } from "./sessions.js";
import { tradeEntriesForSessions } from "./tradeEntries.js";

const discoverySchema = z.object({
  patterns: z.array(z.object({ text: z.string(), evidenceQuote: z.string(), type: z.enum(["do", "dont"]) })),
});

const DISCOVERY_SYSTEM_PROMPT = `Este é um comentário de um diário de trade. Extraia deste texto os principais padrões comportamentais.

Um padrão é uma ação individual que o trader faz. Não repita padrões semelhantes.

Classifique cada padrão em "type":
- "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido.
- "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.

Regras:
- Cada "text" deve ter no máximo 1 frase sucinta e objetiva com algumas palavras que descreva o comportamento apenas o padrão.
- Essa frase deve ser como uma identidade, curtissma.
- Não inclua na frase quando ele acontece ou porque ele acontece.
- Para cada padrão, preencha "evidenceQuote" com uma ou mas citações literais do comentário que evidencia o padrão.
- Não repita padrões semelhantes — cada padrão deve ser distinto.
- Se nenhum padrão novo aparecer neste comentário, deixe a lista vazia.

Você recebe até três blocos de informação: (1) padrões já ativos para este trader — NÃO os recrie nem os reporte novamente, eles já estão registrados; (2) padrões já levantados hoje em comentários anteriores deste mesmo dia — já foram registrados, trate-os como já resolvidos; e (3) o comentário do diario de trades de UM único trade.

Sua tarefa, olhando apenas para este comentário:
- Se o comentário evidenciar um padrão que já está na lista de padrões ativos, ignore-o completamente — não o inclua em "patterns".
- Se o comentário evidenciar um padrão que já está na lista de padrões já levantados hoje, ignore-o completamente — não o inclua em "patterns".
- Se o comentário evidenciar um padrão genuinamente novo (que não corresponde a nenhum padrão ativo nem a nenhum padrão já levantado hoje), inclua-o em "patterns".

Além disso, classifique cada padrão novo em "type":
- "do": comportamento positivo, uma força ou acerto do trader que deve ser mantido.
- "dont": erro, vício ou comportamento negativo que o trader deveria corrigir.
Não misture os dois — todo item em "patterns" deve trazer o "type" correto.

Exemplos de padrões bem formulados:
- Sair no alvo.
- Aguardar confirmação de força.
- Reconhecer quando a pressão contrária está mais forte.
- Ler microestruturas de continuação.
- Entrar tarde.`;

function serializeComment(comment: string): string {
  return `Comentário: "${comment}"`;
}

function serializeInsightCandidates(insights: { id: string; text: string }[]): string {
  return insights.map((insight) => `ID ${insight.id}: ${insight.text}`).join("\n");
}

export type BehaviorInsightForwardOutcome =
  | { skipped: true; reason: "nothing_pending" }
  | {
      skipped: false;
      sessionsProcessed: number;
      patternsDiscovered: number;
      remaining: number;
      error?: { message: string; sessionId: string };
    };

export function validateDiscoveryOutput(llmOutput: {
  patterns: { text: string; evidenceQuote: string; type: "do" | "dont" }[];
}): {
  patterns: { text: string; evidenceQuote: string; type: "do" | "dont" }[];
} {
  const seenTexts = new Set<string>();
  const patterns: { text: string; evidenceQuote: string; type: "do" | "dont" }[] = [];
  for (const n of llmOutput.patterns) {
    const text = n.text.trim();
    if (text.length === 0 || seenTexts.has(text)) continue;
    seenTexts.add(text);
    patterns.push({ text, evidenceQuote: n.evidenceQuote, type: n.type });
  }

  return { patterns };
}

export type DiscoveryInput = {
  comment: string;
  activePatterns: { id: string; text: string }[];
  alreadySurfacedToday?: string[];
};

export async function runDiscovery(input: DiscoveryInput): Promise<{
  patterns: { text: string; evidenceQuote: string; type: "do" | "dont" }[];
}> {
  const alreadySurfacedToday = input.alreadySurfacedToday ?? [];
  const surfacedSection =
    alreadySurfacedToday.length > 0
      ? `Padrões já levantados hoje (NÃO repetir):\n${alreadySurfacedToday.map((text) => `- ${text}`).join("\n")}\n\n`
      : "";
  const { object } = await generateObject({
    model: openai("gpt-5.4-mini"),
    schema: discoverySchema,
    system: DISCOVERY_SYSTEM_PROMPT,
    prompt:
      `Padrões ativos (não recriar):\n${serializeInsightCandidates(input.activePatterns)}\n\n` +
      surfacedSection +
      `${serializeComment(input.comment)}`,
  });
  return object;
}

type EligibleDay = Awaited<ReturnType<typeof sessionsService.listEligibleForForwardPass>>[number];

async function processDay(userId: string, day: EligibleDay): Promise<{ discoveredCount: number }> {
  const sessionIds = [day.id];
  const entries = await tradeEntriesForSessions(sessionIds);
  const commented = entries.filter((e) => e.comment && e.comment.trim() !== "");

  const discovered: { text: string; evidenceQuote: string; type: "do" | "dont" }[] = [];
  if (day.newInsightsProcessed === null && commented.length > 0) {
    const activeInsights = await behaviorInsightsService.listActive(userId);

    // Process comments sequentially, carrying forward the patterns surfaced earlier today so
    // the discovery LLM suppresses within-day repeats (semantic, not just exact-string).
    const surfacedToday: string[] = [];
    const discoveredTexts = new Set<string>();
    for (const e of commented) {
      const object = await runDiscovery({
        comment: e.comment as string,
        activePatterns: activeInsights,
        alreadySurfacedToday: surfacedToday,
      });
      const validated = validateDiscoveryOutput(object);
      for (const n of validated.patterns) {
        if (discoveredTexts.has(n.text)) continue;
        discoveredTexts.add(n.text);
        discovered.push(n);
        surfacedToday.push(n.text);
      }
    }
  }

  await db.transaction(async (tx) => {
    if (discovered.length > 0) {
      await behaviorInsightsService.createActive(userId, discovered, tx);
    }
    if (day.newInsightsProcessed === null) {
      await sessionsService.stampNewInsightsProcessed(sessionIds, tx);
    }
  });

  return { discoveredCount: discovered.length };
}

export const behaviorInsightExtractionService = {
  runForwardPass: async (userId: string): Promise<BehaviorInsightForwardOutcome> => {
    const eligible = await sessionsService.listEligibleForForwardPass(userId);
    if (eligible.length === 0) {
      return { skipped: true, reason: "nothing_pending" };
    }

    let sessionsProcessed = 0;
    let patternsDiscovered = 0;

    for (const day of eligible) {
      try {
        const result = await processDay(userId, day);
        sessionsProcessed += 1;
        patternsDiscovered += result.discoveredCount;
      } catch (err) {
        console.error(
          `[behaviorInsightExtraction] forward pass failed on session ${day.id} ` +
            `(userId=${userId}, sessionsProcessed=${sessionsProcessed}):`,
          err,
        );
        return {
          skipped: false,
          sessionsProcessed,
          patternsDiscovered,
          remaining: eligible.length - sessionsProcessed,
          error: { message: err instanceof Error ? err.message : String(err), sessionId: day.id },
        };
      }
    }

    return { skipped: false, sessionsProcessed, patternsDiscovered, remaining: 0 };
  },

  pendingCount: async (userId: string): Promise<number> => {
    const eligible = await sessionsService.listEligibleForForwardPass(userId);
    return eligible.length;
  },
};
