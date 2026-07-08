import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { sessions, tradeEntries } from "../db/schema.js";

type Executor = Pick<typeof db, "update">;

function listEligibleSessions(userId: string, unprocessedColumn: PgColumn) {
  return db
    .select({ id: sessions.id, openedAt: sessions.openedAt })
    .from(sessions)
    .innerJoin(tradeEntries, eq(tradeEntries.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(unprocessedColumn),
        sql`length(trim(coalesce(${tradeEntries.comment}, ''))) > 0`,
      ),
    )
    .groupBy(sessions.id)
    .orderBy(asc(sessions.openedAt));
}

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

  listEligibleForNewInsights: async (userId: string) => {
    return listEligibleSessions(userId, sessions.newInsightsProcessed);
  },

  listEligibleForReinforcement: async (userId: string) => {
    return listEligibleSessions(userId, sessions.reinforceProcessed);
  },

  stampBootstrapProcessed: async (sessionIds: string[], executor: Executor = db) => {
    if (sessionIds.length === 0) return [];
    const now = new Date();
    return executor
      .update(sessions)
      .set({ newInsightsProcessed: now, reinforceProcessed: now })
      .where(inArray(sessions.id, sessionIds))
      .returning();
  },

  stampReinforceProcessed: async (sessionIds: string[], executor: Executor = db) => {
    if (sessionIds.length === 0) return [];
    return executor
      .update(sessions)
      .set({ reinforceProcessed: new Date() })
      .where(inArray(sessions.id, sessionIds))
      .returning();
  },
};
