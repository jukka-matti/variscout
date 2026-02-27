/**
 * Photo upload service — uploads full-resolution photos to OneDrive
 * via Graph API. Uses Teams SSO → OBO for token acquisition, with
 * EasyAuth fallback for Standard plan users.
 *
 * OneDrive path: /VariScout/Photos/{analysisId}/{findingId}/{filename}
 */

import { getAccessToken, isLocalDev, AuthError } from '../auth/easyAuth';
import { getTeamsSsoToken, isInTeams } from '../teams/teamsContext';
import { classifySyncError } from './storage';

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

// ── Folder Creation ──────────────────────────────────────────────────────

/**
 * Ensure /VariScout/Photos/{analysisId}/{findingId}/ exists in OneDrive.
 * Uses conflictBehavior: 'replace' (idempotent — no-op if folder exists).
 */
async function ensurePhotoFolder(
  token: string,
  analysisId: string,
  findingId: string
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Create /VariScout (no-op if exists)
  await fetch(`${GRAPH_BASE}/me/drive/root/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'VariScout',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });

  // Create /VariScout/Photos
  await fetch(`${GRAPH_BASE}/me/drive/root:/VariScout:/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Photos',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });

  // Create /VariScout/Photos/{analysisId}
  await fetch(`${GRAPH_BASE}/me/drive/root:/VariScout/Photos:/children`, {
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
    `${GRAPH_BASE}/me/drive/root:/VariScout/Photos/${encodeURIComponent(analysisId)}:/children`,
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
 * Upload a photo blob to OneDrive.
 *
 * @param blob - The JPEG blob to upload
 * @param filename - Sanitized filename (e.g., "photo_001.jpg")
 * @param analysisId - The project/analysis name
 * @param findingId - The finding this photo belongs to
 * @returns OneDrive driveItemId + webUrl
 */
export async function uploadPhoto(
  blob: Blob,
  filename: string,
  analysisId: string,
  findingId: string
): Promise<PhotoUploadResult> {
  if (isLocalDev()) {
    // Simulate upload in local dev
    console.info(
      `[PhotoUpload] Local dev: simulated upload of ${filename} to /VariScout/Photos/${analysisId}/${findingId}/`
    );
    return { driveItemId: `local-dev-${Date.now()}` };
  }

  const token = await getGraphToken();

  // Ensure folder structure exists
  await ensurePhotoFolder(token, analysisId, findingId);

  // Upload file content
  const uploadPath = `/VariScout/Photos/${encodeURIComponent(analysisId)}/${encodeURIComponent(findingId)}/${encodeURIComponent(filename)}`;
  const res = await fetch(`${GRAPH_BASE}/me/drive/root:${uploadPath}:/content`, {
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
