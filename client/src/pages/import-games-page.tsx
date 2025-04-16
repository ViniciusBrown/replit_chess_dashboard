import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { LinkedAccount } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import ImportGameModal from "@/components/import-game-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileUp, RefreshCw } from "lucide-react";

export default function ImportGamesPage() {
  const { user } = useAuth();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Fetch linked accounts
  const { 
    data: linkedAccounts, 
    isLoading: isLoadingAccounts, 
    error: accountsError 
  } = useQuery<LinkedAccount[]>({
    queryKey: ["/api/linked-accounts"],
  });
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h2 className="font-serif text-2xl font-bold text-gray-800">Import Games</h2>
            <Button 
              className="flex items-center"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileUp className="mr-1 h-4 w-4" />
              Import Game
            </Button>
          </div>
        </header>
        
        <main className="p-4 sm:p-6 lg:p-8">
          {accountsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load your linked accounts. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Connected Accounts */}
          <section className="mb-8">
            <h3 className="text-xl font-serif font-bold mb-4">Connected Accounts</h3>
            
            {!isLoadingAccounts && (!linkedAccounts || linkedAccounts.length === 0) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">You don't have any chess accounts connected yet.</p>
                    <Button onClick={() => setIsImportModalOpen(true)}>
                      Connect Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {linkedAccounts && linkedAccounts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedAccounts.map(account => (
                  <Card key={account.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {account.platform === 'lichess' ? 'Lichess' : 'Chess.com'}
                        </CardTitle>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Connected
                        </span>
                      </div>
                      <CardDescription>
                        Username: {account.username}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          Last sync: {account.last_sync ? new Date(account.last_sync).toLocaleString() : 'Never'}
                        </p>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Sync Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
          
          {/* Import Options */}
          <section>
            <h3 className="text-xl font-serif font-bold mb-4">Import Options</h3>
            
            <Card>
              <CardHeader>
                <CardTitle>Import Games</CardTitle>
                <CardDescription>
                  Choose how you want to import your chess games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="bulk" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
                    <TabsTrigger value="pgn">PGN Upload</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bulk" className="py-4">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Import multiple games at once from your connected chess platform accounts.
                      </p>
                      
                      {linkedAccounts && linkedAccounts.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {linkedAccounts.map(account => (
                              <Card key={account.id}>
                                <CardContent className="pt-6">
                                  <h4 className="font-medium mb-2">
                                    {account.platform === 'lichess' ? 'Lichess' : 'Chess.com'}: {account.username}
                                  </h4>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button variant="outline" size="sm">Last 10 Games</Button>
                                      <Button variant="outline" size="sm">Last 20 Games</Button>
                                      <Button variant="outline" size="sm">Last 50 Games</Button>
                                      <Button variant="outline" size="sm">Last 100 Games</Button>
                                    </div>
                                    <Button className="w-full">Import Games</Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setIsImportModalOpen(true)}
                          className="w-full"
                        >
                          Connect Chess Platform
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pgn" className="py-4">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Upload a PGN file containing one or more chess games.
                      </p>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <FileUp className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">
                            Drag and drop your PGN file here, or click to browse
                          </p>
                          <Button variant="outline" size="sm">
                            Browse Files
                          </Button>
                        </div>
                      </div>
                      
                      <Button className="w-full" disabled>
                        Upload and Import
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="py-4">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Paste PGN text directly to import a single game.
                      </p>
                      
                      <textarea 
                        className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                        placeholder="Paste PGN text here..."
                      ></textarea>
                      
                      <Button className="w-full">
                        Import Game
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
      
      {/* Import Game Modal */}
      <ImportGameModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        linkedAccounts={linkedAccounts || []} 
      />
    </div>
  );
}
