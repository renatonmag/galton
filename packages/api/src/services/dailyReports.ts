import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { z } from "zod";
import { db } from "../db/index.js";
import { dailyReports, sessions, tradeEntries } from "../db/schema.js";
import { computeRatio } from "../lib/successRatio.js";
import { userPreferencesService } from "./userPreferences.js";

const WINDOW_DAYS = 7;

type EntryRow = {
  result: "open" | "profit" | "loss" | "breakeven";
  comment: string | null;
  decision: "TRADE" | "NO_TRADE";
  direction: "buy" | "sell" | null;
  r: string;
  openedAt: Date;
};

function windowBoundaries(reportDate: string, timezone: string) {
  const windowEnd = DateTime.fromISO(reportDate, { zone: timezone }).startOf("day");
  const windowStart = windowEnd.minus({ days: WINDOW_DAYS });
  return { windowStart, windowEnd };
}

const dailyReportSchema = z.object({
  improvements: z
    .array(
      z.object({
        pattern: z.string(),
        description: z.string(),
        action: z.string(),
      }),
    )
    .max(5),
  strengths: z
    .array(
      z.object({
        pattern: z.string(),
        description: z.string(),
        whyItMatters: z.string(),
      }),
    )
    .max(5),
});

const SYSTEM_PROMPT = `You are a trading performance coach reviewing a trader's daily self-reflection notes (in Portuguese).

Analyze the entries below and extract two things:
(A) The most pressing, recurring points where the trader can improve
(B) The most consistent strengths the trader is showing

Populate the "improvements" and "strengths" fields (max 5 items each), written in Portuguese:
- For each improvement item: "pattern" is a short name for the pattern, "description" is a 1-sentence description of what's happening, "action" is a 1-sentence, objective, practical recommended action.
- For each strength item: "pattern" is a short name for the strength, "description" is a 1-sentence description of what the trader is doing well, "whyItMatters" is a 1-sentence, objective note on its impact on the results.

Rules:
- Only include a pattern (positive or negative) if it's evidenced by 2+ entries — don't invent points from a single instance.
- For improvement points: prioritize execution/timing errors and risk management errors first, then reasoning/analysis issues.
- For strengths: prioritize patterns tied to actual trading skill (reading context, exiting on invalidation, patience, risk discipline) over vague traits.
- Be specific and cite the type of situation that shows the pattern (e.g. "entra tarde após identificar o sinal corretamente" or "reconhece perda de força do sinal e sai antes do stop") — never vague language like "seja mais disciplinado" or "boa análise".
- Do not include praise inside the improvements or criticism inside the strengths — keep them strictly separated.`;

function serializeEntries(entries: EntryRow[]): string {
  return entries
    .map(
      (e, i) =>
        `Entry ${i + 1}: decision=${e.decision}, result=${e.result}, direction=${e.direction ?? "n/a"}, r=${e.r}\ncomment="${e.comment}"`,
    )
    .join("\n\n");
}

export const dailyReportsService = {
  getOrGenerate: async (userId: string, reportDate: string) => {
    const existing = await db
      .select()
      .from(dailyReports)
      .where(and(eq(dailyReports.userId, userId), eq(dailyReports.reportDate, reportDate)));
    if (existing[0]) return existing[0];

    const preferences = await userPreferencesService.get(userId);
    const timezone = preferences?.timezone ?? "UTC";
    const { windowStart, windowEnd } = windowBoundaries(reportDate, timezone);

    const allEntries: EntryRow[] = await db
      .select({
        result: tradeEntries.result,
        comment: tradeEntries.comment,
        decision: tradeEntries.decision,
        direction: tradeEntries.direction,
        r: tradeEntries.r,
        openedAt: sessions.openedAt,
      })
      .from(tradeEntries)
      .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
      .where(eq(sessions.userId, userId));

    const windowEntries = allEntries.filter((e) => {
      const openedAt = DateTime.fromJSDate(e.openedAt);
      return openedAt >= windowStart && openedAt < windowEnd;
    });
    const historicEntries = allEntries.filter(
      (e) => DateTime.fromJSDate(e.openedAt) < windowStart,
    );

    const closedWindowEntries = windowEntries.filter((e) => e.result !== "open");
    const closedHistoricEntries = historicEntries.filter((e) => e.result !== "open");

    const weekRatio = computeRatio(closedWindowEntries);
    const historicRatio = computeRatio(closedHistoricEntries);
    const openCount = windowEntries.filter((e) => e.result === "open").length;

    const narrativeEntries = closedWindowEntries.filter(
      (e) => e.comment && e.comment.trim() !== "",
    );

    let improvements: z.infer<typeof dailyReportSchema>["improvements"] = [];
    let strengths: z.infer<typeof dailyReportSchema>["strengths"] = [];

    if (narrativeEntries.length > 0) {
      const { object } = await generateObject({
        model: openai("gpt-5.4-mini"),
        schema: dailyReportSchema,
        system: SYSTEM_PROMPT,
        prompt: serializeEntries(narrativeEntries),
      });
      improvements = object.improvements;
      strengths = object.strengths;
    }

    await db
      .insert(dailyReports)
      .values({
        userId,
        reportDate,
        historicRatio: historicRatio !== null ? historicRatio.toFixed(4) : null,
        weekRatio: weekRatio !== null ? weekRatio.toFixed(4) : null,
        openCount,
        improvements,
        strengths,
      })
      .onConflictDoNothing({
        target: [dailyReports.userId, dailyReports.reportDate],
      });

    const rows = await db
      .select()
      .from(dailyReports)
      .where(and(eq(dailyReports.userId, userId), eq(dailyReports.reportDate, reportDate)));
    return rows[0];
  },

  list: async (userId: string) => {
    const preferences = await userPreferencesService.get(userId);
    const timezone = preferences?.timezone ?? "UTC";
    const today = DateTime.now().setZone(timezone).startOf("day");

    const entries = await db
      .select({
        result: tradeEntries.result,
        comment: tradeEntries.comment,
        openedAt: sessions.openedAt,
      })
      .from(tradeEntries)
      .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
      .where(eq(sessions.userId, userId));

    const signalDates = new Set<string>();
    for (const e of entries) {
      if (e.result === "open") continue;
      if (!e.comment || e.comment.trim() === "") continue;
      const day = DateTime.fromJSDate(e.openedAt).setZone(timezone).startOf("day");
      const iso = day.toISODate();
      if (iso) signalDates.add(iso);
    }

    const qualifyingDates = new Set<string>();
    for (const signalDateStr of signalDates) {
      const signalDate = DateTime.fromISO(signalDateStr, { zone: timezone });
      for (let offset = 1; offset <= WINDOW_DAYS; offset++) {
        const candidate = signalDate.plus({ days: offset });
        if (candidate > today) continue;
        const iso = candidate.toISODate();
        if (iso) qualifyingDates.add(iso);
      }
    }

    return [...qualifyingDates].sort().reverse();
  },
};
