
// src/components/ChatInterface.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { chatWithDocument, type ChatWithDocumentInput, type ChatWithDocumentOutput } from '@/ai/flows/chatWithDocument';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ChatInterfaceProps {
  documentText: string | null;
  imageDataUri: string | null;
  fileName: string | null; // To display which document is being chatted about
}

export function ChatInterface({ documentText, imageDataUri, fileName }: ChatInterfaceProps) {
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) {
      toast({ title: "Empty Question", description: "Please type a question.", variant: "destructive" });
      return;
    }
    if (!documentText && !imageDataUri) {
      toast({ title: "No Document Context", description: "Cannot chat without an active document.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    const payload: ChatWithDocumentInput = { userQuestion };
    if (documentText) payload.documentText = documentText;
    if (imageDataUri) payload.photoDataUri = imageDataUri;

    try {
      const result = await chatWithDocument(payload);
      setAiResponse(result.aiResponse);
    } catch (e: any) {
      console.error("Error in chat:", e);
      setError(e.message || "An error occurred while getting the AI's response.");
      toast({ title: "Chat Error", description: e.message || "Failed to get response.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-8 shadow-lg border-primary/20">
      <CardHeader className="border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <MessageSquare size={24} />
          Chat with: {fileName || "Your Document"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Textarea
            placeholder="Ask a question about the document... e.g., 'What are the termination conditions?'"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            rows={3}
            disabled={isLoading}
            className="text-sm"
          />
        </div>
        <Button onClick={handleAskQuestion} disabled={isLoading || (!documentText && !imageDataUri)} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Answer...
            </>
          ) : (
            "Ask Question"
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chat Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {aiResponse && !error && (
          <div className="mt-4 p-4 border border-green-200 bg-green-50/50 rounded-md shadow-sm">
            <h4 className="font-semibold text-green-700 mb-2">AI's Answer:</h4>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{aiResponse}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
