import { describe, it, expect } from 'vitest';
import { buildDashboardSummaryPrompt } from '../prompts/dashboardSummary';
import type { AIContext } from '../types';

/** Minimal valid AIContext with no optional fields populated. */
function makeContext(overrides: Partial<AIContext> = {}): AIContext {
  return {
    process: {},
    filters: [],
    ...overrides,
  };
}

describe('buildDashboardSummaryPrompt', () => {
  it('includes instruction for 1-3 sentence summary', () => {
    const prompt = buildDashboardSummaryPrompt(makeContext());
    expect(prompt).toContain('1-3 sentence');
  });

  it('includes stats summary with samples and Cpk when present', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        stats: { mean: 10.5, stdDev: 0.5, samples: 120, cpk: 1.33 },
      })
    );
    expect(prompt).toContain('120 samples');
    expect(prompt).toContain('mean=10.50');
    expect(prompt).toContain('Cpk=1.33');
  });

  it('includes stats summary without Cpk when not provided', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        stats: { mean: 5.0, stdDev: 0.2, samples: 50 },
      })
    );
    expect(prompt).toContain('50 samples');
    expect(prompt).toContain('mean=5.00');
    expect(prompt).not.toContain('Cpk=');
  });

  it('includes findings count and status breakdown when findings are present', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        findings: {
          total: 5,
          byStatus: { observed: 2, investigating: 2, analyzed: 1 },
          keyDrivers: ['Machine A', 'Shift 2'],
        },
      })
    );
    expect(prompt).toContain('5 total');
    expect(prompt).toContain('2 observed');
    expect(prompt).toContain('2 investigating');
    expect(prompt).toContain('1 analyzed');
    expect(prompt).toContain('2 key drivers');
  });

  it('includes question summary with answered question names when present', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        investigation: {
          allQuestions: [
            { id: 'h1', text: 'Machine vibration', status: 'answered' },
            { id: 'h2', text: 'Raw material batch', status: 'open' },
            { id: 'h3', text: 'Operator technique', status: 'ruled-out' },
          ],
        },
      })
    );
    expect(prompt).toContain('3 total');
    expect(prompt).toContain('1 answered');
    expect(prompt).toContain('Machine vibration');
    expect(prompt).toContain('1 open');
    expect(prompt).toContain('1 ruled out');
  });

  it('includes investigation phase when present', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        investigation: {
          phase: 'validating',
        },
      })
    );
    expect(prompt).toContain('Investigation phase: validating');
  });

  it('uses findings-focused instruction when findings exist', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        findings: {
          total: 3,
          byStatus: { observed: 3 },
          keyDrivers: [],
        },
      })
    );
    expect(prompt).toContain('overdue actions');
    expect(prompt).not.toContain('examine next based on the data');
  });

  it('uses data-exploration instruction when no findings exist', () => {
    const prompt = buildDashboardSummaryPrompt(makeContext());
    expect(prompt).toContain('examine next based on the data');
    expect(prompt).not.toContain('overdue actions');
  });

  it('handles empty project gracefully with no stats, findings, or questions', () => {
    const prompt = buildDashboardSummaryPrompt(makeContext());
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain('1-3 sentence');
    // Should not throw or produce undefined sections
    expect(prompt).not.toContain('undefined');
    expect(prompt).not.toContain('null');
  });

  it('omits findings section when total is zero', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        findings: {
          total: 0,
          byStatus: {},
          keyDrivers: [],
        },
      })
    );
    expect(prompt).not.toContain('Findings:');
  });

  it('returns a string', () => {
    const prompt = buildDashboardSummaryPrompt(makeContext());
    expect(typeof prompt).toBe('string');
  });
});
