
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, AlertCircle, Printer, ScanEye, Zap, Loader2, Wand2 } from 'lucide-react';

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
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentContext, setDocumentContext] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBatchFixing, setIsBatchFixing] = useState(false);
  const [batchFixProgress, setBatchFixProgress] = useState<string | null>(null); // For sequential progress
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [summary, setSummary] = useState<SummarizeLegalDocumentOutput | null>(null);
  const [uiFlaggedClauses, setUiFlaggedClauses] = useState<UIFlaggedClause[]>([]);
  const [uiMissingPoints, setUiMissingPoints] = useState<UIMissingPoint[]>([]);

  const [suggestions, setSuggestions] = useState<SuggestImprovementsOutput | null>(null);
  const [legalForesight, setLegalForesight] = useState<PredictLegalOutcomesOutput | null>(null);

  const resetAnalysisStates = () => {
    setSummary(null);
    setUiFlaggedClauses([]);
    setUiMissingPoints([]);
    setSuggestions(null);
    setLegalForesight(null);
    setError(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      resetAnalysisStates();
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
    resetAnalysisStates();

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
        setError(prev => (prev ? prev + "\n" : "") + "Summarization failed.");
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
         setError(prev => (prev ? prev + "\n" : "") + "Clause flagging failed.");
      }

      if (improvementsRes.status === 'fulfilled') setSuggestions(improvementsRes.value);
      else {
        console.error("Improvement suggestion failed:", improvementsRes.reason);
        setError(prev => (prev ? prev + "\n" : "") + "Improvement suggestion failed.");
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
         setError(prev => (prev ? prev + "\n" : "") + "Missing points analysis failed.");
      }

      if (foresightRes.status === 'fulfilled') setLegalForesight(foresightRes.value);
      else {
        console.error("Legal foresight analysis failed:", foresightRes.reason);
        setError(prev => (prev ? prev + "\n" : "") + "Legal foresight analysis failed.");
      }

      const allFailed = results.every(res => res.status === 'rejected');
      const anyFailed = results.some(res => res.status === 'rejected');

      if (allFailed) {
        const errorMessages = results
          .filter(res => res.status === 'rejected').map(res => (res as PromiseRejectedResult).reason?.message || (res as PromiseRejectedResult).reason?.toString() || "Unknown error").join('\n');
        setError(`All AI analyses failed. Errors:\n${errorMessages}`);
        toast({ title: "Analysis Failed", description: "All AI analyses failed. Please check console or error display.", variant: "destructive" });
      } else if (anyFailed) {
         toast({ title: "Partial Analysis Success", description: "Some analyses could not be completed. Review the report for details.", variant: "default" });
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

  const handleApplyAutoFix = useCallback(async (itemId: string, itemType: 'flaggedClause' | 'missingPoint') => {
    let itemToFix;
    let autoFixInput: AutoFixClauseInput;
    const currentDocumentContext = documentContext.trim() || (fileName ? `Context related to document: ${fileName}` : "General Legal Document");

    if (itemType === 'flaggedClause') {
      setUiFlaggedClauses(prev => prev.map(fc => fc.id === itemId ? { ...fc, fixLoading: true, isFixProposed: false } : fc));
      itemToFix = uiFlaggedClauses.find(fc => fc.id === itemId);
      if (!itemToFix) return;
      autoFixInput = {
        originalClauseText: itemToFix.originalClauseText,
        problemDescription: itemToFix.originalReason,
        documentContext: currentDocumentContext,
        fixType: "rewrite",
      };
    } else {
      setUiMissingPoints(prev => prev.map(mp => mp.id === itemId ? { ...mp, fixLoading: true, isFixProposed: false } : mp));
      itemToFix = uiMissingPoints.find(mp => mp.id === itemId);
      if (!itemToFix || !itemToFix.isFixable) return;
      autoFixInput = {
        problemDescription: itemToFix.text,
        documentContext: currentDocumentContext,
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


  const handlePrint = () => {
    window.print();
  };

  const hasResults = summary || uiFlaggedClauses.length > 0 || uiMissingPoints.length > 0 || suggestions || legalForesight;

  const handleBatchAutoFixAndDownload = async () => {
    if (!hasResults) {
      toast({ title: "No Report", description: "Please analyze a document first.", variant: "destructive" });
      return;
    }

    setIsBatchFixing(true);
    setBatchFixProgress("Starting auto-fix process...");
    toast({ title: "Auto-Fixing Report", description: "Applying AI suggestions to all applicable items sequentially..." });

    const currentDocumentContext = documentContext.trim() || (fileName ? `Context related to document: ${fileName}` : "General Legal Document");

    const clausesToFix = uiFlaggedClauses.filter(clause => !clause.isFixProposed && !clause.isFixAccepted);
    const pointsToFix = uiMissingPoints.filter(point => point.isFixable && !point.isFixProposed && !point.isFixAccepted);

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

    // Process Flagged Clauses Sequentially
    for (let i = 0; i < clausesToFix.length; i++) {
      const clause = clausesToFix[i];
      setBatchFixProgress(`Fixing flagged clause ${i + 1} of ${clausesToFix.length}...`);
      setUiFlaggedClauses(prev => prev.map(fc => fc.id === clause.id ? { ...fc, fixLoading: true } : fc));

      try {
        const result = await autoFixClause({
          originalClauseText: clause.originalClauseText,
          problemDescription: clause.originalReason,
          documentContext: currentDocumentContext,
          fixType: "rewrite",
        });
        setUiFlaggedClauses(prev => prev.map(fc => fc.id === clause.id ? {
          ...fc,
          currentClauseText: result.fixedClauseText,
          currentReason: result.justificationNote || "AI proposed fix applied.",
          isFixProposed: true,
          isFixAccepted: false,
          fixLoading: false,
        } : fc));
        itemsFixedSuccessfully++;
      } catch (e) {
        console.error(`Error auto-fixing flagged clause ${clause.id}:`, e);
        setUiFlaggedClauses(prev => prev.map(fc => fc.id === clause.id ? { ...fc, fixLoading: false } : fc));
        itemsFailedToFix++;
      }
    }

    // Process Missing Points Sequentially
    for (let i = 0; i < pointsToFix.length; i++) {
      const point = pointsToFix[i];
      setBatchFixProgress(`Fixing missing point ${i + 1} of ${pointsToFix.length}... (Overall ${clausesToFix.length + i + 1}/${totalItemsToFix})`);
      setUiMissingPoints(prev => prev.map(mp => mp.id === point.id ? { ...mp, fixLoading: true } : mp));
      try {
        const result = await autoFixClause({
          problemDescription: point.text,
          documentContext: currentDocumentContext,
          fixType: "generate",
        });
        setUiMissingPoints(prev => prev.map(mp => mp.id === point.id ? {
          ...mp,
          currentText: result.fixedClauseText,
          justificationNote: result.justificationNote,
          isFixProposed: true,
          isFixAccepted: false,
          fixLoading: false,
        } : mp));
        itemsFixedSuccessfully++;
      } catch (e) {
        console.error(`Error auto-fixing missing point ${point.id}:`, e);
        setUiMissingPoints(prev => prev.map(mp => mp.id === point.id ? { ...mp, fixLoading: false } : mp));
        itemsFailedToFix++;
      }
    }

    setBatchFixProgress("Auto-fix process completed.");

    if (itemsFailedToFix > 0) {
        toast({ title: "Some Fixes Failed", description: `${itemsFailedToFix} item(s) could not be auto-corrected. ${itemsFixedSuccessfully} fixed. Please review.`, variant: "destructive", duration: 7000 });
    } else if (itemsFixedSuccessfully > 0) {
        toast({ title: "Auto-Fix Applied", description: `Report updated with ${itemsFixedSuccessfully} AI suggestions. Preparing download.` });
    } else {
        // This case should have been caught earlier if totalItemsToFix was 0
        toast({ title: "No Fixes Applied", description: "No items were updated during the batch process." });
    }

    setIsBatchFixing(false);
    setBatchFixProgress(null);

    setTimeout(() => {
      handlePrint();
    }, 500); // Slightly longer delay to ensure DOM updates
  };


  return (
    <div className="w-full">
      <div className="max-w-md mx-auto w-full no-print">
        <Card className="shadow-xl rounded-xl border-primary/20">
          <CardHeader className="pt-6 pb-4 text-center">
            <ScanEye size={40} className="text-primary mx-auto mb-2" />
            <CardTitle className="text-2xl font-semibold text-primary">LegalForesight AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-8">
            <h2 className="text-3xl font-bold text-center text-foreground">Upload Document</h2>
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
                  <div className="p-3 bg-primary/10 rounded-lg mb-3">
                    <FileUp size={36} className="text-primary" />
                  </div>
                  <p className="text-md font-semibold text-foreground">Upload Document</p>
                  <p className="text-xs text-muted-foreground">or drop a file here</p>
                </label>
                {fileName && (
                  <p className="text-sm text-green-600 font-medium mt-3 text-center">Selected: {fileName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="document-context" className="text-sm font-medium text-foreground mb-1.5 block">
                  Document Context (Optional)
                </Label>
                <Textarea
                  id="document-context"
                  placeholder="E.g., 'Employment contract for a software engineer', 'NDA for a startup partnership'. This helps improve analysis accuracy."
                  value={documentContext}
                  onChange={(e) => setDocumentContext(e.target.value)}
                  className="min-h-[70px] text-sm shadow-sm"
                  disabled={isLoading || isBatchFixing}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Providing context can significantly enhance the AI's understanding and analysis.</p>
              </div>
            </div>

            <Button
              onClick={processDocument}
              disabled={(!documentText && !imageDataUri && !fileName) || isLoading || isBatchFixing}
              className="w-full text-lg py-3 h-12"
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

      {isLoading && <div className="no-print mt-8"><LoadingIndicator text="Generating insights & predictions..." /></div>}
      {isBatchFixing && (
        <div className="no-print mt-8">
            <LoadingIndicator text={batchFixProgress || "Applying auto-fixes and preparing report..."} />
        </div>
      )}


      {error && !isLoading && !isBatchFixing && (
        <div className="no-print mt-8 max-w-xl mx-auto">
          <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-6 w-6" />
            <AlertTitle className="text-lg">Error During Analysis</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap text-base">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div id="report-content" className="printable-area mt-10">
        {!isLoading && !isBatchFixing && hasResults && (
           <div className="text-center mb-6 no-print space-y-3 md:space-y-0 md:space-x-3">
             <Button
                onClick={handlePrint}
                variant="outline"
                className="w-full md:w-auto shadow-sm hover:shadow-md"
                size="lg"
                disabled={isBatchFixing}
              >
                <Printer className="mr-2 h-5 w-5" />
                Download Full Report
              </Button>
              <Button
                onClick={handleBatchAutoFixAndDownload}
                variant="default"
                className="w-full md:w-auto shadow-sm hover:shadow-md"
                size="lg"
                disabled={isLoading || isBatchFixing || !hasResults}
              >
                {isBatchFixing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Fixing & Preparing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
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
        <div className="mt-10 no-print">
          <ChatInterface
            documentText={documentText}
            imageDataUri={imageDataUri}
            fileName={fileName}
          />
        </div>
      )}

      <footer className="text-center text-muted-foreground mt-16 py-6 text-xs no-print border-t">
        <p>&copy; {new Date().getFullYear()} LegalForesight AI. Predictive analysis for informational purposes only. Not legal advice.</p>
        <p>Please consult with a qualified legal professional for any legal matters.</p>
      </footer>
    </div>
  );
}
