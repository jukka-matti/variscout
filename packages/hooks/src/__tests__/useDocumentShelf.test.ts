import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentShelf, type DocumentInfo } from '../useDocumentShelf';

// Minimal helpers
const makeDoc = (overrides: Partial<DocumentInfo> = {}): DocumentInfo => ({
  id: 'doc-1',
  fileName: 'report.pdf',
  fileSize: 1024,
  uploadedAt: '2026-04-02T10:00:00Z',
  ...overrides,
});

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [] as DocumentInfo[],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDocumentShelf', () => {
  // -----------------------------------------------------------------------
  // Guard: disabled state
  // -----------------------------------------------------------------------

  it('returns empty documents when disabled', async () => {
    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: false }));

    // No fetch should fire, documents empty
    expect(result.current.documents).toEqual([]);
    expect(result.current.filteredDocuments).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty documents when projectId is undefined', async () => {
    const { result } = renderHook(() => useDocumentShelf({ projectId: undefined, enabled: true }));

    expect(result.current.documents).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Initial fetch
  // -----------------------------------------------------------------------

  it('fetches documents on mount when enabled', async () => {
    const docs = [makeDoc({ id: 'doc-1', fileName: 'alpha.pdf' })];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => docs });

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/kb-list?projectId=proj-1'),
      expect.objectContaining({ credentials: 'include' })
    );
    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].fileName).toBe('alpha.pdf');
  });

  it('sets error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeDefined();
    expect(result.current.documents).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // Filtering
  // -----------------------------------------------------------------------

  it('filters documents by name (case-insensitive)', async () => {
    const docs: DocumentInfo[] = [
      makeDoc({ id: '1', fileName: 'Alpha Report.pdf' }),
      makeDoc({ id: '2', fileName: 'Beta Summary.docx' }),
      makeDoc({ id: '3', fileName: 'alpha summary.txt' }),
    ];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => docs });

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilterText('alpha');
    });

    expect(result.current.filteredDocuments).toHaveLength(2);
    expect(result.current.filteredDocuments.map(d => d.id)).toEqual(
      expect.arrayContaining(['1', '3'])
    );
  });

  it('returns all documents when filterText is empty', async () => {
    const docs: DocumentInfo[] = [
      makeDoc({ id: '1', fileName: 'Alpha.pdf' }),
      makeDoc({ id: '2', fileName: 'Beta.pdf' }),
    ];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => docs });

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.filteredDocuments).toHaveLength(2);
  });

  // -----------------------------------------------------------------------
  // Sorting
  // -----------------------------------------------------------------------

  it('documents are always sorted alphabetically by fileName', async () => {
    const docs: DocumentInfo[] = [
      makeDoc({ id: '1', fileName: 'Zebra.pdf' }),
      makeDoc({ id: '2', fileName: 'alpha.pdf' }),
      makeDoc({ id: '3', fileName: 'Mango.pdf' }),
    ];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => docs });

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const names = result.current.documents.map(d => d.fileName);
    expect(names).toEqual(['alpha.pdf', 'Mango.pdf', 'Zebra.pdf']);
  });

  // -----------------------------------------------------------------------
  // Upload
  // -----------------------------------------------------------------------

  it('upload calls /api/kb-upload then refreshes document list', async () => {
    const initialDocs: DocumentInfo[] = [];
    const afterUpload: DocumentInfo[] = [makeDoc({ id: 'new-1', fileName: 'new.pdf' })];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => initialDocs }) // initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // upload POST
      .mockResolvedValueOnce({ ok: true, json: async () => afterUpload }); // refresh fetch

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['content'], 'new.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.upload(file);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/kb-upload'),
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );

    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].fileName).toBe('new.pdf');
    expect(result.current.isUploading).toBe(false);
  });

  it('upload sets error on failure', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // initial fetch
      .mockResolvedValueOnce({ ok: false, status: 413 }); // upload fail

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['x'], 'big.pdf', { type: 'application/pdf' });

    await act(async () => {
      try {
        await result.current.upload(file);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isUploading).toBe(false);
  });

  // -----------------------------------------------------------------------
  // uploadMultiple
  // -----------------------------------------------------------------------

  it('uploadMultiple uploads files sequentially and reports progress', async () => {
    const afterUpload: DocumentInfo[] = [
      makeDoc({ id: '1', fileName: 'a.pdf' }),
      makeDoc({ id: '2', fileName: 'b.pdf' }),
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // upload 1
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // upload 2
      .mockResolvedValueOnce({ ok: true, json: async () => afterUpload }); // refresh

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const files = [
      new File(['a'], 'a.pdf', { type: 'application/pdf' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ];

    await act(async () => {
      await result.current.uploadMultiple(files);
    });

    // Two POST calls — one per file
    const uploadCalls = mockFetch.mock.calls.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c => (c[1] as any)?.method === 'POST'
    );
    expect(uploadCalls).toHaveLength(2);
    expect(result.current.documents).toHaveLength(2);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Delete (optimistic)
  // -----------------------------------------------------------------------

  it('delete removes document from list immediately (optimistic)', async () => {
    const docs: DocumentInfo[] = [
      makeDoc({ id: 'doc-1', fileName: 'a.pdf' }),
      makeDoc({ id: 'doc-2', fileName: 'b.pdf' }),
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => docs }) // initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // delete

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.documents).toHaveLength(2);

    await act(async () => {
      await result.current.remove('doc-1', 'a.pdf');
    });

    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].id).toBe('doc-2');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/kb-delete'),
      expect.objectContaining({ method: 'DELETE', credentials: 'include' })
    );
  });

  it('delete rolls back optimistic removal on API failure', async () => {
    const docs: DocumentInfo[] = [makeDoc({ id: 'doc-1', fileName: 'a.pdf' })];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => docs }) // initial fetch
      .mockResolvedValueOnce({ ok: false, status: 500 }) // delete fail
      .mockResolvedValueOnce({ ok: true, json: async () => docs }); // re-fetch on rollback

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let caughtError = false;
    await act(async () => {
      try {
        await result.current.remove('doc-1', 'a.pdf');
      } catch {
        caughtError = true;
      }
    });

    expect(caughtError).toBe(true);

    // After rollback re-fetch completes, documents should be restored
    await waitFor(() => {
      expect(result.current.documents).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Refresh
  // -----------------------------------------------------------------------

  it('refresh re-fetches document list', async () => {
    const initialDocs: DocumentInfo[] = [makeDoc({ id: '1', fileName: 'first.pdf' })];
    const refreshedDocs: DocumentInfo[] = [
      makeDoc({ id: '1', fileName: 'first.pdf' }),
      makeDoc({ id: '2', fileName: 'second.pdf' }),
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => initialDocs })
      .mockResolvedValueOnce({ ok: true, json: async () => refreshedDocs });

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.documents).toHaveLength(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.documents).toHaveLength(2);
  });

  // -----------------------------------------------------------------------
  // Error cleared on success
  // -----------------------------------------------------------------------

  it('error is cleared on next successful fetch', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 }) // first fetch fails
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // refresh succeeds

    const { result } = renderHook(() => useDocumentShelf({ projectId: 'proj-1', enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeDefined();

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBeUndefined();
  });
});
