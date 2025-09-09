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
  prompt: `<role>You are a JSON syntax expert and formatter specializing in parsing, correcting, and beautifying JSON data with exceptional accuracy and attention to detail.</role>

<task>
Analyze the provided JSON string, identify and correct any syntax errors, then format it with proper indentation and structure for optimal readability.
</task>

<input_json>
{{{jsonString}}}
</input_json>

<examples>
<example>
<input>{"name": "John" "age": 30}</input>
<output>
{
  "formattedJson": "{\\n  \\"name\\": \\"John\\",\\n  \\"age\\": 30\\n}",
  "correctionsMade": "Added missing comma between 'name' and 'age' properties."
}
</output>
</example>

<example>
<input>[1, 2, 3,]</input>
<output>
{
  "formattedJson": "[\\n  1,\\n  2,\\n  3\\n]",
  "correctionsMade": "Removed trailing comma after last array element."
}
</output>
</example>

<example>
<input>{'single': 'quotes', "mixed": "quotes"}</input>
<output>
{
  "formattedJson": "{\\n  \\"single\\": \\"quotes\\",\\n  \\"mixed\\": \\"quotes\\"\\n}",
  "correctionsMade": "Normalized single quotes to double quotes for JSON compliance."
}
</output>
</example>
</examples>

<correction_rules>
1. **Missing Commas**: Add missing commas between object properties and array elements
2. **Quote Normalization**: Convert single quotes to double quotes for keys and string values
3. **Missing Quotes**: Add quotes around unquoted object keys and string values
4. **Trailing Commas**: Remove trailing commas after last elements
5. **Missing Brackets**: Add missing opening/closing brackets and braces
6. **Escape Sequences**: Properly escape special characters in strings
7. **Value Type Correction**: Ensure proper representation of null, boolean, and numeric values
8. **Whitespace Normalization**: Remove invalid whitespace while preserving string content
</correction_rules>

<formatting_standards>
- Use 2-space indentation for nested structures
- Place opening braces on same line as parent element
- One property/element per line for multi-item collections
- Consistent spacing around colons and commas
- No trailing commas in final elements
- Preserve original data types (string, number, boolean, null)
</formatting_standards>

<output_requirements>
- Return valid JSON object with "formattedJson" and optional "correctionsMade" fields
- formattedJson must contain properly escaped, valid JSON string
- correctionsMade should describe specific fixes made (if any)
- If no corrections needed, set correctionsMade to "No corrections needed"
- Do NOT include markdown code blocks in output
</output_requirements>`,
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
