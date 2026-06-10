import { describe, expect, it } from 'vitest';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  deriveWorkspaceProjectPresentation,
  getWorkspaceProjectDayCounter,
  getWorkspaceProjectRecentActivityFallback,
  getWorkspaceProjectStageLabel,
  getWorkspaceProjectUrgentLine,
} from '../workspaceProjectPresentation';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 4, 15);

function makeWorkspaceProject(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: now - 3 * DAY_MS,
    updatedAt: now - DAY_MS,
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Heads 5-8 Cpk shortfall' },
    goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
    sections: { background: {}, approach: {}, outcomeReference: {} },
    ...overrides,
  };
}

describe('workspaceProjectPresentation', () => {
  it('derives a day counter from createdAt', () => {
    expect(getWorkspaceProjectDayCounter(makeWorkspaceProject(), now)).toBe(4);
  });

  it('labels draft projects as Charter', () => {
    expect(getWorkspaceProjectStageLabel(makeWorkspaceProject({ status: 'draft' }))).toBe(
      'Charter'
    );
  });

  it('labels active projects with no approach work as Approach', () => {
    expect(getWorkspaceProjectStageLabel(makeWorkspaceProject())).toBe('Approach');
  });

  it('labels active projects with approach work as Control', () => {
    expect(
      getWorkspaceProjectStageLabel(
        makeWorkspaceProject({
          sections: {
            background: {},
            approach: { actionItemIds: ['a-1'] },
            outcomeReference: {},
          },
        })
      )
    ).toBe('Control');
  });

  it('labels closed projects as Control (not Handoff)', () => {
    expect(getWorkspaceProjectStageLabel(makeWorkspaceProject({ status: 'closed' }))).toBe(
      'Control'
    );
  });

  it('labels projects with sustainmentRecordId as Control', () => {
    expect(
      getWorkspaceProjectStageLabel(
        makeWorkspaceProject({
          sections: {
            background: {},
            approach: {},
            outcomeReference: { sustainmentRecordId: 'sr-1' },
          },
        })
      )
    ).toBe('Control');
  });

  it('labels projects with controlHandoffId as Control', () => {
    expect(
      getWorkspaceProjectStageLabel(
        makeWorkspaceProject({
          sections: {
            background: {},
            approach: {},
            outcomeReference: { controlHandoffId: 'ch-1' },
          },
        })
      )
    ).toBe('Control');
  });

  it('derives urgent lines with deterministic fallbacks', () => {
    expect(getWorkspaceProjectUrgentLine(makeWorkspaceProject({ status: 'draft' }))).toBe(
      'Pat awaiting Charter signoff'
    );
    expect(getWorkspaceProjectUrgentLine(makeWorkspaceProject())).toBe(
      'Pat awaiting your Approach signoff'
    );
    expect(
      getWorkspaceProjectUrgentLine(
        makeWorkspaceProject({
          sections: {
            background: {},
            approach: { actionItemIds: ['a-1'] },
            outcomeReference: {},
          },
        })
      )
    ).toBe('Control setup ready');
  });

  it('renders a soft Control resume line when the ladder suggests a check', () => {
    expect(
      getWorkspaceProjectUrgentLine(
        makeWorkspaceProject({
          sections: {
            background: {},
            approach: {},
            outcomeReference: { sustainmentRecordId: 'sr-1' },
          },
        }),
        now,
        {
          recordId: 'sr-1',
          ladderStep: 1,
          nextCheckSuggestedAt: new Date(now - DAY_MS).toISOString(),
          status: 'verifying',
        }
      )
    ).toBe('Control: re-ingest to verify - 2nd check suggested');
  });

  it('keeps Control resume styling soft when the ladder date is in the future', () => {
    expect(
      getWorkspaceProjectUrgentLine(
        makeWorkspaceProject({
          sections: {
            background: {},
            approach: {},
            outcomeReference: { sustainmentRecordId: 'sr-1' },
          },
        }),
        now,
        {
          recordId: 'sr-1',
          ladderStep: 2,
          nextCheckSuggestedAt: new Date(now + DAY_MS).toISOString(),
          status: 'verifying',
        }
      )
    ).toBe('Control setup ready');
  });

  it('gives a meaningful urgent line for closed projects referencing handoff/control plan', () => {
    const urgentLine = getWorkspaceProjectUrgentLine(makeWorkspaceProject({ status: 'closed' }));
    expect(urgentLine.toLowerCase()).toMatch(/control|handoff/);
  });

  it('builds recent activity fallback rows when no feed exists', () => {
    expect(getWorkspaceProjectRecentActivityFallback(makeWorkspaceProject(), now)).toEqual([
      'Heads 5-8 Cpk shortfall opened · Day 4',
      'Approach stage active · 1d ago',
      'Target set to 1.33 · current goal',
    ]);
  });

  it('returns the full presentation model for cards', () => {
    expect(deriveWorkspaceProjectPresentation(makeWorkspaceProject(), now)).toMatchObject({
      title: 'Heads 5-8 Cpk shortfall',
      statusLabel: 'ACTIVE',
      stageLabel: 'Approach',
      dayCounter: 4,
      urgentLine: 'Pat awaiting your Approach signoff',
    });
  });
});
