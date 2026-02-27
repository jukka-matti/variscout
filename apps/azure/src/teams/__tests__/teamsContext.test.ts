import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @microsoft/teams-js before importing the module under test
const mockInitialize = vi.fn();
const mockGetContext = vi.fn();
const mockRegisterOnThemeChangeHandler = vi.fn();
const mockNotifySuccess = vi.fn();
const mockGetAuthToken = vi.fn();

vi.mock('@microsoft/teams-js', () => ({
  app: {
    initialize: mockInitialize,
    getContext: mockGetContext,
    registerOnThemeChangeHandler: mockRegisterOnThemeChangeHandler,
    notifySuccess: mockNotifySuccess,
  },
  authentication: {
    getAuthToken: mockGetAuthToken,
  },
}));

describe('teamsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state so each test gets a fresh initPromise
    vi.resetModules();
  });

  async function loadModule() {
    return import('../teamsContext');
  }

  describe('getTeamsContext (before init)', () => {
    it('returns empty context by default', async () => {
      const mod = await loadModule();
      const ctx = mod.getTeamsContext();
      expect(ctx.isTeams).toBe(false);
      expect(ctx.tabType).toBeNull();
      expect(ctx.channelName).toBeNull();
    });
  });

  describe('initTeams', () => {
    it('sets isTeams: false when Teams SDK init fails', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Not in Teams'));

      const mod = await loadModule();
      const ctx = await mod.initTeams();

      expect(ctx.isTeams).toBe(false);
      expect(ctx.tabType).toBeNull();
    });

    it('detects personal tab context', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'variscout-personal', frameContext: 'content' },
        user: { userPrincipalName: 'gary@contoso.com' },
        app: { theme: 'dark', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      const ctx = await mod.initTeams();

      expect(ctx.isTeams).toBe(true);
      expect(ctx.tabType).toBe('personal');
      expect(ctx.channelId).toBeNull();
      expect(ctx.userPrincipalName).toBe('gary@contoso.com');
      expect(ctx.theme).toBe('dark');
    });

    it('detects channel tab context', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'variscout-channel', frameContext: 'content' },
        channel: { id: 'ch-123', displayName: 'Quality' },
        team: { internalId: 'team-456', displayName: 'Factory Floor' },
        user: { userPrincipalName: 'fiona@contoso.com' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      const ctx = await mod.initTeams();

      expect(ctx.isTeams).toBe(true);
      expect(ctx.tabType).toBe('channel');
      expect(ctx.channelName).toBe('Quality');
      expect(ctx.channelId).toBe('ch-123');
      expect(ctx.teamName).toBe('Factory Floor');
      expect(ctx.teamId).toBe('team-456');
    });

    it('caches the result on second call', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      const ctx1 = await mod.initTeams();
      const ctx2 = await mod.initTeams();

      expect(ctx1).toBe(ctx2);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    it('calls notifySuccess on successful init', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      await mod.initTeams();

      expect(mockNotifySuccess).toHaveBeenCalledOnce();
    });

    it('registers theme change handler', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      await mod.initTeams();

      expect(mockRegisterOnThemeChangeHandler).toHaveBeenCalledOnce();
    });
  });

  describe('getTeamsSsoToken', () => {
    it('returns null when not in Teams', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Not in Teams'));

      const mod = await loadModule();
      await mod.initTeams();
      const token = await mod.getTeamsSsoToken();

      expect(token).toBeNull();
    });

    it('returns token when in Teams and SSO succeeds', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });
      mockGetAuthToken.mockResolvedValueOnce('sso-token-123');

      const mod = await loadModule();
      await mod.initTeams();
      const token = await mod.getTeamsSsoToken();

      expect(token).toBe('sso-token-123');
    });

    it('returns null when SSO fails', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });
      mockGetAuthToken.mockRejectedValueOnce(new Error('SSO failed'));

      const mod = await loadModule();
      await mod.initTeams();
      const token = await mod.getTeamsSsoToken();

      expect(token).toBeNull();
    });
  });

  describe('isInTeams / isChannelTab', () => {
    it('isInTeams returns false when not in Teams', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Not in Teams'));

      const mod = await loadModule();
      await mod.initTeams();

      expect(mod.isInTeams()).toBe(false);
    });

    it('isInTeams returns true when in Teams', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      await mod.initTeams();

      expect(mod.isInTeams()).toBe(true);
    });

    it('isChannelTab returns true for channel tabs', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        channel: { id: 'ch-1', displayName: 'General' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      await mod.initTeams();

      expect(mod.isChannelTab()).toBe(true);
    });

    it('isChannelTab returns false for personal tabs', async () => {
      mockInitialize.mockResolvedValueOnce(undefined);
      mockGetContext.mockResolvedValueOnce({
        page: { id: 'test', frameContext: 'content' },
        app: { theme: 'default', host: { name: 'Teams' } },
      });

      const mod = await loadModule();
      await mod.initTeams();

      expect(mod.isChannelTab()).toBe(false);
    });
  });
});
