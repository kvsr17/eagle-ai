import {
  FileText,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Search,
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import type { SummarizeLegalDocumentOutput } from '@/ai/flows/summarize-legal-document';
import type { FlagCriticalClausesOutput } from '@/ai/flows/flag-critical-clauses';
import type { SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import type { IdentifyMissingPointsOutput } from '@/ai/flows/identify-missing-points';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="space-y-8 mt-8">
      {fileName && (
        <div className="p-4 bg-card border rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
            <FileText size={28} />
            Analysis for: <span className="font-mono">{fileName}</span>
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summary?.summary && (
          <SectionCard title="Document Summary" icon={<Search size={24} />}>
            <p className="whitespace-pre-wrap leading-relaxed">{summary.summary}</p>
          </SectionCard>
        )}

        {flaggedClauses?.criticalClauses && flaggedClauses.criticalClauses.length > 0 && (
          <SectionCard title="Critical Clause Flags" icon={<AlertTriangle size={24} />} accentHighlight>
            <ul className="space-y-3">
              {flaggedClauses.criticalClauses.map((clause, index) => (
                <li key={index} className="p-3 border border-accent/50 rounded-md bg-accent/10">
                  <p className="font-semibold text-accent-foreground/90">{clause.clauseText}</p>
                  <p className="text-xs text-muted-foreground mt-1">{clause.reason}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
          <SectionCard title="Improvement Suggestions" icon={<Lightbulb size={24} />} accentHighlight>
            <ul className="space-y-2 list-disc list-inside">
              {suggestions.suggestions.map((suggestion, index) => (
                <li key={index} className="text-accent-foreground/90">{suggestion}</li>
              ))}
            </ul>
          </SectionCard>
        )}

        {missingPoints && (missingPoints.missingPoints.length > 0 || missingPoints.recommendations.length > 0) && (
          <SectionCard title="Missing Points Analysis" icon={<HelpCircle size={24} />} accentHighlight>
            {missingPoints.missingPoints.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-accent-foreground/90 mb-1">Missing Information:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  {missingPoints.missingPoints.map((point, index) => (
                    <li key={`missing-${index}`}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            {missingPoints.recommendations.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-accent-foreground/90 mb-1">Recommendations:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  {missingPoints.recommendations.map((rec, index) => (
                    <li key={`rec-${index}`}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {missingPoints.summary && (
               <div>
                <h4 className="font-semibold text-accent-foreground/90 mb-1">Summary of Missing Points:</h4>
                <p className="whitespace-pre-wrap leading-relaxed">{missingPoints.summary}</p>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
