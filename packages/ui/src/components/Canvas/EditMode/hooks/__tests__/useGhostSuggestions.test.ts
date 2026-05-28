import { describe, it, expect } from 'vitest';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';
import { useGhostSuggestions } from '../useGhostSuggestions';

// ---------------------------------------------------------------------------
// Minimal typed fixture helpers (unit-level; not exercising real parser internals)
// ---------------------------------------------------------------------------

function makeNumericProfile(
  columnName: string,
  confidence: number = 95,
  status: ColumnParsingProfile['status'] = 'ok'
): ColumnParsingProfile {
  return {
    columnName,
    status,
    confidence,
    primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}

function makeCategoricalProfile(columnName: string, confidence: number = 95): ColumnParsingProfile {
  return {
    columnName,
    status: 'ok',
    confidence,
    primary: { kind: 'categorical', label: 'categorical · 3 levels', detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}

function makeOutcomeSpec(columnName: string): OutcomeSpec {
  return {
    id: `os-${columnName}`,
    hubId: 'hub-1',
    columnName,
    characteristicType: 'largerIsBetter',
  };
}

function makeFactorControl(factor: string): ImprovementProjectFactorControl {
  return {
    factor,
    targetCondition: '95',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGhostSuggestions', () => {
  it('bound column in outcomeSpecs returns null even if name matches outcome regex', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('yield_pct')],
      outcomeSpecs: [makeOutcomeSpec('yield_pct')],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['yield_pct']).toBeNull();
  });

  it('bound column in factorControls returns null', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('temperature')],
      outcomeSpecs: [],
      factorControls: [makeFactorControl('temperature')],
      stepBindingColumns: [],
    });
    expect(result['temperature']).toBeNull();
  });

  it('bound column in stepBindingColumns returns null', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('pressure')],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: ['pressure'],
    });
    expect(result['pressure']).toBeNull();
  });

  it('line_yield numeric, confidence=95, status=ok, not bound → outcome (matches _yield suffix)', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('line_yield', 95)],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['line_yield']).toBe('outcome');
  });

  it('temperature numeric, confidence=95, status=ok, not bound → factor', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('temperature', 95)],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['temperature']).toBe('factor');
  });

  it('temperature numeric, confidence=50 (below threshold) → null', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('temperature', 50)],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['temperature']).toBeNull();
  });

  it('vessel_id categorical, confidence=95 → null', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeCategoricalProfile('vessel_id', 95)],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['vessel_id']).toBeNull();
  });

  it('numeric profile with status=warning → null even if high confidence', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('temperature', 95, 'warning')],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['temperature']).toBeNull();
  });

  it('case insensitivity on outcome regex: YIELD_PCT_YIELD matches _yield suffix', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('YIELD_PCT_YIELD', 95)],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['YIELD_PCT_YIELD']).toBe('outcome');
  });

  it('_throughput suffix → outcome', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('line_throughput', 95)],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['line_throughput']).toBe('outcome');
  });

  it('_defect_rate suffix → outcome', () => {
    const result = useGhostSuggestions({
      columnProfiles: [makeNumericProfile('unit_defect_rate', 95)],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result['unit_defect_rate']).toBe('outcome');
  });

  it('returns an empty record when columnProfiles is empty', () => {
    const result = useGhostSuggestions({
      columnProfiles: [],
      outcomeSpecs: [],
      factorControls: [],
      stepBindingColumns: [],
    });
    expect(result).toEqual({});
  });

  it('multiple columns: mix of bound, outcome-suggested, factor-suggested', () => {
    const result = useGhostSuggestions({
      columnProfiles: [
        makeNumericProfile('yield_pct', 95),
        makeNumericProfile('temperature', 95),
        makeNumericProfile('pressure', 95),
        makeCategoricalProfile('line_id'),
      ],
      outcomeSpecs: [makeOutcomeSpec('yield_pct')],
      factorControls: [makeFactorControl('pressure')],
      stepBindingColumns: [],
    });
    expect(result['yield_pct']).toBeNull(); // bound
    expect(result['pressure']).toBeNull(); // bound
    expect(result['temperature']).toBe('factor');
    expect(result['line_id']).toBeNull(); // categorical
  });
});
