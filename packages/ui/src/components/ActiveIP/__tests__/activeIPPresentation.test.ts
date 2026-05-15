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
    goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 } },
    sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
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

  it('labels active projects by section readiness', () => {
    expect(getIPStageLabel(makeIP())).toBe('Approach');
    expect(
      getIPStageLabel(
        makeIP({
          sections: {
            background: {},
            investigationLineage: {},
            approach: { actionItemIds: ['a-1'] },
            outcomeReference: { sustainmentRecordId: 'sr-1' },
          },
        })
      )
    ).toBe('Handoff');
  });

  it('derives urgent lines with deterministic fallbacks', () => {
    expect(getIPUrgentLine(makeIP({ status: 'draft' }))).toBe('Pat awaiting Charter signoff');
    expect(getIPUrgentLine(makeIP())).toBe('Pat awaiting your Approach signoff');
    expect(
      getIPUrgentLine(
        makeIP({
          sections: {
            background: {},
            investigationLineage: {},
            approach: { actionItemIds: ['a-1'] },
            outcomeReference: {},
          },
        })
      )
    ).toBe('Cadence tick due after sustainment setup');
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
