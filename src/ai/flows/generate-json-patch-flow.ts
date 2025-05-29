
'use server';
/**
 * @fileOverview A flow for generating a JSON Patch based on user instructions.
 *
 * - generateJsonPatch - A function that handles the JSON Patch generation process.
 * - GenerateJsonPatchInput - The input type for the generateJsonPatch function.
 * - GenerateJsonPatchOutput - The return type for the generateJsonPatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJsonPatchInputSchema = z.object({
  currentJson: z.string().describe('The current JSON object as a string.'),
  instructions: z.string().describe('Natural language instructions describing the desired changes to the JSON object.'),
});
export type GenerateJsonPatchInput = z.infer<typeof GenerateJsonPatchInputSchema>;

const GenerateJsonPatchOutputSchema = z.object({
  patchOperations: z.string().describe('A JSON string representing an array of JSON Patch operations (RFC 6902). Example: \'[{\"op\": \"replace\", \"path\": \"/name\", \"value\": \"New Name\"}]\''),
  explanation: z.string().optional().describe('An optional explanation from the AI about the generated patch or any ambiguities.'),
});
export type GenerateJsonPatchOutput = z.infer<typeof GenerateJsonPatchOutputSchema>;

export async function generateJsonPatch(input: GenerateJsonPatchInput): Promise<GenerateJsonPatchOutput> {
  return generateJsonPatchFlow(input);
}

const generateJsonPatchPrompt = ai.definePrompt({
  name: 'generateJsonPatchPrompt',
  input: {schema: GenerateJsonPatchInputSchema},
  output: {schema: GenerateJsonPatchOutputSchema},
  prompt: `You are an expert at generating JSON Patch documents (RFC 6902) to update JSON objects.
Your task is to analyze the current JSON object and the user's requested changes, then generate a JSON Patch document as a JSON string that will update the object according to the requirements.

Current JSON object:
\`\`\`json
{{{currentJson}}}
\`\`\`

User's requested changes:
"{{{instructions}}}"

The JSON Patch document you generate MUST be a valid JSON array of patch operations, provided as a single JSON string in the 'patchOperations' field.
Each operation in the array must be a valid JSON patch operation with:
- "op": The operation to perform (e.g., "add", "remove", "replace", "move", "copy", "test").
- "path": The JSON pointer to the location to modify (e.g., "/fieldName", "/arrayName/0/propertyName").
- "value": The new value (for "add" and "replace" operations).
- "from": The JSON pointer to the source location (for "move" and "copy" operations).

Your response MUST be a valid JSON object containing the 'patchOperations' string and an optional 'explanation' string.
Do NOT include any markdown formatting or other text outside of the JSON object structure for your response.
The 'patchOperations' field itself must contain a string that, when parsed, results in a JSON array of patch operations.

Example of expected output object:
{
  "patchOperations": "[{\\"op\\": \\"replace\\", \\"path\\": \\"/name\\", \\"value\\": \\"Hello world!\\"}]",
  "explanation": "Changed the name field."
}
Another example for adding an item to an array:
{
  "patchOperations": "[{\\"op\\": \\"add\\", \\"path\\": \\"/items/-\\", \\"value\\": {\\"id\\": \\"newItem\\" }}]",
  "explanation": "Added a new item to the 'items' array."
}
If the instructions are unclear or cannot be translated to a JSON patch, set patchOperations to "[]" (an empty array as a string) and provide an explanation.
`,
});

const generateJsonPatchFlow = ai.defineFlow(
  {
    name: 'generateJsonPatchFlow',
    inputSchema: GenerateJsonPatchInputSchema,
    outputSchema: GenerateJsonPatchOutputSchema,
  },
  async input => {
    const {output} = await generateJsonPatchPrompt(input);
    if (!output || !output.patchOperations) {
      // Attempt to provide a default empty patch if AI fails significantly
      console.warn('AI failed to generate JSON Patch operations. Returning empty patch.');
      return { patchOperations: "[]", explanation: "AI failed to generate a patch. No changes made." };
    }
    // Validate that the patchOperations string is itself valid JSON
    try {
      JSON.parse(output.patchOperations);
    } catch (e) {
      console.error("AI returned a 'patchOperations' string that is not valid JSON:", output.patchOperations, e);
      // Attempt to return an empty patch to prevent crashes, with explanation
      return { patchOperations: "[]", explanation: `AI returned a malformed patch string. Error: ${(e as Error).message}. No changes made.` };
    }
    return output;
  }
);
