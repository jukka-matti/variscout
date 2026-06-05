/**
 * PO-8b IDB-eviction durability (spec §9.4): navigator.storage.persist()
 * requested on a real save gesture + estimate() surfaced in the Admin status
 * tab. The cloud blob remains the durability source of truth — origin-wide
 * eviction degrades to a re-sync, not data loss — so a denied/absent persist
 * is informational, never an error. Greenfield: feature-detect everything
 * (jsdom and older Safari have no StorageManager; Safari private mode can
 * throw — ADR-075 try/catch precedent).
 */

let persistRequested = false;

export function _resetPersistRequestedForTests(): void {
  persistRequested = false;
}

/**
 * Request persistent storage at most once per session, on a user save
 * gesture (Save As). Returns true/false from the browser, or null when
 * skipped (already requested this session, or API absent).
 */
export async function requestPersistentStorageOnce(): Promise<boolean | null> {
  if (persistRequested) return null;
  persistRequested = true;
  try {
    const storage = navigator.storage;
    if (!storage?.persist) return null;
    if (storage.persisted && (await storage.persisted())) return true;
    return await storage.persist();
  } catch {
    return null;
  }
}

export interface StorageEstimateInfo {
  usageBytes: number | null;
  quotaBytes: number | null;
  persisted: boolean | null;
}

export async function getStorageEstimate(): Promise<StorageEstimateInfo | null> {
  try {
    const storage = navigator.storage;
    if (!storage?.estimate) return null;
    const estimate = await storage.estimate();
    const persisted = storage.persisted ? await storage.persisted() : null;
    return {
      usageBytes: estimate.usage ?? null,
      quotaBytes: estimate.quota ?? null,
      persisted,
    };
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  const mb = bytes / 1024 ** 2;
  if (bytes >= 1024 ** 3 && Number.isFinite(gb)) return `${gb.toFixed(1)} GB`;
  if (bytes >= 1024 ** 2 && Number.isFinite(mb)) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatStorageEstimate(info: StorageEstimateInfo): string {
  const usage = info.usageBytes != null ? formatBytes(info.usageBytes) : 'unknown';
  const quota = info.quotaBytes != null ? formatBytes(info.quotaBytes) : 'unknown';
  const persisted = info.persisted == null ? 'unknown' : info.persisted ? 'yes' : 'no';
  return `Using ${usage} of ${quota} · persistent: ${persisted}`;
}
