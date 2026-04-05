import { describe, it, expect } from 'vitest';
import { buildRole } from '../prompts/coScout/role';

describe('buildRole', () => {
  const role = buildRole();

  it('includes CoScout identity', () => {
    expect(role).toContain('You are CoScout');
    expect(role).toContain('quality engineering assistant');
    expect(role).toContain('VariScout');
  });

  it('includes four analytical tools', () => {
    expect(role).toContain('I-Chart');
    expect(role).toContain('Boxplot');
    expect(role).toContain('Pareto');
    expect(role).toContain('Capability');
  });

  it('includes Two Voices concept', () => {
    expect(role).toContain('Voice of the Process');
    expect(role).toContain('Voice of the Customer');
  });

  it('includes three investigation principles', () => {
    expect(role).toContain('Correlation, not causation');
    expect(role).toContain('Progressive stratification');
    expect(role).toContain('Iterative exploration');
  });

  it('includes response style guidance', () => {
    expect(role).toContain('2-4 sentences');
  });

  it('includes security instructions', () => {
    expect(role).toContain('Never invent data or statistics');
    expect(role).toContain('Do not fabricate');
  });

  it('includes confidence calibration with sample size thresholds', () => {
    expect(role).toContain('observations');
    expect(role).toContain('Fewer than 10');
    expect(role).toContain('Fewer than 30');
    expect(role).toContain('Fewer than 100');
    expect(role).toContain('100 or more');
  });

  it('includes REF marker guidance', () => {
    expect(role).toContain('[REF:');
    expect(role).toContain('[/REF]');
    expect(role).toContain('evidence-node');
    expect(role).toContain('evidence-edge');
    expect(role).toContain('document');
    expect(role).toContain('answer');
  });

  it('includes consolidated REF types list', () => {
    expect(role).toContain('boxplot, ichart, pareto, stats, yamazumi');
    expect(role).toContain('finding, question, dashboard, improvement');
  });

  it('does NOT contain dynamic data values', () => {
    // No specific eta-squared values
    expect(role).not.toMatch(/η²\s*[=≥<>]\s*\d/);
    // No specific Cpk numbers (other than examples)
    expect(role).not.toMatch(/Cpk\s*=\s*\d+\.\d+/);
    // No filter state
    expect(role).not.toContain('filtered to');
    expect(role).not.toContain('current filter');
    // No finding text
    expect(role).not.toContain('Finding:');
    // No investigation-specific state
    expect(role).not.toContain('Issue statement:');
    expect(role).not.toContain('Problem Statement:');
  });

  it('returns the same string on every call (deterministic)', () => {
    expect(buildRole()).toBe(buildRole());
  });
});
