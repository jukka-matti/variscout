import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { getGraphToken, clearGraphTokenCache } from '../graphToken';
import { isLocalDev, getAccessToken } from '../easyAuth';

describe('getGraphToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGraphTokenCache();
    vi.mocked(isLocalDev).mockReturnValue(false);
  });

  it('returns EasyAuth token', async () => {
    const token = await getGraphToken();
    expect(token).toBe('easyauth-token-123');
    expect(getAccessToken).toHaveBeenCalled();
  });

  it('throws AuthError in local dev', async () => {
    vi.mocked(isLocalDev).mockReturnValue(true);

    await expect(getGraphToken()).rejects.toThrow('Graph API not available locally');
  });

  it('returns cached token on second call', async () => {
    const token1 = await getGraphToken();
    expect(token1).toBe('easyauth-token-123');
    expect(getAccessToken).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const token2 = await getGraphToken();
    expect(token2).toBe('easyauth-token-123');
    expect(getAccessToken).toHaveBeenCalledTimes(1);
  });

  it('clearGraphTokenCache resets cache', async () => {
    // First call — fetches and caches
    await getGraphToken();
    expect(getAccessToken).toHaveBeenCalledTimes(1);

    // Clear cache
    clearGraphTokenCache();

    // Second call — must fetch again
    await getGraphToken();
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });
});
