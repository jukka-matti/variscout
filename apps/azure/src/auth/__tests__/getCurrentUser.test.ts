/**
 * Tests for getCurrentUser helper
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock easyAuth before importing
vi.mock('../easyAuth', () => ({
  isLocalDev: vi.fn(() => false),
  getEasyAuthUser: vi.fn(() => Promise.resolve(null)),
}));

// Mock teamsContext
vi.mock('../../teams/teamsContext', () => ({
  isInTeams: vi.fn(() => false),
  getTeamsSsoToken: vi.fn(() => Promise.resolve(null)),
  getTeamsContext: vi.fn(() => ({
    isTeams: false,
    tabType: null,
    channelType: null,
    channelName: null,
    channelId: null,
    teamName: null,
    teamId: null,
    userPrincipalName: null,
    theme: null,
  })),
}));

import { getCurrentUser } from '../getCurrentUser';
import { isLocalDev, getEasyAuthUser } from '../easyAuth';
import { isInTeams, getTeamsSsoToken, getTeamsContext } from '../../teams/teamsContext';

/** Create a minimal JWT with name and preferred_username claims */
function createMockJwt(claims: Record<string, string>): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const payload = btoa(JSON.stringify(claims));
  return `${header}.${payload}.sig`;
}

describe('getCurrentUser', () => {
  beforeEach(() => {
    // resetAllMocks clears implementations too (not just call history)
    vi.resetAllMocks();
    // Re-establish default return values
    vi.mocked(isLocalDev).mockReturnValue(false);
    vi.mocked(isInTeams).mockReturnValue(false);
    vi.mocked(getTeamsSsoToken).mockResolvedValue(null);
    vi.mocked(getTeamsContext).mockReturnValue({
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
    vi.mocked(getEasyAuthUser).mockResolvedValue(null);
  });

  it('returns mock user in local dev', async () => {
    vi.mocked(isLocalDev).mockReturnValue(true);

    const user = await getCurrentUser();
    expect(user).toEqual({ name: 'Local Developer', email: 'dev@localhost' });
  });

  it('extracts name from Teams SSO JWT', async () => {
    vi.mocked(isInTeams).mockReturnValue(true);
    vi.mocked(getTeamsSsoToken).mockResolvedValue(
      createMockJwt({ name: 'Jane Doe', preferred_username: 'jane@contoso.com' })
    );

    const user = await getCurrentUser();
    expect(user).toEqual({ name: 'Jane Doe', email: 'jane@contoso.com' });
  });

  it('falls back to Teams context UPN when JWT decode fails', async () => {
    vi.mocked(isInTeams).mockReturnValue(true);
    vi.mocked(getTeamsSsoToken).mockResolvedValue('invalid-jwt');
    vi.mocked(getTeamsContext).mockReturnValue({
      isTeams: true,
      tabType: 'personal',
      channelType: null,
      channelName: null,
      channelId: null,
      teamName: null,
      teamId: null,
      userPrincipalName: 'john@contoso.com',
      theme: null,
      subPageId: null,
    });

    const user = await getCurrentUser();
    expect(user).toEqual({ name: 'john@contoso.com', email: 'john@contoso.com' });
  });

  it('falls back to EasyAuth when not in Teams', async () => {
    vi.mocked(isInTeams).mockReturnValue(false);
    vi.mocked(getEasyAuthUser).mockResolvedValue({
      name: 'EasyAuth User',
      email: 'easy@contoso.com',
      userId: 'user-123',
      roles: [],
    });

    const user = await getCurrentUser();
    expect(user).toEqual({ name: 'EasyAuth User', email: 'easy@contoso.com' });
  });

  it('returns null when no auth method succeeds', async () => {
    vi.mocked(isInTeams).mockReturnValue(false);
    vi.mocked(getEasyAuthUser).mockResolvedValue(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('handles Teams SSO token returning null', async () => {
    vi.mocked(isInTeams).mockReturnValue(true);
    vi.mocked(getTeamsSsoToken).mockResolvedValue(null);
    vi.mocked(getTeamsContext).mockReturnValue({
      isTeams: true,
      tabType: 'personal',
      channelType: null,
      channelName: null,
      channelId: null,
      teamName: null,
      teamId: null,
      userPrincipalName: null,
      theme: null,
      subPageId: null,
    });
    vi.mocked(getEasyAuthUser).mockResolvedValue({
      name: 'Fallback User',
      email: 'fallback@contoso.com',
      userId: 'u-1',
      roles: [],
    });

    const user = await getCurrentUser();
    expect(user).toEqual({ name: 'Fallback User', email: 'fallback@contoso.com' });
  });
});
