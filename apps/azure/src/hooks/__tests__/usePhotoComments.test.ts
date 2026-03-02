/**
 * Tests for usePhotoComments hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @variscout/core — isTeamPlan defaults to true (photo comments are Team-only)
vi.mock('@variscout/core', () => ({
  isTeamPlan: () => true,
  createPhotoAttachment: vi.fn((filename: string) => ({
    id: `photo-${Date.now()}`,
    filename,
    uploadStatus: 'pending' as const,
    thumbnailDataUrl: undefined,
  })),
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

// Mock photo upload
vi.mock('../../services/photoUpload', () => ({
  uploadPhoto: vi.fn(() =>
    Promise.resolve({ driveItemId: 'drive-item-abc', webUrl: 'https://...' })
  ),
}));

// Mock easyAuth
vi.mock('../../auth/easyAuth', () => ({
  isLocalDev: vi.fn(() => true),
}));

// Mock teamsMedia
const mockIsTeamsMediaAvailable = vi.fn(() => false);
const mockCapturePhotoFromTeams = vi.fn();
vi.mock('../../teams/teamsMedia', () => ({
  isTeamsMediaAvailable: () => mockIsTeamsMediaAvailable(),
  capturePhotoFromTeams: (...args: unknown[]) => mockCapturePhotoFromTeams(...args),
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
    addPhotoToComment: vi.fn(),
    updatePhotoStatus: vi.fn(),
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

    // In local dev, should mark as uploaded immediately
    expect(mockFindings.updatePhotoStatus).toHaveBeenCalledWith(
      'f-1',
      'c-1',
      expect.any(String),
      'uploaded',
      expect.stringMatching(/^local-dev-/)
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

  describe('Teams camera integration', () => {
    it('isTeamsCamera reflects isTeamsMediaAvailable', () => {
      mockIsTeamsMediaAvailable.mockReturnValue(true);
      const { result } = renderHook(() =>
        usePhotoComments({
          findingsState: mockFindings,
          analysisId: 'test-analysis',
        })
      );
      expect(result.current.isTeamsCamera).toBe(true);
    });

    it('isTeamsCamera is false when Teams media unavailable', () => {
      mockIsTeamsMediaAvailable.mockReturnValue(false);
      const { result } = renderHook(() =>
        usePhotoComments({
          findingsState: mockFindings,
          analysisId: 'test-analysis',
        })
      );
      expect(result.current.isTeamsCamera).toBe(false);
    });

    it('handleCaptureFromTeams captures and processes photo', async () => {
      const teamsFile = new File(['teams-img'], 'teams_photo.jpg', { type: 'image/jpeg' });
      mockCapturePhotoFromTeams.mockResolvedValueOnce(teamsFile);

      const { result } = renderHook(() =>
        usePhotoComments({
          findingsState: mockFindings,
          analysisId: 'test-analysis',
        })
      );

      await act(async () => {
        await result.current.handleCaptureFromTeams('f-1', 'c-1');
      });

      // Should have called Teams camera
      expect(mockCapturePhotoFromTeams).toHaveBeenCalledOnce();

      // Should have processed the returned file
      expect(processPhoto).toHaveBeenCalledWith(teamsFile);

      // Should have added photo optimistically
      expect(mockFindings.addPhotoToComment).toHaveBeenCalled();
    });

    it('handleCaptureFromTeams does nothing when user cancels', async () => {
      mockCapturePhotoFromTeams.mockResolvedValueOnce(null);

      const { result } = renderHook(() =>
        usePhotoComments({
          findingsState: mockFindings,
          analysisId: 'test-analysis',
        })
      );

      await act(async () => {
        await result.current.handleCaptureFromTeams('f-1', 'c-1');
      });

      expect(mockCapturePhotoFromTeams).toHaveBeenCalledOnce();
      expect(processPhoto).not.toHaveBeenCalled();
      expect(mockFindings.addPhotoToComment).not.toHaveBeenCalled();
    });

    it('handleCaptureFromTeams handles errors gracefully', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockCapturePhotoFromTeams.mockRejectedValueOnce(new Error('Camera denied'));

      const { result } = renderHook(() =>
        usePhotoComments({
          findingsState: mockFindings,
          analysisId: 'test-analysis',
        })
      );

      await act(async () => {
        await result.current.handleCaptureFromTeams('f-1', 'c-1');
      });

      expect(consoleWarn).toHaveBeenCalledWith(
        '[PhotoComments] Teams camera failed:',
        expect.any(Error)
      );
      expect(mockFindings.addPhotoToComment).not.toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });
});
