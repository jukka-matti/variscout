import { describe, expect, it } from 'vitest';
import { createTestOutcomeSpec } from './outcomeSpec';

describe('createTestOutcomeSpec', () => {
  it('returns a fully-formed OutcomeSpec with sensible defaults', () => {
    const spec = createTestOutcomeSpec();
    expect(spec.id).toMatch(/^outcome-/);
    expect(spec.hubId).toBe('hub-test');
    expect(spec.columnName).toBe('Diameter');
    expect(spec.characteristicType).toBe('nominalIsBest');
    expect(spec.target).toBe(10);
    expect(spec.lsl).toBe(9.5);
    expect(spec.usl).toBe(10.5);
    expect(spec.cpkTarget).toBe(1.33);
  });

  it('merges overrides over defaults', () => {
    const spec = createTestOutcomeSpec({
      columnName: 'Cycle_time',
      characteristicType: 'smallerIsBetter',
    });
    expect(spec.columnName).toBe('Cycle_time');
    expect(spec.characteristicType).toBe('smallerIsBetter');
    expect(spec.cpkTarget).toBe(1.33);
  });
});
