/**
 * Photo upload service — uploads full-resolution photos to OneDrive
 * via Graph API. Team plan only.
 *
 * OneDrive path: /VariScout/Photos/{analysisId}/{findingId}/{filename}
 */

import { hasTeamFeatures } from '@variscout/core';
import { isLocalDev } from '../auth/easyAuth';
import { getGraphToken } from '../auth/graphToken';
import { classifySyncError, type StorageLocation } from './storage';
import { getChannelDriveInfo } from './channelDrive';

// ── Types ────────────────────────────────────────────────────────────────

export interface PhotoUploadResult {
  driveItemId: string;
  webUrl?: string;
}

// ── Constants ────────────────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// ── Drive Path Resolution ────────────────────────────────────────────────

interface PhotoDrivePaths {
  rootPath: string; // e.g. '/me/drive/root' or '/drives/{driveId}/root'
  basePath: string; // e.g. '/me/drive/root:' or '/drives/{driveId}/root:'
}

async function getPhotoDrivePaths(
  token: string,
  location: StorageLocation
): Promise<PhotoDrivePaths> {
  if (location === 'personal') {
    return { rootPath: '/me/drive/root', basePath: '/me/drive/root:' };
  }

  const driveInfo = await getChannelDriveInfo(token);
  if (!driveInfo) {
    // Fallback to personal
    return { rootPath: '/me/drive/root', basePath: '/me/drive/root:' };
  }

  return {
    rootPath: `/drives/${driveInfo.driveId}/root`,
    basePath: `/drives/${driveInfo.driveId}/root:`,
  };
}

// ── Folder Creation ──────────────────────────────────────────────────────

/**
 * Ensure /VariScout/Photos/{analysisId}/{findingId}/ exists in the target drive.
 * Uses conflictBehavior: 'replace' (idempotent — no-op if folder exists).
 */
async function ensurePhotoFolder(
  token: string,
  analysisId: string,
  findingId: string,
  paths: PhotoDrivePaths
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Create /VariScout (no-op if exists)
  await fetch(`${GRAPH_BASE}${paths.rootPath}/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'VariScout',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });

  // Create /VariScout/Photos
  await fetch(`${GRAPH_BASE}${paths.rootPath}:/VariScout:/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Photos',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });

  // Create /VariScout/Photos/{analysisId}
  await fetch(`${GRAPH_BASE}${paths.rootPath}:/VariScout/Photos:/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: analysisId,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });

  // Create /VariScout/Photos/{analysisId}/{findingId}
  await fetch(
    `${GRAPH_BASE}${paths.rootPath}:/VariScout/Photos/${encodeURIComponent(analysisId)}:/children`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: findingId,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'replace',
      }),
    }
  );
}

// ── Upload ───────────────────────────────────────────────────────────────

/**
 * Upload a photo blob to OneDrive (personal or channel drive).
 *
 * @param blob - The JPEG blob to upload
 * @param filename - Sanitized filename (e.g., "photo_001.jpg")
 * @param analysisId - The project/analysis name
 * @param findingId - The finding this photo belongs to
 * @param location - Storage location ('personal' or 'team')
 * @returns OneDrive driveItemId + webUrl
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
    // Simulate upload in local dev
    console.info(
      `[PhotoUpload] Local dev: simulated upload of ${filename} to /VariScout/Photos/${analysisId}/${findingId}/`
    );
    return { driveItemId: `local-dev-${Date.now()}` };
  }

  const token = await getGraphToken();

  // Resolve drive paths for the target location
  const paths = await getPhotoDrivePaths(token, location);

  // Ensure folder structure exists
  await ensurePhotoFolder(token, analysisId, findingId, paths);

  // Upload file content
  const uploadPath = `/VariScout/Photos/${encodeURIComponent(analysisId)}/${encodeURIComponent(findingId)}/${encodeURIComponent(filename)}`;
  const res = await fetch(`${GRAPH_BASE}${paths.basePath}${uploadPath}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/jpeg',
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
