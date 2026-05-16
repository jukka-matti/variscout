import { describe, it, expect } from 'vitest';
import type { MeasurementPlan, MeasurementMethod, MeasurementPlanStatus } from '../types';
import type { ProjectMember } from '../../projectMembership/types';

describe('MeasurementMethod', () => {
  it('exhaustively enumerates 5 method values', () => {
    const methods: MeasurementMethod[] = [
      'sensor',
      'manual-count',
      'gemba-walk',
      'expert-assessment',
      'other',
    ];
    expect(methods).toHaveLength(5);
  });
});

describe('MeasurementPlanStatus', () => {
  it('exhaustively enumerates 4 status values', () => {
    const statuses: MeasurementPlanStatus[] = ['planned', 'in-progress', 'complete', 'skipped'];
    expect(statuses).toHaveLength(4);
  });
});

describe('MeasurementPlan', () => {
  it('has the wedge spec §3.6.3 shape', () => {
    const ownerId: ProjectMember['id'] = 'pm-1';
    const plan: MeasurementPlan = {
      id: 'mp-1',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      factor: 'Nozzle temperature',
      method: 'sensor',
      sampleSize: 50,
      owner: ownerId,
      status: 'planned',
    };
    expect(plan.factor).toBe('Nozzle temperature');
    expect(plan.method).toBe('sensor');
    expect(plan.sampleSize).toBe(50);
    expect(plan.status).toBe('planned');
    expect(plan.hypothesisId).toBe('h-1');
  });

  it('supports optional linkedFindingIds + msaRequired', () => {
    const plan: MeasurementPlan = {
      id: 'mp-2',
      createdAt: 100,
      deletedAt: null,
      hypothesisId: 'h-1',
      factor: 'X',
      method: 'gemba-walk',
      sampleSize: 10,
      owner: 'pm-1',
      status: 'complete',
      linkedFindingIds: ['f-1', 'f-2'],
      msaRequired: true,
    };
    expect(plan.linkedFindingIds).toEqual(['f-1', 'f-2']);
    expect(plan.msaRequired).toBe(true);
  });
});
