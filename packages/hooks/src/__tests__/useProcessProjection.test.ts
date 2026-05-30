/**
 * useProcessProjection — focused on the IM-5 live-drill-chip What-If binding.
 *
 * The hook is pure (all data arrives via options). These tests cover the NEW
 * `liveScopeProjection` memo: it builds a single-element findingFilters from the
 * live drill chips (analysisScopeStore.categoricalFilters, passed as
 * `liveScopeFilters`) and projects the overall Cpk if that condition were fixed.
 *
 * It is DISTINCT from the existing ≥2-finding `cumulativeProjection` memo, which
 * must keep its 2-finding floor untouched.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProcessProjection } from '../useProcessProjection';
import type { UseProcessProjectionOptions } from '../useProcessProjection';
import type { DataRow, StatsResult } from '@variscout/core';

// Deterministic dataset: Machine A runs hot against USL=13; B is centred.
function makeRawData(): DataRow[] {
  const rows: DataRow[] = [];
  for (let i = 0; i < 30; i++) rows.push({ Value: 12 + (i % 5) * 0.1, Machine: 'A' });
  for (let i = 0; i < 30; i++) rows.push({ Value: 10 + (i % 5) * 0.1, Machine: 'B' });
  return rows;
}

const SPECS = { lsl: 8, usl: 13 };

const baseStats: StatsResult = {
  mean: 11,
  median: 11,
  stdDev: 1,
  sigmaWithin: 1,
  mrBar: 1.13,
  ucl: 14,
  lcl: 8,
  outOfSpecPercentage: 5,
  cpk: 0.6,
  cp: 0.9,
};

function makeOptions(
  overrides: Partial<UseProcessProjectionOptions> = {}
): UseProcessProjectionOptions {
  const rawData = makeRawData();
  return {
    rawData,
    filteredData: rawData,
    outcome: 'Value',
    specs: SPECS,
    stats: baseStats,
    filterStack: [],
    ...overrides,
  };
}

describe('useProcessProjection — liveScopeProjection (IM-5)', () => {
  it('projects an "if fixed" Cpk from a single live drill chip', () => {
    const { result } = renderHook(() =>
      useProcessProjection(
        makeOptions({
          liveScopeFilters: [{ column: 'Machine', values: ['A'] }],
        })
      )
    );
    expect(result.current.liveScopeProjection).not.toBeNull();
    expect(result.current.liveScopeProjection?.label).toBe('if fixed');
    expect(typeof result.current.liveScopeProjection?.projectedCpk).toBe('number');
  });

  it('returns null liveScopeProjection when there are no live chips', () => {
    const { result } = renderHook(() => useProcessProjection(makeOptions()));
    expect(result.current.liveScopeProjection).toBeNull();
  });

  it('returns null liveScopeProjection when no specs are set', () => {
    const { result } = renderHook(() =>
      useProcessProjection(
        makeOptions({
          specs: {},
          liveScopeFilters: [{ column: 'Machine', values: ['A'] }],
        })
      )
    );
    expect(result.current.liveScopeProjection).toBeNull();
  });

  it('surfaces liveScopeProjection as the activeProjection when nothing higher-priority is present', () => {
    const { result } = renderHook(() =>
      useProcessProjection(
        makeOptions({
          liveScopeFilters: [{ column: 'Machine', values: ['A'] }],
        })
      )
    );
    expect(result.current.activeProjection).toBe(result.current.liveScopeProjection);
  });

  it('does NOT relax the ≥2-finding cumulativeProjection floor', () => {
    // A SINGLE scoped finding must NOT produce a cumulativeProjection — the live
    // chip path is the single-condition route, the cumulative memo needs ≥2.
    const { result } = renderHook(() =>
      useProcessProjection(
        makeOptions({
          scopedFindings: [
            {
              id: 'f-1',
              text: 'A',
              createdAt: 0,
              updatedAt: 0,
              status: 'open',
              context: { activeFilters: { Machine: ['A'] }, cumulativeScope: null, stats: {} },
            } as unknown as NonNullable<UseProcessProjectionOptions['scopedFindings']>[number],
          ],
        })
      )
    );
    expect(result.current.cumulativeProjection).toBeNull();
  });

  it('cumulativeProjection (≥2 findings) outranks liveScopeProjection in activeProjection', () => {
    const findings = [
      {
        id: 'f-1',
        text: 'A',
        createdAt: 0,
        updatedAt: 0,
        status: 'open',
        context: { activeFilters: { Machine: ['A'] }, cumulativeScope: null, stats: {} },
      },
      {
        id: 'f-2',
        text: 'B',
        createdAt: 0,
        updatedAt: 0,
        status: 'open',
        context: { activeFilters: { Machine: ['B'] }, cumulativeScope: null, stats: {} },
      },
    ] as unknown as NonNullable<UseProcessProjectionOptions['scopedFindings']>;

    const { result } = renderHook(() =>
      useProcessProjection(
        makeOptions({
          scopedFindings: findings,
          liveScopeFilters: [{ column: 'Machine', values: ['A'] }],
        })
      )
    );
    expect(result.current.cumulativeProjection).not.toBeNull();
    expect(result.current.activeProjection).toBe(result.current.cumulativeProjection);
  });
});
