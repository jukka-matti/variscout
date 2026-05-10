import { describe, it, expect } from 'vitest';
import type { ImprovementProject, ImprovementProjectStatus } from '../types';

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
});
