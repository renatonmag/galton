import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { behaviorInsights } from "../db/schema.js";

type Executor = Pick<typeof db, "insert">;

export type BehaviorInsightRow = {
  id: string;
  text: string;
  type: "do" | "dont";
  source: "discovered" | "authored";
};

const managementColumns = {
  id: behaviorInsights.id,
  text: behaviorInsights.text,
  type: behaviorInsights.type,
  source: behaviorInsights.source,
} as const;

// Pure validator for a hand-authored behavior (create). Mirrors validateDiscoveryOutput in
// behaviorInsightExtraction.ts: no I/O, just normalization + shape checks.
export function validateAuthoredBehavior(input: {
  text?: unknown;
  type?: unknown;
}): { ok: true; value: { text: string; type: "do" | "dont" } } | { ok: false; error: string } {
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (text.length === 0) return { ok: false, error: "text is required" };
  if (input.type !== "do" && input.type !== "dont") {
    return { ok: false, error: "type must be 'do' or 'dont'" };
  }
  return { ok: true, value: { text, type: input.type } };
}

// Pure validator for a partial edit: each provided field must be valid, and at least one must be present.
export function validateBehaviorPatch(input: {
  text?: unknown;
  type?: unknown;
}):
  | { ok: true; value: { text?: string; type?: "do" | "dont" } }
  | { ok: false; error: string } {
  const value: { text?: string; type?: "do" | "dont" } = {};
  if (input.text !== undefined) {
    const text = typeof input.text === "string" ? input.text.trim() : "";
    if (text.length === 0) return { ok: false, error: "text cannot be empty" };
    value.text = text;
  }
  if (input.type !== undefined) {
    if (input.type !== "do" && input.type !== "dont") {
      return { ok: false, error: "type must be 'do' or 'dont'" };
    }
    value.type = input.type;
  }
  if (value.text === undefined && value.type === undefined) {
    return { ok: false, error: "nothing to update" };
  }
  return { ok: true, value };
}

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

  // Full projection (including source) for the mobile management screen.
  listActiveForManagement: async (userId: string): Promise<BehaviorInsightRow[]> => {
    return db
      .select(managementColumns)
      .from(behaviorInsights)
      .where(and(eq(behaviorInsights.userId, userId), eq(behaviorInsights.status, "active")))
      .orderBy(desc(behaviorInsights.firstSeen));
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

  // Create a single hand-authored behavior. No evidence — it is user-asserted, not discovered.
  createAuthored: async (
    userId: string,
    input: { text: string; type: "do" | "dont" },
  ): Promise<BehaviorInsightRow> => {
    const [row] = await db
      .insert(behaviorInsights)
      .values({
        userId,
        text: input.text,
        type: input.type,
        evidenceCount: 0,
        evidenceQuotes: [],
        status: "active" as const,
        source: "authored" as const,
      })
      .returning(managementColumns);
    if (!row) throw new Error("Failed to create behavior insight");
    return row;
  },

  // Edit an active behavior (any source). Returns null when no active row is owned by this user.
  update: async (
    userId: string,
    id: string,
    patch: { text?: string; type?: "do" | "dont" },
  ): Promise<BehaviorInsightRow | null> => {
    const [row] = await db
      .update(behaviorInsights)
      .set(patch)
      .where(
        and(
          eq(behaviorInsights.id, id),
          eq(behaviorInsights.userId, userId),
          eq(behaviorInsights.status, "active"),
        ),
      )
      .returning(managementColumns);
    return row ?? null;
  },

  // Soft-delete: flip status to dismissed so the coach and discovery stop seeing it.
  dismiss: async (userId: string, id: string): Promise<BehaviorInsightRow | null> => {
    const [row] = await db
      .update(behaviorInsights)
      .set({ status: "dismissed" as const })
      .where(
        and(
          eq(behaviorInsights.id, id),
          eq(behaviorInsights.userId, userId),
          eq(behaviorInsights.status, "active"),
        ),
      )
      .returning(managementColumns);
    return row ?? null;
  },
};
