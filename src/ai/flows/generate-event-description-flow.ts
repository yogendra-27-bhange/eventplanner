
'use server';
/**
 * @fileOverview An AI flow to generate event descriptions.
 *
 * - generateEventDescription - A function that generates an event description based on title and category.
 * - GenerateEventDescriptionInput - The input type for the generateEventDescription function.
 * - GenerateEventDescriptionOutput - The return type for the generateEventDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  category: z.string().describe('The category of the event.'),
});
export type GenerateEventDescriptionInput = z.infer<typeof GenerateEventDescriptionInputSchema>;

const GenerateEventDescriptionOutputSchema = z.object({
  suggestedDescription: z.string().describe('The AI-generated event description.'),
});
export type GenerateEventDescriptionOutput = z.infer<typeof GenerateEventDescriptionOutputSchema>;

export async function generateEventDescription(input: GenerateEventDescriptionInput): Promise<GenerateEventDescriptionOutput> {
  return generateEventDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventDescriptionPrompt',
  input: {schema: GenerateEventDescriptionInputSchema},
  output: {schema: GenerateEventDescriptionOutputSchema},
  prompt: `You are an expert event marketer. Generate a concise, engaging, and informative description for an event.
The description should be 2-4 sentences long, highlighting key aspects and encouraging attendance. Make it sound exciting and appealing.

Event Title: {{{title}}}
Event Category: {{{category}}}

Focus on creating a compelling narrative. Do not use placeholders like "[Event Name]" or refer to specific dates/times unless they are part of the title or category provided.
Output only the suggested description.`,
});

const generateEventDescriptionFlow = ai.defineFlow(
  {
    name: 'generateEventDescriptionFlow',
    inputSchema: GenerateEventDescriptionInputSchema,
    outputSchema: GenerateEventDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("Failed to generate event description.");
    }
    return output;
  }
);
