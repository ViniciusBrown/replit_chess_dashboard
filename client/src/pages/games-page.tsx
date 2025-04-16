import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Filter, 
  ChevronDown, 
  ArrowUpDown, 
  MoreHorizontal, 
  Loader2 
} from "lucide-react";
import { Chess } from "chess.js";

interface Game {
  id: number;
  userId: number;
  platform: string;
  pgn: string;
  datePlayed: string;
  importedAt: string;
}

export default function GamesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage] = useState(10);
  
  // Fetch games
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
  
  // Calculate pagination
  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = games ? games.slice(indexOfFirstGame, indexOfLastGame) : [];
  const totalPages = games ? Math.ceil(games.length / gamesPerPage) : 0;
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // Extract game information from PGN
  const extractGameInfo = (pgn: string) => {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const headers = chess.header();
      
      return {
        white: headers.White || 'Unknown',
        black: headers.Black || 'Unknown',
        result: headers.Result || '*',
        date: headers.Date,
        event: headers.Event,
        opening: headers.Opening || 'Unknown Opening',
        eco: headers.ECO,
      };
    } catch (e) {
      console.error('Error parsing PGN:', e);
      return {
        white: 'Unknown',
        black: 'Unknown',
        result: '*',
        date: '',
        event: '',
        opening: 'Unknown Opening',
        eco: '',
      };
    }
  };
  
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
  
  // Get badge color based on result
  const getResultBadgeVariant = (result: string, userColor: 'white' | 'black') => {
    if (result === '1-0' && userColor === 'white') return 'success';
    if (result === '0-1' && userColor === 'black') return 'success';
    if (result === '1/2-1/2') return 'secondary';
    return 'destructive';
  };
  
  // Format result text
  const formatResult = (result: string, userColor: 'white' | 'black') => {
    if (result === '1-0') return userColor === 'white' ? 'Win' : 'Loss';
    if (result === '0-1') return userColor === 'black' ? 'Win' : 'Loss';
    if (result === '1/2-1/2') return 'Draw';
    return 'Unknown';
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">My Games</h1>
              <p className="mt-1 text-sm text-neutral-600">View and analyze your chess games</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-3 flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All Games</DropdownMenuItem>
                <DropdownMenuItem>Wins Only</DropdownMenuItem>
                <DropdownMenuItem>Losses Only</DropdownMenuItem>
                <DropdownMenuItem>Lichess Games</DropdownMenuItem>
                <DropdownMenuItem>Chess.com Games</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center">
            <CardTitle className="text-lg font-medium text-neutral-800">Game History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-neutral-600">Loading games...</span>
              </div>
            ) : !games || games.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-medium text-neutral-800 mb-2">No games found</p>
                <p className="text-sm text-neutral-600 mb-6">
                  Import games from your linked accounts or upload PGN files
                </p>
                <Link href="/">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            Opening
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Opponent</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentGames.map((game) => {
                        const gameInfo = extractGameInfo(game.pgn);
                        // Assume the user is white for now (in a real app, would determine this from the username)
                        const userColor = 'white' as 'white' | 'black';
                        
                        return (
                          <TableRow key={game.id}>
                            <TableCell className="font-medium">
                              {formatDate(game.datePlayed)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[250px] truncate">
                                {gameInfo.opening}
                                {gameInfo.eco && (
                                  <span className="text-neutral-500 ml-1">[{gameInfo.eco}]</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {userColor === 'white' ? gameInfo.black : gameInfo.white}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {game.platform}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getResultBadgeVariant(gameInfo.result, userColor)}>
                                {formatResult(gameInfo.result, userColor)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Link href={`/analysis/${game.id}`}>
                                      View Analysis
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Export PGN</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                          .map((page, index, array) => {
                            // Add ellipsis
                            if (index > 0 && page > array[index - 1] + 1) {
                              return (
                                <PaginationItem key={`ellipsis-${page}`}>
                                  <span className="px-2">...</span>
                                </PaginationItem>
                              );
                            }
                            
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  isActive={page === currentPage}
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })
                        }
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
