'use server';
/**
 * @fileOverview A flow for formatting and correcting a JSON string using AI.
 *
 * - formatJson - A function that handles the JSON formatting and correction process.
 * - FormatJsonInput - The input type for the formatJson function.
 * - FormatJsonOutput - The return type for the formatJson function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormatJsonInputSchema = z.object({
  jsonString: z.string().describe('The JSON string to be formatted and potentially corrected.'),
});
export type FormatJsonInput = z.infer<typeof FormatJsonInputSchema>;

const FormatJsonOutputSchema = z.object({
  formattedJson: z.string().describe('The beautified and corrected JSON string.'),
  correctionsMade: z.string().optional().describe('A summary of corrections or changes made by the AI, if any.'),
});
export type FormatJsonOutput = z.infer<typeof FormatJsonOutputSchema>;

export async function formatJson(input: FormatJsonInput): Promise<FormatJsonOutput> {
  return formatJsonFlow(input);
}

const formatJsonPrompt = ai.definePrompt({
  name: 'formatJsonPrompt',
  input: {schema: FormatJsonInputSchema},
  output: {schema: FormatJsonOutputSchema},
  prompt: `You are an expert JSON formatting and correction AI.
Your task is to take the following JSON string, validate it, correct any syntax errors, and then format it beautifully (e.g., with 2-space indentation).

Input JSON string:
\`\`\`json
{{{jsonString}}}
\`\`\`

If the input string is not valid JSON, try your best to fix it. For example, add missing quotes, commas, brackets, or braces.
If corrections were made, briefly describe them in the 'correctionsMade' field. If no corrections were necessary, you can omit 'correctionsMade' or set it to "No corrections needed.".
Return the beautified and valid JSON string in the 'formattedJson' field.

The output MUST be a valid JSON object with the fields "formattedJson" (string) and optionally "correctionsMade" (string).
Do NOT return a markdown code block for the JSON, just the raw JSON string within the "formattedJson" field of the output object.
Example of expected output format:
{
  "formattedJson": "{\\n  \\"name\\": \\"John Doe\\",\\n  \\"age\\": 30\\n}",
  "correctionsMade": "Added missing comma after name field."
}
`,
});

const formatJsonFlow = ai.defineFlow(
  {
    name: 'formatJsonFlow',
    inputSchema: FormatJsonInputSchema,
    outputSchema: FormatJsonOutputSchema,
  },
  async input => {
    const {output} = await formatJsonPrompt(input);
     if (!output) {
      throw new Error('AI failed to format the JSON.');
    }
    // Ensure the formattedJson field actually contains a parsable JSON string
    try {
      JSON.parse(output.formattedJson);
    } catch (e) {
      console.error("AI returned malformed JSON in 'formattedJson' field.", output, e);
      throw new Error(`AI returned malformed JSON in the 'formattedJson' field. Error: ${(e as Error).message}`);
    }
    return output;
  }
);
