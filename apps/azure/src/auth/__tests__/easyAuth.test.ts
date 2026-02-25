import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getEasyAuthUser,
  getAccessToken,
  isAuthenticated,
  login,
  logout,
  refreshToken,
  AuthError,
} from '../easyAuth';

// -- Helpers ----------------------------------------------------------------

/** Simulate a production hostname (not localhost). */
function setProductionHostname() {
  Object.defineProperty(window, 'location', {
    value: { hostname: 'myapp.azurewebsites.net', href: '', reload: vi.fn() },
    writable: true,
  });
}

/** Simulate localhost. */
function setLocalhostHostname() {
  Object.defineProperty(window, 'location', {
    value: { hostname: 'localhost', href: '', reload: vi.fn() },
    writable: true,
  });
}

/** Build a valid /.auth/me response payload. */
function buildAuthMePayload(overrides?: {
  name?: string;
  email?: string;
  userId?: string;
  accessToken?: string;
  expiresOn?: string;
}) {
  return [
    {
      provider_name: 'aad',
      user_id: overrides?.userId ?? 'user-123',
      user_claims: [
        { typ: 'name', val: overrides?.name ?? 'Jane Doe' },
        {
          typ: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
          val: overrides?.email ?? 'jane@example.com',
        },
      ],
      access_token: overrides?.accessToken ?? 'tok_abc123',
      expires_on: overrides?.expiresOn ?? '2026-03-01T00:00:00Z',
    },
  ];
}

// -- Test Suite --------------------------------------------------------------

describe('easyAuth', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore the real window.location so other tests are not affected.
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  // -- AuthError class -------------------------------------------------------

  describe('AuthError', () => {
    it('has correct name and code', () => {
      const err = new AuthError('test message', 'not_authenticated');
      expect(err.name).toBe('AuthError');
      expect(err.code).toBe('not_authenticated');
      expect(err.message).toBe('test message');
      expect(err).toBeInstanceOf(Error);
    });
  });

  // -- getEasyAuthUser -------------------------------------------------------

  describe('getEasyAuthUser', () => {
    it('returns mock user on localhost', async () => {
      setLocalhostHostname();

      const user = await getEasyAuthUser();

      expect(user).toEqual({
        name: 'Local Developer',
        email: 'dev@localhost',
        userId: 'local-dev',
      });
    });

    it('returns user data from /.auth/me response', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(buildAuthMePayload()),
        })
      );

      const user = await getEasyAuthUser();

      expect(fetch).toHaveBeenCalledWith('/.auth/me');
      expect(user).toEqual({
        name: 'Jane Doe',
        email: 'jane@example.com',
        userId: 'user-123',
      });
    });

    it('returns null when /.auth/me returns empty array', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      const user = await getEasyAuthUser();

      expect(user).toBeNull();
    });

    it('returns null when /.auth/me returns non-ok status', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
        })
      );

      const user = await getEasyAuthUser();

      expect(user).toBeNull();
    });

    it('handles fetch errors gracefully and returns null', async () => {
      setProductionHostname();
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

      const user = await getEasyAuthUser();

      expect(user).toBeNull();
    });

    it('handles malformed response (invalid JSON shape) and returns null', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(null),
        })
      );

      const user = await getEasyAuthUser();

      expect(user).toBeNull();
    });

    it('falls back to "User" name when name claims are missing', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                provider_name: 'aad',
                user_id: 'u-456',
                user_claims: [{ typ: 'preferred_username', val: 'anon@corp.com' }],
                access_token: 'tok',
                expires_on: '2026-03-01T00:00:00Z',
              },
            ]),
        })
      );

      const user = await getEasyAuthUser();

      expect(user).toEqual({
        name: 'User',
        email: 'anon@corp.com',
        userId: 'u-456',
      });
    });
  });

  // -- refreshToken ----------------------------------------------------------

  describe('refreshToken', () => {
    it('does nothing on localhost', async () => {
      setLocalhostHostname();
      await refreshToken(); // should not throw
    });

    it('calls /.auth/refresh in production', async () => {
      setProductionHostname();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

      await refreshToken();

      expect(fetch).toHaveBeenCalledWith('/.auth/refresh');
    });

    it('throws AuthError when refresh fails', async () => {
      setProductionHostname();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

      await expect(refreshToken()).rejects.toThrow(AuthError);
      await expect(refreshToken()).rejects.toThrow('Token refresh failed');
    });
  });

  // -- getAccessToken --------------------------------------------------------

  describe('getAccessToken', () => {
    it('throws AuthError on localhost (Graph API unavailable)', async () => {
      setLocalhostHostname();

      await expect(getAccessToken()).rejects.toThrow(AuthError);
      await expect(getAccessToken()).rejects.toThrow(
        'Graph API is not available in local development'
      );
    });

    it('returns the access token from /.auth/me', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(buildAuthMePayload({ accessToken: 'tok_secret' })),
        })
      );

      const token = await getAccessToken();

      expect(token).toBe('tok_secret');
    });

    it('throws AuthError when /.auth/me returns empty array', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      await expect(getAccessToken()).rejects.toThrow(AuthError);
      await expect(getAccessToken()).rejects.toThrow('No auth provider found');
    });

    it('throws AuthError when access_token field is missing', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                provider_name: 'aad',
                user_id: 'u-1',
                user_claims: [],
                access_token: '',
                expires_on: '2026-03-01T00:00:00Z',
              },
            ]),
        })
      );

      await expect(getAccessToken()).rejects.toThrow(AuthError);
      await expect(getAccessToken()).rejects.toThrow('No access token in EasyAuth response');
    });

    it('proactively refreshes token expiring within 5 minutes', async () => {
      setProductionHostname();

      const nearExpiry = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 min from now
      const fetchMock = vi
        .fn()
        // First /.auth/me — near-expiry token
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(buildAuthMePayload({ accessToken: 'old_tok', expiresOn: nearExpiry })),
        })
        // /.auth/refresh
        .mockResolvedValueOnce({ ok: true })
        // Second /.auth/me — refreshed token
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(buildAuthMePayload({ accessToken: 'new_tok' })),
        });

      vi.stubGlobal('fetch', fetchMock);

      const token = await getAccessToken();

      expect(token).toBe('new_tok');
      expect(fetchMock).toHaveBeenCalledWith('/.auth/refresh');
    });

    it('uses existing token when refresh fails but token not yet expired', async () => {
      setProductionHostname();

      const nearExpiry = new Date(Date.now() + 2 * 60 * 1000).toISOString();
      const fetchMock = vi
        .fn()
        // First /.auth/me
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              buildAuthMePayload({ accessToken: 'existing_tok', expiresOn: nearExpiry })
            ),
        })
        // /.auth/refresh fails
        .mockResolvedValueOnce({ ok: false, status: 500 });

      vi.stubGlobal('fetch', fetchMock);

      const token = await getAccessToken();

      // Should fall back to existing token
      expect(token).toBe('existing_tok');
    });
  });

  // -- isAuthenticated -------------------------------------------------------

  describe('isAuthenticated', () => {
    it('returns true when a user exists', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(buildAuthMePayload()),
        })
      );

      expect(await isAuthenticated()).toBe(true);
    });

    it('returns false when /.auth/me returns empty', async () => {
      setProductionHostname();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      expect(await isAuthenticated()).toBe(false);
    });

    it('returns true on localhost without fetch', async () => {
      setLocalhostHostname();

      expect(await isAuthenticated()).toBe(true);
    });
  });

  // -- login / logout --------------------------------------------------------

  describe('login', () => {
    it('redirects to /.auth/login/aad in production', () => {
      setProductionHostname();

      login();

      expect(window.location.href).toBe('/.auth/login/aad');
    });

    it('reloads the page on localhost', () => {
      setLocalhostHostname();

      login();

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('redirects to /.auth/logout in production', () => {
      setProductionHostname();

      logout();

      expect(window.location.href).toBe('/.auth/logout');
    });

    it('reloads the page on localhost', () => {
      setLocalhostHostname();

      logout();

      expect(window.location.reload).toHaveBeenCalled();
    });
  });
});
