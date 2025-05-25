
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
  Archive,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Edit3,
  Loader2,
  MessageSquare // Added for consistency if needed
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import type { SummarizeLegalDocumentOutput } from '@/ai/flows/summarize-legal-document';
import type { UIFlaggedClause, UIMissingPoint } from '@/app/page';
import type { SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import type { PredictLegalOutcomesOutput } from '@/ai/flows/predict-legal-outcomes';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Ensure CardTitle etc. are not needed here if only Card, CardContent, CardHeader are used
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalysisDisplayProps {
  fileName: string | null;
  documentContext: string;
  summary: SummarizeLegalDocumentOutput | null;
  flaggedClauses: UIFlaggedClause[];
  suggestions: SuggestImprovementsOutput | null;
  missingPoints: UIMissingPoint[];
  legalForesight: PredictLegalOutcomesOutput | null;
  onApplyAutoFix: (itemId: string, itemType: 'flaggedClause' | 'missingPoint') => void;
  onAcceptFix: (itemId: string, itemType: 'flaggedClause' | 'missingPoint') => void;
  onRevertFix: (itemId: string, itemType: 'flaggedClause' | 'missingPoint') => void;
}

export function AnalysisDisplay({
  fileName,
  documentContext,
  summary,
  flaggedClauses,
  suggestions,
  missingPoints,
  legalForesight,
  onApplyAutoFix,
  onAcceptFix,
  onRevertFix,
}: AnalysisDisplayProps) {
  const hasContent =
    summary?.overallSummary ||
    (summary?.involvedParties && summary.involvedParties.length > 0 && summary.involvedParties[0]?.toLowerCase() !== 'not specified') ||
    (summary?.keyObligations && summary.keyObligations.length > 0 && summary.keyObligations[0]?.toLowerCase() !== 'not specified') ||
    (summary?.financialTerms && summary.financialTerms.length > 0 && summary.financialTerms[0]?.toLowerCase() !== 'not specified') ||
    (summary?.keyDates && summary.keyDates.length > 0 && summary.keyDates[0]?.toLowerCase() !== 'not specified') ||
    (flaggedClauses && flaggedClauses.length > 0) ||
    (suggestions?.suggestions && suggestions.suggestions.length > 0) ||
    (missingPoints && missingPoints.length > 0) ||
    (legalForesight && (legalForesight.overallRiskAssessment || legalForesight.predictedOutcomes.length > 0 || legalForesight.strategicRecommendations.length > 0));

  const renderList = (items: string[] | undefined, emptyMessage: string, icon?: React.ReactNode, itemClassName?: string) => {
    if (!items || items.length === 0 || (items.length === 1 && (items[0]?.toLowerCase() === "not specified" || items[0]?.trim() === ""))) {
      return <p className="text-muted-foreground text-sm italic">{emptyMessage}</p>;
    }
    return (
      <ul className="space-y-2.5 list-none p-0">
        {items.map((item, index) => (
          <li key={index} className={cn("text-foreground/90 leading-relaxed flex items-start gap-2.5 p-3 bg-card border border-border/70 rounded-md shadow-sm hover:shadow-md transition-shadow", itemClassName)}>
            {icon && <span className="mt-0.5 text-primary/80 flex-shrink-0">{icon}</span>}
            <span className="flex-grow">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  const getRiskBadgeVariant = (riskAssessment: string | undefined): "destructive" | "default" | "secondary" | "outline" => {
    if (!riskAssessment) return "secondary";
    const lowerRisk = riskAssessment.toLowerCase();
    if (lowerRisk.includes("high")) return "destructive";
    if (lowerRisk.includes("medium")) return "default";
    if (lowerRisk.includes("low")) return "secondary";
    return "outline";
  };

  const initialEmptyStateCard = (title: string, message: string, iconElement?: React.ReactNode) => (
    <Card className="mt-6 shadow-xl border-primary/20 rounded-lg">
      <CardHeader className="pb-4 border-b-2 border-primary bg-primary/5 rounded-t-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {iconElement || <Archive size={40} className="text-primary" />}
            <div>
              <h1 className="text-3xl font-bold text-primary">{title}</h1>
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
      <CardContent className="p-8 text-center">
        <FileText size={52} className="mx-auto mb-6 text-muted-foreground/70" />
        <p className="text-xl text-muted-foreground">{message}</p>
        {fileName && !hasContent && (
          <p className="text-muted-foreground mt-2">This might happen if the document is empty, unreadable, or the AI could not extract relevant information.</p>
        )}
      </CardContent>
    </Card>
  );

  if (!fileName && !hasContent) {
    return initialEmptyStateCard("LegalForesight Analysis Report", "Upload a document to begin analysis.", <Zap size={40} className="text-primary" />);
  }

  if (fileName && !hasContent) {
    return initialEmptyStateCard("LegalForesight Analysis Report", `No specific analysis results to display for ${fileName}.`);
  }

  return (
    <Card className="mt-6 shadow-2xl border-2 border-primary/30 rounded-xl overflow-hidden">
      <CardHeader className="py-6 px-7 border-b-2 border-primary/40 bg-primary-light rounded-t-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Zap size={44} className="text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-primary">LegalForesight Analysis Report</h1>
              <p className="text-muted-foreground font-medium text-sm mt-0.5">Prepared by LegalForesight AI</p>
            </div>
          </div>
          {fileName && (
            <div className="text-right shrink-0 sm:mt-0 mt-3">
              <p className="text-sm text-muted-foreground">Document Analyzed:</p>
              <p className="text-lg font-semibold text-primary truncate max-w-xs" title={fileName}>{fileName}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-7 md:p-9 space-y-12">

        {legalForesight && (legalForesight.overallRiskAssessment || legalForesight.predictedOutcomes.length > 0 || legalForesight.strategicRecommendations.length > 0) ? (
          <SectionCard
            title="Legal Foresight & Predictions"
            icon={<Zap size={32} className="text-primary" />}
            className="border-2 border-primary/50 p-7 rounded-xl bg-primary/5 shadow-xl"
          >
            {legalForesight.overallRiskAssessment ? (
              <div className="mb-7 p-5 rounded-lg bg-card shadow-lg border border-primary/30">
                <h4 className="font-semibold text-2xl text-primary mb-3 flex items-center gap-2.5">
                  <ShieldAlert size={26} /> Overall Risk Assessment
                </h4>
                <Badge variant={getRiskBadgeVariant(legalForesight.overallRiskAssessment)} className="text-md mb-3.5 py-1.5 px-3.5 shadow-md">
                  {legalForesight.overallRiskAssessment.split(':')[0]}
                </Badge>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 text-base">
                  {legalForesight.overallRiskAssessment.substring(legalForesight.overallRiskAssessment.indexOf(':') + 1).trim()}
                </p>
              </div>
            ) : <p className="text-muted-foreground text-sm italic">No overall risk assessment available.</p>}

            {legalForesight.predictedOutcomes.length > 0 ? (
              <div className="mb-7">
                <h4 className="font-semibold text-2xl text-primary mb-5 flex items-center gap-2.5">
                  <TrendingUp size={26} /> Potential Real-World Outcomes
                </h4>
                <ul className="space-y-5">
                  {legalForesight.predictedOutcomes.map((outcome, index) => (
                    <li key={`outcome-${index}`} className="p-5 border border-primary/40 rounded-xl bg-card shadow-lg hover:shadow-xl transition-all duration-200">
                      <p className="font-medium text-foreground/95 mb-2 text-lg"><span className="font-semibold text-primary/90">Identified Issue:</span> {outcome.identifiedIssue}</p>
                      <p className="text-base text-foreground/85"><span className="font-semibold text-primary/80">Predicted Outcome:</span> {outcome.potentialRealWorldOutcome}</p>
                      {outcome.riskCategory && (
                        <Badge variant="outline" className="mt-3 text-sm border-primary/50 text-primary/90 bg-primary/10 px-2.5 py-1">{outcome.riskCategory}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : <p className="text-muted-foreground text-sm italic">No specific potential outcomes were predicted.</p>}

            {legalForesight.strategicRecommendations.length > 0 ? (
              <div>
                <h4 className="font-semibold text-2xl text-primary mb-5 flex items-center gap-2.5">
                  <ListChecks size={26} /> Strategic Recommendations
                </h4>
                <ul className="space-y-3.5 list-disc list-outside ml-6 marker:text-primary marker:text-xl">
                  {legalForesight.strategicRecommendations.map((rec, index) => (
                    <li key={`strategic-rec-${index}`} className="text-foreground/90 leading-relaxed text-base">{rec}</li>
                  ))}
                </ul>
              </div>
            ) : <p className="text-muted-foreground text-sm italic">No strategic recommendations were generated.</p>}
          </SectionCard>
        ) : (
          <SectionCard
            title="Legal Foresight & Predictions"
            icon={<Zap size={32} className="text-primary" />}
            className="border-2 border-primary/30 p-7 rounded-xl bg-primary/5 shadow-md"
          >
            <p className="text-muted-foreground italic">Legal foresight analysis was not performed or yielded no results.</p>
          </SectionCard>
        )}

        {(hasContent && (summary || flaggedClauses.length > 0 || suggestions || missingPoints.length > 0)) && <Separator className="my-12 border-primary/30" />}

        {summary ? (
          <SectionCard title="I. Document Breakdown" icon={<Search size={32} />}>
            <div className="space-y-6">
              <div className="p-5 rounded-lg bg-muted/40 border border-border shadow-md">
                <h4 className="font-semibold text-xl text-primary mb-3 flex items-center gap-2.5">
                  <FileText size={24} /> Overall Summary
                </h4>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 text-base">{summary.overallSummary || "No overall summary provided."}</p>
              </div>
              <Separator className="my-6" />
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <h4 className="font-semibold text-xl text-primary mb-3 flex items-center gap-2.5">
                    <Users size={24} /> Involved Parties
                  </h4>
                  {renderList(summary.involvedParties, "No specific parties identified.", <Users size={18} className="text-primary/70" />)}
                </div>
                <div>
                  <h4 className="font-semibold text-xl text-primary mb-3 flex items-center gap-2.5">
                    <Briefcase size={24} /> Key Obligations
                  </h4>
                  {renderList(summary.keyObligations, "No specific key obligations identified.", <Briefcase size={18} className="text-primary/70" />)}
                </div>
                <div>
                  <h4 className="font-semibold text-xl text-primary mb-3 flex items-center gap-2.5">
                    <CircleDollarSign size={24} /> Financial Terms
                  </h4>
                  {renderList(summary.financialTerms, "No specific financial terms identified.", <CircleDollarSign size={18} className="text-primary/70" />)}
                </div>
                <div>
                  <h4 className="font-semibold text-xl text-primary mb-3 flex items-center gap-2.5">
                    <CalendarDays size={24} /> Key Dates & Durations
                  </h4>
                  {renderList(summary.keyDates, "No specific key dates or durations identified.", <CalendarDays size={18} className="text-primary/70" />)}
                </div>
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="I. Document Breakdown" icon={<Search size={32} />}>
            <p className="text-muted-foreground italic">No summary breakdown was generated for this document.</p>
          </SectionCard>
        )}

        {summary && <Separator className="my-10" />}

        {flaggedClauses && flaggedClauses.length > 0 ? (
          <SectionCard title="II. Critical Clause Flags" icon={<AlertTriangle size={32} />} accentHighlight>
            <ul className="space-y-6">
              {flaggedClauses.map((clause) => (
                <li key={clause.id} className={cn("p-5 border rounded-xl shadow-lg hover:shadow-xl transition-all duration-200",
                  clause.isFixAccepted ? "border-green-500 bg-green-50/50" : "border-accent/50 bg-accent-light"
                )}>
                  <h4 className="font-semibold text-on-accent text-lg mb-2 flex items-center">
                    <ChevronRight size={24} className="mr-2 text-accent" /> Clause Text:
                  </h4>
                  <p className={cn("italic text-foreground/85 mb-3 ml-5 text-base", clause.isFixProposed && !clause.isFixAccepted && "line-through opacity-60")}>
                    "{clause.originalClauseText}"
                  </p>
                  {clause.isFixProposed && !clause.isFixAccepted && (
                    <div className="ml-5 p-3.5 my-2.5 border border-yellow-500 bg-yellow-100/80 rounded-md shadow-sm">
                      <p className="font-semibold text-yellow-800 mb-1.5 text-md">Suggested Fix:</p>
                      <p className="italic text-yellow-900/90 text-base">"{clause.currentClauseText}"</p>
                    </div>
                  )}
                  {clause.isFixAccepted && (
                    <div className="ml-5 p-3.5 my-2.5 border border-green-600 bg-green-100/90 rounded-md shadow-sm">
                      <p className="font-semibold text-green-800 mb-1.5 text-md">Accepted Fix:</p>
                      <p className="italic text-green-900/90 text-base">"{clause.currentClauseText}"</p>
                    </div>
                  )}

                  <h5 className="font-semibold text-on-accent text-md mt-3.5 mb-2 flex items-center">
                    <AlertTriangle size={22} className="mr-2 text-accent" />
                    {clause.isFixProposed || clause.isFixAccepted ? "Justification / Original Reason:" : "Reason for Flag:"}
                  </h5>
                  <p className={cn("text-sm text-foreground/75 ml-5 mb-3", clause.isFixProposed && !clause.isFixAccepted && "line-through opacity-60")}>
                    {clause.originalReason}
                  </p>
                  {(clause.isFixProposed || clause.isFixAccepted) && clause.currentReason !== clause.originalReason && (
                    <p className="text-sm text-foreground/90 ml-5 mb-3 bg-card/70 p-2.5 rounded border border-border shadow-sm">
                      <span className="font-semibold">Justification: </span>{clause.currentReason}
                    </p>
                  )}

                  {clause.riskTags && clause.riskTags.length > 0 && (
                    <>
                      <h5 className="font-semibold text-on-accent text-md mt-3.5 mb-2.5 flex items-center">
                        <Tag size={22} className="mr-2 text-accent" /> Associated Risk Tags:
                      </h5>
                      <div className="ml-5 flex flex-wrap gap-2.5">
                        {clause.riskTags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-accent/70 text-accent bg-accent/20 shadow-sm px-2 py-0.5">{tag}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="mt-5 ml-5 flex flex-wrap gap-2.5">
                    {!clause.isFixProposed && !clause.isFixAccepted && (
                      <Button size="sm" variant="outline" onClick={() => onApplyAutoFix(clause.id, 'flaggedClause')} disabled={clause.fixLoading} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500 shadow-md hover:shadow-lg transition-shadow">
                        {clause.fixLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />} Apply Auto-Fix
                      </Button>
                    )}
                    {clause.isFixProposed && !clause.isFixAccepted && (
                      <>
                        <Button size="sm" variant="default" onClick={() => onAcceptFix(clause.id, 'flaggedClause')} className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-shadow">
                          <CheckCircle2 className="h-4 w-4 mr-1.5" /> Accept Fix
                        </Button>
                        <Button size="sm" variant="outline" disabled className="cursor-not-allowed shadow-sm">
                          <Edit3 className="h-4 w-4 mr-1.5" /> Edit Further
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onRevertFix(clause.id, 'flaggedClause')} className="text-muted-foreground hover:text-foreground transition-colors">
                          <RotateCcw className="h-4 w-4 mr-1.5" /> Revert
                        </Button>
                      </>
                    )}
                    {clause.isFixAccepted && (
                      <Button size="sm" variant="ghost" onClick={() => onRevertFix(clause.id, 'flaggedClause')} className="text-muted-foreground hover:text-foreground transition-colors">
                        <RotateCcw className="h-4 w-4 mr-1.5" /> Revert Accepted Fix
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : (
          <SectionCard title="II. Critical Clause Flags" icon={<AlertTriangle size={32} />} accentHighlight>
            <p className="text-muted-foreground italic">No critical clauses were flagged by the AI for this document.</p>
          </SectionCard>
        )}

        {(summary || (flaggedClauses && flaggedClauses.length > 0)) && <Separator className="my-10" />}

        {suggestions?.suggestions && suggestions.suggestions.length > 0 ? (
          <SectionCard title="III. Improvement Suggestions" icon={<Lightbulb size={32} />} accentHighlight>
            <ul className="space-y-4 list-disc list-outside ml-6 marker:text-accent marker:text-xl">
              {suggestions.suggestions.map((suggestion, index) => (
                <li key={index} className="text-foreground/90 leading-relaxed text-base">{suggestion}</li>
              ))}
            </ul>
          </SectionCard>
        ) : (
          <SectionCard title="III. Improvement Suggestions" icon={<Lightbulb size={32} />} accentHighlight>
            <p className="text-muted-foreground italic">No improvement suggestions were generated.</p>
          </SectionCard>
        )}

        {((summary) || (flaggedClauses && flaggedClauses.length > 0) || (suggestions?.suggestions && suggestions.suggestions.length > 0)) && <Separator className="my-10" />}

        {missingPoints && missingPoints.length > 0 ? (
          <SectionCard title="IV. Missing Points Analysis" icon={<HelpCircle size={32} />} accentHighlight>
            <ul className="space-y-6">
              {missingPoints.map((item) => (
                <li key={item.id} className={cn("p-5 border rounded-xl shadow-lg",
                  item.type === 'summary' ? "bg-muted/30 border-border" :
                    item.isFixAccepted ? "border-green-500 bg-green-50/50" : "border-accent/50 bg-accent-light"
                )}>
                  {item.type === 'missing' && (
                    <h4 className="font-semibold text-on-accent text-lg mb-2">Missing Information Identified:</h4>
                  )}
                  {item.type === 'recommendation' && (
                    <h4 className="font-semibold text-on-accent text-lg mb-2">Recommendation:</h4>
                  )}
                  {item.type === 'summary' && (
                    <h4 className="font-semibold text-foreground text-lg mb-2">Summary of Missing Points:</h4>
                  )}

                  <p className={cn("text-foreground/90 leading-relaxed whitespace-pre-wrap text-base", item.isFixProposed && !item.isFixAccepted && item.isFixable && "line-through opacity-60")}>
                    {item.isFixable ? item.text : item.currentText}
                  </p>

                  {item.isFixable && item.isFixProposed && !item.isFixAccepted && (
                    <div className="ml-0 mt-2.5 p-3.5 my-2.5 border border-yellow-500 bg-yellow-100/80 rounded-md shadow-sm">
                      <p className="font-semibold text-yellow-800 mb-1.5 text-md">Suggested New Clause:</p>
                      <p className="italic text-yellow-900/90 text-base whitespace-pre-wrap">"{item.currentText}"</p>
                      {item.justificationNote && <p className="text-xs text-yellow-700 mt-1.5">Justification: {item.justificationNote}</p>}
                    </div>
                  )}
                  {item.isFixable && item.isFixAccepted && (
                    <div className="ml-0 mt-2.5 p-3.5 my-2.5 border border-green-600 bg-green-100/90 rounded-md shadow-sm">
                      <p className="font-semibold text-green-800 mb-1.5 text-md">Accepted New Clause:</p>
                      <p className="italic text-green-900/90 text-base whitespace-pre-wrap">"{item.currentText}"</p>
                      {item.justificationNote && <p className="text-xs text-green-700 mt-1.5">Justification: {item.justificationNote}</p>}
                    </div>
                  )}

                  {item.isFixable && (
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {!item.isFixProposed && !item.isFixAccepted && (
                        <Button size="sm" variant="outline" onClick={() => onApplyAutoFix(item.id, 'missingPoint')} disabled={item.fixLoading} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500 shadow-md hover:shadow-lg transition-shadow">
                          {item.fixLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />} Suggest Clause
                        </Button>
                      )}
                      {item.isFixProposed && !item.isFixAccepted && (
                        <>
                          <Button size="sm" variant="default" onClick={() => onAcceptFix(item.id, 'missingPoint')} className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-shadow">
                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Accept Clause
                          </Button>
                          <Button size="sm" variant="outline" disabled className="cursor-not-allowed shadow-sm">
                            <Edit3 className="h-4 w-4 mr-1.5" /> Edit Further
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onRevertFix(item.id, 'missingPoint')} className="text-muted-foreground hover:text-foreground transition-colors">
                            <RotateCcw className="h-4 w-4 mr-1.5" /> Revert
                          </Button>
                        </>
                      )}
                      {item.isFixAccepted && (
                        <Button size="sm" variant="ghost" onClick={() => onRevertFix(item.id, 'missingPoint')} className="text-muted-foreground hover:text-foreground transition-colors">
                          <RotateCcw className="h-4 w-4 mr-1.5" /> Revert Accepted Clause
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : (
          <SectionCard title="IV. Missing Points Analysis" icon={<HelpCircle size={32} />} accentHighlight>
            <p className="text-muted-foreground italic">Missing points analysis was not performed or yielded no results.</p>
          </SectionCard>
        )}


        {hasContent && (
          <footer className="mt-16 pt-10 border-t-2 border-gray-300/70">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div>
                <p className="text-xs text-muted-foreground">
                  This report was generated by LegalForesight AI on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Predictive analysis for informational purposes only. This is not legal advice.
                  Always consult with a qualified legal professional for any legal matters.
                </p>
              </div>
              <div className="md:text-right">
                <div className="inline-block mt-4 md:mt-0">
                  <Scale size={28} className="mx-auto mb-2.5 text-gray-400" />
                  <div className="w-52 h-px bg-gray-400 mb-1.5 mx-auto md:mr-0"></div>
                  <p className="text-sm text-muted-foreground">Authorized Signature (LegalForesight AI Platform)</p>
                </div>
              </div>
            </div>
          </footer>
        )}
      </CardContent>
    </Card>
  );
}
