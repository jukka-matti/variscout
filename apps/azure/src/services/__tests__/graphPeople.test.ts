import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchPeople } from '../graphPeople';

// Mock graphToken
vi.mock('../../auth/graphToken', () => ({
  getGraphToken: vi.fn().mockResolvedValue('mock-token'),
}));

describe('searchPeople', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for empty query', async () => {
    const result = await searchPeople('');
    expect(result).toEqual([]);
  });

  it('returns empty array for whitespace-only query', async () => {
    const result = await searchPeople('   ');
    expect(result).toEqual([]);
  });

  it('calls Graph People API with correct parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          value: [
            {
              id: 'user-1',
              displayName: 'Jane Smith',
              userPrincipalName: 'jane@contoso.com',
            },
            {
              id: 'user-2',
              displayName: 'John Doe',
              userPrincipalName: 'john@contoso.com',
            },
          ],
        }),
    });
    globalThis.fetch = mockFetch;

    const result = await searchPeople('Jane');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('https://graph.microsoft.com/v1.0/me/people');
    expect(url).toContain('Jane'); // search query present
    expect(url).toContain('5'); // top=5 in URL params
    expect(options.headers.Authorization).toBe('Bearer mock-token');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'user-1',
      displayName: 'Jane Smith',
      userPrincipalName: 'jane@contoso.com',
    });
  });

  it('returns empty array on API error', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });

    const result = await searchPeople('test');
    expect(result).toEqual([]);
  });

  it('returns empty array when value is missing from response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await searchPeople('test');
    expect(result).toEqual([]);
  });
});
