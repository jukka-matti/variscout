/**
 * Tests for migration.ts — schema evolution for Finding and FindingSource.
 *
 * Covers:
 *   - migrateFindingStatus (4-status → 3-status model)
 *   - migrateSource: ichart brushedRange preservation (PR-RPS-4)
 *   - migrateSource: backward compat for ichart without brushedRange
 *   - migrateActionAssignee: string → FindingAssignee
 */
import { describe, it, expect } from 'vitest';
import { migrateFindings, migrateFindingStatus, migrateActionAssignee } from '../migration';
import type { Finding } from '../types';

const ROLLING_LENS = { mode: 'rolling' as const, windowSize: 50 };

// ── Minimal Finding factory ─────────────────────────────────────────────────

function makeFinding(overrides: Partial<Finding> & { id: string }): Finding {
  return {
    text: 'Test finding',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    investigationId: 'inv-test',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    ...overrides,
  };
}

// ── migrateFindingStatus ─────────────────────────────────────────────────────

describe('migrateFindingStatus', () => {
  it("maps 'confirmed' → 'analyzed' + tag 'key-driver'", () => {
    const f = makeFinding({ id: 'f1', status: 'observed' });
    const legacy = { ...f, status: 'confirmed' } as unknown as Finding;
    const result = migrateFindingStatus(legacy);
    expect(result.status).toBe('analyzed');
    expect(result.tag).toBe('key-driver');
  });

  it("maps 'dismissed' → 'analyzed' + tag 'low-impact'", () => {
    const f = makeFinding({ id: 'f1', status: 'observed' });
    const legacy = { ...f, status: 'dismissed' } as unknown as Finding;
    const result = migrateFindingStatus(legacy);
    expect(result.status).toBe('analyzed');
    expect(result.tag).toBe('low-impact');
  });

  it('preserves existing tag when already present', () => {
    const f = makeFinding({ id: 'f1', status: 'observed', tag: 'key-driver' });
    const legacy = { ...f, status: 'confirmed' } as unknown as Finding;
    const result = migrateFindingStatus(legacy);
    expect(result.tag).toBe('key-driver');
  });

  it('passes through non-legacy statuses unchanged', () => {
    const f = makeFinding({ id: 'f1', status: 'analyzed' });
    expect(migrateFindingStatus(f).status).toBe('analyzed');
  });
});

// ── migrateSource: ichart brushedRange ───────────────────────────────────────

describe('migrateFindings — ichart brushedRange', () => {
  it('preserves ichart brushedRange across migration', () => {
    const finding = makeFinding({
      id: 'f1',
      source: {
        chart: 'ichart',
        anchorX: 20,
        anchorY: 3.0,
        timeLens: ROLLING_LENS,
        brushedRange: { startIdx: 12, endIdx: 28 },
      },
    });
    const [after] = migrateFindings([finding]);
    expect(after.source).toEqual(
      expect.objectContaining({
        chart: 'ichart',
        brushedRange: { startIdx: 12, endIdx: 28 },
      })
    );
  });

  it('omits brushedRange when source has none (V1 ichart finding)', () => {
    const finding = makeFinding({
      id: 'f2',
      source: {
        chart: 'ichart',
        anchorX: 10,
        anchorY: 5.5,
        timeLens: ROLLING_LENS,
      },
    });
    const [after] = migrateFindings([finding]);
    expect(after.source).toMatchObject({ chart: 'ichart' });
    expect((after.source as Record<string, unknown>).brushedRange).toBeUndefined();
  });

  it('omits brushedRange when startIdx/endIdx are not finite numbers', () => {
    const finding = makeFinding({
      id: 'f3',
      source: {
        chart: 'ichart',
        anchorX: 10,
        anchorY: 5.5,
        timeLens: ROLLING_LENS,
        // Simulate partially-corrupt stored data
        brushedRange: { startIdx: NaN, endIdx: 28 } as unknown as {
          startIdx: number;
          endIdx: number;
        },
      },
    });
    const [after] = migrateFindings([finding]);
    expect((after.source as Record<string, unknown>).brushedRange).toBeUndefined();
  });

  it('backfills timeLens with DEFAULT_TIME_LENS when absent', () => {
    const legacy = makeFinding({
      id: 'f4',
      source: {
        chart: 'ichart',
        anchorX: 5,
        anchorY: 2.0,
      } as unknown as Finding['source'],
    });
    const [after] = migrateFindings([legacy]);
    expect(after.source).toBeDefined();
    expect((after.source as Record<string, unknown>).timeLens).toBeDefined();
  });
});

// ── migrateActionAssignee ────────────────────────────────────────────────────

describe('migrateActionAssignee', () => {
  it('returns undefined for undefined input', () => {
    expect(migrateActionAssignee(undefined)).toBeUndefined();
  });

  it('converts a string assignee to FindingAssignee', () => {
    const result = migrateActionAssignee('jane@contoso.com');
    expect(result).toEqual({ upn: 'jane@contoso.com', displayName: 'jane@contoso.com' });
  });

  it('passes through an already-migrated FindingAssignee', () => {
    const assignee = { upn: 'jane@contoso.com', displayName: 'Jane' };
    expect(migrateActionAssignee(assignee)).toBe(assignee);
  });
});
