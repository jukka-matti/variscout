import { describe, it, expect } from 'vitest';
import {
  generateChannelRankingQuestions,
  CPK_EXCELLENT,
  type ChannelInput,
} from '../channelQuestions';

describe('generateChannelRankingQuestions', () => {
  it('returns empty array for empty channels input', () => {
    const result = generateChannelRankingQuestions([]);
    expect(result).toEqual([]);
  });

  it('generates questions ranked by worst Cpk first', () => {
    const channels: ChannelInput[] = [
      { name: 'Head 3', cpk: 1.45 },
      { name: 'Head 1', cpk: 0.72 },
      { name: 'Head 2', cpk: 1.1 },
    ];

    const result = generateChannelRankingQuestions(channels);

    expect(result).toHaveLength(3);
    // Worst Cpk (0.72) should be first
    expect(result[0].factors[0]).toBe('Head 1');
    expect(result[1].factors[0]).toBe('Head 2');
    expect(result[2].factors[0]).toBe('Head 3');
  });

  it('auto-rules-out channels with Cpk > CPK_EXCELLENT (1.67)', () => {
    const channels: ChannelInput[] = [
      { name: 'Head A', cpk: 0.95 },
      { name: 'Head B', cpk: 1.92 }, // excellent — should be ruled-out
    ];

    const result = generateChannelRankingQuestions(channels);

    // Head A: Cpk 0.95 — not ruled-out
    const headA = result.find(q => q.factors[0] === 'Head A');
    expect(headA).toBeDefined();
    expect(headA!.autoAnswered).toBe(false);
    expect(headA!.autoStatus).toBeUndefined();

    // Head B: Cpk 1.92 — ruled-out
    const headB = result.find(q => q.factors[0] === 'Head B');
    expect(headB).toBeDefined();
    expect(headB!.autoAnswered).toBe(true);
    expect(headB!.autoStatus).toBe('ruled-out');
  });

  it('does not auto-rule-out a channel at exactly CPK_EXCELLENT boundary (1.67)', () => {
    const channels: ChannelInput[] = [{ name: 'Boundary', cpk: CPK_EXCELLENT }];

    const result = generateChannelRankingQuestions(channels);

    // cpk === 1.67 is NOT > 1.67, so it should NOT be ruled-out
    expect(result[0].autoAnswered).toBe(false);
    expect(result[0].autoStatus).toBeUndefined();
  });

  it('stores channel Cpk in the rSquaredAdj field as evidence strength', () => {
    const channels: ChannelInput[] = [{ name: 'Nozzle 1', cpk: 1.23 }];

    const result = generateChannelRankingQuestions(channels);

    expect(result[0].rSquaredAdj).toBeCloseTo(1.23);
  });

  it('includes channel name and formatted Cpk in question text', () => {
    const channels: ChannelInput[] = [{ name: 'Fill Head 2', cpk: 0.876 }];

    const result = generateChannelRankingQuestions(channels);

    expect(result[0].text).toBe('Why does Fill Head 2 have Cpk=0.88?');
  });

  it('sets source to factor-intel and type to single-factor', () => {
    const channels: ChannelInput[] = [{ name: 'Cavity X', cpk: 1.1 }];

    const result = generateChannelRankingQuestions(channels);

    expect(result[0].source).toBe('factor-intel');
    expect(result[0].type).toBe('single-factor');
  });

  it('handles a single channel correctly', () => {
    const result = generateChannelRankingQuestions([{ name: 'Solo', cpk: 1.5 }]);

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Why does Solo have Cpk=1.50?');
    expect(result[0].autoAnswered).toBe(false);
  });

  it('does not mutate the input array', () => {
    const channels: ChannelInput[] = [
      { name: 'A', cpk: 1.5 },
      { name: 'B', cpk: 0.8 },
    ];
    const originalOrder = channels.map(c => c.name);

    generateChannelRankingQuestions(channels);

    expect(channels.map(c => c.name)).toEqual(originalOrder);
  });
});
