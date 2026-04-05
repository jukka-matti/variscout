/**
 * Message input builder for the Responses API.
 *
 * Extracts the message-formatting concern from the legacy `buildCoScoutInput`
 * function. The assembler handles prompt construction (tiers 1-3 → instructions);
 * this module handles the variable `input` array: conversation history + user message.
 */

import type { CoScoutMessage } from '../../types';
import type { InputContentPart, MessageContent } from '../../responsesApi';

/** Maximum number of history messages to include in the input array */
const COSCOUT_HISTORY_LIMIT = 10;

/**
 * Build the Responses API `input` array from conversation history and user message.
 *
 * Includes:
 *  - Recent conversation history (last N non-error messages)
 *  - Current user message (with optional multimodal images)
 *
 * Context is NOT included here — it goes into `instructions` via the assembler.
 */
export function buildCoScoutMessageInput(
  history: CoScoutMessage[],
  userMessage: string,
  images?: Array<{ dataUrl: string }>
): Array<{ role: 'user' | 'assistant'; content: MessageContent }> {
  const input: Array<{ role: 'user' | 'assistant'; content: MessageContent }> = [];

  // Recent history (last N messages, skip error messages)
  const recentHistory = history.slice(-COSCOUT_HISTORY_LIMIT);
  for (const msg of recentHistory) {
    if (!msg.error) {
      input.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }
  }

  // Current user message — multimodal when images are present
  if (images && images.length > 0) {
    const parts: InputContentPart[] = [
      { type: 'input_text', text: userMessage },
      ...images.map(img => ({
        type: 'input_image' as const,
        image_url: img.dataUrl,
        detail: 'auto' as const,
      })),
    ];
    input.push({ role: 'user', content: parts });
  } else {
    input.push({ role: 'user', content: userMessage });
  }

  return input;
}
