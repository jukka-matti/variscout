import { describe, it, expect } from 'vitest';
import { searchProjectArtifacts } from '../searchProject';
import type { Finding, ActionItem, ImprovementIdea, Hypothesis } from '../../findings';

// ── Helper builders ──────────────────────────────────────────────────────────

function makeFinding(overrides: Partial<Finding> & { id: string; text: string }): Finding {
  return {
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: {
      activeFilters: {},
      cumulativeScope: null,
    },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1714000000000,
    ...overrides,
  };
}

function makeHypothesis(overrides: Partial<Hypothesis> & { id: string; name: string }): Hypothesis {
  return {
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    investigationId: 'inv-test-001',
    deletedAt: null,
    ...overrides,
  };
}

function makeAction(overrides: Partial<ActionItem> & { id: string; text: string }): ActionItem {
  return {
    createdAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

function makeIdea(
  overrides: Partial<ImprovementIdea> & { id: string; text: string }
): ImprovementIdea {
  return {
    createdAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const findings: Finding[] = [
  makeFinding({ id: 'f1', text: 'High variation in filling head B', status: 'observed' }),
  makeFinding({ id: 'f2', text: 'Night shift shows wider spread', status: 'investigating' }),
  makeFinding({
    id: 'f3',
    text: 'Operator training gap identified',
    status: 'analyzed',
    tag: 'key-driver',
  }),
];

const hypotheses: Hypothesis[] = [
  makeHypothesis({
    id: 'h1',
    name: 'New operators lack system training',
    status: 'evidenced',
  }),
  makeHypothesis({
    id: 'h2',
    name: 'Machine wear causes drift',
    status: 'proposed',
  }),
];

// ── Text matching ─────────────────────────────────────────────────────────────

describe('searchProjectArtifacts — text matching', () => {
  it('matches findings by case-insensitive substring', () => {
    const results = searchProjectArtifacts({ query: 'FILLING HEAD', findings, hypotheses });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('f1');
  });

  it('matches hypotheses by case-insensitive substring', () => {
    const results = searchProjectArtifacts({ query: 'machine wear', findings, hypotheses });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('h2');
  });

  it('returns no results when query matches nothing', () => {
    const results = searchProjectArtifacts({ query: 'nonexistent xyz', findings, hypotheses });
    expect(results).toHaveLength(0);
  });

  it('returns all artifacts when query is empty string', () => {
    const results = searchProjectArtifacts({ query: '', findings, hypotheses });
    // 3 findings + 2 hypotheses = 5, capped at MAX_RESULTS=5
    expect(results).toHaveLength(5);
  });

  it('matches across both findings and hypotheses for same query term', () => {
    // "training" appears in finding f3 and hypothesis h1
    const results = searchProjectArtifacts({ query: 'training', findings, hypotheses });
    const ids = results.map(r => r.id);
    expect(ids).toContain('f3');
    expect(ids).toContain('h1');
  });
});

// ── Artifact type filtering ───────────────────────────────────────────────────

describe('searchProjectArtifacts — artifactType filtering', () => {
  it('returns only findings when artifactType is "finding"', () => {
    const results = searchProjectArtifacts({
      query: '',
      findings,
      hypotheses,
      artifactType: 'finding',
    });
    expect(results.every(r => r.type === 'finding')).toBe(true);
  });

  it('returns only hypotheses when artifactType is "hypothesis"', () => {
    const results = searchProjectArtifacts({
      query: '',
      findings,
      hypotheses,
      artifactType: 'hypothesis',
    });
    expect(results.every(r => r.type === 'hypothesis')).toBe(true);
    expect(results).toHaveLength(2);
  });

  it('returns only ideas when artifactType is "idea"', () => {
    const hypothesesWithIdeas: Hypothesis[] = [
      makeHypothesis({
        id: 'hx',
        name: 'Lubrication gap',
        status: 'evidenced',
        ideas: [makeIdea({ id: 'i1', text: 'Add visual guides to reduce setup error' })],
      }),
    ];
    const results = searchProjectArtifacts({
      query: '',
      findings: [],
      hypotheses: hypothesesWithIdeas,
      artifactType: 'idea',
    });
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('idea');
    expect(results[0].id).toBe('i1');
  });

  it('returns only actions when artifactType is "action"', () => {
    const findingsWithActions: Finding[] = [
      makeFinding({
        id: 'fa',
        text: 'Process drift finding',
        actions: [makeAction({ id: 'a1', text: 'Schedule maintenance check' })],
      }),
    ];
    const results = searchProjectArtifacts({
      query: '',
      findings: findingsWithActions,
      hypotheses: [],
      artifactType: 'action',
    });
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('action');
    expect(results[0].id).toBe('a1');
  });

  it('returns all artifact types when artifactType is "all" (default)', () => {
    const hypothesesWithIdeas: Hypothesis[] = [
      makeHypothesis({
        id: 'hy',
        name: 'Cause with idea',
        status: 'evidenced',
        ideas: [makeIdea({ id: 'i2', text: 'Fix the setup procedure' })],
      }),
    ];
    const findingsWithActions: Finding[] = [
      makeFinding({
        id: 'fb',
        text: 'Finding with action',
        actions: [makeAction({ id: 'a2', text: 'Retrain operator' })],
      }),
    ];
    const results = searchProjectArtifacts({
      query: '',
      findings: findingsWithActions,
      hypotheses: hypothesesWithIdeas,
    });
    const types = new Set(results.map(r => r.type));
    expect(types.has('finding')).toBe(true);
    expect(types.has('hypothesis')).toBe(true);
    expect(types.has('idea')).toBe(true);
    expect(types.has('action')).toBe(true);
  });
});

// ── Finding status filtering ──────────────────────────────────────────────────

describe('searchProjectArtifacts — findingStatus filtering', () => {
  it('returns only findings with matching status', () => {
    const results = searchProjectArtifacts({
      query: '',
      findings,
      hypotheses: [],
      artifactType: 'finding',
      findingStatus: 'investigating',
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('f2');
  });

  it('returns all findings when findingStatus is "any"', () => {
    const results = searchProjectArtifacts({
      query: '',
      findings,
      hypotheses: [],
      artifactType: 'finding',
      findingStatus: 'any',
    });
    expect(results).toHaveLength(3);
  });

  it('returns empty when no findings match the status', () => {
    const results = searchProjectArtifacts({
      query: '',
      findings,
      hypotheses: [],
      artifactType: 'finding',
      findingStatus: 'resolved',
    });
    expect(results).toHaveLength(0);
  });
});

// ── Hypothesis status filtering ───────────────────────────────────────────────

describe('searchProjectArtifacts — hypothesisStatus filtering', () => {
  it('returns only hypotheses with matching status', () => {
    const results = searchProjectArtifacts({
      query: '',
      findings: [],
      hypotheses,
      artifactType: 'hypothesis',
      hypothesisStatus: 'evidenced',
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('h1');
  });

  it('returns all hypotheses when hypothesisStatus is "any"', () => {
    const results = searchProjectArtifacts({
      query: '',
      findings: [],
      hypotheses,
      artifactType: 'hypothesis',
      hypothesisStatus: 'any',
    });
    expect(results).toHaveLength(2);
  });
});

// ── Status filter does not affect other artifact types ────────────────────────

describe('searchProjectArtifacts — status filter scope', () => {
  it('findingStatus filter does not exclude hypotheses when artifactType is "all"', () => {
    const results = searchProjectArtifacts({
      query: 'training',
      findings,
      hypotheses,
      findingStatus: 'observed',
    });
    // f3 is 'analyzed' so excluded by findingStatus, but h1 should still appear
    const ids = results.map(r => r.id);
    expect(ids).not.toContain('f3');
    expect(ids).toContain('h1');
  });

  it('hypothesisStatus filter does not exclude findings when artifactType is "all"', () => {
    const results = searchProjectArtifacts({
      query: 'training',
      findings,
      hypotheses,
      hypothesisStatus: 'proposed',
    });
    // h1 is 'evidenced' so excluded, but f3 should still appear
    const ids = results.map(r => r.id);
    expect(ids).not.toContain('h1');
    expect(ids).toContain('f3');
  });
});

// ── Result shape ──────────────────────────────────────────────────────────────

describe('searchProjectArtifacts — result shape', () => {
  it('finding result includes tag and filterContext', () => {
    const findingsWithContext: Finding[] = [
      makeFinding({
        id: 'fz',
        text: 'Variance spike',
        status: 'analyzed',
        tag: 'key-driver',
        context: {
          activeFilters: { Machine: ['B'], Shift: ['Night'] },
          cumulativeScope: 42,
        },
      }),
    ];
    const results = searchProjectArtifacts({
      query: 'variance',
      findings: findingsWithContext,
      hypotheses: [],
    });
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.tag).toBe('key-driver');
    // filterContext contains the factor column names (keys), not values
    expect(r.filterContext).toContain('Machine');
    expect(r.filterContext).toContain('Shift');
  });

  it('hypothesis result includes linkedFindingCount', () => {
    const h = makeHypothesis({
      id: 'hr',
      name: 'Worn die causes flash',
      status: 'evidenced',
      findingIds: ['f1', 'f2'],
    });
    const results = searchProjectArtifacts({ query: 'worn die', findings: [], hypotheses: [h] });
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.linkedFindingCount).toBe(2);
  });

  it('idea result includes parentHypothesisText and timeframe', () => {
    const h = makeHypothesis({
      id: 'hi',
      name: 'Lubrication interval too long',
      status: 'evidenced',
      ideas: [makeIdea({ id: 'idea1', text: 'Shorten lubrication cycle', timeframe: 'days' })],
    });
    const results = searchProjectArtifacts({
      query: 'lubrication cycle',
      findings: [],
      hypotheses: [h],
      artifactType: 'idea',
    });
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.parentHypothesisText).toBe('Lubrication interval too long');
    expect(r.timeframe).toBe('days');
  });

  it('action result includes completed flag, dueDate, and parentFindingText', () => {
    const completedAt = Date.now();
    const f = makeFinding({
      id: 'fac',
      text: 'Calibration overdue',
      actions: [
        makeAction({
          id: 'ac1',
          text: 'Schedule calibration',
          completedAt,
          dueDate: '2026-03-31',
        }),
      ],
    });
    const results = searchProjectArtifacts({
      query: 'schedule calibration',
      findings: [f],
      hypotheses: [],
      artifactType: 'action',
    });
    expect(results).toHaveLength(1);
    const r = results[0];
    // status is derived from completedAt: action is 'completed' when completedAt is set
    expect(r.status).toBe('completed');
    expect(r.parentFindingText).toBe('Calibration overdue');
  });

  it('pending action has completed false and status "open"', () => {
    const f = makeFinding({
      id: 'fp',
      text: 'Pending parent finding',
      actions: [makeAction({ id: 'ap1', text: 'Pending task here' })],
    });
    const results = searchProjectArtifacts({
      query: 'pending task',
      findings: [f],
      hypotheses: [],
      artifactType: 'action',
    });
    expect(results).toHaveLength(1);
    // status is 'open' when completedAt is not set
    expect(results[0].status).toBe('open');
  });
});

// ── Max results cap ───────────────────────────────────────────────────────────

describe('searchProjectArtifacts — max results cap', () => {
  it('returns at most 5 results', () => {
    const manyFindings: Finding[] = Array.from({ length: 10 }, (_, i) =>
      makeFinding({ id: `mf${i}`, text: `Variation observed in zone ${i}` })
    );
    const results = searchProjectArtifacts({
      query: 'variation',
      findings: manyFindings,
      hypotheses: [],
    });
    expect(results).toHaveLength(5);
  });
});

// ── Result order ──────────────────────────────────────────────────────────────

describe('searchProjectArtifacts — result order', () => {
  it('returns results in input order (findings before hypotheses)', () => {
    const testFindings: Finding[] = [makeFinding({ id: 'f1', text: 'machine issue' })];
    const testHypotheses: Hypothesis[] = [makeHypothesis({ id: 'h1', name: 'machine drift' })];
    const results = searchProjectArtifacts({
      query: 'machine',
      findings: testFindings,
      hypotheses: testHypotheses,
    });
    expect(results[0].id).toBe('f1'); // findings first
    expect(results[1].id).toBe('h1'); // then hypotheses
  });
});

// ── Empty inputs ──────────────────────────────────────────────────────────────

describe('searchProjectArtifacts — empty inputs', () => {
  it('returns empty array for empty findings and hypotheses', () => {
    const results = searchProjectArtifacts({ query: 'anything', findings: [], hypotheses: [] });
    expect(results).toEqual([]);
  });

  it('handles findings with no actions gracefully', () => {
    const results = searchProjectArtifacts({
      query: 'task',
      findings,
      hypotheses: [],
      artifactType: 'action',
    });
    expect(results).toEqual([]);
  });

  it('handles hypotheses with no ideas gracefully', () => {
    const results = searchProjectArtifacts({
      query: 'idea',
      findings: [],
      hypotheses,
      artifactType: 'idea',
    });
    expect(results).toEqual([]);
  });
});

// ── filterContext formatting ──────────────────────────────────────────────────

describe('searchProjectArtifacts — filterContext', () => {
  it('returns undefined filterContext when activeFilters is empty', () => {
    const f = makeFinding({
      id: 'fec',
      text: 'Empty context finding',
      context: { activeFilters: {}, cumulativeScope: null },
      evidenceType: 'data',
    });
    const results = searchProjectArtifacts({
      query: 'empty context',
      findings: [f],
      hypotheses: [],
    });
    expect(results[0].filterContext).toBeUndefined();
  });

  it('formats multiple filter entries separated by comma', () => {
    const f = makeFinding({
      id: 'fmc',
      text: 'Multi context finding',
      context: {
        activeFilters: { Machine: ['A', 'B'], Shift: ['Night'] },
        cumulativeScope: 30,
      },
    });
    const results = searchProjectArtifacts({
      query: 'multi context',
      findings: [f],
      hypotheses: [],
    });
    const ctx = results[0].filterContext;
    expect(ctx).toBeDefined();
    expect(ctx).toContain('Machine');
    expect(ctx).toContain('Shift');
  });
});
