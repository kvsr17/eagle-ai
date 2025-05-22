
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext'; // Removed useAuth
// import { useRouter } from 'next/navigation'; // Removed useRouter if only used for auth redirects
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, AlertCircle, Printer, ScanEye, Zap, Loader2, Scale } from 'lucide-react'; // Added Scale
import { ChatInterface } from '@/components/ChatInterface';

import { summarizeLegalDocument, type SummarizeLegalDocumentOutput, type SummarizeLegalDocumentInput } from '@/ai/flows/summarize-legal-document';
import { flagCriticalClauses, type FlagCriticalClausesOutput, type FlagCriticalClausesInput } from '@/ai/flows/flag-critical-clauses';
import { suggestImprovements, type SuggestImprovementsOutput, type SuggestImprovementsInput } from '@/ai/flows/suggest-improvements';
import { identifyMissingPoints, type IdentifyMissingPointsOutput, type IdentifyMissingPointsInput } from '@/ai/flows/identify-missing-points';
import { predictLegalOutcomes, type PredictLegalOutcomesOutput, type PredictLegalOutcomesInput } from '@/ai/flows/predict-legal-outcomes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';


export default function HomePage() {
  // const { currentUser, loading: authLoading } = useAuth(); // Removed Auth hook
  // const router = useRouter(); // Removed Router hook

  const [documentText, setDocumentText] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentContext, setDocumentContext] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [summary, setSummary] = useState<SummarizeLegalDocumentOutput | null>(null);
  const [flaggedClauses, setFlaggedClauses] = useState<FlagCriticalClausesOutput | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestImprovementsOutput | null>(null);
  const [missingPoints, setMissingPoints] = useState<IdentifyMissingPointsOutput | null>(null);
  const [legalForesight, setLegalForesight] = useState<PredictLegalOutcomesOutput | null>(null);

  // useEffect(() => { // Removed auth-related effect
  //   if (!authLoading && !currentUser) {
  //     router.push('/login');
  //   }
  // }, [currentUser, authLoading, router]);

  // if (authLoading || !currentUser) { // Removed auth-related loading/redirect state
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] py-12">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
  //       <p className="text-muted-foreground">
  //           {authLoading ? "Loading application..." : "Redirecting to login..."}
  //       </p>
  //     </div>
  //   );
  // }

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
        event.target.value = ""; // Clear the input
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

    let determinedContext = documentContext.trim();
    if (!determinedContext && fileName) {
        if (fileName.toLowerCase().includes('agreement')) determinedContext = 'Agreement Document';
        else if (fileName.toLowerCase().includes('offer') || fileName.toLowerCase().includes('letter')) determinedContext = 'Offer Letter or Similar';
        else if (fileName.toLowerCase().includes('sale')) determinedContext = 'Sale Document';
        else determinedContext = 'General Legal Document';
    }
    if (!determinedContext) determinedContext = "General legal document review";


    const basePayload: { documentText?: string | null; photoDataUri?: string | null; context?: string } = { context: determinedContext };
    if (documentText) {
      basePayload.documentText = documentText;
    }
    if (imageDataUri) {
      basePayload.photoDataUri = imageDataUri;
    }

    try {
      const results = await Promise.allSettled([
        summarizeLegalDocument(basePayload as SummarizeLegalDocumentInput),
        flagCriticalClauses(basePayload as FlagCriticalClausesInput),
        suggestImprovements(basePayload as SuggestImprovementsInput),
        identifyMissingPoints({ ...basePayload, documentType: determinedContext } as IdentifyMissingPointsInput),
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
          .filter(res => res.status === 'rejected').map(res => (res as PromiseRejectedResult).reason?.message || (res as PromiseRejectedResult).reason?.toString() || "Unknown error").join('\n');
        setError(`All AI analyses failed. Errors:\n${errorMessages}`);
        toast({ title: "Analysis Failed", description: "All AI analyses failed. Please check console or error display.", variant: "destructive" });
      } else if (anyFailed) {
         toast({ title: "Partial Analysis Success", description: "Some analyses could not be completed. Check report for details and potential error messages.", variant: "default" });
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
    <div className="w-full">
      <div className="max-w-md mx-auto w-full no-print">
        <Card className="shadow-lg rounded-xl border-primary/20">
          <CardHeader className="pt-6 pb-4 text-center">
            <div className="inline-flex items-center gap-2 mx-auto">
              <ScanEye size={28} className="text-primary" />
              <CardTitle className="text-2xl font-semibold text-primary">LegalForesight AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <h2 className="text-3xl font-bold text-center text-foreground">Upload Document</h2>
            <div className="space-y-4">
              <div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center p-8 border border-input rounded-lg text-center hover:border-primary/40 transition-colors cursor-pointer bg-card"
                >
                  <div className="p-4 bg-primary/10 rounded-lg mb-3">
                    <FileUp size={36} className="text-primary" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Upload Document</p>
                  <p className="text-sm text-muted-foreground">or drop a file here</p>
                </label>
                {fileName && (
                  <p className="text-sm text-green-600 mt-3 text-center">Selected: {fileName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="document-context" className="text-sm font-medium text-foreground mb-1 block">
                  Document Context (Optional)
                </Label>
                <Textarea
                  id="document-context"
                  placeholder="E.g., 'Employment contract for a software engineer', 'NDA for a startup partnership'. This helps improve analysis accuracy."
                  value={documentContext}
                  onChange={(e) => setDocumentContext(e.target.value)}
                  className="min-h-[60px] text-sm"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">Providing context can significantly enhance the AI's understanding and analysis.</p>
              </div>
            </div>


            <Button
              onClick={processDocument}
              disabled={(!documentText && !imageDataUri && !fileName) || isLoading}
              className="w-full text-lg py-3"
              size="lg"
            >
               {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : fileName ? (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Analyze & Predict
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {isLoading && <div className="no-print mt-6"><LoadingIndicator text="Generating insights & predictions..." /></div>}

      {error && !isLoading && (
        <div className="no-print mt-6 max-w-lg mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error During Analysis</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div id="report-content" className="printable-area mt-8">
        {!isLoading && hasResults && (
           <div className="text-center mb-4 no-print">
             <Button
                onClick={handlePrint}
                variant="outline"
                className="w-full md:w-auto"
                size="lg"
              >
                <Printer className="mr-2 h-5 w-5" />
                Download Full Report as PDF
              </Button>
           </div>
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

      {!isLoading && hasResults && (documentText || imageDataUri) && fileName && (
        <div className="mt-8 no-print">
          <ChatInterface
            documentText={documentText}
            imageDataUri={imageDataUri}
            fileName={fileName}
          />
        </div>
      )}

      <footer className="text-center text-muted-foreground mt-12 py-4 text-xs no-print">
        <p>&copy; {new Date().getFullYear()} LegalForesight AI. Predictive analysis for informational purposes only. Not legal advice.</p>
        <p>Please consult with a qualified legal professional for any legal matters.</p>
      </footer>
    </div>
  );
}
