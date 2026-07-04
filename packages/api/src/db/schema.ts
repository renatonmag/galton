import { numeric, pgEnum, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const decisionEnum = pgEnum("decision", ["TRADE", "NO_TRADE"]);
export const resultEnum = pgEnum("result", ["open", "profit", "loss", "breakeven"]);
export const directionEnum = pgEnum("direction", ["buy", "sell"]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  notificationTime: time("notification_time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tradeEntries = pgTable("trade_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  decision: decisionEnum("decision").notNull(),
  result: resultEnum("result").notNull().default("open"),
  direction: directionEnum("direction"),
  r: text("r").notNull(),
  successRatio: numeric("success_ratio", { precision: 5, scale: 4 }).notNull(),
  entryAt: timestamp("entry_at", { withTimezone: true }),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ many }) => ({
  tradeEntries: many(tradeEntries),
}));

export const tradeEntriesRelations = relations(tradeEntries, ({ one }) => ({
  session: one(sessions, { fields: [tradeEntries.sessionId], references: [sessions.id] }),
}));
