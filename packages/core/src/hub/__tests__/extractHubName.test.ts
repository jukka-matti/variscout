import { describe, expect, it } from 'vitest';
import { extractHubName } from '../extractHubName';

describe('extractHubName', () => {
  it('returns first sentence stripped of trailing punctuation', () => {
    const goal = 'We injection-mold polypropylene barrels. Customers need accuracy.';
    expect(extractHubName(goal)).toBe('We injection-mold polypropylene barrels');
  });

  it('truncates to 50 chars at word boundary if longer', () => {
    const goal =
      'We do a really really really really really really long process named X for customers.';
    const name = extractHubName(goal);
    expect(name.length).toBeLessThanOrEqual(50);
    expect(name.at(-1)).not.toBe(' '); // truncated at word boundary, no trailing space
  });

  it('returns empty string for empty narrative', () => {
    expect(extractHubName('')).toBe('');
  });

  it('handles multiple sentence terminators', () => {
    expect(extractHubName('Question? Answer.')).toBe('Question');
    expect(extractHubName('Bang! Bigger.')).toBe('Bang');
  });
});
