'use server';
/**
 * @fileOverview A flow for summarizing a section of a JSON document using AI.
 *
 * - summarizeJsonSection - A function that handles the summarization process.
 * - SummarizeJsonSectionInput - The input type for the summarizeJsonSection function.
 * - SummarizeJsonSectionOutput - The return type for the summarizeJsonSection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeJsonSectionInputSchema = z.object({
  jsonSection: z.string().describe('The JSON section to summarize.'),
});
export type SummarizeJsonSectionInput = z.infer<typeof SummarizeJsonSectionInputSchema>;

const SummarizeJsonSectionOutputSchema = z.object({
  summary: z.string().describe('The summary of the JSON section.'),
});
export type SummarizeJsonSectionOutput = z.infer<typeof SummarizeJsonSectionOutputSchema>;

export async function summarizeJsonSection(input: SummarizeJsonSectionInput): Promise<SummarizeJsonSectionOutput> {
  return summarizeJsonSectionFlow(input);
}

const summarizeJsonSectionPrompt = ai.definePrompt({
  name: 'summarizeJsonSectionPrompt',
  input: {schema: SummarizeJsonSectionInputSchema},
  output: {schema: SummarizeJsonSectionOutputSchema},
  prompt: `Summarize the following JSON section. Be concise and focus on the key information.\n\nJSON Section: {{{jsonSection}}}`,
});

const summarizeJsonSectionFlow = ai.defineFlow(
  {
    name: 'summarizeJsonSectionFlow',
    inputSchema: SummarizeJsonSectionInputSchema,
    outputSchema: SummarizeJsonSectionOutputSchema,
  },
  async input => {
    const {output} = await summarizeJsonSectionPrompt(input);
    return {
      ...output,
      progress: 'Generated a short summary of the given JSON section.',
    } as SummarizeJsonSectionOutput & {progress: string};
  }
);
