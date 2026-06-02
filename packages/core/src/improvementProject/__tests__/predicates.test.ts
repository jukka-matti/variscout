import { describe, expect, it } from 'vitest';
import type { ImprovementProject } from '../types';
import { isCollaborative, toggleLineageFinding } from '../predicates';

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

describe('toggleLineageFinding (PR-CS-6 Edge 2)', () => {
  it('adds a finding id when absent and stamps updatedAt', () => {
    const next = toggleLineageFinding(makeIP(), 'f-1', 1_700_000_000_000);
    expect(next.sections.investigationLineage.findingIds).toEqual(['f-1']);
    expect(next.sections.investigationLineage.updatedAt).toBe(1_700_000_000_000);
  });

  it('removes a finding id when already present (two-way)', () => {
    const ip = makeIP({
      sections: {
        background: {},
        investigationLineage: { findingIds: ['f-1', 'f-2'] },
        approach: {},
        outcomeReference: {},
      },
    });
    const next = toggleLineageFinding(ip, 'f-1', 1_700_000_000_001);
    expect(next.sections.investigationLineage.findingIds).toEqual(['f-2']);
    expect(next.sections.investigationLineage.updatedAt).toBe(1_700_000_000_001);
  });

  it('preserves hypothesisIds (merges findingIds only)', () => {
    const ip = makeIP({
      sections: {
        background: {},
        investigationLineage: { hypothesisIds: ['h-1', 'h-2'], findingIds: [] },
        approach: {},
        outcomeReference: {},
      },
    });
    const next = toggleLineageFinding(ip, 'f-9', 42);
    expect(next.sections.investigationLineage.hypothesisIds).toEqual(['h-1', 'h-2']);
    expect(next.sections.investigationLineage.findingIds).toEqual(['f-9']);
  });

  it('does not mutate the input project', () => {
    const ip = makeIP();
    const next = toggleLineageFinding(ip, 'f-1', 0);
    expect(ip.sections.investigationLineage.findingIds).toBeUndefined();
    expect(next).not.toBe(ip);
  });
});
