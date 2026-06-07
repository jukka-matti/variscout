import { describe, expect, it } from 'vitest';
import type { Finding } from '../../findings/types';
import { humanizeAutoMintedReportLabel, humanizeReportFindingLabel } from '../reportHumanizer';

const now = Date.parse('2026-06-07T00:00:00Z');

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'find-1',
    text: 'Analyst wrote this in plain language.',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: now,
    createdAt: now,
    deletedAt: null,
    ...overrides,
  } as Finding;
}

describe('humanizeReportFindingLabel', () => {
  it('humanizes brush-generated finding text before executive report display', () => {
    expect(
      humanizeReportFindingLabel(
        finding({
          text: 'Brushed indices 32-58 on Day_of_Week',
          context: { activeFilters: { 'obs 32-58': ['in'] }, cumulativeScope: null },
        })
      )
    ).toBe('Day-of-Week, observations 32-58');
  });

  it('humanizes auto-minted observation factor filters when text is empty', () => {
    expect(
      humanizeReportFindingLabel(
        finding({
          text: '',
          context: { activeFilters: { 'obs 32-58': ['in'] }, cumulativeScope: null },
        })
      )
    ).toBe('observations 32-58');
  });

  it('uses column aliases before formatting column names', () => {
    expect(
      humanizeReportFindingLabel(
        finding({
          text: 'Brushed indices 32-58 on Day_of_Week',
          context: { activeFilters: { 'obs 32-58': ['in'] }, cumulativeScope: null },
        }),
        { Day_of_Week: 'Production day' }
      )
    ).toBe('Production day, observations 32-58');
  });

  it('leaves analyst-written labels intact', () => {
    expect(
      humanizeReportFindingLabel(
        finding({
          text: 'Night shift fill weight rises after the oven pause.',
          context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: null },
        })
      )
    ).toBe('Night shift fill weight rises after the oven pause.');
  });

  it('humanizes auto-minted standalone report labels', () => {
    expect(humanizeAutoMintedReportLabel('obs 32-58 in/out')).toBe('observations 32-58');
  });
});
