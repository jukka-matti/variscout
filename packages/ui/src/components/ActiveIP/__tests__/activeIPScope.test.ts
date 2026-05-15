import { describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  deriveActiveIPCanvasFocus,
  deriveActiveIPLineageIds,
  deriveActiveIPScopeLabels,
} from '../activeIPScope';

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Line 3',
  createdAt: 0,
  deletedAt: null,
  outcomes: [
    {
      id: 'outcome-weight',
      hubId: 'hub-1',
      columnName: 'Fill Weight',
      characteristicType: 'nominalIsBest',
      target: 10,
      createdAt: 0,
      deletedAt: null,
    },
  ],
  canonicalProcessMap: {
    version: 1,
    nodes: [
      { id: 'mix', name: 'Mix', order: 0 },
      { id: 'fill', name: 'Fill', order: 1, ctqColumn: 'Fill Weight' },
    ],
    tributaries: [],
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
  },
};

function makeIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: Date.UTC(2026, 4, 1),
    updatedAt: Date.UTC(2026, 4, 2),
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Lift fill Cpk' },
    goal: { outcomeGoal: { outcomeSpecId: 'outcome-weight', target: 1.33 } },
    sections: {
      background: {},
      investigationLineage: { hypothesisIds: ['h-1'], findingIds: ['f-1'] },
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
  };
}

describe('activeIPScope', () => {
  it('derives visible Analyze context labels without mutating document data', () => {
    const labels = deriveActiveIPScopeLabels(
      makeIP({
        goal: {
          outcomeGoal: { outcomeSpecId: 'outcome-weight', target: 1.33 },
          factorControls: [{ factor: 'Head', targetCondition: '5-8' }],
        },
      }),
      hub,
      Date.UTC(2026, 4, 15)
    );

    expect(labels.outcomeLabel).toBe('Fill Weight');
    expect(labels.factorLabels).toEqual(['Head']);
    expect(labels.timelineLabel).toMatch(/^Since /);
  });

  it('derives process focus level from goal depth', () => {
    expect(deriveActiveIPCanvasFocus(makeIP(), hub)).toEqual({ level: 'l1' });
    expect(
      deriveActiveIPCanvasFocus(
        makeIP({
          goal: {
            outcomeGoal: { outcomeSpecId: 'outcome-weight', target: 1.33 },
            factorControls: [{ factor: 'Head', targetCondition: '5-8' }],
          },
        }),
        hub
      )
    ).toEqual({ level: 'l2' });
    expect(
      deriveActiveIPCanvasFocus(
        makeIP({
          goal: {
            outcomeGoal: { outcomeSpecId: 'outcome-weight', target: 1.33 },
            mechanismGoals: [{ description: 'Stabilize fill valve' }],
          },
        }),
        hub
      )
    ).toEqual({ level: 'l3', focalStepId: 'fill' });
  });

  it('returns lineage ids for tab scoping', () => {
    expect(deriveActiveIPLineageIds(makeIP())).toEqual({
      hypothesisIds: ['h-1'],
      findingIds: ['f-1'],
    });
  });
});
