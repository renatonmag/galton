import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { characteristics, setups, strategies } from "../db/schema.js";

const characteristicColumns = {
  id: characteristics.id,
  setupId: characteristics.setupId,
  name: characteristics.name,
  type: characteristics.type,
  options: characteristics.options,
  position: characteristics.position,
  createdAt: characteristics.createdAt,
};

export const characteristicsService = {
  list: (setupId: string, strategyId: string, userId: string) =>
    db
      .select(characteristicColumns)
      .from(characteristics)
      .innerJoin(setups, eq(characteristics.setupId, setups.id))
      .innerJoin(strategies, eq(setups.strategyId, strategies.id))
      .where(
        and(
          eq(characteristics.setupId, setupId),
          eq(setups.strategyId, strategyId),
          eq(strategies.userId, userId),
        ),
      ),

  get: async (id: string, setupId: string, strategyId: string, userId: string) => {
    const rows = await db
      .select(characteristicColumns)
      .from(characteristics)
      .innerJoin(setups, eq(characteristics.setupId, setups.id))
      .innerJoin(strategies, eq(setups.strategyId, strategies.id))
      .where(
        and(
          eq(characteristics.id, id),
          eq(characteristics.setupId, setupId),
          eq(setups.strategyId, strategyId),
          eq(strategies.userId, userId),
        ),
      );
    return rows[0];
  },

  create: async (
    setupId: string,
    strategyId: string,
    userId: string,
    data: {
      name: string;
      type: "boolean" | "multiple_choice";
      options?: string[];
      position: number;
    },
  ) => {
    const owned = await db
      .select({ id: setups.id })
      .from(setups)
      .innerJoin(strategies, eq(setups.strategyId, strategies.id))
      .where(
        and(
          eq(setups.id, setupId),
          eq(setups.strategyId, strategyId),
          eq(strategies.userId, userId),
        ),
      );
    if (!owned[0]) return undefined;

    const rows = await db
      .insert(characteristics)
      .values({ setupId, ...data })
      .returning();
    return rows[0];
  },

  update: async (
    id: string,
    setupId: string,
    strategyId: string,
    userId: string,
    data: {
      name?: string;
      type?: "boolean" | "multiple_choice";
      options?: string[];
      position?: number;
    },
  ) => {
    const existing = await characteristicsService.get(id, setupId, strategyId, userId);
    if (!existing) return undefined;

    const rows = await db
      .update(characteristics)
      .set(data)
      .where(eq(characteristics.id, id))
      .returning();
    return rows[0];
  },

  remove: async (id: string, setupId: string, strategyId: string, userId: string) => {
    const existing = await characteristicsService.get(id, setupId, strategyId, userId);
    if (!existing) return false;
    await db.delete(characteristics).where(eq(characteristics.id, id));
    return true;
  },
};
