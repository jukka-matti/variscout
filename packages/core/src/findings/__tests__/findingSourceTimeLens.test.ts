/**
 * Tests for timeLens on FindingSource — round-trip + type exhaustiveness.
 *
 * Covers Task 9: findings replay with timeLens.
 */
import { describe, it, expect } from 'vitest';
import type { FindingSource } from '../types';
import { DEFAULT_TIME_LENS } from '../../stats/timeLens';
import type { Finding } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFindingWith(source: FindingSource): Finding {
  return {
    id: 'f-test',
    text: 'test',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1714000000000,
    source,
  };
}

const ROLLING_LENS = { mode: 'rolling' as const, windowSize: 50 };
const FIXED_LENS = { mode: 'fixed' as const, anchor: 100, windowSize: 50 };
const OPEN_ENDED_LENS = { mode: 'openEnded' as const, anchor: 20 };

// ---------------------------------------------------------------------------
// Round-trip: construct with timeLens, serialize (JSON), deserialize, lens intact
// ---------------------------------------------------------------------------

describe('FindingSource timeLens — round-trip per variant', () => {
  it('boxplot source preserves timeLens after JSON round-trip', () => {
    const source: FindingSource = {
      chart: 'boxplot',
      category: 'Machine A',
      timeLens: ROLLING_LENS,
    };
    const finding = makeFindingWith(source);
    const serialized = JSON.stringify(finding);
    const deserialized: Finding = JSON.parse(serialized);
    expect(deserialized.source).toEqual(source);
    expect(deserialized.source?.timeLens).toEqual(ROLLING_LENS);
  });

  it('pareto source preserves timeLens after JSON round-trip', () => {
    const source: FindingSource = {
      chart: 'pareto',
      category: 'Shift B',
      timeLens: FIXED_LENS,
    };
    const finding = makeFindingWith(source);
    const deserialized: Finding = JSON.parse(JSON.stringify(finding));
    expect(deserialized.source?.timeLens).toEqual(FIXED_LENS);
  });

  it('ichart source preserves timeLens after JSON round-trip', () => {
    const source: FindingSource = {
      chart: 'ichart',
      anchorX: 10,
      anchorY: 5.5,
      timeLens: OPEN_ENDED_LENS,
    };
    const finding = makeFindingWith(source);
    const deserialized: Finding = JSON.parse(JSON.stringify(finding));
    expect(deserialized.source?.timeLens).toEqual(OPEN_ENDED_LENS);
  });

  it('probability source preserves timeLens after JSON round-trip', () => {
    const source: FindingSource = {
      chart: 'probability',
      anchorX: 11.7,
      anchorY: 0.02,
      seriesKey: 'Normal',
      timeLens: ROLLING_LENS,
    };
    const finding = makeFindingWith(source);
    const deserialized: Finding = JSON.parse(JSON.stringify(finding));
    expect(deserialized.source?.timeLens).toEqual(ROLLING_LENS);
  });

  it('coscout source preserves timeLens after JSON round-trip', () => {
    const source: FindingSource = {
      chart: 'coscout',
      messageId: 'msg-abc',
      timeLens: DEFAULT_TIME_LENS,
    };
    const finding = makeFindingWith(source);
    const deserialized: Finding = JSON.parse(JSON.stringify(finding));
    expect(deserialized.source?.timeLens).toEqual(DEFAULT_TIME_LENS);
  });
});
