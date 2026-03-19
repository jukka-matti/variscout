import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKnowledgeSearch,
  type KnowledgeResult,
  type DocumentResult,
  type UseKnowledgeSearchOptions,
} from '../useKnowledgeSearch';

const mockResult: KnowledgeResult = {
  projectName: 'Coffee Line 3',
  factor: 'Machine',
  status: 'resolved',
  etaSquared: 0.42,
  cpkBefore: 0.85,
  cpkAfter: 1.45,
  suspectedCause: 'Nozzle blockage',
  actionsText: 'Replaced nozzle weekly',
  outcomeEffective: true,
  score: 0.95,
};

describe('useKnowledgeSearch', () => {
  let mockSearchFn: UseKnowledgeSearchOptions['searchFn'];

  beforeEach(() => {
    mockSearchFn = vi
      .fn()
      .mockResolvedValue([mockResult]) as unknown as UseKnowledgeSearchOptions['searchFn'];
  });

  it('starts with empty results', () => {
    const { result } = renderHook(() =>
      useKnowledgeSearch({ searchFn: mockSearchFn, enabled: true })
    );
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('search calls searchFn and updates results', async () => {
    const { result } = renderHook(() =>
      useKnowledgeSearch({ searchFn: mockSearchFn, enabled: true })
    );

    let returned: { findings: KnowledgeResult[]; documents: DocumentResult[] } = {
      findings: [],
      documents: [],
    };
    await act(async () => {
      returned = await result.current.search('nozzle issue');
    });

    expect(mockSearchFn).toHaveBeenCalledWith('nozzle issue', { factor: undefined });
    expect(result.current.results).toEqual([mockResult]);
    expect(returned.findings).toEqual([mockResult]);
    expect(returned.documents).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('search passes factor to searchFn', async () => {
    const { result } = renderHook(() =>
      useKnowledgeSearch({ searchFn: mockSearchFn, enabled: true })
    );

    await act(async () => {
      await result.current.search('variation', 'Machine');
    });

    expect(mockSearchFn).toHaveBeenCalledWith('variation', { factor: 'Machine' });
  });

  it('search does nothing when disabled', async () => {
    const { result } = renderHook(() =>
      useKnowledgeSearch({ searchFn: mockSearchFn, enabled: false })
    );

    let returned = await act(async () => result.current.search('nozzle issue'));

    expect(mockSearchFn).not.toHaveBeenCalled();
    expect(returned).toEqual({ findings: [], documents: [] });
    expect(result.current.results).toEqual([]);
  });

  it('search does nothing when searchFn is not provided', async () => {
    const { result } = renderHook(() => useKnowledgeSearch({ enabled: true }));

    let returned = await act(async () => result.current.search('query'));

    expect(returned).toEqual({ findings: [], documents: [] });
  });

  it('search does nothing for empty query', async () => {
    const { result } = renderHook(() =>
      useKnowledgeSearch({ searchFn: mockSearchFn, enabled: true })
    );

    await act(async () => {
      await result.current.search('   ');
    });

    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('handles search errors gracefully', async () => {
    const failingFn = vi.fn().mockRejectedValue(new Error('Search failed'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useKnowledgeSearch({ searchFn: failingFn, enabled: true }));

    let returned = await act(async () => result.current.search('query'));

    expect(returned).toEqual({ findings: [], documents: [] });
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    consoleSpy.mockRestore();
  });

  it('clear resets results', async () => {
    const { result } = renderHook(() =>
      useKnowledgeSearch({ searchFn: mockSearchFn, enabled: true })
    );

    await act(async () => {
      await result.current.search('query');
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.clear();
    });
    expect(result.current.results).toEqual([]);
  });

  // --- Document search tests ---

  const mockDocResult: DocumentResult = {
    title: 'SOP: Nozzle Maintenance',
    snippet: 'Clean nozzles every 8 hours',
    source: 'SOPs',
    url: 'https://sharepoint.example.com/sop-1',
    relevanceScore: 0.88,
  };

  it('documents starts as empty array', () => {
    const { result } = renderHook(() =>
      useKnowledgeSearch({ searchFn: mockSearchFn, enabled: true })
    );
    expect(result.current.documents).toEqual([]);
  });

  it('search calls both searchFn and searchDocumentsFn in parallel', async () => {
    const mockDocSearchFn = vi.fn().mockResolvedValue([mockDocResult]);

    const { result } = renderHook(() =>
      useKnowledgeSearch({
        searchFn: mockSearchFn,
        searchDocumentsFn: mockDocSearchFn,
        enabled: true,
      })
    );

    let returned = await act(async () => result.current.search('nozzle issue'));

    expect(mockSearchFn).toHaveBeenCalledWith('nozzle issue', { factor: undefined });
    expect(mockDocSearchFn).toHaveBeenCalledWith('nozzle issue', { folderScope: undefined });
    expect(returned.findings).toEqual([mockResult]);
    expect(returned.documents).toEqual([mockDocResult]);
    expect(result.current.results).toEqual([mockResult]);
    expect(result.current.documents).toEqual([mockDocResult]);
  });

  it('search works with only searchDocumentsFn (no searchFn)', async () => {
    const mockDocSearchFn = vi.fn().mockResolvedValue([mockDocResult]);

    const { result } = renderHook(() =>
      useKnowledgeSearch({
        searchDocumentsFn: mockDocSearchFn,
        enabled: true,
      })
    );

    await act(async () => {
      await result.current.search('nozzle maintenance');
    });

    expect(mockDocSearchFn).toHaveBeenCalledWith('nozzle maintenance', { folderScope: undefined });
    expect(result.current.results).toEqual([]);
    expect(result.current.documents).toEqual([mockDocResult]);
  });

  it('clear also clears documents', async () => {
    const mockDocSearchFn = vi.fn().mockResolvedValue([mockDocResult]);

    const { result } = renderHook(() =>
      useKnowledgeSearch({
        searchFn: mockSearchFn,
        searchDocumentsFn: mockDocSearchFn,
        enabled: true,
      })
    );

    await act(async () => {
      await result.current.search('query');
    });
    expect(result.current.results).toHaveLength(1);
    expect(result.current.documents).toHaveLength(1);

    act(() => {
      result.current.clear();
    });
    expect(result.current.results).toEqual([]);
    expect(result.current.documents).toEqual([]);
  });
});
