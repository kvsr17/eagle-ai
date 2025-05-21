
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
  context: z.string().optional().describe('Optional context about the document, e.g., "Land Sale Agreement", "Job Offer Letter", "Startup Shareholder Agreement".'),
});
export type PredictLegalOutcomesInput = z.infer<typeof PredictLegalOutcomesInputSchema>;

const PredictedOutcomeSchema = z.object({
  identifiedIssue: z.string().describe("The specific clause, lack of a clause, or wording identified in the document that poses a potential risk or issue. Example: 'Buyer has no cancellation clause.'"),
  potentialRealWorldOutcome: z.string().describe("The predicted real-world consequence or scenario that could arise from the identified issue. Be specific and practical. Example: 'If the seller fails to deliver, buyer may have no legal ground to demand refund unless going to court.'"),
  riskCategory: z.string().optional().describe("A category for the risk, e.g., 'Contractual Risk', 'Termination Risk', 'Equity Risk', 'IP Rights'.")
});

const LegalStrategyTipSchema = z.string().describe("An actionable legal strategy tip or recommendation to mitigate the identified risks or improve the document. Example: 'Add clause to retain 51% equity.'");

const PredictLegalOutcomesOutputSchema = z.object({
  overallRiskAssessment: z.string().describe("A high-level assessment of the document's risk profile (e.g., 'HIGH: Significant potential for disputes and loss of rights. Urgent review advised.', 'MEDIUM: Several clauses warrant review and potential negotiation to mitigate risks.', 'LOW: Document appears standard for its type, but minor clarifications could be beneficial.'). Include a brief summary statement like 'Power imbalance: Employer has complete control over termination' or 'You may lose IP rights by Clause 7' if highly relevant."),
  predictedOutcomes: z.array(PredictedOutcomeSchema).describe("An array of specific predicted outcomes based on the document analysis."),
  strategicRecommendations: z.array(LegalStrategyTipSchema).describe("An array of actionable legal strategy tips to address identified issues or improve the document's standing."),
});
export type PredictLegalOutcomesOutput = z.infer<typeof PredictLegalOutcomesOutputSchema>;

export async function predictLegalOutcomes(input: PredictLegalOutcomesInput): Promise<PredictLegalOutcomesOutput> {
  if (!input.documentText && !input.photoDataUri) {
    throw new Error("Either documentText or photoDataUri must be provided.");
  }
  return predictLegalOutcomesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictLegalOutcomesPrompt',
  input: {schema: PredictLegalOutcomesInputSchema},
  output: {schema: PredictLegalOutcomesOutputSchema},
  prompt: `You are LegalForesight AI, an expert system specializing in predictive legal analysis of documents. Your task is to analyze the provided document (text or image) and context, then predict potential real-world outcomes, assess overall risk, and offer actionable legal strategy tips.

Document Context: {{#if context}}{{context}}{{else}}General Document{{/if}}

{{#if documentText}}
Document Text:
{{{documentText}}}
{{/if}}
{{#if photoDataUri}}
Document Image:
{{media url=photoDataUri}}
{{/if}}

Based on the document, perform the following analysis:

1.  **Risk Identification & Outcome Prediction**:
    *   Scan the document's structure, tone, and specific clauses (or absence of crucial clauses).
    *   For each significant finding (e.g., missing clauses, ambiguous wording, unfavorable terms), identify the issue and predict a concrete potential real-world outcome.
    *   Provide examples of predictions like:
        *   "Identified Issue: Buyer has no cancellation clause. Potential Real-World Outcome: If the seller fails to deliver, buyer may have no legal ground to demand refund unless going to court."
        *   "Identified Issue: No severance clause found. Potential Real-World Outcome: If you’re fired, company is not obligated to pay compensation."
        *   "Identified Issue: Common shares issued while founders hold preferred shares with veto rights. Potential Real-World Outcome: You could lose control after 2 funding rounds."
    *   Categorize the risk if applicable (e.g., 'Contractual Risk', 'Termination Risk').

2.  **Strategic Recommendations**:
    *   For the identified risks and predicted outcomes, provide specific, actionable legal strategy tips.
    *   Provide examples of tips like:
        *   "Add a clause to retain at least 51% equity control through early funding rounds."
        *   "Seek a 'non-dilution' clause to protect your equity stake from being significantly reduced in future financing."
        *   "Negotiate for a clear severance package outlining compensation terms in case of termination without cause."

3.  **Overall Risk Assessment**:
    *   Provide a concise, high-level summary of the document's overall risk profile (e.g., HIGH, MEDIUM, LOW) and briefly state the primary concerns.
    *   Include impactful summary statements if applicable, such as "Overall Risk Assessment: HIGH. Power imbalance: Employer has complete control over termination clauses." or "Overall Risk Assessment: MEDIUM. Key concern: You may lose IP rights due to broad wording in Clause 7."

Ensure your response strictly adheres to the JSON schema for 'PredictLegalOutcomesOutput'.
Focus on practical, real-world implications and actionable advice.
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
