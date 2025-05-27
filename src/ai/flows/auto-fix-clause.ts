
'use server';
/**
 * @fileOverview AI-powered clause rewriting and generation for legal documents.
 *
 * - autoFixClause - A function that rewrites a problematic clause or generates a missing one.
 * - AutoFixClauseInput - The input type for the autoFixClause function.
 * - AutoFixClauseOutput - The return type for the autoFixClauseOutput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for the FLOW's public input
const AutoFixClauseInputSchema = z.object({
  originalClauseText: z.string().optional().describe('The original text of the clause to be fixed. Omit if generating a new clause for a missing element.'),
  problemDescription: z.string().describe('A description of why the original clause is problematic, or a description of the missing clause/element to be generated (e.g., "Missing confidentiality clause", "Vague termination conditions").'),
  documentContext: z.string().optional().describe('Crucial context about the overall document and the user\'s perspective (e.g., "Employment Agreement, fixing for employee", "NDA for startup, mutual"). This helps tailor the fix appropriately.'),
  fixType: z.enum(["rewrite", "generate"]).default("rewrite").describe("Specify 'rewrite' if an 'originalClauseText' is provided. Specify 'generate' if suggesting a clause for a 'problemDescription' that indicates a missing element.")
});
export type AutoFixClauseInput = z.infer<typeof AutoFixClauseInputSchema>;

// Schema for the PROMPT's internal input (Handlebars context)
const AutoFixClausePromptInputSchema = z.object({
  originalClauseText: z.string().optional(),
  problemDescription: z.string(),
  documentContext: z.string().optional(),
  fixType: z.enum(["rewrite", "generate"]),
  isRewrite: z.boolean(), // Flag for Handlebars conditional
});

const AutoFixClauseOutputSchema = z.object({
  fixedClauseText: z.string().describe('The AI-generated revised or new clause, ready for contract use.'),
  justificationNote: z.string().optional().describe("An explanation of why the fix is an improvement, how it addresses the problem, and how it aligns with the provided document context and implied user perspective."),
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
    console.warn("Original clause text provided but fixType is 'generate'. The original text will be primarily used as context if relevant to the problem description of the missing element, but the main task is generation.");
  }
  if (!input.documentContext) {
    console.warn("AutoFixClause called without specific document context. The fix may be generic.");
  }

  return autoFixClauseFlow(input);
}

const autoFixClausePrompt = ai.definePrompt({
  name: 'autoFixClausePrompt',
  input: {schema: AutoFixClausePromptInputSchema},
  output: {schema: AutoFixClauseOutputSchema},
  prompt: `You are a professional contract lawyer AI. Your task is to either rewrite a problematic clause or generate a new clause for a legal document, based on the user's request and the provided document context.
Ensure the output is legally sound, fair to all parties involved (or to the primary party if the context implies a one-sided review), easy to understand, and minimizes ambiguity or legal risk.
The output for 'fixedClauseText' must be the complete, contract-ready text of the revised or newly generated clause.
Provide a 'justificationNote' explaining the key improvements, how the new clause addresses the stated problem, and specifically how it aligns with the document context (e.g., if context is "for employee", explain how the fix benefits the employee).

Document Context: {{#if documentContext}}{{documentContext}}{{else}}General Legal Document (no specific context provided, aim for balanced fairness).{{/if}}

{{#if isRewrite}}
Instruction: Rewrite the following problematic clause, considering the document context.
Original Problematic Clause:
\`\`\`
{{{originalClauseText}}}
\`\`\`
Reason it's Problematic / What to Fix: {{{problemDescription}}}

Your Suggested Revision (fixedClauseText):
[Provide the complete revised clause here, tailored to the document context]

Your Justification for the Revision (justificationNote):
[Explain the improvements made and how they align with the document context and fairness principles]

{{else}} {{! This implies fixType is "generate" }}
Instruction: Generate a new clause to address the following missing element or problem, considering the document context.
Description of Missing Element / Problem to Address: {{{problemDescription}}}
{{#if originalClauseText}}
(For context, a related or problematic clause text was also provided, which might be relevant to how you generate the new clause: "{{originalClauseText}}")
{{/if}}

Your Suggested New Clause (fixedClauseText):
[Provide the complete new clause here, tailored to the document context]

Your Justification for the New Clause (justificationNote):
[Explain how this clause addresses the missing element/problem and aligns with the document context]

{{/if}}
`,
});

const autoFixClauseFlow = ai.defineFlow(
  {
    name: 'autoFixClauseFlow',
    inputSchema: AutoFixClauseInputSchema,
    outputSchema: AutoFixClauseOutputSchema,
  },
  async (input: AutoFixClauseInput): Promise<AutoFixClauseOutput> => {
    const promptInputPayload: z.infer<typeof AutoFixClausePromptInputSchema> = {
      originalClauseText: input.originalClauseText,
      problemDescription: input.problemDescription,
      documentContext: input.documentContext,
      fixType: input.fixType,
      isRewrite: input.fixType === "rewrite",
    };

    const {output} = await autoFixClausePrompt(promptInputPayload);
    if (!output || !output.fixedClauseText) {
        throw new Error("AI failed to generate a fixed clause.");
    }
    return output;
  }
);
