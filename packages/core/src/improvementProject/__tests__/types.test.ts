import { describe, it, expect } from 'vitest';
import type {
  ImprovementProject,
  ImprovementProjectMetadata,
  ImprovementProjectStatus,
} from '../types';
import type { ProjectMember } from '../../projectMembership/types';

describe('ImprovementProject', () => {
  it('compiles with required title + multi-level Goal', () => {
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'draft',
      metadata: { title: 'Heads 5-8 lift' },
      goal: {
        outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 },
        factorControls: [
          {
            factor: 'NOZZLE.TEMP',
            targetCondition: 'in control 95±2°C',
            linkedHypothesisId: 'h-1',
          },
        ],
      },
      sections: {
        background: {},
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
      updatedAt: 0,
    };
    expect(ip.metadata.title).toBe('Heads 5-8 lift');
  });

  it('status union covers draft | active | closed', () => {
    const statuses: ImprovementProjectStatus[] = ['draft', 'active', 'closed'];
    expect(statuses).toHaveLength(3);
  });

  it('accepts members[] field on metadata (type-level compile check)', () => {
    const member: ProjectMember = {
      id: 'pm-1',
      createdAt: 2000,
      deletedAt: null,
      userId: 'u@org',
      displayName: 'Alice',
      role: 'lead',
      invitedAt: 2000,
    };
    const meta: ImprovementProjectMetadata = {
      title: 'Test',
      members: [member],
    };
    expect(meta.members).toHaveLength(1);
    expect(meta.members![0].role).toBe('lead');
  });

  it('accepts optional reflection narrative field', () => {
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'closed',
      metadata: { title: 'Heads 5-8 lift' },
      goal: {
        outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 },
      },
      sections: {
        background: {},
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
      updatedAt: 0,
      reflection:
        'The mid-shift thermal cycle drift was invisible until the SCOUT subgroup analysis. Future cadence will include a routine subgroup-by-hour check.',
    };
    expect(ip.reflection).toContain('SCOUT subgroup analysis');
  });
});
