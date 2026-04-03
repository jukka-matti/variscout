import { describe, it, expect } from 'vitest';
import { buildProblemStatement } from '../problemStatement';

describe('buildProblemStatement', () => {
  it('generates statement with Watson 3 questions', () => {
    const result = buildProblemStatement({
      outcome: 'Fill Weight',
      targetValue: 1.33,
      currentCpk: 0.62,
      targetDirection: 'reduce-variation',
      suspectedCauses: [
        { factor: 'Shift', level: 'Night', evidence: 0.34 },
        { factor: 'Head', level: '5-8', evidence: 0.22 },
      ],
    });
    expect(result).toContain('Fill Weight');
    expect(result).toContain('0.62');
    expect(result).toContain('1.33');
    expect(result).toContain('Shift');
    expect(result).toContain('Head');
    expect(result).toContain('Reduce variation in');
    expect(result).toContain('driven by');
    expect(result).toMatch(/\.$/);
  });

  it('handles increase direction', () => {
    const result = buildProblemStatement({
      outcome: 'Yield',
      targetDirection: 'increase',
      suspectedCauses: [{ factor: 'Temperature' }],
    });
    expect(result).toContain('Increase Yield');
  });

  it('handles decrease direction', () => {
    const result = buildProblemStatement({
      outcome: 'Defect Rate',
      targetDirection: 'decrease',
      suspectedCauses: [{ factor: 'Speed' }],
    });
    expect(result).toContain('Decrease Defect Rate');
  });

  it('handles no target value', () => {
    const result = buildProblemStatement({
      outcome: 'Cycle Time',
      suspectedCauses: [{ factor: 'Machine', evidence: 0.15 }],
    });
    expect(result).toContain('Cycle Time');
    expect(result).toContain('Machine');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('Cpk');
  });

  it('handles target value without current Cpk', () => {
    const result = buildProblemStatement({
      outcome: 'Diameter',
      targetValue: 1.5,
      suspectedCauses: [],
    });
    expect(result).toContain('to target 1.50');
    expect(result).not.toContain('Cpk');
  });

  it('handles no suspected causes', () => {
    const result = buildProblemStatement({
      outcome: 'Weight',
      suspectedCauses: [],
    });
    expect(result).toContain('Weight');
    expect(result).not.toContain('driven by');
  });

  it('includes evidence percentages', () => {
    const result = buildProblemStatement({
      outcome: 'Diameter',
      suspectedCauses: [{ factor: 'Tool', evidence: 0.28 }],
    });
    expect(result).toContain('28%');
  });

  it('includes factor level in parentheses', () => {
    const result = buildProblemStatement({
      outcome: 'Weight',
      suspectedCauses: [{ factor: 'Operator', level: 'B', evidence: 0.4 }],
    });
    expect(result).toContain('Operator (B)');
    expect(result).toContain('[40%]');
  });

  it('handles factor without level or evidence', () => {
    const result = buildProblemStatement({
      outcome: 'Pressure',
      suspectedCauses: [{ factor: 'Valve' }],
    });
    expect(result).toContain('driven by Valve');
    expect(result).not.toContain('(');
    expect(result).not.toContain('[');
  });

  it('defaults to reduce-variation when no direction specified', () => {
    const result = buildProblemStatement({
      outcome: 'Length',
      suspectedCauses: [],
    });
    expect(result).toContain('Reduce variation in Length');
  });

  describe('characteristicType direction derivation', () => {
    it('derives reduce-variation from nominal characteristicType', () => {
      const result = buildProblemStatement({
        outcome: 'Fill Weight',
        characteristicType: 'nominal',
        suspectedCauses: [],
      });
      expect(result).toContain('Reduce variation in Fill Weight');
    });

    it('derives decrease from smaller characteristicType', () => {
      const result = buildProblemStatement({
        outcome: 'Defect Rate',
        characteristicType: 'smaller',
        suspectedCauses: [],
      });
      expect(result).toContain('Decrease Defect Rate');
    });

    it('derives increase from larger characteristicType', () => {
      const result = buildProblemStatement({
        outcome: 'Yield',
        characteristicType: 'larger',
        suspectedCauses: [],
      });
      expect(result).toContain('Increase Yield');
    });

    it('explicit targetDirection takes precedence over characteristicType', () => {
      const result = buildProblemStatement({
        outcome: 'Cycle Time',
        targetDirection: 'decrease',
        characteristicType: 'nominal',
        suspectedCauses: [],
      });
      expect(result).toContain('Decrease Cycle Time');
      expect(result).not.toContain('Reduce variation in');
    });

    it('defaults to reduce-variation when neither targetDirection nor characteristicType is provided', () => {
      const result = buildProblemStatement({
        outcome: 'Pressure',
        suspectedCauses: [],
      });
      expect(result).toContain('Reduce variation in Pressure');
    });
  });
});
