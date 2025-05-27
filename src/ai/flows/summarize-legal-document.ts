
'use server';

/**
 * @fileOverview Summarizes a legal document and extracts its key structured points.
 *
 * - summarizeLegalDocument - A function that summarizes a legal document.
 * - SummarizeLegalDocumentInput - The input type for the summarizeLegalDocument function.
 * - SummarizeLegalDocumentOutput - The return type for the summarizeLegalDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLegalDocumentInputSchema = z.object({
  documentText: z.string().optional().describe('The text content of the legal document.'),
  photoDataUri: z.string().optional().describe("A photo or scan of the document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This can be an image file or a PDF file represented as a data URI."),
  context: z.string().optional().describe('User-provided context about the document (e.g., "Employment Agreement", "NDA for startup"). This helps tailor the summary.'),
});
export type SummarizeLegalDocumentInput = z.infer<typeof SummarizeLegalDocumentInputSchema>;

const SummarizeLegalDocumentOutputSchema = z.object({
  overallSummary: z.string().describe('A concise general summary of the document, highlighting its main purpose and key implications. No more than 2-3 paragraphs long.'),
  involvedParties: z.array(z.string()).optional().describe('List of key parties involved in the document (e.g., "Buyer: John Doe", "Seller: Acme Corp"). If not clearly identifiable, state "Not specified".'),
  keyObligations: z.array(z.string()).optional().describe('List of main obligations, responsibilities, or commitments for the primary party or parties, phrased concisely. If not clear, state "Not specified".'),
  financialTerms: z.array(z.string()).optional().describe('Summary of important financial terms, amounts, or payment schedules mentioned (e.g., "Total Price: $10,000", "Monthly Rent: $500 due on 1st"). If none, state "Not specified".'),
  keyDates: z.array(z.string()).optional().describe('Important dates, deadlines, durations, or terms mentioned (e.g., "Effective Date: 2024-01-01", "Term: 12 months", "Notice Period: 30 days"). If none, state "Not specified".'),
});
export type SummarizeLegalDocumentOutput = z.infer<typeof SummarizeLegalDocumentOutputSchema>;

export async function summarizeLegalDocument(input: SummarizeLegalDocumentInput): Promise<SummarizeLegalDocumentOutput> {
  if (!input.documentText && !input.photoDataUri) {
    throw new Error("Either documentText or photoDataUri must be provided.");
  }
  return summarizeLegalDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLegalDocumentPrompt',
  input: {schema: SummarizeLegalDocumentInputSchema},
  output: {schema: SummarizeLegalDocumentOutputSchema},
  prompt: `You are an AI legal assistant. Review the following legal document (provided as text and/or an image).
{{#if context}}
The document should be understood within the following context: {{{context}}}
{{else}}
The document is a general legal document.
{{/if}}

{{#if documentText}}
Document Text:
{{{documentText}}}
{{/if}}
{{#if photoDataUri}}
Document Image:
{{media url=photoDataUri}}
{{/if}}

Based on the document and its context, extract the following information:
1.  **Overall Summary**: Provide an insightful executive summary of the document's purpose, key terms, and main implications. This summary should be concise, no more than 2-3 short paragraphs long.
2.  **Involved Parties**: List of key parties involved (e.g., "Buyer: John Doe", "Seller: Acme Corp"). If not clearly identifiable, state "Not specified".
3.  **Key Obligations**: List of main obligations, responsibilities, or commitments for the primary party or parties, phrased concisely. If not clear, state "Not specified".
4.  **Financial Terms**: Summary of important financial terms, amounts, or payment schedules mentioned (e.g., "Total Price: $10,000", "Monthly Rent: $500 due on 1st"). If none, state "Not specified".
5.  **Key Dates**: Important dates, deadlines, durations, or terms mentioned (e.g., "Effective Date: 2024-01-01", "Term: 12 months", "Notice Period: 30 days"). If none, state "Not specified".

Ensure your output strictly adheres to the JSON schema for 'SummarizeLegalDocumentOutput'.
`,
});

const summarizeLegalDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeLegalDocumentFlow',
    inputSchema: SummarizeLegalDocumentInputSchema,
    outputSchema: SummarizeLegalDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
