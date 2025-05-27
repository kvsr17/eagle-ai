
// src/components/ChatInterface.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Loader2, AlertCircle, Send } from 'lucide-react';
import { chatWithDocument, type ChatWithDocumentInput } from '@/ai/flows/chatWithDocument';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ChatInterfaceProps {
  documentText: string | null;
  imageDataUri: string | null;
  fileName: string | null;
  documentContext: string; // Added to pass context to the chat flow
}

export function ChatInterface({ documentText, imageDataUri, fileName, documentContext }: ChatInterfaceProps) {
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) {
      toast({ title: "Empty Question", description: "Please type a question to get an answer.", variant: "destructive" });
      return;
    }
    if (!documentText && !imageDataUri) {
      toast({ title: "No Document Context", description: "Cannot chat without an active document. Please analyze a document first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiResponse(null); 

    const payload: ChatWithDocumentInput = { 
        userQuestion,
        context: documentContext // Pass document context to chat flow
    };
    if (documentText) payload.documentText = documentText;
    if (imageDataUri) payload.photoDataUri = imageDataUri;

    try {
      const result = await chatWithDocument(payload);
      setAiResponse(result.aiResponse);
      setUserQuestion(""); 
    } catch (e: any) {
      console.error("Error in chat:", e);
      const errorMessage = e.message || "An error occurred while getting the AI's response.";
      setError(errorMessage);
      toast({ title: "Chat Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-10 shadow-xl border-2 border-primary/30 rounded-xl overflow-hidden"> 
      <CardHeader className="border-b-2 border-primary/40 bg-primary-light py-5 px-7"> 
        <CardTitle className="flex items-center gap-3 text-2xl text-primary font-semibold"> 
          <MessageSquare size={28} /> 
          Chat with: <span className="font-bold">{fileName || "Your Document"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-7 space-y-6"> 
        <div>
          <Textarea
            placeholder="Ask a question about the document... e.g., 'What are the termination conditions?' or 'Explain clause 5.'"
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
            className="text-base shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 p-3" 
          />
        </div>
        <Button 
            onClick={handleAskQuestion} 
            disabled={isLoading || (!documentText && !imageDataUri) || !userQuestion.trim()} 
            className="w-full sm:w-auto text-lg py-3 px-6 h-12" 
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
          <Alert variant="destructive" className="mt-5 shadow-md p-5"> 
            <AlertCircle className="h-6 w-6" /> 
            <AlertTitle className="text-lg font-semibold">Chat Error</AlertTitle> 
            <AlertDescription className="text-base mt-1.5">{error}</AlertDescription> 
          </Alert>
        )}

        {aiResponse && !error && (
          <div className="mt-6 p-6 border border-green-400 bg-green-50/80 rounded-lg shadow-lg"> 
            <h4 className="font-semibold text-xl text-green-800 mb-3">AI's Answer:</h4> 
            <p className="whitespace-pre-wrap text-base text-gray-800 leading-relaxed">{aiResponse}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
