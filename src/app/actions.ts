'use server';

import { generateTags, type SmartTaggingInput } from '@/ai/flows/smart-tagging';
import { z } from 'zod';

const inputSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters.'),
});

export async function generateTagsAction(
  input: SmartTaggingInput
): Promise<{ success: boolean; tags?: string[]; error?: string }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    // This is a server-side call to the Genkit flow
    const result = await generateTags(parsed.data);
    return { success: true, tags: result.tags };
  } catch (error) {
    console.error('Error generating tags:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
