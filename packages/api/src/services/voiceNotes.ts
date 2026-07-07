import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, voiceNotes } from "../db/schema.js";

export const voiceNotesService = {
  list: async (sessionId: string, userId: string) => {
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    if (!session[0]) return null;

    return db
      .select()
      .from(voiceNotes)
      .where(eq(voiceNotes.sessionId, sessionId))
      .orderBy(voiceNotes.createdAt);
  },

  create: async (sessionId: string, userId: string, transcript: string) => {
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    if (!session[0]) return null;

    const rows = await db.insert(voiceNotes).values({ sessionId, transcript }).returning();
    return rows[0];
  },

  remove: async (id: string, userId: string) => {
    const existing = await db
      .select()
      .from(voiceNotes)
      .innerJoin(sessions, eq(voiceNotes.sessionId, sessions.id))
      .where(and(eq(voiceNotes.id, id), eq(sessions.userId, userId)));
    if (!existing[0]) return null;

    const rows = await db.delete(voiceNotes).where(eq(voiceNotes.id, id)).returning();
    return rows[0];
  },
};
