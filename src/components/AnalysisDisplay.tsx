
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Search,
  Scale, 
  ChevronRight,
  ShieldAlert, 
  TrendingUp, 
  ListChecks, 
  Zap, 
  Briefcase,
  Users,
  CalendarDays,
  CircleDollarSign,
  Tag,
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
  const hasContent = summary?.overallSummary || 
                     (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0) ||
                     (suggestions?.suggestions && suggestions.suggestions.length > 0) ||
                     (missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0 || missingPoints.summary)) ||
                     (legalForesight && (legalForesight.overallRiskAssessment || legalForesight.predictedOutcomes.length > 0 || legalForesight.strategicRecommendations.length > 0));

  if (!fileName && !hasContent) {
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
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 text-center">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">Upload a document to begin analysis.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (fileName && !hasContent) {
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
        <CardContent className="p-6 md:p-8 text-center">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">No specific analysis results to display for {fileName}.</p>
            <p className="text-muted-foreground">This might happen if the document is empty, unreadable, or the AI could not extract relevant information from any of the analyses.</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskBadgeVariant = (riskAssessment: string | undefined) => {
    if (!riskAssessment) return "secondary";
    const lowerRisk = riskAssessment.toLowerCase();
    if (lowerRisk.includes("high")) return "destructive";
    if (lowerRisk.includes("medium")) return "default"; 
    if (lowerRisk.includes("low")) return "secondary"; 
    return "outline";
  };

  const renderList = (items: string[] | undefined, emptyMessage: string, icon?: React.ReactNode) => {
    if (!items || items.length === 0 || (items.length === 1 && items[0]?.toLowerCase() === "not specified")) {
      return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
    }
    return (
      <ul className="space-y-2 list-disc list-inside pl-2">
        {items.map((item, index) => (
          <li key={index} className="text-foreground/90 marker:text-primary leading-relaxed flex items-start gap-2">
            {icon && <span className="mt-1">{icon}</span>}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
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
          
          {legalForesight && (legalForesight.overallRiskAssessment || legalForesight.predictedOutcomes.length > 0 || legalForesight.strategicRecommendations.length > 0) ? (
            <SectionCard 
              title="Legal Foresight & Predictions" 
              icon={<Zap size={28} className="text-primary" />} 
              accentHighlight={false} 
              className="border-2 border-primary/30 p-6 rounded-lg bg-primary/5 shadow-md"
            >
              {legalForesight.overallRiskAssessment ? (
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
              ) : <p className="text-muted-foreground text-sm">No overall risk assessment available.</p>}

              {legalForesight.predictedOutcomes.length > 0 ? (
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
              ) : <p className="text-muted-foreground text-sm">No specific potential outcomes were predicted for this document.</p>}

              {legalForesight.strategicRecommendations.length > 0 ? (
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
              ) : <p className="text-muted-foreground text-sm">No strategic recommendations were generated for this document.</p>}
            </SectionCard>
          ) : (
             <SectionCard 
              title="Legal Foresight & Predictions" 
              icon={<Zap size={28} className="text-primary" />} 
              accentHighlight={false} 
              className="border-2 border-primary/30 p-6 rounded-lg bg-primary/5 shadow-md"
            >
              <p className="text-muted-foreground">Legal foresight analysis was not performed or yielded no results for this document.</p>
            </SectionCard>
          )}
          
          { (hasContent) && <Separator className="my-8 border-primary/20"/>}

          {summary ? (
            <SectionCard title="I. Document Breakdown" icon={<Search size={28} />}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <FileText size={20} /> Overall Summary
                  </h4>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{summary.overallSummary || "No overall summary provided."}</p>
                </div>
                <Separator/>
                <div>
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Users size={20} /> Involved Parties
                  </h4>
                  {renderList(summary.involvedParties, "No specific parties identified.", <Users size={16} className="text-muted-foreground"/>)}
                </div>
                 <Separator/>
                <div>
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Briefcase size={20} /> Key Obligations
                  </h4>
                  {renderList(summary.keyObligations, "No specific key obligations identified.", <Briefcase size={16} className="text-muted-foreground"/>)}
                </div>
                 <Separator/>
                <div>
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <CircleDollarSign size={20} /> Financial Terms
                  </h4>
                  {renderList(summary.financialTerms, "No specific financial terms identified.", <CircleDollarSign size={16} className="text-muted-foreground"/>)}
                </div>
                 <Separator/>
                <div>
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <CalendarDays size={20} /> Key Dates & Durations
                  </h4>
                  {renderList(summary.keyDates, "No specific key dates or durations identified.", <CalendarDays size={16} className="text-muted-foreground"/>)}
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="I. Document Breakdown" icon={<Search size={28} />}>
              <p className="text-muted-foreground">No summary breakdown was generated for this document.</p>
            </SectionCard>
          )}

          {(summary) && <Separator className="my-6" />}

          {flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0 ? (
            <SectionCard title="II. Critical Clause Flags" icon={<AlertTriangle size={28} />} accentHighlight>
              <ul className="space-y-4">
                {flaggedClauses.criticalClauses.map((clause, index) => (
                  <li key={index} className="p-4 border border-accent/30 rounded-lg bg-accent-light shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-on-accent mb-1 flex items-center">
                      <ChevronRight size={20} className="mr-1 text-accent" /> Clause Text:
                    </h4>
                    <p className="italic text-foreground/80 mb-2 ml-3">"{clause.clauseText}"</p>
                     <h5 className="font-semibold text-on-accent mt-2 mb-1 flex items-center">
                      <AlertTriangle size={18} className="mr-1 text-accent" /> Reason for Flag:
                    </h5>
                    <p className="text-sm text-foreground/70 ml-3 mb-2">{clause.reason}</p>
                    {clause.riskTags && clause.riskTags.length > 0 && (
                      <>
                        <h5 className="font-semibold text-on-accent mt-2 mb-1 flex items-center">
                          <Tag size={18} className="mr-1 text-accent" /> Associated Risk Tags:
                        </h5>
                        <div className="ml-3 flex flex-wrap gap-2">
                          {clause.riskTags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs border-accent/50 text-accent bg-accent/10">{tag}</Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : (
            <SectionCard title="II. Critical Clause Flags" icon={<AlertTriangle size={28} />} accentHighlight>
              <p className="text-muted-foreground">No critical clauses were flagged by the AI for this document.</p>
            </SectionCard>
          )}

          {((summary) || (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0)) && <Separator className="my-6" />}

          {suggestions?.suggestions && suggestions.suggestions.length > 0 ? (
            <SectionCard title="III. Improvement Suggestions" icon={<Lightbulb size={28} />} accentHighlight>
              <ul className="space-y-3 list-disc list-inside pl-2">
                {suggestions.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-foreground/90 marker:text-accent leading-relaxed">{suggestion}</li>
                ))}
              </ul>
            </SectionCard>
          ) : (
             <SectionCard title="III. Improvement Suggestions" icon={<Lightbulb size={28} />} accentHighlight>
              <p className="text-muted-foreground">No improvement suggestions were generated for this document.</p>
            </SectionCard>
          )}

          {((summary) || (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0) || (suggestions?.suggestions && suggestions.suggestions.length > 0)) && <Separator className="my-6" />}
          
          {missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0 || missingPoints.summary) ? (
            <SectionCard title="IV. Missing Points Analysis" icon={<HelpCircle size={28} />} accentHighlight>
              {missingPoints.missingPoints.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-semibold text-on-accent mb-2">Missing Information Identified:</h4>
                  <ul className="space-y-2 list-disc list-inside pl-2">
                    {missingPoints.missingPoints.map((point, index) => (
                      <li key={`missing-${index}`} className="text-foreground/90 marker:text-accent leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              ) : <p className="text-muted-foreground text-sm">No specific missing information was identified.</p>}
              {missingPoints.recommendations.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-semibold text-on-accent mb-2">Recommendations:</h4>
                  <ul className="space-y-2 list-disc list-inside pl-2">
                    {missingPoints.recommendations.map((rec, index) => (
                      <li key={`rec-${index}`} className="text-foreground/90 marker:text-accent leading-relaxed">{rec}</li>
                    ))}
                  </ul>
                </div>
              ): <p className="text-muted-foreground text-sm">No specific recommendations regarding missing points.</p>}
               {missingPoints.summary ? (
                 <div className="mt-4">
                  <h4 className="font-semibold text-on-accent mb-2">Summary of Missing Points:</h4>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{missingPoints.summary}</p>
                </div>
              ): <p className="text-muted-foreground text-sm mt-4">No summary for missing points was generated.</p>}
            </SectionCard>
          ) : (
            <SectionCard title="IV. Missing Points Analysis" icon={<HelpCircle size={28} />} accentHighlight>
              <p className="text-muted-foreground">Missing points analysis was not performed or yielded no results for this document.</p>
            </SectionCard>
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
