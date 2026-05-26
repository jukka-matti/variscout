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
        outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
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
    expect(ip.goal.outcomeGoals.length).toBeGreaterThanOrEqual(1);
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
        outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
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

  it('supports step-bound outcomes via optional stepId (Spec 2 §3.3.1)', () => {
    // Mixed global + step-bound outcomes — symmetry with factors.
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'active',
      metadata: { title: 'Yield + react-step yield split' },
      goal: {
        outcomeGoals: [
          // Global outcome — whole-process Y (no stepId)
          { outcomeSpecId: 'Yield_pct', target: 95 },
          // Step-bound outcome — feeds L3 focal-step view of the React step
          { outcomeSpecId: 'React_yield_pct', target: 98, stepId: 'step-react' },
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
    const globalOutcome = ip.goal.outcomeGoals.find(g => g.stepId === undefined);
    const stepBoundOutcome = ip.goal.outcomeGoals.find(g => g.stepId === 'step-react');
    expect(globalOutcome?.outcomeSpecId).toBe('Yield_pct');
    expect(stepBoundOutcome?.outcomeSpecId).toBe('React_yield_pct');
    expect(stepBoundOutcome?.stepId).toBe('step-react');
  });

  it('supports multi-outcome (batch processes — Spec 2 §3.2.2)', () => {
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'active',
      metadata: { title: 'Batch process — Yield + ScrapRate + GradeA' },
      goal: {
        outcomeGoals: [
          { outcomeSpecId: 'Yield_pct', target: 95 },
          { outcomeSpecId: 'ScrapRate_pct', target: 2 },
          { outcomeSpecId: 'GradeA_ratio', target: 0.85 },
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
    expect(ip.goal.outcomeGoals).toHaveLength(3);
    // No "primary" hierarchy is enforced — order is the only quiet signal.
    expect(ip.goal.outcomeGoals[0].outcomeSpecId).toBe('Yield_pct');
  });
});
