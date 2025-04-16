import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Types for Linked Accounts
interface LinkedAccount {
  id: number;
  userId: number;
  platform: string;
  username: string;
  oauthToken: string | null;
  dateLinked: string;
}

export default function GameImport() {
  const { toast } = useToast();
  const [pgnText, setPgnText] = useState("");
  const [isPgnDialogOpen, setIsPgnDialogOpen] = useState(false);
  
  // Fetch linked accounts to determine what import options to show
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<LinkedAccount[]>({
    queryKey: ["/api/linked-accounts"],
  });
  
  // Check if user has Lichess or Chess.com accounts linked
  const hasLichessAccount = accounts?.some(account => account.platform === "lichess");
  const hasChessComAccount = accounts?.some(account => account.platform === "chess.com");
  
  // Import from Lichess
  const importLichessMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/import/lichess");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Games Imported",
        description: `Successfully imported ${data.count} games from Lichess`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Import from Chess.com
  const importChessComMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/import/chess.com");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Games Imported",
        description: `Successfully imported ${data.count} games from Chess.com`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Import PGN
  const importPgnMutation = useMutation({
    mutationFn: async (pgn: string) => {
      const res = await apiRequest("POST", "/api/import/pgn", { pgn });
      return await res.json();
    },
    onSuccess: () => {
      setPgnText("");
      setIsPgnDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "PGN Imported",
        description: "Your game has been successfully imported and is being analyzed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle import from Lichess
  const handleImportLichess = () => {
    importLichessMutation.mutate();
  };
  
  // Handle import from Chess.com
  const handleImportChessCom = () => {
    importChessComMutation.mutate();
  };
  
  // Handle PGN import
  const handleImportPgn = () => {
    if (!pgnText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid PGN",
        variant: "destructive",
      });
      return;
    }
    
    importPgnMutation.mutate(pgnText);
  };
  
  // Handle PGN file upload
  const handlePgnFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPgnText(content);
      setIsPgnDialogOpen(true);
    };
    reader.readAsText(file);
    
    // Reset the input value so the same file can be uploaded again if needed
    e.target.value = "";
  };
  
  // Calculate "last import" dates
  const getLastImportDate = (platform: string) => {
    // This would come from the actual data in a real implementation
    if (platform === "lichess") return "2 days ago";
    if (platform === "chess.com") return "5 days ago";
    return "Never";
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-neutral-800">Import Games</CardTitle>
        
        <div>
          <label htmlFor="pgn-upload" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent cursor-pointer">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload PGN
          </label>
          <input 
            id="pgn-upload" 
            type="file" 
            className="hidden" 
            accept=".pgn" 
            onChange={handlePgnFileUpload}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoadingAccounts ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-4 shadow-sm hover:border-neutral-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Import from Lichess</h3>
                  <p className="text-xs text-neutral-500 mt-1">Last import: {getLastImportDate("lichess")}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-primary bg-primary/10 hover:bg-primary/20"
                  onClick={handleImportLichess}
                  disabled={!hasLichessAccount || importLichessMutation.isPending}
                >
                  {importLichessMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Importing...
                    </span>
                  ) : "Import Now"}
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-4 shadow-sm hover:border-neutral-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Import from Chess.com</h3>
                  <p className="text-xs text-neutral-500 mt-1">Last import: {getLastImportDate("chess.com")}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-primary bg-primary/10 hover:bg-primary/20"
                  onClick={handleImportChessCom}
                  disabled={!hasChessComAccount || importChessComMutation.isPending}
                >
                  {importChessComMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Importing...
                    </span>
                  ) : "Import Now"}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Manual PGN Import Dialog */}
        <Dialog open={isPgnDialogOpen} onOpenChange={setIsPgnDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import PGN</DialogTitle>
              <DialogDescription>
                Paste your PGN data or edit the uploaded file content
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Textarea
                placeholder="Paste your PGN here..."
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPgnDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImportPgn}
                disabled={importPgnMutation.isPending}
              >
                {importPgnMutation.isPending ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </span>
                ) : "Import Game"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
