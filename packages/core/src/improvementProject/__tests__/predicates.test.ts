import { describe, expect, it } from 'vitest';
import type { ImprovementProject } from '../types';
import { isCollaborative, isFormalizedProject } from '../predicates';

function makeIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Cpk lift' },
    goal: { outcomeGoals: [] },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
  };
}

describe('isCollaborative', () => {
  it('is always false for the ADR-093 local-first Workspace', () => {
    expect(isCollaborative(makeIP())).toBe(false);
  });
});

describe('isFormalizedProject', () => {
  it('does not treat an auto-title as formalization', () => {
    expect(isFormalizedProject(makeIP({ metadata: { title: 'Loaded sample data' } }))).toBe(false);
  });

  it('treats an explicit formalization marker as formalized', () => {
    expect(
      isFormalizedProject(makeIP({ metadata: { title: 'Cpk lift', formalizedAt: 123 } }))
    ).toBe(true);
  });

  it('treats deliberate charter content as formalized', () => {
    expect(
      isFormalizedProject(
        makeIP({
          goal: { outcomeGoals: [{ outcomeSpecId: 'yield', target: 98 }] },
        })
      )
    ).toBe(true);
  });
});
