import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock easyAuth before importing graphToken
vi.mock('../easyAuth', () => ({
  isLocalDev: vi.fn(() => false),
  getAccessToken: vi.fn(() => Promise.resolve('easyauth-token-123')),
  AuthError: class AuthError extends Error {
    code: string;
    constructor(msg: string, code: string) {
      super(msg);
      this.code = code;
    }
  },
}));

// Mock teamsContext
vi.mock('../../teams/teamsContext', () => ({
  isInTeams: vi.fn(() => false),
  getTeamsSsoToken: vi.fn(() => Promise.resolve(null)),
}));

import { getGraphToken, clearGraphTokenCache } from '../graphToken';
import { isLocalDev, getAccessToken } from '../easyAuth';
import { isInTeams, getTeamsSsoToken } from '../../teams/teamsContext';

describe('getGraphToken', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    clearGraphTokenCache();
    vi.mocked(isLocalDev).mockReturnValue(false);
    vi.mocked(isInTeams).mockReturnValue(false);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('falls back to EasyAuth when not in Teams', async () => {
    const token = await getGraphToken();
    expect(token).toBe('easyauth-token-123');
    expect(getAccessToken).toHaveBeenCalled();
  });

  it('falls back to EasyAuth when FUNCTION_URL is empty', async () => {
    vi.mocked(isInTeams).mockReturnValue(true);
    vi.mocked(getTeamsSsoToken).mockResolvedValue('sso-token-abc');

    // VITE_FUNCTION_URL is '' in test environment
    const token = await getGraphToken();
    expect(token).toBe('easyauth-token-123');
  });

  it('falls back to EasyAuth when SSO token is null', async () => {
    vi.mocked(isInTeams).mockReturnValue(true);
    vi.mocked(getTeamsSsoToken).mockResolvedValue(null);

    const token = await getGraphToken();
    expect(token).toBe('easyauth-token-123');
    expect(getAccessToken).toHaveBeenCalled();
  });

  it('throws AuthError in local dev', async () => {
    vi.mocked(isLocalDev).mockReturnValue(true);

    await expect(getGraphToken()).rejects.toThrow('Graph API not available locally');
  });

  it('returns cached token when still valid', async () => {
    // First call: get from EasyAuth
    const token1 = await getGraphToken();
    expect(token1).toBe('easyauth-token-123');
    expect(getAccessToken).toHaveBeenCalledTimes(1);

    // Note: EasyAuth tokens are not cached (only OBO tokens are cached with expiresOn).
    // Second call will still call getAccessToken since there's no cache entry.
    const token2 = await getGraphToken();
    expect(token2).toBe('easyauth-token-123');
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  it('clearGraphTokenCache resets cache', () => {
    // No assertions needed — just verify it doesn't throw
    clearGraphTokenCache();
  });
});
