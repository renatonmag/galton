import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { logEntries, logEntryCharacteristics, sessions } from "../db/schema.js";

type CharacteristicInput = { characteristicId: string; value: string };

const logEntryColumns = {
  id: logEntries.id,
  sessionId: logEntries.sessionId,
  setupId: logEntries.setupId,
  decision: logEntries.decision,
  result: logEntries.result,
  profit: logEntries.profit,
  loss: logEntries.loss,
  comment: logEntries.comment,
  createdAt: logEntries.createdAt,
};

export const logEntriesService = {
  list: async (sessionId: string, userId: string) => {
    const owned = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    if (!owned[0]) return undefined;

    return db
      .select(logEntryColumns)
      .from(logEntries)
      .where(eq(logEntries.sessionId, sessionId));
  },

  get: async (id: string, userId: string) => {
    const rows = await db
      .select(logEntryColumns)
      .from(logEntries)
      .innerJoin(sessions, eq(logEntries.sessionId, sessions.id))
      .where(and(eq(logEntries.id, id), eq(sessions.userId, userId)));
    return rows[0];
  },

  create: async (
    sessionId: string,
    userId: string,
    data: {
      setupId: string;
      decision: "TRADE" | "NO_TRADE";
      result?: "success" | "failure";
      profit?: string;
      loss?: string;
      comment?: string;
      characteristics?: CharacteristicInput[];
    },
  ) => {
    const owned = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    if (!owned[0]) return undefined;

    return db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(logEntries)
        .values({
          sessionId,
          setupId: data.setupId,
          decision: data.decision,
          result: data.result,
          profit: data.profit,
          loss: data.loss,
          comment: data.comment,
        })
        .returning();

      if (data.characteristics?.length) {
        await tx.insert(logEntryCharacteristics).values(
          data.characteristics.map((c) => ({
            logEntryId: entry.id,
            characteristicId: c.characteristicId,
            value: c.value,
          })),
        );
      }

      return entry;
    });
  },

  update: async (
    id: string,
    userId: string,
    data: {
      result?: "success" | "failure" | null;
      profit?: string | null;
      loss?: string | null;
      comment?: string | null;
      createdAt?: string;
      characteristics?: CharacteristicInput[];
    },
  ) => {
    const existing = await logEntriesService.get(id, userId);
    if (!existing) return undefined;

    return db.transaction(async (tx) => {
      const [entry] = await tx
        .update(logEntries)
        .set({
          ...(data.result !== undefined && { result: data.result }),
          ...(data.profit !== undefined && { profit: data.profit }),
          ...(data.loss !== undefined && { loss: data.loss }),
          ...(data.comment !== undefined && { comment: data.comment }),
          ...(data.createdAt !== undefined && { createdAt: new Date(data.createdAt) }),
        })
        .where(eq(logEntries.id, id))
        .returning();

      if (data.characteristics !== undefined) {
        await tx
          .delete(logEntryCharacteristics)
          .where(eq(logEntryCharacteristics.logEntryId, id));

        if (data.characteristics.length) {
          await tx.insert(logEntryCharacteristics).values(
            data.characteristics.map((c) => ({
              logEntryId: id,
              characteristicId: c.characteristicId,
              value: c.value,
            })),
          );
        }
      }

      return entry;
    });
  },
};
