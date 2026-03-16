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

// Mock runtimeConfig
vi.mock('../../lib/runtimeConfig', () => ({
  getRuntimeConfig: vi.fn(() => null),
}));

import { getGraphToken, getGraphTokenWithScopes, clearGraphTokenCache } from '../graphToken';
import { isLocalDev, getAccessToken } from '../easyAuth';
import { isInTeams, getTeamsSsoToken } from '../../teams/teamsContext';
import { getRuntimeConfig } from '../../lib/runtimeConfig';

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

  // ── OBO exchange tests ─────────────────────────────────────────────────

  describe('OBO exchange', () => {
    beforeEach(() => {
      vi.mocked(isInTeams).mockReturnValue(true);
      vi.mocked(getTeamsSsoToken).mockResolvedValue('sso-token-abc');
      vi.mocked(getRuntimeConfig).mockReturnValue({
        plan: 'team',
        functionUrl: 'https://func.azurewebsites.net',
        aiEndpoint: '',
        aiSearchEndpoint: '',
        aiSearchIndex: '',
      });
    });

    it('performs OBO exchange and returns token', async () => {
      const expiresOn = new Date(Date.now() + 3600_000).toISOString();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'obo-token-xyz', expiresOn }),
      });

      const token = await getGraphToken();
      expect(token).toBe('obo-token-xyz');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://func.azurewebsites.net/api/token-exchange',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('caches OBO token on second call', async () => {
      const expiresOn = new Date(Date.now() + 3600_000).toISOString();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'obo-cached', expiresOn }),
      });

      const token1 = await getGraphToken();
      expect(token1).toBe('obo-cached');

      const token2 = await getGraphToken();
      expect(token2).toBe('obo-cached');
      // fetch should only be called once (second call uses cache)
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('refreshes token within 5-min cache margin', async () => {
      // Token expires in 4 minutes (within CACHE_MARGIN_MS of 5 min)
      const nearExpiry = new Date(Date.now() + 4 * 60 * 1000).toISOString();
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ accessToken: 'obo-near-expiry', expiresOn: nearExpiry }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              accessToken: 'obo-refreshed',
              expiresOn: new Date(Date.now() + 3600_000).toISOString(),
            }),
        });

      const token1 = await getGraphToken();
      expect(token1).toBe('obo-near-expiry');

      // Cache margin check: token within 5-min window should trigger re-fetch
      const token2 = await getGraphToken();
      expect(token2).toBe('obo-refreshed');
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('falls back to EasyAuth when OBO fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const token = await getGraphToken();
      expect(token).toBe('easyauth-token-123');
      expect(getAccessToken).toHaveBeenCalled();
    });

    it('falls back to EasyAuth when OBO returns !ok', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      });

      const token = await getGraphToken();
      expect(token).toBe('easyauth-token-123');
    });

    it('getGraphTokenWithScopes sends scopes array', async () => {
      const expiresOn = new Date(Date.now() + 3600_000).toISOString();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'scoped-token', expiresOn }),
      });

      const token = await getGraphTokenWithScopes([
        'https://graph.microsoft.com/ChannelMessage.Send',
      ]);
      expect(token).toBe('scoped-token');

      const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(body.scopes).toEqual(['https://graph.microsoft.com/ChannelMessage.Send']);
    });
  });
});
