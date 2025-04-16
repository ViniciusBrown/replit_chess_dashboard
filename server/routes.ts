import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { lichessApi, chessComApi } from "./chess-api";
import { extractBasicInfo } from "./pgn-parser";
import { chessAnalyzer } from "./analysis";
import { 
  insertLinkedAccountSchema, 
  insertGameSchema, 
  insertAnalysisResultSchema 
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Get user's linked accounts
  app.get("/api/linked-accounts", isAuthenticated, async (req, res) => {
    try {
      const accounts = await storage.getLinkedAccounts(req.user!.id);
      res.json(accounts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch linked accounts" });
    }
  });
  
  // Link a Lichess account (OAuth)
  app.get("/api/oauth/lichess", isAuthenticated, async (req, res) => {
    const authUrl = await lichessApi.getOAuthUrl();
    res.json({ url: authUrl });
  });
  
  // Lichess OAuth callback
  app.get("/api/oauth/lichess/callback", isAuthenticated, async (req, res) => {
    const code = req.query.code as string;
    
    if (!code) {
      return res.status(400).json({ message: "Authorization code required" });
    }
    
    try {
      // Exchange code for token
      const [token, tokenError] = await lichessApi.exchangeCodeForToken(code);
      
      if (tokenError || !token) {
        return res.status(500).json({ message: "Failed to obtain access token" });
      }
      
      // Get account info from Lichess
      const [accountInfo, accountError] = await lichessApi.getAccountInfo(token);
      
      if (accountError || !accountInfo) {
        return res.status(500).json({ message: "Failed to fetch account information" });
      }
      
      // Check if this account is already linked
      const existingAccount = await storage.getLinkedAccountByPlatform(req.user!.id, "lichess");
      
      if (existingAccount) {
        // Update existing account with new token
        await storage.deleteLinkedAccount(existingAccount.id);
      }
      
      // Create new linked account
      const linkedAccount = await storage.createLinkedAccount({
        userId: req.user!.id,
        platform: "lichess",
        username: accountInfo.username,
        oauthToken: token
      });
      
      // Redirect to the frontend dashboard
      res.redirect("/dashboard");
    } catch (err) {
      console.error("Lichess OAuth error:", err);
      res.status(500).json({ message: "Failed to link Lichess account" });
    }
  });
  
  // Link a Chess.com account (just username, no OAuth)
  app.post("/api/linked-accounts/chess.com", isAuthenticated, async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Verify the username exists on Chess.com
      const [profile, profileError] = await chessComApi.getPlayerProfile(username);
      
      if (profileError || !profile) {
        return res.status(400).json({ message: "Username not found on Chess.com" });
      }
      
      // Check if this account is already linked
      const existingAccount = await storage.getLinkedAccountByPlatform(req.user!.id, "chess.com");
      
      if (existingAccount) {
        // Delete existing account first
        await storage.deleteLinkedAccount(existingAccount.id);
      }
      
      // Parse and validate the linked account data
      const linkedAccountData = insertLinkedAccountSchema.parse({
        userId: req.user!.id,
        platform: "chess.com",
        username: username,
        oauthToken: null
      });
      
      // Create new linked account
      const linkedAccount = await storage.createLinkedAccount(linkedAccountData);
      
      res.status(201).json(linkedAccount);
    } catch (err) {
      console.error("Chess.com account linking error:", err);
      
      if (err instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      
      res.status(500).json({ message: "Failed to link Chess.com account" });
    }
  });
  
  // Unlink an account
  app.delete("/api/linked-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      // Check if the account belongs to the current user
      const account = await storage.getLinkedAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      if (account.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Delete the account
      await storage.deleteLinkedAccount(accountId);
      
      res.status(200).json({ message: "Account unlinked successfully" });
    } catch (err) {
      console.error("Account unlinking error:", err);
      res.status(500).json({ message: "Failed to unlink account" });
    }
  });
  
  // Import games from Lichess
  app.post("/api/import/lichess", isAuthenticated, async (req, res) => {
    try {
      // Get the linked Lichess account
      const linkedAccount = await storage.getLinkedAccountByPlatform(req.user!.id, "lichess");
      
      if (!linkedAccount) {
        return res.status(400).json({ message: "No Lichess account linked" });
      }
      
      // Get the token
      const token = linkedAccount.oauthToken;
      
      if (!token) {
        return res.status(400).json({ message: "Missing OAuth token for Lichess" });
      }
      
      // Fetch games from Lichess
      const [games, gamesError] = await lichessApi.getUserGames(linkedAccount.username, token);
      
      if (gamesError || !games) {
        return res.status(500).json({ message: "Failed to fetch games from Lichess" });
      }
      
      // Import each game into our system
      const importedGames = [];
      
      for (const game of games) {
        // Extract PGN
        const pgn = game.pgn;
        
        // Skip if no PGN
        if (!pgn) continue;
        
        // Extract basic info to get the date
        const gameInfo = extractBasicInfo(pgn);
        
        // Create game record
        const gameData = insertGameSchema.parse({
          userId: req.user!.id,
          platform: "lichess",
          pgn: pgn,
          datePlayed: gameInfo.date
        });
        
        const importedGame = await storage.createGame(gameData);
        importedGames.push(importedGame);
        
        // Run analysis on the game (but don't wait for it)
        chessAnalyzer.analyzePgn(pgn, linkedAccount.username)
          .then(analysisResults => {
            // Store each analysis pipeline result
            Promise.all([
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "game",
                resultJson: analysisResults.game
              }),
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "tactics",
                resultJson: analysisResults.tactics
              }),
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "openings",
                resultJson: analysisResults.openings
              }),
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "fundamentals",
                resultJson: analysisResults.fundamentals
              })
            ]).catch(err => {
              console.error("Error storing analysis results:", err);
            });
          })
          .catch(err => {
            console.error("Error analyzing game:", err);
          });
      }
      
      res.status(200).json({ 
        message: "Games imported successfully", 
        count: importedGames.length,
        games: importedGames
      });
    } catch (err) {
      console.error("Lichess game import error:", err);
      
      if (err instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      
      res.status(500).json({ message: "Failed to import games from Lichess" });
    }
  });
  
  // Import games from Chess.com
  app.post("/api/import/chess.com", isAuthenticated, async (req, res) => {
    try {
      // Get the linked Chess.com account
      const linkedAccount = await storage.getLinkedAccountByPlatform(req.user!.id, "chess.com");
      
      if (!linkedAccount) {
        return res.status(400).json({ message: "No Chess.com account linked" });
      }
      
      // Get games from Chess.com (using year/month if provided)
      const year = req.body.year ? parseInt(req.body.year) : undefined;
      const month = req.body.month ? parseInt(req.body.month) : undefined;
      
      const [games, gamesError] = await chessComApi.getUserGames(linkedAccount.username, year, month);
      
      if (gamesError || !games) {
        return res.status(500).json({ message: "Failed to fetch games from Chess.com" });
      }
      
      // Import each game into our system
      const importedGames = [];
      
      for (const game of games) {
        // Extract PGN
        const pgn = game.pgn;
        
        // Skip if no PGN
        if (!pgn) continue;
        
        // Extract basic info to get the date
        const gameInfo = extractBasicInfo(pgn);
        
        // Create game record
        const gameData = insertGameSchema.parse({
          userId: req.user!.id,
          platform: "chess.com",
          pgn: pgn,
          datePlayed: gameInfo.date
        });
        
        const importedGame = await storage.createGame(gameData);
        importedGames.push(importedGame);
        
        // Run analysis on the game (but don't wait for it)
        chessAnalyzer.analyzePgn(pgn, linkedAccount.username)
          .then(analysisResults => {
            // Store each analysis pipeline result
            Promise.all([
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "game",
                resultJson: analysisResults.game
              }),
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "tactics",
                resultJson: analysisResults.tactics
              }),
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "openings",
                resultJson: analysisResults.openings
              }),
              storage.createAnalysisResult({
                gameId: importedGame.id,
                pipeline: "fundamentals",
                resultJson: analysisResults.fundamentals
              })
            ]).catch(err => {
              console.error("Error storing analysis results:", err);
            });
          })
          .catch(err => {
            console.error("Error analyzing game:", err);
          });
      }
      
      res.status(200).json({ 
        message: "Games imported successfully", 
        count: importedGames.length,
        games: importedGames
      });
    } catch (err) {
      console.error("Chess.com game import error:", err);
      
      if (err instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      
      res.status(500).json({ message: "Failed to import games from Chess.com" });
    }
  });
  
  // Upload a PGN file manually
  app.post("/api/import/pgn", isAuthenticated, async (req, res) => {
    try {
      const { pgn } = req.body;
      
      if (!pgn) {
        return res.status(400).json({ message: "PGN is required" });
      }
      
      // Extract basic info
      const gameInfo = extractBasicInfo(pgn);
      
      // Create game record
      const gameData = insertGameSchema.parse({
        userId: req.user!.id,
        platform: "manual",
        pgn: pgn,
        datePlayed: gameInfo.date
      });
      
      const importedGame = await storage.createGame(gameData);
      
      // Determine the username to use for analysis
      const username = req.user!.username;
      
      // Run analysis on the game (but don't wait for it)
      chessAnalyzer.analyzePgn(pgn, username)
        .then(analysisResults => {
          // Store each analysis pipeline result
          Promise.all([
            storage.createAnalysisResult({
              gameId: importedGame.id,
              pipeline: "game",
              resultJson: analysisResults.game
            }),
            storage.createAnalysisResult({
              gameId: importedGame.id,
              pipeline: "tactics",
              resultJson: analysisResults.tactics
            }),
            storage.createAnalysisResult({
              gameId: importedGame.id,
              pipeline: "openings",
              resultJson: analysisResults.openings
            }),
            storage.createAnalysisResult({
              gameId: importedGame.id,
              pipeline: "fundamentals",
              resultJson: analysisResults.fundamentals
            })
          ]).catch(err => {
            console.error("Error storing analysis results:", err);
          });
        })
        .catch(err => {
          console.error("Error analyzing game:", err);
        });
      
      res.status(200).json({ 
        message: "Game imported successfully", 
        game: importedGame
      });
    } catch (err) {
      console.error("Manual PGN import error:", err);
      
      if (err instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      
      res.status(500).json({ message: "Failed to import PGN" });
    }
  });
  
  // Get user's games
  app.get("/api/games", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const games = await storage.getGames(req.user!.id, limit, offset);
      res.json(games);
    } catch (err) {
      console.error("Game retrieval error:", err);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });
  
  // Get a specific game with its analysis results
  app.get("/api/games/:id", isAuthenticated, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get analysis results for the game
      const analysisResults = await storage.getAnalysisResults(gameId);
      
      // Format the response
      const formattedResults: Record<string, any> = {};
      
      for (const result of analysisResults) {
        formattedResults[result.pipeline] = result.resultJson;
      }
      
      res.json({
        game,
        analysis: formattedResults
      });
    } catch (err) {
      console.error("Game detail retrieval error:", err);
      res.status(500).json({ message: "Failed to fetch game details" });
    }
  });
  
  // Trigger analysis for a specific game
  app.post("/api/games/:id/analyze", isAuthenticated, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Determine the username to use for analysis
      const username = req.user!.username;
      
      // Check if analysis already exists
      const existingAnalysis = await storage.getAnalysisResults(gameId);
      if (existingAnalysis.length > 0) {
        // Delete existing analysis results
        for (const analysis of existingAnalysis) {
          // Note: We should add a deleteAnalysisResult method to storage
          // This is a placeholder
          console.log(`Analysis result ${analysis.id} would be deleted here`);
        }
      }
      
      // Start analysis (asynchronously)
      chessAnalyzer.analyzePgn(game.pgn, username)
        .then(analysisResults => {
          // Store each analysis pipeline result
          Promise.all([
            storage.createAnalysisResult({
              gameId: gameId,
              pipeline: "game",
              resultJson: analysisResults.game
            }),
            storage.createAnalysisResult({
              gameId: gameId,
              pipeline: "tactics",
              resultJson: analysisResults.tactics
            }),
            storage.createAnalysisResult({
              gameId: gameId,
              pipeline: "openings",
              resultJson: analysisResults.openings
            }),
            storage.createAnalysisResult({
              gameId: gameId,
              pipeline: "fundamentals",
              resultJson: analysisResults.fundamentals
            })
          ]).catch(err => {
            console.error("Error storing analysis results:", err);
          });
        })
        .catch(err => {
          console.error("Error analyzing game:", err);
        });
      
      res.status(202).json({ 
        message: "Analysis started successfully",
        gameId
      });
    } catch (err) {
      console.error("Game analysis error:", err);
      res.status(500).json({ message: "Failed to start analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
