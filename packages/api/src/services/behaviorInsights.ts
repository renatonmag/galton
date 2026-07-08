import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { behaviorInsights } from "../db/schema.js";

type Executor = Pick<typeof db, "update" | "insert">;

export const behaviorInsightsService = {
  listActive: async (userId: string): Promise<{ id: string; text: string }[]> => {
    return db
      .select({ id: behaviorInsights.id, text: behaviorInsights.text })
      .from(behaviorInsights)
      .where(and(eq(behaviorInsights.userId, userId), eq(behaviorInsights.status, "active")));
  },

  listEmergent: async (userId: string): Promise<{ id: string; text: string }[]> => {
    return db
      .select({ id: behaviorInsights.id, text: behaviorInsights.text })
      .from(behaviorInsights)
      .where(and(eq(behaviorInsights.userId, userId), eq(behaviorInsights.status, "emergent")));
  },

  stageEmergent: async (userId: string, texts: string[], executor: Executor = db) => {
    if (texts.length === 0) return [];
    return executor
      .insert(behaviorInsights)
      .values(texts.map((text) => ({ userId, text, evidenceCount: 1, status: "emergent" as const })))
      .returning();
  },

  promoteEmergent: async (ids: string[], executor: Executor = db) => {
    if (ids.length === 0) return [];
    return executor
      .update(behaviorInsights)
      .set({ status: "active", evidenceCount: 2, lastSeen: new Date() })
      .where(and(inArray(behaviorInsights.id, ids), eq(behaviorInsights.status, "emergent")))
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
