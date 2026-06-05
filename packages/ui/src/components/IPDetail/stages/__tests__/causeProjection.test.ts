import { describe, it, expect } from 'vitest';
import { projectCauses } from '../causeProjection';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { Hypothesis, ImprovementIdea, ActionItem } from '@variscout/core/findings';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: { title: 'X' },
  goal: {
    outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }],
    factorControls: [
      { factor: 'NOZZLE.TEMP', targetCondition: 'in control 95±2°C', linkedHypothesisId: 'h-1' },
      { factor: 'VISCOSITY', targetCondition: 'in spec all lots', linkedHypothesisId: 'h-2' },
    ],
  },
  sections: {
    background: {},
    approach: { improvementIdeaIds: ['idea-1', 'idea-2'], actionItemIds: ['a-1', 'a-2'] },
    outcomeReference: {},
  },
};

// Hypothesis: has `name` and `status: HypothesisStatus`
const hypotheses: Hypothesis[] = [
  {
    id: 'h-1',
    name: 'Nozzle temp drift',
    synthesis: '',
    findingIds: [],
    status: 'evidence-survived-test',
    investigationId: 'inv-1',
    updatedAt: 0,
    createdAt: 0,
    deletedAt: null,
  },
  {
    id: 'h-2',
    name: 'Material viscosity',
    synthesis: '',
    findingIds: [],
    status: 'evidence-survived-test',
    investigationId: 'inv-1',
    updatedAt: 0,
    createdAt: 0,
    deletedAt: null,
  },
];

// ImprovementIdea: has `text` (not `name`), `selected?`, no `linkedHypothesisId`
// The IP approach section stores all ideas; projection maps per factorControl
// via the caller passing only the ideas relevant to each cause.
const ideas: ImprovementIdea[] = [
  {
    id: 'idea-1',
    text: 'PID retune',
    selected: true,
    createdAt: 0,
    deletedAt: null,
  },
  {
    id: 'idea-2',
    text: 'Switch supplier',
    selected: false,
    createdAt: 0,
    deletedAt: null,
  },
];

// ActionItem: has `ideaId` (not `linkedIdeaId`), `status?: ActionItemStatus`
// ActionItemStatus = 'open' | 'in-progress' | 'done'
const actions: ActionItem[] = [
  {
    id: 'a-1',
    text: 'Retune Heads 5-8',
    status: 'done',
    ideaId: 'idea-1',
    createdAt: 0,
    deletedAt: null,
  },
  {
    id: 'a-2',
    text: 'Operator training',
    status: 'in-progress',
    ideaId: 'idea-1',
    createdAt: 0,
    deletedAt: null,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('projectCauses', () => {
  it('produces one row per factorControl', () => {
    const rows = projectCauses(ip, { hypotheses, ideas: [ideas[0]!], actions });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.factor).toBe('NOZZLE.TEMP');
  });

  it('resolves hypothesis by linkedHypothesisId', () => {
    const rows = projectCauses(ip, { hypotheses, ideas: [ideas[0]!], actions });
    expect(rows[0]!.hypothesis?.id).toBe('h-1');
    expect(rows[0]!.hypothesis?.name).toBe('Nozzle temp drift');
  });

  it('exposes selected idea', () => {
    const rows = projectCauses(ip, { hypotheses, ideas: [ideas[0]!], actions });
    expect(rows[0]!.selectedIdea?.id).toBe('idea-1');
  });

  it('matches actions to selected idea via ideaId', () => {
    const rows = projectCauses(ip, { hypotheses, ideas: [ideas[0]!], actions });
    expect(rows[0]!.actions).toHaveLength(2);
    expect(rows[0]!.actions[0]!.status).toBe('done');
  });

  it('classifies cause status as resolved when all actions done', () => {
    const allDoneActions = actions.map(a => ({ ...a, status: 'done' as const }));
    const rows = projectCauses(ip, { hypotheses, ideas: [ideas[0]!], actions: allDoneActions });
    expect(rows[0]!.causeStatus).toBe('resolved');
  });

  it('classifies cause status as in-progress with mixed action statuses', () => {
    const rows = projectCauses(ip, { hypotheses, ideas: [ideas[0]!], actions });
    expect(rows[0]!.causeStatus).toBe('in-progress');
  });

  it('classifies cause status as pending-idea when no idea is selected', () => {
    // Provide only idea-2 (selected: false) which has no selectedIdea for h-1's cause
    const rows = projectCauses(ip, { hypotheses, ideas: [], actions: [] });
    // Both factorControls have no matching selected idea
    expect(rows[0]!.causeStatus).toBe('pending-idea');
    expect(rows[1]!.causeStatus).toBe('pending-idea');
  });

  it('classifies cause status as ruled-out when hypothesis is refuted', () => {
    const refutedHypotheses = hypotheses.map(h =>
      h.id === 'h-1' ? { ...h, status: 'refuted' as const } : h
    );
    const rows = projectCauses(ip, {
      hypotheses: refutedHypotheses,
      ideas: [ideas[0]!],
      actions,
    });
    expect(rows[0]!.causeStatus).toBe('ruled-out');
  });

  it('handles missing factorControls gracefully (returns empty array)', () => {
    const ipNoControls: ImprovementProject = {
      ...ip,
      goal: { ...ip.goal, factorControls: undefined },
    };
    const rows = projectCauses(ipNoControls, { hypotheses, ideas, actions });
    expect(rows).toHaveLength(0);
  });
});
