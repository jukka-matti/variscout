// src/services/cloudSync.ts
// OneDrive/SharePoint sync operations via Microsoft Graph API

import { hasTeamFeatures } from '@variscout/core';
import type { ProjectMetadata } from '@variscout/core';
import { AuthError } from '../auth/easyAuth';
import { getGraphToken } from '../auth/graphToken';
import { errorService } from '@variscout/ui';
import { db } from '../db/schema';
import { graphFetch, GraphError, GRAPH_BASE } from './graphFetch';
import { type Project } from './localDb';

// ── Shared types ────────────────────────────────────────────────────────

export type StorageLocation = 'team' | 'personal';

export interface SyncStatus {
  status: 'saved' | 'offline' | 'syncing' | 'synced' | 'conflict' | 'error';
  message: string;
  pendingChanges?: number;
  lastSynced?: Date;
}

export interface CloudProject {
  id: string;
  name: string;
  modified: string;
  modifiedBy?: string;
  location: StorageLocation;
  etag?: string;
  /** Lightweight project health summary from .meta.json sidecar */
  metadata?: ProjectMetadata;
}

export interface SyncNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  action?: { label: string; onClick: () => void };
  dismissAfter?: number; // ms, undefined = persistent
}

// ── Error Classification ────────────────────────────────────────────────

export type SyncErrorCategory =
  | 'auth'
  | 'forbidden' // 403 — no access to resource (e.g. recipient of a shared link without permissions)
  | 'plan-mismatch' // tried to load a team project without a team plan
  | 'network'
  | 'throttle'
  | 'server'
  | 'not_found'
  | 'unknown';

export interface ClassifiedError {
  category: SyncErrorCategory;
  retryable: boolean;
  message: string;
}

export function classifySyncError(error: unknown): ClassifiedError {
  if (error instanceof AuthError) {
    return { category: 'auth', retryable: false, message: error.message };
  }
  if (error instanceof GraphError) {
    return { category: 'throttle', retryable: true, message: error.message };
  }

  const msg = error instanceof Error ? error.message : String(error);
  const status = extractStatusCode(msg);

  if (status === 401 || /unauthorized/i.test(msg)) {
    return { category: 'auth', retryable: false, message: 'Authentication expired' };
  }
  if (status === 403 || /forbidden/i.test(msg)) {
    return { category: 'forbidden', retryable: false, message: 'Access denied' };
  }
  if (status === 404) {
    return { category: 'not_found', retryable: false, message: 'Resource not found' };
  }
  if (status === 429 || /throttl/i.test(msg)) {
    return { category: 'throttle', retryable: true, message: 'Rate limited, will retry' };
  }
  if (status >= 500 || /server/i.test(msg)) {
    return { category: 'server', retryable: true, message: 'Server error, will retry' };
  }
  if (/network|fetch|timeout|abort/i.test(msg) || !navigator.onLine) {
    return { category: 'network', retryable: true, message: 'Network error, will retry' };
  }

  return { category: 'unknown', retryable: true, message: msg || 'Unknown error' };
}

function extractStatusCode(msg: string): number {
  const match = msg.match(/\b(\d{3})\b/);
  return match ? parseInt(match[1], 10) : 0;
}

// Re-export for consumers that imported from storage.ts
export { GraphError } from './graphFetch';

// ── Internal types ──────────────────────────────────────────────────────

/** Minimal shape returned by Graph API children endpoint */
interface DriveItem {
  id: string;
  name: string;
  lastModifiedDateTime: string;
  lastModifiedBy?: { user?: { displayName?: string } };
  size?: number;
}

interface ApiBase {
  /** Full path to projects folder, e.g. '/me/drive/root:/VariScout/Projects' */
  filePath: string;
  /** Drive root path, e.g. '/me/drive/root' or '/drives/{driveId}/root' */
  rootPath: string;
}

// ── Location-aware API paths ────────────────────────────────────────────

async function getApiBase(token: string, location: StorageLocation): Promise<ApiBase> {
  if (location === 'personal') {
    return {
      filePath: '/me/drive/root:/VariScout/Projects',
      rootPath: '/me/drive/root',
    };
  }

  // 'team': resolve channel SharePoint drive
  const { getChannelDriveInfo } = await import('./channelDrive');
  const driveInfo = await getChannelDriveInfo(token);
  if (!driveInfo) {
    if (import.meta.env.DEV)
      console.warn('[Storage] Channel drive resolution failed, falling back to personal');
    return {
      filePath: '/me/drive/root:/VariScout/Projects',
      rootPath: '/me/drive/root',
    };
  }

  return {
    filePath: `/drives/${driveInfo.driveId}/root:/VariScout/Projects`,
    rootPath: `/drives/${driveInfo.driveId}/root`,
  };
}

// ── Folder auto-creation ────────────────────────────────────────────────

/** Create /VariScout/Projects/ in the target drive if it doesn't exist yet. Idempotent. */
async function ensureFolderExists(token: string, apiBase: ApiBase): Promise<void> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Create /VariScout (no-op if exists)
  await graphFetch(`${GRAPH_BASE}${apiBase.rootPath}/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'VariScout',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });

  // Create /VariScout/Projects (no-op if exists)
  await graphFetch(`${GRAPH_BASE}${apiBase.rootPath}:/VariScout:/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Projects',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });
}

// ── File download / upload (public) ─────────────────────────────────────

/**
 * Download a file from Graph API using drive item metadata.
 * Used by File Picker v8 integration (ADR-030) after user selects a file.
 */
export async function downloadFileFromGraph(
  endpoint: string,
  driveId: string,
  itemId: string
): Promise<File> {
  const token = await getGraphToken();
  const baseUrl = `${endpoint}/drives/${driveId}/items/${itemId}`;

  // Get metadata for filename
  const metaRes = await graphFetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`Failed to get file metadata: ${metaRes.status}`);
  const meta = await metaRes.json();

  // Download content
  const contentRes = await graphFetch(`${baseUrl}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentRes.ok) throw new Error(`Failed to download file: ${contentRes.status}`);
  const blob = await contentRes.blob();

  return new File([blob], meta.name, { type: blob.type });
}

/**
 * Save a file to a specific SharePoint folder via Graph API.
 * Used by "Save As..." feature (ADR-030).
 */
export async function saveToCustomLocation(
  driveId: string,
  folderId: string,
  fileName: string,
  data: string | Blob
): Promise<{ webUrl: string }> {
  const token = await getGraphToken();
  const body = typeof data === 'string' ? new Blob([data], { type: 'application/json' }) : data;
  const endpoint = `${GRAPH_BASE}/drives/${driveId}/items/${folderId}:/${fileName}:/content`;

  const res = await graphFetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': body.type || 'application/octet-stream',
    },
    body,
  });
  if (!res.ok) throw new Error(`Failed to save file: ${res.status}`);
  const result = await res.json();
  return { webUrl: result.webUrl };
}

// ── Cloud CRUD operations ───────────────────────────────────────────────

const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB — Graph simple upload limit

/** Upload a large file (>4MB) via a Graph upload session.
 *  Uses a single PUT chunk, which covers files up to 60MB (all realistic VariScout files). */
async function saveToCloudLargeFile(
  token: string,
  content: string,
  filePath: string
): Promise<{ id: string; etag: string }> {
  // 1. Create an upload session
  const sessionResponse = await graphFetch(`${GRAPH_BASE}${filePath}:/createUploadSession`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        '@microsoft.graph.conflictBehavior': 'replace',
      },
    }),
  });

  if (!sessionResponse.ok) {
    const error = await sessionResponse.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Failed to create upload session: ${sessionResponse.status}`
    );
  }

  const session = await sessionResponse.json();
  const uploadUrl = session.uploadUrl;

  // 2. Upload entire content in a single PUT (works for files up to 60MB)
  const contentBytes = new TextEncoder().encode(content);
  const contentLength = contentBytes.byteLength;

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(contentLength),
      'Content-Range': `bytes 0-${contentLength - 1}/${contentLength}`,
    },
    body: contentBytes,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json().catch(() => ({}));
    throw new Error(error.error?.message || `Upload session failed: ${uploadResponse.status}`);
  }

  const data = await uploadResponse.json();
  return {
    id: data.id,
    etag: data.eTag,
  };
}

export async function saveToCloud(
  token: string,
  project: Project,
  name: string,
  location: StorageLocation
): Promise<{ id: string; etag: string }> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;
  const content = JSON.stringify(project);

  // Use upload session for files larger than 4MB
  if (new TextEncoder().encode(content).byteLength > LARGE_FILE_THRESHOLD) {
    return saveToCloudLargeFile(token, content, `${apiBase.filePath}/${filename}`);
  }

  const response = await graphFetch(`${GRAPH_BASE}${apiBase.filePath}/${filename}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: content,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Failed to save: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    etag: data.eTag,
  };
}

export async function loadFromCloud(
  token: string,
  name: string,
  location: StorageLocation
): Promise<Project | null> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

  const response = await graphFetch(`${GRAPH_BASE}${apiBase.filePath}/${filename}:/content`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load: ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data !== 'object') {
    if (import.meta.env.DEV) console.warn('[Storage] Invalid .vrs data from cloud');
    return null;
  }
  return data;
}

export async function listFromCloud(
  token: string,
  location: StorageLocation
): Promise<CloudProject[]> {
  const apiBase = await getApiBase(token, location);
  const headers = { Authorization: `Bearer ${token}` };

  let url: string | null =
    `${GRAPH_BASE}${apiBase.filePath}:/children?$filter=file ne null&$select=id,name,lastModifiedDateTime,lastModifiedBy,size&$top=200`;
  const allItems: DriveItem[] = [];

  while (url) {
    const response = await graphFetch(url, { headers });

    if (response.status === 404) {
      // Folder doesn't exist yet — create it for future use
      await ensureFolderExists(token, apiBase).catch(err =>
        errorService.logWarning('Failed to create project folder', {
          component: 'storage',
          action: 'ensureFolderExists',
          metadata: { error: err instanceof Error ? err.message : String(err) },
        })
      );
      return [];
    }

    if (!response.ok) {
      errorService.logWarning('Failed to list cloud projects', {
        component: 'storage',
        action: 'listFromCloud',
        metadata: { status: response.status },
      });
      return [];
    }

    const data = await response.json();
    allItems.push(...((data.value || []) as DriveItem[]));

    // Follow @odata.nextLink for pagination
    url = data['@odata.nextLink'] || null;
  }

  // Build a map of .meta.json drive item IDs for quick content fetching
  const metaItemMap = new Map<string, string>();
  for (const item of allItems) {
    if (item.name.endsWith('.meta.json')) {
      // Key by project name (without .meta.json extension)
      metaItemMap.set(item.name.replace('.meta.json', ''), item.id);
    }
  }

  const vrsFiles = allItems.filter(file => file.name.endsWith('.vrs'));
  const projects: CloudProject[] = vrsFiles.map(file => ({
    id: file.id,
    name: file.name.replace('.vrs', ''),
    modified: file.lastModifiedDateTime,
    modifiedBy: file.lastModifiedBy?.user?.displayName,
    location,
  }));

  // Fetch metadata sidecars in parallel (non-blocking)
  if (metaItemMap.size > 0) {
    const metaFetches = projects.map(async proj => {
      const metaId = metaItemMap.get(proj.name);
      if (!metaId) return;
      try {
        const meta = await loadSidecarFromCloud(token, proj.name, location);
        if (meta) proj.metadata = meta;
      } catch {
        // Sidecar fetch failure is non-critical
      }
    });
    await Promise.allSettled(metaFetches);
  }

  return projects;
}

// ── Cloud metadata sidecar operations ────────────────────────────────────

/** Write a .meta.json sidecar alongside the .vrs file. Fire-and-forget — errors are logged, not thrown. */
export async function saveSidecarToCloud(
  token: string,
  meta: ProjectMetadata,
  name: string,
  location: StorageLocation
): Promise<void> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name.replace('.vrs', '.meta.json') : `${name}.meta.json`;
  const content = JSON.stringify(meta);

  const response = await graphFetch(`${GRAPH_BASE}${apiBase.filePath}/${filename}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: content,
  });

  if (!response.ok && import.meta.env.DEV) {
    console.warn('[Storage] Failed to write .meta.json sidecar:', response.status);
  }
}

/** Read a single .meta.json sidecar from cloud. Returns null if not found or on error. */
async function loadSidecarFromCloud(
  token: string,
  name: string,
  location: StorageLocation
): Promise<ProjectMetadata | null> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name.replace('.vrs', '.meta.json') : `${name}.meta.json`;

  const response = await graphFetch(`${GRAPH_BASE}${apiBase.filePath}/${filename}:/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;

  try {
    const data = await response.json();
    if (data && typeof data === 'object' && 'phase' in data) {
      return data as ProjectMetadata;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Conflict detection ──────────────────────────────────────────────────

export async function getCloudModifiedDate(
  token: string,
  name: string,
  location: StorageLocation
): Promise<string | null> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

  try {
    const response = await graphFetch(
      `${GRAPH_BASE}${apiBase.filePath}/${filename}?$select=lastModifiedDateTime`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.lastModifiedDateTime || null;
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[Storage] Failed to check cloud modified date:', e);
    return null;
  }
}

// ── Visit tracking ──────────────────────────────────────────────────────

/**
 * Update the `lastViewedAt[userId]` field in a project's metadata sidecar.
 * Reads existing metadata, patches the timestamp, and writes it back.
 * Non-critical — errors are logged and swallowed.
 */
export async function updateLastViewedAt(
  projectName: string,
  location: StorageLocation,
  userId: string
): Promise<void> {
  try {
    // Update IndexedDB metadata
    const record = await db.projects.get(projectName);
    const existingMeta = record?.meta;
    const updatedLastViewed = { ...existingMeta?.lastViewedAt, [userId]: Date.now() };

    if (record) {
      const newMeta: ProjectMetadata = existingMeta
        ? { ...existingMeta, lastViewedAt: updatedLastViewed }
        : {
            phase: 'frame',
            findingCounts: {},
            hypothesisCounts: {},
            actionCounts: { total: 0, completed: 0, overdue: 0 },
            assignedTaskCount: 0,
            hasOverdueTasks: false,
            lastViewedAt: updatedLastViewed,
          };
      await db.projects.update(projectName, { meta: newMeta });

      // Also update cloud sidecar if online + team features
      if (hasTeamFeatures() && navigator.onLine) {
        try {
          const token = await getGraphToken();
          await saveSidecarToCloud(token, newMeta, projectName, location);
        } catch (e) {
          if (import.meta.env.DEV)
            console.warn('[Storage] Failed to update cloud sidecar lastViewedAt:', e);
        }
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[Storage] Failed to update lastViewedAt:', e);
  }
}

// ── Retry constants (used by StorageProvider) ───────────────────────────

export const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000]; // ms, cap 60s per plan
export const MAX_RETRY_DELAY = 60000;
export const MAX_RETRIES = 5;
