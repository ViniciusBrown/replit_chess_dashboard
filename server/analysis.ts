import { Chess } from 'chess.js';
import { parsePgn } from './pgn-parser';
import axios from 'axios';

// Types for analysis results
interface GameAnalysisResult {
  outcome: string;
  userColor: string;
  accuracy: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  keyMoments: {
    moveNumber: number;
    position: string;
    type: 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'excellent';
    description: string;
  }[];
}

interface TacticsAnalysisResult {
  missedTactics: {
    moveNumber: number;
    position: string;
    tactic: string;
    explanation: string;
  }[];
  executedTactics: {
    moveNumber: number;
    position: string;
    tactic: string;
  }[];
}

interface OpeningsAnalysisResult {
  eco: string;
  name: string;
  accuracy: number;
  commonLines: {
    name: string;
    moves: string;
  }[];
  recommendations: string[];
}

interface FundamentalsAnalysisResult {
  pieceDevelopment: number;
  centerControl: number;
  kingSafety: number;
  pawnStructure: number;
  recommendations: string[];
}

// Chess analysis with Open Router API
export class ChessAnalyzer {
  private openRouterApiKey: string;
  private chessEngine: MockStockfish;
  
  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.openRouterApiKey) {
      console.warn('Warning: OPENROUTER_API_KEY not found in environment variables');
    }
    this.chessEngine = new MockStockfish();
  }

  // Main analysis function
  async analyzePgn(pgn: string, username: string): Promise<{
    game: GameAnalysisResult;
    tactics: TacticsAnalysisResult;
    openings: OpeningsAnalysisResult;
    fundamentals: FundamentalsAnalysisResult;
  }> {
    try {
      console.log(`Starting analysis for game played by ${username}`);
      
      // Parse the PGN
      const parsedGame = parsePgn(pgn);
      
      // Determine user's color
      const userColor = this.determineUserColor(parsedGame, username);
      
      // Extract information about the game
      const gameInfo = {
        pgn,
        white: parsedGame.white || 'Unknown',
        black: parsedGame.black || 'Unknown',
        result: parsedGame.result || '*',
        event: parsedGame.event || 'Unknown event',
        date: parsedGame.date || 'Unknown date',
        opening: parsedGame.opening || 'Unknown opening',
        eco: parsedGame.eco || '',
        moveCount: parsedGame.moves.length,
        userColor
      };
      
      console.log(`Game info extracted. User played as ${userColor}`);
      
      // Check if we have the API key before attempting AI analysis
      if (!this.openRouterApiKey) {
        console.log('No OpenRouter API key found, falling back to basic analysis');
        return this.fallbackAnalysis(parsedGame, userColor);
      }

      // Perform AI analysis
      const aiAnalysisPromise = this.performAIAnalysis(gameInfo);
      
      // Perform fallback analysis as backup
      const fallbackAnalysisPromise = this.fallbackAnalysis(parsedGame, userColor);
      
      // Use race to get whichever finishes first, with a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timed out')), 30000); // 30-second timeout
      });
      
      // Use Promise.race to get the first result
      let result;
      try {
        result = await Promise.race([aiAnalysisPromise, timeoutPromise]);
        console.log('AI analysis completed successfully');
      } catch (error) {
        console.error('AI analysis failed or timed out:', error.message);
        console.log('Falling back to basic analysis');
        result = await fallbackAnalysisPromise;
      }
      
      return result;
    } catch (error) {
      console.error('Error in analyzePgn:', error);
      
      // Create a chess instance and get fallback analysis in case of error
      const chess = new Chess();
      try {
        chess.loadPgn(pgn);
      } catch (loadError) {
        console.error('Error loading PGN:', loadError);
      }
      
      // Return a simplified analysis if there's an error
      return {
        game: {
          outcome: 'Unknown',
          userColor: 'white',
          accuracy: 0,
          blunders: 0,
          mistakes: 0,
          inaccuracies: 0,
          keyMoments: []
        },
        tactics: {
          missedTactics: [],
          executedTactics: []
        },
        openings: {
          eco: '',
          name: 'Unknown Opening',
          accuracy: 0,
          commonLines: [],
          recommendations: [
            'Focus on basic opening principles',
            'Develop your pieces toward the center',
            'Castle early',
            'Connect your rooks'
          ]
        },
        fundamentals: {
          pieceDevelopment: 0,
          centerControl: 0,
          kingSafety: 0,
          pawnStructure: 0,
          recommendations: [
            'Review basic chess principles',
            'Practice piece coordination',
            'Work on tactical awareness'
          ]
        }
      };
    }
  }
  
  // Use AI to analyze the game
  private async performAIAnalysis(gameInfo: any): Promise<{
    game: GameAnalysisResult;
    tactics: TacticsAnalysisResult;
    openings: OpeningsAnalysisResult;
    fundamentals: FundamentalsAnalysisResult;
  }> {
    try {
      // Generate prompts for each analysis pipeline
      const gameAnalysisPrompt = this.generateGameAnalysisPrompt(gameInfo);
      const tacticsAnalysisPrompt = this.generateTacticsAnalysisPrompt(gameInfo);
      const openingsAnalysisPrompt = this.generateOpeningsAnalysisPrompt(gameInfo);
      const fundamentalsAnalysisPrompt = this.generateFundamentalsAnalysisPrompt(gameInfo);
      
      // Make API calls in parallel
      const [gameAnalysis, tacticsAnalysis, openingsAnalysis, fundamentalsAnalysis] = await Promise.all([
        this.callOpenRouterAPI(gameAnalysisPrompt, 'gameAnalysis'),
        this.callOpenRouterAPI(tacticsAnalysisPrompt, 'tacticsAnalysis'),
        this.callOpenRouterAPI(openingsAnalysisPrompt, 'openingsAnalysis'),
        this.callOpenRouterAPI(fundamentalsAnalysisPrompt, 'fundamentalsAnalysis')
      ]);
      
      // Return the combined results
      return {
        game: gameAnalysis as GameAnalysisResult,
        tactics: tacticsAnalysis as TacticsAnalysisResult,
        openings: openingsAnalysis as OpeningsAnalysisResult,
        fundamentals: fundamentalsAnalysis as FundamentalsAnalysisResult
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      throw error;
    }
  }
  
  // Call the Open Router API
  private async callOpenRouterAPI(prompt: string, analysisType: string): Promise<any> {
    try {
      const headers = {
        'Authorization': `Bearer ${this.openRouterApiKey}`,
        'Content-Type': 'application/json'
      };
      
      const data = {
        model: 'openrouter/optimus-alpha',  // Using Optimus Alpha model as requested
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      };
      
      console.log(`Sending ${analysisType} request to Open Router API using Optimus Alpha model`);
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        data,
        { headers }
      );
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content;
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.error(`Error parsing ${analysisType} JSON response:`, parseError);
          console.log('Response content:', content);
          throw new Error(`Invalid JSON in ${analysisType} response`);
        }
      } else {
        console.error(`Unexpected ${analysisType} response structure:`, response.data);
        throw new Error(`Unexpected ${analysisType} response structure`);
      }
    } catch (error) {
      console.error(`Error calling Open Router API for ${analysisType}:`, error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }
  
  // Generate prompt for game analysis
  private generateGameAnalysisPrompt(gameInfo: any): string {
    return `You are a chess analysis engine. Analyze this chess game PGN and provide a detailed game analysis. 
    Focus on critical moments, blunders, mistakes, and inaccuracies. 

    PGN: ${gameInfo.pgn}

    Player being analyzed: ${gameInfo.userColor === 'white' ? gameInfo.white : gameInfo.black}
    Playing as: ${gameInfo.userColor}

    Return ONLY a JSON object with the following structure:
    {
      "outcome": "Win|Loss|Draw",
      "userColor": "${gameInfo.userColor}",
      "accuracy": 75.5, // User's overall accuracy percentage 0-100
      "blunders": 2, // Number of serious mistakes 
      "mistakes": 3, // Number of moderate mistakes
      "inaccuracies": 5, // Number of minor mistakes
      "keyMoments": [
        {
          "moveNumber": 24,
          "position": "FEN string if possible",
          "type": "blunder|mistake|inaccuracy|good|excellent", 
          "description": "Description of what happened and better alternatives"
        }
      ]
    }`;
  }
  
  // Generate prompt for tactics analysis
  private generateTacticsAnalysisPrompt(gameInfo: any): string {
    return `You are a chess tactics expert. Analyze this chess game PGN and identify tactical opportunities that were missed or successfully executed by the player.

    PGN: ${gameInfo.pgn}

    Player being analyzed: ${gameInfo.userColor === 'white' ? gameInfo.white : gameInfo.black}
    Playing as: ${gameInfo.userColor}

    Return ONLY a JSON object with the following structure:
    {
      "missedTactics": [
        {
          "moveNumber": 18,
          "position": "FEN string if possible",
          "tactic": "Fork|Pin|Discovery|Skewer|etc.",
          "explanation": "Detailed explanation of what was missed and why it would be effective"
        }
      ],
      "executedTactics": [
        {
          "moveNumber": 32,
          "position": "FEN string if possible",
          "tactic": "Fork|Pin|Discovery|Skewer|etc."
        }
      ]
    }`;
  }
  
  // Generate prompt for openings analysis
  private generateOpeningsAnalysisPrompt(gameInfo: any): string {
    return `You are a chess opening expert. Analyze this chess game PGN and provide detailed opening analysis.

    PGN: ${gameInfo.pgn}

    Player being analyzed: ${gameInfo.userColor === 'white' ? gameInfo.white : gameInfo.black}
    Playing as: ${gameInfo.userColor}
    
    Known opening information:
    ECO: ${gameInfo.eco}
    Opening name: ${gameInfo.opening}

    Return ONLY a JSON object with the following structure:
    {
      "eco": "E4", // ECO code if known
      "name": "Opening name",
      "accuracy": 85, // How accurately the player followed opening theory (0-100)
      "commonLines": [
        {
          "name": "Main line",
          "moves": "1. e4 e5 2. Nf3 Nc6 3. Bb5" // Example moves of common variation
        },
        {
          "name": "Alternative line",
          "moves": "1. e4 e5 2. Nf3 Nc6 3. Bc4" // Example moves of another variation
        }
      ],
      "recommendations": [
        "Specific advice about openings for this player based on the game"
      ]
    }`;
  }
  
  // Generate prompt for fundamentals analysis
  private generateFundamentalsAnalysisPrompt(gameInfo: any): string {
    return `You are a chess fundamentals coach. Analyze this chess game PGN and evaluate how well the player applied chess fundamentals.

    PGN: ${gameInfo.pgn}

    Player being analyzed: ${gameInfo.userColor === 'white' ? gameInfo.white : gameInfo.black}
    Playing as: ${gameInfo.userColor}

    Return ONLY a JSON object with the following structure:
    {
      "pieceDevelopment": 75, // Score 0-100 for how well pieces were developed
      "centerControl": 60, // Score 0-100 for center control
      "kingSafety": 80, // Score 0-100 for king safety
      "pawnStructure": 65, // Score 0-100 for pawn structure quality
      "recommendations": [
        "Specific advice to improve fundamentals based on this game"
      ]
    }`;
  }
  
  // Fallback analysis method using basic rules when AI analysis isn't available
  private async fallbackAnalysis(
    parsedGame: ReturnType<typeof parsePgn>,
    userColor: string
  ): Promise<{
    game: GameAnalysisResult;
    tactics: TacticsAnalysisResult;
    openings: OpeningsAnalysisResult;
    fundamentals: FundamentalsAnalysisResult;
  }> {
    console.log('Using fallback analysis method');
    
    // Create a new chess instance
    const chess = new Chess();
    
    // Run the different analysis pipelines with the existing methods
    const gameAnalysis = await this.runGameAnalysis(chess, parsedGame, userColor);
    const tacticsAnalysis = await this.runTacticsAnalysis(chess, parsedGame, userColor);
    const openingsAnalysis = await this.runOpeningsAnalysis(chess, parsedGame, userColor);
    const fundamentalsAnalysis = await this.runFundamentalsAnalysis(chess, parsedGame, userColor);
    
    return {
      game: gameAnalysis,
      tactics: tacticsAnalysis,
      openings: openingsAnalysis,
      fundamentals: fundamentalsAnalysis
    };
  }
  
  // Determine which color the user played as
  private determineUserColor(parsedGame: ReturnType<typeof parsePgn>, username: string): string {
    if (parsedGame.white?.toLowerCase() === username.toLowerCase()) {
      return 'white';
    } else if (parsedGame.black?.toLowerCase() === username.toLowerCase()) {
      return 'black';
    }
    
    // Default to white if we can't determine
    return 'white';
  }
  
  // Basic game analysis pipeline (fallback method)
  private async runGameAnalysis(
    chess: Chess,
    parsedGame: ReturnType<typeof parsePgn>,
    userColor: string
  ): Promise<GameAnalysisResult> {
    // Reset the chess board
    chess.reset();
    
    // Track statistics
    let blunders = 0;
    let mistakes = 0;
    let inaccuracies = 0;
    const keyMoments = [];
    
    // Calculate the outcome
    let outcome = 'Unknown';
    if (parsedGame.result) {
      if (parsedGame.result === '1-0') {
        outcome = userColor === 'white' ? 'Win' : 'Loss';
      } else if (parsedGame.result === '0-1') {
        outcome = userColor === 'black' ? 'Win' : 'Loss';
      } else if (parsedGame.result === '1/2-1/2') {
        outcome = 'Draw';
      }
    }
    
    // Simple accuracy calculation
    let totalMoves = 0;
    let goodMoves = 0;
    
    // Analyze moves
    try {
      for (let i = 0; i < parsedGame.moves.length; i++) {
        const moveInfo = parsedGame.moves[i];
        const currentPosition = chess.fen();
        
        // Check if it's the user's move
        const isUserMove = (chess.turn() === 'w' && userColor === 'white') || 
                           (chess.turn() === 'b' && userColor === 'black');
        
        if (isUserMove) {
          totalMoves++;
          
          try {
            // Get the best move according to the engine
            this.chessEngine.setPosition(currentPosition);
            const bestMove = this.chessEngine.getBestMove();
            
            // Make the actual move
            chess.move(moveInfo.move);
            
            // Evaluate the position after the move
            this.chessEngine.setPosition(chess.fen());
            const afterMoveEval = this.chessEngine.evaluate();
            
            // Compare the evaluation difference
            const evalDiff = Math.abs(bestMove.evaluation - afterMoveEval);
            
            // Classify the move
            let moveQuality = '';
            if (evalDiff > 2) {
              blunders++;
              moveQuality = 'blunder';
            } else if (evalDiff > 1) {
              mistakes++;
              moveQuality = 'mistake';
            } else if (evalDiff > 0.5) {
              inaccuracies++;
              moveQuality = 'inaccuracy';
            } else {
              goodMoves++;
              moveQuality = evalDiff < 0.2 ? 'excellent' : 'good';
            }
            
            // Add to key moments if it's a notable move
            if (moveQuality === 'blunder' || moveQuality === 'excellent') {
              keyMoments.push({
                moveNumber: Math.floor(i / 2) + 1,
                position: currentPosition,
                type: moveQuality as any,
                description: moveQuality === 'blunder' 
                  ? `${bestMove.move} would have been much better.`
                  : `Perfect move!`
              });
            }
          } catch (error) {
            console.error('Error analyzing move:', error);
            chess.move(moveInfo.move); // Ensure we still make the move
          }
        } else {
          // If it's not the user's move, just make it
          try {
            chess.move(moveInfo.move);
          } catch (error) {
            console.error('Error making opponent move:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing game:', error);
    }
    
    // Calculate accuracy
    const accuracy = totalMoves > 0 ? (goodMoves / totalMoves) * 100 : 0;
    
    return {
      outcome,
      userColor,
      accuracy,
      blunders,
      mistakes,
      inaccuracies,
      keyMoments
    };
  }
  
  // Tactics analysis pipeline (fallback method)
  private async runTacticsAnalysis(
    chess: Chess,
    parsedGame: ReturnType<typeof parsePgn>,
    userColor: string
  ): Promise<TacticsAnalysisResult> {
    // Reset the chess board
    chess.reset();
    
    const missedTactics = [];
    const executedTactics = [];
    
    // Loop through the moves to find tactical opportunities
    try {
      for (let i = 0; i < parsedGame.moves.length; i++) {
        const moveInfo = parsedGame.moves[i];
        const currentPosition = chess.fen();
        
        // Check if it's the user's move
        const isUserMove = (chess.turn() === 'w' && userColor === 'white') || 
                           (chess.turn() === 'b' && userColor === 'black');
        
        if (isUserMove) {
          try {
            // Check for tactical opportunities
            const tactics = this.findTactics(chess);
            
            // Make the actual move
            chess.move(moveInfo.move);
            
            // If there was a tactic and the move doesn't match, it's a missed tactic
            if (tactics.hasTactic && tactics.bestMove !== moveInfo.move) {
              missedTactics.push({
                moveNumber: Math.floor(i / 2) + 1,
                position: currentPosition,
                tactic: tactics.tacticType,
                explanation: tactics.explanation
              });
            } else if (tactics.hasTactic) {
              // The user found the tactic!
              executedTactics.push({
                moveNumber: Math.floor(i / 2) + 1,
                position: currentPosition,
                tactic: tactics.tacticType
              });
            }
          } catch (error) {
            console.error('Error analyzing tactics:', error);
            chess.move(moveInfo.move); // Ensure we still make the move
          }
        } else {
          // If it's not the user's move, just make it
          try {
            chess.move(moveInfo.move);
          } catch (error) {
            console.error('Error making opponent move:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in tactics analysis:', error);
    }
    
    return {
      missedTactics,
      executedTactics
    };
  }
  
  // Helper to find tactical opportunities
  private findTactics(chess: Chess): {
    hasTactic: boolean;
    tacticType: string;
    bestMove: string;
    explanation: string;
  } {
    // Simplified implementation - would use a more sophisticated approach in production
    try {
      const moves = chess.moves({ verbose: true });
      
      // 1. Check for forks (one piece attacking multiple pieces)
      for (const move of moves) {
        chess.move(move);
        
        // After the move, check if a piece attacks multiple opponent pieces
        const attackedPieces = this.countAttackedPieces(chess);
        if (attackedPieces >= 2) {
          const tacticInfo = {
            hasTactic: true,
            tacticType: 'Fork',
            bestMove: move.san,
            explanation: `There's a fork opportunity where your piece can attack multiple pieces at once.`
          };
          chess.undo();
          return tacticInfo;
        }
        
        chess.undo();
      }
      
      // 2. Check for pins (piece can't move because it would expose a more valuable piece)
      // This is a simplified implementation
      for (const move of moves) {
        if (move.flags.includes('c')) { // Capture move
          chess.move(move);
          
          // Simple heuristic: if the opponent has fewer legal moves after our capture,
          // it might be due to a pin
          const opponentMoves = chess.moves().length;
          if (opponentMoves < 10) { // Arbitrary threshold
            const tacticInfo = {
              hasTactic: true,
              tacticType: 'Pin/Skewer',
              bestMove: move.san,
              explanation: `There's an opportunity to pin or skewer one of your opponent's pieces.`
            };
            chess.undo();
            return tacticInfo;
          }
          
          chess.undo();
        }
      }
    } catch (error) {
      console.error('Error finding tactics:', error);
    }
    
    // Default: no tactic found
    return {
      hasTactic: false,
      tacticType: '',
      bestMove: '',
      explanation: ''
    };
  }
  
  // Helper to count how many opponent pieces are attacked
  private countAttackedPieces(chess: Chess): number {
    try {
      const turn = chess.turn();
      const opponent = turn === 'w' ? 'b' : 'w';
      let attackedCount = 0;
      
      // Go through the board and count attacked pieces
      const board = chess.board();
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.color === opponent) {
            // Convert row/col to square name (e.g., "e4")
            const square = String.fromCharCode(97 + col) + (8 - row);
            
            // Check if this square is attacked
            if (chess.isAttacked(square, turn)) {
              attackedCount++;
            }
          }
        }
      }
      
      return attackedCount;
    } catch (error) {
      console.error('Error counting attacked pieces:', error);
      return 0;
    }
  }
  
  // Openings analysis pipeline (fallback method)
  private async runOpeningsAnalysis(
    chess: Chess,
    parsedGame: ReturnType<typeof parsePgn>,
    userColor: string
  ): Promise<OpeningsAnalysisResult> {
    // Reset the chess board
    chess.reset();
    
    // Extract ECO and opening name from the parsed game
    const eco = parsedGame.eco || '';
    const openingName = parsedGame.opening || 'Unknown Opening';
    
    // Track opening moves (first 10-12 moves)
    const openingMoves = parsedGame.moves.slice(0, Math.min(20, parsedGame.moves.length));
    let numCorrectMoves = 0;
    
    // Play through the opening moves
    try {
      for (let i = 0; i < openingMoves.length; i++) {
        const moveInfo = openingMoves[i];
        
        // Check if it's the user's move
        const isUserMove = (chess.turn() === 'w' && userColor === 'white') || 
                           (chess.turn() === 'b' && userColor === 'black');
        
        // Make the move
        chess.move(moveInfo.move);
        
        // For user moves, check if they follow opening theory
        // This would require a database of openings in practice
        if (isUserMove) {
          // Simplified implementation: assume the first 6-8 moves are correct
          if (i < 12) {
            numCorrectMoves++;
          }
        }
      }
    } catch (error) {
      console.error('Error in openings analysis:', error);
    }
    
    // Calculate opening accuracy
    const accuracy = openingMoves.length > 0 ? (numCorrectMoves / Math.min(openingMoves.length, 20)) * 100 : 0;
    
    // Generate opening recommendations
    const recommendations = this.generateOpeningRecommendations(openingName, userColor);
    
    // Add basic common lines based on opening
    const commonLines = this.getCommonLinesForOpening(openingName);
    
    return {
      eco,
      name: openingName,
      accuracy,
      commonLines,
      recommendations
    };
  }
  
  // Get common lines for an opening
  private getCommonLinesForOpening(openingName: string): {name: string, moves: string}[] {
    // Simplified database of common openings
    const openingsDatabase: Record<string, {name: string, moves: string}[]> = {
      'Sicilian': [
        { name: 'Main line', moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4' },
        { name: 'Najdorf', moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6' }
      ],
      'Ruy Lopez': [
        { name: 'Main line', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5' },
        { name: 'Berlin Defense', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6' }
      ],
      'French Defense': [
        { name: 'Main line', moves: '1. e4 e6 2. d4 d5' },
        { name: 'Advance Variation', moves: '1. e4 e6 2. d4 d5 3. e5' }
      ],
      'Queen\'s Gambit': [
        { name: 'Main line', moves: '1. d4 d5 2. c4' },
        { name: 'Queen\'s Gambit Accepted', moves: '1. d4 d5 2. c4 dxc4' },
        { name: 'Queen\'s Gambit Declined', moves: '1. d4 d5 2. c4 e6' }
      ]
    };
    
    // Check if the opening name contains any of our known openings
    for (const knownOpening in openingsDatabase) {
      if (openingName.includes(knownOpening)) {
        return openingsDatabase[knownOpening];
      }
    }
    
    // Default to basic opening principles
    return [
      { name: 'Basic Opening Principles', moves: '1. Control the center 2. Develop pieces 3. Castle' },
      { name: 'Common first moves', moves: '1. e4 or 1. d4 (as White), 1...e5 or 1...d5 (as Black)' }
    ];
  }
  
  // Helper to generate opening recommendations
  private generateOpeningRecommendations(openingName: string, userColor: string): string[] {
    // This would be more sophisticated in a production app
    const generalRecommendations = [
      'Focus on developing your pieces in the opening',
      'Control the center with pawns or pieces',
      'Castle early to protect your king',
      'Connect your rooks by developing pieces'
    ];
    
    // Add some specific recommendations based on the opening if known
    if (openingName.includes('Sicilian')) {
      generalRecommendations.push('In the Sicilian, be prepared for tactical complications');
      generalRecommendations.push('The Sicilian often leads to imbalanced positions, so calculate carefully');
    } else if (openingName.includes('Ruy Lopez') || openingName.includes('Spanish')) {
      generalRecommendations.push('The Ruy Lopez is a strategic opening, focus on long-term plans');
      generalRecommendations.push('Be careful with the bishop on b5, it can be targeted');
    } else if (openingName.includes('French')) {
      generalRecommendations.push('In the French Defense, be prepared for closed positions');
      generalRecommendations.push('Focus on pawn breaks to open up the position');
    } else if (openingName.includes('Queen\'s Gambit')) {
      generalRecommendations.push('The Queen\'s Gambit often leads to solid, positional play');
      generalRecommendations.push('Focus on piece development and piece coordination');
    }
    
    return generalRecommendations;
  }
  
  // Fundamentals analysis pipeline (fallback method)
  private async runFundamentalsAnalysis(
    chess: Chess,
    parsedGame: ReturnType<typeof parsePgn>,
    userColor: string
  ): Promise<FundamentalsAnalysisResult> {
    // Reset the chess board
    chess.reset();
    
    // Track fundamental metrics
    let pieceDevelopmentScore = 0;
    let centerControlScore = 0;
    let kingSafetyScore = 0;
    let pawnStructureScore = 0;
    
    // Play through the game and check fundamentals
    try {
      for (let i = 0; i < parsedGame.moves.length; i++) {
        const moveInfo = parsedGame.moves[i];
        
        // Check if it's the user's move
        const isUserMove = (chess.turn() === 'w' && userColor === 'white') || 
                           (chess.turn() === 'b' && userColor === 'black');
        
        // Make the move
        chess.move(moveInfo.move);
        
        // Only analyze the first 20 moves (40 half-moves)
        if (i < 40 && isUserMove) {
          // Check piece development
          pieceDevelopmentScore += this.evaluatePieceDevelopment(chess, userColor);
          
          // Check center control
          centerControlScore += this.evaluateCenterControl(chess, userColor);
          
          // Check king safety
          kingSafetyScore += this.evaluateKingSafety(chess, userColor);
          
          // Check pawn structure
          pawnStructureScore += this.evaluatePawnStructure(chess, userColor);
        }
      }
    } catch (error) {
      console.error('Error in fundamentals analysis:', error);
    }
    
    // Normalize scores to 0-100 range
    pieceDevelopmentScore = Math.min(100, Math.max(0, pieceDevelopmentScore));
    centerControlScore = Math.min(100, Math.max(0, centerControlScore));
    kingSafetyScore = Math.min(100, Math.max(0, kingSafetyScore));
    pawnStructureScore = Math.min(100, Math.max(0, pawnStructureScore));
    
    // Generate recommendations based on weakest areas
    const recommendations = this.generateFundamentalRecommendations(
      pieceDevelopmentScore,
      centerControlScore,
      kingSafetyScore,
      pawnStructureScore
    );
    
    return {
      pieceDevelopment: pieceDevelopmentScore,
      centerControl: centerControlScore,
      kingSafety: kingSafetyScore,
      pawnStructure: pawnStructureScore,
      recommendations
    };
  }
  
  // Evaluate how well pieces are developed
  private evaluatePieceDevelopment(chess: Chess, userColor: string): number {
    try {
      // Simplified implementation
      const board = chess.board();
      const color = userColor === 'white' ? 'w' : 'b';
      let developmentScore = 0;
      
      // Check knights and bishops out of starting position
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.color === color) {
            if (piece.type === 'n' || piece.type === 'b') {
              const startingRow = color === 'w' ? 7 : 0;
              if (row !== startingRow) {
                developmentScore += 10;
              }
            }
          }
        }
      }
      
      return developmentScore;
    } catch (error) {
      console.error('Error evaluating piece development:', error);
      return 0;
    }
  }
  
  // Evaluate center control
  private evaluateCenterControl(chess: Chess, userColor: string): number {
    try {
      // Simplified implementation - count pieces and pawns that control center squares
      const centerSquares = ['d4', 'd5', 'e4', 'e5'];
      const color = userColor === 'white' ? 'w' : 'b';
      let centerScore = 0;
      
      // Check if any of the center squares are occupied by user's pieces
      for (const square of centerSquares) {
        const piece = chess.get(square);
        if (piece && piece.color === color) {
          centerScore += 15;
        }
      }
      
      return centerScore;
    } catch (error) {
      console.error('Error evaluating center control:', error);
      return 0;
    }
  }
  
  // Evaluate king safety
  private evaluateKingSafety(chess: Chess, userColor: string): number {
    try {
      // Simplified implementation - check if king is castled and protected
      const color = userColor === 'white' ? 'w' : 'b';
      const board = chess.board();
      let safetyScore = 50; // Default moderate safety
      
      // Check if king is in a typical castled position
      const kingPos = this.findKing(board, color);
      if (kingPos) {
        const [row, col] = kingPos;
        
        // Check if king is in a typical castled position
        if (color === 'w') {
          if ((col === 6 || col === 1) && row === 7) {
            safetyScore += 30; // Castled position
          }
        } else {
          if ((col === 6 || col === 1) && row === 0) {
            safetyScore += 30; // Castled position
          }
        }
      }
      
      return safetyScore;
    } catch (error) {
      console.error('Error evaluating king safety:', error);
      return 0;
    }
  }
  
  // Helper to find king position
  private findKing(board: any[][], color: string): [number, number] | null {
    try {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.type === 'k' && piece.color === color) {
            return [row, col];
          }
        }
      }
    } catch (error) {
      console.error('Error finding king:', error);
    }
    return null;
  }
  
  // Evaluate pawn structure
  private evaluatePawnStructure(chess: Chess, userColor: string): number {
    try {
      // Simplified implementation
      const board = chess.board();
      const color = userColor === 'white' ? 'w' : 'b';
      let structureScore = 60; // Default reasonable structure
      
      // Count doubled and isolated pawns (simplified)
      let doubledPawns = 0;
      let isolatedPawns = 0;
      
      // For each file, check how many pawns of user's color
      for (let col = 0; col < 8; col++) {
        let pawnsInFile = 0;
        let hasPawnInAdjacentFile = false;
        
        for (let row = 0; row < 8; row++) {
          const piece = board[row][col];
          if (piece && piece.type === 'p' && piece.color === color) {
            pawnsInFile++;
          }
        }
        
        // Check adjacent files for pawns
        for (let adjCol = Math.max(0, col - 1); adjCol <= Math.min(7, col + 1); adjCol++) {
          if (adjCol === col) continue;
          
          for (let row = 0; row < 8; row++) {
            const piece = board[row][adjCol];
            if (piece && piece.type === 'p' && piece.color === color) {
              hasPawnInAdjacentFile = true;
              break;
            }
          }
        }
        
        // Count doubled and isolated pawns
        if (pawnsInFile > 1) {
          doubledPawns += pawnsInFile - 1;
        }
        
        if (pawnsInFile > 0 && !hasPawnInAdjacentFile) {
          isolatedPawns++;
        }
      }
      
      // Penalize doubled and isolated pawns
      structureScore -= (doubledPawns * 5 + isolatedPawns * 5);
      
      return Math.max(0, structureScore);
    } catch (error) {
      console.error('Error evaluating pawn structure:', error);
      return 0;
    }
  }
  
  // Generate recommendations based on weakest areas
  private generateFundamentalRecommendations(
    pieceDevelopment: number,
    centerControl: number,
    kingSafety: number,
    pawnStructure: number
  ): string[] {
    const recommendations = [];
    
    if (pieceDevelopment < 60) {
      recommendations.push('Focus on developing your minor pieces (knights and bishops) early in the game');
      recommendations.push('Avoid moving the same piece multiple times in the opening');
    }
    
    if (centerControl < 60) {
      recommendations.push('Control the center with pawns or pieces');
      recommendations.push('Consider pawn moves like e4/d4 or e5/d5 to establish center presence');
    }
    
    if (kingSafety < 60) {
      recommendations.push('Castle early to protect your king');
      recommendations.push('Avoid advancing pawns in front of your castled king without good reason');
    }
    
    if (pawnStructure < 60) {
      recommendations.push('Avoid creating doubled pawns unless there is compensation');
      recommendations.push('Try to maintain a connected pawn chain');
    }
    
    return recommendations;
  }
}

// Basic chess engine implementation for fallback method
class MockStockfish {
  private chess: Chess;
  
  constructor() {
    this.chess = new Chess();
  }
  
  // Reset the position
  setPosition(fen: string) {
    try {
      this.chess.load(fen);
    } catch (error) {
      console.error('Error loading FEN position:', error);
      this.chess.reset(); // Fallback to starting position
    }
  }
  
  // Get evaluation of the current position
  evaluate(): number {
    try {
      // Simple evaluation heuristic
      return this.evaluateMaterial();
    } catch (error) {
      console.error('Error in position evaluation:', error);
      return 0;
    }
  }
  
  // Basic material counting
  private evaluateMaterial(): number {
    try {
      const pieceValues = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
      };
      
      const board = this.chess.board();
      let score = 0;
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece) {
            const value = pieceValues[piece.type.toLowerCase() as keyof typeof pieceValues] || 0;
            score += piece.color === 'w' ? value : -value;
          }
        }
      }
      
      return score;
    } catch (error) {
      console.error('Error in material evaluation:', error);
      return 0;
    }
  }
  
  // Get best move in the current position
  getBestMove(): { move: string; evaluation: number } {
    try {
      const moves = this.chess.moves({ verbose: true });
      let bestMove = { move: '', evaluation: -Infinity };
      
      // If no moves, return default
      if (moves.length === 0) {
        return { move: '', evaluation: 0 };
      }
      
      for (const move of moves) {
        this.chess.move(move);
        const evaluation = -this.evaluate(); // Negamax principle
        this.chess.undo();
        
        if (evaluation > bestMove.evaluation) {
          bestMove = {
            move: move.san,
            evaluation
          };
        }
      }
      
      return bestMove;
    } catch (error) {
      console.error('Error finding best move:', error);
      return { move: '', evaluation: 0 };
    }
  }
}

export const chessAnalyzer = new ChessAnalyzer();