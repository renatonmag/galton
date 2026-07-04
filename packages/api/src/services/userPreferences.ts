import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { userPreferences } from "../db/schema.js";

export const userPreferencesService = {
  get: async (userId: string) => {
    const rows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return rows[0] ?? null;
  },

  upsert: async (userId: string, notificationTime: string) => {
    const rows = await db
      .insert(userPreferences)
      .values({ userId, notificationTime })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { notificationTime, updatedAt: new Date() },
      })
      .returning();
    return rows[0];
  },
};
