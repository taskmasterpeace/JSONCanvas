
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
  prompt: `<role>You are an expert data structuring AI specializing in converting arbitrary text into well-structured, semantic JSON representations. You excel at identifying patterns, relationships, and meaning in unstructured data.</role>

<task>
Convert the provided raw text into a valid, well-structured JSON object or array that best represents the information and maintains semantic meaning.
</task>

<input_text>
{{{rawText}}}
</input_text>

<instructions>
{{#if instructions}}
{{{instructions}}}
{{else}}
Apply intelligent structural analysis based on content patterns and semantic meaning.
{{/if}}
</instructions>

<examples>
<example>
<input>John Doe, 30, Engineer
Jane Smith, 25, Designer  
Bob Johnson, 35, Manager</input>
<output>
{
  "generatedJson": "[{\\"name\\": \\"John Doe\\", \\"age\\": 30, \\"occupation\\": \\"Engineer\\"}, {\\"name\\": \\"Jane Smith\\", \\"age\\": 25, \\"occupation\\": \\"Designer\\"}, {\\"name\\": \\"Bob Johnson\\", \\"age\\": 35, \\"occupation\\": \\"Manager\\"}]",
  "notes": "Detected tabular data with implicit column structure: name, age, occupation. Converted to array of objects with semantic keys."
}
</output>
</example>

<example>
<input>Shopping list:
- Apples (organic, 2 lbs)
- Bread (whole wheat)
- Milk (2%)
- Eggs (dozen)</input>
<output>
{
  "generatedJson": "{\\"type\\": \\"shopping_list\\", \\"items\\": [{\\"name\\": \\"Apples\\", \\"specifications\\": \\"organic, 2 lbs\\"}, {\\"name\\": \\"Bread\\", \\"specifications\\": \\"whole wheat\\"}, {\\"name\\": \\"Milk\\", \\"specifications\\": \\"2%\\"}, {\\"name\\": \\"Eggs\\", \\"specifications\\": \\"dozen\\"}]}",
  "notes": "Structured shopping list with semantic grouping. Extracted item names and specifications from parenthetical details."
}
</output>
</example>

<example>
<input>Company: Acme Corp
Founded: 2015
Revenue: $5.2M
Employees: 45
CEO: Sarah Williams</input>
<output>
{
  "generatedJson": "{\\"company\\": {\\"name\\": \\"Acme Corp\\", \\"founded\\": 2015, \\"financial\\": {\\"revenue\\": \\"$5.2M\\"}, \\"staff\\": {\\"employee_count\\": 45, \\"ceo\\": \\"Sarah Williams\\"}}}",
  "notes": "Organized company information into logical nested structure with financial and staff groupings for better semantic organization."
}
</output>
</example>
</examples>

<rules>
1. **Semantic Structure**: Create meaningful hierarchies that reflect natural data relationships
2. **Data Type Intelligence**: Use appropriate JSON types (string, number, boolean, null) based on content analysis
3. **Consistent Naming**: Use snake_case for keys, descriptive names that reflect content meaning
4. **Nested Organization**: Group related information into nested objects when logical
5. **Array Optimization**: Use arrays for repeated structures or list-like content
6. **Value Preservation**: Maintain all original information while improving structure
7. **JSON Validity**: Ensure proper escaping and valid JSON syntax
8. **Error Recovery**: If malformed JSON is detected, apply intelligent correction
</rules>

<output_format>
Return a JSON object with exactly two fields:
- "generatedJson": A string containing the converted JSON (not a code block)
- "notes": Optional string explaining decisions, assumptions, or structural choices made

The generatedJson field must contain a valid JSON string that can be parsed by JSON.parse().
</output_format>`,
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

