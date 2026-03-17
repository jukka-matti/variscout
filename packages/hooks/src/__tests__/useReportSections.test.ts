import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReportSections } from '../useReportSections';
import type { Finding, Hypothesis } from '@variscout/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Test finding',
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h-1',
    text: 'Test hypothesis',
    status: 'untested',
    linkedFindingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const baseOptions = {
  findings: [] as Finding[],
  hypotheses: [] as Hypothesis[],
  stagedComparison: false,
  aiEnabled: false,
};

// ---------------------------------------------------------------------------
// Report type detection
// ---------------------------------------------------------------------------

describe('useReportSections — report type detection', () => {
  it('returns quick-check when there are no findings', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    expect(result.current.reportType).toBe('quick-check');
  });

  it('returns deep-dive when findings exist but no actions', () => {
    const findings = [makeFinding({ id: 'f-1' }), makeFinding({ id: 'f-2' })];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.reportType).toBe('deep-dive');
  });

  it('returns deep-dive when findings have actions but no outcome', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'Fix something', createdAt: Date.now() }],
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.reportType).toBe('deep-dive');
  });

  it('returns full-cycle when findings have actions AND outcome', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [
          { id: 'a-1', text: 'Fix something', completedAt: Date.now(), createdAt: Date.now() },
        ],
        outcome: { effective: 'yes', notes: 'Process improved', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.reportType).toBe('full-cycle');
  });
});

// ---------------------------------------------------------------------------
// Section count
// ---------------------------------------------------------------------------

describe('useReportSections — section count', () => {
  it('always returns exactly 5 sections', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    expect(result.current.sections).toHaveLength(5);
  });

  it('always returns 5 sections for full-cycle report', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'action', completedAt: Date.now(), createdAt: Date.now() }],
        outcome: { effective: 'yes', notes: 'done', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.sections).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Section statuses
// ---------------------------------------------------------------------------

describe('useReportSections — section status (quick-check)', () => {
  it('steps 1 and 2 are active, steps 3–5 are future', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    const { sections } = result.current;
    expect(sections[0].status).toBe('active'); // current-condition
    expect(sections[1].status).toBe('active'); // drivers
    expect(sections[2].status).toBe('future'); // hypotheses
    expect(sections[3].status).toBe('future'); // actions
    expect(sections[4].status).toBe('future'); // verification
  });
});

describe('useReportSections — section status (deep-dive)', () => {
  it('steps 1–3 are active, steps 4–5 are future', () => {
    const findings = [makeFinding()];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const { sections } = result.current;
    expect(sections[0].status).toBe('active'); // current-condition
    expect(sections[1].status).toBe('active'); // drivers
    expect(sections[2].status).toBe('active'); // hypotheses
    expect(sections[3].status).toBe('future'); // actions
    expect(sections[4].status).toBe('future'); // verification
  });
});

describe('useReportSections — section status (full-cycle)', () => {
  it('all 5 sections are done', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'action', completedAt: Date.now(), createdAt: Date.now() }],
        outcome: { effective: 'yes', notes: 'done', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const { sections } = result.current;
    expect(sections.every(s => s.status === 'done')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Step 3 title adaptation
// ---------------------------------------------------------------------------

describe('useReportSections — step 3 title', () => {
  it('uses default title when no hypotheses', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    const hypothesesSection = result.current.sections.find(s => s.id === 'hypotheses');
    expect(hypothesesSection?.title).toBe('Why is this happening?');
  });

  it('uses hypothesis text in title when hypotheses exist', () => {
    const hypotheses = [makeHypothesis({ text: 'machine vibration' })];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, hypotheses }));
    const hypothesesSection = result.current.sections.find(s => s.id === 'hypotheses');
    expect(hypothesesSection?.title).toMatch(/^What causes/);
    expect(hypothesesSection?.title).toContain('machine vibration');
  });

  it('falls back to default title when first hypothesis has empty text', () => {
    const hypotheses = [makeHypothesis({ text: '' })];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, hypotheses }));
    const hypothesesSection = result.current.sections.find(s => s.id === 'hypotheses');
    expect(hypothesesSection?.title).toBe('Why is this happening?');
  });
});

// ---------------------------------------------------------------------------
// Section IDs and step numbers
// ---------------------------------------------------------------------------

describe('useReportSections — section ordering', () => {
  it('sections have correct ids in order', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    const ids = result.current.sections.map(s => s.id);
    expect(ids).toEqual(['current-condition', 'drivers', 'hypotheses', 'actions', 'verification']);
  });

  it('sections have sequential step numbers 1–5', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    const stepNumbers = result.current.sections.map(s => s.stepNumber);
    expect(stepNumbers).toEqual([1, 2, 3, 4, 5]);
  });
});

// ---------------------------------------------------------------------------
// hasAIContent
// ---------------------------------------------------------------------------

describe('useReportSections — hasAIContent', () => {
  it('hasAIContent follows aiEnabled flag', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions, aiEnabled: true }));
    const { sections } = result.current;
    // current-condition uses aiEnabled
    expect(sections[0].hasAIContent).toBe(true);
    // actions never has AI content
    expect(sections[3].hasAIContent).toBe(false);
  });

  it('drivers and verification get hasAIContent from stagedComparison too', () => {
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, aiEnabled: false, stagedComparison: true })
    );
    const { sections } = result.current;
    expect(sections[1].hasAIContent).toBe(true); // drivers
    expect(sections[4].hasAIContent).toBe(true); // verification
    expect(sections[0].hasAIContent).toBe(false); // current-condition (no aiEnabled, no staged)
  });
});
