
'use server';
/**
 * @fileOverview Predicts potential real-world outcomes and offers legal strategy tips based on document analysis.
 *
 * - predictLegalOutcomes - Analyzes a document to predict outcomes and suggest strategies.
 * - PredictLegalOutcomesInput - Input type for the prediction flow.
 * - PredictLegalOutcomesOutput - Output type for the prediction flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictLegalOutcomesInputSchema = z.object({
  documentText: z.string().optional().describe('The text content of the legal document.'),
  photoDataUri: z.string().optional().describe("A photo or scan of the document, as a data URI (e.g., 'data:image/png;base64,...' or 'data:application/pdf;base64,...')."),
  context: z.string().optional().describe('Crucial user-provided context about the document, e.g., "Land Sale Agreement where I am the buyer", "Job Offer Letter for a startup VP role", "Startup Shareholder Agreement for a minority investor". This context is vital for accurate predictions.'),
});
export type PredictLegalOutcomesInput = z.infer<typeof PredictLegalOutcomesInputSchema>;

const PredictedOutcomeSchema = z.object({
  identifiedIssue: z.string().describe("The specific clause, lack of a clause, or wording identified in the document that poses a potential risk or issue. Example: 'Buyer has no explicit cancellation clause for seller default.'"),
  potentialRealWorldOutcome: z.string().describe("The predicted real-world consequence or scenario that could arise from the identified issue, including *why* this outcome is predicted based on the issue. Be specific and practical. Example: 'If the seller fails to deliver on agreed terms, the buyer may have no straightforward legal ground to demand a refund without resorting to lengthy court proceedings, because the contract lacks a clear seller default and remedy clause.'"),
  riskCategory: z.string().optional().describe("A category for the risk, e.g., 'Contractual Risk', 'Termination Risk', 'Equity Risk', 'IP Rights', 'Dispute Resolution Risk', 'Financial Exposure'.")
});

const LegalStrategyTipSchema = z.string().describe("An actionable legal strategy tip or recommendation to mitigate the identified risks or improve the document. Explain *how* this tip helps. Example: 'Negotiate to add a clause specifying seller's obligations and buyer's right to terminate and receive a full refund within 30 days if seller defaults on these obligations. This provides a clear contractual remedy.'");

const PredictLegalOutcomesOutputSchema = z.object({
  overallRiskAssessment: z.string().describe("A high-level assessment of the document's risk profile (e.g., 'HIGH: Significant potential for disputes and loss of rights. Urgent review advised.', 'MEDIUM: Several clauses warrant review and potential negotiation to mitigate risks.', 'LOW: Document appears standard for its type, but minor clarifications could be beneficial.'). Include a brief summary statement like 'Power imbalance: Employer has complete control over termination' or 'You may lose IP rights by Clause 7' if highly relevant. This assessment must consider the provided document context."),
  predictedOutcomes: z.array(PredictedOutcomeSchema).describe("An array of specific predicted outcomes based on the document analysis and context."),
  strategicRecommendations: z.array(LegalStrategyTipSchema).describe("An array of actionable legal strategy tips to address identified issues or improve the document's standing, relevant to the context."),
});
export type PredictLegalOutcomesOutput = z.infer<typeof PredictLegalOutcomesOutputSchema>;

export async function predictLegalOutcomes(input: PredictLegalOutcomesInput): Promise<PredictLegalOutcomesOutput> {
  if (!input.documentText && !input.photoDataUri) {
    throw new Error("Either documentText or photoDataUri must be provided.");
  }
  if (!input.context) {
    // Consider making context mandatory or providing a strong warning if it's missing,
    // as predictions are highly context-dependent. For now, we let it pass.
    console.warn("PredictLegalOutcomes called without specific context. Predictions may be generic.");
  }
  return predictLegalOutcomesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictLegalOutcomesPrompt',
  input: {schema: PredictLegalOutcomesInputSchema},
  output: {schema: PredictLegalOutcomesOutputSchema},
  prompt: `You are LegalForesight AI, an expert system specializing in predictive legal analysis of documents.
Your task is to analyze the provided document (text or image) along with the crucial user-provided document context.
Then, predict potential real-world outcomes, assess overall risk, and offer actionable legal strategy tips.

Document Context: {{#if context}}{{context}}{{else}}No specific context provided; analyze as a general document.{{/if}}

{{#if documentText}}
Document Text:
{{{documentText}}}
{{/if}}
{{#if photoDataUri}}
Document Image:
{{media url=photoDataUri}}
{{/if}}

Based on the document and the specific context, perform the following analysis:

1.  **Risk Identification & Outcome Prediction**:
    *   Scan the document's structure, tone, and specific clauses (or absence of crucial clauses) in light of the provided context.
    *   For each significant finding (e.g., missing clauses, ambiguous wording, unfavorable terms given the context), identify the issue.
    *   Predict a concrete potential real-world outcome. Crucially, explain *why* this outcome is predicted based on the identified issue and the document's context.
    *   Categorize the risk if applicable (e.g., 'Contractual Risk', 'Termination Risk', 'Financial Exposure').
    *   Example:
        *   Identified Issue: "Job offer for a VP role lacks a 'Change of Control' clause." (Context: "Job offer for VP at a startup likely to be acquired")
        *   Potential Real-World Outcome: "If the startup is acquired, your role might be eliminated or significantly changed without any guaranteed severance or stock acceleration, because there's no Change of Control clause to protect your interests in such an event."
        *   Risk Category: "Exit Risk" or "Compensation Risk"

2.  **Strategic Recommendations**:
    *   For the identified risks and predicted outcomes, provide specific, actionable legal strategy tips. Explain *how* each tip helps to mitigate the risk or improve the document from the perspective of the party implied by the context.
    *   Example: "Negotiate for a 'Change of Control' clause that includes double-trigger acceleration for your stock options and a severance package if your role is terminated without cause post-acquisition. This protects your financial interests and provides security if the company is sold."

3.  **Overall Risk Assessment**:
    *   Provide a concise, high-level summary of the document's overall risk profile (e.g., HIGH, MEDIUM, LOW) directly reflecting the provided context.
    *   Briefly state the primary concerns based on the context. Example (Context: "Client reviewing a supplier contract"): "Overall Risk Assessment: MEDIUM for the Client. Primary concerns involve overly broad indemnification clauses and unclear SLAs which could lead to financial and operational risks for the Client."

Ensure your response strictly adheres to the JSON schema for 'PredictLegalOutcomesOutput'.
Focus on practical, real-world implications and actionable advice relevant to the provided document context.
`,
});

const predictLegalOutcomesFlow = ai.defineFlow(
  {
    name: 'predictLegalOutcomesFlow',
    inputSchema: PredictLegalOutcomesInputSchema,
    outputSchema: PredictLegalOutcomesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
