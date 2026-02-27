/**
 * Tests for photoUpload service
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock easyAuth before importing
vi.mock('../../auth/easyAuth', () => ({
  isLocalDev: vi.fn(() => false),
  AuthError: class AuthError extends Error {
    code: string;
    constructor(msg: string, code: string) {
      super(msg);
      this.code = code;
    }
  },
}));

// Mock graphToken (shared module)
vi.mock('../../auth/graphToken', () => ({
  getGraphToken: vi.fn(() => Promise.resolve('graph-token-123')),
}));

// Mock storage (classifySyncError)
vi.mock('../storage', () => ({
  classifySyncError: vi.fn((err: Error) => ({
    category: 'unknown',
    retryable: true,
    message: err.message,
  })),
}));

import { uploadPhoto } from '../photoUpload';
import { isLocalDev } from '../../auth/easyAuth';
import { getGraphToken } from '../../auth/graphToken';

describe('uploadPhoto', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isLocalDev).mockReturnValue(false);
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

  it('uses getGraphToken from shared module', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'drive-item-123', webUrl: 'https://...' }),
    });
    globalThis.fetch = mockFetch;

    const blob = new Blob(['test'], { type: 'image/jpeg' });
    await uploadPhoto(blob, 'photo.jpg', 'my-analysis', 'f-abc');

    expect(getGraphToken).toHaveBeenCalled();
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

    // Should have called fetch for folder creation (4 POST) + file upload (1 PUT)
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
