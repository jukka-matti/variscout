/**
 * Pipeline Integration Tests
 *
 * Tests the complete hook pipeline with real CSV data from docs/04-cases/.
 * Verifies that the hooks (useDrillPath) produce correct statistics
 * that match the golden data values from
 * packages/core/src/__tests__/goldenData.test.ts.
 *
 * These tests bridge the gap between pure-function unit tests (core) and
 * browser-level E2E tests by exercising the React hook layer with real data.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import type { DataRow, FilterAction } from '@variscout/core';
import { createFilterAction, calculateStats, applyFilters } from '@variscout/core';
import { useDrillPath } from '../../useDrillPath';

// ============================================================================
// Fixture loader — simple CSV parser (avoids papaparse dependency)
// ============================================================================

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../..');

function loadCsv(relativePath: string): DataRow[] {
  const csv = fs.readFileSync(path.resolve(REPO_ROOT, relativePath), 'utf-8');
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: DataRow = {};
    headers.forEach((header, i) => {
      const raw = (values[i] ?? '').trim();
      const num = parseFloat(raw);
      row[header] = raw !== '' && !isNaN(num) && isFinite(num) ? num : raw;
    });
    return row;
  });
}

function makeFilterAction(factor: string, values: (string | number)[]): FilterAction {
  return createFilterAction({
    type: 'filter',
    source: 'boxplot',
    factor,
    values,
  });
}

// ============================================================================
// Coffee dataset pipeline tests
// ============================================================================

describe('Pipeline Integration: Coffee Washing Station', () => {
  let data: DataRow[];
  const USL = 12;
  const LSL = 10;
  const specs = { usl: USL, lsl: LSL };

  beforeAll(() => {
    data = loadCsv('docs/04-cases/coffee/washing-station.csv');
  });

  // --------------------------------------------------------------------------
  // useDrillPath with real data
  // --------------------------------------------------------------------------

  describe('useDrillPath with coffee data', () => {
    it('should compute correct scope and stats for Bed C drill', () => {
      const stack = [makeFilterAction('Drying_Bed', ['C'])];
      const { result } = renderHook(() => useDrillPath(data, stack, 'Moisture_pct', specs));

      expect(result.current.drillPath).toHaveLength(1);
      const step = result.current.drillPath[0];

      // Total SS scope fraction for Bed C (captures mean shift + spread)
      expect(step.scopeFraction).toBeGreaterThan(0);
      expect(step.scopeFraction).toBeLessThanOrEqual(1);
      expect(step.cumulativeScope).toBeCloseTo(step.scopeFraction, 5);

      // Before filtering: overall mean ≈ 11.89, all 30 rows
      expect(step.meanBefore).toBeCloseTo(11.8933, 2);
      expect(step.countBefore).toBe(30);

      // After filtering to Bed C: mean ≈ 13.18, 10 rows
      expect(step.meanAfter).toBeCloseTo(13.18, 2);
      expect(step.countAfter).toBe(10);

      // Cpk worsens after filtering to Bed C (was already bad, but now negative)
      // Cp/Cpk use σ_within (MR̄/d2)
      expect(step.cpkBefore).toBeCloseTo(0.0596, 2);
      expect(step.cpkAfter).toBeCloseTo(-0.5324, 2);

      // Cumulative scope percentage = scopeFraction * 100
      expect(result.current.cumulativeVariationPct).toBeCloseTo(step.scopeFraction * 100, 5);
    });

    it('should compute correct stats for Bed A drill (good bed)', () => {
      const stack = [makeFilterAction('Drying_Bed', ['A'])];
      const { result } = renderHook(() => useDrillPath(data, stack, 'Moisture_pct', specs));

      const step = result.current.drillPath[0];

      // After filtering to Bed A: mean ≈ 11.05, Cpk with σ_within ≈ 0.748
      expect(step.meanAfter).toBeCloseTo(11.05, 2);
      expect(step.cpkAfter).toBeCloseTo(0.7476, 2);
      expect(step.cpkAfter!).toBeGreaterThan(0.5);
    });

    it('should show empty drillPath with no filters', () => {
      const { result } = renderHook(() => useDrillPath(data, [], 'Moisture_pct', specs));

      expect(result.current.drillPath).toEqual([]);
      expect(result.current.cumulativeVariationPct).toBeNull();
    });
  });
});

// ============================================================================
// Packaging dataset pipeline tests
// ============================================================================

describe('Pipeline Integration: Packaging Fill Weights', () => {
  let data: DataRow[];

  beforeAll(() => {
    data = loadCsv('docs/04-cases/packaging/fillweights.csv');
  });

  describe('useDrillPath with packaging data', () => {
    it('should compute correct scope for Shift drill', () => {
      const stack = [makeFilterAction('Shift', ['Night'])];
      const { result } = renderHook(() => useDrillPath(data, stack, 'Fill_Weight_g'));

      expect(result.current.drillPath).toHaveLength(1);
      const step = result.current.drillPath[0];

      // Total SS scope fraction for Night shift
      expect(step.scopeFraction).toBeGreaterThan(0);
      expect(step.scopeFraction).toBeLessThanOrEqual(1);

      // Overall mean ≈ 497.54 → Night mean ≈ 495.65
      expect(step.meanBefore).toBeCloseTo(497.5375, 1);
      expect(step.meanAfter).toBeCloseTo(495.6525, 1);

      // 120 total → 40 Night shift rows
      expect(step.countBefore).toBe(120);
      expect(step.countAfter).toBe(40);
    });
  });
});

// ============================================================================
// Cross-check: Hook results match direct calculation
// ============================================================================

describe('Pipeline Integration: Hook ↔ Core Consistency', () => {
  let coffeeData: DataRow[];

  beforeAll(() => {
    coffeeData = loadCsv('docs/04-cases/coffee/washing-station.csv');
  });

  it('should produce identical stats via hook vs direct calculation', () => {
    const stack = [makeFilterAction('Drying_Bed', ['A'])];
    const specs = { usl: 12, lsl: 10 };

    // Path 1: via useDrillPath hook
    const { result } = renderHook(() => useDrillPath(coffeeData, stack, 'Moisture_pct', specs));
    const hookCpk = result.current.drillPath[0].cpkAfter;

    // Path 2: direct calculation
    const filtered = applyFilters(coffeeData, { Drying_Bed: ['A'] });
    const values = filtered.map(r => r.Moisture_pct as number);
    const directStats = calculateStats(values, specs.usl, specs.lsl);

    // Both paths should produce identical results
    expect(hookCpk).toBeCloseTo(directStats.cpk!, 6);
  });
});
