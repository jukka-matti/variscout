import { describe, expect, it } from 'vitest';
import type { Finding } from '../findings/types';
import type { ProcessStateItem } from '../processState';
import { linkFindingsToStateItems, RELEVANT_FINDING_STATUSES } from '../processEvidence';

const baseItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Item label',
  ...overrides,
});

const baseFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: `finding-${Math.floor(Math.random() * 1e9)}`,
  text: 'A finding',
  createdAt: 1714000000000,
  context: {} as Finding['context'],
  status: 'analyzed',
  comments: [],
  statusChangedAt: 1714000000000,
  ...overrides,
});

describe('RELEVANT_FINDING_STATUSES', () => {
  it('includes analyzed, improving, resolved', () => {
    expect(RELEVANT_FINDING_STATUSES.has('analyzed')).toBe(true);
    expect(RELEVANT_FINDING_STATUSES.has('improving')).toBe(true);
    expect(RELEVANT_FINDING_STATUSES.has('resolved')).toBe(true);
  });

  it('excludes observed and investigating', () => {
    expect(RELEVANT_FINDING_STATUSES.has('observed')).toBe(false);
    expect(RELEVANT_FINDING_STATUSES.has('investigating')).toBe(false);
  });
});

describe('linkFindingsToStateItems', () => {
  it('returns an empty result when there are no items', () => {
    const result = linkFindingsToStateItems([], new Map(), () => []);
    expect(result.byItemId.size).toBe(0);
    expect(result.totalLinked).toBe(0);
    expect(result.unlinkedItemIds).toEqual([]);
  });

  it('returns an empty mapping per item when findingsByInvestigationId is empty', () => {
    const items = [baseItem({ id: 'item-a' }), baseItem({ id: 'item-b' })];
    const result = linkFindingsToStateItems(items, new Map(), () => ['inv-1']);
    expect(result.byItemId.get('item-a')).toEqual([]);
    expect(result.byItemId.get('item-b')).toEqual([]);
    expect(result.totalLinked).toBe(0);
    expect(result.unlinkedItemIds).toEqual(['item-a', 'item-b']);
  });

  it('matches findings by resolver-returned investigation IDs', () => {
    const findings = new Map([
      ['inv-1', [baseFinding({ id: 'f-1' }), baseFinding({ id: 'f-2' })]],
      ['inv-2', [baseFinding({ id: 'f-3' })]],
    ]);
    const items = [baseItem({ id: 'item-x' }), baseItem({ id: 'item-y' })];
    const result = linkFindingsToStateItems(items, findings, item =>
      item.id === 'item-x' ? ['inv-1'] : ['inv-2']
    );
    expect(result.byItemId.get('item-x')).toHaveLength(2);
    expect(result.byItemId.get('item-y')).toHaveLength(1);
    expect(result.totalLinked).toBe(3);
    expect(result.unlinkedItemIds).toEqual([]);
  });

  it('filters findings outside RELEVANT_FINDING_STATUSES', () => {
    const findings = new Map([
      [
        'inv-1',
        [
          baseFinding({ id: 'analyzed', status: 'analyzed' }),
          baseFinding({ id: 'observed', status: 'observed' }),
          baseFinding({ id: 'investigating', status: 'investigating' }),
          baseFinding({ id: 'resolved', status: 'resolved' }),
        ],
      ],
    ]);
    const result = linkFindingsToStateItems([baseItem()], findings, () => ['inv-1']);
    const linked = result.byItemId.get('item-1') ?? [];
    expect(linked.map(f => f.id)).toEqual(['analyzed', 'resolved']);
  });

  it('aggregates findings across multiple investigation IDs returned by resolver', () => {
    const findings = new Map([
      ['inv-1', [baseFinding({ id: 'f-1' })]],
      ['inv-2', [baseFinding({ id: 'f-2' }), baseFinding({ id: 'f-3' })]],
      ['inv-3', [baseFinding({ id: 'f-4' })]],
    ]);
    const result = linkFindingsToStateItems([baseItem({ id: 'agg' })], findings, () => [
      'inv-1',
      'inv-2',
      'inv-3',
    ]);
    expect(result.byItemId.get('agg')).toHaveLength(4);
  });

  it('deduplicates investigation IDs returned by resolver', () => {
    const findings = new Map([['inv-1', [baseFinding()]]]);
    const result = linkFindingsToStateItems([baseItem()], findings, () => [
      'inv-1',
      'inv-1',
      'inv-1',
    ]);
    expect(result.byItemId.get('item-1')).toHaveLength(1);
  });

  it('treats undefined resolver return as empty array', () => {
    const findings = new Map([['inv-1', [baseFinding()]]]);
    const result = linkFindingsToStateItems(
      [baseItem()],
      findings,

      () => undefined as unknown as string[]
    );
    expect(result.byItemId.get('item-1')).toEqual([]);
    expect(result.unlinkedItemIds).toEqual(['item-1']);
  });

  it('collects unlinkedItemIds for items with zero matched findings', () => {
    const findings = new Map([['inv-1', [baseFinding()]]]);
    const result = linkFindingsToStateItems(
      [baseItem({ id: 'matched' }), baseItem({ id: 'no-match' })],
      findings,
      item => (item.id === 'matched' ? ['inv-1'] : ['inv-other'])
    );
    expect(result.unlinkedItemIds).toEqual(['no-match']);
    expect(result.totalLinked).toBe(1);
  });
});
