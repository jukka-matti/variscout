import { describe, expect, it } from 'vitest';
import { defaultSpecsFor, inferOutcomeCharacteristicType } from '../characteristicTypeDefaults';

describe('defaultSpecsFor', () => {
  it('returns target=mean and cpkTarget for nominalIsBest', () => {
    const result = defaultSpecsFor('nominalIsBest', { mean: 10, sigma: 1 });
    expect(result).toEqual({ target: 10, cpkTarget: 1.33 });
  });

  it('returns target=0 and cpkTarget for smallerIsBetter', () => {
    const result = defaultSpecsFor('smallerIsBetter', { mean: 5, sigma: 1 });
    expect(result).toEqual({ target: 0, cpkTarget: 1.33 });
  });

  it('returns only cpkTarget for largerIsBetter', () => {
    const result = defaultSpecsFor('largerIsBetter', { mean: 80, sigma: 5 });
    expect(result).toEqual({ cpkTarget: 1.33 });
  });
});

describe('inferOutcomeCharacteristicType', () => {
  it('detects smallerIsBetter from defect/reject/scrap/fail keywords', () => {
    expect(inferOutcomeCharacteristicType('defect_count')).toBe('smallerIsBetter');
    expect(inferOutcomeCharacteristicType('reject_rate')).toBe('smallerIsBetter');
    expect(inferOutcomeCharacteristicType('scrap_kg')).toBe('smallerIsBetter');
    expect(inferOutcomeCharacteristicType('fail_count')).toBe('smallerIsBetter');
  });

  it('detects largerIsBetter from yield/uptime/throughput keywords', () => {
    expect(inferOutcomeCharacteristicType('yield_pct')).toBe('largerIsBetter');
    expect(inferOutcomeCharacteristicType('uptime_h')).toBe('largerIsBetter');
    expect(inferOutcomeCharacteristicType('throughput_units_per_hour')).toBe('largerIsBetter');
  });

  it('falls back to nominalIsBest when no keyword matches', () => {
    expect(inferOutcomeCharacteristicType('weight_g')).toBe('nominalIsBest');
    expect(inferOutcomeCharacteristicType('Var1')).toBe('nominalIsBest');
  });

  it('is case-insensitive', () => {
    expect(inferOutcomeCharacteristicType('Defect_Count')).toBe('smallerIsBetter');
    expect(inferOutcomeCharacteristicType('YIELD_PCT')).toBe('largerIsBetter');
  });
});
