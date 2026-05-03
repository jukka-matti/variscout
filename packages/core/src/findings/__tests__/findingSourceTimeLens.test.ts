/**
 * Tests for timeLens on FindingSource — round-trip, migration, type exhaustiveness.
 *
 * Covers Task 9: findings replay with timeLens.
 */
import { describe, it, expect } from 'vitest';
import type { FindingSource } from '../types';
import { migrateFindings } from '../migration';
import { DEFAULT_TIME_LENS } from '../../stats/timeLens';
import type { Finding } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFindingWith(source: FindingSource): Finding {
  return {
    id: 'f-test',
    text: 'test',
    createdAt: 1000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1000,
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

  it('yamazumi source preserves timeLens after JSON round-trip', () => {
    const source: FindingSource = {
      chart: 'yamazumi',
      category: 'Setup',
      activityType: 'waste',
      timeLens: FIXED_LENS,
    };
    const finding = makeFindingWith(source);
    const deserialized: Finding = JSON.parse(JSON.stringify(finding));
    expect(deserialized.source?.timeLens).toEqual(FIXED_LENS);
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

// ---------------------------------------------------------------------------
// Migration: old findings without timeLens rehydrate with DEFAULT_TIME_LENS
// ---------------------------------------------------------------------------

describe('migrateFindings — timeLens back-fill', () => {
  it('back-fills DEFAULT_TIME_LENS on a boxplot source that lacks the field', () => {
    // Simulate a pre-Task-9 persisted finding (no timeLens on source).
    const oldFinding = {
      id: 'f-old',
      text: 'old finding',
      createdAt: 1000,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [],
      statusChangedAt: 1000,
      source: { chart: 'boxplot', category: 'Head 3' },
    } as unknown as Finding;

    const [migrated] = migrateFindings([oldFinding]);
    expect(migrated.source?.timeLens).toEqual(DEFAULT_TIME_LENS);
  });

  it('back-fills DEFAULT_TIME_LENS on an ichart source that lacks the field', () => {
    const oldFinding = {
      id: 'f-ichart',
      text: 'ichart finding',
      createdAt: 2000,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [],
      statusChangedAt: 2000,
      source: { chart: 'ichart', anchorX: 5, anchorY: 10 },
    } as unknown as Finding;

    const [migrated] = migrateFindings([oldFinding]);
    expect(migrated.source?.timeLens).toEqual(DEFAULT_TIME_LENS);
  });

  it('back-fills DEFAULT_TIME_LENS on a coscout source that lacks the field', () => {
    const oldFinding = {
      id: 'f-coscout',
      text: 'coscout finding',
      createdAt: 3000,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [],
      statusChangedAt: 3000,
      source: { chart: 'coscout', messageId: 'msg-legacy' },
    } as unknown as Finding;

    const [migrated] = migrateFindings([oldFinding]);
    expect(migrated.source?.timeLens).toEqual(DEFAULT_TIME_LENS);
  });

  it('preserves an existing timeLens on already-migrated findings', () => {
    const lens = { mode: 'rolling' as const, windowSize: 30 };
    const alreadyMigrated = makeFindingWith({
      chart: 'pareto',
      category: 'Defect A',
      timeLens: lens,
    });

    const [migrated] = migrateFindings([alreadyMigrated]);
    expect(migrated.source?.timeLens).toEqual(lens);
  });

  it('returns finding unchanged when source is absent', () => {
    const noSource: Finding = {
      id: 'f-nosrc',
      text: 'no source',
      createdAt: 1000,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [],
      statusChangedAt: 1000,
    };
    const [migrated] = migrateFindings([noSource]);
    expect(migrated.source).toBeUndefined();
  });
});
