import { describe, it, expect } from 'vitest';
import { buildAnalyzedCard, buildResolvedCard } from '../adaptiveCards';
import type { Finding } from '@variscout/core';

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

describe('buildAnalyzedCard', () => {
  it('builds a card with finding text and status', () => {
    const { card, mentions } = buildAnalyzedCard(
      makeFinding(),
      undefined,
      'https://app.example.com/finding/f-1'
    );

    expect(card.type).toBe('AdaptiveCard');
    expect(card.version).toBe('1.4');
    const body = card.body as Record<string, unknown>[];
    // Header column set
    const header = body[0] as Record<string, unknown>;
    expect(header.type).toBe('ColumnSet');
    // Deep link action
    const actionSet = body.find((b: Record<string, unknown>) => b.type === 'ActionSet') as Record<
      string,
      unknown
    >;
    expect(actionSet).toBeDefined();
    expect(mentions).toEqual([]);
  });

  it('includes hypothesis text when provided', () => {
    const { card } = buildAnalyzedCard(
      makeFinding(),
      'Worn bearing on head 3',
      'https://app.example.com/finding/f-1'
    );
    const body = card.body as Record<string, unknown>[];
    const causeBlock = body.find(
      (b: Record<string, unknown>) =>
        typeof b.text === 'string' && (b.text as string).includes('Suspected cause')
    );
    expect(causeBlock).toBeDefined();
    expect((causeBlock as Record<string, unknown>).text).toContain('Worn bearing');
  });

  it('includes action items with @mentions for assignees with userId', () => {
    const finding = makeFinding({
      actions: [
        {
          id: 'a-1',
          text: 'Replace gasket',
          assignee: { upn: 'jane@co.com', displayName: 'Jane', userId: 'u-123' },
          dueDate: '2026-04-01',
          createdAt: 1000,
        },
      ],
    });

    const { card, mentions } = buildAnalyzedCard(
      finding,
      undefined,
      'https://app.example.com/finding/f-1'
    );

    expect(mentions).toHaveLength(1);
    expect(mentions[0].mentioned.id).toBe('u-123');
    expect(mentions[0].mentioned.name).toBe('Jane');

    const body = card.body as Record<string, unknown>[];
    const actionBlock = body.find(
      (b: Record<string, unknown>) =>
        typeof b.text === 'string' && (b.text as string).includes('Replace gasket')
    );
    expect(actionBlock).toBeDefined();
    expect((actionBlock as Record<string, unknown>).text).toContain('<at>Jane</at>');
    expect((actionBlock as Record<string, unknown>).text).toContain('due 2026-04-01');
  });

  it('renders assignee display name without @mention when no userId', () => {
    const finding = makeFinding({
      actions: [
        {
          id: 'a-1',
          text: 'Fix',
          assignee: { upn: 'bob@co.com', displayName: 'Bob' },
          createdAt: 1000,
        },
      ],
    });

    const { card, mentions } = buildAnalyzedCard(
      finding,
      undefined,
      'https://app.example.com/finding/f-1'
    );

    expect(mentions).toEqual([]);
    const body = card.body as Record<string, unknown>[];
    const actionBlock = body.find(
      (b: Record<string, unknown>) =>
        typeof b.text === 'string' && (b.text as string).includes('Fix')
    );
    expect((actionBlock as Record<string, unknown>).text).toContain('Bob');
  });

  it('uses "Untitled finding" when text is empty', () => {
    const { card } = buildAnalyzedCard(makeFinding({ text: '' }), undefined, 'https://example.com');

    const body = card.body as Record<string, unknown>[];
    const header = body[0] as Record<string, unknown>;
    const cols = (header as Record<string, unknown[]>).columns as Record<string, unknown>[];
    const items = (cols[0] as Record<string, unknown[]>).items as Record<string, unknown>[];
    expect(items[0].text).toBe('Untitled finding');
  });
});

describe('buildResolvedCard', () => {
  it('builds a card with resolved status and outcome', () => {
    const finding = makeFinding({
      status: 'resolved',
      outcome: { effective: 'yes', cpkAfter: 1.5, notes: 'Improved', verifiedAt: Date.now() },
    });

    const { card, mentions } = buildResolvedCard(finding, 'https://example.com/f-1');

    expect(card.type).toBe('AdaptiveCard');
    expect(mentions).toEqual([]);

    const body = card.body as Record<string, unknown>[];
    const outcomeBlock = body.find(
      (b: Record<string, unknown>) =>
        typeof b.text === 'string' && (b.text as string).includes('Outcome')
    );
    expect(outcomeBlock).toBeDefined();
    expect((outcomeBlock as Record<string, unknown>).text).toContain('Effective');
  });

  it('shows Cpk before→after with delta', () => {
    const finding = makeFinding({
      status: 'resolved',
      context: {
        activeFilters: {},
        cumulativeScope: null,
        stats: { mean: 10, cpk: 0.7, samples: 50 },
      },
      outcome: { effective: 'yes', cpkAfter: 1.5, verifiedAt: Date.now() },
    });

    const { card } = buildResolvedCard(finding, 'https://example.com');
    const body = card.body as Record<string, unknown>[];
    const cpkBlock = body.find(
      (b: Record<string, unknown>) =>
        typeof b.text === 'string' && (b.text as string).includes('Cpk')
    );
    expect(cpkBlock).toBeDefined();
    expect((cpkBlock as Record<string, unknown>).text).toContain('0.70');
    expect((cpkBlock as Record<string, unknown>).text).toContain('1.50');
    expect((cpkBlock as Record<string, unknown>).text).toContain('+0.80');
  });

  it('handles finding without outcome gracefully', () => {
    const finding = makeFinding({ status: 'resolved' });
    const { card } = buildResolvedCard(finding, 'https://example.com');
    const body = card.body as Record<string, unknown>[];
    // Should still have header + action set, but no outcome blocks
    expect(body.length).toBeGreaterThanOrEqual(2);
  });
});
