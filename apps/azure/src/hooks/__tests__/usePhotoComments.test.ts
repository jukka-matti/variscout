/**
 * Tests for usePhotoComments hook
 *
 * Teams camera and OneDrive upload removed per ADR-059.
 * Photos are now processed locally only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @variscout/core
vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    createPhotoAttachment: vi.fn((filename: string) => ({
      id: `photo-${Date.now()}`,
      filename,
      uploadStatus: 'pending' as const,
      thumbnailDataUrl: undefined,
    })),
    createCommentAttachment: vi.fn((filename: string, mimeType: string, size: number) => ({
      id: `att-${Date.now()}`,
      filename,
      mimeType,
      size,
      uploadStatus: 'pending' as const,
    })),
  };
});

// Mock photo processing
vi.mock('../../utils/photoProcessing', () => ({
  processPhoto: vi.fn(() =>
    Promise.resolve({
      fullResBlob: new Blob(['test'], { type: 'image/jpeg' }),
      thumbnailDataUrl: 'data:image/jpeg;base64,abc123',
      filename: 'processed_photo.jpg',
    })
  ),
}));

// Mock blobClient
vi.mock('../../services/blobClient', () => ({
  saveBlobPhoto: vi.fn(() =>
    Promise.resolve('/api/storage/photos/test-analysis/findings/f-1/photo.jpg')
  ),
}));

import { usePhotoComments } from '../usePhotoComments';
import { processPhoto } from '../../utils/photoProcessing';
import { saveBlobPhoto } from '../../services/blobClient';
import type { UseFindingsReturn } from '@variscout/hooks';

function createMockFindingsState(): UseFindingsReturn {
  return {
    findings: [],
    addFinding: vi.fn(),
    editFinding: vi.fn(),
    editFindingEvidenceType: vi.fn(),
    deleteFinding: vi.fn(),
    getFindingContext: vi.fn(),
    findDuplicate: vi.fn(),
    findDuplicateSource: vi.fn(),
    getChartFindings: vi.fn().mockReturnValue([]),
    setFindingStatus: vi.fn(),
    setFindingTag: vi.fn(),
    addFindingComment: vi.fn(),
    editFindingComment: vi.fn(),
    deleteFindingComment: vi.fn(),
    setFindingAssignee: vi.fn(),
    addPhotoToComment: vi.fn(),
    updatePhotoStatus: vi.fn(),
    setProjection: vi.fn(),
    clearProjection: vi.fn(),
    setValidation: vi.fn(),
    addAction: vi.fn(),
    updateAction: vi.fn(),
    completeAction: vi.fn(),
    toggleActionComplete: vi.fn(),
    deleteAction: vi.fn(),
    promoteAction: vi.fn(),
    setOutcome: vi.fn(),
    addAttachmentToComment: vi.fn(),
    updateAttachmentStatus: vi.fn(),
    setBenchmark: vi.fn(),
    clearBenchmark: vi.fn(),
    toggleScope: vi.fn(),
  };
}

describe('usePhotoComments', () => {
  let mockFindings: UseFindingsReturn;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    mockFindings = createMockFindingsState();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('handleAddPhoto processes photo and updates findings state', async () => {
    const { result } = renderHook(() =>
      usePhotoComments({
        findingsState: mockFindings,
        analysisId: 'test-analysis',
        author: 'Jane',
      })
    );

    const file = new File(['test-image'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleAddPhoto('f-1', 'c-1', file);
    });

    // Should have processed the photo
    expect(processPhoto).toHaveBeenCalledWith(file);

    // Should have added photo to comment optimistically
    expect(mockFindings.addPhotoToComment).toHaveBeenCalledWith(
      'f-1',
      'c-1',
      expect.objectContaining({
        filename: 'processed_photo.jpg',
        thumbnailDataUrl: 'data:image/jpeg;base64,abc123',
        uploadStatus: 'pending',
      })
    );

    // Should mark as uploaded with the remote URL from blob storage
    expect(mockFindings.updatePhotoStatus).toHaveBeenCalledWith(
      'f-1',
      'c-1',
      expect.any(String),
      'uploaded',
      '/api/storage/photos/test-analysis/findings/f-1/photo.jpg'
    );
    expect(saveBlobPhoto).toHaveBeenCalledWith(
      'test-analysis',
      'f-1',
      expect.any(String),
      expect.any(Blob)
    );
    expect(
      fetchSpy.mock.calls.some((call: Parameters<typeof fetch>) => call[0] === '/api/storage-token')
    ).toBe(false);
  });

  it('handleAddCommentWithAuthor passes author to addFindingComment', () => {
    const { result } = renderHook(() =>
      usePhotoComments({
        findingsState: mockFindings,
        analysisId: 'test-analysis',
        author: 'John Smith',
      })
    );

    act(() => {
      result.current.handleAddCommentWithAuthor('f-1', 'Great observation');
    });

    expect(mockFindings.addFindingComment).toHaveBeenCalledWith(
      'f-1',
      'Great observation',
      'John Smith'
    );
  });

  it('handleAddCommentWithAuthor works without author', () => {
    const { result } = renderHook(() =>
      usePhotoComments({
        findingsState: mockFindings,
        analysisId: 'test-analysis',
      })
    );

    act(() => {
      result.current.handleAddCommentWithAuthor('f-1', 'Note');
    });

    expect(mockFindings.addFindingComment).toHaveBeenCalledWith('f-1', 'Note', undefined);
  });

  it('isTeamsCamera is always false (Teams removed per ADR-059)', () => {
    const { result } = renderHook(() =>
      usePhotoComments({
        findingsState: mockFindings,
        analysisId: 'test-analysis',
      })
    );
    expect(result.current.isTeamsCamera).toBe(false);
  });

  it('handleCaptureFromTeams is undefined (Teams removed per ADR-059)', () => {
    const { result } = renderHook(() =>
      usePhotoComments({
        findingsState: mockFindings,
        analysisId: 'test-analysis',
      })
    );
    expect(result.current.handleCaptureFromTeams).toBeUndefined();
  });
});
