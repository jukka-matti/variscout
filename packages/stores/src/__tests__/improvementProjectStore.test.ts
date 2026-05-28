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
  it('starts with an empty projectsByHub record', () => {
    const { projectsByHub } = useImprovementProjectStore.getState();
    expect(projectsByHub).toEqual({});
  });
});

describe('improvementProjectStore setProjectsForHub', () => {
  it('populates the slot for a hub', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().setProjectsForHub('hub-1', [project]);
    expect(useImprovementProjectStore.getState().projectsByHub['hub-1']).toEqual([project]);
  });

  it('replaces the slot with an empty array', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().setProjectsForHub('hub-1', [project]);
    useImprovementProjectStore.getState().setProjectsForHub('hub-1', []);
    expect(useImprovementProjectStore.getState().projectsByHub['hub-1']).toEqual([]);
  });
});

describe('improvementProjectStore getProjectsForHub', () => {
  it('returns [] for an unknown hub', () => {
    const result = useImprovementProjectStore.getState().getProjectsForHub('unknown-hub');
    expect(result).toEqual([]);
  });
});

describe('improvementProjectStore upsertProject', () => {
  it('inserts a project into a fresh hub slot', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    expect(useImprovementProjectStore.getState().projectsByHub['hub-1']).toEqual([project]);
  });

  it('replaces an existing entry by id without duplicating', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const updated: ImprovementProject = { ...project, status: 'active' };
    useImprovementProjectStore.getState().upsertProject(updated);

    const slot = useImprovementProjectStore.getState().projectsByHub['hub-1'];
    expect(slot).toHaveLength(1);
    expect(slot![0]!.status).toBe('active');
  });

  it('does not pollute a different hub slot', () => {
    const projectA = makeProject('ip-1', 'hub-1');
    const projectB = makeProject('ip-2', 'hub-2');
    useImprovementProjectStore.getState().upsertProject(projectA);
    useImprovementProjectStore.getState().upsertProject(projectB);

    expect(useImprovementProjectStore.getState().projectsByHub['hub-1']).toEqual([projectA]);
    expect(useImprovementProjectStore.getState().projectsByHub['hub-2']).toEqual([projectB]);
  });
});

describe('improvementProjectStore removeProject', () => {
  it('removes a project from whichever hub holds it', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    expect(useImprovementProjectStore.getState().projectsByHub['hub-1']).toHaveLength(1);

    useImprovementProjectStore.getState().removeProject('ip-1');
    expect(useImprovementProjectStore.getState().projectsByHub['hub-1']).toEqual([]);
  });

  it('is a silent no-op for an unknown project id', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);
    const stateBefore = useImprovementProjectStore.getState().projectsByHub;

    useImprovementProjectStore.getState().removeProject('does-not-exist');

    // State reference is unchanged (no mutation triggered)
    expect(useImprovementProjectStore.getState().projectsByHub).toBe(stateBefore);
  });
});

describe('improvementProjectStore selector usage', () => {
  it('selector s => s.projectsByHub[hubId] returns projects after upsert', () => {
    const project = makeProject('ip-1', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const result = useImprovementProjectStore.getState().projectsByHub['hub-1'];
    expect(result).toEqual([project]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// PR-CCJ-E1 Task 2 — upsertProject must accept the extended IP shape
// (issueStatement + 4 Canvas-state fields lifted to flat root in T1).
// These tests are a type-check + round-trip guard; the store action
// signature already accepts the full `ImprovementProject` type and needs
// no logic change.
// ─────────────────────────────────────────────────────────────────────────

function makeExtendedProject(id: string, hubId: string): ImprovementProject {
  return {
    ...makeProject(id, hubId),
    issueStatement: 'yields dropping',
    processSteps: [
      { id: 'step-1', name: 'Mix', order: 0 },
      { id: 'step-2', name: 'Bake', order: 1 },
    ],
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
  it('round-trips issueStatement on upsert + getProjectsForHub', () => {
    const project: ImprovementProject = {
      ...makeProject('ip-e1-issue', 'hub-1'),
      issueStatement: 'yields dropping',
    };
    useImprovementProjectStore.getState().upsertProject(project);

    const projects = useImprovementProjectStore.getState().getProjectsForHub('hub-1');
    expect(projects).toHaveLength(1);
    expect(projects[0]!.issueStatement).toBe('yields dropping');
  });

  it('round-trips processSteps on upsert', () => {
    const project: ImprovementProject = {
      ...makeProject('ip-e1-steps', 'hub-1'),
      processSteps: [{ id: 'step-1', name: 'Mix', order: 0 }],
    };
    useImprovementProjectStore.getState().upsertProject(project);

    const slot = useImprovementProjectStore.getState().projectsByHub['hub-1'];
    expect(slot![0]!.processSteps).toEqual([{ id: 'step-1', name: 'Mix', order: 0 }]);
  });

  it('round-trips stepTimings + formulaBindings + timeDecompositionBindings', () => {
    const project = makeExtendedProject('ip-e1-all', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const slot = useImprovementProjectStore.getState().projectsByHub['hub-1'];
    const stored = slot![0]!;

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

  it('upserts an IP missing the new fields without crashing (T1 backward-compat)', () => {
    // Regression guard: the existing minimal `makeProject` factory does not
    // populate any of the new optional fields. Upsert + read-back must still
    // work — the field absence is the runtime equivalent of an existing v13
    // record on disk.
    const project = makeProject('ip-e1-bare', 'hub-1');
    useImprovementProjectStore.getState().upsertProject(project);

    const projects = useImprovementProjectStore.getState().getProjectsForHub('hub-1');
    expect(projects).toHaveLength(1);
    const stored = projects[0]!;
    expect(stored.issueStatement).toBeUndefined();
    expect(stored.processSteps).toBeUndefined();
    expect(stored.stepTimings).toBeUndefined();
    expect(stored.formulaBindings).toBeUndefined();
    expect(stored.timeDecompositionBindings).toBeUndefined();
  });
});
