
// src/ai/flows/flag-critical-clauses.ts
'use server';
/**
 * @fileOverview Flags critical clauses within a legal document and assigns risk tags.
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

const CriticalClauseSchema = z.object({
  clauseText: z.string().describe('The exact text of the critical clause identified.'),
  reason: z.string().describe('The reason why the clause is considered critical and its potential implications.'),
  riskTags: z.array(z.enum(["Control Risk", "Financial Risk", "Exit Risk", "Compliance Risk", "Operational Risk", "Reputational Risk", "Legal Ambiguity", "Other"]))
            .optional()
            .describe('Specific risk categories associated with this clause (e.g., Control Risk, Financial Risk). Select all that apply or "Other" if none fit well. Examples: Non-compete could be "Operational Risk". Liquidation preference could be "Financial Risk" or "Exit Risk".')
});

const FlagCriticalClausesOutputSchema = z.object({
  criticalClauses: z.array(CriticalClauseSchema).describe('An array of critical clauses found in the document, including their text, reason for flagging, and associated risk tags.'),
});
export type FlagCriticalClausesOutput = z.infer<typeof FlagCriticalClausesOutputSchema>;

export async function flagCriticalClauses(input: FlagCriticalClausesInput): Promise<FlagCriticalClausesOutput> {
  if (!input.documentText && !input.photoDataUri) {
    throw new Error("Either documentText or photoDataUri must be provided.");
  }
  return flagCriticalClausesFlow(input);
}

// Note: The tool's fn logic is a placeholder.
// In a real scenario, this tool would perform sophisticated analysis.
const identifyCriticalClausesTool = ai.defineTool(
  {
    name: 'identifyCriticalClausesWithRiskTags', // Renamed for clarity
    description: 'Identifies clauses within a legal document (text or image) that are considered critical based on their potential legal ramifications. For each critical clause, it provides the clause text, the reason it is critical, and assigns relevant risk tags (e.g., "Financial Risk", "Control Risk").',
    inputSchema: z.object({
      documentText: z.string().optional().describe('The text of the legal document to review.'),
      photoDataUri: z.string().optional().describe("A photo or scan of the document, as a data URI."),
      context: z.string().optional().describe('Contextual information about the document, such as the type of agreement or relevant industry.')
    }),
    outputSchema: z.array(CriticalClauseSchema), // Use the new CriticalClauseSchema
    async fn(input) {
      // This is a placeholder. In a real implementation, this tool would analyze
      // the documentText and/or photoDataUri to identify critical clauses and assign risk tags.
      console.log('identifyCriticalClausesWithRiskTags tool invoked with input:', input);
      if (input.documentText?.toLowerCase().includes("liability")) {
         return [{
          clauseText: 'Example: The party of the first part shall not be held liable for acts of God.',
          reason: 'This clause limits liability under certain common, but broadly defined, circumstances. Its enforceability can vary.',
          riskTags: ["Legal Ambiguity", "Operational Risk"]
        }];
      }
      if (input.documentText?.toLowerCase().includes("non-compete")) {
         return [{
          clauseText: 'Example: Employee agrees not to work for a competitor for 2 years within a 100-mile radius.',
          reason: 'Non-compete clauses can significantly restrict future employment opportunities. Their reasonableness and enforceability depend on jurisdiction and specifics.',
          riskTags: ["Operational Risk", "Control Risk"]
        }];
      }
      return [{
        clauseText: 'Example Critical Clause (Identified by Tool)',
        reason: 'This is an example placeholder clause identified by the tool based on the provided document data and context. It signifies a point of potential concern.',
        riskTags: ["Other"],
      }];
    },
  }
);


const prompt = ai.definePrompt({
  name: 'flagCriticalClausesPrompt',
  input: {schema: FlagCriticalClausesInputSchema},
  output: {schema: FlagCriticalClausesOutputSchema},
  tools: [identifyCriticalClausesTool],
  prompt: `You are an AI legal assistant specializing in risk identification. Review the provided legal document and context.
Your primary task is to use the 'identifyCriticalClausesWithRiskTags' tool to analyze the document (text or image).
For each critical clause the tool identifies, ensure it returns:
1.  The exact clause text.
2.  A clear reason why it's critical and its potential impact.
3.  Appropriate risk tags from the predefined list: "Control Risk", "Financial Risk", "Exit Risk", "Compliance Risk", "Operational Risk", "Reputational Risk", "Legal Ambiguity", "Other".

Context: {{#if context}}{{context}}{{else}}General legal document.{{/if}}

{{#if documentText}}
Document Text:
{{{documentText}}}
{{/if}}
{{#if photoDataUri}}
Document Image:
{{media url=photoDataUri}}
{{/if}}

Based on your analysis using the tool, return the list of critical clauses with their details, including the risk tags.
If the tool finds no critical clauses, return an empty array for criticalClauses.
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
    // Ensure output is not null and criticalClauses is an array
    return output || { criticalClauses: [] };
  }
);
