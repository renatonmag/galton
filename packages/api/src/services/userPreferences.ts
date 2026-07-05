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

  upsert: async (
    userId: string,
    data: { notificationTime?: string; timezone?: string },
  ) => {
    const rows = await db
      .insert(userPreferences)
      .values({
        userId,
        ...(data.notificationTime !== undefined && { notificationTime: data.notificationTime }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...(data.notificationTime !== undefined && { notificationTime: data.notificationTime }),
          ...(data.timezone !== undefined && { timezone: data.timezone }),
          updatedAt: new Date(),
        },
      })
      .returning();
    return rows[0];
  },
};
