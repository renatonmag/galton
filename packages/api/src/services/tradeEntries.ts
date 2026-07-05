import { and, eq, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, tradeEntries } from "../db/schema.js";
import { computeDecision as computeRatioDecision } from "../lib/successRatio.js";

async function computeDecision(
  userId: string,
): Promise<{ ratio: string; decision: "TRADE" | "NO_TRADE" }> {
  const allEntries = await db
    .select({ result: tradeEntries.result })
    .from(tradeEntries)
    .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), ne(tradeEntries.result, "open")));

  const { ratio, decision } = computeRatioDecision(allEntries);
  return { ratio: ratio === null ? "0.0000" : ratio.toFixed(4), decision };
}

export const tradeEntriesService = {
  list: async (sessionId: string, userId: string) => {
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    if (!session[0]) return null;

    return db
      .select()
      .from(tradeEntries)
      .where(eq(tradeEntries.sessionId, sessionId))
      .orderBy(tradeEntries.createdAt);
  },

  create: async (
    sessionId: string,
    userId: string,
    data: {
      result?: "open" | "profit" | "loss" | "breakeven";
      direction?: "buy" | "sell";
      r?: string;
    },
  ) => {
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    if (!session[0]) return null;

    const { ratio, decision } = await computeDecision(userId);
    const rows = await db
      .insert(tradeEntries)
      .values({
        sessionId,
        decision,
        result: data.result ?? "open",
        direction: data.direction,
        r: data.r ?? "",
        successRatio: ratio,
      })
      .returning();
    return rows[0];
  },

  update: async (
    id: string,
    userId: string,
    data: {
      result?: "open" | "profit" | "loss" | "breakeven";
      direction?: "buy" | "sell" | null;
      r?: string;
      entryAt?: string | null;
      comment?: string | null;
    },
  ) => {
    const existing = await db
      .select()
      .from(tradeEntries)
      .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
      .where(and(eq(tradeEntries.id, id), eq(sessions.userId, userId)));
    if (!existing[0]) return null;

    const rows = await db
      .update(tradeEntries)
      .set({
        ...(data.result && { result: data.result }),
        ...(data.direction !== undefined && { direction: data.direction }),
        ...(data.r && { r: data.r }),
        ...(data.entryAt !== undefined && { entryAt: data.entryAt ? new Date(data.entryAt) : null }),
        ...(data.comment !== undefined && { comment: data.comment }),
      })
      .where(eq(tradeEntries.id, id))
      .returning();
    return rows[0];
  },

  appendComment: async (id: string, userId: string, text: string) => {
    const existing = await db
      .select({ comment: tradeEntries.comment })
      .from(tradeEntries)
      .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
      .where(and(eq(tradeEntries.id, id), eq(sessions.userId, userId)));
    if (!existing[0]) return null;

    const combined = existing[0].comment ? `${existing[0].comment}\n\n${text}` : text;

    const rows = await db
      .update(tradeEntries)
      .set({ comment: combined })
      .where(eq(tradeEntries.id, id))
      .returning();
    return rows[0];
  },

  remove: async (id: string, userId: string) => {
    const existing = await db
      .select()
      .from(tradeEntries)
      .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
      .where(and(eq(tradeEntries.id, id), eq(sessions.userId, userId)));
    if (!existing[0]) return null;

    const rows = await db
      .delete(tradeEntries)
      .where(eq(tradeEntries.id, id))
      .returning();
    return rows[0];
  },
};
