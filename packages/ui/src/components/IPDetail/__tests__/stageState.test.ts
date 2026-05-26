import { describe, it, expect } from 'vitest';
import { deriveStageState, type StageStateMap } from '../stageState';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const baseIP: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'draft',
  metadata: { title: 'X' },
  goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('deriveStageState', () => {
  it('charter is current when IP is draft', () => {
    const state: StageStateMap = deriveStageState(baseIP);
    expect(state.charter).toBe('current');
    expect(state.approach).toBe('upcoming');
    expect(state.sustainment).toBe('upcoming');
  });

  it('approach becomes current when IP is active', () => {
    const ip: ImprovementProject = { ...baseIP, status: 'active' };
    const state = deriveStageState(ip);
    expect(state.charter).toBe('done');
    expect(state.approach).toBe('current');
    expect(state.sustainment).toBe('upcoming');
  });

  it('sustainment becomes current when IP is closed', () => {
    const ip: ImprovementProject = { ...baseIP, status: 'closed' };
    const state = deriveStageState(ip);
    expect(state.charter).toBe('done');
    expect(state.approach).toBe('done');
    expect(state.sustainment).toBe('current');
  });

  it('all stages done when sustainmentConfirmed', () => {
    const ip: ImprovementProject = { ...baseIP, status: 'closed' };
    const state = deriveStageState(ip, { sustainmentConfirmed: true });
    expect(state.charter).toBe('done');
    expect(state.approach).toBe('done');
    expect(state.sustainment).toBe('done');
  });
});
