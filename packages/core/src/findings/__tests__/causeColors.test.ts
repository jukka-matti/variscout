import { describe, it, expect } from 'vitest';
import { assignCauseColors } from '../causeColors';

describe('assignCauseColors', () => {
  it('returns empty map for empty input', () => {
    const result = assignCauseColors([]);
    expect(result.size).toBe(0);
  });

  it('assigns a color to each question ID', () => {
    const ids = ['q1', 'q2', 'q3'];
    const result = assignCauseColors(ids);
    expect(result.size).toBe(3);
    for (const id of ids) {
      expect(result.has(id)).toBe(true);
      expect(typeof result.get(id)).toBe('string');
      expect(result.get(id)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('assigns unique colors to different IDs (up to palette size)', () => {
    const ids = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
    const result = assignCauseColors(ids);
    const colors = ids.map(id => result.get(id));
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(8);
  });

  it('returns consistent colors for the same IDs (deterministic)', () => {
    const ids = ['q-beta', 'q-alpha', 'q-gamma'];
    const first = assignCauseColors(ids);
    const second = assignCauseColors(ids);
    for (const id of ids) {
      expect(first.get(id)).toBe(second.get(id));
    }
  });

  it('assigns colors based on sorted order, not insertion order', () => {
    const idsAscending = ['q-alpha', 'q-beta', 'q-gamma'];
    const idsDescending = ['q-gamma', 'q-beta', 'q-alpha'];
    const result1 = assignCauseColors(idsAscending);
    const result2 = assignCauseColors(idsDescending);
    // Same color regardless of insertion order
    expect(result1.get('q-alpha')).toBe(result2.get('q-alpha'));
    expect(result1.get('q-beta')).toBe(result2.get('q-beta'));
    expect(result1.get('q-gamma')).toBe(result2.get('q-gamma'));
  });

  it('cycles through palette when there are more IDs than colors (12 IDs)', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `q-${String(i).padStart(2, '0')}`);
    const result = assignCauseColors(ids);
    expect(result.size).toBe(12);
    // IDs are sorted, so q-00..q-07 get palette[0..7], q-08 wraps to palette[0]
    const sortedIds = [...ids].sort();
    expect(result.get(sortedIds[0])).toBe(result.get(sortedIds[8]));
    expect(result.get(sortedIds[1])).toBe(result.get(sortedIds[9]));
    expect(result.get(sortedIds[2])).toBe(result.get(sortedIds[10]));
    expect(result.get(sortedIds[3])).toBe(result.get(sortedIds[11]));
  });
});
