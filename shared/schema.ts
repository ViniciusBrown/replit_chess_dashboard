import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  dateJoined: timestamp("date_joined").defaultNow().notNull(),
});

export const linkedAccounts = pgTable("linked_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // "lichess" or "chess.com"
  username: text("username").notNull(),
  oauthToken: text("oauth_token"),
  dateLinked: timestamp("date_linked").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // "lichess", "chess.com", or "manual"
  pgn: text("pgn").notNull(),
  datePlayed: timestamp("date_played"),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
});

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  pipeline: text("pipeline").notNull(), // "game", "tactics", "openings", "fundamentals"
  resultJson: json("result_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, dateJoined: true });

export const insertLinkedAccountSchema = createInsertSchema(linkedAccounts)
  .omit({ id: true, dateLinked: true });

export const insertGameSchema = createInsertSchema(games)
  .omit({ id: true, importedAt: true });

export const insertAnalysisResultSchema = createInsertSchema(analysisResults)
  .omit({ id: true, createdAt: true });

// Custom schemas for validation
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type InsertLinkedAccount = z.infer<typeof insertLinkedAccountSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
