import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataRouter } from '../useDataRouter';
import type { TimelineWindow } from '@variscout/core';

const cumulativeWindow: TimelineWindow = { kind: 'cumulative' };

describe('useDataRouter', () => {
  it('routes investigation phase (standard mode) to useFilteredData with no transforms', () => {
    const { result } = renderHook(() =>
      useDataRouter({
        mode: 'standard',
        scope: 'b1',
        phase: 'investigation',
        window: cumulativeWindow,
        context: {},
      })
    );
    expect(result.current.hook).toBe('useFilteredData');
    expect(result.current.transforms).toEqual([]);
  });

  it('routes hub phase (standard mode) to useProductionLineGlanceData with calculateNodeCapability', () => {
    const { result } = renderHook(() =>
      useDataRouter({
        mode: 'standard',
        scope: 'b1',
        phase: 'hub',
        window: cumulativeWindow,
        context: {},
      })
    );
    expect(result.current.hook).toBe('useProductionLineGlanceData');
    expect(result.current.transforms).toContain('calculateNodeCapability');
  });

  it('honors standardIChartMetric=capability via modeOptions to resolve capability strategy', () => {
    const { result } = renderHook(() =>
      useDataRouter({
        mode: 'standard',
        modeOptions: { standardIChartMetric: 'capability' },
        scope: 'b1',
        phase: 'hub',
        window: { kind: 'rolling', windowDays: 7 },
        context: {},
      })
    );
    expect(result.current.hook).toBe('useProductionLineGlanceData');
    // capability strategy adds output-rate + bottleneck transforms
    expect(result.current.transforms).toContain('computeOutputRate');
    expect(result.current.transforms).toContain('computeBottleneck');
  });

  it('routes yamazumi mode to useFilteredData regardless of phase', () => {
    const { result: inv } = renderHook(() =>
      useDataRouter({
        mode: 'yamazumi',
        scope: 'b1',
        phase: 'investigation',
        window: cumulativeWindow,
        context: {},
      })
    );
    const { result: hub } = renderHook(() =>
      useDataRouter({
        mode: 'yamazumi',
        scope: 'b1',
        phase: 'hub',
        window: cumulativeWindow,
        context: {},
      })
    );
    expect(inv.current.hook).toBe('useFilteredData');
    expect(hub.current.hook).toBe('useFilteredData');
  });
});
