import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReportSections } from '../useReportSections';

describe('useReportSections with yamazumi mode', () => {
  const baseOptions = {
    findings: [],
    questions: [],
    stagedComparison: false,
    aiEnabled: false,
  };

  it('returns standard titles when analysisMode is undefined', () => {
    const { result } = renderHook(() => useReportSections(baseOptions));
    const step1 = result.current.sections.find(s => s.id === 'current-condition');
    expect(step1?.title).toContain('process');
  });

  it('returns yamazumi titles when analysisMode is yamazumi', () => {
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, analysisMode: 'yamazumi' })
    );
    const step1 = result.current.sections.find(s => s.id === 'current-condition');
    const step2 = result.current.sections.find(s => s.id === 'drivers');
    expect(step1?.title).toMatch(/time composition/i);
    expect(step2?.title).toMatch(/activity composition/i);
  });

  it('returns standard titles when analysisMode is standard', () => {
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, analysisMode: 'standard' })
    );
    const step1 = result.current.sections.find(s => s.id === 'current-condition');
    expect(step1?.title).not.toMatch(/time composition/i);
  });
});
