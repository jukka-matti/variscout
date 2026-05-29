import { beforeEach, describe, expect, it } from 'vitest';
import {
  useImprovementProjectStore,
  getImprovementProjectInitialState,
} from '../improvementProjectStore';
import type { ImprovementProject } from '@variscout/core/improvementProject';

function makeProject(id: string, hubId: string): ImprovementProject {
  return {
    id,
    hubId,
    status: 'draft',
    metadata: { title: `Project ${id}` },
    goal: {
      outcomeGoals: [
        {
          outcomeSpecId: `outcome-${id}`,
          target: 1.33,
        },
      ],
    },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
  };
}

beforeEach(() => {
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
});

describe('improvementProjectStore initial state', () => {
  it('starts with an empty projectsById record', () => {
    const { projectsById } = useImprovementProjectStore.getState();
    expect(projectsById).toEqual({});
  });
});

describe('improvementProjectStore getProjectForHub', () => {
  it('returns undefined for an unknown hub', () => {
    const result = useImprovementProjectStore.getState().getProjectForHub('unknown-hub');
    expect(result).toBeUndefined();
  });

  it('returns the single live project for a hub after upsert', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    const result = useImprovementProjectStore.getState().getProjectForHub('hub-1');
    expect(result).toEqual(project);
  });

  it('returns undefined when the project is soft-deleted', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    useImprovementProjectStore.getState().upsertProject({ ...project, deletedAt: 1714000000001 });
    const result = useImprovementProjectStore.getState().getProjectForHub('hub-1');
    expect(result).toBeUndefined();
  });
});

describe('improvementProjectStore setProjectForHub', () => {
  it('upserts the project by id', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().setProjectForHub('hub-1', project);
    expect(useImprovementProjectStore.getState().projectsById['ip-1']).toEqual(project);
  });

  it('replaces an existing project on re-set', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().setProjectForHub('hub-1', project);
    const updated = { ...project, status: 'active' } as ImprovementProject;
    useImprovementProjectStore.getState().setProjectForHub('hub-1', updated);
    expect(useImprovementProjectStore.getState().projectsById['ip-1']!.status).toBe('active');
  });
});

describe('improvementProjectStore upsertProject', () => {
  it('inserts a new project', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    expect(useImprovementProjectStore.getState().projectsById['ip-1']).toEqual(project);
  });

  it('replaces an existing entry by id without duplicating', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const updated: ImprovementProject = { ...project, status: 'active' };
    useImprovementProjectStore.getState().upsertProject(updated);

    const stored = useImprovementProjectStore.getState().projectsById;
    expect(Object.keys(stored)).toHaveLength(1);
    expect(stored['ip-1']!.status).toBe('active');
  });

  it('projects for different hubs coexist independently', () => {
    const projectA = makeProject('ip-1', 'hub-1');
    const projectB = makeProject('ip-2', 'hub-2');
    useImprovementProjectStore.getState().upsertProject(projectA);
    useImprovementProjectStore.getState().upsertProject(projectB);

    expect(useImprovementProjectStore.getState().projectsById['ip-1']).toEqual(projectA);
    expect(useImprovementProjectStore.getState().projectsById['ip-2']).toEqual(projectB);
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-1')).toEqual(projectA);
    expect(useImprovementProjectStore.getState().getProjectForHub('hub-2')).toEqual(projectB);
  });
});

describe('improvementProjectStore removeProject', () => {
  it('removes a project by id', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    expect('ip-1' in useImprovementProjectStore.getState().projectsById).toBe(true);

    useImprovementProjectStore.getState().removeProject('ip-1');
    expect('ip-1' in useImprovementProjectStore.getState().projectsById).toBe(false);
  });

  it('is a silent no-op for an unknown project id', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    const stateBefore = useImprovementProjectStore.getState().projectsById;

    useImprovementProjectStore.getState().removeProject('does-not-exist');

    // State reference is unchanged (no mutation triggered)
    expect(useImprovementProjectStore.getState().projectsById).toBe(stateBefore);
  });
});

describe('improvementProjectStore selector usage', () => {
  it('selector s => s.projectsById[id] returns project after upsert', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const result = useImprovementProjectStore.getState().projectsById['ip-1'];
    expect(result).toEqual(project);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// PR-CCJ-E1 Task 2 — upsertProject must accept the extended IP shape
// (issueStatement + 4 Canvas-state fields lifted to flat root in T1).
// ─────────────────────────────────────────────────────────────────────────

function makeExtendedProject(id: string, hubId: string): ImprovementProject {
  return {
    ...makeProject(id, hubId),
    issueStatement: 'yields dropping',
    // processSteps removed from ImprovementProject (IM-0b / ADR-087) — canonical
    // step structure lives in ProcessMap; deriveProcessSteps is the read path.
    stepTimings: [
      { kind: 'paired', stepId: 'step-1', startColumn: 'start_ts', endColumn: 'end_ts' },
      { kind: 'duration', stepId: 'step-2', durationColumn: 'bake_ms' },
    ],
    formulaBindings: [
      {
        id: 'f-1',
        name: 'Yield_pct',
        numerator: [{ kind: 'column', column: 'good_units', sign: '+' }],
        denominator: [{ kind: 'column', column: 'total_units', sign: '+' }],
        multiplier: 100,
        family: 'batchRatio',
      },
    ],
    timeDecompositionBindings: [
      {
        id: 'td-1',
        sourceColumn: 'order_date',
        dimensions: ['year', 'month', 'dayOfWeek'],
      },
    ],
  };
}

describe('improvementProjectStore upsertProject with E1-extended fields', () => {
  it('round-trips issueStatement on upsert + getProjectForHub', () => {
    const project: ImprovementProject = {
      ...makeProject('ip-e1-issue', 'hub-1'),
      issueStatement: 'yields dropping',
    };
    useImprovementProjectStore.getState().upsertProject(project);

    const result = useImprovementProjectStore.getState().getProjectForHub('hub-1');
    expect(result).toBeDefined();
    expect(result!.issueStatement).toBe('yields dropping');
  });

  it('round-trips stepTimings + formulaBindings + timeDecompositionBindings', () => {
    const project = makeExtendedProject('ip-e1-all', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const stored = useImprovementProjectStore.getState().projectsById['ip-e1-all']!;

    expect(stored.stepTimings).toHaveLength(2);
    expect(stored.stepTimings![0]).toEqual({
      kind: 'paired',
      stepId: 'step-1',
      startColumn: 'start_ts',
      endColumn: 'end_ts',
    });
    expect(stored.stepTimings![1]).toEqual({
      kind: 'duration',
      stepId: 'step-2',
      durationColumn: 'bake_ms',
    });

    expect(stored.formulaBindings).toHaveLength(1);
    expect(stored.formulaBindings![0]!.name).toBe('Yield_pct');
    expect(stored.formulaBindings![0]!.multiplier).toBe(100);

    expect(stored.timeDecompositionBindings).toHaveLength(1);
    expect(stored.timeDecompositionBindings![0]!.dimensions).toEqual([
      'year',
      'month',
      'dayOfWeek',
    ]);
  });

  it('upserts an IP missing the new fields without crashing (backward-compat)', () => {
    const project = makeProject('ip-e1-bare', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const result = useImprovementProjectStore.getState().getProjectForHub('hub-1');
    expect(result).toBeDefined();
    const stored = result!;
    expect(stored.issueStatement).toBeUndefined();
    expect(stored.stepTimings).toBeUndefined();
    expect(stored.formulaBindings).toBeUndefined();
    expect(stored.timeDecompositionBindings).toBeUndefined();
  });
});
