import { describe, it, expect } from 'vitest';
import { computeFindingWindowDrift } from '../drift';
import type { Finding, WindowContext } from '../types';

// Minimal valid FindingContext for test mocks
const stubContext: Finding['context'] = {
  activeFilters: {},
  cumulativeScope: null,
};

const makeFinding = (atCreation: WindowContext['statsAtCreation']): Finding => ({
  id: 'f1',
  text: 'Test finding',
  createdAt: 1714000000000,
  deletedAt: null,
  investigationId: 'inv-test-001',
  context: stubContext,
  status: 'observed',
  comments: [],
  statusChangedAt: 1714000000000,
  windowContext: {
    windowAtCreation: {
      kind: 'fixed',
      startISO: '2026-03-01T00:00:00Z',
      endISO: '2026-03-31T23:59:59Z',
    },
    statsAtCreation: atCreation,
  },
});

describe('computeFindingWindowDrift', () => {
  it('returns no-drift when stats are identical', () => {
    const finding = makeFinding({ cpk: 1.2, mean: 50, sigma: 2, n: 200 });
    const result = computeFindingWindowDrift(finding, { cpk: 1.2, mean: 50, sigma: 2, n: 200 });
    expect(result?.drifted).toBe(false);
    expect(result?.relativeChange ?? 0).toBeCloseTo(0, 5);
  });

  it('flags drift when Cpk relative change exceeds threshold', () => {
    const finding = makeFinding({ cpk: 1.0, n: 200 });
    const result = computeFindingWindowDrift(finding, { cpk: 0.7, n: 200 });
    expect(result?.drifted).toBe(true);
    expect(result?.relativeChange).toBeCloseTo(-0.3, 2);
  });

  it('respects per-finding threshold override', () => {
    const finding: Finding = {
      ...makeFinding({ cpk: 1.0, n: 200 }),
      windowContext: {
        windowAtCreation: {
          kind: 'fixed',
          startISO: '2026-03-01T00:00:00Z',
          endISO: '2026-03-31T23:59:59Z',
        },
        statsAtCreation: { cpk: 1.0, n: 200 },
        driftThreshold: 0.05,
      },
    };
    const result = computeFindingWindowDrift(finding, { cpk: 0.95, n: 200 });
    expect(result?.drifted).toBe(true); // 5% change at 5% threshold = drifted
  });

  it('returns null when finding has no windowContext', () => {
    const finding: Finding = {
      id: 'f1',
      text: 'no ctx',
      createdAt: 1714000000000,
      deletedAt: null,
      investigationId: 'inv-test-001',
      context: stubContext,
      status: 'observed',
      comments: [],
      statusChangedAt: 1714000000000,
    };
    const result = computeFindingWindowDrift(finding, { cpk: 0.5, n: 100 });
    expect(result).toBeNull();
  });
});
