/**
 * reportUpload — Upload rendered report documents to SharePoint.
 *
 * Uploads to the same SharePoint folder where .vrs files are saved,
 * reusing the existing storage infrastructure (graphFetch, getApiBase).
 *
 * ADR-026: Reports go alongside .vrs files in the channel's folder.
 * Auth: uses getGraphTokenWithScopes() for Files.ReadWrite.All scope.
 */

import { getGraphTokenWithScopes } from '../auth/graphToken';

// ── Constants ───────────────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const REPORT_SCOPES = ['Files.ReadWrite.All'];

// ── Types ───────────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  exists: boolean;
  driveItemId?: string;
  webUrl?: string;
}

// ── Upload ──────────────────────────────────────────────────────────────

/**
 * Upload a report document to the team's SharePoint folder.
 *
 * Uses the same folder structure as .vrs project files:
 *   /drives/{driveId}/root:/VariScout/Projects/{filename}
 *
 * @param content - The Markdown content of the report
 * @param filename - The report filename (e.g., "VariScout Report — My Project — 2026-03-18.md")
 * @param replaceExisting - If true, replaces an existing file with the same name
 */
export async function uploadReportToSharePoint(
  content: string,
  filename: string,
  replaceExisting = false
): Promise<UploadResult> {
  const token = await getGraphTokenWithScopes(REPORT_SCOPES);

  // Resolve the target folder (same as .vrs storage)
  const apiBase = await getReportApiBase(token);

  // Check if file already exists
  if (!replaceExisting) {
    const exists = await checkFileExists(token, apiBase, filename);
    if (exists) {
      return { success: false, exists: true };
    }
  }

  // Upload the file
  const conflictBehavior = replaceExisting ? 'replace' : 'fail';
  const filePath = `${apiBase}/${encodeURIComponent(filename)}`;

  const response = await fetch(`${GRAPH_BASE}${filePath}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/markdown',
      '@microsoft.graph.conflictBehavior': conflictBehavior,
    },
    body: content,
  });

  if (!response.ok) {
    if (response.status === 409) {
      return { success: false, exists: true };
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Failed to upload report: ${response.status}`);
  }

  const data = await response.json();
  return {
    success: true,
    exists: false,
    driveItemId: data.id,
    webUrl: data.webUrl,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Resolve the API base path for report uploads.
 * Reports go in the same folder as .vrs files: /VariScout/Projects/
 */
async function getReportApiBase(token: string): Promise<string> {
  // Dynamically import to match storage.ts lazy-loading pattern
  const { getChannelDriveInfo } = await import('./channelDrive');
  const driveInfo = await getChannelDriveInfo(token);

  if (driveInfo) {
    return `/drives/${driveInfo.driveId}/root:/VariScout/Projects`;
  }

  // Fallback: personal OneDrive
  return '/me/drive/root:/VariScout/Projects';
}

/**
 * Check if a file with the given name already exists in the target folder.
 */
async function checkFileExists(token: string, apiBase: string, filename: string): Promise<boolean> {
  const filePath = `${apiBase}/${encodeURIComponent(filename)}`;

  try {
    const response = await fetch(`${GRAPH_BASE}${filePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok; // 200 = exists, 404 = not found
  } catch {
    return false;
  }
}
