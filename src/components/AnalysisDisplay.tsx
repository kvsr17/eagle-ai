
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Search,
  Scale, // Kept for potential future use, or if we want a general legal icon
  ChevronRight,
  ShieldAlert, 
  TrendingUp, 
  ListChecks, 
  Zap, 
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import type { SummarizeLegalDocumentOutput } from '@/ai/flows/summarize-legal-document';
import type { FlagCriticalClausesOutput } from '@/ai/flows/flag-critical-clauses';
import type { SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import type { IdentifyMissingPointsOutput } from '@/ai/flows/identify-missing-points';
import type { PredictLegalOutcomesOutput } from '@/ai/flows/predict-legal-outcomes';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalysisDisplayProps {
  fileName: string | null;
  summary: SummarizeLegalDocumentOutput | null;
  flaggedClauses: FlagCriticalClausesOutput | null;
  suggestions: SuggestImprovementsOutput | null;
  missingPoints: IdentifyMissingPointsOutput | null;
  legalForesight: PredictLegalOutcomesOutput | null;
}

export function AnalysisDisplay({
  fileName,
  summary,
  flaggedClauses,
  suggestions,
  missingPoints,
  legalForesight,
}: AnalysisDisplayProps) {
  const hasContent = summary?.summary || 
                     (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0) ||
                     (suggestions?.suggestions && suggestions.suggestions.length > 0) ||
                     (missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0 || missingPoints.summary)) ||
                     (legalForesight && (legalForesight.overallRiskAssessment || legalForesight.predictedOutcomes.length > 0 || legalForesight.strategicRecommendations.length > 0));

  if (!fileName && !hasContent) {
    return null;
  }

  const getRiskBadgeVariant = (riskAssessment: string | undefined) => {
    if (!riskAssessment) return "secondary";
    const lowerRisk = riskAssessment.toLowerCase();
    if (lowerRisk.includes("high")) return "destructive";
    if (lowerRisk.includes("medium")) return "default"; 
    if (lowerRisk.includes("low")) return "secondary"; 
    return "outline";
  };

  return (
    <Card className="mt-6 shadow-lg border-primary/20"> 
      <CardHeader className="pb-4 border-b-2 border-primary bg-primary/5 rounded-t-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap size={40} className="text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">LegalForesight Analysis Report</h1>
              <p className="text-muted-foreground">Prepared by LegalForesight AI</p>
            </div>
          </div>
          {fileName && (
            <div className="text-right shrink-0">
              <p className="text-sm text-muted-foreground">Document:</p>
              <p className="text-lg font-semibold text-primary truncate max-w-xs" title={fileName}>{fileName}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <div className="space-y-10">
          
          {legalForesight && (legalForesight.overallRiskAssessment || legalForesight.predictedOutcomes.length > 0 || legalForesight.strategicRecommendations.length > 0) && (
            <SectionCard 
              title="Legal Foresight & Predictions" 
              icon={<Zap size={28} className="text-primary" />} 
              accentHighlight={false} 
              className="border-2 border-primary/30 p-6 rounded-lg bg-primary/5 shadow-md"
            >
              {legalForesight.overallRiskAssessment && (
                <div className="mb-6 p-4 rounded-md bg-background shadow">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <ShieldAlert size={22} /> Overall Risk Assessment
                  </h4>
                  <Badge variant={getRiskBadgeVariant(legalForesight.overallRiskAssessment)} className="text-sm mb-2 py-1 px-2.5">
                    {legalForesight.overallRiskAssessment.split(':')[0]}
                  </Badge>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {legalForesight.overallRiskAssessment.substring(legalForesight.overallRiskAssessment.indexOf(':') + 1).trim()}
                  </p>
                </div>
              )}

              {legalForesight.predictedOutcomes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <TrendingUp size={22} /> Potential Real-World Outcomes
                  </h4>
                  <ul className="space-y-4">
                    {legalForesight.predictedOutcomes.map((outcome, index) => (
                      <li key={`outcome-${index}`} className="p-4 border border-primary/20 rounded-md bg-background/70 shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-medium text-foreground/90 mb-1"><span className="font-semibold text-primary/90">Identified Issue:</span> {outcome.identifiedIssue}</p>
                        <p className="text-sm text-foreground/80"><span className="font-semibold text-primary/80">Predicted Outcome:</span> {outcome.potentialRealWorldOutcome}</p>
                        {outcome.riskCategory && (
                          <Badge variant="outline" className="mt-2 text-xs border-primary/30 text-primary/80">{outcome.riskCategory}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {legalForesight.strategicRecommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <ListChecks size={22} /> Strategic Recommendations
                  </h4>
                  <ul className="space-y-3 list-disc list-inside pl-2">
                    {legalForesight.strategicRecommendations.map((rec, index) => (
                      <li key={`strategic-rec-${index}`} className="text-foreground/90 marker:text-primary leading-relaxed">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </SectionCard>
          )}
          
          { (legalForesight && (summary?.summary || (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0) || (suggestions?.suggestions && suggestions.suggestions.length > 0) || (missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0 || missingPoints.summary)) )) && <Separator className="my-8 border-primary/20"/>}


          {summary?.summary && (
            <SectionCard title="I. Document Summary" icon={<Search size={28} />}>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{summary.summary}</p>
            </SectionCard>
          )}

          {flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0 && (
            <>
              {(summary?.summary) && <Separator className="my-6" />}
              <SectionCard title="II. Critical Clause Flags" icon={<AlertTriangle size={28} />} accentHighlight>
                <ul className="space-y-4">
                  {flaggedClauses.criticalClauses.map((clause, index) => (
                    <li key={index} className="p-4 border border-accent/30 rounded-lg bg-accent-light shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-on-accent mb-1 flex items-center">
                        <ChevronRight size={20} className="mr-1 text-accent" /> Clause Identified:
                      </h4>
                      <p className="italic text-foreground/80 mb-1 ml-3">"{clause.clauseText}"</p>
                       <h5 className="font-semibold text-on-accent mt-2 mb-1 flex items-center">
                        <AlertTriangle size={18} className="mr-1 text-accent" /> Reason for Flag:
                      </h5>
                      <p className="text-sm text-foreground/70 ml-3">{clause.reason}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </>
          )}

          {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
             <>
              {((summary?.summary) || (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0)) && <Separator className="my-6" />}
              <SectionCard title="III. Improvement Suggestions" icon={<Lightbulb size={28} />} accentHighlight>
                <ul className="space-y-3 list-disc list-inside pl-2">
                  {suggestions.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-foreground/90 marker:text-accent leading-relaxed">{suggestion}</li>
                  ))}
                </ul>
              </SectionCard>
            </>
          )}

          {missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0 || missingPoints.summary) && (
            <>
              {((summary?.summary) || (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0) || (suggestions?.suggestions && suggestions.suggestions.length > 0)) && <Separator className="my-6" />}
              <SectionCard title="IV. Missing Points Analysis" icon={<HelpCircle size={28} />} accentHighlight>
                {missingPoints.missingPoints.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-on-accent mb-2">Missing Information Identified:</h4>
                    <ul className="space-y-2 list-disc list-inside pl-2">
                      {missingPoints.missingPoints.map((point, index) => (
                        <li key={`missing-${index}`} className="text-foreground/90 marker:text-accent leading-relaxed">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {missingPoints.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-on-accent mb-2">Recommendations:</h4>
                    <ul className="space-y-2 list-disc list-inside pl-2">
                      {missingPoints.recommendations.map((rec, index) => (
                        <li key={`rec-${index}`} className="text-foreground/90 marker:text-accent leading-relaxed">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                 {missingPoints.summary && (
                   <div className="mt-4">
                    <h4 className="font-semibold text-on-accent mb-2">Summary of Missing Points:</h4>
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{missingPoints.summary}</p>
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {!hasContent && fileName && (
            <div className="text-center py-10 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4" />
              <p className="text-xl">No specific analysis results to display for {fileName}.</p>
              <p>This might happen if the document is empty, unreadable, or the AI could not extract relevant information.</p>
            </div>
          )}
           {!hasContent && !fileName && (
             <div className="text-center py-10 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4" />
              <p className="text-xl">Upload a document to begin analysis.</p>
            </div>
          )}


          {hasContent && (
            <footer className="mt-12 pt-8 border-t-2 border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <p className="text-xs text-muted-foreground">
                    This report was generated by LegalForesight AI on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Predictive analysis for informational purposes only. This is not legal advice.
                    Always consult with a qualified legal professional for any legal matters.
                  </p>
                </div>
                <div className="md:text-right">
                  <div className="inline-block mt-4 md:mt-0">
                     <Scale size={24} className="mx-auto mb-2 text-gray-400" />
                    <div className="w-48 h-px bg-gray-400 mb-1 mx-auto md:mr-0"></div>
                    <p className="text-sm text-muted-foreground">Authorized Signature (LegalForesight AI Platform)</p>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
