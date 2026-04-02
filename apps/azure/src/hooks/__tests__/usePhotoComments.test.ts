/**
 * Tests for usePhotoComments hook
 *
 * Teams camera and OneDrive upload removed per ADR-059.
 * Photos are now processed locally only.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @variscout/core
vi.mock('@variscout/core', () => ({
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
  hasTeamFeatures: vi.fn(() => false),
}));

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

// Mock blobClient (not called when hasTeamFeatures returns false)
vi.mock('../../services/blobClient', () => ({
  saveBlobPhoto: vi.fn(() => Promise.resolve('https://blob.example.com/photo.jpg')),
}));

import { usePhotoComments } from '../usePhotoComments';
import { processPhoto } from '../../utils/photoProcessing';
import type { UseFindingsReturn } from '@variscout/hooks';

function createMockFindingsState(): UseFindingsReturn {
  return {
    findings: [],
    addFinding: vi.fn(),
    editFinding: vi.fn(),
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
    linkQuestion: vi.fn(),
    unlinkQuestion: vi.fn(),
    setProjection: vi.fn(),
    clearProjection: vi.fn(),
    addAction: vi.fn(),
    updateAction: vi.fn(),
    completeAction: vi.fn(),
    toggleActionComplete: vi.fn(),
    deleteAction: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindings = createMockFindingsState();
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

    // Should mark as uploaded (local only)
    expect(mockFindings.updatePhotoStatus).toHaveBeenCalledWith(
      'f-1',
      'c-1',
      expect.any(String),
      'uploaded',
      expect.stringMatching(/^local-/)
    );
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
