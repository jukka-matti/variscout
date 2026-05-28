import { describe, it, expect } from 'vitest';
import { deriveExploreLandingView } from '../deriveExploreLandingView';
import type { DeriveExploreLandingViewInput } from '../deriveExploreLandingView';
import type { OutcomeSpec } from '../../processHub';
import type { ImprovementProjectFactorControl } from '../../improvementProject/types';
import type { ProcessStepEntry } from '../../improvementProject/types';

// ─── Minimal fixtures ─────────────────────────────────────────────────────────

function makeOutcomeSpec(columnName: string): OutcomeSpec {
  return {
    id: `os-${columnName}`,
    hubId: 'hub-1',
    columnName,
    characteristicType: 'nominalIsBest',
    createdAt: 0,
    deletedAt: null,
  };
}

function makeFactorControl(columnName: string): ImprovementProjectFactorControl {
  return {
    factor: columnName,
    targetCondition: 'any',
  };
}

function makeProcessStep(id: string, name: string, order: number): ProcessStepEntry {
  return { id, name, order };
}

function emptyInput(): DeriveExploreLandingViewInput {
  return {
    outcomeSpecs: [],
    factorControls: [],
    processSteps: [],
    categoricalValuesByColumn: {},
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('deriveExploreLandingView', () => {
  // 1. disabled — empty outcomeSpecs
  it('returns disabled route when outcomeSpecs is empty', () => {
    const result = deriveExploreLandingView(emptyInput());
    expect(result.isEnabled).toBe(false);
    expect(result.routeKey).toBe('disabled');
    expect(result.previewText).toBe('Set an outcome to unlock Explore');
    expect(result.focusedChart).toBeNull();
    expect(result.boxplotFactor).toBeUndefined();
  });

  // 2. y-only — Y, no factors, no steps, no categoricals
  it('returns y-only route when there are outcomes but no factors, steps, or categoricals', () => {
    const result = deriveExploreLandingView({
      ...emptyInput(),
      outcomeSpecs: [makeOutcomeSpec('Yield')],
    });
    expect(result.routeKey).toBe('y-only');
    expect(result.focusedChart).toBe('ichart');
    expect(result.boxplotFactor).toBeUndefined();
    expect(result.previewText).toBe('will land on I-Chart of Yield');
    expect(result.isEnabled).toBe(true);
  });

  // 3. y-plus-one-factor — Y + 1 raw factor
  it('returns y-plus-one-factor when there is exactly 1 raw factor control', () => {
    const result = deriveExploreLandingView({
      ...emptyInput(),
      outcomeSpecs: [makeOutcomeSpec('Yield')],
      factorControls: [makeFactorControl('Vessel')],
    });
    expect(result.routeKey).toBe('y-plus-one-factor');
    expect(result.focusedChart).toBe('boxplot');
    expect(result.boxplotFactor).toBe('Vessel');
    expect(result.previewText).toContain('by Vessel');
    expect(result.isEnabled).toBe(true);
  });

  // 4. y-plus-one-factor — Y + 0 raw + 1 D3 categorical
  it('returns y-plus-one-factor when there are no raw factors but 1 D3-derived categorical', () => {
    const result = deriveExploreLandingView({
      ...emptyInput(),
      outcomeSpecs: [makeOutcomeSpec('Yield')],
      categoricalValuesByColumn: { 'Order_Date.day-of-week': ['Mon', 'Tue'] },
    });
    expect(result.routeKey).toBe('y-plus-one-factor');
    expect(result.focusedChart).toBe('boxplot');
    expect(result.boxplotFactor).toBe('Order_Date.day-of-week');
    expect(result.previewText).toContain('by Order_Date.day-of-week');
    expect(result.isEnabled).toBe(true);
  });

  // 5. y-plus-multi-factor — Y + 2 raw factors
  it('returns y-plus-multi-factor when there are 2 raw factor controls', () => {
    const result = deriveExploreLandingView({
      ...emptyInput(),
      outcomeSpecs: [makeOutcomeSpec('Yield')],
      factorControls: [makeFactorControl('Vessel'), makeFactorControl('Operator')],
    });
    expect(result.routeKey).toBe('y-plus-multi-factor');
    expect(result.focusedChart).toBe('boxplot');
    expect(result.boxplotFactor).toBe('Vessel');
    expect(result.previewText).toBe('will land on I-Chart + Boxplot — pick from 2 factors');
    expect(result.isEnabled).toBe(true);
  });

  // 6. y-plus-multi-factor — Y + 1 raw + 1 D3 categorical
  it('returns y-plus-multi-factor when combining 1 raw factor and 1 D3 categorical', () => {
    const result = deriveExploreLandingView({
      ...emptyInput(),
      outcomeSpecs: [makeOutcomeSpec('Yield')],
      factorControls: [makeFactorControl('Vessel')],
      categoricalValuesByColumn: { 'Order_Date.month': ['Jan', 'Feb'] },
    });
    expect(result.routeKey).toBe('y-plus-multi-factor');
    expect(result.focusedChart).toBe('boxplot');
    // Raw factors precede D3 derivatives in ordering
    expect(result.boxplotFactor).toBe('Vessel');
    expect(result.previewText).toContain('pick from 2 factors');
    expect(result.isEnabled).toBe(true);
  });

  // 7. y-plus-process — Y + processSteps (no factors)
  it('returns y-plus-process when there are processSteps and no factors', () => {
    const result = deriveExploreLandingView({
      ...emptyInput(),
      outcomeSpecs: [makeOutcomeSpec('Yield')],
      processSteps: [makeProcessStep('s1', 'Step Name', 0)],
    });
    expect(result.routeKey).toBe('y-plus-process');
    expect(result.focusedChart).toBe('boxplot');
    expect(result.boxplotFactor).toBe('Step Name');
    expect(result.previewText).toBe('will land on Boxplot by Step');
    expect(result.isEnabled).toBe(true);
  });

  // 8. y-plus-process precedence — Y + processSteps + factors
  it('returns y-plus-process even when there are also factor controls (process beats factor)', () => {
    const result = deriveExploreLandingView({
      ...emptyInput(),
      outcomeSpecs: [makeOutcomeSpec('Yield')],
      factorControls: [makeFactorControl('Vessel')],
      processSteps: [makeProcessStep('s1', 'Mixing', 0)],
    });
    expect(result.routeKey).toBe('y-plus-process');
    expect(result.boxplotFactor).toBe('Mixing');
    expect(result.isEnabled).toBe(true);
  });

  // 9. Purity — same input produces same output
  it('is a pure function: calling twice with the same input yields equal results', () => {
    const input: DeriveExploreLandingViewInput = {
      outcomeSpecs: [makeOutcomeSpec('Throughput')],
      factorControls: [makeFactorControl('ShiftA'), makeFactorControl('Line')],
      processSteps: [],
      categoricalValuesByColumn: { 'Date.month': ['Jan'] },
    };
    const result1 = deriveExploreLandingView(input);
    const result2 = deriveExploreLandingView(input);
    expect(result1).toEqual(result2);
  });
});
