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
});
