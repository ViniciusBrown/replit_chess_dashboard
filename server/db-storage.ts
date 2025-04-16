import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, desc } from "drizzle-orm";
import { 
  users, type User, type InsertUser, 
  linkedAccounts, type LinkedAccount, type InsertLinkedAccount,
  games, type Game, type InsertGame,
  analysisResults, type AnalysisResult, type InsertAnalysisResult
} from "@shared/schema";
import { pool, db } from "./db";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to work around type issues
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        dateJoined: new Date()
      })
      .returning();
    return user;
  }
  
  // Linked accounts methods
  async getLinkedAccounts(userId: number): Promise<LinkedAccount[]> {
    return await db
      .select()
      .from(linkedAccounts)
      .where(eq(linkedAccounts.userId, userId));
  }
  
  async getLinkedAccount(id: number): Promise<LinkedAccount | undefined> {
    const [account] = await db
      .select()
      .from(linkedAccounts)
      .where(eq(linkedAccounts.id, id));
    return account;
  }
  
  async getLinkedAccountByPlatform(userId: number, platform: string): Promise<LinkedAccount | undefined> {
    const [account] = await db
      .select()
      .from(linkedAccounts)
      .where(
        and(
          eq(linkedAccounts.userId, userId),
          eq(linkedAccounts.platform, platform)
        )
      );
    return account;
  }
  
  async createLinkedAccount(insertAccount: InsertLinkedAccount): Promise<LinkedAccount> {
    const [account] = await db
      .insert(linkedAccounts)
      .values({
        ...insertAccount,
        dateLinked: new Date()
      })
      .returning();
    return account;
  }
  
  async deleteLinkedAccount(id: number): Promise<boolean> {
    const result = await db
      .delete(linkedAccounts)
      .where(eq(linkedAccounts.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Games methods
  async getGames(userId: number, limit?: number, offset = 0): Promise<Game[]> {
    let query = db
      .select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.importedAt));
    
    if (limit !== undefined) {
      query = query.limit(limit).offset(offset);
    }
    
    return await query;
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, id));
    return game;
  }
  
  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values({
        ...insertGame,
        importedAt: new Date()
      })
      .returning();
    return game;
  }
  
  // Analysis results methods
  async getAnalysisResults(gameId: number): Promise<AnalysisResult[]> {
    return await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.gameId, gameId));
  }
  
  async getAnalysisResult(gameId: number, pipeline: string): Promise<AnalysisResult | undefined> {
    const [result] = await db
      .select()
      .from(analysisResults)
      .where(
        and(
          eq(analysisResults.gameId, gameId),
          eq(analysisResults.pipeline, pipeline)
        )
      );
    return result;
  }
  
  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const [result] = await db
      .insert(analysisResults)
      .values({
        ...insertResult,
        createdAt: new Date()
      })
      .returning();
    return result;
  }
  
  async deleteAnalysisResult(id: number): Promise<boolean> {
    const result = await db
      .delete(analysisResults)
      .where(eq(analysisResults.id, id))
      .returning();
    return result.length > 0;
  }
  
  async deleteAnalysisResultsByGameId(gameId: number): Promise<boolean> {
    const result = await db
      .delete(analysisResults)
      .where(eq(analysisResults.gameId, gameId))
      .returning();
    return result.length > 0;
  }
}