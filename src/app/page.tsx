
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

import { summarizeLegalDocument, type SummarizeLegalDocumentOutput, type SummarizeLegalDocumentInput } from '@/ai/flows/summarize-legal-document';
import { flagCriticalClauses, type FlagCriticalClausesOutput, type FlagCriticalClausesInput } from '@/ai/flows/flag-critical-clauses';
import { suggestImprovements, type SuggestImprovementsOutput, type SuggestImprovementsInput } from '@/ai/flows/suggest-improvements';
import { identifyMissingPoints, type IdentifyMissingPointsOutput, type IdentifyMissingPointsInput } from '@/ai/flows/identify-missing-points';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HomePage() {
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
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
      setFileName(file.name);
      // Clear previous results, error, and data
      setSummary(null);
      setFlaggedClauses(null);
      setSuggestions(null);
      setMissingPoints(null);
      setError(null);
      setDocumentText(null);
      setImageDataUri(null);

      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setDocumentText(text);
        };
        reader.readAsText(file);
        toast({ title: "Text File Selected", description: `${file.name} loaded successfully.` });
      } else if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          setImageDataUri(dataUri);
        };
        reader.readAsDataURL(file);
        toast({ title: "PDF File Selected", description: `${file.name} loaded. It will be processed as document data by the AI.` });
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          setImageDataUri(dataUri);
        };
        reader.readAsDataURL(file);
        toast({ title: "Image File Selected", description: `${file.name} loaded successfully.` });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .txt, .pdf, .png, .jpg, or .jpeg file.",
          variant: "destructive",
        });
        setFileName(null);
        // Ensure file input is reset if an invalid file was chosen
        event.target.value = ""; 
      }
    } else {
        // No file selected or selection cancelled
        setFileName(null);
        setDocumentText(null);
        setImageDataUri(null);
    }
  };

  const processDocument = async () => {
    if (!documentText && !imageDataUri) {
      toast({ title: "No Document Data", description: "Please upload a document first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null);
    setFlaggedClauses(null);
    setSuggestions(null);
    setMissingPoints(null);

    const basePayload: { documentText?: string | null; photoDataUri?: string | null } = {};
    if (documentText) {
      basePayload.documentText = documentText;
    }
    if (imageDataUri) {
      basePayload.photoDataUri = imageDataUri;
    }

    try {
      const [
        summaryRes,
        clausesRes,
        improvementsRes,
        missingPointsRes
      ] = await Promise.allSettled([
        summarizeLegalDocument(basePayload as SummarizeLegalDocumentInput),
        flagCriticalClauses({ ...basePayload, context: "General legal document review" } as FlagCriticalClausesInput),
        suggestImprovements({ ...basePayload, context: "General legal document review" } as SuggestImprovementsInput),
        identifyMissingPoints({ ...basePayload, documentType: "General", context: "General legal document review" } as IdentifyMissingPointsInput),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      else {
        console.error("Summarization failed:", summaryRes.reason);
        setError(prev => prev ? prev + "\nSummarization failed." : "Summarization failed.");
      }

      if (clausesRes.status === 'fulfilled') setFlaggedClauses(clausesRes.value);
      else {
        console.error("Clause flagging failed:", clausesRes.reason);
         setError(prev => prev ? prev + "\nClause flagging failed." : "Clause flagging failed.");
      }
      
      if (improvementsRes.status === 'fulfilled') setSuggestions(improvementsRes.value);
      else {
        console.error("Improvement suggestion failed:", improvementsRes.reason);
        setError(prev => prev ? prev + "\nImprovement suggestion failed." : "Improvement suggestion failed.");
      }

      if (missingPointsRes.status === 'fulfilled') setMissingPoints(missingPointsRes.value);
      else {
         console.error("Missing points analysis failed:", missingPointsRes.reason);
         setError(prev => prev ? prev + "\nMissing points analysis failed." : "Missing points analysis failed.");
      }
      
      const allFailed = [summaryRes, clausesRes, improvementsRes, missingPointsRes].every(res => res.status === 'rejected');
      const anyFailed = [summaryRes, clausesRes, improvementsRes, missingPointsRes].some(res => res.status === 'rejected');

      if (allFailed) {
        const errorMessages = [summaryRes, clausesRes, improvementsRes, missingPointsRes]
          // @ts-ignore
          .filter(res => res.status === 'rejected').map(res => (res as PromiseRejectedResult).reason?.message || (res as PromiseRejectedResult).reason?.toString() || "Unknown error").join('; ');
        setError(`All AI analyses failed. Errors: ${errorMessages}`);
        toast({ title: "Analysis Failed", description: "All AI analyses failed. Please check console or error display.", variant: "destructive" });
      } else if (anyFailed) {
         toast({ title: "Partial Success", description: "Some analyses could not be completed. Check results.", variant: "default" });
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
            Upload your legal document (.txt, .pdf, .png, .jpg, .jpeg) for an AI-powered review. Get summaries, critical clause flags, improvement suggestions, and missing points analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-foreground mb-1">
              Upload Document (.txt, .pdf, .png, .jpg, .jpeg)
            </label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,.pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="file:text-primary file:font-semibold hover:file:bg-primary/10"
              disabled={isLoading}
            />
            {fileName && (
               <p className="text-sm text-green-600 mt-2">Selected: {fileName}</p>
            )}
          </div>
          <Button
            onClick={processDocument}
            disabled={(!documentText && !imageDataUri) || isLoading}
            className="w-full text-lg py-6"
            size="lg"
          >
            {isLoading ? 'Analyzing...' : 'Review Document'}
          </Button>
        </CardContent>
      </Card>

      {isLoading && <LoadingIndicator />}

      {error && !isLoading && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error During Analysis</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && ( // Display analysis results if not loading, regardless of minor errors if some results are present
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
