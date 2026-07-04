import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, tradeEntries } from "../db/schema.js";

export const sessionsService = {
  list: async (userId: string) => {
    const rows = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        name: sessions.name,
        openedAt: sessions.openedAt,
        reviewedAt: sessions.reviewedAt,
        tradeCount: count(tradeEntries.id),
      })
      .from(sessions)
      .leftJoin(tradeEntries, eq(tradeEntries.sessionId, sessions.id))
      .where(eq(sessions.userId, userId))
      .groupBy(sessions.id)
      .orderBy(desc(sessions.openedAt));
    return rows;
  },

  create: async (userId: string) => {
    const name = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const rows = await db.insert(sessions).values({ userId, name }).returning();
    return rows[0];
  },

  delete: async (id: string, userId: string) => {
    const rows = await db
      .delete(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return rows[0];
  },

  markReviewed: async (id: string, userId: string) => {
    const rows = await db
      .update(sessions)
      .set({ reviewedAt: new Date() })
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return rows[0];
  },

  reopenReview: async (id: string, userId: string) => {
    const rows = await db
      .update(sessions)
      .set({ reviewedAt: null })
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return rows[0];
  },
};
