import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEvidenceMapData } from '../useEvidenceMapData';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { Finding } from '@variscout/core/findings';

// ============================================================================
// Helpers
// ============================================================================

function makeBestSubsets(overrides?: Partial<BestSubsetsResult>): BestSubsetsResult {
  return {
    subsets: [
      {
        factors: ['Temperature', 'Pressure'],
        factorCount: 2,
        rSquared: 0.6,
        rSquaredAdj: 0.55,
        fStatistic: 10,
        pValue: 0.001,
        isSignificant: true,
        dfModel: 3,
        levelEffects: new Map([
          [
            'Temperature',
            new Map([
              ['High', 5],
              ['Low', -5],
            ]),
          ],
          [
            'Pressure',
            new Map([
              ['High', 3],
              ['Low', -3],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
      {
        factors: ['Temperature'],
        factorCount: 1,
        rSquared: 0.4,
        rSquaredAdj: 0.38,
        fStatistic: 8,
        pValue: 0.005,
        isSignificant: true,
        dfModel: 1,
        levelEffects: new Map([
          [
            'Temperature',
            new Map([
              ['High', 5],
              ['Low', -5],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
      {
        factors: ['Pressure'],
        factorCount: 1,
        rSquared: 0.25,
        rSquaredAdj: 0.22,
        fStatistic: 5,
        pValue: 0.03,
        isSignificant: true,
        dfModel: 1,
        levelEffects: new Map([
          [
            'Pressure',
            new Map([
              ['High', 3],
              ['Low', -3],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
    ],
    n: 50,
    totalFactors: 2,
    factorNames: ['Temperature', 'Pressure'],
    grandMean: 100,
    ssTotal: 1000,
    ...overrides,
  };
}

function makeFinding(id: string, activeFilters: Record<string, (string | number)[]>): Finding {
  return {
    id,
    text: `Finding ${id}`,
    status: 'observed',
    evidenceType: 'data',
    comments: [],
    createdAt: 1714000000000,
    statusChangedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters, cumulativeScope: null },
  };
}

const defaultContainerSize = { width: 800, height: 600 };

// ============================================================================
// Tests
// ============================================================================

describe('useEvidenceMapData — explored node state', () => {
  it('leaves explored undefined when no findings provided', () => {
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        findings: [],
      })
    );
    for (const node of result.current.factorNodes) {
      expect(node.explored).toBeUndefined();
    }
  });

  it('returns no exploredFactors field on empty (no bestSubsets) state', () => {
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: null,
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
      })
    );
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.factorNodes).toHaveLength(0);
    expect((result.current as unknown as Record<string, unknown>).exploredFactors).toBeUndefined();
  });

  it('marks a factor as explored when a finding has that factor in activeFilters', () => {
    const findings: Finding[] = [makeFinding('f1', { Temperature: ['High'] })];
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        findings,
      })
    );
    const tempNode = result.current.factorNodes.find(n => n.factor === 'Temperature');
    const pressNode = result.current.factorNodes.find(n => n.factor === 'Pressure');
    expect(tempNode?.explored).toBe(true);
    expect(pressNode?.explored).toBe(false);
  });

  it('marks a factor as explored when any finding contains it in activeFilters', () => {
    const findings: Finding[] = [makeFinding('f1', { Pressure: ['Low'] })];
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        findings,
      })
    );
    const pressNode = result.current.factorNodes.find(n => n.factor === 'Pressure');
    const tempNode = result.current.factorNodes.find(n => n.factor === 'Temperature');
    expect(pressNode?.explored).toBe(true);
    expect(tempNode?.explored).toBe(false);
  });

  it('leaves explored undefined when findings have empty activeFilters', () => {
    const findings: Finding[] = [makeFinding('f1', {})];
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        findings,
      })
    );
    // No factor filters in findings → exploration hasn't started → normal colors
    for (const node of result.current.factorNodes) {
      expect(node.explored).toBeUndefined();
    }
  });

  it('stamps explored on all factors when findings cover both', () => {
    const findings: Finding[] = [
      makeFinding('f1', { Temperature: ['High'] }),
      makeFinding('f2', { Pressure: ['Low'] }),
    ];
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        findings,
      })
    );
    const tempNode = result.current.factorNodes.find(n => n.factor === 'Temperature');
    const pressNode = result.current.factorNodes.find(n => n.factor === 'Pressure');
    expect(tempNode?.explored).toBe(true);
    expect(pressNode?.explored).toBe(true);
  });

  it('deduplicates — multiple findings for same factor still produce explored: true', () => {
    const findings: Finding[] = [
      makeFinding('f1', { Temperature: ['High'] }),
      makeFinding('f2', { Temperature: ['Low'] }),
    ];
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        findings,
      })
    );
    const tempNode = result.current.factorNodes.find(n => n.factor === 'Temperature');
    expect(tempNode?.explored).toBe(true);
  });

  it('ignores findings with no matching factor in the map', () => {
    const findings: Finding[] = [makeFinding('f1', { UnknownFactor: ['x'] })];
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        findings,
      })
    );
    // The unknown factor is explored but has no node; known nodes remain unexplored
    for (const node of result.current.factorNodes) {
      expect(node.explored).toBe(false);
    }
  });
});
