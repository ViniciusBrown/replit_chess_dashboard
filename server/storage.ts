import { 
  users, type User, type InsertUser, 
  linkedAccounts, type LinkedAccount, type InsertLinkedAccount,
  games, type Game, type InsertGame,
  analysisResults, type AnalysisResult, type InsertAnalysisResult
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Linked accounts
  getLinkedAccounts(userId: number): Promise<LinkedAccount[]>;
  getLinkedAccount(id: number): Promise<LinkedAccount | undefined>;
  getLinkedAccountByPlatform(userId: number, platform: string): Promise<LinkedAccount | undefined>;
  createLinkedAccount(account: InsertLinkedAccount): Promise<LinkedAccount>;
  deleteLinkedAccount(id: number): Promise<boolean>;

  // Games
  getGames(userId: number, limit?: number, offset?: number): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Analysis results
  getAnalysisResults(gameId: number): Promise<AnalysisResult[]>;
  getAnalysisResult(gameId: number, pipeline: string): Promise<AnalysisResult | undefined>;
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  deleteAnalysisResult(id: number): Promise<boolean>;
  deleteAnalysisResultsByGameId(gameId: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Using any type to avoid compatibility issues with session.Store
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private linkedAccounts: Map<number, LinkedAccount>;
  private games: Map<number, Game>;
  private analysisResults: Map<number, AnalysisResult>;
  
  private userIdCounter: number;
  private linkedAccountIdCounter: number;
  private gameIdCounter: number;
  private analysisResultIdCounter: number;
  
  sessionStore: any; // Match IStorage interface

  constructor() {
    this.users = new Map();
    this.linkedAccounts = new Map();
    this.games = new Map();
    this.analysisResults = new Map();
    
    this.userIdCounter = 1;
    this.linkedAccountIdCounter = 1;
    this.gameIdCounter = 1;
    this.analysisResultIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      dateJoined: now
    };
    this.users.set(id, user);
    return user;
  }

  // Linked accounts methods
  async getLinkedAccounts(userId: number): Promise<LinkedAccount[]> {
    return Array.from(this.linkedAccounts.values()).filter(
      account => account.userId === userId
    );
  }

  async getLinkedAccount(id: number): Promise<LinkedAccount | undefined> {
    return this.linkedAccounts.get(id);
  }

  async getLinkedAccountByPlatform(userId: number, platform: string): Promise<LinkedAccount | undefined> {
    return Array.from(this.linkedAccounts.values()).find(
      account => account.userId === userId && account.platform === platform
    );
  }

  async createLinkedAccount(insertAccount: InsertLinkedAccount): Promise<LinkedAccount> {
    const id = this.linkedAccountIdCounter++;
    const now = new Date();
    const account: LinkedAccount = {
      ...insertAccount,
      id,
      dateLinked: now
    };
    this.linkedAccounts.set(id, account);
    return account;
  }

  async deleteLinkedAccount(id: number): Promise<boolean> {
    return this.linkedAccounts.delete(id);
  }

  // Games methods
  async getGames(userId: number, limit?: number, offset = 0): Promise<Game[]> {
    const userGames = Array.from(this.games.values())
      .filter(game => game.userId === userId)
      .sort((a, b) => {
        if (!a.datePlayed || !b.datePlayed) return 0;
        return b.datePlayed.getTime() - a.datePlayed.getTime();
      });
    
    if (limit !== undefined) {
      return userGames.slice(offset, offset + limit);
    }
    
    return userGames;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    const now = new Date();
    const game: Game = {
      ...insertGame,
      id,
      importedAt: now
    };
    this.games.set(id, game);
    return game;
  }

  // Analysis results methods
  async getAnalysisResults(gameId: number): Promise<AnalysisResult[]> {
    return Array.from(this.analysisResults.values())
      .filter(result => result.gameId === gameId);
  }

  async getAnalysisResult(gameId: number, pipeline: string): Promise<AnalysisResult | undefined> {
    return Array.from(this.analysisResults.values())
      .find(result => result.gameId === gameId && result.pipeline === pipeline);
  }

  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const id = this.analysisResultIdCounter++;
    const now = new Date();
    const result: AnalysisResult = {
      ...insertResult,
      id,
      createdAt: now
    };
    this.analysisResults.set(id, result);
    return result;
  }
  
  async deleteAnalysisResult(id: number): Promise<boolean> {
    return this.analysisResults.delete(id);
  }
  
  async deleteAnalysisResultsByGameId(gameId: number): Promise<boolean> {
    const results = Array.from(this.analysisResults.values())
      .filter(result => result.gameId === gameId);
    
    for (const result of results) {
      this.analysisResults.delete(result.id);
    }
    
    return true;
  }
}

// Import our new DatabaseStorage
import { DatabaseStorage } from './db-storage';

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
