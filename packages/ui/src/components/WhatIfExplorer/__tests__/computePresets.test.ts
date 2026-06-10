import { describe, it, expect } from 'vitest';
import { computePresets } from '../computePresets';
import type { SpecLimits, DataRow } from '@variscout/core';

// Deterministic factor data: two categories with distinct means + spreads.
// "Low" has the lowest mean AND lowest spread; "High" the highest mean + spread.
const factorData: DataRow[] = [
  { Team: 'Low', Y: 10 },
  { Team: 'Low', Y: 11 },
  { Team: 'Low', Y: 10 },
  { Team: 'Low', Y: 11 },
  { Team: 'High', Y: 20 },
  { Team: 'High', Y: 26 },
  { Team: 'High', Y: 18 },
  { Team: 'High', Y: 28 },
];

const currentStats = { mean: 16, stdDev: 7, median: 16 };

const meanPresetLabels = (presets: { label: string }[]) =>
  presets.filter(p => /\bmean$/.test(p.label) || /\bfully$/.test(p.label)).map(p => p.label);

const spreadPresetLabels = (presets: { label: string }[]) =>
  presets.filter(p => /\bspread$/.test(p.label)).map(p => p.label);

describe('computePresets — degenerate "best" guard', () => {
  it('suppresses mean-anchored presets when no direction is inferable (empty specs)', () => {
    const specs: SpecLimits = {};
    const presets = computePresets(currentStats, specs, factorData, 'Y', 'Team');

    // No "Match X mean" / "Match X fully" presets — there is no direction.
    expect(meanPresetLabels(presets)).toHaveLength(0);

    // The spread comparison is direction-independent and MUST survive.
    expect(spreadPresetLabels(presets).length).toBeGreaterThan(0);
  });

  it('produces direction-correct mean presets when characteristicType is smaller', () => {
    const specs: SpecLimits = { characteristicType: 'smaller' };
    const presets = computePresets(currentStats, specs, factorData, 'Y', 'Team');

    // "Match best mean" should appear and reference the lowest-mean category ("Low").
    const meanPreset = presets.find(p => /\bmean$/.test(p.label));
    expect(meanPreset).toBeDefined();
    expect(meanPreset?.description).toContain('Low');
    // Smaller-is-better: shift mean DOWN toward the best (lower) category.
    expect(meanPreset?.meanShift).toBeLessThan(0);

    // Spread preset still present.
    expect(spreadPresetLabels(presets).length).toBeGreaterThan(0);
  });

  it('produces direction-correct mean presets when characteristicType is larger', () => {
    const specs: SpecLimits = { characteristicType: 'larger' };
    const presets = computePresets(currentStats, specs, factorData, 'Y', 'Team');

    const meanPreset = presets.find(p => /\bmean$/.test(p.label));
    expect(meanPreset).toBeDefined();
    expect(meanPreset?.description).toContain('High');
    // Larger-is-better: shift mean UP toward the best (higher) category.
    expect(meanPreset?.meanShift).toBeGreaterThan(0);
  });

  it('does not emit a "Match X fully" preset when direction is unknown', () => {
    const specs: SpecLimits = {};
    const presets = computePresets(currentStats, specs, factorData, 'Y', 'Team');
    expect(presets.some(p => /\bfully$/.test(p.label))).toBe(false);
  });
});
