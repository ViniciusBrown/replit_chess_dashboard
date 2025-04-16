import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MoreHorizontal } from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Types for Linked Accounts
interface LinkedAccount {
  id: number;
  userId: number;
  platform: string;
  username: string;
  oauthToken: string | null;
  dateLinked: string;
}

export default function ConnectedAccounts() {
  const { toast } = useToast();
  const [chessComUsername, setChessComUsername] = useState("");
  const [isLichessDialogOpen, setIsLichessDialogOpen] = useState(false);
  const [isChessComDialogOpen, setIsChessComDialogOpen] = useState(false);
  
  // Fetch linked accounts
  const { data: accounts, isLoading } = useQuery<LinkedAccount[]>({
    queryKey: ["/api/linked-accounts"],
  });
  
  // Get Lichess OAuth URL
  const getLichessOAuthURL = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/oauth/lichess");
      return await res.json();
    },
    onSuccess: (data) => {
      // Redirect to Lichess OAuth page
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to connect to Lichess: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Link Chess.com account
  const linkChessComAccount = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/linked-accounts/chess.com", { username });
      return await res.json();
    },
    onSuccess: () => {
      setChessComUsername("");
      setIsChessComDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/linked-accounts"] });
      toast({
        title: "Success",
        description: "Chess.com account linked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to link Chess.com account: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Unlink account
  const unlinkAccount = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/linked-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/linked-accounts"] });
      toast({
        title: "Success",
        description: "Account unlinked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to unlink account: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle Lichess connection
  const handleConnectLichess = () => {
    getLichessOAuthURL.mutate();
  };
  
  // Handle Chess.com connection
  const handleConnectChessCom = () => {
    if (chessComUsername.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter your Chess.com username",
        variant: "destructive",
      });
      return;
    }
    
    linkChessComAccount.mutate(chessComUsername);
  };
  
  // Handle unlinking an account
  const handleUnlinkAccount = (id: number) => {
    unlinkAccount.mutate(id);
  };
  
  // Find accounts by platform
  const getLichessAccount = accounts?.find(account => account.platform === "lichess");
  const getChessComAccount = accounts?.find(account => account.platform === "chess.com");
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-neutral-800">Connected Accounts</CardTitle>
        
        <Dialog open={isLichessDialogOpen} onOpenChange={setIsLichessDialogOpen}>
          <Dialog open={isChessComDialogOpen} onOpenChange={setIsChessComDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                  Connect New Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={() => setIsLichessDialogOpen(true)}>
                    Lichess
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={() => setIsChessComDialogOpen(true)}>
                    Chess.com
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Lichess Connection Dialog */}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Lichess Account</DialogTitle>
                <DialogDescription>
                  You'll be redirected to Lichess to authorize access to your games.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-neutral-600">
                  This will allow ChessTutor to:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-600 list-disc pl-5">
                  <li>Read your games history</li>
                  <li>Access your account information</li>
                </ul>
                <p className="mt-4 text-sm text-neutral-600">
                  We never store your Lichess password and you can revoke access at any time.
                </p>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsLichessDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary-dark"
                  onClick={handleConnectLichess}
                  disabled={getLichessOAuthURL.isPending}
                >
                  {getLichessOAuthURL.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </span>
                  ) : "Connect to Lichess"}
                </Button>
              </DialogFooter>
            </DialogContent>
            
            {/* Chess.com Connection Dialog */}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Chess.com Account</DialogTitle>
                <DialogDescription>
                  Enter your Chess.com username to connect your account.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="chess-com-username" className="text-sm font-medium">
                      Chess.com Username
                    </label>
                    <Input
                      id="chess-com-username"
                      placeholder="Enter your username"
                      value={chessComUsername}
                      onChange={(e) => setChessComUsername(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-neutral-600">
                    We'll use this to fetch your games from Chess.com's public API.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsChessComDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary-dark"
                  onClick={handleConnectChessCom}
                  disabled={linkChessComAccount.isPending}
                >
                  {linkChessComAccount.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </span>
                  ) : "Connect Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : accounts?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-600">No chess accounts connected yet</p>
            <p className="text-sm text-neutral-500 mt-1">
              Connect your Lichess or Chess.com account to import your games
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Lichess Account */}
            <div className="relative rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm flex items-center space-x-3 hover:border-neutral-300">
              <div className="flex-shrink-0">
                <img className="h-10 w-10 rounded-full" src="https://lichess.org/assets/logo/lichess-favicon-128.png" alt="Lichess Logo" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800">Lichess</p>
                {getLichessAccount ? (
                  <p className="text-sm text-neutral-600 truncate">Connected as <span className="font-medium">{getLichessAccount.username}</span></p>
                ) : (
                  <p className="text-sm text-neutral-600 truncate">Not connected</p>
                )}
              </div>
              {getLichessAccount && (
                <>
                  <div className="flex-shrink-0 self-center flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-red-600 hover:text-red-700 focus:text-red-700"
                          onClick={() => handleUnlinkAccount(getLichessAccount.id)}
                          disabled={unlinkAccount.isPending}
                        >
                          Unlink Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute top-0 right-0 mt-1 mr-1">
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {/* Chess.com Account */}
            <div className="relative rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm flex items-center space-x-3 hover:border-neutral-300">
              <div className="flex-shrink-0">
                <img className="h-10 w-10 rounded-full" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/SamCopeland/phpZP7QrS.png" alt="Chess.com Logo" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800">Chess.com</p>
                {getChessComAccount ? (
                  <p className="text-sm text-neutral-600 truncate">Connected as <span className="font-medium">{getChessComAccount.username}</span></p>
                ) : (
                  <p className="text-sm text-neutral-600 truncate">Not connected</p>
                )}
              </div>
              {getChessComAccount && (
                <>
                  <div className="flex-shrink-0 self-center flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-red-600 hover:text-red-700 focus:text-red-700"
                          onClick={() => handleUnlinkAccount(getChessComAccount.id)}
                          disabled={unlinkAccount.isPending}
                        >
                          Unlink Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute top-0 right-0 mt-1 mr-1">
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
