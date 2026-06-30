import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, tradeEntries } from "../db/schema.js";

async function computeDecision(
  userId: string,
): Promise<{ ratio: string; decision: "TRADE" | "NO_TRADE" }> {
  const allEntries = await db
    .select({ result: tradeEntries.result })
    .from(tradeEntries)
    .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), ne(tradeEntries.result, "open")));

  let profit = 0;
  let loss = 0;
  let breakeven = 0;
  for (const e of allEntries) {
    if (e.result === "profit") profit++;
    else if (e.result === "loss") loss++;
    else if (e.result === "breakeven") breakeven++;
  }

  const denominator = profit + loss + breakeven;
  if (denominator === 0) return { ratio: "0.0000", decision: "TRADE" };

  const ratio = (profit + breakeven) / denominator;
  const decision: "TRADE" | "NO_TRADE" = ratio >= 0.5 ? "TRADE" : "NO_TRADE";
  return { ratio: ratio.toFixed(4), decision };
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
    data: { result?: "open" | "profit" | "loss" | "breakeven"; r?: string },
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
        r: data.r ?? "",
        successRatio: ratio,
      })
      .returning();
    return rows[0];
  },

  update: async (
    id: string,
    userId: string,
    data: { result?: "open" | "profit" | "loss" | "breakeven"; r?: string },
  ) => {
    const existing = await db
      .select()
      .from(tradeEntries)
      .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
      .where(and(eq(tradeEntries.id, id), eq(sessions.userId, userId)));
    if (!existing[0]) return null;

    const rows = await db
      .update(tradeEntries)
      .set({ ...(data.result && { result: data.result }), ...(data.r && { r: data.r }) })
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
