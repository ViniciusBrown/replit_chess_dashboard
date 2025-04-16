interface ChessMove {
  move: string;
  evaluation?: number;
  position?: string;
  comment?: string;
}

interface ChessGame {
  event?: string;
  site?: string;
  date?: string;
  white?: string;
  black?: string;
  result?: string;
  whitePieceType?: string; // "white", "black" for the user's pieces
  timeControl?: string;
  eco?: string;
  opening?: string;
  moves: ChessMove[];
  fen?: string;
  rawPgn: string;
}

// Simple PGN parser that extracts headers and moves
export function parsePgn(pgn: string): ChessGame {
  // Clean up the PGN
  const cleanPgn = pgn.replace(/\r\n/g, '\n').trim();

  // Initialize the game object
  const game: ChessGame = {
    moves: [],
    rawPgn: cleanPgn
  };

  // Extract headers
  const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(cleanPgn)) !== null) {
    const [, key, value] = headerMatch;
    switch (key.toLowerCase()) {
      case 'event':
        game.event = value;
        break;
      case 'site':
        game.site = value;
        break;
      case 'date':
        game.date = value;
        break;
      case 'white':
        game.white = value;
        break;
      case 'black':
        game.black = value;
        break;
      case 'result':
        game.result = value;
        break;
      case 'timecontrol':
        game.timeControl = value;
        break;
      case 'eco':
        game.eco = value;
        break;
      case 'opening':
        game.opening = value;
        break;
      case 'fen':
        game.fen = value;
        break;
    }
  }

  // Find the move section (everything after the last header)
  const lastHeaderIndex = cleanPgn.lastIndexOf(']');
  if (lastHeaderIndex === -1) {
    // No headers found, treat the entire input as moves
    parseMoves(cleanPgn, game);
  } else {
    // Headers found, parse only the part after the last header
    const moveText = cleanPgn.substring(lastHeaderIndex + 1).trim();
    parseMoves(moveText, game);
  }

  return game;
}

// Helper function to parse moves
function parseMoves(moveText: string, game: ChessGame): void {
  // Remove result at the end if present
  moveText = moveText.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');

  // Remove move numbers and clean up
  moveText = moveText.replace(/\d+\.\s*/g, '');
  
  // Split by spaces to get individual moves
  const moveParts = moveText.split(/\s+/).filter(part => part.trim() !== '');
  
  for (const move of moveParts) {
    if (move.match(/[a-zA-Z0-9]/)) {
      game.moves.push({ move });
    }
  }
}

// Extract basic information from a PGN
export function extractBasicInfo(pgn: string): {
  white: string;
  black: string;
  result: string;
  date?: Date;
  opening?: string;
  timeControl?: string;
} {
  const game = parsePgn(pgn);
  
  // Try to parse the date
  let date: Date | undefined;
  if (game.date) {
    const dateParts = game.date.split('.');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
      const day = parseInt(dateParts[2]);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        date = new Date(year, month, day);
      }
    }
  }
  
  return {
    white: game.white || 'Unknown',
    black: game.black || 'Unknown',
    result: game.result || '*',
    date,
    opening: game.opening,
    timeControl: game.timeControl
  };
}
