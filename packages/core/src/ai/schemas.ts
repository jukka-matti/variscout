/**
 * Structured output JSON Schemas for Responses API.
 *
 * These schemas enforce guaranteed response formats via the `text.format` parameter.
 * Ref: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/structured-outputs
 */

/** Schema for narration responses — guarantees text + confidence fields */
export const narrationResponseSchema = {
  type: 'object' as const,
  properties: {
    text: { type: 'string', description: 'Narration summary (1-2 sentences)' },
    confidence: { type: 'string', enum: ['low', 'moderate', 'high'] },
  },
  required: ['text', 'confidence'],
  additionalProperties: false,
};

/** Schema for chart insight chip responses */
export const chartInsightResponseSchema = {
  type: 'object' as const,
  properties: {
    text: { type: 'string', description: 'Chart insight (max 120 characters, one sentence)' },
  },
  required: ['text'],
  additionalProperties: false,
};
