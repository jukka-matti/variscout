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

  it('treats collaboration as formalized even when the roster later shrinks', () => {
    expect(isFormalizedProject(makeIP({ collaboratedAt: 1_700_000_000_000 }))).toBe(true);
  });
});
