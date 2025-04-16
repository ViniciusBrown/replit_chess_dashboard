import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Layout from "@/components/layout";
import ChessBoard from "@/components/chess-board";
import GameAnalysis from "@/components/game-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Loader2,
  AlertTriangle
} from "lucide-react";

interface Game {
  id: number;
  userId: number;
  platform: string;
  pgn: string;
  datePlayed: string;
  importedAt: string;
}

interface GameWithAnalysis {
  game: Game;
  analysis: {
    game?: any;
    tactics?: any;
    openings?: any;
    fundamentals?: any;
  };
}

export default function AnalysisPage() {
  const [match, params] = useRoute<{ id: string }>("/analysis/:id");
  const gameId = params?.id;
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  
  // Fetch game with analysis
  const { data: gameAnalysis, isLoading, error } = useQuery<GameWithAnalysis>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });
  
  // Handle move change from chess board
  const handleMoveChange = (moveIndex: number) => {
    setCurrentMoveIndex(moveIndex);
  };
  
  // Get current chess pieces markers based on analysis
  const getMarkers = () => {
    if (!gameAnalysis?.analysis?.game?.keyMoments) return [];
    
    return gameAnalysis.analysis.game.keyMoments
      .filter(moment => moment.type === 'blunder' || moment.type === 'excellent')
      .map(moment => ({
        square: '', // We would need the actual square from the position FEN
        type: moment.type === 'blunder' ? 'blunder' as 'blunder' : 'excellent' as 'excellent',
      }));
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-6 flex items-center">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-800">Game Analysis</h1>
        </div>
        
        {isLoading ? (
          <Card>
            <CardContent className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-neutral-600">Loading game analysis...</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Error Loading Analysis</h3>
                <p className="text-sm text-neutral-600 mb-6">
                  There was a problem loading the game analysis. Please try again.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !gameAnalysis ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Game Not Found</h3>
                <p className="text-sm text-neutral-600 mb-6">
                  The game you're looking for could not be found.
                </p>
                <Link href="/games">
                  <Button>
                    Go to My Games
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Chess Board */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                  <ChessBoard 
                    pgn={gameAnalysis.game.pgn}
                    markers={getMarkers()}
                    currentMoveIndex={currentMoveIndex}
                    onMoveChange={handleMoveChange}
                    flipBoard={gameAnalysis.analysis.game?.userColor === 'black'}
                  />
                </div>
                
                {/* Game Analysis */}
                <div className="lg:col-span-3 order-1 lg:order-2">
                  <GameAnalysis 
                    game={gameAnalysis.game}
                    analysis={gameAnalysis.analysis}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
