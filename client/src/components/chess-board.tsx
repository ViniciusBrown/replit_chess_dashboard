import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Card } from '@/components/ui/card';

interface ChessBoardProps {
  fen?: string;
  pgn?: string;
  markers?: {
    square: string;
    type: 'blunder' | 'tactic' | 'good' | 'excellent';
  }[];
  currentMoveIndex?: number;
  onMoveChange?: (moveIndex: number) => void;
  flipBoard?: boolean;
}

export default function ChessBoard({
  fen,
  pgn,
  markers = [],
  currentMoveIndex = -1,
  onMoveChange,
  flipBoard = false,
}: ChessBoardProps) {
  const [game, setGame] = useState(new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [position, setPosition] = useState('');
  const [customSquareStyles, setCustomSquareStyles] = useState({});

  // Load game from PGN or FEN when props change
  useEffect(() => {
    const chessInstance = new Chess();
    
    if (pgn) {
      try {
        chessInstance.loadPgn(pgn);
        const history = chessInstance.history({ verbose: true });
        setMoves(history.map(move => move.san));
      } catch (e) {
        console.error('Invalid PGN:', e);
      }
    } else if (fen) {
      try {
        chessInstance.load(fen);
      } catch (e) {
        console.error('Invalid FEN:', e);
      }
    }
    
    setGame(chessInstance);
    setPosition(chessInstance.fen());
  }, [pgn, fen]);

  // Update position when current move index changes
  useEffect(() => {
    if (pgn && currentMoveIndex >= -1) {
      const chessInstance = new Chess();
      try {
        chessInstance.loadPgn(pgn);
        
        // Reset to initial position
        if (currentMoveIndex === -1) {
          chessInstance.reset();
        } else {
          // Play moves up to the current move index
          const history = chessInstance.history();
          chessInstance.reset();
          
          for (let i = 0; i <= Math.min(currentMoveIndex, history.length - 1); i++) {
            chessInstance.move(history[i]);
          }
        }
        
        setPosition(chessInstance.fen());
      } catch (e) {
        console.error('Error navigating moves:', e);
      }
    }
  }, [pgn, currentMoveIndex]);

  // Apply markers to the board
  useEffect(() => {
    const squareStyles: Record<string, { backgroundColor: string }> = {};
    
    markers.forEach(marker => {
      let color;
      
      switch (marker.type) {
        case 'blunder':
          color = 'rgba(244, 67, 54, 0.5)'; // Red with transparency
          break;
        case 'tactic':
          color = 'rgba(33, 150, 243, 0.5)'; // Blue with transparency
          break;
        case 'good':
          color = 'rgba(76, 175, 80, 0.5)'; // Green with transparency
          break;
        case 'excellent':
          color = 'rgba(156, 39, 176, 0.5)'; // Purple with transparency
          break;
        default:
          color = 'rgba(158, 158, 158, 0.5)'; // Gray with transparency
      }
      
      squareStyles[marker.square] = {
        backgroundColor: color,
      };
    });
    
    setCustomSquareStyles(squareStyles);
  }, [markers]);

  // Handle move navigation manually
  const goToMove = (moveIndex: number) => {
    if (onMoveChange) {
      onMoveChange(moveIndex);
    }
  };

  // Format moves with numbers for display
  const formatMoves = () => {
    return moves.map((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const isWhiteMove = index % 2 === 0;
      
      if (isWhiteMove) {
        return `${moveNumber}. ${move}`;
      }
      return move;
    });
  };

  return (
    <div>
      <div className="aspect-square">
        <Chessboard 
          position={position} 
          boardOrientation={flipBoard ? 'black' : 'white'} 
          customSquareStyles={customSquareStyles}
        />
      </div>
      
      {/* Legend for markers */}
      {markers && markers.length > 0 && (
        <div className="mt-4 flex text-xs text-neutral-600 mb-2 items-center space-x-4">
          {markers.some(m => m.type === 'blunder') && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-500 opacity-50 inline-block mr-1"></span> 
              <span>Blunder</span>
            </div>
          )}
          {markers.some(m => m.type === 'tactic') && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 opacity-50 inline-block mr-1"></span> 
              <span>Missed Tactic</span>
            </div>
          )}
          {markers.some(m => m.type === 'good') && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 opacity-50 inline-block mr-1"></span> 
              <span>Good Move</span>
            </div>
          )}
          {markers.some(m => m.type === 'excellent') && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 opacity-50 inline-block mr-1"></span> 
              <span>Excellent Move</span>
            </div>
          )}
        </div>
      )}
      
      {/* Move list */}
      {pgn && (
        <div className="overflow-x-auto font-mono text-sm text-neutral-800 bg-neutral-100 p-3 rounded mt-4">
          <div className="flex flex-wrap gap-1">
            {formatMoves().map((formattedMove, index) => (
              <button
                key={index}
                className={`px-1 py-0.5 rounded ${
                  index === currentMoveIndex 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-neutral-200'
                }`}
                onClick={() => goToMove(index)}
              >
                {formattedMove}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
