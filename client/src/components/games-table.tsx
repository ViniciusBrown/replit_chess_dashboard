import { useState } from "react";
import { useLocation } from "wouter";
import { Game } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiLichess, SiChessdotcom } from "react-icons/si";

interface GamesTableProps {
  games: Game[];
  isLoading: boolean;
  itemsPerPage?: number;
}

export default function GamesTable({ 
  games, 
  isLoading,
  itemsPerPage = 10 
}: GamesTableProps) {
  const [_, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination
  const totalPages = Math.ceil(games.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = games.slice(startIndex, endIndex);
  
  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are only a few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show a subset of pages with ellipsis
      if (currentPage <= 3) {
        // We're near the start
        for (let i = 1; i <= 3; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("ellipsis");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // We're near the end
        pageNumbers.push(1);
        pageNumbers.push("ellipsis");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // We're in the middle
        pageNumbers.push(1);
        pageNumbers.push("ellipsis");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("ellipsis");
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  // Handle page changes
  const changePage = (page: number) => {
    setCurrentPage(page);
  };
  
  // Skeleton loader
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Opponent</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead className="w-[80px]">Result</TableHead>
                <TableHead className="w-[100px]">Platform</TableHead>
                <TableHead className="w-[100px]">Analysis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-3" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (games.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 mb-4">You don't have any games yet.</p>
        <p className="text-sm text-gray-400 mb-6">Import games from your linked accounts or upload PGN files to get started.</p>
      </div>
    );
  }
  
  // Get opponent initials for avatar
  const getOpponentInitials = (opponent: string | null): string => {
    if (!opponent) return "?";
    const words = opponent.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Format date string
  const formatDate = (dateString: string | null | Date): string => {
    if (!dateString) return "Unknown";
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Opponent</TableHead>
              <TableHead>Opening</TableHead>
              <TableHead className="w-[80px]">Result</TableHead>
              <TableHead className="w-[100px]">Platform</TableHead>
              <TableHead className="w-[100px]">Analysis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((game) => (
              <TableRow key={game.id}>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(game.date_played)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 rounded-full mr-3 bg-gray-200">
                      <AvatarFallback>
                        {getOpponentInitials(game.opponent)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium text-gray-900">
                      {game.opponent || "Unknown"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {game.opening || "Unknown Opening"}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    game.result === 'win' ? 'bg-green-100 text-green-800' :
                    game.result === 'loss' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {game.result === 'win' ? 'Win' :
                     game.result === 'loss' ? 'Loss' :
                     'Draw'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {game.platform === 'lichess' ? (
                      <SiLichess className="h-4 w-4 mr-2 text-primary" />
                    ) : game.platform === 'chesscom' ? (
                      <SiChessdotcom className="h-4 w-4 mr-2 text-primary" />
                    ) : (
                      <span className="h-4 w-4 mr-2 flex items-center justify-center text-xs">M</span>
                    )}
                    <span className="text-sm text-gray-500">
                      {game.platform === 'lichess' ? 'Lichess' :
                       game.platform === 'chesscom' ? 'Chess.com' :
                       'Manual'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  <a 
                    href={`/game/${game.id}`}
                    className="text-primary hover:text-primary-dark"
                    onClick={(e) => {
                      e.preventDefault();
                      setLocation(`/game/${game.id}`);
                    }}
                  >
                    View Analysis
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, games.length)}</span> of <span className="font-medium">{games.length}</span> games
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => changePage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {getPageNumbers().map((page, i) => (
                page === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => changePage(page as number)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
