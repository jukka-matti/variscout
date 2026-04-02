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
    it('returns false — Knowledge Base disabled pending Blob Storage migration (ADR-059)', () => {
      // KNOWLEDGE_BASE_ENABLED = false gates all availability checks
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false even when all other conditions are met', () => {
      mockHasKnowledgeBase.mockReturnValue(true);
      mockIsPreviewEnabled.mockReturnValue(true);
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
      // Still false because KNOWLEDGE_BASE_ENABLED = false
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false when not Team plan', () => {
      mockHasKnowledgeBase.mockReturnValue(false);
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false when no search endpoint', () => {
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = '';
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });
  });

  describe('searchDocuments', () => {
    it('returns empty array immediately — Knowledge Base disabled (ADR-059)', async () => {
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;

      const results = await searchDocuments('nozzle maintenance');

      // KNOWLEDGE_BASE_ENABLED = false short-circuits before any fetch
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

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

    it('returns empty array without network calls regardless of conditions (ADR-059)', async () => {
      // Even with all conditions met, KNOWLEDGE_BASE_ENABLED = false prevents any fetch
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;

      const results = await searchDocuments('test');
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
