import { describe, expect, it } from 'vitest';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  deriveActiveIPPresentation,
  getIPDayCounter,
  getIPRecentActivityFallback,
  getIPStageLabel,
  getIPUrgentLine,
} from '../activeIPPresentation';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 4, 15);

function makeIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
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

describe('activeIPPresentation', () => {
  it('derives a day counter from createdAt', () => {
    expect(getIPDayCounter(makeIP(), now)).toBe(4);
  });

  it('labels draft projects as Charter', () => {
    expect(getIPStageLabel(makeIP({ status: 'draft' }))).toBe('Charter');
  });

  it('labels active projects with no approach work as Approach', () => {
    expect(getIPStageLabel(makeIP())).toBe('Approach');
  });

  it('labels active projects with approach work as Control', () => {
    expect(
      getIPStageLabel(
        makeIP({
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
    expect(getIPStageLabel(makeIP({ status: 'closed' }))).toBe('Control');
  });

  it('labels projects with sustainmentRecordId as Control', () => {
    expect(
      getIPStageLabel(
        makeIP({
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
      getIPStageLabel(
        makeIP({
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
    expect(getIPUrgentLine(makeIP({ status: 'draft' }))).toBe('Pat awaiting Charter signoff');
    expect(getIPUrgentLine(makeIP())).toBe('Pat awaiting your Approach signoff');
    expect(
      getIPUrgentLine(
        makeIP({
          sections: {
            background: {},
            approach: { actionItemIds: ['a-1'] },
            outcomeReference: {},
          },
        })
      )
    ).toBe('Cadence tick due after sustainment setup');
  });

  it('gives a meaningful urgent line for closed projects referencing handoff/control plan', () => {
    const urgentLine = getIPUrgentLine(makeIP({ status: 'closed' }));
    expect(urgentLine.toLowerCase()).toMatch(/control plan|handoff/);
  });

  it('builds recent activity fallback rows when no feed exists', () => {
    expect(getIPRecentActivityFallback(makeIP(), now)).toEqual([
      'Heads 5-8 Cpk shortfall opened · Day 4',
      'Approach stage active · 1d ago',
      'Target set to 1.33 · current goal',
    ]);
  });

  it('returns the full presentation model for cards', () => {
    expect(deriveActiveIPPresentation(makeIP(), now)).toMatchObject({
      title: 'Heads 5-8 Cpk shortfall',
      statusLabel: 'ACTIVE',
      stageLabel: 'Approach',
      dayCounter: 4,
      urgentLine: 'Pat awaiting your Approach signoff',
    });
  });
});
