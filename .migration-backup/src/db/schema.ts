import { pgTable, text } from "drizzle-orm/pg-core";

/**
 * Key-Value Store Table
 *
 * Built-in table for simple key-value storage.
 * Available immediately without schema changes.
 *
 * ⚠️ CRITICAL: DO NOT DELETE OR EDIT THIS TABLE DEFINITION ⚠️
 * This table is required for the app to function properly.
 * DO NOT delete, modify, rename, or change any part of this table.
 * Removing or editing it will cause database schema conflicts and prevent
 * the app from starting.
 *
 * Use for:
 * - User preferences/settings
 * - App configuration
 * - Simple counters
 * - Temporary data
 */
export const kv = pgTable("kv", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * Add your custom tables below this line
 *
 * Example:
 *
 * export const gameScores = pgTable("game_scores", {
 *   id: uuid("id").primaryKey().defaultRandom(),
 *   fid: integer("fid").notNull(),
 *   score: integer("score").notNull(),
 *   username: text("username").notNull(),
 *   createdAt: timestamp("created_at").defaultNow().notNull()
 * });
 */
