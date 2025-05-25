
'use server';
/**
 * @fileOverview AI-powered clause rewriting and generation for legal documents.
 *
 * - autoFixClause - A function that rewrites a problematic clause or generates a missing one.
 * - AutoFixClauseInput - The input type for the autoFixClause function.
 * - AutoFixClauseOutput - The return type for the autoFixClause function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoFixClauseInputSchema = z.object({
  originalClauseText: z.string().optional().describe('The original text of the clause to be fixed. Omit if generating a new clause for a missing element.'),
  problemDescription: z.string().describe('A description of why the original clause is problematic, or a description of the missing clause/element to be generated (e.g., "Missing confidentiality clause", "Vague termination conditions").'),
  documentContext: z.string().optional().describe('Context about the overall document, e.g., "Employment Agreement", "NDA for startup". This helps tailor the fix.'),
  fixType: z.enum(["rewrite", "generate"]).default("rewrite").describe("Specify 'rewrite' if an 'originalClauseText' is provided. Specify 'generate' if suggesting a clause for a 'problemDescription' that indicates a missing element.")
});
export type AutoFixClauseInput = z.infer<typeof AutoFixClauseInputSchema>;

const AutoFixClauseOutputSchema = z.object({
  fixedClauseText: z.string().describe('The AI-generated revised or new clause, ready for contract use.'),
  justificationNote: z.string().optional().describe("An explanation of why the fix is an improvement or how it addresses the problem."),
});
export type AutoFixClauseOutput = z.infer<typeof AutoFixClauseOutputSchema>;

export async function autoFixClause(input: AutoFixClauseInput): Promise<AutoFixClauseOutput> {
  if (!input.problemDescription) {
    throw new Error("Problem description must be provided.");
  }
  if (input.fixType === "rewrite" && !input.originalClauseText) {
    throw new Error("Original clause text must be provided when fixType is 'rewrite'.")
  }
  if (input.fixType === "generate" && input.originalClauseText) {
    // This is a gentle warning, the prompt logic will handle ignoring originalClauseText if fixType is 'generate'
    console.warn("Original clause text provided but fixType is 'generate'. The original text will be primarily used as context if relevant to the problem description of the missing element, but the main task is generation.");
  }

  return autoFixClauseFlow(input);
}

const autoFixClausePrompt = ai.definePrompt({
  name: 'autoFixClausePrompt',
  input: {schema: AutoFixClauseInputSchema},
  output: {schema: AutoFixClauseOutputSchema},
  prompt: `You are a professional contract lawyer AI. Your task is to either rewrite a problematic clause or generate a new clause for a legal document, based on the user's request.
Ensure the output is legally sound, fair to all parties involved (or to the primary party if context implies a one-sided review), easy to understand, and minimizes ambiguity or legal risk.
The output for 'fixedClauseText' must be the complete, contract-ready text of the revised or newly generated clause.
Optionally, provide a brief 'justificationNote' explaining the key improvements or how the new clause addresses the stated problem.

Document Context: {{#if documentContext}}{{documentContext}}{{else}}General Legal Document{{/if}}

{{#if (eq fixType "rewrite")}}
Instruction: Rewrite the following problematic clause.
Original Problematic Clause:
\`\`\`
{{{originalClauseText}}}
\`\`\`
Reason it's Problematic / What to Fix: {{{problemDescription}}}

Your Suggested Revision (fixedClauseText):
[Provide the complete revised clause here]

Your Justification for the Revision (justificationNote, optional):
[Explain the improvements made]

{{else if (eq fixType "generate")}}
Instruction: Generate a new clause to address the following missing element or problem.
Description of Missing Element / Problem to Address: {{{problemDescription}}}
{{#if originalClauseText}}
(For context, an related or problematic clause text was also provided, which might be relevant to how you generate the new clause: "{{originalClauseText}}")
{{/if}}

Your Suggested New Clause (fixedClauseText):
[Provide the complete new clause here]

Your Justification for the New Clause (justificationNote, optional):
[Explain how this clause addresses the missing element/problem]

{{/if}}
`,
});

const autoFixClauseFlow = ai.defineFlow(
  {
    name: 'autoFixClauseFlow',
    inputSchema: AutoFixClauseInputSchema,
    outputSchema: AutoFixClauseOutputSchema,
  },
  async (input) => {
    const {output} = await autoFixClausePrompt(input);
    // Ensure output is not null and fixedClauseText is present
    if (!output || !output.fixedClauseText) {
        throw new Error("AI failed to generate a fixed clause.");
    }
    return output;
  }
);
