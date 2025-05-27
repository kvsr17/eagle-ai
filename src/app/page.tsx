
"use client";

import type { ChangeEvent } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, AlertCircle, Printer, ScanEye, Zap, Loader2, Wand2 } from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';

import { summarizeLegalDocument, type SummarizeLegalDocumentOutput, type SummarizeLegalDocumentInput } from '@/ai/flows/summarize-legal-document';
import { flagCriticalClauses, type FlagCriticalClausesOutput, type FlagCriticalClausesInput } from '@/ai/flows/flag-critical-clauses';
import { suggestImprovements, type SuggestImprovementsOutput, type SuggestImprovementsInput } from '@/ai/flows/suggest-improvements';
import { identifyMissingPoints, type IdentifyMissingPointsOutput, type IdentifyMissingPointsInput } from '@/ai/flows/identify-missing-points';
import { predictLegalOutcomes, type PredictLegalOutcomesOutput, type PredictLegalOutcomesInput } from '@/ai/flows/predict-legal-outcomes';
import { autoFixClause, type AutoFixClauseInput, type AutoFixClauseOutput } from '@/ai/flows/auto-fix-clause';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

type CriticalClauseBase = FlagCriticalClausesOutput['criticalClauses'][number];

export interface UIFlaggedClause extends CriticalClauseBase {
  id: string;
  originalClauseText: string;
  originalReason: string;
  currentClauseText: string;
  currentReason: string;
  isFixProposed: boolean;
  isFixAccepted: boolean;
  fixLoading: boolean;
}

export interface UIMissingPoint {
  id: string;
  type: 'missing' | 'recommendation' | 'summary';
  text: string;
  isFixable: boolean;
  currentText: string;
  justificationNote?: string;
  isFixProposed: boolean;
  isFixAccepted: boolean;
  fixLoading: boolean;
}


export default function HomePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [documentText, setDocumentText] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentContext, setDocumentContext] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBatchFixing, setIsBatchFixing] = useState(false);
  const [batchFixProgress, setBatchFixProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [summary, setSummary] = useState<SummarizeLegalDocumentOutput | null>(null);
  const [uiFlaggedClauses, setUiFlaggedClauses] = useState<UIFlaggedClause[]>([]);
  const [uiMissingPoints, setUiMissingPoints] = useState<UIMissingPoint[]>([]);

  const [suggestions, setSuggestions] = useState<SuggestImprovementsOutput | null>(null);
  const [legalForesight, setLegalForesight] = useState<PredictLegalOutcomesOutput | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const resetAnalysisStates = useCallback(() => {
    setSummary(null);
    setUiFlaggedClauses([]);
    setUiMissingPoints([]);
    setSuggestions(null);
    setLegalForesight(null);
    setError(null);
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      resetAnalysisStates();
      setDocumentText(null);
      setImageDataUri(null);
      setError(null);

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
        toast({ title: `${fileTypeDisplay} File Selected`, description: `${file.name} loaded. It will be processed by the AI.` });
      } else {
        toast({
          title: "Unsupported File Type",
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
    resetAnalysisStates();

    const effectiveContext = documentContext.trim() || (fileName ? `Context related to document: ${fileName}. Please infer additional context from the document type and content.` : "General legal document review. User has not specified a context.");


    const basePayload: { documentText?: string | null; photoDataUri?: string | null; context: string } = { context: effectiveContext };
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
        identifyMissingPoints({ ...basePayload, documentType: effectiveContext } as IdentifyMissingPointsInput),
        predictLegalOutcomes(basePayload as PredictLegalOutcomesInput),
      ]);

      const [summaryRes, clausesRes, improvementsRes, missingPointsRes, foresightRes] = results;
      let anyErrors = false;
      let errorMessages = "";

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      } else {
        console.error("Summarization failed:", summaryRes.reason);
        errorMessages += `Summarization failed: ${summaryRes.reason?.message || String(summaryRes.reason)}\n`;
        anyErrors = true;
      }

      if (clausesRes.status === 'fulfilled' && clausesRes.value.criticalClauses) {
        setUiFlaggedClauses(clausesRes.value.criticalClauses.map((clause, index) => ({
          ...clause,
          id: `flagged-${index}-${Date.now()}`,
          originalClauseText: clause.clauseText,
          originalReason: clause.reason,
          currentClauseText: clause.clauseText,
          currentReason: clause.reason,
          isFixProposed: false,
          isFixAccepted: false,
          fixLoading: false,
        })));
      } else if (clausesRes.status === 'rejected') {
        console.error("Clause flagging failed:", clausesRes.reason);
        errorMessages += `Clause flagging failed: ${clausesRes.reason?.message || String(clausesRes.reason)}\n`;
        anyErrors = true;
      }

      if (improvementsRes.status === 'fulfilled') {
        setSuggestions(improvementsRes.value);
      } else {
        console.error("Improvement suggestion failed:", improvementsRes.reason);
        errorMessages += `Improvement suggestion failed: ${improvementsRes.reason?.message || String(improvementsRes.reason)}\n`;
        anyErrors = true;
      }

      if (missingPointsRes.status === 'fulfilled' && missingPointsRes.value) {
        const transformedMissingPoints: UIMissingPoint[] = [];
        missingPointsRes.value.missingPoints.forEach((point, index) => transformedMissingPoints.push({
          id: `missing-point-${index}-${Date.now()}`,
          type: 'missing',
          text: point,
          isFixable: true,
          currentText: point,
          isFixProposed: false,
          isFixAccepted: false,
          fixLoading: false,
        }));
        missingPointsRes.value.recommendations.forEach((rec, index) => transformedMissingPoints.push({
          id: `missing-rec-${index}-${Date.now()}`,
          type: 'recommendation',
          text: rec,
          isFixable: false,
          currentText: rec,
          isFixProposed: false,
          isFixAccepted: false,
          fixLoading: false,
        }));
        if (missingPointsRes.value.summary) {
            transformedMissingPoints.push({
                id: `missing-summary-${Date.now()}`,
                type: 'summary',
                text: missingPointsRes.value.summary,
                isFixable: false,
                currentText: missingPointsRes.value.summary,
                isFixProposed: false,
                isFixAccepted: false,
                fixLoading: false,
            });
        }
        setUiMissingPoints(transformedMissingPoints);
      } else if (missingPointsRes.status === 'rejected') {
         console.error("Missing points analysis failed:", missingPointsRes.reason);
         errorMessages += `Missing points analysis failed: ${missingPointsRes.reason?.message || String(missingPointsRes.reason)}\n`;
         anyErrors = true;
      }

      if (foresightRes.status === 'fulfilled') {
        setLegalForesight(foresightRes.value);
      } else {
        console.error("Legal foresight analysis failed:", foresightRes.reason);
        errorMessages += `Legal foresight analysis failed: ${foresightRes.reason?.message || String(foresightRes.reason)}\n`;
        anyErrors = true;
      }

      if (errorMessages.trim()) {
        setError(errorMessages.trim().replace(/\\n/g, '\n'));
      }

      const allFailed = results.every(res => res.status === 'rejected');

      if (allFailed) {
        toast({ title: "Analysis Failed", description: "All AI analyses failed. Please check error details.", variant: "destructive", duration: 8000 });
      } else if (anyErrors) {
         toast({ title: "Partial Analysis Success", description: "Some analyses could not be completed. Review the report for details and error messages.", variant: "default", duration: 7000 });
      } else {
        toast({ title: "Analysis Complete", description: "Document review and foresight finished successfully." });
      }

    } catch (e: any) {
      console.error("Error processing document:", e);
      const generalErrorMessage = e.message || "An unexpected error occurred during analysis.";
      setError(generalErrorMessage);
      toast({ title: "Analysis Failed", description: generalErrorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAutoFix = useCallback(async (itemId: string, itemType: 'flaggedClause' | 'missingPoint') => {
    let itemToFix;
    let autoFixInput: AutoFixClauseInput;
    const currentEffectiveContext = documentContext.trim() || (fileName ? `Context related to document: ${fileName}` : "General Legal Document");

    if (itemType === 'flaggedClause') {
      setUiFlaggedClauses(prev => prev.map(fc => fc.id === itemId ? { ...fc, fixLoading: true, isFixProposed: false } : fc));
      itemToFix = uiFlaggedClauses.find(fc => fc.id === itemId);
      if (!itemToFix) return;
      autoFixInput = {
        originalClauseText: itemToFix.originalClauseText,
        problemDescription: itemToFix.originalReason,
        documentContext: currentEffectiveContext,
        fixType: "rewrite",
      };
    } else {
      setUiMissingPoints(prev => prev.map(mp => mp.id === itemId ? { ...mp, fixLoading: true, isFixProposed: false } : fc));
      itemToFix = uiMissingPoints.find(mp => mp.id === itemId);
      if (!itemToFix || !itemToFix.isFixable) return;
      autoFixInput = {
        problemDescription: itemToFix.text,
        documentContext: currentEffectiveContext,
        fixType: "generate",
      };
    }

    try {
      const result = await autoFixClause(autoFixInput);
      if (itemType === 'flaggedClause') {
        setUiFlaggedClauses(prev => prev.map(fc => fc.id === itemId ? {
          ...fc,
          currentClauseText: result.fixedClauseText,
          currentReason: result.justificationNote || "AI proposed fix applied.",
          isFixProposed: true,
          isFixAccepted: false,
          fixLoading: false,
        } : fc));
      } else {
        setUiMissingPoints(prev => prev.map(mp => mp.id === itemId ? {
          ...mp,
          currentText: result.fixedClauseText,
          justificationNote: result.justificationNote,
          isFixProposed: true,
          isFixAccepted: false,
          fixLoading: false,
        } : mp));
      }
      toast({ title: "Auto-Fix Suggested", description: "AI has proposed a fix. Review and accept or revert." });
    } catch (e: any) {
      console.error("Error applying auto-fix:", e);
      toast({ title: "Auto-Fix Failed", description: e.message || "Could not generate a fix.", variant: "destructive" });
      if (itemType === 'flaggedClause') {
        setUiFlaggedClauses(prev => prev.map(fc => fc.id === itemId ? { ...fc, fixLoading: false } : fc));
      } else {
        setUiMissingPoints(prev => prev.map(mp => mp.id === itemId ? { ...mp, fixLoading: false } : mp));
      }
    }
  }, [uiFlaggedClauses, uiMissingPoints, documentContext, fileName, toast]);

  const handleAcceptFix = useCallback((itemId: string, itemType: 'flaggedClause' | 'missingPoint') => {
    if (itemType === 'flaggedClause') {
      setUiFlaggedClauses(prev => prev.map(fc => fc.id === itemId ? { ...fc, isFixAccepted: true, isFixProposed: false } : fc));
    } else {
      setUiMissingPoints(prev => prev.map(mp => mp.id === itemId ? { ...mp, isFixAccepted: true, isFixProposed: false } : mp));
    }
    toast({ title: "Fix Accepted", description: "The suggested fix has been marked as accepted." });
  }, [toast]);

  const handleRevertFix = useCallback((itemId: string, itemType: 'flaggedClause' | 'missingPoint') => {
    if (itemType === 'flaggedClause') {
      setUiFlaggedClauses(prev => prev.map(fc => fc.id === itemId ? {
        ...fc,
        currentClauseText: fc.originalClauseText,
        currentReason: fc.originalReason,
        isFixProposed: false,
        isFixAccepted: false,
        fixLoading: false,
      } : fc));
    } else {
      setUiMissingPoints(prev => prev.map(mp => mp.id === itemId ? {
        ...mp,
        currentText: mp.text,
        justificationNote: undefined,
        isFixProposed: false,
        isFixAccepted: false,
        fixLoading: false,
      } : mp));
    }
    toast({ title: "Fix Reverted", description: "The content has been reverted to its original state." });
  }, [toast]);


  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const hasResults = summary || uiFlaggedClauses.length > 0 || uiMissingPoints.length > 0 || suggestions || legalForesight;

  const handleBatchAutoFixAndDownload = async () => {
    if (!hasResults) {
      toast({ title: "No Report Available", description: "Please analyze a document first.", variant: "destructive" });
      return;
    }

    setIsBatchFixing(true);
    setBatchFixProgress("Initializing auto-fix process...");
    toast({ title: "Batch Auto-Fixing Report", description: "Applying AI suggestions to all applicable items sequentially..." });

    const currentEffectiveContext = documentContext.trim() || (fileName ? `Context related to document: ${fileName}` : "General Legal Document");

    let tempFlaggedClauses = [...uiFlaggedClauses];
    let tempMissingPoints = [...uiMissingPoints];

    const clausesToFix = tempFlaggedClauses.filter(clause => !clause.isFixProposed && !clause.isFixAccepted);
    const pointsToFix = tempMissingPoints.filter(point => point.isFixable && !point.isFixProposed && !point.isFixAccepted);

    const totalItemsToFix = clausesToFix.length + pointsToFix.length;
    let itemsFixedSuccessfully = 0;
    let itemsFailedToFix = 0;

    if (totalItemsToFix === 0) {
        toast({ title: "No New Fixes Needed", description: "All items seem to be addressed or no auto-fixable items found." });
        setIsBatchFixing(false);
        setBatchFixProgress(null);
        setTimeout(() => { handlePrint(); }, 100);
        return;
    }

    // Sequential processing for flagged clauses
    for (let i = 0; i < clausesToFix.length; i++) {
      const clause = clausesToFix[i];
      setBatchFixProgress(`Fixing flagged clause ${i + 1} of ${clausesToFix.length}...`);

      tempFlaggedClauses = tempFlaggedClauses.map(fc =>
        fc.id === clause.id ? { ...fc, fixLoading: true } : fc
      );
      setUiFlaggedClauses([...tempFlaggedClauses]); // Update state to re-render

      try {
        const result = await autoFixClause({
          originalClauseText: clause.originalClauseText,
          problemDescription: clause.originalReason,
          documentContext: currentEffectiveContext,
          fixType: "rewrite",
        });
        tempFlaggedClauses = tempFlaggedClauses.map(fc => fc.id === clause.id ? {
          ...fc,
          currentClauseText: result.fixedClauseText,
          currentReason: result.justificationNote || "AI proposed fix applied.",
          isFixProposed: true,
          isFixAccepted: false, // Mark as proposed, not accepted
          fixLoading: false,
        } : fc);
        itemsFixedSuccessfully++;
      } catch (e: any) {
        console.error(`Error auto-fixing flagged clause ${clause.id}:`, e);
        tempFlaggedClauses = tempFlaggedClauses.map(fc => fc.id === clause.id ? { ...fc, fixLoading: false, currentReason: `${fc.currentReason} (Auto-fix failed: ${e.message})` } : fc);
        itemsFailedToFix++;
      }
      setUiFlaggedClauses([...tempFlaggedClauses]); // Update state
    }

    // Sequential processing for missing points
    for (let i = 0; i < pointsToFix.length; i++) {
      const point = pointsToFix[i];
      setBatchFixProgress(`Fixing missing point ${i + 1} of ${pointsToFix.length}... (Overall ${clausesToFix.length + i + 1}/${totalItemsToFix})`);

      tempMissingPoints = tempMissingPoints.map(mp =>
        mp.id === point.id ? { ...mp, fixLoading: true } : mp
      );
      setUiMissingPoints([...tempMissingPoints]); // Update state

      try {
        const result = await autoFixClause({
          problemDescription: point.text,
          documentContext: currentEffectiveContext,
          fixType: "generate",
        });
        tempMissingPoints = tempMissingPoints.map(mp => mp.id === point.id ? {
          ...mp,
          currentText: result.fixedClauseText,
          justificationNote: result.justificationNote,
          isFixProposed: true,
          isFixAccepted: false, // Mark as proposed, not accepted
          fixLoading: false,
        } : mp);
        itemsFixedSuccessfully++;
      } catch (e: any)
      {
        console.error(`Error auto-fixing missing point ${point.id}:`, e);
        tempMissingPoints = tempMissingPoints.map(mp => mp.id === point.id ? { ...mp, fixLoading: false, justificationNote: `Auto-fix failed: ${e.message}` } : mp);
        itemsFailedToFix++;
      }
      setUiMissingPoints([...tempMissingPoints]); // Update state
    }


    setBatchFixProgress("Auto-fix process completed. Preparing report...");

    if (itemsFailedToFix > 0) {
        toast({ title: "Some Fixes Failed", description: `${itemsFailedToFix} item(s) could not be auto-corrected. ${itemsFixedSuccessfully} fixed. Please review the report.`, variant: "destructive", duration: 10000 });
    } else if (itemsFixedSuccessfully > 0) {
        toast({ title: "Batch Auto-Fix Applied", description: `Report updated with ${itemsFixedSuccessfully} AI suggestions. Preparing download.` });
    } else {
        toast({ title: "No New Fixes Applied", description: "No new items were updated during the batch process." });
    }

    setIsBatchFixing(false);
    setBatchFixProgress(null);

    setTimeout(() => {
      handlePrint();
    }, 700);
  };

  const getButtonText = () => {
    if (isLoading) return "Analyzing Document...";
    if (!fileName) return "Upload Document to Begin";
    return `Analyze ${fileName.length > 30 ? fileName.substring(0, 27) + "..." : fileName}`;
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,4rem))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!currentUser && !authLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,4rem))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="no-print max-w-2xl mx-auto w-full">
        <Card className="shadow-xl rounded-xl border-primary/20">
          <CardHeader className="pt-6 pb-4 text-center">
            <ScanEye size={52} className="text-primary mx-auto mb-3.5" />
            <CardTitle className="text-2xl font-semibold text-primary">LegalForesight AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-8">
            <h2 className="text-3xl font-bold text-center text-foreground mb-1">Upload Document</h2>
            <div className="space-y-5">
              <div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading || isBatchFixing}
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-input rounded-lg text-center hover:border-primary/50 transition-colors cursor-pointer bg-card hover:bg-primary/5"
                >
                  <div className="p-3.5 bg-primary/10 rounded-lg mb-3.5 shadow-sm">
                    <FileUp size={44} className="text-primary" />
                  </div>
                  <p className="text-md font-semibold text-foreground">Click to Upload Document</p>
                  <p className="text-sm text-muted-foreground mt-1">or drop a file here</p>
                </label>
                {fileName && (
                  <p className="text-sm text-green-600 font-medium mt-3.5 text-center">Selected: {fileName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="document-context" className="text-md font-medium text-foreground mb-2 block">
                  Document Context (Crucial for Best Results)
                </Label>
                <Textarea
                  id="document-context"
                  placeholder="E.g., 'Employment contract for a software engineer, reviewing for employee', 'NDA for a startup partnership, mutual agreement', 'Lease agreement for commercial property, reviewing for tenant'. This helps improve analysis accuracy significantly."
                  value={documentContext}
                  onChange={(e) => setDocumentContext(e.target.value)}
                  className="min-h-[80px] text-base shadow-sm focus:ring-primary/30 focus:border-primary/30 p-3"
                  disabled={isLoading || isBatchFixing}
                />
                <p className="text-xs text-muted-foreground mt-2">Providing specific context (like document type and your role/perspective) greatly enhances the AI's analysis.</p>
              </div>
            </div>

            <Button
              onClick={processDocument}
              disabled={(!documentText && !imageDataUri && !fileName) || isLoading || isBatchFixing}
              className="w-full text-lg py-3 h-14 mt-2 shadow-md"
              size="lg"
            >
               {isLoading ? (
                <>
                  <Loader2 className="mr-2.5 h-6 w-6 animate-spin" />
                  {getButtonText()}
                </>
              ) : (
                <>
                  <Zap className="mr-2.5 h-6 w-6" />
                  {getButtonText()}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="no-print mt-10">
        {isLoading && <LoadingIndicator text="Generating insights & predictions..." />}
        {isBatchFixing && (
          <LoadingIndicator text={batchFixProgress || "Applying auto-fixes and preparing report..."} />
        )}
      </div>


      {error && !isLoading && !isBatchFixing && (
        <div className="no-print mt-10 max-w-3xl mx-auto">
          <Alert variant="destructive" className="shadow-md p-5">
            <AlertCircle className="h-6 w-6" />
            <AlertTitle className="text-lg font-semibold">Error During Analysis</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap text-base mt-2">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div id="report-content" className="printable-area mt-12">
        {!isLoading && !isBatchFixing && hasResults && (
           <div className="text-center mb-8 no-print space-y-4 md:space-y-0 md:flex md:items-center md:justify-center md:space-x-4">
             <Button
                onClick={handlePrint}
                variant="outline"
                className="w-full md:w-auto shadow-md hover:shadow-lg transition-all border-primary/70 text-primary hover:bg-primary/10"
                size="lg"
                disabled={isLoading || isBatchFixing}
              >
                <Printer className="mr-2.5 h-5 w-5" />
                Download Full Report
              </Button>
              <Button
                onClick={handleBatchAutoFixAndDownload}
                variant="default"
                className="w-full md:w-auto shadow-md hover:shadow-lg transition-all bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
                disabled={isLoading || isBatchFixing || !hasResults}
              >
                {isBatchFixing ? (
                  <>
                    <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                    {batchFixProgress ? batchFixProgress.substring(0,25)+(batchFixProgress.length > 25 ? '...' : '') : "Fixing & Preparing..."}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2.5 h-5 w-5" />
                    Download Fixed Report
                  </>
                )}
              </Button>
           </div>
        )}

        {!isLoading && !isBatchFixing && (
          <AnalysisDisplay
            fileName={fileName}
            documentContext={documentContext.trim() || (fileName ? `Context related to document: ${fileName}` : "General Legal Document")}
            summary={summary}
            flaggedClauses={uiFlaggedClauses}
            suggestions={suggestions}
            missingPoints={uiMissingPoints}
            legalForesight={legalForesight}
            onApplyAutoFix={handleApplyAutoFix}
            onAcceptFix={handleAcceptFix}
            onRevertFix={handleRevertFix}
          />
        )}
      </div>

      {!isLoading && !isBatchFixing && hasResults && (documentText || imageDataUri) && fileName && (
        <div className="mt-12 no-print">
          <ChatInterface
            documentText={documentText}
            imageDataUri={imageDataUri}
            fileName={fileName}
            documentContext={documentContext.trim() || (fileName ? `Context related to document: ${fileName}` : "General legal document.")}
          />
        </div>
      )}

      <footer className="no-print text-center text-muted-foreground mt-20 py-8 text-sm border-t border-border">
        <p>&copy; {new Date().getFullYear()} LegalForesight AI. Predictive analysis for informational purposes only. Not legal advice.</p>
        <p className="mt-1.5">Please consult with a qualified legal professional for any legal matters.</p>
      </footer>
    </div>
  );
}
