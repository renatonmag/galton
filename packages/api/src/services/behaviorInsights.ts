import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { behaviorInsights } from "../db/schema.js";

type Executor = Pick<typeof db, "update">;

export const behaviorInsightsService = {
  hasAny: async (userId: string): Promise<boolean> => {
    const rows = await db
      .select({ id: behaviorInsights.id })
      .from(behaviorInsights)
      .where(eq(behaviorInsights.userId, userId))
      .limit(1);
    return rows.length > 0;
  },

  listActive: async (userId: string): Promise<{ id: string; text: string }[]> => {
    return db
      .select({ id: behaviorInsights.id, text: behaviorInsights.text })
      .from(behaviorInsights)
      .where(and(eq(behaviorInsights.userId, userId), eq(behaviorInsights.status, "active")));
  },

  create: async (userId: string, texts: string[]) => {
    if (texts.length === 0) return [];
    return db
      .insert(behaviorInsights)
      .values(texts.map((text) => ({ userId, text, evidenceCount: 1 })))
      .returning();
  },

  update: async (insightIds: string[], executor: Executor = db) => {
    if (insightIds.length === 0) return [];
    return executor
      .update(behaviorInsights)
      .set({ evidenceCount: sql`${behaviorInsights.evidenceCount} + 1`, lastSeen: new Date() })
      .where(inArray(behaviorInsights.id, insightIds))
      .returning();
  },
};
