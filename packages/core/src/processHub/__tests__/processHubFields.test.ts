import { describe, expect, it } from 'vitest';
import type {
  ProcessHub,
  OutcomeSpec,
  ProcessHubInvestigationMetadata,
  ScopeFilter,
} from '../../processHub';
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

describe('canvas filter metadata fields', () => {
  it('backward-compat: existing investigation without new fields parses correctly', () => {
    const metadata: ProcessHubInvestigationMetadata = {
      processHubId: 'hub-001',
      investigationStatus: 'scouting',
    };
    expect(metadata.scopeFilter).toBeUndefined();
    expect(metadata.paretoGroupBy).toBeUndefined();
  });

  it('round-trip: scopeFilter and paretoGroupBy survive JSON serialisation', () => {
    const filter: ScopeFilter = { factor: 'product_id', values: ['A', 'B'] };
    const metadata: ProcessHubInvestigationMetadata = {
      processHubId: 'hub-001',
      scopeFilter: filter,
      paretoGroupBy: 'shift',
    };
    const roundTripped: ProcessHubInvestigationMetadata = JSON.parse(JSON.stringify(metadata));
    expect(roundTripped.scopeFilter).toEqual({ factor: 'product_id', values: ['A', 'B'] });
    expect(roundTripped.paretoGroupBy).toBe('shift');
  });

  it('ScopeFilter.values allows mixed string and number elements', () => {
    const filter: ScopeFilter = { factor: 'line_id', values: [1, 'B'] };
    const metadata: ProcessHubInvestigationMetadata = {
      scopeFilter: filter,
    };
    expect(metadata.scopeFilter?.values).toEqual([1, 'B']);
  });
});
