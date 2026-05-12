import { describe, expect, it } from 'vitest';
import { surveyInboxRules } from '../inbox';
import type { ImprovementProject } from '../../improvementProject';
import type { SustainmentRecord } from '../../sustainment';

const NOW = Date.UTC(2026, 4, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

const sustainmentRecord = (overrides: Partial<SustainmentRecord>): SustainmentRecord =>
  ({
    id: 'sr-1',
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'pending',
    title: 'Mix temperature control',
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'weekly',
    createdAt: NOW - 10 * DAY_MS,
    deletedAt: null,
    updatedAt: NOW - DAY_MS,
    ...overrides,
  }) as SustainmentRecord;

const improvementProject = (overrides: Partial<ImprovementProject>): ImprovementProject =>
  ({
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'closed',
    metadata: { title: 'Reduce mix temperature drift' },
    goal: { outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 } },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: NOW - 45 * DAY_MS,
    deletedAt: null,
    updatedAt: NOW - 45 * DAY_MS,
    ...overrides,
  }) as ImprovementProject;

describe('surveyInboxRules', () => {
  it('aggregates sustainment hints into inbox prompts sorted by severity then message and id', () => {
    const prompts = surveyInboxRules({
      improvementProjects: [
        improvementProject({ id: 'ip-old', metadata: { title: 'A closed project' } }),
      ],
      sustainmentRecords: [
        sustainmentRecord({ id: 'sr-info', title: 'B progress', consecutiveOnTargetTicks: 3 }),
        sustainmentRecord({ id: 'sr-critical', title: 'C drift', status: 'drifted' }),
      ],
      now: NOW,
    });

    expect(prompts.map(prompt => prompt.severity)).toEqual(['critical', 'warning', 'info']);
    expect(prompts.map(prompt => prompt.sourceHint.surface)).toEqual(['inbox', 'inbox', 'inbox']);
    expect(prompts.map(prompt => prompt.id)).toEqual([
      'inbox:drift-detection:sr-critical',
      'inbox:lifecycle-gap:ip-old',
      'inbox:drift-detection:sr-info',
    ]);
    expect(prompts[0]).toMatchObject({
      action: {
        label: 'Open sustainment record',
        opensSurface: 'sustainment',
        opensId: 'sr-critical',
      },
      sourceHint: {
        kind: 'drift-detection',
        surface: 'inbox',
        targetEntityId: 'sr-critical',
      },
    });
  });
});
