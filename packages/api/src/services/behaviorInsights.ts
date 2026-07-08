import { and, eq, sql } from "drizzle-orm";
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

  listEmergent: async (userId: string): Promise<{ id: string; text: string; lastSeen: Date }[]> => {
    return db
      .select({ id: behaviorInsights.id, text: behaviorInsights.text, lastSeen: behaviorInsights.lastSeen })
      .from(behaviorInsights)
      .where(and(eq(behaviorInsights.userId, userId), eq(behaviorInsights.status, "emergent")));
  },

  stageEmergent: async (
    userId: string,
    emergents: { text: string; evidenceQuote: string }[],
    executor: Executor = db,
  ) => {
    if (emergents.length === 0) return [];
    return executor
      .insert(behaviorInsights)
      .values(
        emergents.map(({ text, evidenceQuote }) => ({
          userId,
          text,
          evidenceCount: 1,
          evidenceQuotes: [evidenceQuote],
          status: "emergent" as const,
        })),
      )
      .returning();
  },

  promoteEmergent: async (promotions: { id: string; evidenceQuote: string }[], executor: Executor = db) => {
    if (promotions.length === 0) return [];
    const now = new Date();
    return Promise.all(
      promotions.map(({ id, evidenceQuote }) =>
        executor
          .update(behaviorInsights)
          .set({
            status: "active",
            evidenceCount: 2,
            lastSeen: now,
            evidenceQuotes: sql`${behaviorInsights.evidenceQuotes} || ${evidenceQuote}`,
          })
          .where(and(eq(behaviorInsights.id, id), eq(behaviorInsights.status, "emergent")))
          .returning(),
      ),
    );
  },

  update: async (reinforcements: { id: string; evidenceQuote: string }[], executor: Executor = db) => {
    if (reinforcements.length === 0) return [];
    const now = new Date();
    return Promise.all(
      reinforcements.map(({ id, evidenceQuote }) =>
        executor
          .update(behaviorInsights)
          .set({
            evidenceCount: sql`${behaviorInsights.evidenceCount} + 1`,
            lastSeen: now,
            evidenceQuotes: sql`${behaviorInsights.evidenceQuotes} || ${evidenceQuote}`,
          })
          .where(eq(behaviorInsights.id, id))
          .returning(),
      ),
    );
  },
};
