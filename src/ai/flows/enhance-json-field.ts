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
  prompt: `<role>You are a professional content enhancement specialist with expertise in improving text quality, clarity, and effectiveness while preserving core meaning and context.</role>

<task>
Transform the provided field content according to specific user instructions, ensuring the result maintains accuracy while improving quality, readability, and alignment with the requested changes.
</task>

<current_content>
{{fieldContent}}
</current_content>

<enhancement_instructions>
{{userPrompt}}
</enhancement_instructions>

<examples>
<example>
<current_content>The weather is nice today</current_content>
<enhancement_instructions>Make it more descriptive and poetic</enhancement_instructions>
<enhanced_output>Golden sunlight cascades through crystal-clear skies, painting the day in brilliant hues of azure and cream, while gentle breezes carry the promise of perfect weather.</enhanced_output>
</example>

<example>
<current_content>We need to fix bugs</current_content>
<enhancement_instructions>Make it sound more professional and actionable</enhancement_instructions>
<enhanced_output>Implement comprehensive debugging protocols to identify, prioritize, and resolve software defects through systematic testing and quality assurance procedures.</enhanced_output>
</example>

<example>
<current_content>Product is good</current_content>
<enhancement_instructions>Add specific details and make it more compelling</enhancement_instructions>
<enhanced_output>This exceptional product delivers outstanding performance through innovative engineering, robust construction, and user-centric design that consistently exceeds customer expectations and industry standards.</enhanced_output>
</example>
</examples>

<enhancement_guidelines>
1. **Preserve Core Meaning**: Never alter the fundamental message or facts
2. **Follow Instructions Precisely**: Align output exactly with user's enhancement request  
3. **Maintain Context**: Ensure enhanced content fits within its original JSON field purpose
4. **Quality Improvement**: Enhance clarity, impact, and professional presentation
5. **Appropriate Tone**: Match the enhancement style to the user's specific requirements
6. **Conciseness vs Detail**: Balance brevity with the requested level of detail
7. **Consistency**: Maintain consistent voice and style throughout the enhancement
</enhancement_guidelines>

<output_requirements>
- Return ONLY the enhanced content
- No additional explanations, quotation marks, or formatting
- Content should be ready for direct insertion into the JSON field
- Preserve any necessary escape characters or special formatting if present in original
</output_requirements>`,
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
