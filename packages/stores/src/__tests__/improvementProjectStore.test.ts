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
