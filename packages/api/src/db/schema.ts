import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const characteristicTypeEnum = pgEnum("characteristic_type", [
  "boolean",
  "multiple_choice",
]);

export const decisionEnum = pgEnum("decision", ["TRADE", "NO_TRADE"]);
export const resultEnum = pgEnum("result", ["success", "failure"]);

export const strategies = pgTable("strategies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const setups = pgTable("setups", {
  id: uuid("id").primaryKey().defaultRandom(),
  strategyId: uuid("strategy_id")
    .notNull()
    .references(() => strategies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const characteristics = pgTable("characteristics", {
  id: uuid("id").primaryKey().defaultRandom(),
  setupId: uuid("setup_id")
    .notNull()
    .references(() => setups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: characteristicTypeEnum("type").notNull(),
  options: text("options").array(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const logEntries = pgTable("log_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  setupId: uuid("setup_id")
    .notNull()
    .references(() => setups.id, { onDelete: "cascade" }),
  decision: decisionEnum("decision").notNull(),
  result: resultEnum("result"),
  profit: numeric("profit", { precision: 12, scale: 2 }),
  loss: numeric("loss", { precision: 12, scale: 2 }),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const logEntryCharacteristics = pgTable("log_entry_characteristics", {
  logEntryId: uuid("log_entry_id")
    .notNull()
    .references(() => logEntries.id, { onDelete: "cascade" }),
  characteristicId: uuid("characteristic_id")
    .notNull()
    .references(() => characteristics.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
});

export const strategiesRelations = relations(strategies, ({ many }) => ({
  setups: many(setups),
}));

export const setupsRelations = relations(setups, ({ one, many }) => ({
  strategy: one(strategies, { fields: [setups.strategyId], references: [strategies.id] }),
  characteristics: many(characteristics),
  logEntries: many(logEntries),
}));

export const characteristicsRelations = relations(characteristics, ({ one }) => ({
  setup: one(setups, { fields: [characteristics.setupId], references: [setups.id] }),
}));

export const sessionsRelations = relations(sessions, ({ many }) => ({
  logEntries: many(logEntries),
}));

export const logEntriesRelations = relations(logEntries, ({ one, many }) => ({
  session: one(sessions, { fields: [logEntries.sessionId], references: [sessions.id] }),
  setup: one(setups, { fields: [logEntries.setupId], references: [setups.id] }),
  characteristics: many(logEntryCharacteristics),
}));

export const logEntryCharacteristicsRelations = relations(logEntryCharacteristics, ({ one }) => ({
  logEntry: one(logEntries, {
    fields: [logEntryCharacteristics.logEntryId],
    references: [logEntries.id],
  }),
  characteristic: one(characteristics, {
    fields: [logEntryCharacteristics.characteristicId],
    references: [characteristics.id],
  }),
}));
