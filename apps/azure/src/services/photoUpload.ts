/**
 * Photo upload service — uploads files to OneDrive via Graph API.
 * Team plan only.
 *
 * Default photo path:  /VariScout/Photos/{analysisId}/{findingId}/{filename}
 * Generic attachment:  /VariScout/Attachments/{analysisId}/{findingId}/{filename}
 *
 * The core `uploadFile` helper accepts any File / Blob and an explicit
 * OneDrive sub-folder name, so it can be reused for non-image attachments
 * (PDF, XLSX, CSV, TXT) without changing the Graph API upload logic.
 *
 * Public API:
 *   uploadPhoto(blob, filename, analysisId, findingId, location?)
 *     – backwards-compatible wrapper, uses "Photos" sub-folder, forces image/jpeg
 *   uploadAttachment(file, filename, analysisId, findingId, location?)
 *     – general-purpose wrapper for any supported attachment type;
 *       Content-Type is derived from the File's MIME type
 */

import { hasTeamFeatures } from '@variscout/core';
import { isLocalDev } from '../auth/easyAuth';
import { getGraphToken } from '../auth/graphToken';
import { classifySyncError, type StorageLocation } from './storage';
import { getChannelDriveInfo } from './channelDrive';
import { graphFetch, GRAPH_BASE } from './graphFetch';

// ── Types ────────────────────────────────────────────────────────────────

export interface PhotoUploadResult {
  driveItemId: string;
  webUrl?: string;
}

// ── Drive Path Resolution ────────────────────────────────────────────────

interface DrivePaths {
  rootPath: string; // e.g. '/me/drive/root' or '/drives/{driveId}/root'
  basePath: string; // e.g. '/me/drive/root:' or '/drives/{driveId}/root:'
}

async function getDrivePaths(token: string, location: StorageLocation): Promise<DrivePaths> {
  if (location === 'personal') {
    return { rootPath: '/me/drive/root', basePath: '/me/drive/root:' };
  }

  const driveInfo = await getChannelDriveInfo(token);
  if (!driveInfo) {
    // Fallback to personal drive
    return { rootPath: '/me/drive/root', basePath: '/me/drive/root:' };
  }

  return {
    rootPath: `/drives/${driveInfo.driveId}/root`,
    basePath: `/drives/${driveInfo.driveId}/root:`,
  };
}

// ── Folder Creation ──────────────────────────────────────────────────────

/**
 * Ensure /VariScout/{subFolder}/{analysisId}/{findingId}/ exists in the target drive.
 * Uses conflictBehavior: 'replace' (idempotent — no-op if folder already exists).
 */
async function ensureFolder(
  token: string,
  subFolder: string,
  analysisId: string,
  findingId: string,
  paths: DrivePaths
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const createFolder = async (url: string, name: string): Promise<void> => {
    const res = await graphFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'replace',
      }),
    });
    // 409 = folder already exists (expected); anything else non-ok is an error
    if (!res.ok && res.status !== 409) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Failed to create folder "${name}": ${res.status}`);
    }
  };

  // Create /VariScout (no-op if exists)
  await createFolder(`${GRAPH_BASE}${paths.rootPath}/children`, 'VariScout');
  // Create /VariScout/{subFolder}
  await createFolder(`${GRAPH_BASE}${paths.rootPath}:/VariScout:/children`, subFolder);
  // Create /VariScout/{subFolder}/{analysisId}
  await createFolder(
    `${GRAPH_BASE}${paths.rootPath}:/VariScout/${encodeURIComponent(subFolder)}:/children`,
    analysisId
  );
  // Create /VariScout/{subFolder}/{analysisId}/{findingId}
  await createFolder(
    `${GRAPH_BASE}${paths.rootPath}:/VariScout/${encodeURIComponent(subFolder)}/${encodeURIComponent(analysisId)}:/children`,
    findingId
  );
}

// ── Core Upload Helper ───────────────────────────────────────────────────

/**
 * Upload any file to /VariScout/{subFolder}/{analysisId}/{findingId}/{filename}
 * on the target OneDrive / SharePoint drive.
 *
 * @param blob - The file content (File or Blob)
 * @param contentType - MIME type sent as Content-Type header
 * @param subFolder - Top-level sub-folder inside /VariScout/ (e.g. "Photos", "Attachments")
 * @param filename - Sanitized filename
 * @param analysisId - Project/analysis identifier
 * @param findingId - Finding identifier
 * @param location - Drive location ('personal' or 'team')
 */
async function uploadFile(
  blob: Blob,
  contentType: string,
  subFolder: string,
  filename: string,
  analysisId: string,
  findingId: string,
  location: StorageLocation
): Promise<PhotoUploadResult> {
  const token = await getGraphToken();
  const paths = await getDrivePaths(token, location);

  await ensureFolder(token, subFolder, analysisId, findingId, paths);

  const uploadPath = `/VariScout/${encodeURIComponent(subFolder)}/${encodeURIComponent(analysisId)}/${encodeURIComponent(findingId)}/${encodeURIComponent(filename)}`;
  const res = await graphFetch(`${GRAPH_BASE}${paths.basePath}${uploadPath}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!res.ok) {
    const classified = classifySyncError(new Error(`Upload failed: ${res.status}`));
    throw new Error(classified.message);
  }

  const data = await res.json();
  return {
    driveItemId: data.id,
    webUrl: data.webUrl,
  };
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Upload a photo (JPEG) to OneDrive under /VariScout/Photos/.
 * Backwards-compatible with previous callers.
 *
 * @param blob - The JPEG blob to upload
 * @param filename - Sanitized filename (e.g., "photo_001.jpg")
 * @param analysisId - The project/analysis name
 * @param findingId - The finding this photo belongs to
 * @param location - Storage location ('personal' or 'team')
 */
export async function uploadPhoto(
  blob: Blob,
  filename: string,
  analysisId: string,
  findingId: string,
  location: StorageLocation = 'personal'
): Promise<PhotoUploadResult> {
  if (!hasTeamFeatures()) {
    throw new Error('Photo upload requires Team plan');
  }

  if (isLocalDev()) {
    console.info(
      `[PhotoUpload] Local dev: simulated upload of ${filename} to /VariScout/Photos/${analysisId}/${findingId}/`
    );
    return { driveItemId: `local-dev-${Date.now()}` };
  }

  return uploadFile(blob, 'image/jpeg', 'Photos', filename, analysisId, findingId, location);
}

/**
 * Upload any supported attachment (PDF, XLSX, CSV, TXT, or image) to OneDrive
 * under /VariScout/Attachments/.
 *
 * The Content-Type is read from `file.type`; pass a pre-validated File from
 * `validateAttachmentFile()` to ensure only supported types reach this function.
 *
 * @param file - The File object to upload
 * @param filename - Sanitized filename (use `sanitizeFilename()` from @variscout/core)
 * @param analysisId - The project/analysis name
 * @param findingId - The finding this attachment belongs to
 * @param location - Storage location ('personal' or 'team')
 */
export async function uploadAttachment(
  file: File,
  filename: string,
  analysisId: string,
  findingId: string,
  location: StorageLocation = 'personal'
): Promise<PhotoUploadResult> {
  if (!hasTeamFeatures()) {
    throw new Error('Attachment upload requires Team plan');
  }

  if (isLocalDev()) {
    console.info(
      `[PhotoUpload] Local dev: simulated upload of ${filename} to /VariScout/Attachments/${analysisId}/${findingId}/`
    );
    return { driveItemId: `local-dev-${Date.now()}` };
  }

  const contentType = file.type || 'application/octet-stream';
  return uploadFile(file, contentType, 'Attachments', filename, analysisId, findingId, location);
}
