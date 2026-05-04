import { describe, expect, it } from 'vitest';
import type { ProcessHub, OutcomeSpec } from '../../processHub';
import { DEFAULT_PROCESS_HUB, isProcessHubComplete } from '../../processHub';

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

describe('isProcessHubComplete', () => {
  const baseOutcome: OutcomeSpec = {
    columnName: 'weight_g',
    characteristicType: 'nominalIsBest',
  };

  it('returns true when processGoal and at least one outcome are present', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      processGoal: 'We mold barrels for medical customers.',
      outcomes: [baseOutcome],
    };
    expect(isProcessHubComplete(hub)).toBe(true);
  });

  it('returns false when processGoal is absent', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      outcomes: [baseOutcome],
    };
    expect(isProcessHubComplete(hub)).toBe(false);
  });

  it('returns false when processGoal is empty string', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      processGoal: '   ',
      outcomes: [baseOutcome],
    };
    expect(isProcessHubComplete(hub)).toBe(false);
  });

  it('returns false when outcomes array is absent', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      processGoal: 'We mold barrels.',
    };
    expect(isProcessHubComplete(hub)).toBe(false);
  });

  it('returns false when outcomes array is empty', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      processGoal: 'We mold barrels.',
      outcomes: [],
    };
    expect(isProcessHubComplete(hub)).toBe(false);
  });

  it('returns false when an outcome has an empty columnName', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      processGoal: 'We mold barrels.',
      outcomes: [{ columnName: '  ', characteristicType: 'nominalIsBest' }],
    };
    expect(isProcessHubComplete(hub)).toBe(false);
  });

  it('does not require primaryScopeDimensions', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      processGoal: 'We mold barrels.',
      outcomes: [baseOutcome],
      // primaryScopeDimensions intentionally omitted
    };
    expect(isProcessHubComplete(hub)).toBe(true);
  });

  it('accepts multiple outcomes', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      processGoal: 'We mold barrels.',
      outcomes: [
        { columnName: 'weight_g', characteristicType: 'nominalIsBest' },
        { columnName: 'length_mm', characteristicType: 'smallerIsBetter' },
      ],
    };
    expect(isProcessHubComplete(hub)).toBe(true);
  });
});
