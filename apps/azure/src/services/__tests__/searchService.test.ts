import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
vi.mock('../../auth/easyAuth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
}));

// Mock preview-flag helper from @variscout/core
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    isPreviewEnabled: vi.fn(),
  };
});

import { isKnowledgeBaseAvailable, searchDocuments } from '../searchService';
import { isPreviewEnabled } from '@variscout/core';

const mockIsPreviewEnabled = vi.mocked(isPreviewEnabled);

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPreviewEnabled.mockReturnValue(true);
    import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
    import.meta.env.VITE_AI_SEARCH_INDEX = 'findings';
  });

  describe('isKnowledgeBaseAvailable', () => {
    it('returns true when search endpoint is configured and preview toggle is on', () => {
      mockIsPreviewEnabled.mockReturnValue(true);
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
      expect(isKnowledgeBaseAvailable()).toBe(true);
    });

    it('returns false when no search endpoint', () => {
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = '';
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false when preview toggle is off', () => {
      mockIsPreviewEnabled.mockReturnValue(false);
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });
  });

  describe('searchDocuments', () => {
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
