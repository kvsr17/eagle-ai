
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
  documentType: z // This is used as context in the prompt, effectively the same as 'context'
    .string()
    .optional()
    .describe('Type of the document or specific context, e.g., "Land Sale Agreement for property in California", "Employment contract for a startup CTO".'),
  context: z.string().optional().describe('Additional user-provided context about the document or its purpose. This will be prioritized if both context and documentType are provided.'),
});

export type IdentifyMissingPointsInput = z.infer<
  typeof IdentifyMissingPointsInputSchema
>;

const IdentifyMissingPointsOutputSchema = z.object({
  missingPoints: z
    .array(z.string())
    .describe('A list of missing information, clauses, or critical points identified in the document, considering its context.'),
  recommendations: z
    .array(z.string())
    .describe('Recommendations for including the missing points or addressing the gaps in the document.'),
  summary: z.string().describe('A concise summary of the most important missing points and their potential impact.'),
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
  prompt: `You are an expert legal document reviewer. Your task is to analyze the provided document to identify any missing information, clauses, or critical points that should typically be present, considering the document's nature and context.

Document Context to Consider: {{#if context}}{{context}}{{else if documentType}}{{documentType}}{{else}}General Legal Document{{/if}}

{{#if documentText}}
Document Text:
{{{documentText}}}
{{/if}}
{{#if photoDataUri}}
Document Image:
{{media url=photoDataUri}}
{{/if}}

Based on the document and its context:
1.  Identify critical missing points or clauses (e.g., missing governing law, dispute resolution, specific termination conditions relevant to the context).
2.  Provide specific recommendations for including these missing elements to ensure the document is comprehensive and legally sound.
3.  Offer a concise summary of the most important missing points and their potential impact if not addressed.

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
    // Prefer 'context' if available, otherwise use 'documentType' for context in the prompt.
    const effectiveContext = input.context || input.documentType;
    const promptPayload = { ...input, context: effectiveContext };

    const {output} = await identifyMissingPointsPrompt(promptPayload);
    return output!;
  }
);
