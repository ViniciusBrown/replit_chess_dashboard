import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LinkedAccount, insertLinkedAccountSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, LinkIcon, Link2 } from "lucide-react";
import { SiLichess, SiChessdotcom } from "react-icons/si";

interface AccountConnectionCardProps {
  platform: 'lichess' | 'chesscom';
  isConnected: boolean;
  accountData?: LinkedAccount;
  isLoading: boolean;
}

// Form schema for connecting account
const connectionFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  platform: z.enum(["lichess", "chesscom"]),
});

type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

export default function AccountConnectionCard({
  platform,
  isConnected,
  accountData,
  isLoading,
}: AccountConnectionCardProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Form for connecting a new account
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      username: "",
      platform: platform,
    },
  });
  
  // Connect account mutation
  const connectMutation = useMutation({
    mutationFn: async (values: ConnectionFormValues) => {
      const res = await apiRequest("POST", "/api/linked-accounts", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/linked-accounts"] });
      setIsConnecting(false);
      toast({
        title: "Account connected",
        description: `Your ${platform === 'lichess' ? 'Lichess' : 'Chess.com'} account has been connected successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to connect account",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Disconnect account mutation
  const disconnectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/linked-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/linked-accounts"] });
      toast({
        title: "Account disconnected",
        description: `Your ${platform === 'lichess' ? 'Lichess' : 'Chess.com'} account has been disconnected.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disconnect account",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Sync account mutation
  const syncMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/linked-accounts/${id}/sync`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/linked-accounts"] });
      toast({
        title: "Account synced",
        description: `Your ${platform === 'lichess' ? 'Lichess' : 'Chess.com'} account has been synced successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to sync account",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ConnectionFormValues) => {
    connectMutation.mutate(values);
  };
  
  const handleDisconnect = (id: number) => {
    disconnectMutation.mutate(id);
  };
  
  const handleSync = (id: number) => {
    syncMutation.mutate(id);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {platform === 'lichess' ? (
              <SiLichess className="w-10 h-10 mr-3 text-primary" />
            ) : (
              <SiChessdotcom className="w-10 h-10 mr-3 text-primary" />
            )}
            <h4 className="text-lg font-medium">
              {platform === 'lichess' ? 'Lichess' : 'Chess.com'}
            </h4>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
          }`}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        ) : isConnected && accountData ? (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Username: <span className="font-medium">{accountData.username}</span></p>
              <p className="text-sm text-gray-600">Last sync: <span className="font-medium">
                {accountData.last_sync ? new Date(accountData.last_sync).toLocaleString() : 'Never'}
              </span></p>
            </div>
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                className="text-primary flex items-center text-sm"
                onClick={() => handleSync(accountData.id)}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {syncMutation.isPending ? 'Syncing...' : 'Sync Games'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive flex items-center text-sm"
                onClick={() => handleDisconnect(accountData.id)}
                disabled={disconnectMutation.isPending}
              >
                <Link2 className="h-3 w-3 mr-1" />
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ) : isConnecting ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder={`Enter your ${platform === 'lichess' ? 'Lichess' : 'Chess.com'} username`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={connectMutation.isPending}
                >
                  {connectMutation.isPending ? 'Connecting...' : 'Connect'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsConnecting(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Connect your {platform === 'lichess' ? 'Lichess' : 'Chess.com'} account to import your games and analyze your performance.
            </p>
            <Button 
              className="w-full flex items-center justify-center"
              onClick={() => setIsConnecting(true)}
            >
              <LinkIcon className="mr-1 h-4 w-4" />
              Connect Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
