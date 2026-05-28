import { describe, it, expect } from 'vitest';
import { applyCuts } from '../applyCuts';

describe('applyCuts', () => {
  it('routes each value into the segment named by levelNames', () => {
    const result = applyCuts([1, 5, 10, 15, 20], [12], ['<12', '>=12']);
    expect(result).toEqual(['<12', '<12', '<12', '>=12', '>=12']);
  });

  it('returns the single level for every value when cuts is empty', () => {
    const result = applyCuts([1, 5, 10, 15, 20], [], ['only']);
    expect(result).toEqual(['only', 'only', 'only', 'only', 'only']);
  });

  it('passes through null, NaN, and undefined as null', () => {
    const result = applyCuts([3.5, null, 7, NaN, 10, undefined], [6], ['lo', 'hi']);
    expect(result).toEqual(['lo', null, 'hi', null, 'hi', null]);
  });

  it('places a value exactly at a cut into the upper segment (cut is inclusive lower bound)', () => {
    // Two cuts at 47 and 89 → segments <47, 47-89, >=89
    // Value 47 belongs to the 47-89 segment (segments use cuts[i-1] <= v < cuts[i])
    // Value 89 belongs to the >=89 segment (v >= cuts[last])
    const result = applyCuts([1, 47, 89, 150], [47, 89], ['<47', '47-89', '>=89']);
    expect(result).toEqual(['<47', '47-89', '>=89', '>=89']);
  });
});
