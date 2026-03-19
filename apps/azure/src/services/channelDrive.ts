/**
 * Channel drive resolution — resolves the SharePoint document library
 * for a Teams channel via Graph API.
 *
 * Uses `/teams/{teamId}/channels/{channelId}/filesFolder` to get the
 * channel's DriveItem, then caches the driveId in-memory (session)
 * and IndexedDB (24h TTL) to avoid repeated API calls.
 */

import { getTeamsContext } from '../teams/teamsContext';
import { db } from '../db/schema';
import { graphFetch, GRAPH_BASE } from './graphFetch';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ChannelDriveInfo {
  driveId: string;
  folderId: string;
  folderWebUrl?: string;
}

// Session-level cache (cleared on page reload)
let cachedDriveInfo: ChannelDriveInfo | null = null;
let resolvePromise: Promise<ChannelDriveInfo | null> | null = null;

/**
 * Get the SharePoint drive info for the current Teams channel.
 * Returns null if not in a channel tab or resolution fails.
 * Results are cached in-memory and in IndexedDB (24h TTL).
 */
export async function getChannelDriveInfo(token: string): Promise<ChannelDriveInfo | null> {
  if (cachedDriveInfo) return cachedDriveInfo;
  if (resolvePromise) return resolvePromise;

  const ctx = getTeamsContext();
  if (!ctx.teamId || !ctx.channelId) return null;

  resolvePromise = doResolve(token, ctx.teamId, ctx.channelId);
  const result = await resolvePromise;
  resolvePromise = null;
  return result;
}

async function doResolve(
  token: string,
  teamId: string,
  channelId: string
): Promise<ChannelDriveInfo | null> {
  // 1. Check IndexedDB cache (24h TTL)
  try {
    const cached = await db.channelDriveCache?.get(channelId);
    if (cached) {
      const age = Date.now() - new Date(cached.resolvedAt).getTime();
      if (age < CACHE_TTL_MS) {
        cachedDriveInfo = {
          driveId: cached.driveId,
          folderId: cached.folderId,
          folderWebUrl: cached.folderWebUrl,
        };
        return cachedDriveInfo;
      }
    }
  } catch {
    // IndexedDB read failed — proceed to API
  }

  // 2. Resolve via Graph API
  try {
    const res = await graphFetch(
      `${GRAPH_BASE}/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/filesFolder`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const driveId = data.parentReference?.driveId;
    if (!driveId) return null;

    const info: ChannelDriveInfo = {
      driveId,
      folderId: data.id,
      folderWebUrl: data.webUrl || undefined,
    };

    // 3. Persist to IndexedDB
    try {
      await db.channelDriveCache?.put({
        channelId,
        driveId: info.driveId,
        folderId: info.folderId,
        folderWebUrl: info.folderWebUrl,
        resolvedAt: new Date().toISOString(),
      });
    } catch {
      // IndexedDB write failed — non-critical
    }

    cachedDriveInfo = info;
    return info;
  } catch {
    return null;
  }
}

/** Get the cached channel folder SharePoint URL (if resolved). */
export function getCachedChannelFolderUrl(): string | undefined {
  return cachedDriveInfo?.folderWebUrl;
}

/** Clear all cached channel drive info (session + in-flight) */
export function clearChannelDriveCache(): void {
  cachedDriveInfo = null;
  resolvePromise = null;
}
