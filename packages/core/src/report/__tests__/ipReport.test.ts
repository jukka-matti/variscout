import { describe, expect, it } from 'vitest';
import type { Finding, Hypothesis } from '../../findings/types';
import type { ImprovementProject } from '../../improvementProject';
import type { ProcessHub } from '../../processHub';
import type { ControlHandoff, ControlRecord } from '../../control';
import {
  D13_OVERVIEW_SECTION_TITLES,
  deriveHubPortfolioReport,
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
    metadata: { title: 'Fill Cpk lift', investigationId: 'inv-1' },
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
      investigationLineage: { hypothesisIds: ['hyp-1', 'hyp-ruled'], findingIds: ['find-1'] },
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
    investigationId: 'inv-1',
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
    investigationId: 'inv-1',
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
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'confirmed-sustained',
    title: 'Fill Cpk sustainment',
    improvementProjectId: 'ip-1',
    consecutiveOnTargetTicks: 4,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'weekly',
    latestVerdict: 'holding',
    nextReviewDue: '2026-05-22',
    updatedAt: now,
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function handoff(overrides: Partial<ControlHandoff> = {}): ControlHandoff {
  return {
    id: 'handoff-1',
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'operational',
    surface: 'work-instruction',
    systemName: 'Line SOP',
    operationalOwner: { displayName: 'Pat Owner' },
    handoffDate: now,
    description: 'Recipe control moved into the line SOP.',
    retainControlReview: true,
    recordedBy: { displayName: 'Mira Lead' },
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

describe('selectIPReportScope', () => {
  it('selects linked hypotheses, findings, sustainment record, and handoff (ADR-085: no questions)', () => {
    const scope = selectIPReportScope({
      ip: project(),
      hypotheses: [hypothesis(), hypothesis({ id: 'hyp-other', findingIds: ['find-other'] })],
      findings: [finding(), finding({ id: 'find-other' })],
      controlRecords: [
        sustainment(),
        sustainment({ id: 'sus-other', improvementProjectId: 'ip-other' }),
      ],
      controlHandoffs: [handoff(), handoff({ id: 'handoff-other', investigationId: 'inv-other' })],
    });

    expect(scope.hypotheses.map(h => h.id)).toEqual(['hyp-1']);
    expect(scope.findings.map(f => f.id)).toEqual(['find-1']);
    expect(scope.controlRecord?.id).toBe('sus-1');
    expect(scope.controlHandoff?.id).toBe('handoff-1');
  });

  it('PR-CS-6 Edge 2: unions explicit lineage findingIds with hypothesis-derived findings (deduped)', () => {
    // `find-lineage` is pinned via investigationLineage only (no hypothesis);
    // `find-1` is reached via the scoped hypothesis only. Both must surface.
    const ip = project({
      sections: {
        background: {},
        investigationLineage: { hypothesisIds: ['hyp-1'], findingIds: ['find-lineage'] },
        approach: {},
        outcomeReference: {},
      },
    });
    const scope = selectIPReportScope({
      ip,
      hypotheses: [hypothesis()], // hyp-1 → findingIds: ['find-1']
      findings: [finding(), finding({ id: 'find-lineage' }), finding({ id: 'find-unrelated' })],
    });

    const ids = scope.findings.map(f => f.id).sort();
    expect(ids).toEqual(['find-1', 'find-lineage']);
    // Unrelated finding (neither pinned nor hypothesis-linked) is excluded.
    expect(ids).not.toContain('find-unrelated');
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
      controlHandoff: handoff(),
    });

    expect(narrative.map(section => section.title)).toEqual(D13_OVERVIEW_SECTION_TITLES);
    expect(
      narrative.find(section => section.title === 'What we standardized + learned')?.items
    ).toContain('Keep the retune checklist with the line lead.');
    expect(
      narrative.find(section => section.title === 'What we standardized + learned')?.items
    ).toContain('Ruled out: Supplier batch');
  });
});

describe('deriveIPCauseRows', () => {
  it('builds per-suspected-cause rows with selected idea, actions, and verification', () => {
    const rows = deriveIPCauseRows({
      ip: project(),
      hypotheses: [hypothesis()],
      findings: [finding()],
      controlRecord: sustainment(),
    });

    expect(rows).toEqual([
      expect.objectContaining({
        hypothesisId: 'hyp-1',
        title: 'Night shift nozzle drift',
        selectedIdea: 'Retune night recipe',
        actionProgressLabel: '1 of 1 actions done',
        verificationLabel: 'Control holding · 4 ticks',
      }),
    ]);
  });
});

describe('deriveHubPortfolioReport', () => {
  it('uses distributions instead of means when outcome specs are heterogeneous', () => {
    const hub: ProcessHub = {
      id: 'hub-1',
      name: 'Line hub',
      createdAt: now,
      deletedAt: null,
      outcomes: [
        {
          id: 'out-fill',
          hubId: 'hub-1',
          columnName: 'fill',
          characteristicType: 'nominalIsBest',
          target: 10,
          createdAt: now,
          deletedAt: null,
        },
        {
          id: 'out-scrap',
          hubId: 'hub-1',
          columnName: 'scrap',
          characteristicType: 'smallerIsBetter',
          usl: 2,
          createdAt: now,
          deletedAt: null,
        },
      ],
      // 1:1 hub↔project — single project targeting 2 outcome specs triggers distribution summary.
      improvementProject: project({
        goal: {
          outcomeGoals: [
            { outcomeSpecId: 'out-fill', target: 1.33 },
            { outcomeSpecId: 'out-scrap', target: 1 },
          ],
        },
      }),
      controlRecords: [sustainment()],
    };

    const report = deriveHubPortfolioReport({ hub, now });

    expect(report.capabilitySummary.kind).toBe('distribution');
    expect(report.capabilitySummary.label).toContain('2 outcome specs');
    expect(report.rows.map(row => row.title)).toEqual(['Fill Cpk lift']);
  });
});
