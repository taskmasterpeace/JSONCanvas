
'use server';
/**
 * @fileOverview A flow for converting arbitrary text input into structured JSON using AI.
 *
 * - convertTextToJson - A function that handles the text-to-JSON conversion process.
 * - ConvertTextToJsonInput - The input type for the convertTextToJson function.
 * - ConvertTextToJsonOutput - The return type for the convertTextToJson function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConvertTextToJsonInputSchema = z.object({
  rawText: z.string().describe('The raw text input to be converted into JSON. This can be a list, CSV, unstructured text, or partial JSON.'),
  instructions: z.string().optional().describe('Optional instructions for the AI on how to structure the JSON, e.g., "Create an array of objects with keys: name, age."'),
});
export type ConvertTextToJsonInput = z.infer<typeof ConvertTextToJsonInputSchema>;

const ConvertTextToJsonOutputSchema = z.object({
  generatedJson: z.string().describe('The AI-generated JSON string. The AI will attempt to create a valid, well-structured JSON object or array based on the input text.'),
  notes: z.string().optional().describe('Any notes or comments from the AI about the conversion process, e.g., assumptions made or parts of the text that were difficult to interpret.'),
});
export type ConvertTextToJsonOutput = z.infer<typeof ConvertTextToJsonOutputSchema>;

export async function convertTextToJson(input: ConvertTextToJsonInput): Promise<ConvertTextToJsonOutput> {
  return convertTextToJsonFlow(input);
}

const convertTextToJsonPrompt = ai.definePrompt({
  name: 'convertTextToJsonPrompt',
  input: {schema: ConvertTextToJsonInputSchema},
  output: {schema: ConvertTextToJsonOutputSchema},
  prompt: `You are an expert data structuring AI. Your task is to convert the provided raw text into a valid, well-structured JSON object or array.

Analyze the input text:
{{{rawText}}}

{{#if instructions}}
Please follow these specific instructions for structuring the JSON:
{{{instructions}}}
{{else}}
Consider the following general guidelines:
- If the text appears to be a list of items, try to create a JSON array.
- If the text resembles key-value pairs or a table, try to create a JSON object. For tabular data, use column headers as keys if identifiable, otherwise use generic keys like "column1", "column2".
- If the text is unstructured, try to extract meaningful entities and relationships to form a JSON structure.
- If the text is already partially JSON or malformed JSON, try to correct it and make it valid.
{{/if}}

- Ensure all strings in the generated JSON are properly escaped.
- Aim for a clean and human-readable JSON structure.

Return the generated JSON in the 'generatedJson' field. If you have any notes about ambiguities or assumptions made during conversion, include them in the 'notes' field.
The output MUST be a valid JSON object with the fields "generatedJson" (string) and optionally "notes" (string).
Do NOT return a markdown code block for the JSON, just the raw JSON string within the "generatedJson" field of the output object.
Example of expected output format:
{
  "generatedJson": "{\\"name\\": \\"John Doe\\", \\"age\\": 30}",
  "notes": "Assumed 'age' was a numeric field."
}
Or for an array:
{
  "generatedJson": "[\\"apple\\", \\"banana\\", \\"cherry\\"]"
}
`,
});

const convertTextToJsonFlow = ai.defineFlow(
  {
    name: 'convertTextToJsonFlow',
    inputSchema: ConvertTextToJsonInputSchema,
    outputSchema: ConvertTextToJsonOutputSchema,
  },
  async input => {
    const {output} = await convertTextToJsonPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate JSON from the provided text.');
    }
    // Ensure the generatedJson field actually contains a parsable JSON string (the AI should do this, but double check)
    try {
      JSON.parse(output.generatedJson);
    } catch (e) {
      // If AI returns a string that is not itself a valid JSON string in generatedJson field,
      // try to wrap it as if it was the JSON content itself.
      // This happens if the AI doesn't follow the instruction to put JSON *inside* the generatedJson field.
      try {
        const fixedJson = JSON.stringify(output);
        JSON.parse(fixedJson); // check if this is valid
         return { generatedJson: fixedJson, notes: "AI output was not in the expected structure, attempted to fix."};
      } catch (e2) {
         console.error("AI returned malformed JSON in 'generatedJson' field, and the overall output was not JSON either.", output, e);
         throw new Error(`AI returned malformed JSON and could not be automatically corrected. Error: ${(e as Error).message}`);
      }
    }
    return output;
  }
);

