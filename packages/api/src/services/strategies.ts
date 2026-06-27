import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { strategies } from "../db/schema.js";

export const strategiesService = {
  list: (userId: string) =>
    db.select().from(strategies).where(eq(strategies.userId, userId)),

  get: async (id: string, userId: string) => {
    const rows = await db
      .select()
      .from(strategies)
      .where(and(eq(strategies.id, id), eq(strategies.userId, userId)));
    return rows[0];
  },

  create: async (userId: string, name: string) => {
    const rows = await db
      .insert(strategies)
      .values({ userId, name })
      .returning();
    return rows[0];
  },

  update: async (id: string, userId: string, name: string) => {
    const rows = await db
      .update(strategies)
      .set({ name })
      .where(and(eq(strategies.id, id), eq(strategies.userId, userId)))
      .returning();
    return rows[0];
  },

  remove: (id: string, userId: string) =>
    db
      .delete(strategies)
      .where(and(eq(strategies.id, id), eq(strategies.userId, userId))),
};
