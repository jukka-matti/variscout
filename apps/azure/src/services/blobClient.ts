// src/services/blobClient.ts
// Client-side Blob Storage operations using raw fetch with SAS URLs.
// No Azure SDK on the client — all operations use REST API with SAS tokens.

import {
  processHubEvidenceBlobPath,
  processHubEvidenceSnapshotsCatalogPath,
  processHubEvidenceSourceBlobPath,
  processHubEvidenceSourcesCatalogPath,
  sustainmentRecordBlobPath,
  sustainmentReviewBlobPath,
  controlHandoffBlobPath,
  sustainmentCatalogPath,
} from '@variscout/core';
import type {
  ControlHandoff,
  EvidenceSnapshot,
  EvidenceSource,
  ProcessHub,
  ProjectMetadata,
  SustainmentRecord,
  SustainmentReview,
} from '@variscout/core';
import type { Project } from './localDb';

// ── Helpers ───────────────────────────────────────────────────────────

/** Strip SAS query strings from blob URLs to avoid leaking tokens in logs/errors. */
function sanitizeBlobUrl(url: string): string {
  return url.split('?')[0];
}

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
let inflightFetch: Promise<string> | null = null;

/** Reset the SAS cache (for testing). */
export function _resetSasCache(): void {
  cachedSas = null;
  inflightFetch = null;
}

/** Fetch a fresh SAS token from the server and cache it. */
async function fetchAndCacheSasToken(): Promise<string> {
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

/**
 * Get a SAS token for Blob Storage operations.
 * Caches the result and re-fetches when <5 min until expiry.
 * Deduplicates concurrent in-flight requests (C-3).
 */
export async function getSasToken(): Promise<string> {
  if (cachedSas && Date.now() < cachedSas.expiresOn - SAS_REFRESH_MARGIN_MS) {
    return cachedSas.sasUrl;
  }

  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = fetchAndCacheSasToken().finally(() => {
    inflightFetch = null;
  });

  return inflightFetch;
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
 * List Process Hubs from the central catalog blob.
 * Returns empty array if the catalog doesn't exist yet.
 */
export async function listBlobProcessHubs(): Promise<ProcessHub[]> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, '_process_hubs.json');

  const res = await fetch(url);
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`${res.status} Failed to list process hub catalog`);
  }

  return res.json();
}

/**
 * Update the central Process Hub catalog blob.
 */
export async function updateBlobProcessHubs(hubs: ProcessHub[]): Promise<void> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, '_process_hubs.json');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hubs),
  });

  if (!res.ok) {
    throw new Error(`${res.status} Failed to update process hub catalog`);
  }
}

async function putJsonBlob(path: string, value: unknown): Promise<void> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, path);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    throw new Error(`${res.status} Failed to write blob: ${sanitizeBlobUrl(url)}`);
  }
}

async function getJsonBlob<T>(path: string): Promise<T | null> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, path);
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`${res.status} Failed to read blob: ${sanitizeBlobUrl(url)}`);
  }
  return res.json() as Promise<T>;
}

export async function listBlobEvidenceSources(hubId: string): Promise<EvidenceSource[]> {
  return (await getJsonBlob<EvidenceSource[]>(processHubEvidenceSourcesCatalogPath(hubId))) ?? [];
}

export async function saveBlobEvidenceSource(source: EvidenceSource): Promise<void> {
  await putJsonBlob(processHubEvidenceSourceBlobPath(source.hubId, source.id), source);
}

export async function updateBlobEvidenceSources(
  hubId: string,
  sources: EvidenceSource[]
): Promise<void> {
  await putJsonBlob(processHubEvidenceSourcesCatalogPath(hubId), sources);
}

export async function listBlobEvidenceSnapshots(
  hubId: string,
  sourceId: string
): Promise<EvidenceSnapshot[]> {
  return (
    (await getJsonBlob<EvidenceSnapshot[]>(
      processHubEvidenceSnapshotsCatalogPath(hubId, sourceId)
    )) ?? []
  );
}

export async function saveBlobEvidenceSnapshot(
  snapshot: EvidenceSnapshot,
  sourceCsv?: string
): Promise<void> {
  await putJsonBlob(
    processHubEvidenceBlobPath(snapshot.hubId, snapshot.sourceId, snapshot.id, 'snapshot.json'),
    snapshot
  );
  if (sourceCsv !== undefined) {
    const sasUrl = await getSasToken();
    const path = processHubEvidenceBlobPath(
      snapshot.hubId,
      snapshot.sourceId,
      snapshot.id,
      'source.csv'
    );
    const url = blobUrl(sasUrl, path);
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'text/csv',
      },
      body: sourceCsv,
    });
    if (!res.ok) {
      throw new Error(`${res.status} Failed to write evidence source CSV: ${sanitizeBlobUrl(url)}`);
    }
  }
}

export async function updateBlobEvidenceSnapshots(
  hubId: string,
  sourceId: string,
  snapshots: EvidenceSnapshot[]
): Promise<void> {
  await putJsonBlob(processHubEvidenceSnapshotsCatalogPath(hubId, sourceId), snapshots);
}

// ── ETag-conditional snapshot catalog uploader ─────────────────────────────

/**
 * Typed result for `updateBlobEvidenceSnapshotsConditional`.
 *
 * - `{ ok: true; etag }` — write succeeded; `etag` is the new blob ETag.
 * - `{ ok: false; reason: 'concurrency-exhausted' }` — 3× 412 Precondition Failed;
 *   a concurrent writer kept winning. Caller should surface a toast/modal.
 * - `{ ok: false; reason: 'network' }` — fetch threw (no connectivity).
 * - `{ ok: false; reason: 'auth' }` — 401 or 403 from Blob Storage.
 */
export type UpdateBlobConditionalResult =
  | { ok: true; etag: string }
  | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' };

/** Tiny sleep helper — injectable so tests can mock it to be instant. */
function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Write the per-source `_snapshots.json` catalog blob with ETag optimistic
 * concurrency control.
 *
 * Algorithm:
 * 1. HEAD the blob path → read current ETag (null if 404).
 * 2. PUT with `If-Match: <etag>` (omit header on first-time write).
 * 3. On 412 Precondition Failed — another writer raced us. Increment attempt
 *    counter, sleep `backoffMs * 2^attempt` ms, repeat from step 1.
 * 4. After `maxRetries` failed attempts → return `{ ok: false, reason: 'concurrency-exhausted' }`.
 * 5. Auth errors (401/403) → `{ ok: false, reason: 'auth' }`.
 * 6. Network errors (fetch throws) → `{ ok: false, reason: 'network' }`.
 *
 * @param hubId    Hub owning the evidence source.
 * @param sourceId Evidence source whose snapshot catalog is being written.
 * @param catalog  Full updated `EvidenceSnapshot[]` to write.
 * @param options  `maxRetries` (default 3), `backoffMs` (default 100),
 *                 `sleep` (injectable — defaults to `setTimeout`-based).
 */
export async function updateBlobEvidenceSnapshotsConditional(
  hubId: string,
  sourceId: string,
  catalog: EvidenceSnapshot[],
  options?: {
    maxRetries?: number;
    backoffMs?: number;
    sleep?: (ms: number) => Promise<void>;
  }
): Promise<UpdateBlobConditionalResult> {
  const maxRetries = options?.maxRetries ?? 3;
  const backoffMs = options?.backoffMs ?? 100;
  const sleep = options?.sleep ?? defaultSleep;

  const path = processHubEvidenceSnapshotsCatalogPath(hubId, sourceId);

  let attempt = 0;

  while (attempt < maxRetries) {
    let sasUrl: string;
    try {
      sasUrl = await getSasToken();
    } catch {
      return { ok: false, reason: 'network' };
    }

    const url = blobUrl(sasUrl, path);

    // ── Step 1: HEAD → read current ETag ──────────────────────────────────
    let currentEtag: string | null = null;
    try {
      const headRes = await fetch(url, { method: 'HEAD' });
      if (headRes.status === 401 || headRes.status === 403) {
        return { ok: false, reason: 'auth' };
      }
      if (headRes.status !== 404) {
        if (!headRes.ok) {
          return { ok: false, reason: 'network' };
        }
        currentEtag = headRes.headers.get('ETag');
      }
      // 404 → first-time write; currentEtag stays null
    } catch {
      return { ok: false, reason: 'network' };
    }

    // ── Step 2: PUT (with If-Match if we have an ETag) ────────────────────
    const putHeaders: Record<string, string> = {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/json',
    };
    if (currentEtag !== null) {
      putHeaders['If-Match'] = currentEtag;
    }

    let putRes: Response;
    try {
      putRes = await fetch(url, {
        method: 'PUT',
        headers: putHeaders,
        body: JSON.stringify(catalog),
      });
    } catch {
      return { ok: false, reason: 'network' };
    }

    if (putRes.status === 200 || putRes.status === 201 || putRes.status === 204) {
      const newEtag = putRes.headers.get('ETag') ?? '';
      return { ok: true, etag: newEtag };
    }

    if (putRes.status === 401 || putRes.status === 403) {
      return { ok: false, reason: 'auth' };
    }

    if (putRes.status === 412) {
      attempt += 1;
      if (attempt < maxRetries) {
        await sleep(backoffMs * Math.pow(2, attempt - 1));
      }
      continue;
    }

    // Unexpected status — treat as network-level failure
    return { ok: false, reason: 'network' };
  }

  return { ok: false, reason: 'concurrency-exhausted' };
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
  return sanitizeBlobUrl(url);
}

/**
 * Upload arbitrary text content to a blob path.
 * Used by the investigation serializer to write JSONL artifacts for Foundry IQ indexing.
 */
export async function uploadTextBlob(path: string, content: string): Promise<void> {
  const sasUrl = await getSasToken();
  const url = blobUrl(sasUrl, path);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/x-ndjson',
    },
    body: content,
  });

  if (!res.ok) {
    throw new Error(`${res.status} Failed to upload text blob: ${sanitizeBlobUrl(url)}`);
  }
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

// ── Sustainment blobs ─────────────────────────────────────────────────────

export async function listBlobSustainmentRecords(hubId: string): Promise<SustainmentRecord[]> {
  return (await getJsonBlob<SustainmentRecord[]>(sustainmentCatalogPath(hubId))) ?? [];
}

export async function saveBlobSustainmentRecord(record: SustainmentRecord): Promise<void> {
  await putJsonBlob(sustainmentRecordBlobPath(record.hubId, record.id), record);
}

export async function updateBlobSustainmentCatalog(
  hubId: string,
  records: SustainmentRecord[]
): Promise<void> {
  await putJsonBlob(sustainmentCatalogPath(hubId), records);
}

export async function loadBlobSustainmentReview(
  hubId: string,
  recordId: string,
  reviewId: string
): Promise<SustainmentReview | null> {
  return (
    (await getJsonBlob<SustainmentReview>(sustainmentReviewBlobPath(hubId, recordId, reviewId))) ??
    null
  );
}

export async function saveBlobSustainmentReview(review: SustainmentReview): Promise<void> {
  await putJsonBlob(sustainmentReviewBlobPath(review.hubId, review.recordId, review.id), review);
}

export async function saveBlobControlHandoff(handoff: ControlHandoff): Promise<void> {
  await putJsonBlob(controlHandoffBlobPath(handoff.hubId, handoff.id), handoff);
}
