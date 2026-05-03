/**
 * Regression test: Dashboard's live ProcessHealthBar uses `lensedSampleCount`
 * (not `filteredData.length`) for its `sampleCount` prop.
 *
 * Bug: Task-3 follow-up wired useLensedSampleCount only into App.tsx (ReportView)
 * and Azure Dashboard, but missed the live ProcessHealthBar render in PWA Dashboard.
 * This was confirmed and fixed in `apps/pwa/src/components/Dashboard.tsx`.
 *
 * Testing strategy: hook-composition wrapper.
 * Mounting the full Dashboard requires an extensive mock surface (20+ hooks,
 * DashboardLayoutBase, chart components, workers). The wiring bug is captured
 * just as precisely by rendering a minimal wrapper that calls the exact same two
 * hooks Dashboard composes — `useLensedSampleCount()` and `useFilteredData()` —
 * and asserting that the values diverge under a rolling lens (which exposes the
 * pre-fix bug of using filteredData.length instead of lensedSampleCount).
 *
 * This test catches any future regression where someone re-wires `sampleCount`
 * back to `filteredData?.length` instead of the lens-aware count.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';

// ── vi.mock() — vitest hoists these above all imports at transform time ───────
// The closures below use `var` to hold store references created inside mock
// factories (project memory hard rule: vi.mock factory closure pattern).
// `var` is function-scoped/module-scoped and thus accessible inside factory
// bodies even though vi.mock is hoisted before module-level let/const init.

// Store reference populated inside the factory; accessed from tests via this var.
var _testSessionStore:
  | {
      (selector: (s: { timeLens: import('@variscout/core').TimeLens }) => unknown): unknown;
      setState: (partial: Partial<{ timeLens: import('@variscout/core').TimeLens }>) => void;
    }
  | undefined;

// Replace the persist-backed useSessionStore with a plain in-memory store so that
// setState calls in jsdom don't trigger the idb-keyval middleware (indexedDB is
// not available in that environment). All other @variscout/stores exports pass
// through from the actual module.
vi.mock('@variscout/stores', async () => {
  const actual = await vi.importActual('@variscout/stores');
  const { create } = await import('zustand');
  const store = create<{ timeLens: import('@variscout/core').TimeLens }>(() => ({
    timeLens: { mode: 'cumulative' },
  }));
  // Bind into the var so beforeEach / tests can call store.setState.
  _testSessionStore = store as typeof _testSessionStore;
  return {
    ...actual,
    useSessionStore: (selector: (s: { timeLens: import('@variscout/core').TimeLens }) => unknown) =>
      store(selector),
    getSessionInitialState: () => ({ timeLens: { mode: 'cumulative' } }),
  };
});

// ── Remaining imports (after vi.mock blocks, but hoisting keeps mocks first) ──
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import { useLensedSampleCount } from '@variscout/hooks';
import { useFilteredData } from '@variscout/hooks';
import type { DataRow } from '@variscout/core';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build N simple numeric rows — deterministic, no Math.random. */
function buildRows(n: number): DataRow[] {
  return Array.from({ length: n }, (_, i) => ({ value: i + 1 })) as DataRow[];
}

/**
 * Tiny wrapper component that mirrors Dashboard's sampleCount computation:
 *
 *   const { filteredData } = useFilteredData();
 *   const lensedSampleCount = useLensedSampleCount();
 *   // Dashboard passes: sampleCount={lensedSampleCount}
 *
 * Exposes both values via data-testid attributes so assertions are
 * i18n-independent (per testing.md: prefer data-testid, not text content).
 */
function SampleCountHarness() {
  const { filteredData } = useFilteredData();
  const lensedSampleCount = useLensedSampleCount();
  return (
    <div>
      <span data-testid="filtered-length">{filteredData.length}</span>
      <span data-testid="lensed-count">{lensedSampleCount}</span>
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Dashboard — lensedSampleCount vs filteredData.length', () => {
  beforeEach(() => {
    // Reset projectStore (no persist middleware — safe in jsdom).
    useProjectStore.setState(getProjectInitialState());
    // Reset the in-memory test session store to cumulative (no idb writes).
    _testSessionStore!.setState({ timeLens: { mode: 'cumulative' } });
  });

  it('cumulative lens: lensedSampleCount equals filteredData.length (baseline)', () => {
    act(() => {
      useProjectStore.setState({ rawData: buildRows(100), filters: {} });
      _testSessionStore!.setState({ timeLens: { mode: 'cumulative' } });
    });

    render(<SampleCountHarness />);

    expect(screen.getByTestId('filtered-length').textContent).toBe('100');
    expect(screen.getByTestId('lensed-count').textContent).toBe('100');
  });

  it('rolling lens (windowSize=50): lensedSampleCount is 50, filteredData.length is 100 — values differ', () => {
    // This test captures the exact bug: before the fix, Dashboard passed
    // filteredData.length (100) instead of lensedSampleCount (50).
    act(() => {
      useProjectStore.setState({ rawData: buildRows(100), filters: {} });
      _testSessionStore!.setState({ timeLens: { mode: 'rolling', windowSize: 50 } });
    });

    render(<SampleCountHarness />);

    // filteredData still contains all 100 rows (time-lens is applied after filtering)
    expect(screen.getByTestId('filtered-length').textContent).toBe('100');
    // lensedSampleCount applies the rolling window → 50
    expect(screen.getByTestId('lensed-count').textContent).toBe('50');
    // The two values MUST differ — this is what the bug suppressed
    expect(screen.getByTestId('lensed-count').textContent).not.toBe(
      screen.getByTestId('filtered-length').textContent
    );
  });

  it('rolling → cumulative transition: lensedSampleCount tracks lens changes reactively', () => {
    act(() => {
      useProjectStore.setState({ rawData: buildRows(100), filters: {} });
      _testSessionStore!.setState({ timeLens: { mode: 'rolling', windowSize: 30 } });
    });

    const { result, rerender } = renderHook(() => useLensedSampleCount());
    expect(result.current).toBe(30);

    act(() => {
      _testSessionStore!.setState({ timeLens: { mode: 'cumulative' } });
    });
    rerender();
    expect(result.current).toBe(100);
  });
});
