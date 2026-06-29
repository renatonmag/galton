import { generateObject, transcribe } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, setups, strategies, characteristics } from "../db/schema.js";

const prefillSchema = z.object({
  setupId: z.string().uuid().nullable(),
  confidence: z.enum(["high", "low"]),
  characteristics: z.array(
    z.object({
      characteristicId: z.string().uuid(),
      value: z.union([z.boolean(), z.string()]),
    }),
  ),
  comment: z.string().nullable(),
});

export type VoicePrefillResponse = z.infer<typeof prefillSchema> & {
  transcription: string;
  setupName: string | null;
};

export const voiceService = {
  processVoiceEntry: async (
    userId: string,
    sessionId: string,
    audio: File,
  ): Promise<VoicePrefillResponse | undefined> => {
    const owned = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    if (!owned[0]) return undefined;

    const rows = await db
      .select({
        setupId: setups.id,
        setupName: setups.name,
        setupDescription: setups.description,
        charId: characteristics.id,
        charName: characteristics.name,
        charType: characteristics.type,
        charOptions: characteristics.options,
      })
      .from(setups)
      .innerJoin(strategies, eq(setups.strategyId, strategies.id))
      .leftJoin(characteristics, eq(characteristics.setupId, setups.id))
      .where(eq(strategies.userId, userId))
      .orderBy(asc(setups.id), asc(characteristics.position));

    const setupMap = new Map<
      string,
      {
        name: string;
        description: string | null;
        chars: { id: string; name: string; type: string; options: string[] | null }[];
      }
    >();

    for (const row of rows) {
      if (!setupMap.has(row.setupId)) {
        setupMap.set(row.setupId, {
          name: row.setupName,
          description: row.setupDescription ?? null,
          chars: [],
        });
      }
      if (row.charId) {
        setupMap.get(row.setupId)!.chars.push({
          id: row.charId,
          name: row.charName!,
          type: row.charType!,
          options: row.charOptions ?? null,
        });
      }
    }

    const audioBuffer = await audio.arrayBuffer();
    const { text: transcription } = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: new Uint8Array(audioBuffer),
      mimeType: (audio.type || "audio/mp4") as Parameters<typeof transcribe>[0]["mimeType"],
    });

    const setupLines = [...setupMap.entries()]
      .map(([id, s]) => {
        const charLines = s.chars
          .map((c) => {
            const opts =
              c.options?.length
                ? `, Options: [${c.options.map((o) => `"${o}"`).join(", ")}]`
                : "";
            return `    - ID: ${c.id}, Name: "${c.name}", Type: ${c.type}${opts}`;
          })
          .join("\n");
        return `- ID: ${id}, Name: "${s.name}"${s.description ? `, Description: "${s.description}"` : ""}
  Characteristics:
${charLines || "    (none)"}`;
      })
      .join("\n\n");

    const systemPrompt = `You are a trading journal assistant. Given a voice transcript from a trader, identify the most likely trading setup and extract characteristic values.

Available setups:
${setupLines}

Instructions:
- Match the setup the trader is referring to by name or description.
- Extract characteristic values from what the trader says.
- For boolean characteristics, return true or false.
- For multiple_choice characteristics, return one of the listed options exactly as written.
- Set confidence to "high" if you are certain about the setup match, "low" if unsure.
- Set setupId to null if no setup matches.
- Extract any free-text comment the trader made about the trade.`;

    const { object } = await generateObject({
      model: openai("gpt-5.4-mini"),
      schema: prefillSchema,
      system: systemPrompt,
      prompt: transcription,
    });

    return {
      ...object,
      transcription,
      setupName: object.setupId ? (setupMap.get(object.setupId)?.name ?? null) : null,
    };
  },
};
