import { and, asc, count, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { sessions, tradeEntries } from "../db/schema.js";

type Executor = Pick<typeof db, "update">;

function listEligibleSessions(userId: string, unprocessedColumns: PgColumn[]) {
  const pendingCondition =
    unprocessedColumns.length === 1 ? isNull(unprocessedColumns[0]) : or(...unprocessedColumns.map((c) => isNull(c)));

  return db
    .select({
      id: sessions.id,
      openedAt: sessions.openedAt,
      reinforceProcessed: sessions.reinforceProcessed,
      newInsightsProcessed: sessions.newInsightsProcessed,
    })
    .from(sessions)
    .innerJoin(tradeEntries, eq(tradeEntries.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        pendingCondition,
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

  listEligibleForForwardPass: async (userId: string) => {
    return listEligibleSessions(userId, [sessions.reinforceProcessed, sessions.newInsightsProcessed]);
  },

  listProcessedForDiscovery: async (userId: string) => {
    return db
      .select({ id: sessions.id, openedAt: sessions.openedAt })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNotNull(sessions.newInsightsProcessed)))
      .orderBy(asc(sessions.openedAt));
  },

  stampReinforceProcessed: async (sessionIds: string[], executor: Executor = db) => {
    if (sessionIds.length === 0) return [];
    return executor
      .update(sessions)
      .set({ reinforceProcessed: new Date() })
      .where(inArray(sessions.id, sessionIds))
      .returning();
  },

  stampNewInsightsProcessed: async (sessionIds: string[], executor: Executor = db) => {
    if (sessionIds.length === 0) return [];
    return executor
      .update(sessions)
      .set({ newInsightsProcessed: new Date() })
      .where(inArray(sessions.id, sessionIds))
      .returning();
  },
};
