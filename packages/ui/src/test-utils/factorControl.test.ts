import { describe, expect, it } from 'vitest';
import { createTestFactorControl } from './factorControl';

describe('createTestFactorControl', () => {
  it('returns sensible defaults', () => {
    const c = createTestFactorControl();
    expect(c.factor).toBe('Temperature');
    expect(c.targetCondition).toBe('120 ± 5°C');
    expect(c.linkedHypothesisId).toBeUndefined();
    expect(c.stepId).toBeUndefined();
  });

  it('merges overrides', () => {
    const c = createTestFactorControl({ factor: 'Pressure', stepId: 's-mix' });
    expect(c.factor).toBe('Pressure');
    expect(c.stepId).toBe('s-mix');
    expect(c.targetCondition).toBe('120 ± 5°C');
  });
});
