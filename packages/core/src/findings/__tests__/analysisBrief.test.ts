import { describe, it, expect } from 'vitest';
import type { AnalysisBrief } from '../types';

describe('AnalysisBrief — moved to @variscout/core/findings', () => {
  it('accepts issueStatement and target (ADR-085: questions field removed)', () => {
    const brief: AnalysisBrief = {
      issueStatement: 'Defect rate spiked Tuesday',
      target: { metric: 'defectRate', direction: 'minimize', value: 0.02 },
    };
    expect(brief.issueStatement).toContain('Tuesday');
    expect(brief.target?.metric).toBe('defectRate');
    expect(brief.target?.value).toBe(0.02);
  });

  it('accepts hypothesisDraft field', () => {
    const brief: AnalysisBrief = {
      issueStatement: 'Resin lot causing defects',
      hypothesisDraft: 'New resin lot from supplier X has different viscosity',
    };
    expect(brief.hypothesisDraft).toContain('viscosity');
  });
});
