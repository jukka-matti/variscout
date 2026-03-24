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
import { createPhotoAttachment, createCommentAttachment, hasTeamFeatures } from '@variscout/core';
import {
  validateAttachmentFile,
  sanitizeFilename,
  inferMimeFromExtension,
} from '@variscout/core/ai';
import type { UseFindingsReturn } from '@variscout/hooks';
import { processPhoto } from '../utils/photoProcessing';
import { uploadPhoto, uploadAttachment } from '../services/photoUpload';
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

  /**
   * Add a comment, optionally with a file attachment.
   * - Image files (JPEG/PNG): routed through the existing photo-upload path.
   * - Non-image files (PDF, XLSX, CSV, TXT): use the generic attachment upload path.
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
        // Route image through the existing photo upload path
        await handleAddPhoto(findingId, comment.id, attachmentFile);
        return;
      }

      // Non-image attachment — Team plan only for upload; Standard gets a local reference
      if (!hasTeamFeatures()) {
        // Standard plan: record the filename as a local-only reference (no upload)
        const att = createCommentAttachment(
          sanitizeFilename(attachmentFile.name),
          mimeType,
          attachmentFile.size
        );
        // Mark as uploaded (local only — no actual upload)
        att.uploadStatus = 'uploaded';
        findingsState.addAttachmentToComment(findingId, comment.id, att);
        return;
      }

      // Team plan: upload to OneDrive and track status
      const sanitized = sanitizeFilename(attachmentFile.name);
      const att = createCommentAttachment(sanitized, mimeType, attachmentFile.size);
      // Optimistic add with pending status
      findingsState.addAttachmentToComment(findingId, comment.id, att);

      if (isLocalDev()) {
        findingsState.updateAttachmentStatus(findingId, comment.id, att.id, 'uploaded');
        return;
      }

      try {
        const result = await uploadAttachment(
          attachmentFile,
          sanitized,
          analysisId,
          findingId,
          location
        );
        findingsState.updateAttachmentStatus(
          findingId,
          comment.id,
          att.id,
          'uploaded',
          result.driveItemId,
          result.webUrl
        );
      } catch (err) {
        console.warn('[PhotoComments] Attachment upload failed:', err);
        findingsState.updateAttachmentStatus(findingId, comment.id, att.id, 'failed');
      }
    },
    [findingsState, author, analysisId, location, handleAddPhoto]
  );

  return {
    handleAddPhoto,
    handleCaptureFromTeams,
    isTeamsCamera: isTeamsMediaAvailable(),
    handleAddCommentWithAuthor,
  };
}
