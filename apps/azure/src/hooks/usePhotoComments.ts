/**
 * usePhotoComments — Azure-specific hook wiring photo processing,
 * upload, and findings state for photo comments.
 *
 * Team plan only. Handles:
 * 1. processPhoto() → EXIF strip + thumbnail
 * 2. Optimistic UI update via addPhotoToComment
 * 3. Background upload to OneDrive
 * 4. Status update on success/failure
 */

import { useCallback } from 'react';
import { createPhotoAttachment, hasTeamFeatures } from '@variscout/core';
import type { UseFindingsReturn } from '@variscout/hooks';
import { processPhoto } from '../utils/photoProcessing';
import { uploadPhoto } from '../services/photoUpload';
import { isLocalDev } from '../auth/easyAuth';
import type { StorageLocation } from '../services/storage';
import { isTeamsMediaAvailable, capturePhotoFromTeams } from '../teams/teamsMedia';

interface UsePhotoCommentsOptions {
  findingsState: UseFindingsReturn;
  analysisId: string;
  author?: string;
  /** Storage location — photos go to same drive as the project */
  location?: StorageLocation;
}

export function usePhotoComments({
  findingsState,
  analysisId,
  author,
  location = 'personal',
}: UsePhotoCommentsOptions) {
  const handleAddPhoto = useCallback(
    async (findingId: string, commentId: string, file: File) => {
      // Photo upload requires Team plan (OneDrive storage)
      if (!hasTeamFeatures()) return;

      try {
        // 1. Process photo (EXIF strip + thumbnail)
        const processed = await processPhoto(file);

        // 2. Create photo attachment with optimistic pending status
        const photo = createPhotoAttachment(processed.filename);
        photo.thumbnailDataUrl = processed.thumbnailDataUrl;

        // 3. Optimistic UI update
        findingsState.addPhotoToComment(findingId, commentId, photo);

        // 4. Upload to OneDrive (skip in local dev — processPhoto already works)
        if (!isLocalDev()) {
          try {
            const result = await uploadPhoto(
              processed.fullResBlob,
              processed.filename,
              analysisId,
              findingId,
              location
            );

            // 5. Update status to uploaded
            findingsState.updatePhotoStatus(
              findingId,
              commentId,
              photo.id,
              'uploaded',
              result.driveItemId
            );
          } catch (uploadErr) {
            console.warn('[PhotoComments] Upload failed:', uploadErr);
            findingsState.updatePhotoStatus(findingId, commentId, photo.id, 'failed');
          }
        } else {
          // Local dev: mark as uploaded immediately
          findingsState.updatePhotoStatus(
            findingId,
            commentId,
            photo.id,
            'uploaded',
            `local-dev-${Date.now()}`
          );
        }
      } catch (err) {
        console.error('[PhotoComments] Photo processing failed:', err);
      }
    },
    [findingsState, analysisId, location]
  );

  const handleCaptureFromTeams = useCallback(
    async (findingId: string, commentId: string) => {
      if (!hasTeamFeatures()) return;
      try {
        const file = await capturePhotoFromTeams();
        if (!file) return; // User cancelled
        await handleAddPhoto(findingId, commentId, file);
      } catch (err) {
        console.warn('[PhotoComments] Teams camera failed:', err);
      }
    },
    [handleAddPhoto]
  );

  const handleAddCommentWithAuthor = useCallback(
    (findingId: string, text: string) => {
      findingsState.addFindingComment(findingId, text, author);
    },
    [findingsState, author]
  );

  return {
    handleAddPhoto,
    handleCaptureFromTeams,
    isTeamsCamera: isTeamsMediaAvailable(),
    handleAddCommentWithAuthor,
  };
}
