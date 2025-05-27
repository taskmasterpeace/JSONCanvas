'use server';

/**
 * @fileOverview A flow for enhancing a JSON field using AI.
 *
 * - enhanceJsonField - A function that handles the JSON field enhancement process.
 * - EnhanceJsonFieldInput - The input type for the enhanceJsonField function.
 * - EnhanceJsonFieldOutput - The return type for the enhanceJsonField function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceJsonFieldInputSchema = z.object({
  fieldContent: z.string().describe('The content of the JSON field to enhance.'),
  userPrompt: z
    .string()
    .describe(
      'Instructions for the AI on how to rewrite or enhance the content. Be specific about the desired outcome.'
    ),
});
export type EnhanceJsonFieldInput = z.infer<typeof EnhanceJsonFieldInputSchema>;

const EnhanceJsonFieldOutputSchema = z.object({
  enhancedContent: z
    .string()
    .describe('The enhanced content of the JSON field, rewritten according to the user prompt.'),
});
export type EnhanceJsonFieldOutput = z.infer<typeof EnhanceJsonFieldOutputSchema>;

export async function enhanceJsonField(input: EnhanceJsonFieldInput): Promise<EnhanceJsonFieldOutput> {
  return enhanceJsonFieldFlow(input);
}

const enhanceJsonFieldPrompt = ai.definePrompt({
  name: 'enhanceJsonFieldPrompt',
  input: {schema: EnhanceJsonFieldInputSchema},
  output: {schema: EnhanceJsonFieldOutputSchema},
  prompt: `You are an AI assistant tasked with enhancing the content of a JSON field based on user instructions.

  The current content of the JSON field is:
  {{fieldContent}}

  The user has provided the following instructions for enhancing the content:
  {{userPrompt}}

  Rewrite the content according to the instructions, ensuring the enhanced content is clear, accurate, and creative as requested.
  Return ONLY the rewritten content. Do not include any extra text.`,
});

const enhanceJsonFieldFlow = ai.defineFlow(
  {
    name: 'enhanceJsonFieldFlow',
    inputSchema: EnhanceJsonFieldInputSchema,
    outputSchema: EnhanceJsonFieldOutputSchema,
  },
  async input => {
    const {output} = await enhanceJsonFieldPrompt(input);
    return output!;
  }
);
