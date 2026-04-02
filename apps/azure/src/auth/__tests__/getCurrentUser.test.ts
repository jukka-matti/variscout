/**
 * Tests for getCurrentUser helper (ADR-059 — Teams SSO removed)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock easyAuth before importing
vi.mock('../easyAuth', () => ({
  isLocalDev: vi.fn(() => false),
  getEasyAuthUser: vi.fn(() => Promise.resolve(null)),
}));

import { getCurrentUser } from '../getCurrentUser';
import { isLocalDev, getEasyAuthUser } from '../easyAuth';

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isLocalDev).mockReturnValue(false);
    vi.mocked(getEasyAuthUser).mockResolvedValue(null);
  });

  it('returns mock user in local dev', async () => {
    vi.mocked(isLocalDev).mockReturnValue(true);

    const user = await getCurrentUser();
    expect(user).toEqual({ name: 'Local Developer', email: 'dev@localhost' });
  });

  it('returns EasyAuth user', async () => {
    vi.mocked(getEasyAuthUser).mockResolvedValue({
      name: 'EasyAuth User',
      email: 'easy@contoso.com',
      userId: 'user-123',
      roles: [],
    });

    const user = await getCurrentUser();
    expect(user).toEqual({ name: 'EasyAuth User', email: 'easy@contoso.com' });
  });

  it('returns null when EasyAuth returns null', async () => {
    vi.mocked(getEasyAuthUser).mockResolvedValue(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});
