import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Teams SDK modules
vi.mock('@microsoft/teams-js', () => ({
  sharing: {
    shareWebContent: vi.fn(),
  },
  pages: {
    shareDeepLink: vi.fn(),
  },
}));

// Mock teams context
vi.mock('../../teams', () => ({
  isInTeams: vi.fn(() => false),
}));

import { useTeamsShare } from '../useTeamsShare';
import { sharing, pages } from '@microsoft/teams-js';
import { isInTeams } from '../../teams';

describe('useTeamsShare', () => {
  const payload = {
    title: 'Test Finding',
    url: 'https://app.example.com/?project=P&finding=f1',
    previewText: '[observed] in P — Cpk 0.8',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isInTeams).mockReturnValue(false);
  });

  describe('share', () => {
    it('copies to clipboard when not in Teams', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      const { result } = renderHook(() => useTeamsShare());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.share(payload);
      });

      expect(success).toBe(true);
      expect(writeText).toHaveBeenCalledWith(payload.url);
      expect(sharing.shareWebContent).not.toHaveBeenCalled();
    });

    it('uses Teams shareWebContent when in Teams', async () => {
      vi.mocked(isInTeams).mockReturnValue(true);
      vi.mocked(sharing.shareWebContent).mockResolvedValue();

      const { result } = renderHook(() => useTeamsShare());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.share(payload);
      });

      expect(success).toBe(true);
      expect(sharing.shareWebContent).toHaveBeenCalledWith({
        content: [
          {
            type: 'URL',
            url: payload.url,
            message: payload.previewText,
            preview: true,
          },
        ],
      });
    });

    it('falls back to clipboard when Teams share fails', async () => {
      vi.mocked(isInTeams).mockReturnValue(true);
      vi.mocked(sharing.shareWebContent).mockRejectedValue(new Error('dismissed'));
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      const { result } = renderHook(() => useTeamsShare());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.share(payload);
      });

      expect(success).toBe(true);
      expect(writeText).toHaveBeenCalledWith(payload.url);
    });

    it('returns false when both Teams share and clipboard fail', async () => {
      vi.mocked(isInTeams).mockReturnValue(true);
      vi.mocked(sharing.shareWebContent).mockRejectedValue(new Error('fail'));
      const writeText = vi.fn().mockRejectedValue(new Error('no clipboard'));
      Object.assign(navigator, { clipboard: { writeText } });

      const { result } = renderHook(() => useTeamsShare());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.share(payload);
      });

      expect(success).toBe(false);
    });
  });

  describe('setDeepLink', () => {
    it('calls pages.shareDeepLink when in Teams', () => {
      vi.mocked(isInTeams).mockReturnValue(true);

      const { result } = renderHook(() => useTeamsShare());
      result.current.setDeepLink('project=P&chart=boxplot', 'My Analysis');

      expect(pages.shareDeepLink).toHaveBeenCalledWith({
        subPageId: 'project=P&chart=boxplot',
        subPageLabel: 'My Analysis',
      });
    });

    it('does not call pages.shareDeepLink when not in Teams', () => {
      vi.mocked(isInTeams).mockReturnValue(false);

      const { result } = renderHook(() => useTeamsShare());
      result.current.setDeepLink('project=P', 'Test');

      expect(pages.shareDeepLink).not.toHaveBeenCalled();
    });

    it('does not throw when pages.shareDeepLink fails', () => {
      vi.mocked(isInTeams).mockReturnValue(true);
      vi.mocked(pages.shareDeepLink).mockImplementation(() => {
        throw new Error('not supported');
      });

      const { result } = renderHook(() => useTeamsShare());

      expect(() => {
        result.current.setDeepLink('project=P', 'Test');
      }).not.toThrow();
    });
  });

  describe('isTeams', () => {
    it('returns false when not in Teams', () => {
      vi.mocked(isInTeams).mockReturnValue(false);
      const { result } = renderHook(() => useTeamsShare());
      expect(result.current.isTeams).toBe(false);
    });

    it('returns true when in Teams', () => {
      vi.mocked(isInTeams).mockReturnValue(true);
      const { result } = renderHook(() => useTeamsShare());
      expect(result.current.isTeams).toBe(true);
    });
  });
});
