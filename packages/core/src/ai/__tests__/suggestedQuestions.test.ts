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
          allQuestions: [{ id: 'h-1', text: 'Root cause', status: 'open' }],
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
          allQuestions: [
            { id: 'h-1', text: 'Supported', status: 'answered' },
            { id: 'h-2', text: 'Contradicted', status: 'ruled-out' },
          ],
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result).toContain('Do the answered questions form a coherent story?');
    });

    it('suggests uncovered categories during diverging', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'diverging',
          questionTree: [
            {
              id: 'h-1',
              text: 'Machine issue',
              status: 'open',
              factor: 'Machine',
              category: 'Equipment',
            },
          ],
          allQuestions: [{ id: 'h-1', text: 'Machine issue', status: 'open' }],
        },
      };
      const result = buildSuggestedQuestions(context);
      // Default category names are capitalized: Temporal, People, Material, Location
      expect(
        result.some(q => q.includes('Temporal') || q.includes('People') || q.includes('Material'))
      ).toBe(true);
    });

    it('returns initial questions when no questions exist', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'initial',
          issueStatement: 'Cpk is below target',
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result).toContain('Which chart should I examine first?');
    });

    it('returns improving questions when actions exist', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'improving',
          allQuestions: [{ id: 'h-1', text: 'Root cause', status: 'answered' }],
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result).toContain('Are the corrective actions addressing the suspected cause?');
      // Also check for Capability chart question
      expect(
        result.some(q => q.includes('Capability chart') || q.includes('corrective actions'))
      ).toBe(true);
    });

    it('returns verification-grounded questions when improving + staged with Cpk improvement', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'improving',
          allQuestions: [{ id: 'h-1', text: 'Root cause', status: 'answered' }],
        },
        stagedComparison: {
          stageNames: ['Before', 'After'],
          deltas: {
            meanShift: 0.1,
            variationRatio: 0.7,
            cpkDelta: 0.43,
            passRateDelta: null,
            outOfSpecReduction: 5.2,
          },
          colorCoding: {},
          cpkBefore: 0.89,
          cpkAfter: 1.32,
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(result.some(q => q.includes('0.89') && q.includes('1.32'))).toBe(true);
      expect(result.some(q => q.includes('sustaining controls'))).toBe(true);
      expect(result.some(q => q.includes('new patterns'))).toBe(true);
    });

    it('returns Cpk regression question when staged shows decline', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'improving',
          allQuestions: [{ id: 'h-1', text: 'Root cause', status: 'answered' }],
        },
        stagedComparison: {
          stageNames: ['Before', 'After'],
          deltas: {
            meanShift: 0.5,
            variationRatio: 1.3,
            cpkDelta: -0.2,
            passRateDelta: null,
            outOfSpecReduction: -1.0,
          },
          colorCoding: {},
          cpkBefore: 1.1,
          cpkAfter: 0.9,
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(
        result.some(q => q.includes('dropped') && q.includes('1.10') && q.includes('0.90'))
      ).toBe(true);
    });

    it('returns generic improving questions when staged but not in improving phase', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'converging',
          allQuestions: [{ id: 'h-1', text: 'Root cause', status: 'answered' }],
        },
        stagedComparison: {
          stageNames: ['Before', 'After'],
          deltas: {
            meanShift: 0.1,
            variationRatio: 0.8,
            cpkDelta: 0.3,
            passRateDelta: null,
            outOfSpecReduction: 0,
          },
          colorCoding: {},
          cpkBefore: 1.0,
          cpkAfter: 1.3,
        },
      };
      const result = buildSuggestedQuestions(context);
      // Should not contain verification questions (those are only for acting phase)
      expect(result.some(q => q.includes('sustained across categories'))).toBe(false);
      expect(result).toContain('Do the answered questions form a coherent story?');
    });

    it('returns idea-aware questions when converging with ideas', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'converging',
          allQuestions: [
            {
              id: 'h-1',
              text: 'Night shift training gap',
              status: 'answered',
              ideas: [
                { text: 'Simplify setup (visual guides)', selected: true },
                { text: 'Train night shift operators' },
              ],
            },
          ],
        },
      };
      const result = buildSuggestedQuestions(context);
      // Should include idea-specific questions instead of generic ideation
      expect(
        result.some(q => q.includes('Simplify setup') || q.includes('quickest improvement'))
      ).toBe(true);
    });

    it('returns ideation questions when converging without ideas', () => {
      const context: AIContext = {
        ...baseContext,
        investigation: {
          phase: 'converging',
          allQuestions: [{ id: 'h-1', text: 'Root cause confirmed', status: 'answered' }],
        },
      };
      const result = buildSuggestedQuestions(context);
      expect(
        result.some(q => q.includes('improvement options') || q.includes('reduce variation'))
      ).toBe(true);
    });
  });
});
