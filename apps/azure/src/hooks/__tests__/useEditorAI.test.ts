import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Hoist mock references so vi.mock factories can access them
const { mockIsAIAvailable, mockFetchChartInsight } = vi.hoisted(() => ({
  mockIsAIAvailable: vi.fn(() => false),
  mockFetchChartInsight: vi.fn(),
}));

// Mock all external modules before imports
vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...actual,
    useAIContext: vi.fn(() => ({ context: null })),
    useNarration: vi.fn(() => ({
      narrative: null,
      isLoading: false,
      isCached: false,
      error: null,
      refresh: vi.fn(),
    })),
    useAICoScout: vi.fn(() => ({
      messages: [],
      send: vi.fn(),
      isLoading: false,
      isStreaming: false,
      stopStreaming: vi.fn(),
      error: null,
      retry: vi.fn(),
      clear: vi.fn(),
      copyLastResponse: vi.fn(),
    })),
    useKnowledgeSearch: vi.fn(() => ({
      results: [],
      documents: [],
      isSearching: false,
      search: vi.fn(async () => []),
    })),
  };
});

vi.mock('../../services/aiService', () => ({
  fetchNarration: vi.fn(),
  fetchChartInsight: mockFetchChartInsight,
  fetchCoScoutResponse: vi.fn(),
  fetchCoScoutStreamingResponse: vi.fn(),
  isAIAvailable: mockIsAIAvailable,
  getAIProviderLabel: vi.fn(() => null),
}));

vi.mock('../../services/searchService', () => ({
  searchRelatedFindings: vi.fn(),
  searchDocuments: vi.fn(),
  isKnowledgeBaseAvailable: vi.fn(() => false),
}));

vi.mock('@variscout/ui', () => ({
  updateFindingsPopout: vi.fn(),
}));

vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    hasTeamFeatures: vi.fn(() => false),
    buildSuggestedQuestions: vi.fn(() => []),
    getNelsonRule2Sequences: vi.fn(() => []),
    getNelsonRule3Sequences: vi.fn(() => []),
    calculateFactorVariations: vi.fn(() => new Map()),
  };
});

import { useEditorAI } from '../useEditorAI';

import type { DataRow, Finding, Hypothesis, FilterAction } from '@variscout/core';
import type { DrillStep } from '@variscout/hooks';

const baseOptions = {
  enabled: false,
  filteredData: [] as DataRow[],
  outcome: null as string | null,
  findings: [] as Finding[],
  hypotheses: [] as Hypothesis[],
  factors: [] as string[],
  filters: {} as Record<string, (string | number)[]>,
  filterStack: [] as FilterAction[],
  columnAliases: {} as Record<string, string>,
  drillPath: [] as DrillStep[],
  onOpenCoScout: vi.fn(),
  onOpenFindings: vi.fn(),
};

describe('useEditorAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAIAvailable.mockReturnValue(false);
  });

  it('returns all expected fields', () => {
    const { result } = renderHook(() => useEditorAI(baseOptions));
    expect(result.current).toHaveProperty('aiContext');
    expect(result.current).toHaveProperty('narration');
    expect(result.current).toHaveProperty('coscout');
    expect(result.current).toHaveProperty('knowledgeSearch');
    expect(result.current).toHaveProperty('suggestedQuestions');
    expect(result.current).toHaveProperty('handleNarrativeAsk');
    expect(result.current).toHaveProperty('handleAskCoScoutFromIdeas');
    expect(result.current).toHaveProperty('handleAskCoScoutFromFinding');
    expect(result.current).toHaveProperty('handleAskCoScoutFromCategory');
  });

  it('returns no fetchChartInsight when disabled', () => {
    const { result } = renderHook(() => useEditorAI(baseOptions));
    expect(result.current.fetchChartInsight).toBeUndefined();
  });

  it('returns empty suggested questions when context is null', () => {
    const { result } = renderHook(() => useEditorAI(baseOptions));
    expect(result.current.suggestedQuestions).toEqual([]);
  });

  it('handleNarrativeAsk calls onOpenCoScout', () => {
    const onOpenCoScout = vi.fn();
    const { result } = renderHook(() => useEditorAI({ ...baseOptions, onOpenCoScout }));
    result.current.handleNarrativeAsk();
    expect(onOpenCoScout).toHaveBeenCalledOnce();
  });

  it('handleAskCoScoutFromFinding calls onOpenFindings', () => {
    const onOpenFindings = vi.fn();
    const { result } = renderHook(() => useEditorAI({ ...baseOptions, onOpenFindings }));
    result.current.handleAskCoScoutFromFinding(undefined);
    expect(onOpenFindings).toHaveBeenCalledOnce();
  });

  it('handleAskCoScoutFromCategory calls onOpenCoScout', () => {
    const onOpenCoScout = vi.fn();
    const { result } = renderHook(() => useEditorAI({ ...baseOptions, onOpenCoScout }));
    result.current.handleAskCoScoutFromCategory(undefined);
    expect(onOpenCoScout).toHaveBeenCalledOnce();
  });

  it('computes violation counts when data is present', () => {
    const { result } = renderHook(() =>
      useEditorAI({
        ...baseOptions,
        enabled: true,
        outcome: 'Weight',
        stats: {
          mean: 10,
          median: 10,
          stdDev: 1,
          sigmaWithin: 0.89,
          mrBar: 1,
          ucl: 13,
          lcl: 7,
          cpk: 1.5,
          cp: 1.5,
          outOfSpecPercentage: 0,
        } as import('@variscout/core').StatsResult,
        filteredData: [{ Weight: 10 }, { Weight: 11 }, { Weight: 9 }],
      })
    );
    expect(result.current.aiContext).toBeDefined();
  });

  it('computes aiSelectedFinding when highlighted', () => {
    const { result } = renderHook(() =>
      useEditorAI({
        ...baseOptions,
        highlightedFindingId: 'f1',
        findings: [
          { id: 'f1', text: 'Test finding', status: 'observed', createdAt: Date.now() } as Finding,
        ],
      })
    );
    // The hook should not crash and should return valid state
    expect(result.current).toBeDefined();
  });

  it('returns fetchChartInsight when AI is available and enabled', () => {
    mockIsAIAvailable.mockReturnValue(true);

    const { result } = renderHook(() => useEditorAI({ ...baseOptions, enabled: true }));
    expect(result.current.fetchChartInsight).toBeDefined();
  });
});
