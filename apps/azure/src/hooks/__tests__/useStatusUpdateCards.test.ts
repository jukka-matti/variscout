import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStatusUpdateCards } from '../useStatusUpdateCards';
import type { Finding } from '@variscout/core';

// Mock dependencies
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual<typeof import('@variscout/core')>('@variscout/core');
  return {
    ...actual,
    hasTeamFeatures: vi.fn().mockReturnValue(true),
  };
});

vi.mock('../../teams/teamsContext', () => ({
  isChannelTab: vi.fn().mockReturnValue(true),
  getTeamsContext: vi.fn().mockReturnValue({
    isTeams: true,
    tabType: 'channel',
    teamId: 'team-1',
    channelId: 'chan-1',
    channelName: 'General',
    teamName: 'Test Team',
    userPrincipalName: null,
    theme: null,
    subPageId: null,
  }),
}));

vi.mock('../../services/deepLinks', () => ({
  buildFindingLink: vi.fn().mockReturnValue('https://app.example.com/?finding=f-1'),
}));

vi.mock('../../services/adaptiveCards', () => ({
  buildAnalyzedCard: vi.fn().mockReturnValue({
    card: { type: 'AdaptiveCard', body: [] },
    mentions: [],
  }),
  buildResolvedCard: vi.fn().mockReturnValue({
    card: { type: 'AdaptiveCard', body: [] },
    mentions: [],
  }),
}));

vi.mock('../../services/graphChannelMessage', () => ({
  postStatusUpdateCard: vi.fn().mockResolvedValue(undefined),
}));

const makeFinding = (overrides?: Partial<Finding>): Finding => ({
  id: 'f-1',
  text: 'Machine B runs hot',
  createdAt: Date.now(),
  context: {
    activeFilters: { Machine: ['B'] },
    cumulativeScope: 38,
    stats: { mean: 10.5, cpk: 0.7, samples: 50 },
  },
  status: 'analyzed',
  comments: [],
  statusChangedAt: Date.now(),
  ...overrides,
});

describe('useStatusUpdateCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not post for non-target statuses (observed, investigating, improving)', async () => {
    const { postStatusUpdateCard } = await import('../../services/graphChannelMessage');
    const { result } = renderHook(() => useStatusUpdateCards({}));

    act(() => {
      result.current.onStatusChanged(makeFinding(), 'observed');
      result.current.onStatusChanged(makeFinding(), 'investigating');
      result.current.onStatusChanged(makeFinding(), 'improving');
    });

    expect(postStatusUpdateCard).not.toHaveBeenCalled();
  });

  it('posts a card for analyzed status', async () => {
    const { postStatusUpdateCard } = await import('../../services/graphChannelMessage');
    const { result } = renderHook(() => useStatusUpdateCards({}));

    act(() => {
      result.current.onStatusChanged(makeFinding(), 'analyzed');
    });

    // Allow async postCard to resolve
    await vi.runAllTimersAsync();

    expect(postStatusUpdateCard).toHaveBeenCalledTimes(1);
  });

  it('posts a card for resolved status', async () => {
    const { postStatusUpdateCard } = await import('../../services/graphChannelMessage');
    const { result } = renderHook(() => useStatusUpdateCards({}));

    act(() => {
      result.current.onStatusChanged(makeFinding({ status: 'resolved' }), 'resolved');
    });

    await vi.runAllTimersAsync();

    expect(postStatusUpdateCard).toHaveBeenCalledTimes(1);
  });

  it('debounces duplicate finding+status within 5 seconds', async () => {
    const { postStatusUpdateCard } = await import('../../services/graphChannelMessage');

    // Use real timers for this test since we need Date.now() precision
    vi.useRealTimers();

    const { result } = renderHook(() => useStatusUpdateCards({}));

    act(() => {
      result.current.onStatusChanged(makeFinding(), 'analyzed');
    });

    // Second call with same finding+status should be debounced
    act(() => {
      result.current.onStatusChanged(makeFinding(), 'analyzed');
    });

    // Wait for async
    await new Promise(resolve => setTimeout(resolve, 50));

    // Only one call despite two triggers
    expect(postStatusUpdateCard).toHaveBeenCalledTimes(1);
  });

  it('does not post when not a channel tab', async () => {
    const { isChannelTab } = await import('../../teams/teamsContext');
    (isChannelTab as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const { postStatusUpdateCard } = await import('../../services/graphChannelMessage');
    const { result } = renderHook(() => useStatusUpdateCards({}));

    act(() => {
      result.current.onStatusChanged(makeFinding(), 'analyzed');
    });

    await vi.runAllTimersAsync();

    expect(postStatusUpdateCard).not.toHaveBeenCalled();

    // Restore
    (isChannelTab as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it('does not post when not Team plan', async () => {
    const { hasTeamFeatures } = await import('@variscout/core');
    (hasTeamFeatures as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const { postStatusUpdateCard } = await import('../../services/graphChannelMessage');
    const { result } = renderHook(() => useStatusUpdateCards({}));

    act(() => {
      result.current.onStatusChanged(makeFinding(), 'analyzed');
    });

    await vi.runAllTimersAsync();

    expect(postStatusUpdateCard).not.toHaveBeenCalled();

    // Restore
    (hasTeamFeatures as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it('calls addNotification on success', async () => {
    const addNotification = vi.fn();
    const { result } = renderHook(() => useStatusUpdateCards({ addNotification }));

    act(() => {
      result.current.onStatusChanged(makeFinding(), 'analyzed');
    });

    await vi.runAllTimersAsync();

    expect(addNotification).toHaveBeenCalledWith('Status update posted to channel', 'success');
  });

  it('calls addNotification on error', async () => {
    const { postStatusUpdateCard } = await import('../../services/graphChannelMessage');
    (postStatusUpdateCard as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network'));

    const addNotification = vi.fn();
    const { result } = renderHook(() => useStatusUpdateCards({ addNotification }));

    act(() => {
      result.current.onStatusChanged(makeFinding(), 'analyzed');
    });

    await vi.runAllTimersAsync();

    expect(addNotification).toHaveBeenCalledWith(
      'Failed to post status update to channel',
      'error'
    );
  });
});
