// src/services/blobClient.ts
// Client-side Blob Storage operations using raw fetch with SAS URLs.
// No Azure SDK on the client — all operations use REST API with SAS tokens.

import type { ProjectMetadata } from '@variscout/core';
import type { Project } from './localDb';

// ── Types ──────────────────────────────────────────────────────────────

interface SasTokenResponse {
  sasUrl: string;
  expiresOn: string;
}

interface CachedSasToken {
  sasUrl: string;
  expiresOn: number; // epoch ms
}

export interface BlobProjectMetadata {
  projectId: string;
  name: string;
  updated: string; // ISO 8601
  createdBy?: string;
  metadata?: ProjectMetadata;
}

// ── SAS token cache ────────────────────────────────────────────────────

const SAS_REFRESH_MARGIN_MS = 5 * 60 * 1000; // Re-fetch when <5 min until expiry

let cachedSas: CachedSasToken | null = null;

/** Reset the SAS cache (for testing). */
export function _resetSasCache(): void {
  cachedSas = null;
}

/**
 * Get a SAS token for Blob Storage operations.
 * Caches the result and re-fetches when <5 min until expiry.
 */
export async function getSasToken(): Promise<string> {
  if (cachedSas && Date.now() < cachedSas.expiresOn - SAS_REFRESH_MARGIN_MS) {
    return cachedSas.sasUrl;
  }

  const res = await fetch('/api/storage-token', { method: 'POST' });

  if (res.status === 401) {
    throw new Error('401 Unauthorized — storage token request failed');
  }
  if (res.status === 503) {
    throw new Error('503 Blob Storage not configured');
  }
  if (!res.ok) {
    throw new Error(`${res.status} Storage token request failed`);
  }

  const data: SasTokenResponse = await res.json();
  cachedSas = {
    sasUrl: data.sasUrl,
    expiresOn: new Date(data.expiresOn).getTime(),
  };

  return cachedSas.sasUrl;
}

// ── URL helper ─────────────────────────────────────────────────────────

/**
 * Build a full blob URL by inserting a blob path into the SAS URL.
 * SAS URL format: `https://account.blob.core.windows.net/container?sig=...`
 * Result: `https://account.blob.core.windows.net/container/blobPath?sig=...`
 */
export function blobUrl(sasUrl: string, blobPath: string): string {
  const qIndex = sasUrl.indexOf('?');
  if (qIndex === -1) {
    return `${sasUrl}/${blobPath}`;
  }
  const base = sasUrl.slice(0, qIndex);
  const query = sasUrl.slice(qIndex);
  return `${base}/${blobPath}${query}`;
}

// ── Blob operations ────────────────────────────────────────────────────

/**
 * Save a project to Blob Storage.
 * Writes two blobs: `{projectId}/analysis.json` and `{projectId}/metadata.json`.
 */
export async function saveBlobProject(
  project: Project,
  projectId: string,
  metadata: BlobProjectMetadata
): Promise<void> {
  const sasUrl = await getSasToken();

  const analysisUrl = blobUrl(sasUrl, `${projectId}/analysis.json`);
  const metadataUrl = blobUrl(sasUrl, `${projectId}/metadata.json`);

  const [analysisRes, metadataRes] = await Promise.all([
    fetch(analysisUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    }),
    fetch(metadataUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }),
  ]);

  if (!analysisRes.ok) {
    throw new Error(`${analysisRes.status} Failed to save analysis blob`);
  }
  if (!metadataRes.ok) {
    throw new Error(`${metadataRes.status} Failed to save metadata blob`);
  }
}

/**
 * Load a project from Blob Storage.
 * Returns null if not found (404).
 */
export async function loadBlobProject(projectId: string): Promise<Project | null> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, `${projectId}/analysis.json`);

  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`${res.status} Failed to load analysis blob`);
  }

  return res.json();
}

/**
 * Load project metadata from Blob Storage.
 * Returns null if not found (404).
 */
export async function loadBlobMetadata(projectId: string): Promise<BlobProjectMetadata | null> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, `${projectId}/metadata.json`);

  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`${res.status} Failed to load metadata blob`);
  }

  return res.json();
}

/**
 * List all projects from the central index blob.
 * Returns empty array if index doesn't exist (404).
 */
export async function listBlobProjects(): Promise<BlobProjectMetadata[]> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, '_index.json');

  const res = await fetch(url);
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`${res.status} Failed to list blob projects`);
  }

  return res.json();
}

/**
 * Update the central project index blob.
 */
export async function updateBlobIndex(projects: BlobProjectMetadata[]): Promise<void> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, '_index.json');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projects),
  });

  if (!res.ok) {
    throw new Error(`${res.status} Failed to update blob index`);
  }
}

/**
 * Save a photo blob for a finding comment.
 */
export async function saveBlobPhoto(
  projectId: string,
  findingId: string,
  photoId: string,
  blob: Blob
): Promise<string> {
  const sasUrl = await getSasToken();
  const path = `${projectId}/photos/${findingId}/${photoId}.jpg`;
  const url = blobUrl(sasUrl, path);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'image/jpeg',
    },
    body: blob,
  });

  if (!res.ok) {
    throw new Error(`${res.status} Failed to save photo blob`);
  }

  // Return the blob URL without SAS query string (for display/reference)
  const qIndex = url.indexOf('?');
  return qIndex === -1 ? url : url.slice(0, qIndex);
}

/**
 * Get the ETag for a project's metadata blob.
 * Returns null if the blob doesn't exist (404).
 */
export async function getEtagForProject(projectId: string): Promise<string | null> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, `${projectId}/metadata.json`);

  const res = await fetch(url, { method: 'HEAD' });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`${res.status} Failed to get ETag for project`);
  }

  return res.headers.get('ETag');
}
