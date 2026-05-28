/**
 * Unit tests for the inflection-binning state machine.
 *
 * Uses a seeded PRNG (mulberry32) to produce deterministic Gaussian-mixture
 * fixtures matching the patterns in
 * `packages/core/src/binning/__tests__/detectInflectionPoints.test.ts`. Never
 * uses `Math.random` — VariScout core (and by extension UI tests touching it)
 * forbids non-deterministic randomness.
 */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { BinnedFactorBinding } from '@variscout/core/binning';
import { useInflectionBinningState } from '../useInflectionBinningState';

// ============================================================================
// Seeded data fixtures (mirrors core/__tests__/helpers/stressDataGenerator.ts)
// ============================================================================

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededNormalSample(rng: () => number, mean: number, std: number): number {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

function gaussianMixture(
  rng: () => number,
  components: Array<{ mean: number; std: number; n: number }>
): number[] {
  const out: number[] = [];
  for (const c of components) {
    for (let i = 0; i < c.n; i++) out.push(seededNormalSample(rng, c.mean, c.std));
  }
  return out;
}

function unimodalNormal(seed: number, n: number, mean: number, std: number): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(seededNormalSample(rng, mean, std));
  return out;
}

function bimodalFixture(seed = 101): { values: number[]; sortedValues: number[] } {
  const rng = mulberry32(seed);
  const values = gaussianMixture(rng, [
    { mean: 10, std: 3, n: 50 },
    { mean: 50, std: 3, n: 50 },
  ]);
  const sortedValues = [...values].sort((a, b) => a - b);
  return { values, sortedValues };
}

// ============================================================================
// Helper: hook test harness
// ============================================================================

interface HarnessOverrides {
  sourceColumn?: string;
  values?: number[];
  sortedValues?: number[];
  existingBindings?: BinnedFactorBinding[];
  generateId?: () => string;
}

function renderBinningHook(overrides: HarnessOverrides = {}) {
  const fixture = bimodalFixture();
  const patchBindings = vi.fn<(next: BinnedFactorBinding[]) => void>();
  const props = {
    sourceColumn: overrides.sourceColumn ?? 'X',
    values: overrides.values ?? fixture.values,
    sortedValues: overrides.sortedValues ?? fixture.sortedValues,
    existingBindings: overrides.existingBindings ?? [],
    patchBindings,
    generateId: overrides.generateId ?? (() => 'generated-id-1'),
  };
  const view = renderHook(() => useInflectionBinningState(props));
  return { view, patchBindings, props };
}

// ============================================================================
// Tests
// ============================================================================

describe('useInflectionBinningState', () => {
  it('initial state with no existingBindings → idle + canShowBanner true', () => {
    const { view } = renderBinningHook({ existingBindings: [] });
    expect(view.result.current.state.kind).toBe('idle');
    if (view.result.current.state.kind === 'idle') {
      expect(view.result.current.state.canShowBanner).toBe(true);
    }
  });

  it('initial state with existingBinding for sourceColumn → committed + segments computed', () => {
    const existing: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'X',
      cuts: [30],
      levelNames: ['<30', '≥30'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const { view } = renderBinningHook({ existingBindings: [existing] });
    expect(view.result.current.state.kind).toBe('committed');
    if (view.result.current.state.kind === 'committed') {
      expect(view.result.current.state.binding).toEqual(existing);
      expect(view.result.current.state.segments).toHaveLength(2);
    }
  });

  it('initial state with existingBinding for OTHER column → idle (not picked up)', () => {
    const otherColumn: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'Y',
      cuts: [30],
      levelNames: ['<30', '≥30'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const { view } = renderBinningHook({
      sourceColumn: 'X',
      existingBindings: [otherColumn],
    });
    expect(view.result.current.state.kind).toBe('idle');
  });

  it('dismissBanner → canShowBanner false; stays idle', () => {
    const { view } = renderBinningHook();
    act(() => view.result.current.dismissBanner());
    expect(view.result.current.state.kind).toBe('idle');
    if (view.result.current.state.kind === 'idle') {
      expect(view.result.current.state.canShowBanner).toBe(false);
    }
  });

  it('detectInflections on bimodal data → proposing with 1 cut, 2 segments, defaults', () => {
    const { view } = renderBinningHook();
    act(() => view.result.current.detectInflections());
    expect(view.result.current.state.kind).toBe('proposing');
    if (view.result.current.state.kind === 'proposing') {
      expect(view.result.current.state.cuts).toHaveLength(1);
      expect(view.result.current.state.segments).toHaveLength(2);
      expect(view.result.current.state.levelNames).toHaveLength(2);
      // Default labels are numeric ranges.
      expect(view.result.current.state.levelNames[0]).toMatch(/^</);
      expect(view.result.current.state.levelNames[1]).toMatch(/^≥/);
    }
  });

  it('detectInflections on unimodal data → stays idle', () => {
    const values = unimodalNormal(303, 200, 50, 10);
    const sortedValues = [...values].sort((a, b) => a - b);
    const { view } = renderBinningHook({ values, sortedValues });
    act(() => view.result.current.detectInflections());
    expect(view.result.current.state.kind).toBe('idle');
  });

  it('dragCut from proposing → cuts updated, segments recomputed, patchBindings NOT called', () => {
    const { view, patchBindings } = renderBinningHook();
    act(() => view.result.current.detectInflections());
    const oldCuts =
      view.result.current.state.kind === 'proposing' ? view.result.current.state.cuts : [];
    const newPos = oldCuts[0] + 1.5;
    act(() => view.result.current.dragCut(0, newPos));
    expect(view.result.current.state.kind).toBe('proposing');
    if (view.result.current.state.kind === 'proposing') {
      expect(view.result.current.state.cuts).toEqual([newPos]);
      expect(view.result.current.state.segments).toHaveLength(2);
    }
    expect(patchBindings).not.toHaveBeenCalled();
  });

  it('commit() from proposing → patchBindings called with new binding; transitions to committed', () => {
    const { view, patchBindings } = renderBinningHook({
      generateId: () => 'binding-new',
    });
    act(() => view.result.current.detectInflections());
    act(() => view.result.current.commit());
    expect(patchBindings).toHaveBeenCalledTimes(1);
    const args = patchBindings.mock.calls[0][0] as BinnedFactorBinding[];
    expect(args).toHaveLength(1);
    expect(args[0].id).toBe('binding-new');
    expect(args[0].sourceColumn).toBe('X');
    expect(args[0].detectionMethod).toBe('gap-ratio-v1');
    expect(args[0].cuts).toHaveLength(1);
    expect(args[0].levelNames).toHaveLength(2);
    expect(view.result.current.state.kind).toBe('committed');
  });

  it('dragCut from committed → patchBindings called immediately with updated binding', () => {
    const existing: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'X',
      cuts: [30],
      levelNames: ['<30', '≥30'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const { view, patchBindings } = renderBinningHook({ existingBindings: [existing] });
    act(() => view.result.current.dragCut(0, 35));
    expect(patchBindings).toHaveBeenCalledTimes(1);
    const args = patchBindings.mock.calls[0][0] as BinnedFactorBinding[];
    expect(args).toHaveLength(1);
    expect(args[0].cuts).toEqual([35]);
    // Level names preserved when cuts.length unchanged.
    expect(args[0].levelNames).toEqual(['<30', '≥30']);
  });

  it('removeBinning from committed → patchBindings called with filtered; transitions to idle', () => {
    const existing: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'X',
      cuts: [30],
      levelNames: ['<30', '≥30'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const other: BinnedFactorBinding = {
      id: 'binding-2',
      sourceColumn: 'Y',
      cuts: [10],
      levelNames: ['<10', '≥10'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const { view, patchBindings } = renderBinningHook({
      existingBindings: [existing, other],
    });
    act(() => view.result.current.removeBinning());
    expect(patchBindings).toHaveBeenCalledTimes(1);
    expect(patchBindings.mock.calls[0][0]).toEqual([other]);
    expect(view.result.current.state.kind).toBe('idle');
    if (view.result.current.state.kind === 'idle') {
      expect(view.result.current.state.canShowBanner).toBe(false);
    }
  });

  it('removeCut(0) from proposing with only 1 cut → transitions back to idle', () => {
    const { view } = renderBinningHook();
    act(() => view.result.current.detectInflections());
    expect(view.result.current.state.kind).toBe('proposing');
    act(() => view.result.current.removeCut(0));
    expect(view.result.current.state.kind).toBe('idle');
    if (view.result.current.state.kind === 'idle') {
      expect(view.result.current.state.canShowBanner).toBe(false);
    }
  });

  it('addCut from committed → patchBindings called with sorted cuts; levelNames regenerated', () => {
    const existing: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'X',
      cuts: [30],
      levelNames: ['low', 'high'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const { view, patchBindings } = renderBinningHook({ existingBindings: [existing] });
    act(() => view.result.current.addCut(50));
    expect(patchBindings).toHaveBeenCalledTimes(1);
    const args = patchBindings.mock.calls[0][0] as BinnedFactorBinding[];
    expect(args[0].cuts).toEqual([30, 50]);
    expect(args[0].levelNames).toHaveLength(3);
    // Length changed → regenerate from defaults (user labels lost).
    expect(args[0].levelNames[0]).toMatch(/^</);
    expect(args[0].levelNames[2]).toMatch(/^≥/);
  });

  it('renameLevel from committed → patchBindings called; segments unchanged', () => {
    const existing: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'X',
      cuts: [30],
      levelNames: ['<30', '≥30'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const { view, patchBindings } = renderBinningHook({ existingBindings: [existing] });
    act(() => view.result.current.renameLevel(0, 'cold'));
    expect(patchBindings).toHaveBeenCalledTimes(1);
    const args = patchBindings.mock.calls[0][0] as BinnedFactorBinding[];
    expect(args[0].levelNames).toEqual(['cold', '≥30']);
  });

  it('reset() returns to initial state', () => {
    const { view } = renderBinningHook();
    act(() => view.result.current.dismissBanner());
    if (view.result.current.state.kind === 'idle') {
      expect(view.result.current.state.canShowBanner).toBe(false);
    }
    act(() => view.result.current.reset());
    expect(view.result.current.state.kind).toBe('idle');
    if (view.result.current.state.kind === 'idle') {
      expect(view.result.current.state.canShowBanner).toBe(true);
    }
  });

  it('removeCut from committed when last cut → patches with binding filtered + transitions to idle', () => {
    const existing: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'X',
      cuts: [30],
      levelNames: ['<30', '≥30'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };
    const { view, patchBindings } = renderBinningHook({ existingBindings: [existing] });
    act(() => view.result.current.removeCut(0));
    expect(patchBindings).toHaveBeenCalledTimes(1);
    expect(patchBindings.mock.calls[0][0]).toEqual([]);
    expect(view.result.current.state.kind).toBe('idle');
  });
});
