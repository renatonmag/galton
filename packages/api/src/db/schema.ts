import {
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const decisionEnum = pgEnum("decision", ["TRADE", "NO_TRADE"]);
export const resultEnum = pgEnum("result", ["open", "profit", "loss", "breakeven"]);
export const directionEnum = pgEnum("direction", ["buy", "sell"]);
export const behaviorInsightStatusEnum = pgEnum("behavior_insight_status", ["active", "dismissed", "emergent"]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reinforceProcessed: timestamp("reinforce_processed", { withTimezone: true }),
  newInsightsProcessed: timestamp("new_insights_processed", { withTimezone: true }),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  notificationTime: time("notification_time"),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ImprovementPoint = { pattern: string; description: string; action: string };
export type StrengthPoint = { pattern: string; description: string; whyItMatters: string };

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

export const voiceNotes = pgTable("voice_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  tradeEntryId: uuid("trade_entry_id").references(() => tradeEntries.id, { onDelete: "set null" }),
  transcript: text("transcript").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dailyReports = pgTable(
  "daily_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    reportDate: date("report_date").notNull(),
    historicRatio: numeric("historic_ratio", { precision: 5, scale: 4 }),
    weekRatio: numeric("week_ratio", { precision: 5, scale: 4 }),
    openCount: integer("open_count").notNull(),
    improvements: jsonb("improvements").$type<ImprovementPoint[]>().notNull().default([]),
    strengths: jsonb("strengths").$type<StrengthPoint[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("daily_reports_user_id_report_date_unique").on(table.userId, table.reportDate)],
);

export const behaviorInsights = pgTable("behavior_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  text: text("text").notNull(),
  evidenceCount: integer("evidence_count").notNull().default(0),
  evidenceQuotes: text("evidence_quotes").array().notNull().default([]),
  firstSeen: timestamp("first_seen", { withTimezone: true }).defaultNow().notNull(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow().notNull(),
  status: behaviorInsightStatusEnum("status").notNull().default("active"),
});

export const sessionsRelations = relations(sessions, ({ many }) => ({
  tradeEntries: many(tradeEntries),
  voiceNotes: many(voiceNotes),
}));

export const tradeEntriesRelations = relations(tradeEntries, ({ one }) => ({
  session: one(sessions, { fields: [tradeEntries.sessionId], references: [sessions.id] }),
}));

export const voiceNotesRelations = relations(voiceNotes, ({ one }) => ({
  session: one(sessions, { fields: [voiceNotes.sessionId], references: [sessions.id] }),
  tradeEntry: one(tradeEntries, { fields: [voiceNotes.tradeEntryId], references: [tradeEntries.id] }),
}));
