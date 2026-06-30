import { numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const decisionEnum = pgEnum("decision", ["TRADE", "NO_TRADE"]);
export const resultEnum = pgEnum("result", ["open", "profit", "loss", "breakeven"]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tradeEntries = pgTable("trade_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  decision: decisionEnum("decision").notNull(),
  result: resultEnum("result").notNull().default("open"),
  r: text("r").notNull(),
  successRatio: numeric("success_ratio", { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ many }) => ({
  tradeEntries: many(tradeEntries),
}));

export const tradeEntriesRelations = relations(tradeEntries, ({ one }) => ({
  session: one(sessions, { fields: [tradeEntries.sessionId], references: [sessions.id] }),
}));
