import { describe, expect, it } from 'vitest';
import type { ImprovementProject } from '../types';
import { isCollaborative } from '../predicates';

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
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
  };
}

describe('isCollaborative', () => {
  it('is false for a solo project with no collaboratedAt marker', () => {
    expect(isCollaborative(makeIP())).toBe(false);
  });

  it('is true once collaboratedAt is set (first invite happened)', () => {
    expect(isCollaborative(makeIP({ collaboratedAt: 1_700_000_000_000 }))).toBe(true);
  });

  it('stays true even when the roster is back to a single member (marker is durable)', () => {
    const ip = makeIP({
      collaboratedAt: 1_700_000_000_000,
      metadata: {
        title: 'Cpk lift',
        members: [
          {
            id: 'pm-lead',
            createdAt: 0,
            deletedAt: null,
            userId: 'lead@example.com',
            displayName: 'Lead',
            role: 'lead',
            invitedAt: 0,
          },
        ],
      },
    });
    expect(isCollaborative(ip)).toBe(true);
  });
});
