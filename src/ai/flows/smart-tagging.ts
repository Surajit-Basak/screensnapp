'use server';

/**
 * @fileOverview AI-powered smart tagging for screen recordings.
 *
 * - generateTags - A function that suggests relevant tags for a screen recording.
 * - SmartTaggingInput - The input type for the generateTags function.
 * - SmartTaggingOutput - The return type for the generateTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTaggingInputSchema = z.object({
  description: z
    .string()
    .describe(
      'A detailed summary/description of the screen recording content.'
    ),
});
export type SmartTaggingInput = z.infer<typeof SmartTaggingInputSchema>;

const SmartTaggingOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of suggested tags.'),
});
export type SmartTaggingOutput = z.infer<typeof SmartTaggingOutputSchema>;

export async function generateTags(input: SmartTaggingInput): Promise<SmartTaggingOutput> {
  return smartTaggingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartTaggingPrompt',
  input: {schema: SmartTaggingInputSchema},
  output: {schema: SmartTaggingOutputSchema},
  prompt: `You are an AI assistant that suggests relevant tags for screen recordings.

  Given the description of the screen recording, suggest 5 to 7 relevant tags that the user can use to categorize the recording.
  The tags should be concise and descriptive, capturing the main topics and themes of the recording.

  Description: {{{description}}}

  Tags:`, // outputSchema description is automatically added. No need to repeat it here.
});

const smartTaggingFlow = ai.defineFlow(
  {
    name: 'smartTaggingFlow',
    inputSchema: SmartTaggingInputSchema,
    outputSchema: SmartTaggingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
