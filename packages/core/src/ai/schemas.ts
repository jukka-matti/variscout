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

/**
 * Schema for transcript distillation responses (CL-6).
 *
 * The model returns an array of proposed insights extracted from the transcript.
 * Each insight optionally maps to a consultation question id and is classified
 * by kind — this kind-classification is the AI value-add over the deterministic
 * typed/Markdown path (which produces 'answer'-only insights from question anchors).
 *
 * Strict JSON Schema for use with `text.format` structured output.
 */
export const proposedInsightSchema = {
  type: 'array' as const,
  items: {
    type: 'object' as const,
    properties: {
      questionId: {
        type: 'string',
        description:
          'ID of the consultation question this insight answers. Omit when the insight is not anchored to a specific question.',
      },
      text: {
        type: 'string',
        description:
          'The extracted insight — a single clear statement. Use "suspected cause" language; never "root cause".',
      },
      kind: {
        type: 'string',
        enum: ['answer', 'context', 'new-hypothesis-proposal', 'contradiction'],
        description:
          '"answer" — directly addresses a question; "context" — background information; "new-hypothesis-proposal" — a mechanism or suspected cause not in the existing questions; "contradiction" — conflicts with the current understanding.',
      },
    },
    required: ['text', 'kind'],
    additionalProperties: false,
  },
} as const;
