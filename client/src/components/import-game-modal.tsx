import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LinkedAccount } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Checkbox,
  Input,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui";
import { AlertCircle, FileUp, Link, X } from "lucide-react";

// Form schemas
const importFromAccountSchema = z.object({
  platform: z.string().min(1, "Please select a platform"),
  range: z.string().min(1, "Please select a range"),
  analyzeAutomatically: z.boolean().default(false),
});

const uploadPgnSchema = z.object({
  pgn: z.string().min(1, "PGN content is required"),
  analyzeAutomatically: z.boolean().default(false),
});

type ImportFromAccountValues = z.infer<typeof importFromAccountSchema>;
type UploadPgnValues = z.infer<typeof uploadPgnSchema>;

interface ImportGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedAccounts: LinkedAccount[];
}

export default function ImportGameModal({ 
  isOpen, 
  onClose,
  linkedAccounts,
}: ImportGameModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("import-from-account");
  
  // Forms setup
  const accountForm = useForm<ImportFromAccountValues>({
    resolver: zodResolver(importFromAccountSchema),
    defaultValues: {
      platform: linkedAccounts[0]?.platform || "",
      range: "10",
      analyzeAutomatically: false,
    },
  });
  
  const uploadForm = useForm<UploadPgnValues>({
    resolver: zodResolver(uploadPgnSchema),
    defaultValues: {
      pgn: "",
      analyzeAutomatically: false,
    },
  });
  
  const pgnPasteForm = useForm<UploadPgnValues>({
    resolver: zodResolver(uploadPgnSchema),
    defaultValues: {
      pgn: "",
      analyzeAutomatically: false,
    },
  });
  
  // Import games from account mutation
  const importFromAccountMutation = useMutation({
    mutationFn: async (data: ImportFromAccountValues) => {
      // In a real implementation, this would call an endpoint that fetches games from the chess platform
      const res = await apiRequest("POST", "/api/games/import", {
        platform: data.platform,
        range: parseInt(data.range),
        analyzeAutomatically: data.analyzeAutomatically,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Games imported",
        description: "Your games have been imported successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Upload PGN mutation
  const uploadPgnMutation = useMutation({
    mutationFn: async (data: UploadPgnValues) => {
      const res = await apiRequest("POST", "/api/games", {
        pgn: data.pgn,
        platform: "manual",
        analyzeAutomatically: data.analyzeAutomatically,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "PGN uploaded",
        description: "Your game has been uploaded successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handlers
  const onImportFromAccount = (values: ImportFromAccountValues) => {
    importFromAccountMutation.mutate(values);
  };
  
  const onUploadPgn = (values: UploadPgnValues) => {
    uploadPgnMutation.mutate(values);
  };
  
  const onPastePgn = (values: UploadPgnValues) => {
    uploadPgnMutation.mutate(values);
  };
  
  // Filter available platforms (only show platforms that are connected)
  const availablePlatforms = linkedAccounts.map(account => account.platform);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Import Game</DialogTitle>
          <DialogDescription>
            You can import games directly from your linked accounts or upload a PGN file.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import-from-account">From Account</TabsTrigger>
            <TabsTrigger value="upload-pgn">Upload PGN</TabsTrigger>
            <TabsTrigger value="paste-pgn">Paste PGN</TabsTrigger>
          </TabsList>
          
          {/* Import from account tab */}
          <TabsContent value="import-from-account" className="py-4">
            {availablePlatforms.length === 0 ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No connected accounts</AlertTitle>
                  <AlertDescription>
                    You need to connect a chess platform account first.
                  </AlertDescription>
                </Alert>
                <Button className="w-full" variant="outline" onClick={onClose}>
                  <Link className="mr-2 h-4 w-4" />
                  Go connect an account
                </Button>
              </div>
            ) : (
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(onImportFromAccount)} className="space-y-4">
                  <FormField
                    control={accountForm.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Platform</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availablePlatforms.includes("lichess") && (
                              <SelectItem value="lichess">Lichess</SelectItem>
                            )}
                            {availablePlatforms.includes("chesscom") && (
                              <SelectItem value="chesscom">Chess.com</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={accountForm.control}
                    name="range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Import Range</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="10">Last 10 games</SelectItem>
                            <SelectItem value="20">Last 20 games</SelectItem>
                            <SelectItem value="50">Last 50 games</SelectItem>
                            <SelectItem value="100">Last 100 games</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={accountForm.control}
                    name="analyzeAutomatically"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Analyze games automatically after import
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={importFromAccountMutation.isPending}
                  >
                    {importFromAccountMutation.isPending ? "Importing..." : "Import Games"}
                  </Button>
                </form>
              </Form>
            )}
          </TabsContent>
          
          {/* Upload PGN tab */}
          <TabsContent value="upload-pgn" className="py-4">
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(onUploadPgn)} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <FileUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Drag and drop your PGN file here, or click to browse
                    </p>
                    <Input
                      id="pgn-file"
                      type="file"
                      accept=".pgn"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            uploadForm.setValue("pgn", event.target?.result as string);
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("pgn-file")?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                </div>
                
                <FormField
                  control={uploadForm.control}
                  name="analyzeAutomatically"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Analyze game automatically after upload
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadPgnMutation.isPending || !uploadForm.getValues("pgn")}
                >
                  {uploadPgnMutation.isPending ? "Uploading..." : "Upload and Import"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Paste PGN tab */}
          <TabsContent value="paste-pgn" className="py-4">
            <Form {...pgnPasteForm}>
              <form onSubmit={pgnPasteForm.handleSubmit(onPastePgn)} className="space-y-4">
                <FormField
                  control={pgnPasteForm.control}
                  name="pgn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PGN Text</FormLabel>
                      <FormControl>
                        <textarea
                          className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                          placeholder="Paste PGN text here..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={pgnPasteForm.control}
                  name="analyzeAutomatically"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Analyze game automatically after import
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadPgnMutation.isPending}
                >
                  {uploadPgnMutation.isPending ? "Importing..." : "Import Game"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
