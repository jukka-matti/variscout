/**
 * Tests for useDashboardComputedData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardComputedData } from '../useDashboardComputedData';
import type { DataRow } from '@variscout/core';

const RAW_DATA = [
  { Machine: 'A', Shift: 'Day', Weight: 10 },
  { Machine: 'A', Shift: 'Day', Weight: 20 },
  { Machine: 'A', Shift: 'Night', Weight: 30 },
  { Machine: 'B', Shift: 'Day', Weight: 40 },
  { Machine: 'B', Shift: 'Night', Weight: 50 },
  { Machine: 'B', Shift: 'Night', Weight: 60 },
];

const EMPTY_DATA: DataRow[] = [];

describe('useDashboardComputedData', () => {
  describe('availableOutcomes', () => {
    it('identifies numeric columns', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.availableOutcomes).toContain('Weight');
      expect(result.current.availableOutcomes).not.toContain('Machine');
      expect(result.current.availableOutcomes).not.toContain('Shift');
    });

    it('returns empty for empty data', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: EMPTY_DATA,
          filteredData: EMPTY_DATA,
          outcome: null,
          boxplotFactor: '',
        })
      );

      expect(result.current.availableOutcomes).toEqual([]);
    });
  });

  describe('availableStageColumns', () => {
    it('identifies columns with 2-10 unique values', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      // Machine has 2 unique values (A, B), Shift has 2 (Day, Night)
      expect(result.current.availableStageColumns).toContain('Machine');
      expect(result.current.availableStageColumns).toContain('Shift');
      // Outcome column is excluded
      expect(result.current.availableStageColumns).not.toContain('Weight');
    });

    it('excludes outcome column', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.availableStageColumns).not.toContain('Weight');
    });
  });

  describe('anovaResult', () => {
    it('exposes isPending boolean in result', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      expect(typeof result.current.isPending).toBe('boolean');
    });

    it('computes ANOVA for factor vs outcome', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.anovaResult).not.toBeNull();
      expect(result.current.anovaResult!.fStatistic).toBeGreaterThan(0);
      expect(result.current.anovaResult!.pValue).toBeDefined();
    });

    it('returns null when outcome is null', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: null,
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.anovaResult).toBeNull();
    });

    it('returns null when filteredData is empty', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: EMPTY_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.anovaResult).toBeNull();
    });
  });

  describe('boxplotData', () => {
    it('groups data by boxplot factor', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.boxplotData).toHaveLength(2);
      const keys = result.current.boxplotData.map(g => g.key);
      expect(keys).toContain('A');
      expect(keys).toContain('B');
    });

    it('computes correct stats per group', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      const groupA = result.current.boxplotData.find(g => g.key === 'A')!;
      // Machine A: values [10, 20, 30], mean = 20
      expect(groupA.mean).toBeCloseTo(20, 5);
      expect(groupA.values).toEqual([10, 20, 30]);

      const groupB = result.current.boxplotData.find(g => g.key === 'B')!;
      // Machine B: values [40, 50, 60], mean = 50
      expect(groupB.mean).toBeCloseTo(50, 5);
    });

    it('returns empty for empty filteredData', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: EMPTY_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.boxplotData).toEqual([]);
    });

    it('returns empty when outcome is null', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: null,
          boxplotFactor: 'Machine',
        })
      );

      expect(result.current.boxplotData).toEqual([]);
    });

    it('respects sort options', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
          boxplotSortBy: 'mean',
          boxplotSortDirection: 'desc',
        })
      );

      // B (mean 50) should come before A (mean 20) when sorted desc
      expect(result.current.boxplotData[0].key).toBe('B');
      expect(result.current.boxplotData[1].key).toBe('A');
    });
  });

  // G1 Task 4 follow-up: derived-factor channel must produce populated groups.
  describe('categoricalValuesByColumn (derived-factor channel)', () => {
    it('groups boxplot data by a derived factor when channel is provided', () => {
      // filteredData rows DO NOT carry the `Reactor_temp_bin` column; the
      // channel supplies it (parallel to filteredData).
      const filteredRows: DataRow[] = [
        { Weight: 10 },
        { Weight: 20 },
        { Weight: 15 },
        { Weight: 25 },
      ];
      const categoricalValuesByColumn = {
        Reactor_temp_bin: ['<50', '>=50', '<50', '>=50'] as (string | null)[],
      };

      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: filteredRows,
          filteredData: filteredRows,
          outcome: 'Weight',
          boxplotFactor: 'Reactor_temp_bin',
          categoricalValuesByColumn,
        })
      );

      // 2 groups: '<50' and '>=50' — both populated (NOT empty)
      expect(result.current.boxplotData).toHaveLength(2);
      const lowGroup = result.current.boxplotData.find(g => g.key === '<50');
      const highGroup = result.current.boxplotData.find(g => g.key === '>=50');
      expect(lowGroup).toBeDefined();
      expect(highGroup).toBeDefined();
      expect(lowGroup!.values).toEqual([10, 15]);
      expect(highGroup!.values).toEqual([20, 25]);
    });

    it('without the channel, derived factor yields an empty single bucket (documents Issue 2 bug)', () => {
      // Reproduces the pre-fix state: derived factor selected but channel not
      // threaded → row[factor] is undefined → all rows land in one stringified
      // 'undefined' bucket. After the fix, callers that pass the channel get
      // populated groups (asserted in the prior test).
      const filteredRows: DataRow[] = [{ Weight: 10 }, { Weight: 20 }, { Weight: 15 }];

      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: filteredRows,
          filteredData: filteredRows,
          outcome: 'Weight',
          boxplotFactor: 'Reactor_temp_bin',
          // categoricalValuesByColumn omitted
        })
      );

      // All rows land in a single 'undefined'-keyed bucket — confirms the fix
      // path is necessary; the channel is the only way to populate derived groups.
      // calculateBoxplotStats preserves input order; values flow in row order.
      expect(result.current.boxplotData).toHaveLength(1);
      expect(result.current.boxplotData[0].values).toEqual([10, 20, 15]);
    });

    it('backward compat: absent channel does not alter raw-factor grouping', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
          // No categoricalValuesByColumn — behaviour must equal pre-fix.
        })
      );

      expect(result.current.boxplotData).toHaveLength(2);
      const keys = result.current.boxplotData.map(g => g.key);
      expect(keys).toContain('A');
      expect(keys).toContain('B');
    });

    it('empty channel ({}) is identity — same as no channel', () => {
      const { result } = renderHook(() =>
        useDashboardComputedData({
          rawData: RAW_DATA,
          filteredData: RAW_DATA,
          outcome: 'Weight',
          boxplotFactor: 'Machine',
          categoricalValuesByColumn: {},
        })
      );

      expect(result.current.boxplotData).toHaveLength(2);
    });
  });
});
