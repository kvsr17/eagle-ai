"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, AlertCircle } from 'lucide-react';

import { summarizeLegalDocument, type SummarizeLegalDocumentOutput } from '@/ai/flows/summarize-legal-document';
import { flagCriticalClauses, type FlagCriticalClausesOutput } from '@/ai/flows/flag-critical-clauses';
import { suggestImprovements, type SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import { identifyMissingPoints, type IdentifyMissingPointsOutput } from '@/ai/flows/identify-missing-points';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HomePage() {
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [summary, setSummary] = useState<SummarizeLegalDocumentOutput | null>(null);
  const [flaggedClauses, setFlaggedClauses] = useState<FlagCriticalClausesOutput | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestImprovementsOutput | null>(null);
  const [missingPoints, setMissingPoints] = useState<IdentifyMissingPointsOutput | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setDocumentText(text);
          // Clear previous results
          setSummary(null);
          setFlaggedClauses(null);
          setSuggestions(null);
          setMissingPoints(null);
          setError(null);
        };
        reader.readAsText(file);
        toast({ title: "File Selected", description: `${file.name} loaded successfully.` });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .txt file.",
          variant: "destructive",
        });
        setFileName(null);
        setDocumentText(null);
        event.target.value = ""; // Reset file input
      }
    }
  };

  const processDocument = async () => {
    if (!documentText) {
      toast({ title: "No Document", description: "Please upload a document first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    // Clear previous results before new analysis
    setSummary(null);
    setFlaggedClauses(null);
    setSuggestions(null);
    setMissingPoints(null);

    try {
      const [
        summaryRes,
        clausesRes,
        improvementsRes,
        missingPointsRes
      ] = await Promise.allSettled([
        summarizeLegalDocument({ documentText }),
        flagCriticalClauses({ documentText, context: "General legal document review" }),
        suggestImprovements({ documentText, context: "General legal document review" }),
        identifyMissingPoints({ documentText, documentType: "General", context: "General legal document review" }),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      else console.error("Summarization failed:", summaryRes.reason);

      if (clausesRes.status === 'fulfilled') setFlaggedClauses(clausesRes.value);
      else console.error("Clause flagging failed:", clausesRes.reason);
      
      if (improvementsRes.status === 'fulfilled') setSuggestions(improvementsRes.value);
      else console.error("Improvement suggestion failed:", improvementsRes.reason);

      if (missingPointsRes.status === 'fulfilled') setMissingPoints(missingPointsRes.value);
      else console.error("Missing points analysis failed:", missingPointsRes.reason);
      
      const allFailed = [summaryRes, clausesRes, improvementsRes, missingPointsRes].every(res => res.status === 'rejected');
      if (allFailed) {
        throw new Error("All AI analyses failed. Please try again.");
      } else if ([summaryRes, clausesRes, improvementsRes, missingPointsRes].some(res => res.status === 'rejected')) {
        toast({ title: "Partial Success", description: "Some analyses could not be completed.", variant: "default" });
      } else {
        toast({ title: "Analysis Complete", description: "Document review finished successfully." });
      }

    } catch (e: any) {
      console.error("Error processing document:", e);
      setError(e.message || "An unexpected error occurred during analysis.");
      toast({ title: "Analysis Failed", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileUp size={32} /> AI Document Reviewer
          </CardTitle>
          <CardDescription>
            Upload your legal document (.txt format) for an AI-powered review. Get summaries, critical clause flags, improvement suggestions, and missing points analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-foreground mb-1">
              Upload Document (.txt only)
            </label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="file:text-primary file:font-semibold hover:file:bg-primary/10"
              disabled={isLoading}
            />
            {fileName && !documentText && (
               <p className="text-sm text-muted-foreground mt-2">Selected: {fileName} (Processing...)</p>
            )}
             {fileName && documentText && (
               <p className="text-sm text-green-600 mt-2">Selected: {fileName}</p>
            )}
          </div>
          <Button
            onClick={processDocument}
            disabled={!documentText || isLoading}
            className="w-full text-lg py-6"
            size="lg"
          >
            {isLoading ? 'Analyzing...' : 'Review Document'}
          </Button>
        </CardContent>
      </Card>

      {isLoading && <LoadingIndicator />}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <AnalysisDisplay
          fileName={fileName}
          summary={summary}
          flaggedClauses={flaggedClauses}
          suggestions={suggestions}
          missingPoints={missingPoints}
        />
      )}
      
      <footer className="text-center text-muted-foreground mt-12 py-4 text-xs">
        <p>&copy; {new Date().getFullYear()} LegalEagle AI. For informational purposes only. Not legal advice.</p>
        <p>Please consult with a qualified legal professional for any legal matters.</p>
      </footer>
    </div>
  );
}
