import { describe, it, expect } from 'vitest';
import { proposeDisconfirmationMove } from '../proposeDisconfirmationMove';
import type { SuspectedCause, Finding } from '@variscout/core';

function finding(
  id: string,
  source: Finding['source'],
  validationStatus?: Finding['validationStatus']
): Finding {
  return {
    id,
    text: '',
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    source,
    validationStatus,
  };
}

function hub(id: string, findingIds: string[]): SuspectedCause {
  return {
    id,
    name: id,
    synthesis: '',
    questionIds: [],
    findingIds,
    status: 'suspected',
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
  };
}

describe('proposeDisconfirmationMove', () => {
  const data = [{ SHIFT: 'night' }, { SHIFT: 'day' }, { SHIFT: 'evening' }, { SHIFT: 'night' }];

  it('returns undefined when hub has <3 supporting findings', () => {
    const h = hub('h1', ['f1', 'f2']);
    const findings = [
      finding('f1', { chart: 'boxplot', category: 'night' }),
      finding('f2', { chart: 'boxplot', category: 'night' }),
    ];
    expect(proposeDisconfirmationMove(h, findings, data)).toBeUndefined();
  });

  it('returns undefined when a contradicting finding already exists', () => {
    const h = hub('h1', ['f1', 'f2', 'f3', 'f4']);
    const findings = [
      finding('f1', { chart: 'boxplot', category: 'night' }),
      finding('f2', { chart: 'boxplot', category: 'night' }),
      finding('f3', { chart: 'boxplot', category: 'night' }),
      finding('f4', { chart: 'boxplot', category: 'day' }, 'contradicts'),
    ];
    expect(proposeDisconfirmationMove(h, findings, data)).toBeUndefined();
  });

  it('suggests complementary categorical brush when eligible', () => {
    const h = hub('h1', ['f1', 'f2', 'f3']);
    const findings = [
      finding('f1', { chart: 'boxplot', category: 'night' }),
      finding('f2', { chart: 'boxplot', category: 'night' }),
      finding('f3', { chart: 'boxplot', category: 'night' }),
    ];
    const result = proposeDisconfirmationMove(h, findings, data);
    expect(result).toBeDefined();
    expect(result?.chart).toBe('boxplot');
    expect(result?.suggestedCategory).toBeDefined();
    expect(result?.suggestedCategory).not.toBe('night');
  });

  it('returns undefined for coscout-only findings', () => {
    const h = hub('h1', ['f1', 'f2', 'f3']);
    const findings = [
      finding('f1', { chart: 'coscout', messageId: 'm1' }),
      finding('f2', { chart: 'coscout', messageId: 'm2' }),
      finding('f3', { chart: 'coscout', messageId: 'm3' }),
    ];
    expect(proposeDisconfirmationMove(h, findings, data)).toBeUndefined();
  });
});
