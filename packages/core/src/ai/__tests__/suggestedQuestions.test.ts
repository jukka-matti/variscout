import { describe, it, expect } from 'vitest';
import { buildSuggestedQuestions } from '../suggestedQuestions';
import type { AIContext } from '../types';

const baseContext: AIContext = {
  process: { description: 'Test process' },
  filters: [],
  stats: { mean: 10, stdDev: 1, samples: 50 },
};

describe('buildSuggestedQuestions', () => {
  it('returns minimum 3 questions with fallbacks', () => {
    const result = buildSuggestedQuestions(baseContext);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('returns max 5 questions', () => {
    const context: AIContext = {
      ...baseContext,
      stats: { mean: 10, stdDev: 1, samples: 50, cpk: 0.8, cp: 1.0, passRate: 80 },
      violations: { outOfControl: 3, aboveUSL: 2, belowLSL: 1 },
      filters: [{ factor: 'Machine', values: ['Line A', 'Line B'] }],
      findings: { total: 2, byStatus: { observed: 1, analyzed: 1 }, keyDrivers: ['Line A'] },
    };
    const result = buildSuggestedQuestions(context);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('includes out-of-control question when violations present', () => {
    const context: AIContext = {
      ...baseContext,
      violations: { outOfControl: 5, aboveUSL: 0, belowLSL: 0 },
    };
    const result = buildSuggestedQuestions(context);
    expect(result[0]).toBe('Why are there 5 out-of-control points?');
  });

  it('uses singular for 1 out-of-control point', () => {
    const context: AIContext = {
      ...baseContext,
      violations: { outOfControl: 1, aboveUSL: 0, belowLSL: 0 },
    };
    const result = buildSuggestedQuestions(context);
    expect(result[0]).toBe('Why are there 1 out-of-control point?');
  });

  it('includes Cpk improvement question when Cpk < 1.33', () => {
    const context: AIContext = {
      ...baseContext,
      stats: { mean: 10, stdDev: 1, samples: 50, cpk: 0.95 },
    };
    const result = buildSuggestedQuestions(context);
    expect(result).toContain('How can I improve Cpk from 0.95?');
  });

  it('includes filter comparison question when filters active', () => {
    const context: AIContext = {
      ...baseContext,
      filters: [{ factor: 'Operator', values: ['Alice'] }],
    };
    const result = buildSuggestedQuestions(context);
    expect(result).toContain('What makes Alice different from others?');
  });

  it('includes findings question when key drivers exist', () => {
    const context: AIContext = {
      ...baseContext,
      findings: { total: 1, byStatus: { analyzed: 1 }, keyDrivers: ['Nozzle 3'] },
    };
    const result = buildSuggestedQuestions(context);
    expect(result).toContain('What should I investigate about Nozzle 3?');
  });

  it('includes stability question when Cpk >= 1.33', () => {
    const context: AIContext = {
      ...baseContext,
      stats: { mean: 10, stdDev: 1, samples: 50, cpk: 1.67 },
    };
    const result = buildSuggestedQuestions(context);
    expect(result).toContain('Is this process stable enough to reduce inspection?');
  });

  it('pads with fallbacks when few contextual questions', () => {
    const result = buildSuggestedQuestions(baseContext);
    expect(result).toContain('What does this analysis tell me?');
    expect(result).toContain('What should I look at next?');
  });

  it('does not duplicate fallback questions', () => {
    const result = buildSuggestedQuestions(baseContext);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  describe('investigation phase-aware questions', () => {
    it('returns diverging questions when phase is diverging', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'diverging',
          allHypotheses: [{ text: 'Root cause', status: 'untested' }],
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result).toContain('What other causes should we consider?');
    });

    it('returns converging questions when phase is converging', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'converging',
          allHypotheses: [
            { text: 'Supported', status: 'supported' },
            { text: 'Contradicted', status: 'contradicted' },
          ],
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result).toContain('Do the supported hypotheses form a coherent story?');
    });

    it('suggests uncovered categories during diverging', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'diverging',
          hypothesisTree: [
            { text: 'Machine issue', status: 'untested', factor: 'Machine', category: 'Equipment' },
          ],
          allHypotheses: [{ text: 'Machine issue', status: 'untested' }],
        },
      };
      const result = buildSuggestedQuestions(context);
      // Default category names are capitalized: Temporal, People, Material, Location
      expect(
        result.some(q => q.includes('Temporal') || q.includes('People') || q.includes('Material'))
      ).toBe(true);
    });

    it('returns initial questions when no hypotheses', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'initial',
          problemStatement: 'Cpk is below target',
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result).toContain('What factors should I investigate first?');
    });

    it('returns acting questions when actions exist', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'acting',
          allHypotheses: [{ text: 'Root cause', status: 'supported' }],
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result).toContain('Are the corrective actions addressing the root cause?');
    });
  });
});
