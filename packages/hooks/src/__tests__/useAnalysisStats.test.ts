import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectStore, usePreferencesStore, getProjectInitialState } from '@variscout/stores';
import { useAnalysisStats } from '../useAnalysisStats';

beforeEach(() => {
  useProjectStore.setState(getProjectInitialState());
  usePreferencesStore.setState({ timeLens: { mode: 'cumulative' } });
});

// A spread of values that produces variation so sigmaWithin > 0 and Cpk is finite.
const sampleRows = [
  { Result: 9.6 },
  { Result: 10.1 },
  { Result: 9.8 },
  { Result: 10.4 },
  { Result: 9.9 },
  { Result: 10.2 },
  { Result: 10.0 },
  { Result: 9.7 },
];

describe('useAnalysisStats', () => {
  it('resolves measureSpecs[outcome] when global specs are empty (sync fallback)', async () => {
    useProjectStore.setState({
      rawData: sampleRows,
      outcome: 'Result',
      specs: {}, // global specs empty
      measureSpecs: { Result: { lsl: 9, usl: 11 } },
      filters: {},
    });

    // No workerApi → synchronous compute path.
    const { result } = renderHook(() => useAnalysisStats());

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });

    // Cpk/Cp/outOfSpecPercentage are only defined when spec limits are applied.
    expect(result.current.stats?.cpk).toBeDefined();
    expect(result.current.stats?.cp).toBeDefined();
    expect(result.current.stats?.outOfSpecPercentage).toBeDefined();
  });

  it('prefers per-measure spec over the global spec', async () => {
    useProjectStore.setState({
      rawData: sampleRows,
      outcome: 'Result',
      // Global spec is wide; per-measure spec is tight. Cpk must reflect the tight one.
      specs: { lsl: 0, usl: 100 },
      measureSpecs: { Result: { lsl: 9, usl: 11 } },
      filters: {},
    });

    const { result } = renderHook(() => useAnalysisStats());

    await waitFor(() => {
      expect(result.current.stats?.cpk).toBeDefined();
    });

    const tightCpk = result.current.stats!.cpk!;

    // Now switch to the wide global spec only (no per-measure override).
    useProjectStore.setState({ measureSpecs: {} });
    const { result: wideResult } = renderHook(() => useAnalysisStats());
    await waitFor(() => {
      expect(wideResult.current.stats?.cpk).toBeDefined();
    });
    const wideCpk = wideResult.current.stats!.cpk!;

    // Tighter spec window → lower Cpk than the wide global window.
    expect(tightCpk).toBeLessThan(wideCpk);
  });

  it('falls back to global specs when no per-measure override exists', async () => {
    useProjectStore.setState({
      rawData: sampleRows,
      outcome: 'Result',
      specs: { lsl: 9, usl: 11 },
      measureSpecs: {}, // no per-measure entry
      filters: {},
    });

    const { result } = renderHook(() => useAnalysisStats());

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });
    expect(result.current.stats?.cpk).toBeDefined();
  });
});
