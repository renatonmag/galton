import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions } from "../db/schema.js";

export const sessionsService = {
  list: (userId: string) =>
    db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(sql`${sessions.closedAt} NULLS FIRST`, desc(sessions.openedAt)),

  get: async (id: string, userId: string) => {
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
    return rows[0];
  },

  create: async (userId: string) => {
    const name = new Date().toISOString().slice(0, 10);
    const rows = await db.insert(sessions).values({ userId, name }).returning();
    return rows[0];
  },

  close: async (id: string, userId: string) => {
    const existing = await sessionsService.get(id, userId);
    if (!existing) return undefined;
    const rows = await db
      .update(sessions)
      .set({ closedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return rows[0];
  },

  delete: async (id: string, userId: string) => {
    const rows = await db
      .delete(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return rows[0];
  },
};
