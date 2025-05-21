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
  documentText: z.string().describe('The text of the legal document to review.'),
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
  return flagCriticalClausesFlow(input);
}

const identifyCriticalClauses = ai.defineTool({
  name: 'identifyCriticalClauses',
  description: 'Identifies clauses within a legal document that are considered critical based on their potential legal ramifications, such as those related to liability, termination, or intellectual property.',
  inputSchema: z.object({
    documentText: z.string().describe('The text of the legal document to review.'),
    context: z.string().optional().describe('Contextual information about the document, such as the type of agreement or relevant industry.')
  }),
  outputSchema: z.array(
    z.object({
      clauseText: z.string().describe('The text of the critical clause.'),
      reason: z.string().describe('The reason why the clause is considered critical.'),
    })
  ),
  async fn(input) {
    // Placeholder implementation - replace with actual logic
    return [{
      clauseText: 'Example Clause',
      reason: 'This is an example of a critical clause.',
    }];
  },
});

const prompt = ai.definePrompt({
  name: 'flagCriticalClausesPrompt',
  input: {schema: FlagCriticalClausesInputSchema},
  output: {schema: FlagCriticalClausesOutputSchema},
  tools: [identifyCriticalClauses],
  prompt: `You are an AI legal assistant tasked with reviewing legal documents and flagging critical clauses.

  Analyze the following document and use the identifyCriticalClauses tool to identify and explain the critical clauses. 

  Document Text: {{{documentText}}}
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
