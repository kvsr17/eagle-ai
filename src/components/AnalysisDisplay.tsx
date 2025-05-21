import {
  FileText,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Search,
  Scale,
  ChevronRight,
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import type { SummarizeLegalDocumentOutput } from '@/ai/flows/summarize-legal-document';
import type { FlagCriticalClausesOutput } from '@/ai/flows/flag-critical-clauses';
import type { SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import type { IdentifyMissingPointsOutput } from '@/ai/flows/identify-missing-points';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

interface AnalysisDisplayProps {
  fileName: string | null;
  summary: SummarizeLegalDocumentOutput | null;
  flaggedClauses: FlagCriticalClausesOutput | null;
  suggestions: SuggestImprovementsOutput | null;
  missingPoints: IdentifyMissingPointsOutput | null;
}

export function AnalysisDisplay({
  fileName,
  summary,
  flaggedClauses,
  suggestions,
  missingPoints,
}: AnalysisDisplayProps) {
  if (!fileName && !summary && !flaggedClauses && !suggestions && !missingPoints) {
    return null;
  }
  
  const hasContent = summary?.summary || 
                     (flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0) ||
                     (suggestions?.suggestions && suggestions.suggestions.length > 0) ||
                     (missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0 || missingPoints.summary));

  if (!fileName && !hasContent) {
    return null;
  }


  return (
    <Card className="mt-6 shadow-lg border-primary/20"> {/* Removed printable-area class */}
      <CardContent className="p-6 md:p-8">
        <header className="mb-8 pb-4 border-b-2 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale size={40} className="text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-primary">Legal Document Analysis Report</h1>
                <p className="text-muted-foreground">Prepared by LegalEagle AI</p>
              </div>
            </div>
            {fileName && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Document:</p>
                <p className="text-lg font-semibold text-primary truncate max-w-xs" title={fileName}>{fileName}</p>
              </div>
            )}
          </div>
        </header>

        <div className="space-y-10">
          {summary?.summary && (
            <SectionCard title="I. Document Summary" icon={<Search size={28} />}>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{summary.summary}</p>
            </SectionCard>
          )}

          {flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0 && (
            <>
              <Separator className="my-6" />
              <SectionCard title="II. Critical Clause Flags" icon={<AlertTriangle size={28} />} accentHighlight>
                <ul className="space-y-4">
                  {flaggedClauses.criticalClauses.map((clause, index) => (
                    <li key={index} className="p-4 border border-accent/30 rounded-lg bg-accent-light shadow-sm">
                      <h4 className="font-semibold text-on-accent mb-1 flex items-center">
                        <ChevronRight size={20} className="mr-1 text-accent" /> Clause Identified:
                      </h4>
                      <p className="italic text-foreground/80 mb-1 ml-2">"{clause.clauseText}"</p>
                       <h5 className="font-semibold text-on-accent mt-2 mb-1 flex items-center">
                        <AlertTriangle size={18} className="mr-1 text-accent" /> Reason for Flag:
                      </h5>
                      <p className="text-sm text-foreground/70 ml-2">{clause.reason}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </>
          )}

          {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
             <>
              <Separator className="my-6" />
              <SectionCard title="III. Improvement Suggestions" icon={<Lightbulb size={28} />} accentHighlight>
                <ul className="space-y-3 list-disc list-inside pl-2">
                  {suggestions.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-foreground/90 marker:text-accent">{suggestion}</li>
                  ))}
                </ul>
              </SectionCard>
            </>
          )}

          {missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0 || missingPoints.summary) && (
            <>
              <Separator className="my-6" />
              <SectionCard title="IV. Missing Points Analysis" icon={<HelpCircle size={28} />} accentHighlight>
                {missingPoints.missingPoints.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-on-accent mb-2">Missing Information Identified:</h4>
                    <ul className="space-y-2 list-disc list-inside pl-2">
                      {missingPoints.missingPoints.map((point, index) => (
                        <li key={`missing-${index}`} className="text-foreground/90 marker:text-accent">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {missingPoints.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-on-accent mb-2">Recommendations:</h4>
                    <ul className="space-y-2 list-disc list-inside pl-2">
                      {missingPoints.recommendations.map((rec, index) => (
                        <li key={`rec-${index}`} className="text-foreground/90 marker:text-accent">{rec}</li>
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

          {hasContent && (
            <footer className="mt-12 pt-8 border-t-2 border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <p className="text-xs text-muted-foreground">
                    This report was generated by LegalEagle AI on {new Date().toLocaleDateString()}.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    For informational purposes only. This is not legal advice.
                    Always consult with a qualified legal professional for any legal matters.
                  </p>
                </div>
                <div className="md:text-right">
                  <div className="inline-block mt-4 md:mt-0">
                    <div className="w-48 h-px bg-gray-400 mb-1"></div>
                    <p className="text-sm text-muted-foreground">Authorized Signature (LegalEagle AI Platform)</p>
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
