import { describe, expect, it } from 'vitest';
import type { ProcessHub, OutcomeSpec } from '../../processHub';
import { DEFAULT_PROCESS_HUB } from '../../processHub';

describe('ProcessHub framing-layer fields', () => {
  it('accepts a process goal narrative', () => {
    const hub: ProcessHub = { ...DEFAULT_PROCESS_HUB, processGoal: 'We mold barrels.' };
    expect(hub.processGoal).toBe('We mold barrels.');
  });

  it('accepts a list of outcome specs', () => {
    const outcome: OutcomeSpec = {
      columnName: 'weight_g',
      characteristicType: 'nominalIsBest',
      target: 4.5,
      lsl: 4.2,
      usl: 4.8,
      cpkTarget: 1.33,
    };
    const hub: ProcessHub = { ...DEFAULT_PROCESS_HUB, outcomes: [outcome] };
    expect(hub.outcomes?.[0]?.columnName).toBe('weight_g');
  });

  it('accepts primary scope dimensions', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      primaryScopeDimensions: ['product_id', 'shift'],
    };
    expect(hub.primaryScopeDimensions).toEqual(['product_id', 'shift']);
  });

  it('omits new fields by default (backward-compatible)', () => {
    const hub: ProcessHub = { ...DEFAULT_PROCESS_HUB };
    expect(hub.processGoal).toBeUndefined();
    expect(hub.outcomes).toBeUndefined();
    expect(hub.primaryScopeDimensions).toBeUndefined();
  });
});
