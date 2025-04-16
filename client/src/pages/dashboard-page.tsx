import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import ConnectedAccounts from "@/components/connected-accounts";
import GameImport from "@/components/game-import";
import ChessBoard from "@/components/chess-board";
import GameAnalysis from "@/components/game-analysis";
import ProgressSection from "@/components/progress-section";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Game {
  id: number;
  userId: number;
  platform: string;
  pgn: string;
  datePlayed: string;
  importedAt: string;
}

interface AnalysisResult {
  id: number;
  gameId: number;
  pipeline: string;
  resultJson: any;
  createdAt: string;
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

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch recent games with limit=1 to get the most recent one
  const { data: recentGames, isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ["/api/games?limit=1"],
  });
  
  // If we have a recent game, fetch its analysis
  const recentGameId = recentGames && recentGames.length > 0 ? recentGames[0].id : null;
  const { data: gameAnalysis, isLoading: isLoadingAnalysis } = useQuery<GameWithAnalysis>({
    queryKey: [`/api/games/${recentGameId}`],
    enabled: !!recentGameId,
  });
  
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
        <div className="px-4 sm:px-0 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">Get insights from your recent games and track your progress</p>
        </div>
        
        {/* Account and Import Sections */}
        <div className="space-y-6">
          <ConnectedAccounts />
          <GameImport />
          
          {/* Recent Game Analysis */}
          {isLoadingGames || isLoadingAnalysis ? (
            <Card>
              <CardContent className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-neutral-600">Loading recent game analysis...</span>
              </CardContent>
            </Card>
          ) : !recentGameId ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">No games analyzed yet</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    Connect your chess accounts or upload a PGN file to get started
                  </p>
                  <label htmlFor="pgn-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer">
                    Upload Your First Game
                  </label>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg leading-6 font-medium text-neutral-800">Recent Game Analysis</h2>
                  <Link href="/games">
                    <a className="text-sm font-medium text-primary hover:text-primary-dark">View all analyses →</a>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Chess Board */}
                  <div className="lg:col-span-2 order-2 lg:order-1">
                    <ChessBoard 
                      pgn={gameAnalysis?.game.pgn}
                      markers={getMarkers()}
                    />
                  </div>
                  
                  {/* Game Analysis */}
                  <div className="lg:col-span-3 order-1 lg:order-2">
                    {gameAnalysis && (
                      <GameAnalysis 
                        game={gameAnalysis.game}
                        analysis={gameAnalysis.analysis}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Progress Section */}
          <ProgressSection />
        </div>
      </div>
    </Layout>
  );
}
