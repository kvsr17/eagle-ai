// 'use server';

/**
 * @fileOverview Identifies missing information or points in a document and offers relevant recommendations.
 *
 * - identifyMissingPoints - A function that handles the identification of missing points in a document.
 * - IdentifyMissingPointsInput - The input type for the identifyMissingPoints function.
 * - IdentifyMissingPointsOutput - The return type for the identifyMissingPoints function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyMissingPointsInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the document to be analyzed.'),
  documentType: z
    .string()
    .optional()
    .describe('Optional: Type of the document, e.g., land document, agreement.'),
  context: z.string().optional().describe('Optional: Additional context or information about the document.'),
});

export type IdentifyMissingPointsInput = z.infer<
  typeof IdentifyMissingPointsInputSchema
>;

const IdentifyMissingPointsOutputSchema = z.object({
  missingPoints: z
    .array(z.string())
    .describe('A list of missing information or points identified in the document.'),
  recommendations: z
    .array(z.string())
    .describe('Recommendations for including the missing points in the document.'),
  summary: z.string().describe('A summary of the missing points and their importance.'),
});

export type IdentifyMissingPointsOutput = z.infer<
  typeof IdentifyMissingPointsOutputSchema
>;

export async function identifyMissingPoints(
  input: IdentifyMissingPointsInput
): Promise<IdentifyMissingPointsOutput> {
  return identifyMissingPointsFlow(input);
}

const identifyMissingPointsPrompt = ai.definePrompt({
  name: 'identifyMissingPointsPrompt',
  input: {schema: IdentifyMissingPointsInputSchema},
  output: {schema: IdentifyMissingPointsOutputSchema},
  prompt: `You are an expert legal document reviewer.

  Analyze the following document to identify any missing information or points. Provide specific recommendations for including these missing points to ensure the document is comprehensive and legally sound.

  Document Type: {{documentType}}
  Context: {{context}}
  Document Text: {{documentText}}

  Missing Points: 
  Recommendations:
  Summary: `,
});

const identifyMissingPointsFlow = ai.defineFlow(
  {
    name: 'identifyMissingPointsFlow',
    inputSchema: IdentifyMissingPointsInputSchema,
    outputSchema: IdentifyMissingPointsOutputSchema,
  },
  async input => {
    const {output} = await identifyMissingPointsPrompt(input);
    return output!;
  }
);
