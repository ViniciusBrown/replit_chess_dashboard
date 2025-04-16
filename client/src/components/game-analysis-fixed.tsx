import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import ChessBoard from './chess-board';
import { Chess } from 'chess.js';

interface KeyMoment {
  moveNumber: number;
  position: string;
  type: 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'excellent';
  description: string;
}

interface MissedTactic {
  moveNumber: number;
  position: string;
  tactic: string;
  explanation: string;
}

interface GameAnalysis {
  outcome?: string;
  userColor?: string;
  accuracy?: number;
  blunders?: number;
  mistakes?: number;
  inaccuracies?: number;
  keyMoments?: KeyMoment[];
}

interface TacticsAnalysis {
  missedTactics?: MissedTactic[];
  executedTactics?: {
    moveNumber: number;
    position: string;
    tactic: string;
  }[];
}

interface OpeningsAnalysis {
  eco?: string;
  name?: string;
  accuracy?: number;
  commonLines?: {
    name: string;
    moves: string;
  }[];
  recommendations?: string[];
}

interface FundamentalsAnalysis {
  pieceDevelopment?: number;
  centerControl?: number;
  kingSafety?: number;
  pawnStructure?: number;
  recommendations?: string[];
}

interface GameAnalysisProps {
  game: {
    id: number;
    pgn: string;
    platform: string;
    datePlayed?: string;
  };
  analysis?: {
    game?: GameAnalysis;
    tactics?: TacticsAnalysis;
    openings?: OpeningsAnalysis;
    fundamentals?: FundamentalsAnalysis;
  };
}

export default function GameAnalysis({ game, analysis }: GameAnalysisProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  
  // Check if analysis and its properties exist
  const hasGameAnalysis = Boolean(analysis?.game);
  const hasTacticsAnalysis = Boolean(analysis?.tactics);
  const hasOpeningsAnalysis = Boolean(analysis?.openings);
  const hasFundamentalsAnalysis = Boolean(analysis?.fundamentals);
  
  // Extract game metadata
  const chess = new Chess();
  try {
    chess.loadPgn(game.pgn);
  } catch (e) {
    console.error("Failed to load PGN:", e);
  }
  
  const header = chess.header();
  const { White: white, Black: black, Result: result, Site: site, Date: date, Event: event, Opening: opening } = header;
  
  // Determine if the user won, lost, or drew the game
  const gameResult = analysis?.game?.outcome || 'Unknown';
  
  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Create markers for the board based on the active tab
  const getMarkers = () => {
    if ((activeTab === 'summary' || activeTab === 'game') && hasGameAnalysis && analysis?.game?.keyMoments?.length) {
      return analysis.game.keyMoments.map(moment => ({
        square: '', // We would need the actual square from the position FEN
        type: moment.type,
      }));
    } else if (activeTab === 'tactics' && hasTacticsAnalysis && analysis?.tactics?.missedTactics?.length) {
      return analysis.tactics.missedTactics.map(tactic => ({
        square: '', // We would need the actual square from the position FEN
        type: 'tactic' as 'tactic',
      }));
    }
    
    return [];
  };
  
  // Jump to a specific position from a key moment or tactic
  const jumpToPosition = (moveNumber: number) => {
    if (hasGameAnalysis && analysis?.game?.userColor) {
      setCurrentMoveIndex(moveNumber * 2 - (analysis.game.userColor === 'white' ? 1 : 2));
    }
  };
  
  // If no analysis is available, show a loading or empty state
  if (!analysis || (!hasGameAnalysis && !hasTacticsAnalysis && !hasOpeningsAnalysis && !hasFundamentalsAnalysis)) {
    return (
      <div className="p-6 bg-neutral-100 rounded-lg text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
        <h3 className="text-lg font-medium text-neutral-700 mb-1">Analysis Not Available</h3>
        <p className="text-sm text-neutral-600">
          The analysis for this game is not available yet. It may be processing or there might have been an error.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold mb-4">{opening || 'Chess Game'}</h3>
            <ChessBoard 
              pgn={game.pgn} 
              markers={getMarkers()}
              currentMoveIndex={currentMoveIndex}
              onMoveChange={setCurrentMoveIndex}
              flipBoard={hasGameAnalysis && analysis?.game?.userColor === 'black'}
            />
          </div>
          
          <div>
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Game Information</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">White</span>
                  <span className="text-sm font-medium">{white || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Black</span>
                  <span className="text-sm font-medium">{black || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Result</span>
                  <span className="text-sm font-medium">{result || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Date</span>
                  <span className="text-sm font-medium">{formatDate(date)}</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Result</h4>
              <div className="flex items-center">
                <Badge 
                  className={`rounded-full px-3 py-1 ${
                    gameResult === 'win' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : gameResult === 'loss' 
                        ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                        : gameResult === 'draw' 
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' 
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  {gameResult === 'win' 
                    ? 'Victory' 
                    : gameResult === 'loss' 
                      ? 'Defeat' 
                      : gameResult === 'draw' 
                        ? 'Draw' 
                        : 'Unknown'}
                </Badge>
                {hasGameAnalysis && analysis?.game?.userColor && (
                  <span className="ml-2 text-sm text-neutral-600">
                    Playing as {analysis.game.userColor}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          {hasGameAnalysis && <TabsTrigger value="game">Game Analysis</TabsTrigger>}
          {hasTacticsAnalysis && <TabsTrigger value="tactics">Tactics</TabsTrigger>}
          {hasOpeningsAnalysis && <TabsTrigger value="opening">Opening</TabsTrigger>}
          {hasFundamentalsAnalysis && <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>}
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary">
          {hasGameAnalysis && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Performance Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hasGameAnalysis && analysis?.game?.accuracy !== undefined && (
                  <div className="bg-neutral-100 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{analysis.game.accuracy.toFixed(0)}%</div>
                    <div className="text-xs text-neutral-600 mt-1">Accuracy</div>
                  </div>
                )}
                {hasGameAnalysis && analysis?.game?.blunders !== undefined && (
                  <div className="bg-neutral-100 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{analysis.game.blunders}</div>
                    <div className="text-xs text-neutral-600 mt-1">Blunders</div>
                  </div>
                )}
                {hasTacticsAnalysis && analysis?.tactics?.missedTactics && (
                  <div className="bg-neutral-100 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{analysis.tactics.missedTactics.length}</div>
                    <div className="text-xs text-neutral-600 mt-1">Missed Tactics</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {hasGameAnalysis && analysis?.game?.keyMoments && analysis.game.keyMoments.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Key Moments</h4>
              <div className="divide-y divide-neutral-200">
                {analysis.game.keyMoments.slice(0, 3).map((moment, index) => (
                  <div key={index} className="py-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          moment.type === 'blunder' 
                            ? 'bg-red-500' 
                            : moment.type === 'excellent' 
                              ? 'bg-green-500' 
                              : 'bg-blue-500'
                        }`}>
                          {moment.type === 'blunder' 
                            ? '!' 
                            : moment.type === 'excellent' 
                              ? '✓' 
                              : '↗'}
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-neutral-800">
                          {moment.type === 'blunder' 
                            ? `Blunder on move ${moment.moveNumber}` 
                            : moment.type === 'excellent' 
                              ? `Excellent move on move ${moment.moveNumber}` 
                              : `Good move on move ${moment.moveNumber}`}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">{moment.description}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-primary hover:bg-primary/5 p-0 h-auto"
                          onClick={() => jumpToPosition(moment.moveNumber)}
                        >
                          View position
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {hasFundamentalsAnalysis && hasGameAnalysis && hasOpeningsAnalysis && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Areas to Improve</h4>
              <div className="space-y-4">
                {hasFundamentalsAnalysis && analysis?.fundamentals?.pawnStructure !== undefined && (
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-neutral-800">
                          Endgame Technique
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-neutral-600">
                          {analysis.fundamentals.pawnStructure}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-neutral-200">
                      <div 
                        style={{ width: `${analysis.fundamentals.pawnStructure}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      ></div>
                    </div>
                  </div>
                )}
                
                {hasGameAnalysis && analysis?.game?.accuracy !== undefined && (
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-neutral-800">
                          Calculation Accuracy
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-neutral-600">
                          {analysis.game.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-neutral-200">
                      <div 
                        style={{ width: `${analysis.game.accuracy}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      ></div>
                    </div>
                  </div>
                )}
                
                {hasOpeningsAnalysis && analysis?.openings?.accuracy !== undefined && (
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-neutral-800">
                          Opening Knowledge
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-neutral-600">
                          {analysis.openings.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-neutral-200">
                      <div 
                        style={{ width: `${analysis.openings.accuracy}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Game Analysis Tab */}
        {hasGameAnalysis && (
          <TabsContent value="game" className="mt-4">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Game Analysis</h4>
              {analysis?.game?.accuracy !== undefined && analysis.game.blunders !== undefined && 
                analysis.game.mistakes !== undefined && analysis.game.inaccuracies !== undefined && (
                <p className="text-sm text-neutral-600 mb-4">
                  Analysis of your game shows an accuracy of <span className="font-medium">{analysis.game.accuracy.toFixed(0)}%</span>.
                  You made <span className="font-medium text-red-600">{analysis.game.blunders}</span> blunders,{' '}
                  <span className="font-medium text-orange-600">{analysis.game.mistakes}</span> mistakes, and{' '}
                  <span className="font-medium text-yellow-600">{analysis.game.inaccuracies}</span> inaccuracies.
                </p>
              )}
              
              {analysis?.game?.keyMoments && analysis.game.keyMoments.length > 0 && (
                <div className="divide-y divide-neutral-200">
                  {analysis.game.keyMoments.map((moment, index) => (
                    <div key={index} className="py-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                            moment.type === 'blunder' 
                              ? 'bg-red-500' 
                              : moment.type === 'mistake'
                                ? 'bg-orange-500'
                                : moment.type === 'inaccuracy'
                                  ? 'bg-yellow-500'
                                  : moment.type === 'excellent'
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                          }`}>
                            {moment.type.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-neutral-800">
                            {moment.type.charAt(0).toUpperCase() + moment.type.slice(1)} on move {moment.moveNumber}
                          </p>
                          <p className="mt-1 text-sm text-neutral-600">{moment.description}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2 text-primary hover:bg-primary/5 p-0 h-auto"
                            onClick={() => jumpToPosition(moment.moveNumber)}
                          >
                            View position
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}
        
        {/* Tactics Tab */}
        {hasTacticsAnalysis && (
          <TabsContent value="tactics" className="mt-4">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Missed Tactical Opportunities</h4>
              
              {analysis?.tactics?.missedTactics && (
                <>
                  {analysis.tactics.missedTactics.length === 0 ? (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Great job! You didn't miss any tactical opportunities in this game.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-200">
                      {analysis.tactics.missedTactics.map((tactic, index) => (
                        <div key={index} className="py-3">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                T
                              </div>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-neutral-800">
                                Missed {tactic.tactic} on move {tactic.moveNumber}
                              </p>
                              <p className="mt-1 text-sm text-neutral-600">{tactic.explanation}</p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 text-primary hover:bg-primary/5 p-0 h-auto"
                                onClick={() => jumpToPosition(tactic.moveNumber)}
                              >
                                View position
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {analysis?.tactics?.executedTactics && analysis.tactics.executedTactics.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3 mt-6">Tactics You Found</h4>
                  <div className="divide-y divide-neutral-200">
                    {analysis.tactics.executedTactics.map((tactic, index) => (
                      <div key={index} className="py-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                              ✓
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-neutral-800">
                              Found {tactic.tactic} on move {tactic.moveNumber}
                            </p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 text-primary hover:bg-primary/5 p-0 h-auto"
                              onClick={() => jumpToPosition(tactic.moveNumber)}
                            >
                              View position
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        )}
        
        {/* Opening Tab */}
        {hasOpeningsAnalysis && (
          <TabsContent value="opening" className="mt-4">
            <div className="mb-6">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 mb-4">
                <h4 className="text-sm font-semibold text-neutral-800 mb-2">Opening Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis?.openings?.eco && (
                    <div>
                      <p className="text-xs text-neutral-600">ECO Code</p>
                      <p className="text-sm font-medium">{analysis.openings.eco}</p>
                    </div>
                  )}
                  {analysis?.openings?.name && (
                    <div>
                      <p className="text-xs text-neutral-600">Opening Name</p>
                      <p className="text-sm font-medium">{analysis.openings.name}</p>
                    </div>
                  )}
                  {analysis?.openings?.accuracy !== undefined && (
                    <div>
                      <p className="text-xs text-neutral-600">Your Accuracy</p>
                      <p className="text-sm font-medium">{analysis.openings.accuracy.toFixed(0)}%</p>
                    </div>
                  )}
                </div>
              </div>
              
              {analysis?.openings?.commonLines && analysis.openings.commonLines.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Common Lines</h4>
                  <div className="space-y-4">
                    {analysis.openings.commonLines.map((line, index) => (
                      <div key={index} className="bg-neutral-100 p-3 rounded-lg">
                        <p className="text-sm font-medium text-neutral-800">{line.name}</p>
                        <p className="text-xs font-mono mt-1">{line.moves}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {analysis?.openings?.recommendations && analysis.openings.recommendations.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-neutral-800 uppercase mt-6 mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {analysis.openings.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <p className="ml-2 text-sm text-neutral-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        )}
        
        {/* Fundamentals Tab */}
        {hasFundamentalsAnalysis && (
          <TabsContent value="fundamentals" className="mt-4">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-800 uppercase mb-3">Chess Fundamentals Analysis</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {analysis?.fundamentals?.pieceDevelopment !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <h5 className="text-sm font-medium mb-4">Piece Development</h5>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-primary">
                              {analysis.fundamentals.pieceDevelopment}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-neutral-200">
                          <div 
                            style={{ width: `${analysis.fundamentals.pieceDevelopment}%` }} 
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-600">
                          {(analysis.fundamentals.pieceDevelopment > 80) 
                            ? 'Excellent piece development in the opening.'
                            : (analysis.fundamentals.pieceDevelopment > 60)
                              ? 'Good piece development, but there\'s room for improvement.'
                              : 'Focus on developing your pieces earlier in the game.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {analysis?.fundamentals?.centerControl !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <h5 className="text-sm font-medium mb-4">Center Control</h5>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-primary">
                              {analysis.fundamentals.centerControl}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-neutral-200">
                          <div 
                            style={{ width: `${analysis.fundamentals.centerControl}%` }} 
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-600">
                          {(analysis.fundamentals.centerControl > 80) 
                            ? 'Excellent control of the center throughout the game.'
                            : (analysis.fundamentals.centerControl > 60)
                              ? 'Good center control, but could be improved in certain positions.'
                              : 'Focus on controlling the center with pawns and pieces.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {analysis?.fundamentals?.kingSafety !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <h5 className="text-sm font-medium mb-4">King Safety</h5>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-primary">
                              {analysis.fundamentals.kingSafety}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-neutral-200">
                          <div 
                            style={{ width: `${analysis.fundamentals.kingSafety}%` }} 
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-600">
                          {(analysis.fundamentals.kingSafety > 80) 
                            ? 'Your king was well protected throughout the game.'
                            : (analysis.fundamentals.kingSafety > 60)
                              ? 'Good king safety, but there were some vulnerable moments.'
                              : 'Pay more attention to your king\'s safety and castle earlier.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {analysis?.fundamentals?.pawnStructure !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <h5 className="text-sm font-medium mb-4">Pawn Structure</h5>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-primary">
                              {analysis.fundamentals.pawnStructure}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-neutral-200">
                          <div 
                            style={{ width: `${analysis.fundamentals.pawnStructure}%` }} 
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-600">
                          {(analysis.fundamentals.pawnStructure > 80) 
                            ? 'Excellent pawn structure management throughout the game.'
                            : (analysis.fundamentals.pawnStructure > 60)
                              ? 'Good pawn structure, with some minor weaknesses.'
                              : 'Work on avoiding weak pawns and creating pawn breaks.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {analysis?.fundamentals?.recommendations && analysis.fundamentals.recommendations.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-neutral-800 uppercase mt-6 mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {analysis.fundamentals.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <p className="ml-2 text-sm text-neutral-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}