/**
 * FSJ-2 walk Fix 3 — live-store getter wiring for the landing-path time extraction.
 *
 * Root cause (chrome walk): App.tsx wired `useDataIngestion`'s getters as
 * `getRawData: () => rawData` (etc.) — closing over RENDER-SCOPE values that are
 * stale within the same event tick. The FSJ-2 landing branch calls
 * `applyTimeExtraction` synchronously right after `setRawData(...)`, so the
 * render-scope `rawData` is still the PRE-paste array (usually `[]`):
 * `applyTimeExtraction`'s `rawData.length === 0` guard early-returns and the
 * quiet-tier auto-extraction silently no-ops. The landing HOOK unit test passed
 * because it spied the CALL, not the EFFECT.
 *
 * This is the load-bearing seam the spy could not provide: it renders the REAL
 * PWA `useDataIngestion` (live-store actions) and proves the effect — derived
 * time columns are appended to factors — when extraction is invoked in the same
 * tick as the store write, AND that the stale-closure wiring (the bug) no-ops.
 *
 * Writing-tests invariant: no vi.mock of the store (the real store IS the seam).
 */
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProjectStore } from '@variscout/stores';
import type { TimeExtractionConfig } from '@variscout/core';
import { useDataIngestion } from '../hooks/useDataIngestion';

// Measurement-shaped rows with an ISO-date time column (post-Fix-1, ISO dates
// classify as `date` so 'Timestamp' is the time column, not a numeric outcome).
const ROWS = Array.from({ length: 12 }, (_, i) => ({
  Cycle_Time_sec: 40 + (i % 7),
  Timestamp: `2026-05-${String((i % 28) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:30:00`,
  Workstation: i % 2 === 0 ? 'Alpha' : 'Bravo',
}));

const CONFIG: TimeExtractionConfig = {
  extractYear: false,
  extractMonth: false,
  extractWeek: false,
  extractDayOfWeek: true,
  extractHour: true,
};

beforeEach(() => {
  // Fresh store each test (rawData empty, factors empty).
  useProjectStore.getState().setRawData([]);
  useProjectStore.getState().setFactors([]);
});

describe('FSJ-2 Fix 3 — useDataIngestion getters read live store state', () => {
  it('applies time extraction when invoked in the SAME tick as the store write (live-read getter)', () => {
    // Live-store getters — the FIX wiring (mirrors App.tsx after Fix 3).
    const { result } = renderHook(() =>
      useDataIngestion({
        getRawData: () => useProjectStore.getState().rawData,
        getOutcome: () => useProjectStore.getState().outcome,
        getFactors: () => useProjectStore.getState().factors,
      })
    );

    // Simulate the landing branch: write rows, then SYNCHRONOUSLY extract — same tick.
    act(() => {
      useProjectStore.getState().setRawData(ROWS);
      result.current.applyTimeExtraction('Timestamp', CONFIG);
    });

    // Effect (not just the call): derived time columns were appended to factors.
    const factors = useProjectStore.getState().factors;
    expect(factors.length).toBeGreaterThan(0);
    expect(factors.some(f => /Timestamp/.test(f))).toBe(true);
  });

  it('NEGATIVE CONTROL: a stale-closure getter (the bug) no-ops in the same tick', () => {
    // Capture the pre-paste empty array, exactly as the render-scope closure did.
    const stalePrePasteRows = useProjectStore.getState().rawData; // []
    const { result } = renderHook(() =>
      useDataIngestion({
        getRawData: () => stalePrePasteRows, // BUG: render-scope value, never refreshed
        getOutcome: () => useProjectStore.getState().outcome,
        getFactors: () => useProjectStore.getState().factors,
      })
    );

    act(() => {
      useProjectStore.getState().setRawData(ROWS);
      result.current.applyTimeExtraction('Timestamp', CONFIG);
    });

    // The guard saw the stale empty array → early return → no factors added.
    expect(useProjectStore.getState().factors).toEqual([]);
  });
});
