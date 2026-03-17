import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted mocks
const { mockTeamsContext, mockChannelDriveCache } = vi.hoisted(() => ({
  mockTeamsContext: {
    isTeams: true,
    tabType: 'channel' as const,
    channelName: 'General',
    channelId: 'channel-123',
    teamName: 'QA Team',
    teamId: 'team-456',
    userPrincipalName: null,
    theme: null,
  },
  mockChannelDriveCache: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../teams/teamsContext', () => ({
  getTeamsContext: vi.fn(() => mockTeamsContext),
}));

vi.mock('../../db/schema', () => ({
  db: {
    channelDriveCache: mockChannelDriveCache,
  },
}));

import { getChannelDriveInfo, clearChannelDriveCache } from '../channelDrive';

describe('getChannelDriveInfo', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    clearChannelDriveCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('resolves channel drive via Graph API', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'folder-789',
          parentReference: { driveId: 'drive-abc' },
        }),
    });

    const result = await getChannelDriveInfo('token-123');

    expect(result).toEqual({
      driveId: 'drive-abc',
      folderId: 'folder-789',
    });

    // Should have called Graph API
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/teams/team-456/channels/channel-123/filesFolder'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-123' },
      })
    );

    // Should persist to IndexedDB
    expect(mockChannelDriveCache.put).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: 'channel-123',
        driveId: 'drive-abc',
        folderId: 'folder-789',
      })
    );
  });

  it('returns cached result from IndexedDB (within TTL)', async () => {
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    mockChannelDriveCache.get.mockResolvedValueOnce({
      channelId: 'channel-123',
      driveId: 'cached-drive',
      folderId: 'cached-folder',
      resolvedAt: new Date().toISOString(), // recent — within TTL
    });

    const result = await getChannelDriveInfo('token-123');

    expect(result).toEqual({
      driveId: 'cached-drive',
      folderId: 'cached-folder',
    });

    // Should NOT call Graph API
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('ignores expired IndexedDB cache (>24h)', async () => {
    const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    mockChannelDriveCache.get.mockResolvedValueOnce({
      channelId: 'channel-123',
      driveId: 'old-drive',
      folderId: 'old-folder',
      resolvedAt: expiredDate,
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'new-folder',
          parentReference: { driveId: 'new-drive' },
        }),
    });

    const result = await getChannelDriveInfo('token-123');

    expect(result).toEqual({
      driveId: 'new-drive',
      folderId: 'new-folder',
    });
  });

  it('returns null if not in a Teams channel', async () => {
    const { getTeamsContext } = await import('../../teams/teamsContext');
    vi.mocked(getTeamsContext).mockReturnValueOnce({
      isTeams: false,
      tabType: null,
      channelType: null,
      channelName: null,
      channelId: null,
      teamName: null,
      teamId: null,
      userPrincipalName: null,
      theme: null,
      subPageId: null,
    });

    const result = await getChannelDriveInfo('token-123');
    expect(result).toBeNull();
  });

  it('returns null on Graph API error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    const result = await getChannelDriveInfo('token-123');
    expect(result).toBeNull();
  });

  it('returns session-cached result on subsequent calls', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'folder-789',
          parentReference: { driveId: 'drive-abc' },
        }),
    });

    const result1 = await getChannelDriveInfo('token-123');
    const result2 = await getChannelDriveInfo('token-123');

    expect(result1).toEqual(result2);
    // Only one API call
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('clearChannelDriveCache resets session cache', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'folder-789',
          parentReference: { driveId: 'drive-abc' },
        }),
    });

    await getChannelDriveInfo('token-123');
    clearChannelDriveCache();
    await getChannelDriveInfo('token-123');

    // Two API calls after cache clear
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
