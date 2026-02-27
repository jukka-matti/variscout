/**
 * Photo upload service — uploads full-resolution photos to OneDrive
 * via Graph API. Uses Teams SSO → OBO for token acquisition, with
 * EasyAuth fallback for Standard plan users.
 *
 * OneDrive path: /VariScout/Photos/{analysisId}/{findingId}/{filename}
 */

import { getAccessToken, isLocalDev, AuthError } from '../auth/easyAuth';
import { getTeamsSsoToken, isInTeams } from '../teams/teamsContext';
import { classifySyncError, type StorageLocation } from './storage';
import { getChannelDriveInfo } from './channelDrive';

// ── Types ────────────────────────────────────────────────────────────────

export interface PhotoUploadResult {
  driveItemId: string;
  webUrl?: string;
}

// ── Constants ────────────────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL || '';

// ── Token Acquisition ────────────────────────────────────────────────────

/**
 * Get a Graph API access token. Tries Teams SSO → OBO first,
 * falls back to EasyAuth for Standard plan users.
 */
export async function getGraphToken(): Promise<string> {
  if (isLocalDev()) {
    throw new AuthError('Graph API not available locally', 'local_dev');
  }

  // Try Teams SSO → OBO exchange
  if (isInTeams() && FUNCTION_URL) {
    const ssoToken = await getTeamsSsoToken();
    if (ssoToken) {
      try {
        const res = await fetch(`${FUNCTION_URL}/api/token-exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: ssoToken }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) return data.accessToken;
        }
      } catch (err) {
        console.warn('[PhotoUpload] OBO token exchange failed, falling back to EasyAuth:', err);
      }
    }
  }

  // Fallback to EasyAuth
  return getAccessToken();
}

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
