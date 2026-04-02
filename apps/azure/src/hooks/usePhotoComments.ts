/**
 * usePhotoComments — Azure-specific hook wiring photo processing
 * and findings state for photo comments.
 *
 * OneDrive upload and Teams camera removed per ADR-059.
 * Photos are stored locally only (processed for EXIF strip + thumbnail).
 */

import { useCallback } from 'react';
import { createPhotoAttachment, createCommentAttachment, hasTeamFeatures } from '@variscout/core';
import {
  validateAttachmentFile,
  sanitizeFilename,
  inferMimeFromExtension,
} from '@variscout/core/ai';
import type { UseFindingsReturn } from '@variscout/hooks';
import { processPhoto } from '../utils/photoProcessing';
import { saveBlobPhoto } from '../services/blobClient';

interface UsePhotoCommentsOptions {
  findingsState: UseFindingsReturn;
  analysisId: string;
  author?: string;
}

export function usePhotoComments({ findingsState, analysisId, author }: UsePhotoCommentsOptions) {
  const handleAddPhoto = useCallback(
    async (findingId: string, commentId: string, file: File) => {
      try {
        // 1. Process photo (EXIF strip + thumbnail)
        const processed = await processPhoto(file);

        // 2. Create photo attachment with optimistic pending status
        const photo = createPhotoAttachment(processed.filename);
        photo.thumbnailDataUrl = processed.thumbnailDataUrl;

        // 3. Add to UI
        findingsState.addPhotoToComment(findingId, commentId, photo);

        // 4. Upload to Blob Storage for Team plan (if online)
        if (hasTeamFeatures() && navigator.onLine && analysisId) {
          try {
            const remoteUrl = await saveBlobPhoto(
              analysisId,
              findingId,
              photo.id,
              processed.fullResBlob
            );
            findingsState.updatePhotoStatus(findingId, commentId, photo.id, 'uploaded', remoteUrl);
            return;
          } catch (uploadErr) {
            if (import.meta.env.DEV)
              console.warn('[PhotoComments] Blob upload failed, falling back to local:', uploadErr);
          }
        }

        // 5. Fallback: mark as local-only upload
        findingsState.updatePhotoStatus(
          findingId,
          commentId,
          photo.id,
          'uploaded',
          `local-${Date.now()}`
        );
      } catch (err) {
        console.error('[PhotoComments] Photo processing failed:', err);
      }
    },
    [findingsState, analysisId]
  );

  /**
   * Add a comment, optionally with a file attachment.
   * - Image files (JPEG/PNG): routed through the photo-processing path.
   * - Non-image files (PDF, XLSX, CSV, TXT): recorded as local-only references.
   * - Files that fail validation are silently dropped (validation happens in the UI before this).
   */
  const handleAddCommentWithAuthor = useCallback(
    async (findingId: string, text: string, attachmentFile?: File) => {
      // Always add the comment text first so it appears immediately
      const comment = findingsState.addFindingComment(findingId, text, author);
      if (!comment || !attachmentFile) return;

      const mimeType = attachmentFile.type || inferMimeFromExtension(attachmentFile.name);
      const isImage = mimeType.startsWith('image/');

      // Re-validate to be safe (UI already validated, but defense-in-depth)
      const validation = await validateAttachmentFile(attachmentFile);
      if (!validation.valid) {
        console.warn('[PhotoComments] Attachment validation failed:', validation.reason);
        return;
      }

      if (isImage) {
        // Route image through the photo processing path
        await handleAddPhoto(findingId, comment.id, attachmentFile);
        return;
      }

      // Non-image attachment — record the filename as a local-only reference (no upload)
      const att = createCommentAttachment(
        sanitizeFilename(attachmentFile.name),
        mimeType,
        attachmentFile.size
      );
      att.uploadStatus = 'uploaded';
      findingsState.addAttachmentToComment(findingId, comment.id, att);
    },
    [findingsState, author, handleAddPhoto]
  );

  return {
    handleAddPhoto,
    handleCaptureFromTeams: undefined,
    isTeamsCamera: false,
    handleAddCommentWithAuthor,
  };
}
