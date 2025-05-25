
// src/components/ChatInterface.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Loader2, AlertCircle, Send } from 'lucide-react'; // Added Send icon
import { chatWithDocument, type ChatWithDocumentInput } from '@/ai/flows/chatWithDocument'; // Removed ChatWithDocumentOutput as it's inferred
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
      setUserQuestion(""); // Clear input after successful question
    } catch (e: any) {
      console.error("Error in chat:", e);
      setError(e.message || "An error occurred while getting the AI's response.");
      toast({ title: "Chat Error", description: e.message || "Failed to get response.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-8 shadow-xl border-primary/30 rounded-lg"> {/* Consistent styling */}
      <CardHeader className="border-b-2 border-primary/20 bg-primary/10 py-4 px-6"> {/* Enhanced header */}
        <CardTitle className="flex items-center gap-3 text-xl text-primary font-semibold"> {/* Adjusted gap and font weight */}
          <MessageSquare size={26} /> {/* Slightly larger icon */}
          Chat with: <span className="font-bold">{fileName || "Your Document"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-5"> {/* Increased spacing */}
        <div>
          <Textarea
            placeholder="Ask a question about the document... e.g., 'What are the termination conditions?'"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading && userQuestion.trim()) {
                e.preventDefault();
                handleAskQuestion();
              }
            }}
            rows={3}
            disabled={isLoading}
            className="text-sm shadow-sm focus:ring-2 focus:ring-primary/50" /* Added shadow and focus ring */
          />
        </div>
        <Button 
            onClick={handleAskQuestion} 
            disabled={isLoading || (!documentText && !imageDataUri) || !userQuestion.trim()} 
            className="w-full sm:w-auto text-base py-2.5 px-5" /* Adjusted padding and size */
            size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Getting Answer...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Ask Question
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-4 shadow-md">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Chat Error</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {aiResponse && !error && (
          <div className="mt-5 p-5 border border-green-300 bg-green-50/70 rounded-lg shadow-md"> {/* Enhanced styling */}
            <h4 className="font-semibold text-lg text-green-800 mb-2.5">AI's Answer:</h4> {/* Increased size and margin */}
            <p className="whitespace-pre-wrap text-base text-gray-800 leading-relaxed">{aiResponse}</p> {/* Increased size */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
