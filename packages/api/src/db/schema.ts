import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const characteristicTypeEnum = pgEnum("characteristic_type", [
  "boolean",
  "multiple_choice",
]);

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

export const strategiesRelations = relations(strategies, ({ many }) => ({
  setups: many(setups),
}));

export const setupsRelations = relations(setups, ({ one, many }) => ({
  strategy: one(strategies, { fields: [setups.strategyId], references: [strategies.id] }),
  characteristics: many(characteristics),
}));

export const characteristicsRelations = relations(characteristics, ({ one }) => ({
  setup: one(setups, { fields: [characteristics.setupId], references: [setups.id] }),
}));
