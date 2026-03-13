import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMentionMessageBody, postChannelMention } from '../graphChannelMessage';
import type { Finding, FindingAssignee } from '@variscout/core';

// Mock auth
vi.mock('../../auth/graphToken', () => ({
  getGraphTokenWithScopes: vi.fn().mockResolvedValue('mock-scoped-token'),
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
  status: 'observed',
  comments: [],
  statusChangedAt: Date.now(),
  source: { chart: 'boxplot', category: 'Machine B' },
  ...overrides,
});

const assignee: FindingAssignee = {
  upn: 'jane@contoso.com',
  displayName: 'Jane Smith',
  userId: 'user-abc-123',
};

describe('buildMentionMessageBody', () => {
  it('includes @mention, finding text, stats, and deep link', () => {
    const finding = makeFinding();
    const { body, mentions } = buildMentionMessageBody(
      finding,
      assignee,
      'https://app.variscout.com/?project=test&finding=f-1'
    );

    // @mention tag present
    expect(body).toContain('<at id="0">Jane Smith</at>');
    // Finding text
    expect(body).toContain('Machine B runs hot');
    // Stats
    expect(body).toContain('Cpk 0.7');
    // Deep link
    expect(body).toContain('Open in VariScout');
    expect(body).toContain('href=');

    // Mention entity
    expect(mentions).toHaveLength(1);
    expect(mentions[0].mentioned.user.id).toBe('user-abc-123');
    expect(mentions[0].mentioned.user.displayName).toBe('Jane Smith');
    expect(mentions[0].mentioned.user.userIdentityType).toBe('aadUser');
  });

  it('handles finding without text', () => {
    const finding = makeFinding({ text: '' });
    const { body } = buildMentionMessageBody(finding, assignee, 'https://example.com');

    expect(body).toContain('<at id="0">Jane Smith</at>');
    expect(body).not.toContain('Machine B runs hot');
  });

  it('handles finding without stats', () => {
    const finding = makeFinding({
      context: { activeFilters: {}, cumulativeScope: null },
    });
    const { body } = buildMentionMessageBody(finding, assignee, 'https://example.com');

    expect(body).not.toContain('Cpk');
    expect(body).toContain('Open in VariScout');
  });

  it('escapes HTML in finding text', () => {
    const finding = makeFinding({ text: 'Value <script>alert("xss")</script>' });
    const { body } = buildMentionMessageBody(finding, assignee, 'https://example.com');

    expect(body).not.toContain('<script>');
    expect(body).toContain('&lt;script&gt;');
  });
});

describe('postChannelMention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts a message to the correct channel endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = mockFetch;

    await postChannelMention(
      'team-id-1',
      'channel-id-1',
      makeFinding(),
      assignee,
      'https://app.variscout.com',
      'TestProject'
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/teams/team-id-1/channels/channel-id-1/messages');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer mock-scoped-token');

    const body = JSON.parse(options.body);
    expect(body.body.contentType).toBe('html');
    expect(body.mentions).toHaveLength(1);
  });

  it('throws on API error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    });

    await expect(
      postChannelMention(
        'team-id-1',
        'channel-id-1',
        makeFinding(),
        assignee,
        'https://app.variscout.com',
        'TestProject'
      )
    ).rejects.toThrow('Channel message failed: 403');
  });
});
