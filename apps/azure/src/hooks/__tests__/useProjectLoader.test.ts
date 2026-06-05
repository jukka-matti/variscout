import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
} from '@variscout/stores';
import { useProjectLoader } from '../useProjectLoader';

vi.mock('../../services/storage', () => ({
  classifySyncError: vi.fn(() => ({ category: 'unknown' })),
}));

function baseOptions(loadProject: (id: string) => Promise<void>) {
  return {
    projectId: 'proj-1',
    hasData: false,
    isLoadingProject: false,
    startProjectLoad: vi.fn(),
    projectLoaded: vi.fn(),
    loadProject,
    onBack: vi.fn(),
  };
}

describe('useProjectLoader — PO-8a typed persistence errors', () => {
  it('a version-mismatched document surfaces the refresh-hint error with a Refresh action', async () => {
    const { result } = renderHook(() =>
      useProjectLoader(
        baseOptions(() => Promise.reject(new DocumentSnapshotVersionMismatchError(2)))
      )
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.code).toBe('version-mismatch');
    expect(result.current?.message).toMatch(/different version/i);
    expect(result.current?.message).toMatch(/refresh/i);
    expect(result.current?.action?.label).toBe('Refresh');
  });

  it('a corrupt document surfaces the loud corrupt error', async () => {
    const { result } = renderHook(() =>
      useProjectLoader(baseOptions(() => Promise.reject(new DocumentSnapshotCorruptError())))
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.code).toBe('corrupt');
    expect(result.current?.message).toMatch(/invalid or corrupted/i);
  });

  it('negative control: a successful load produces no error', async () => {
    const projectLoaded = vi.fn();
    const options = { ...baseOptions(() => Promise.resolve()), projectLoaded };
    const { result } = renderHook(() => useProjectLoader(options));
    await waitFor(() => expect(projectLoaded).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
