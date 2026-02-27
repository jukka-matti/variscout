/**
 * Tests for photoUpload service
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock easyAuth before importing
vi.mock('../../auth/easyAuth', () => ({
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

// Mock storage (classifySyncError)
vi.mock('../storage', () => ({
  classifySyncError: vi.fn((err: Error) => ({
    category: 'unknown',
    retryable: true,
    message: err.message,
  })),
}));

import { getGraphToken, uploadPhoto } from '../photoUpload';
import { isLocalDev, getAccessToken } from '../../auth/easyAuth';
import { isInTeams, getTeamsSsoToken } from '../../teams/teamsContext';

describe('getGraphToken', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
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

    // FUNCTION_URL is '' in test environment, so OBO path won't trigger
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
});

describe('uploadPhoto', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isLocalDev).mockReturnValue(false);
    vi.mocked(isInTeams).mockReturnValue(false);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns mock driveItemId in local dev', async () => {
    vi.mocked(isLocalDev).mockReturnValue(true);

    const blob = new Blob(['test'], { type: 'image/jpeg' });
    const result = await uploadPhoto(blob, 'test.jpg', 'analysis-1', 'finding-1');

    expect(result.driveItemId).toMatch(/^local-dev-/);
  });

  it('uploads to correct OneDrive path', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'drive-item-123', webUrl: 'https://...' }),
    });
    globalThis.fetch = mockFetch;

    const blob = new Blob(['test'], { type: 'image/jpeg' });
    const result = await uploadPhoto(blob, 'photo.jpg', 'my-analysis', 'f-abc');

    expect(result.driveItemId).toBe('drive-item-123');

    // Should have called fetch for folder creation (4 POST) + EasyAuth /.auth/me (in getAccessToken) + file upload (1 PUT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const putCalls = mockFetch.mock.calls.filter((call: any[]) => call[1]?.method === 'PUT');
    expect(putCalls.length).toBe(1);
    expect(putCalls[0][0]).toContain('/VariScout/Photos/my-analysis/f-abc/photo.jpg');
  });

  it('throws on upload failure', async () => {
    // All calls succeed except the final PUT upload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFetch = vi.fn().mockImplementation((_url: string, init?: any) => {
      // File upload (PUT) fails
      if (init?.method === 'PUT') {
        return Promise.resolve({ ok: false, status: 403 });
      }
      // Everything else succeeds (folder creation, auth)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    globalThis.fetch = mockFetch;

    const blob = new Blob(['test'], { type: 'image/jpeg' });
    await expect(uploadPhoto(blob, 'photo.jpg', 'analysis', 'finding')).rejects.toThrow();
  });
});
