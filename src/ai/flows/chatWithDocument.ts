
// src/ai/flows/chatWithDocument.ts
'use server';
/**
 * @fileOverview Provides a conversational interface to ask questions about a legal document.
 *
 * - chatWithDocument - A function that answers a user's question about a document.
 * - ChatWithDocumentInput - The input type for the chatWithDocument function.
 * - ChatWithDocumentOutput - The return type for the chatWithDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithDocumentInputSchema = z.object({
  documentText: z.string().optional().describe('The text content of the legal document.'),
  photoDataUri: z.string().optional().describe("A photo or scan of the document, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  userQuestion: z.string().describe('The question asked by the user about the document.'),
  // We'll add chatHistory here in Phase 2
});
export type ChatWithDocumentInput = z.infer<typeof ChatWithDocumentInputSchema>;

const ChatWithDocumentOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's answer to the user's question."),
});
export type ChatWithDocumentOutput = z.infer<typeof ChatWithDocumentOutputSchema>;

export async function chatWithDocument(input: ChatWithDocumentInput): Promise<ChatWithDocumentOutput> {
  if (!input.documentText && !input.photoDataUri) {
    throw new Error("Either documentText or photoDataUri must be provided to chat about the document.");
  }
  if (!input.userQuestion) {
    throw new Error("A user question must be provided.");
  }
  return chatWithDocumentFlow(input);
}

const chatWithDocumentPrompt = ai.definePrompt({
  name: 'chatWithDocumentPrompt',
  input: {schema: ChatWithDocumentInputSchema},
  output: {schema: ChatWithDocumentOutputSchema},
  prompt: `You are a helpful AI legal assistant. Analyze the following legal document and answer the user's question based *only* on the information contained within this document.

Document Content:
{{#if documentText}}
{{{documentText}}}
{{/if}}
{{#if photoDataUri}}
{{media url=photoDataUri}}
{{/if}}

User's Question: {{{userQuestion}}}

Your Answer:
`,
});

const chatWithDocumentFlow = ai.defineFlow(
  {
    name: 'chatWithDocumentFlow',
    inputSchema: ChatWithDocumentInputSchema,
    outputSchema: ChatWithDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await chatWithDocumentPrompt(input);
    return output!;
  }
);

