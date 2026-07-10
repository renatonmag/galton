import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { behaviorInsightsService } from "./behaviorInsights.js";

const coachSchema = z.object({
  matchedInsightId: z.string().nullable(),
  response: z.string(),
});

const COACH_SYSTEM_PROMPT = `Você é um coach de comportamento de traders que intervém em tempo real.

Você recebe a lista de padrões de comportamento já confirmados para este trader (cada um com um ID, o texto do padrão e um tipo: "do" para hábitos bons a manter, "dont" para hábitos ruins a evitar) e uma única fala do trader gravada durante a sessão.

Sua tarefa é decidir se a fala corresponde claramente a UM dos padrões da lista:
- Se corresponder claramente a exatamente um padrão, retorne o "matchedInsightId" com o ID exato daquele padrão e escreva em "response" UMA frase curta em português: se o padrão for "do", reforce que é o caminho certo e incentive; se for "dont", alerte que é uma má ideia naquela situação.
- Se nenhum padrão da lista corresponder claramente à fala, retorne "matchedInsightId" como null e deixe "response" vazio.

Regras:
- Escolha no máximo UM padrão — o mais relevante.
- Nunca invente padrões novos nem um ID que não esteja na lista.
- A frase de "response" deve ser curta, direta e em português.`;

function serializeActiveInsights(insights: { id: string; text: string; type: "do" | "dont" }[]): string {
  return insights.map((i) => `ID ${i.id} (${i.type}): ${i.text}`).join("\n");
}

export const behaviorCoachService = {
  matchUtterance: async (
    userId: string,
    transcript: string,
  ): Promise<{ coachInsight: { text: string; type: "do" | "dont" }; matchedInsightId: string } | null> => {
    const activeInsights = await behaviorInsightsService.listActiveWithType(userId);
    if (activeInsights.length === 0) return null;

    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: coachSchema,
      system: COACH_SYSTEM_PROMPT,
      prompt: `Padrões confirmados:\n${serializeActiveInsights(activeInsights)}\n\nFala do trader: "${transcript}"`,
    });

    if (object.matchedInsightId === null) return null;
    const matched = activeInsights.find((i) => i.id === object.matchedInsightId);
    if (!matched) return null;

    const text = object.response.trim();
    if (text.length === 0) return null;

    return { coachInsight: { text, type: matched.type }, matchedInsightId: matched.id };
  },
};
