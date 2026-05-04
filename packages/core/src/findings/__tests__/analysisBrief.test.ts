import { describe, it, expect } from 'vitest';
import type { AnalysisBrief } from '../types';

describe('AnalysisBrief — moved to @variscout/core/findings', () => {
  it('accepts the same shape as the UI sketch', () => {
    const brief: AnalysisBrief = {
      issueStatement: 'Defect rate spiked Tuesday',
      questions: [{ text: 'Was the new resin lot the cause?', factor: 'resin_lot' }],
      target: { metric: 'defectRate', direction: 'minimize', value: 0.02 },
    };
    expect(brief.issueStatement).toContain('Tuesday');
    expect(brief.questions?.[0].factor).toBe('resin_lot');
  });
});
