import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
vi.mock('../../auth/easyAuth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
}));

// Mock tier + preview
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    hasKnowledgeBase: vi.fn(),
    isPreviewEnabled: vi.fn(),
  };
});

import { isKnowledgeBaseAvailable, searchDocuments } from '../searchService';
import { hasKnowledgeBase, isPreviewEnabled } from '@variscout/core';

const mockHasKnowledgeBase = vi.mocked(hasKnowledgeBase);
const mockIsPreviewEnabled = vi.mocked(isPreviewEnabled);

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all conditions met
    mockHasKnowledgeBase.mockReturnValue(true);
    mockIsPreviewEnabled.mockReturnValue(true);
    // Set env vars
    import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
    import.meta.env.VITE_AI_SEARCH_INDEX = 'findings';
  });

  describe('isKnowledgeBaseAvailable', () => {
    it('returns true when all conditions are met (Team plan + endpoint + preview toggle)', () => {
      mockHasKnowledgeBase.mockReturnValue(true);
      mockIsPreviewEnabled.mockReturnValue(true);
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
      expect(isKnowledgeBaseAvailable()).toBe(true);
    });

    it('returns false when not Team plan', () => {
      mockHasKnowledgeBase.mockReturnValue(false);
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false when no search endpoint', () => {
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = '';
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false when preview toggle is off', () => {
      mockHasKnowledgeBase.mockReturnValue(true);
      mockIsPreviewEnabled.mockReturnValue(false);
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });
  });

  describe('searchDocuments', () => {
    it('returns empty array when not Team plan', async () => {
      mockHasKnowledgeBase.mockReturnValue(false);

      const results = await searchDocuments('test');
      expect(results).toEqual([]);
    });

    it('returns empty array when no endpoint configured', async () => {
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = '';

      const results = await searchDocuments('test');
      expect(results).toEqual([]);
    });

    it('returns empty array when preview toggle is off', async () => {
      mockIsPreviewEnabled.mockReturnValue(false);

      const results = await searchDocuments('nozzle maintenance');
      expect(results).toEqual([]);
    });

    it('calls fetch when all conditions are met', async () => {
      mockHasKnowledgeBase.mockReturnValue(true);
      mockIsPreviewEnabled.mockReturnValue(true);
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: [] }),
      });
      globalThis.fetch = mockFetch;

      const results = await searchDocuments('nozzle maintenance');
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(results).toEqual([]);
    });
  });
});
