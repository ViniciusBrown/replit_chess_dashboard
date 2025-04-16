import { apiRequest } from "./queryClient";

/**
 * Chess platform types
 */
export type ChessPlatform = "lichess" | "chesscom";

/**
 * Interface for game data
 */
export interface GameData {
  id: string;
  pgn: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  timestamp: Date;
  timeControl?: string;
  opening?: string;
}

/**
 * Chess platform client for interacting with Lichess and Chess.com APIs
 */
export class ChessApiClient {
  /**
   * Fetches user profile data from a chess platform
   * 
   * @param platform The chess platform to fetch from (lichess or chesscom)
   * @param username The username on the platform
   */
  static async fetchUserProfile(platform: ChessPlatform, username: string) {
    try {
      // In a real implementation, this would call a backend endpoint
      // that communicates with the chess platform API
      const response = await apiRequest("GET", `/api/chess/${platform}/profile/${username}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${platform} profile:`, error);
      throw new Error(`Failed to fetch ${platform} profile for ${username}`);
    }
  }

  /**
   * Fetches games from a chess platform
   * 
   * @param platform The chess platform to fetch from (lichess or chesscom)
   * @param username The username on the platform
   * @param limit Maximum number of games to fetch
   */
  static async fetchGames(platform: ChessPlatform, username: string, limit: number = 10) {
    try {
      // In a real implementation, this would call a backend endpoint
      // that communicates with the chess platform API
      const response = await apiRequest(
        "GET", 
        `/api/chess/${platform}/games/${username}?limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${platform} games:`, error);
      throw new Error(`Failed to fetch ${platform} games for ${username}`);
    }
  }

  /**
   * Authenticates with the Lichess API using OAuth
   * This would typically be handled by the backend
   */
  static initiateOAuthFlow(platform: ChessPlatform) {
    // In a real implementation, this would redirect to the backend OAuth endpoint
    window.location.href = `/api/auth/${platform}`;
  }

  /**
   * Parses a PGN string to extract game information
   * 
   * @param pgn The PGN string to parse
   */
  static parsePgn(pgn: string): Partial<GameData> {
    try {
      // This is a simplified PGN parser that extracts basic metadata
      // A real implementation would use a full PGN parsing library
      const result: Partial<GameData> = {
        pgn
      };
      
      // Extract header information
      const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
      let match;
      
      while ((match = headerRegex.exec(pgn)) !== null) {
        const [_, key, value] = match;
        
        switch (key) {
          case "White":
          case "Black":
            // Determine opponent based on player color
            result.opponent = value;
            break;
          case "Result":
            // Convert result to win/loss/draw format
            if (value === "1-0") result.result = "win";
            else if (value === "0-1") result.result = "loss";
            else result.result = "draw";
            break;
          case "Date":
            result.timestamp = new Date(value);
            break;
          case "TimeControl":
            result.timeControl = value;
            break;
          case "Opening":
          case "ECO":
            result.opening = value;
            break;
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error parsing PGN:", error);
      throw new Error("Failed to parse PGN data");
    }
  }
  
  /**
   * Analyzes a PGN string using Stockfish
   * 
   * @param pgn The PGN string to analyze
   */
  static async analyzePgn(pgn: string) {
    try {
      // In a real implementation, this would call a backend endpoint
      // that uses Stockfish to analyze the game
      const response = await apiRequest("POST", "/api/analysis", { pgn });
      return await response.json();
    } catch (error) {
      console.error("Error analyzing PGN:", error);
      throw new Error("Failed to analyze game");
    }
  }
}

export default ChessApiClient;
