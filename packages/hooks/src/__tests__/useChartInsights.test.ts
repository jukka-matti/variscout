import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChartInsights } from '../useChartInsights';
import type { UseChartInsightsOptions } from '../useChartInsights';

// Mock the core builders — must be before component import (already satisfied)
vi.mock('@variscout/core', () => ({
  buildIChartInsight: vi.fn(() => ({
    text: 'Process shift detected',
    chipType: 'warning',
    priority: 3,
  })),
  buildBoxplotInsight: vi.fn(() => ({
    text: 'Drill Machine A',
    chipType: 'suggestion',
    priority: 3,
  })),
  buildParetoInsight: vi.fn(() => ({
    text: 'Top 2 explain 73%',
    chipType: 'info',
    priority: 2,
  })),
  buildStatsInsight: vi.fn(() => null),
  buildChartInsightPrompt: vi.fn(() => 'test prompt'),
}));

describe('useChartInsights', () => {
  const baseOptions: UseChartInsightsOptions = {
    chartType: 'ichart',
    aiEnabled: false,
    aiContext: null,
    deterministicData: {
      nelsonSequences: [{ startIndex: 0, endIndex: 9, side: 'above' as const }],
      outOfControlCount: 3,
      totalPoints: 50,
    },
  };

  // -----------------------------------------------------------------------
  // Deterministic insights
  // -----------------------------------------------------------------------

  it('returns deterministic insight for ichart', () => {
    const { result } = renderHook(() => useChartInsights(baseOptions));
    expect(result.current.chipText).toBe('Process shift detected');
    expect(result.current.chipType).toBe('warning');
    expect(result.current.isAI).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns null chipText when no insight (stats without specs)', () => {
    const { result } = renderHook(() =>
      useChartInsights({
        ...baseOptions,
        chartType: 'stats',
        deterministicData: { hasSpecs: false },
      })
    );
    expect(result.current.chipText).toBeNull();
    expect(result.current.chipType).toBe('info'); // default
  });

  it('uses boxplot builder for boxplot chart type', () => {
    const { result } = renderHook(() =>
      useChartInsights({
        ...baseOptions,
        chartType: 'boxplot',
        deterministicData: {
          factorVariations: new Map([['Machine', 47]]),
          currentFactor: 'Machine',
          nextDrillFactor: 'Shift',
        },
      })
    );
    expect(result.current.chipText).toBe('Drill Machine A');
    expect(result.current.chipType).toBe('suggestion');
  });

  it('uses pareto builder for pareto chart type', () => {
    const { result } = renderHook(() =>
      useChartInsights({
        ...baseOptions,
        chartType: 'pareto',
        deterministicData: {
          categoryContributions: new Map([
            ['A', 45],
            ['B', 28],
          ]),
          categoryCount: 8,
        },
      })
    );
    expect(result.current.chipText).toBe('Top 2 explain 73%');
    expect(result.current.chipType).toBe('info');
  });

  // -----------------------------------------------------------------------
  // Dismiss behavior
  // -----------------------------------------------------------------------

  it('dismiss hides chip and sets isDismissed', () => {
    const { result } = renderHook(() => useChartInsights(baseOptions));
    expect(result.current.chipText).toBe('Process shift detected');

    act(() => result.current.dismiss());

    expect(result.current.isDismissed).toBe(true);
    expect(result.current.chipText).toBeNull();
  });

  it('dismiss persists across re-renders for same insight', () => {
    const { result, rerender } = renderHook(() => useChartInsights(baseOptions));

    act(() => result.current.dismiss());
    expect(result.current.isDismissed).toBe(true);

    // Re-render with same options
    rerender();
    expect(result.current.isDismissed).toBe(true);
    expect(result.current.chipText).toBeNull();
  });

  // -----------------------------------------------------------------------
  // AI disabled
  // -----------------------------------------------------------------------

  it('does not show loading when AI disabled', () => {
    const { result } = renderHook(() => useChartInsights(baseOptions));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAI).toBe(false);
  });

  it('does not show loading when AI enabled but no fetchInsight', () => {
    const { result } = renderHook(() =>
      useChartInsights({
        ...baseOptions,
        aiEnabled: true,
        aiContext: { process: {}, filters: [] } as UseChartInsightsOptions['aiContext'],
      })
    );
    expect(result.current.isLoading).toBe(false);
  });

  // -----------------------------------------------------------------------
  // AI enhancement
  // -----------------------------------------------------------------------

  it('shows deterministic text while AI is loading', () => {
    const fetchInsight = vi.fn(() => new Promise<string>(() => {})); // Never resolves
    const { result } = renderHook(() =>
      useChartInsights({
        ...baseOptions,
        aiEnabled: true,
        aiContext: { process: {}, filters: [] } as UseChartInsightsOptions['aiContext'],
        fetchInsight,
      })
    );
    // Deterministic text is available immediately
    expect(result.current.chipText).toBe('Process shift detected');
  });

  it('replaces deterministic with AI text on success', async () => {
    const fetchInsight = vi.fn().mockResolvedValue('AI: Check fill head alignment');
    const stableContext = { process: {}, filters: [] } as UseChartInsightsOptions['aiContext'];
    const stableData = baseOptions.deterministicData;

    const { result } = renderHook(() =>
      useChartInsights({
        chartType: 'ichart',
        aiEnabled: true,
        aiContext: stableContext,
        fetchInsight,
        deterministicData: stableData,
        aiDebounceMs: 10,
      })
    );

    // Wait for debounce + async fetch to complete
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    expect(fetchInsight).toHaveBeenCalled();
    expect(result.current.chipText).toBe('AI: Check fill head alignment');
    expect(result.current.isAI).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('falls back to deterministic on AI error', async () => {
    const fetchInsight = vi.fn().mockRejectedValue(new Error('API error'));
    const stableContext = { process: {}, filters: [] } as UseChartInsightsOptions['aiContext'];
    const stableData = baseOptions.deterministicData;

    const { result } = renderHook(() =>
      useChartInsights({
        chartType: 'ichart',
        aiEnabled: true,
        aiContext: stableContext,
        fetchInsight,
        deterministicData: stableData,
        aiDebounceMs: 10,
      })
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    expect(fetchInsight).toHaveBeenCalled();
    expect(result.current.chipText).toBe('Process shift detected');
    expect(result.current.isAI).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('does not call fetchInsight when deterministic insight is null', async () => {
    const fetchInsight = vi.fn().mockResolvedValue('Should not be called');

    renderHook(() =>
      useChartInsights({
        ...baseOptions,
        chartType: 'stats',
        deterministicData: { hasSpecs: false },
        aiEnabled: true,
        aiContext: { process: {}, filters: [] } as UseChartInsightsOptions['aiContext'],
        fetchInsight,
        aiDebounceMs: 10,
      })
    );

    // Wait longer than the debounce to confirm fetch is never called
    await new Promise(r => setTimeout(r, 50));

    expect(fetchInsight).not.toHaveBeenCalled();
  });

  it('does not call fetchInsight when aiContext is null', async () => {
    const fetchInsight = vi.fn().mockResolvedValue('Should not be called');

    renderHook(() =>
      useChartInsights({
        ...baseOptions,
        aiEnabled: true,
        aiContext: null,
        fetchInsight,
        aiDebounceMs: 10,
      })
    );

    await new Promise(r => setTimeout(r, 50));

    expect(fetchInsight).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // AI dismiss interaction
  // -----------------------------------------------------------------------

  it('dismiss hides AI text and suppresses loading', async () => {
    const fetchInsight = vi.fn().mockResolvedValue('AI insight');

    const { result } = renderHook(() =>
      useChartInsights({
        ...baseOptions,
        aiEnabled: true,
        aiContext: { process: {}, filters: [] } as UseChartInsightsOptions['aiContext'],
        fetchInsight,
        aiDebounceMs: 10,
      })
    );

    // Dismiss before AI completes
    act(() => result.current.dismiss());

    expect(result.current.chipText).toBeNull();
    expect(result.current.isLoading).toBe(false); // loading suppressed when dismissed

    // Let AI complete
    await waitFor(() => {
      expect(fetchInsight).toHaveBeenCalled();
    });

    // Still dismissed
    expect(result.current.chipText).toBeNull();
    expect(result.current.isDismissed).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Unknown chart type fallback
  // -----------------------------------------------------------------------

  it('returns null for unknown chart type', () => {
    const { result } = renderHook(() =>
      useChartInsights({
        ...baseOptions,
        chartType: 'unknown' as UseChartInsightsOptions['chartType'],
        deterministicData: {},
      })
    );
    expect(result.current.chipText).toBeNull();
    expect(result.current.chipType).toBe('info');
  });
});
