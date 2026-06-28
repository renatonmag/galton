import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { setups, strategies } from "../db/schema.js";

const setupColumns = {
  id: setups.id,
  strategyId: setups.strategyId,
  name: setups.name,
  description: setups.description,
  createdAt: setups.createdAt,
};

export const setupsService = {
  list: (strategyId: string, userId: string) =>
    db
      .select(setupColumns)
      .from(setups)
      .innerJoin(strategies, eq(setups.strategyId, strategies.id))
      .where(and(eq(setups.strategyId, strategyId), eq(strategies.userId, userId))),

  get: async (id: string, strategyId: string, userId: string) => {
    const rows = await db
      .select(setupColumns)
      .from(setups)
      .innerJoin(strategies, eq(setups.strategyId, strategies.id))
      .where(
        and(
          eq(setups.id, id),
          eq(setups.strategyId, strategyId),
          eq(strategies.userId, userId),
        ),
      );
    return rows[0];
  },

  create: async (
    strategyId: string,
    userId: string,
    name: string,
    description?: string,
  ) => {
    const owned = await db
      .select({ id: strategies.id })
      .from(strategies)
      .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)));
    if (!owned[0]) return undefined;

    const rows = await db
      .insert(setups)
      .values({ strategyId, name, description })
      .returning();
    return rows[0];
  },

  update: async (
    id: string,
    strategyId: string,
    userId: string,
    data: { name?: string; description?: string },
  ) => {
    const existing = await setupsService.get(id, strategyId, userId);
    if (!existing) return undefined;

    const rows = await db
      .update(setups)
      .set(data)
      .where(eq(setups.id, id))
      .returning();
    return rows[0];
  },

  remove: async (id: string, strategyId: string, userId: string) => {
    const existing = await setupsService.get(id, strategyId, userId);
    if (!existing) return false;
    await db.delete(setups).where(eq(setups.id, id));
    return true;
  },
};
