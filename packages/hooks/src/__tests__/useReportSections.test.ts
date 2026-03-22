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
  it('returns analysis-snapshot when there are no findings', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    expect(result.current.reportType).toBe('analysis-snapshot');
  });

  it('returns investigation-report when findings exist but no actions', () => {
    const findings = [makeFinding({ id: 'f-1' }), makeFinding({ id: 'f-2' })];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.reportType).toBe('investigation-report');
  });

  it('returns investigation-report when findings have actions but no outcome', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'Fix something', createdAt: Date.now() }],
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.reportType).toBe('investigation-report');
  });

  it('returns improvement-story when findings have actions AND outcome', () => {
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
    expect(result.current.reportType).toBe('improvement-story');
  });
});

// ---------------------------------------------------------------------------
// Section count
// ---------------------------------------------------------------------------

describe('useReportSections — section count', () => {
  it('returns 2 sections for analysis-snapshot', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    expect(result.current.sections).toHaveLength(2);
  });

  it('returns 3 sections for investigation-report', () => {
    const findings = [makeFinding({ id: 'f-1' })];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.sections).toHaveLength(3);
  });

  it('returns 6 sections for improvement-story', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'action', completedAt: Date.now(), createdAt: Date.now() }],
        outcome: { effective: 'yes', notes: 'done', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    expect(result.current.sections).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// Section statuses
// ---------------------------------------------------------------------------

describe('useReportSections — section status (analysis-snapshot)', () => {
  it('both sections are active', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    const { sections } = result.current;
    expect(sections[0].status).toBe('active'); // current-condition
    expect(sections[1].status).toBe('active'); // drivers
  });
});

describe('useReportSections — section status (investigation-report)', () => {
  it('all 3 sections are active', () => {
    const findings = [makeFinding()];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const { sections } = result.current;
    expect(sections[0].status).toBe('active'); // current-condition
    expect(sections[1].status).toBe('active'); // drivers
    expect(sections[2].status).toBe('active'); // evidence-trail
  });
});

describe('useReportSections — section status (improvement-story)', () => {
  it('all 6 sections are done', () => {
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
// Workspace assignment
// ---------------------------------------------------------------------------

describe('useReportSections — workspace assignment', () => {
  it('analysis-snapshot sections are in analysis workspace', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    const { sections } = result.current;
    expect(sections[0].workspace).toBe('analysis');
    expect(sections[1].workspace).toBe('analysis');
  });

  it('investigation-report has analysis and findings workspaces', () => {
    const findings = [makeFinding()];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const { sections } = result.current;
    expect(sections[0].workspace).toBe('analysis');
    expect(sections[1].workspace).toBe('analysis');
    expect(sections[2].workspace).toBe('findings');
  });

  it('improvement-story has all three workspaces', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'action', completedAt: Date.now(), createdAt: Date.now() }],
        outcome: { effective: 'yes', notes: 'done', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const { sections } = result.current;
    expect(sections[0].workspace).toBe('analysis'); // current-condition
    expect(sections[1].workspace).toBe('analysis'); // drivers
    expect(sections[2].workspace).toBe('findings'); // evidence-trail
    expect(sections[3].workspace).toBe('improvement'); // improvement-plan
    expect(sections[4].workspace).toBe('improvement'); // actions-taken
    expect(sections[5].workspace).toBe('improvement'); // verification
  });
});

// ---------------------------------------------------------------------------
// Section IDs and step numbers
// ---------------------------------------------------------------------------

describe('useReportSections — section ordering', () => {
  it('analysis-snapshot has correct ids', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    const ids = result.current.sections.map(s => s.id);
    expect(ids).toEqual(['current-condition', 'drivers']);
  });

  it('investigation-report has correct ids', () => {
    const findings = [makeFinding()];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const ids = result.current.sections.map(s => s.id);
    expect(ids).toEqual(['current-condition', 'drivers', 'evidence-trail']);
  });

  it('improvement-story has correct ids', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'action', completedAt: Date.now(), createdAt: Date.now() }],
        outcome: { effective: 'yes', notes: 'done', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const ids = result.current.sections.map(s => s.id);
    expect(ids).toEqual([
      'current-condition',
      'drivers',
      'evidence-trail',
      'improvement-plan',
      'actions-taken',
      'verification',
    ]);
  });

  it('improvement-story has sequential step numbers 1-6', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'action', completedAt: Date.now(), createdAt: Date.now() }],
        outcome: { effective: 'yes', notes: 'done', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const stepNumbers = result.current.sections.map(s => s.stepNumber);
    expect(stepNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

// ---------------------------------------------------------------------------
// Evidence trail title adaptation
// ---------------------------------------------------------------------------

describe('useReportSections — evidence trail title', () => {
  it('uses default title when no hypotheses', () => {
    const findings = [makeFinding()];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const evidenceSection = result.current.sections.find(s => s.id === 'evidence-trail');
    expect(evidenceSection?.title).toBe('Why is this happening?');
  });

  it('uses hypothesis text in title when hypotheses exist', () => {
    const findings = [makeFinding()];
    const hypotheses = [makeHypothesis({ text: 'machine vibration' })];
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, findings, hypotheses })
    );
    const evidenceSection = result.current.sections.find(s => s.id === 'evidence-trail');
    expect(evidenceSection?.title).toMatch(/^What causes/);
    expect(evidenceSection?.title).toContain('machine vibration');
  });

  it('improvement-story evidence trail uses "What did we find?" title', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [{ id: 'a-1', text: 'action', completedAt: Date.now(), createdAt: Date.now() }],
        outcome: { effective: 'yes', notes: 'done', verifiedAt: Date.now() },
      }),
    ];
    const { result } = renderHook(() => useReportSections({ ...baseOptions, findings }));
    const evidenceSection = result.current.sections.find(s => s.id === 'evidence-trail');
    expect(evidenceSection?.title).toBe('What did we find?');
  });
});

// ---------------------------------------------------------------------------
// Audience mode
// ---------------------------------------------------------------------------

describe('useReportSections — audience mode', () => {
  it('defaults to technical', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    expect(result.current.audienceMode).toBe('technical');
  });

  it('passes through summary mode', () => {
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, audienceMode: 'summary' })
    );
    expect(result.current.audienceMode).toBe('summary');
  });
});

// ---------------------------------------------------------------------------
// Mode-aware titles
// ---------------------------------------------------------------------------

describe('useReportSections — mode-aware titles', () => {
  it('uses capability titles when isCapabilityMode is true', () => {
    const { result } = renderHook(() =>
      useReportSections({
        ...baseOptions,
        analysisMode: 'standard',
        isCapabilityMode: true,
      })
    );
    expect(result.current.sections[0].title).toBe('Is capability meeting target?');
    expect(result.current.sections[1].title).toBe('What drives capability differences?');
  });

  it('uses performance titles when analysisMode is performance', () => {
    const { result } = renderHook(() =>
      useReportSections({
        ...baseOptions,
        analysisMode: 'performance',
      })
    );
    expect(result.current.sections[0].title).toBe('How do channels perform?');
    expect(result.current.sections[1].title).toBe('Which channels are failing?');
  });

  it('uses yamazumi titles when analysisMode is yamazumi (unchanged)', () => {
    const { result } = renderHook(() =>
      useReportSections({
        ...baseOptions,
        analysisMode: 'yamazumi',
      })
    );
    expect(result.current.sections[0].title).toBe('What does the time composition look like?');
    expect(result.current.sections[1].title).toBe('What is driving the activity composition?');
  });

  it('uses standard titles by default', () => {
    const { result } = renderHook(() => useReportSections({ ...baseOptions }));
    expect(result.current.sections[0].title).toBe('What does the process look like?');
    expect(result.current.sections[1].title).toBe('What is driving the variation?');
  });

  it('performance mode takes precedence over isCapabilityMode', () => {
    const { result } = renderHook(() =>
      useReportSections({
        ...baseOptions,
        analysisMode: 'performance',
        isCapabilityMode: true,
      })
    );
    expect(result.current.sections[0].title).toBe('How do channels perform?');
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
  });

  it('drivers get hasAIContent from stagedComparison too', () => {
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, aiEnabled: false, stagedComparison: true })
    );
    const { sections } = result.current;
    expect(sections[1].hasAIContent).toBe(true); // drivers
    expect(sections[0].hasAIContent).toBe(false); // current-condition (no aiEnabled, no staged)
  });
});
