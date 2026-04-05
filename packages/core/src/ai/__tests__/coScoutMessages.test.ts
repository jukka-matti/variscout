/**
 * Tests for buildCoScoutMessageInput — Responses API input array builder.
 */
import { describe, it, expect } from 'vitest';
import { buildCoScoutMessageInput } from '../prompts/coScout/messages';
import type { CoScoutMessage } from '../types';

function makeMessage(
  id: string,
  role: 'user' | 'assistant',
  content: string,
  error?: CoScoutMessage['error']
): CoScoutMessage {
  return { id, role, content, timestamp: Date.now(), error };
}

describe('buildCoScoutMessageInput', () => {
  it('returns array containing the user message as last entry', () => {
    const result = buildCoScoutMessageInput([], 'Hello CoScout');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ role: 'user', content: 'Hello CoScout' });
  });

  it('includes conversation history before the current user message', () => {
    const history: CoScoutMessage[] = [
      makeMessage('1', 'user', 'First question'),
      makeMessage('2', 'assistant', 'First answer'),
    ];
    const result = buildCoScoutMessageInput(history, 'Second question');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ role: 'user', content: 'First question' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'First answer' });
    expect(result[2]).toEqual({ role: 'user', content: 'Second question' });
  });

  it('handles empty history — only current user message returned', () => {
    const result = buildCoScoutMessageInput([], 'Only message');
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('user');
    expect(result[0].content).toBe('Only message');
  });

  it('truncates history to last 10 messages (COSCOUT_HISTORY_LIMIT)', () => {
    const history: CoScoutMessage[] = Array.from({ length: 15 }, (_, i) =>
      makeMessage(String(i), i % 2 === 0 ? 'user' : 'assistant', `Message ${i}`)
    );
    const result = buildCoScoutMessageInput(history, 'New question');
    // 10 history entries + 1 current user message
    expect(result).toHaveLength(11);
    // First included entry should be message at index 5 (15 - 10 = 5)
    expect(result[0].content).toBe('Message 5');
  });

  it('filters out error messages from history', () => {
    const history: CoScoutMessage[] = [
      makeMessage('1', 'user', 'Good question'),
      makeMessage('2', 'assistant', 'Error response', {
        type: 'api_error',
        message: 'Something failed',
        retryable: true,
      }),
      makeMessage('3', 'assistant', 'Good answer'),
    ];
    const result = buildCoScoutMessageInput(history, 'Next question');
    // Error message should be excluded
    const contents = result.map(m => (typeof m.content === 'string' ? m.content : null));
    expect(contents).not.toContain('Error response');
    expect(contents).toContain('Good question');
    expect(contents).toContain('Good answer');
  });

  it('builds multimodal input when images are provided', () => {
    const result = buildCoScoutMessageInput([], 'Look at this chart', [
      { dataUrl: 'data:image/png;base64,abc123' },
    ]);
    expect(result).toHaveLength(1);
    const msg = result[0];
    expect(msg.role).toBe('user');
    expect(Array.isArray(msg.content)).toBe(true);
    const parts = msg.content as Array<{ type: string; text?: string; image_url?: string }>;
    expect(parts[0]).toEqual({ type: 'input_text', text: 'Look at this chart' });
    expect(parts[1]).toMatchObject({
      type: 'input_image',
      image_url: 'data:image/png;base64,abc123',
      detail: 'auto',
    });
  });

  it('builds multimodal input with multiple images', () => {
    const images = [
      { dataUrl: 'data:image/png;base64,img1' },
      { dataUrl: 'data:image/png;base64,img2' },
    ];
    const result = buildCoScoutMessageInput([], 'Compare these', images);
    const parts = result[0].content as Array<{ type: string }>;
    expect(parts).toHaveLength(3); // 1 text + 2 images
    expect(parts[0].type).toBe('input_text');
    expect(parts[1].type).toBe('input_image');
    expect(parts[2].type).toBe('input_image');
  });

  it('uses plain string content when no images provided', () => {
    const result = buildCoScoutMessageInput([], 'Simple text');
    expect(typeof result[0].content).toBe('string');
  });

  it('preserves role assignment for history messages', () => {
    const history: CoScoutMessage[] = [
      makeMessage('1', 'user', 'User turn'),
      makeMessage('2', 'assistant', 'Assistant turn'),
    ];
    const result = buildCoScoutMessageInput(history, 'Next');
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('assistant');
    expect(result[2].role).toBe('user');
  });
});
