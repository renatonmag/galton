import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { behaviorInsights } from "../db/schema.js";

type Executor = Pick<typeof db, "insert">;

export const behaviorInsightsService = {
  listActive: async (userId: string): Promise<{ id: string; text: string }[]> => {
    return db
      .select({ id: behaviorInsights.id, text: behaviorInsights.text })
      .from(behaviorInsights)
      .where(and(eq(behaviorInsights.userId, userId), eq(behaviorInsights.status, "active")));
  },

  listActiveWithType: async (
    userId: string,
  ): Promise<{ id: string; text: string; type: "do" | "dont" }[]> => {
    return db
      .select({ id: behaviorInsights.id, text: behaviorInsights.text, type: behaviorInsights.type })
      .from(behaviorInsights)
      .where(and(eq(behaviorInsights.userId, userId), eq(behaviorInsights.status, "active")));
  },

  createActive: async (
    userId: string,
    patterns: { text: string; evidenceQuote: string; type: "do" | "dont" }[],
    executor: Executor = db,
  ) => {
    if (patterns.length === 0) return [];
    return executor
      .insert(behaviorInsights)
      .values(
        patterns.map(({ text, evidenceQuote, type }) => ({
          userId,
          text,
          type,
          evidenceCount: 1,
          evidenceQuotes: [evidenceQuote],
          status: "active" as const,
        })),
      )
      .returning();
  },
};
