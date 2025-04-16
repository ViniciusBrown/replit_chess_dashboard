import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Game, AnalysisResult } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import ChessBoard from "@/components/chess-board";
import GameAnalysis from "@/components/game-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, DownloadCloud } from "lucide-react";

export default function GameDetailsPage() {
  const { id } = useParams();
  const gameId = parseInt(id);
  
  // Fetch game details
  const { 
    data: game, 
    isLoading: isLoadingGame,
    error: gameError 
  } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !isNaN(gameId),
  });
  
  // Fetch analysis results
  const { 
    data: analysisResults, 
    isLoading: isLoadingAnalysis,
    error: analysisError 
  } = useQuery<AnalysisResult[]>({
    queryKey: [`/api/games/${gameId}/analysis`],
    enabled: !isNaN(gameId),
  });
  
  // Handle the case of invalid ID or loading
  if (isNaN(gameId)) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Game ID</AlertTitle>
            <AlertDescription>The game ID is not valid.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center">
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <a href="/analysis">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Button>
            <h2 className="font-serif text-2xl font-bold text-gray-800">
              Game Details
              {game && game.opening && ` - ${game.opening}`}
            </h2>
          </div>
        </header>
        
        <main className="p-4 sm:p-6 lg:p-8">
          {(gameError || analysisError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {gameError ? "Failed to load game details." : "Failed to load analysis results."}
              </AlertDescription>
            </Alert>
          )}
          
          {isLoadingGame ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gray-100 rounded"></div>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : game ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Chess Board */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{game.opening || "Chess Game"}</CardTitle>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        game.result === 'win' ? 'bg-green-100 text-green-800' :
                        game.result === 'loss' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {game.result === 'win' ? 'Win' :
                         game.result === 'loss' ? 'Loss' :
                         'Draw'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChessBoard pgn={game.pgn} />
                    
                    <div className="flex justify-between text-sm text-gray-600 mt-4">
                      <div>
                        <p>vs. {game.opponent || "Unknown"}</p>
                        <p>
                          {game.date_played ? new Date(game.date_played).toLocaleDateString() : "Unknown date"}
                          {game.time_control ? ` • ${game.time_control}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p>Platform: {game.platform === 'lichess' ? 'Lichess' : 
                                    game.platform === 'chesscom' ? 'Chess.com' : 
                                    'Manual Upload'}</p>
                        <Button variant="ghost" size="sm" className="text-primary flex items-center">
                          <DownloadCloud className="h-3 w-3 mr-1" />
                          Download PGN
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Analysis Summary */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingAnalysis ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-full"></div>
                          <div className="h-4 bg-gray-100 rounded w-full"></div>
                          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        </div>
                      ) : analysisResults && analysisResults.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {analysisResults.map((result, index) => {
                            const data = result.result_json as any;
                            return (
                              <li key={index} className="flex items-start">
                                <span className="material-icons text-primary mr-2 text-sm">
                                  info
                                </span>
                                <span>{data.summary}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 mb-2">No analysis available yet.</p>
                          <Button>Analyze Game</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {analysisResults && analysisResults.length > 0 && (
                    <Card>
                      <CardHeader className="pb-0">
                        <Tabs defaultValue="tactics">
                          <TabsList>
                            <TabsTrigger value="tactics">Tactics</TabsTrigger>
                            <TabsTrigger value="openings">Openings</TabsTrigger>
                            <TabsTrigger value="middlegame">Middlegame</TabsTrigger>
                            <TabsTrigger value="endgame">Endgame</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </CardHeader>
                      <CardContent>
                        <TabsContent value="tactics" className="mt-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium">Critical Moments</h6>
                              <span className="text-sm text-gray-500">3 found</span>
                            </div>
                            
                            <div className="border border-gray-200 rounded-md p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Move 24: Missed Tactic</span>
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">-5.2</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">You played Qd7, but Rxe6+ would have led to a winning position.</p>
                              <div className="flex justify-between">
                                <Button variant="ghost" size="sm" className="text-primary text-sm flex items-center">
                                  View Position
                                </Button>
                                <Button variant="ghost" size="sm" className="text-secondary text-sm flex items-center">
                                  Practice Similar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="openings" className="mt-4">
                          <p className="text-sm text-gray-600">
                            Opening analysis information would appear here.
                          </p>
                        </TabsContent>
                        
                        <TabsContent value="middlegame" className="mt-4">
                          <p className="text-sm text-gray-600">
                            Middlegame analysis information would appear here.
                          </p>
                        </TabsContent>
                        
                        <TabsContent value="endgame" className="mt-4">
                          <p className="text-sm text-gray-600">
                            Endgame analysis information would appear here.
                          </p>
                        </TabsContent>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              
              {/* PGN View */}
              <Card>
                <CardHeader>
                  <CardTitle>PGN</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                    {game.pgn}
                  </pre>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Game not found</AlertTitle>
              <AlertDescription>
                The requested game could not be found.
              </AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    </div>
  );
}
