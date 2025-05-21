
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
    .optional()
    .describe('The text content of the document to be analyzed.'),
  photoDataUri: z.string().optional().describe("A photo or scan of the document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This can be an image file or a PDF file represented as a data URI."),
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
  if (!input.documentText && !input.photoDataUri) {
    throw new Error("Either documentText or photoDataUri must be provided.");
  }
  return identifyMissingPointsFlow(input);
}

const identifyMissingPointsPrompt = ai.definePrompt({
  name: 'identifyMissingPointsPrompt',
  input: {schema: IdentifyMissingPointsInputSchema},
  output: {schema: IdentifyMissingPointsOutputSchema},
  prompt: `You are an expert legal document reviewer.

  Analyze the following document (provided as text and/or image) to identify any missing information or points. Provide specific recommendations for including these missing points to ensure the document is comprehensive and legally sound.

  Document Type: {{documentType}}
  Context: {{context}}
  {{#if documentText}}
  Document Text:
  {{{documentText}}}
  {{/if}}
  {{#if photoDataUri}}
  Document Image:
  {{media url=photoDataUri}}
  {{/if}}

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
