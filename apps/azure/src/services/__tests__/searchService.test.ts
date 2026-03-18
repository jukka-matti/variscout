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
    isTeamAIPlan: vi.fn(),
    isPreviewEnabled: vi.fn(),
  };
});

import { isKnowledgeBaseAvailable, searchRelatedFindings, searchDocuments } from '../searchService';
import { isTeamAIPlan, isPreviewEnabled } from '@variscout/core';

const mockIsTeamAIPlan = vi.mocked(isTeamAIPlan);
const mockIsPreviewEnabled = vi.mocked(isPreviewEnabled);

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all conditions met
    mockIsTeamAIPlan.mockReturnValue(true);
    mockIsPreviewEnabled.mockReturnValue(true);
    // Set env vars
    import.meta.env.VITE_AI_SEARCH_ENDPOINT = 'https://search.example.com';
    import.meta.env.VITE_AI_SEARCH_INDEX = 'findings';
  });

  describe('isKnowledgeBaseAvailable', () => {
    it('returns true when all conditions met', () => {
      expect(isKnowledgeBaseAvailable()).toBe(true);
    });

    it('returns false when not Team AI plan', () => {
      mockIsTeamAIPlan.mockReturnValue(false);
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false when preview not enabled', () => {
      mockIsPreviewEnabled.mockReturnValue(false);
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });

    it('returns false when no search endpoint', () => {
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = '';
      expect(isKnowledgeBaseAvailable()).toBe(false);
    });
  });

  describe('searchRelatedFindings (deprecated — ADR-026)', () => {
    it('returns empty array (deprecated stub)', async () => {
      const results = await searchRelatedFindings('machine variation');
      expect(results).toEqual([]);
    });

    it('does not make HTTP calls', async () => {
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;

      await searchRelatedFindings('test query');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns empty array regardless of options', async () => {
      const results = await searchRelatedFindings('variation', { factor: 'Machine', top: 10 });
      expect(results).toEqual([]);
    });
  });

  describe('searchDocuments', () => {
    const mockDocResponse = {
      response: [
        {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                {
                  title: 'SOP: Nozzle Maintenance',
                  content: 'Clean nozzles every 8 hours',
                  source: 'SOPs',
                  url: 'https://sharepoint.example.com/sop-1',
                  relevance_score: 0.88,
                },
              ]),
            },
          ],
        },
      ],
    };

    it('returns mapped results on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDocResponse),
      });

      const results = await searchDocuments('nozzle maintenance');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        title: 'SOP: Nozzle Maintenance',
        snippet: 'Clean nozzles every 8 hours',
        source: 'SOPs',
        url: 'https://sharepoint.example.com/sop-1',
        relevanceScore: 0.88,
      });
    });

    it('sends correct request to agentic retrieval API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: [] }),
      });
      globalThis.fetch = mockFetch;

      await searchDocuments('test query');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/knowledgebases/variscout-kb/retrieve');
      expect(url).toContain('api-version=2025-11-01-preview');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer mock-token');

      const body = JSON.parse(options.body);
      expect(body.messages).toBeDefined();
      expect(body.messages[0].role).toBe('user');
      expect(body.outputMode).toBe('ExtractedData');
    });

    it('returns empty array when not Team AI plan', async () => {
      mockIsTeamAIPlan.mockReturnValue(false);

      const results = await searchDocuments('test');
      expect(results).toEqual([]);
    });

    it('returns empty array when no endpoint configured', async () => {
      import.meta.env.VITE_AI_SEARCH_ENDPOINT = '';

      const results = await searchDocuments('test');
      expect(results).toEqual([]);
    });

    it('returns empty array on 404 without warning', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const results = await searchDocuments('test');
      expect(results).toEqual([]);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('returns empty array on HTTP error with warning', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const results = await searchDocuments('test');
      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SearchService]'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it('handles raw text (non-JSON) response gracefully', async () => {
      const rawTextResponse = {
        response: [
          {
            content: [
              {
                type: 'text',
                text: 'This is plain text, not JSON',
              },
            ],
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rawTextResponse),
      });

      const results = await searchDocuments('test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Knowledge Base result');
      expect(results[0].snippet).toBe('This is plain text, not JSON');
      expect(results[0].source).toBe('Knowledge Base');
    });
  });
});
