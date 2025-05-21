
"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, AlertCircle, Printer, Zap } from 'lucide-react'; 

import { summarizeLegalDocument, type SummarizeLegalDocumentOutput, type SummarizeLegalDocumentInput } from '@/ai/flows/summarize-legal-document';
import { flagCriticalClauses, type FlagCriticalClausesOutput, type FlagCriticalClausesInput } from '@/ai/flows/flag-critical-clauses';
import { suggestImprovements, type SuggestImprovementsOutput, type SuggestImprovementsInput } from '@/ai/flows/suggest-improvements';
import { identifyMissingPoints, type IdentifyMissingPointsOutput, type IdentifyMissingPointsInput } from '@/ai/flows/identify-missing-points';
import { predictLegalOutcomes, type PredictLegalOutcomesOutput, type PredictLegalOutcomesInput } from '@/ai/flows/predict-legal-outcomes';
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
  const [legalForesight, setLegalForesight] = useState<PredictLegalOutcomesOutput | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSummary(null);
      setFlaggedClauses(null);
      setSuggestions(null);
      setMissingPoints(null);
      setLegalForesight(null);
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
      } else if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          setImageDataUri(dataUri);
        };
        reader.readAsDataURL(file);
        const fileTypeDisplay = file.type === "application/pdf" ? "PDF" : "Image";
        toast({ title: `${fileTypeDisplay} File Selected`, description: `${file.name} loaded. It will be processed as document data by the AI.` });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .txt, .pdf, .png, .jpg, or .jpeg file.",
          variant: "destructive",
        });
        setFileName(null);
        event.target.value = ""; 
      }
    } else {
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
    setLegalForesight(null);

    const basePayload: { documentText?: string | null; photoDataUri?: string | null; context?: string } = {};
    if (documentText) {
      basePayload.documentText = documentText;
    }
    if (imageDataUri) {
      basePayload.photoDataUri = imageDataUri;
    }
    if (fileName) {
        if (fileName.toLowerCase().includes('agreement')) basePayload.context = 'Agreement Document';
        else if (fileName.toLowerCase().includes('offer') || fileName.toLowerCase().includes('letter')) basePayload.context = 'Offer Letter or Similar';
        else if (fileName.toLowerCase().includes('sale')) basePayload.context = 'Sale Document';
        else basePayload.context = 'General Legal Document';
    }


    try {
      const results = await Promise.allSettled([
        summarizeLegalDocument(basePayload as SummarizeLegalDocumentInput),
        flagCriticalClauses({ ...basePayload, context: basePayload.context || "General legal document review" } as FlagCriticalClausesInput),
        suggestImprovements({ ...basePayload, context: basePayload.context || "General legal document review" } as SuggestImprovementsInput),
        identifyMissingPoints({ ...basePayload, documentType: basePayload.context || "General", context: basePayload.context || "General legal document review" } as IdentifyMissingPointsInput),
        predictLegalOutcomes(basePayload as PredictLegalOutcomesInput),
      ]);

      const [summaryRes, clausesRes, improvementsRes, missingPointsRes, foresightRes] = results;

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

      if (foresightRes.status === 'fulfilled') setLegalForesight(foresightRes.value);
      else {
        console.error("Legal foresight analysis failed:", foresightRes.reason);
        setError(prev => prev ? prev + "\nLegal foresight analysis failed." : "Legal foresight analysis failed.");
      }
      
      const allFailed = results.every(res => res.status === 'rejected');
      const anyFailed = results.some(res => res.status === 'rejected');

      if (allFailed) {
        const errorMessages = results
          .filter(res => res.status === 'rejected').map(res => (res as PromiseRejectedResult).reason?.message || (res as PromiseRejectedResult).reason?.toString() || "Unknown error").join('; ');
        setError(`All AI analyses failed. Errors: ${errorMessages}`);
        toast({ title: "Analysis Failed", description: "All AI analyses failed. Please check console or error display.", variant: "destructive" });
      } else if (anyFailed) {
         toast({ title: "Partial Success", description: "Some analyses could not be completed. Check results.", variant: "default" });
      } else {
        toast({ title: "Analysis Complete", description: "Document review and foresight finished successfully." });
      }

    } catch (e: any) {
      console.error("Error processing document:", e);
      setError(e.message || "An unexpected error occurred during analysis.");
      toast({ title: "Analysis Failed", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const hasResults = summary || flaggedClauses || suggestions || missingPoints || legalForesight;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <Card className="shadow-xl no-print">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Zap size={32} /> LegalForesight AI
          </CardTitle>
          <CardDescription>
            Upload your legal document (.txt, .pdf, .png, .jpg, .jpeg) for AI-powered predictive analysis, summaries, critical clause flags, and improvement suggestions.
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
            <Zap className="mr-2 h-5 w-5" /> {/* Added Zap icon here */}
            {isLoading ? 'Analyzing...' : 'Analyze & Predict'}
          </Button>
        </CardContent>
      </Card>

      {isLoading && <div className="no-print"><LoadingIndicator text="Generating insights & predictions..." /></div>}

      {error && !isLoading && (
        <div className="no-print">
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error During Analysis</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div id="report-content" className="printable-area">
        {!isLoading && hasResults && (
           <Button
            onClick={handlePrint}
            variant="outline"
            className="mt-6 mb-4 no-print w-full md:w-auto"
            size="lg"
          >
            <Printer className="mr-2 h-5 w-5" />
            Download Full Report as PDF
          </Button>
        )}

        {!isLoading && ( 
          <AnalysisDisplay
            fileName={fileName}
            summary={summary}
            flaggedClauses={flaggedClauses}
            suggestions={suggestions}
            missingPoints={missingPoints}
            legalForesight={legalForesight}
          />
        )}
      </div>
      
      <footer className="text-center text-muted-foreground mt-12 py-4 text-xs no-print">
        <p>&copy; {new Date().getFullYear()} LegalForesight AI. Predictive analysis for informational purposes only. Not legal advice.</p>
        <p>Please consult with a qualified legal professional for any legal matters.</p>
      </footer>
    </div>
  );
}
