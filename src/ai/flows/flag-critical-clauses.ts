
// src/ai/flows/flag-critical-clauses.ts
'use server';
/**
 * @fileOverview Flags critical clauses within a legal document.
 *
 * - flagCriticalClauses - A function that flags critical clauses in a legal document.
 * - FlagCriticalClausesInput - The input type for the flagCriticalClauses function.
 * - FlagCriticalClausesOutput - The return type for the flagCriticalClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagCriticalClausesInputSchema = z.object({
  documentText: z.string().optional().describe('The text of the legal document to review.'),
  photoDataUri: z.string().optional().describe("A photo or scan of the document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This can be an image file or a PDF file represented as a data URI."),
  context: z.string().optional().describe('Contextual information about the document, such as the type of agreement or relevant industry.')
});
export type FlagCriticalClausesInput = z.infer<typeof FlagCriticalClausesInputSchema>;

const FlagCriticalClausesOutputSchema = z.object({
  criticalClauses: z.array(
    z.object({
      clauseText: z.string().describe('The text of the critical clause.'),
      reason: z.string().describe('The reason why the clause is considered critical.'),
    })
  ).describe('An array of critical clauses found in the document.'),
});
export type FlagCriticalClausesOutput = z.infer<typeof FlagCriticalClausesOutputSchema>;

export async function flagCriticalClauses(input: FlagCriticalClausesInput): Promise<FlagCriticalClausesOutput> {
  if (!input.documentText && !input.photoDataUri) {
    throw new Error("Either documentText or photoDataUri must be provided.");
  }
  return flagCriticalClausesFlow(input);
}

const identifyCriticalClausesTool = ai.defineTool(
  {
    name: 'identifyCriticalClauses',
    description: 'Identifies clauses within a legal document (text or image) that are considered critical based on their potential legal ramifications, such as those related to liability, termination, or intellectual property.',
    inputSchema: z.object({
      documentText: z.string().optional().describe('The text of the legal document to review.'),
      photoDataUri: z.string().optional().describe("A photo or scan of the document, as a data URI."),
      context: z.string().optional().describe('Contextual information about the document, such as the type of agreement or relevant industry.')
    }),
    outputSchema: z.array(
      z.object({
        clauseText: z.string().describe('The text of the critical clause.'),
        reason: z.string().describe('The reason why the clause is considered critical.'),
      })
    ),
    async fn(input) {
      // This is a placeholder. In a real implementation, this tool would analyze
      // the documentText and/or photoDataUri to identify critical clauses.
      // For now, it returns a generic example if no specific text/image analysis is done here.
      console.log('identifyCriticalClausesTool invoked with input:', input);
      if (input.documentText?.includes("liability") || input.context?.includes("liability")) {
         return [{
          clauseText: 'A clause related to liability was identified (example).',
          reason: 'Clauses limiting or defining liability are generally critical.',
        }];
      }
      return [{
        clauseText: 'Example Critical Clause (from tool)',
        reason: 'This is an example critical clause identified by the tool based on the provided document data.',
      }];
    },
  }
);


const prompt = ai.definePrompt({
  name: 'flagCriticalClausesPrompt',
  input: {schema: FlagCriticalClausesInputSchema},
  output: {schema: FlagCriticalClausesOutputSchema},
  tools: [identifyCriticalClausesTool],
  prompt: `You are an AI legal assistant tasked with reviewing legal documents and flagging critical clauses.

  Analyze the following document (provided as text and/or image) and use the identifyCriticalClausesTool to identify and explain the critical clauses.
  {{#if documentText}}
  Document Text: {{{documentText}}}
  {{/if}}
  {{#if photoDataUri}}
  Document Image: {{media url=photoDataUri}}
  {{/if}}
  Context: {{{context}}}

  Return the critical clauses identified by the tool.
  `,
});

const flagCriticalClausesFlow = ai.defineFlow(
  {
    name: 'flagCriticalClausesFlow',
    inputSchema: FlagCriticalClausesInputSchema,
    outputSchema: FlagCriticalClausesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
