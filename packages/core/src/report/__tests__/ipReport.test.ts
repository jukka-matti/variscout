import { describe, expect, it } from 'vitest';
import type { Finding, Hypothesis, HypothesisStatus } from '../../findings/types';
import type { ImprovementProject } from '../../improvementProject';
import type { ControlHandoff, ControlRecord, ControlReview } from '../../control';
import {
  D13_OVERVIEW_SECTION_TITLES,
  deriveIPCauseRows,
  deriveIPReportNarrative,
  selectIPReportScope,
} from '../ipReport';

const now = Date.parse('2026-05-15T00:00:00Z');

function project(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'active',
    metadata: { title: 'Fill Cpk lift', projectId: 'inv-1' },
    goal: {
      outcomeGoals: [{ outcomeSpecId: 'out-fill', baseline: 0.86, target: 1.33 }],
      factorControls: [
        {
          factor: 'shift',
          targetCondition: 'Night shift in control',
          linkedHypothesisId: 'hyp-1',
        },
      ],
      mechanismGoals: [{ description: 'Nozzle temperature stable', linkedFindingIds: ['find-1'] }],
    },
    sections: {
      background: { snapshotText: 'Baseline Cpk was below target.' },
      approach: { improvementIdeaIds: ['idea-1'], actionItemIds: ['act-1'] },
      outcomeReference: { sustainmentRecordId: 'sus-1', controlHandoffId: 'handoff-1' },
    },
    signoff: undefined,
    reflection: 'Keep the retune checklist with the line lead.',
    createdAt: now - 10 * 86_400_000,
    updatedAt: now - 86_400_000,
    deletedAt: null,
    ...overrides,
  };
}

function hypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'hyp-1',
    name: 'Night shift nozzle drift',
    synthesis: 'Night shift settings explain the shortfall.',
    findingIds: ['find-1'],
    updatedAt: now,
    status: 'evidence-survived-test',
    selectedForImprovement: true,
    // ADR-085: ideas re-homed from retired Question entity to Hypothesis
    ideas: [
      {
        id: 'idea-1',
        text: 'Retune night recipe',
        selected: true,
        projection: {
          baselineMean: 10,
          baselineSigma: 2,
          baselineCpk: 0.86,
          projectedMean: 10,
          projectedSigma: 1,
          projectedCpk: 1.4,
          meanDelta: 0,
          sigmaDelta: -1,
          simulationParams: { meanAdjustment: 0, variationReduction: 50 },
          createdAt: '2026-05-15T00:00:00Z',
        },
        createdAt: now,
        deletedAt: null,
      },
    ],
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'find-1',
    text: 'Fill Cpk improves when nozzle temperature is stable.',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'analyzed',
    tag: 'key-driver',
    comments: [],
    statusChangedAt: now,
    actions: [
      {
        id: 'act-1',
        text: 'Retune the night shift recipe',
        status: 'done',
        completedAt: now - 2 * 86_400_000,
        createdAt: now - 3 * 86_400_000,
        deletedAt: null,
      },
    ],
    ...overrides,
  } as Finding;
}

function sustainment(overrides: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id: 'sus-1',
    projectId: 'inv-1',
    hubId: 'hub-1',
    status: 'confirmed-sustained',
    title: 'Fill Cpk sustainment',
    improvementProjectId: 'ip-1',
    improvementDate: '2026-05-01T00:00:00.000Z',
    baseline: {
      capturedAt: now,
      window: {
        startISO: '2026-04-01T00:00:00.000Z',
        endISO: '2026-04-30T23:59:59.999Z',
      },
      measure: 'fill_weight',
      n: 30,
      mean: 100,
      sigma: 1,
      cpk: 0.86,
    },
    ladder: [7, 30, 90],
    ladderStep: 1,
    lastEvaluatedSnapshotId: undefined,
    nextCheckSuggestedAt: '2026-05-31T00:00:00.000Z',
    updatedAt: now,
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function review(overrides: Partial<ControlReview> = {}): ControlReview {
  return {
    id: 'review-1',
    recordId: 'sus-1',
    projectId: 'ip-1',
    hubId: 'hub-1',
    reviewedAt: now,
    reviewer: { displayName: 'Mira Lead' },
    verdict: 'holding',
    nowStats: {
      window: {
        startISO: '2026-05-01T00:00:00.000Z',
        endISO: '2026-05-14T23:59:59.999Z',
      },
      n: 24,
      mean: 99.4,
      sigma: 0.72,
      cpk: 1.28,
    },
    dataStamp: { rowCount: 54 },
    observation: 'Still holding after the first re-check.',
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function handoff(overrides: Partial<ControlHandoff> = {}): ControlHandoff {
  return {
    id: 'handoff-1',
    projectId: 'inv-1',
    hubId: 'hub-1',
    surface: 'work-instruction',
    systemName: 'Line SOP',
    operationalOwner: { displayName: 'Pat Owner' },
    handoffDate: now,
    description: 'Recipe control moved into the line SOP.',
    recordedBy: { displayName: 'Mira Lead' },
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

describe('selectIPReportScope', () => {
  it('returns all live input hypotheses (PO-5: status composes the Report, not lineage), with findings reached via hypothesis + mechanism links', () => {
    // Under Project⟷Hub 1:1 every live hypothesis has a Report destination.
    // Findings still surface only via their hypothesis/mechanism linkage.
    const scope = selectIPReportScope({
      ip: project(),
      hypotheses: [hypothesis(), hypothesis({ id: 'hyp-other', findingIds: ['find-other'] })],
      findings: [finding(), finding({ id: 'find-other' }), finding({ id: 'find-unrelated' })],
      controlRecords: [
        sustainment(),
        sustainment({ id: 'sus-other', improvementProjectId: 'ip-other' }),
      ],
      controlReviews: [review(), review({ id: 'review-other', recordId: 'sus-other' })],
      controlHandoffs: [handoff(), handoff({ id: 'handoff-other', projectId: 'inv-other' })],
    });

    // ALL input hypotheses are in scope now (no lineage membership filter).
    expect(scope.hypotheses.map(h => h.id).sort()).toEqual(['hyp-1', 'hyp-other']);
    // Findings surface via hypothesis findingIds + goal.mechanismGoals.linkedFindingIds.
    expect(scope.findings.map(f => f.id).sort()).toEqual(['find-1', 'find-other']);
    expect(scope.findings.map(f => f.id)).not.toContain('find-unrelated');
    expect(scope.controlRecord?.id).toBe('sus-1');
    expect(scope.controlReviews.map(review => review.id)).toEqual(['review-1']);
    expect(scope.controlHandoff?.id).toBe('handoff-1');
  });

  it('a hypothesis with Report-relevant status but NO goal back-ref appears in scope (PO-5)', () => {
    // The semantic delta: today a hypothesis with no factorControl link silently
    // vanished from the Report; now status alone earns it a Report destination.
    const ip = project({
      goal: {
        outcomeGoals: [{ outcomeSpecId: 'out-fill', baseline: 0.86, target: 1.33 }],
        factorControls: [], // no linkedHypothesisId back-ref anywhere
        mechanismGoals: [],
      },
    });
    const scope = selectIPReportScope({
      ip,
      hypotheses: [hypothesis({ id: 'hyp-status-only', status: 'evidence-survived-test' })],
      findings: [],
    });
    expect(scope.hypotheses.map(h => h.id)).toContain('hyp-status-only');
  });

  it('selects the control record via the metadata projectId join alone (clause 3 isolation)', () => {
    // clause 1 (sustainmentRecordId) + clause 2 (improvementProjectId === ip.id)
    // both deliberately MISS: id ≠ the ip's sustainmentRecordId, and
    // improvementProjectId points elsewhere. ONLY clause 3 —
    // `record.projectId === ip.metadata.projectId` — can select this record.
    const ip = project(); // metadata.projectId === 'inv-1', sustainmentRecordId === 'sus-1'
    const record = sustainment({
      id: 'rec-meta-join', // ≠ 'sus-1' → clause 1 misses
      projectId: 'inv-1', // === ip.metadata.projectId → clause 3 hits
      improvementProjectId: 'some-other-ip', // ≠ ip.id ('ip-1') → clause 2 misses
    });
    const scope = selectIPReportScope({
      ip,
      hypotheses: [],
      findings: [],
      controlRecords: [record],
    });
    expect(scope.controlRecord?.id).toBe('rec-meta-join');
  });

  it('selects NO control record when the metadata join key mismatches (negative control)', () => {
    // Same isolation setup, but the record's projectId no longer matches
    // ip.metadata.projectId, so clause 3 also misses → no record surfaced.
    const ip = project();
    const record = sustainment({
      id: 'rec-no-join',
      projectId: 'unrelated', // ≠ ip.metadata.projectId → clause 3 misses
      improvementProjectId: 'some-other-ip', // clause 2 misses
    });
    const scope = selectIPReportScope({
      ip,
      hypotheses: [],
      findings: [],
      controlRecords: [record],
    });
    expect(scope.controlRecord).toBeUndefined();
  });
});

describe('deriveIPReportNarrative', () => {
  it('returns the D13 overview sections verbatim and in order', () => {
    const narrative = deriveIPReportNarrative({
      ip: project(),
      hypotheses: [
        hypothesis(),
        hypothesis({ id: 'hyp-ruled', name: 'Supplier batch', status: 'refuted' }),
      ],
      findings: [finding()],
      controlRecord: sustainment(),
      controlReviews: [review()],
      controlHandoff: handoff(),
    });

    expect(narrative.map(section => section.title)).toEqual(D13_OVERVIEW_SECTION_TITLES);
    expect(
      narrative.find(section => section.title === 'What we standardized + learned')?.items
    ).toContain('Keep the retune checklist with the line lead.');
    expect(
      narrative.find(section => section.title === 'What we standardized + learned')?.items
    ).toContain('Ruled out: Supplier batch');
    expect(narrative.find(section => section.title === 'Where we started')?.items).toContain(
      'Baseline anchor: fill_weight · n=30 · mean 100 · sigma 1 · Cpk 0.86 · window 2026-04-01 to 2026-04-30'
    );
    expect(narrative.find(section => section.title === 'Did it work?')?.items).toContain(
      'Re-check sequence: 2026-05-15 holding (n=24)'
    );
    expect(narrative.find(section => section.title === 'Did it work?')?.items).toContain(
      'Latest comparison: mean 100 to 99.4; sigma 1 to 0.72; Cpk 0.86 to 1.28'
    );
    expect(
      narrative.find(section => section.title === 'What we standardized + learned')?.items
    ).toContain(
      'Standardized via work instruction in Line SOP: Recipe control moved into the line SOP.'
    );
  });
});

describe('deriveIPCauseRows', () => {
  it('builds per-suspected-cause rows with selected idea, actions, and verification', () => {
    const rows = deriveIPCauseRows({
      ip: project(),
      hypotheses: [hypothesis()],
      findings: [finding()],
      controlRecord: sustainment(),
      controlReviews: [review()],
    });

    expect(rows).toEqual([
      expect.objectContaining({
        hypothesisId: 'hyp-1',
        title: 'Night shift nozzle drift',
        selectedIdea: 'Retune night recipe',
        actionProgressLabel: '1 of 1 actions done',
        verificationLabel: 'Latest re-check holding',
      }),
    ]);
  });

  it('humanizes linked brush finding labels for Sponsor-facing cause rows when the hypothesis name is auto-derived', () => {
    const rows = deriveIPCauseRows({
      ip: project(),
      hypotheses: [
        hypothesis({
          name: 'obs 32-58 in/out',
          synthesis: '',
          findingIds: ['find-brush'],
        }),
      ],
      findings: [
        finding({
          id: 'find-brush',
          text: 'Brushed indices 32-58 on Day_of_Week',
          context: { activeFilters: { 'obs 32-58': ['in'] }, cumulativeScope: null },
        }),
      ],
      controlRecord: sustainment(),
    });

    expect(rows[0].title).toBe('Day-of-Week, observations 32-58');
    expect(rows[0].title).not.toContain('Brushed indices');
    expect(rows[0].title).not.toContain('obs 32-58 in/out');
  });

  it('humanizes auto-derived hypothesis names even when no linked finding is available', () => {
    const rows = deriveIPCauseRows({
      ip: project(),
      hypotheses: [
        hypothesis({
          name: 'obs 32-58 in/out',
          synthesis: '',
          findingIds: [],
        }),
      ],
      findings: [],
      controlRecord: sustainment(),
    });

    expect(rows[0].title).toBe('observations 32-58');
    expect(rows[0].title).not.toContain('obs 32-58 in/out');
  });
});

describe('Report composes from analyst-owned status (PO-5)', () => {
  const mkHyp = (id: string, status: HypothesisStatus) =>
    hypothesis({ id, name: `name-${id}`, synthesis: `syn-${id}`, status, findingIds: [] });

  it('NEGATIVE: a refuted hypothesis is NOT a cause row and NOT in the narrative findings; it is tested-and-excluded', () => {
    const rows = deriveIPCauseRows({
      ip: project(),
      hypotheses: [mkHyp('hyp-ref', 'refuted')],
      findings: [],
    });
    expect(rows).toHaveLength(0);
    const sections = deriveIPReportNarrative({
      ip: project(),
      hypotheses: [mkHyp('hyp-ref', 'refuted')],
      findings: [],
    });
    const found = sections.find(s => s.title === 'What we found + what we did')!;
    expect(found.items.join(' ')).not.toContain('name-hyp-ref');
    const learned = sections.find(s => s.title === 'What we standardized + learned')!;
    expect(learned.items).toContain('Ruled out: name-hyp-ref');
  });

  it('NEGATIVE: a proposed hypothesis is NOT in tested-and-excluded; it is an open question', () => {
    const sections = deriveIPReportNarrative({
      ip: project(),
      hypotheses: [mkHyp('hyp-open', 'proposed')],
      findings: [],
    });
    const learned = sections.find(s => s.title === 'What we standardized + learned')!;
    expect(learned.items.join(' ')).not.toContain('Ruled out: name-hyp-open');
    const next = sections.find(s => s.title === "What's next")!;
    expect(next.items).toContain('Open question: name-hyp-open');
  });

  it('cause rows include evidenced + evidence-survived-test, nothing else', () => {
    const rows = deriveIPCauseRows({
      ip: project(),
      hypotheses: [
        mkHyp('a', 'evidence-survived-test'),
        mkHyp('b', 'evidenced'),
        mkHyp('c', 'proposed'),
        mkHyp('d', 'refuted'),
        mkHyp('e', 'needs-disconfirmation'),
      ],
      findings: [],
    });
    expect(rows.map(r => r.hypothesisId).sort()).toEqual(['a', 'b']);
  });
});
