import { describe, it, expect } from 'vitest';
import type { GateNode } from '../types';
import { getAt, updateAt, insertHubAsAndChild, removeAt, type GatePath } from '../gateNodeOps';

// ── Fixtures ────────────────────────────────────────────────────────────────

const hub = (id: string): GateNode => ({ kind: 'hub', hubId: id });

const leafTree: GateNode = hub('h1');

const andTree: GateNode = {
  kind: 'and',
  children: [hub('a'), hub('b'), hub('c')],
};

const nestedTree: GateNode = {
  kind: 'and',
  children: [
    hub('h1'),
    {
      kind: 'or',
      children: [hub('h2'), hub('h3')],
    },
    {
      kind: 'not',
      child: hub('h4'),
    },
  ],
};

// ── getAt ────────────────────────────────────────────────────────────────────

describe('getAt', () => {
  it('returns the root when path is empty', () => {
    expect(getAt(leafTree, [])).toEqual(leafTree);
    expect(getAt(andTree, [])).toEqual(andTree);
  });

  it('descends into AND children by numeric index', () => {
    expect(getAt(andTree, [1])).toEqual(hub('b'));
  });

  it('descends into NOT child with literal "child"', () => {
    expect(getAt({ kind: 'not', child: hub('x') }, ['child'])).toEqual(hub('x'));
  });

  it('handles mixed AND/OR/NOT paths', () => {
    expect(getAt(nestedTree, [1, 1])).toEqual(hub('h3'));
    expect(getAt(nestedTree, [2, 'child'])).toEqual(hub('h4'));
  });

  it('returns undefined for out-of-range index', () => {
    expect(getAt(andTree, [5])).toBeUndefined();
  });

  it('returns undefined for non-numeric step on AND/OR', () => {
    expect(getAt(andTree, ['child'])).toBeUndefined();
  });

  it('returns undefined when stepping past a hub leaf', () => {
    expect(getAt(leafTree, [0])).toBeUndefined();
  });

  it('returns undefined for numeric step on NOT', () => {
    expect(getAt({ kind: 'not', child: hub('x') }, [0])).toBeUndefined();
  });
});

// ── updateAt ────────────────────────────────────────────────────────────────

describe('updateAt', () => {
  it('replaces the root when path is empty', () => {
    const next = updateAt(leafTree, [], () => hub('replaced'));
    expect(next).toEqual(hub('replaced'));
  });

  it('replaces an AND child by index', () => {
    const next = updateAt(andTree, [1], () => hub('replaced'));
    expect(next).toEqual({
      kind: 'and',
      children: [hub('a'), hub('replaced'), hub('c')],
    });
  });

  it('preserves sibling references (structural sharing)', () => {
    const next = updateAt(andTree, [1], () => hub('replaced')) as {
      kind: 'and';
      children: GateNode[];
    };
    expect(next.children[0]).toBe(andTree.kind === 'and' ? andTree.children[0] : null);
    expect(next.children[2]).toBe(andTree.kind === 'and' ? andTree.children[2] : null);
  });

  it('replaces a NOT child via "child"', () => {
    const tree: GateNode = { kind: 'not', child: hub('x') };
    const next = updateAt(tree, ['child'], () => hub('y'));
    expect(next).toEqual({ kind: 'not', child: hub('y') });
  });

  it('returns the original tree for an invalid path (out of range)', () => {
    const next = updateAt(andTree, [99], () => hub('nope'));
    expect(next).toBe(andTree);
  });

  it('returns the original tree for an invalid path (wrong step kind)', () => {
    const next = updateAt(andTree, ['child'], () => hub('nope'));
    expect(next).toBe(andTree);
  });

  it('returns the original tree when stepping past a hub leaf', () => {
    const next = updateAt(leafTree, [0], () => hub('nope'));
    expect(next).toBe(leafTree);
  });

  it('round-trips: update back to original value yields equal tree', () => {
    const step1 = updateAt(andTree, [1], () => hub('temp'));
    const step2 = updateAt(step1, [1], () => hub('b'));
    expect(step2).toEqual(andTree);
  });
});

// ── insertHubAsAndChild ────────────────────────────────────────────────────

describe('insertHubAsAndChild', () => {
  it('appends to an existing AND', () => {
    const next = insertHubAsAndChild(andTree, [], 'new');
    expect(next).toEqual({
      kind: 'and',
      children: [hub('a'), hub('b'), hub('c'), hub('new')],
    });
  });

  it('wraps a hub leaf in a new AND', () => {
    const next = insertHubAsAndChild(leafTree, [], 'new');
    expect(next).toEqual({
      kind: 'and',
      children: [hub('h1'), hub('new')],
    });
  });

  it('wraps an OR in a new AND at root', () => {
    const orTree: GateNode = { kind: 'or', children: [hub('a'), hub('b')] };
    const next = insertHubAsAndChild(orTree, [], 'new');
    expect(next).toEqual({
      kind: 'and',
      children: [orTree, hub('new')],
    });
  });

  it('wraps a nested hub leaf at a deep path', () => {
    const next = insertHubAsAndChild(nestedTree, [0], 'new');
    expect(next).toEqual({
      kind: 'and',
      children: [
        {
          kind: 'and',
          children: [hub('h1'), hub('new')],
        },
        {
          kind: 'or',
          children: [hub('h2'), hub('h3')],
        },
        {
          kind: 'not',
          child: hub('h4'),
        },
      ],
    });
  });

  it('returns tree unchanged for invalid path', () => {
    const next = insertHubAsAndChild(andTree, [99], 'new');
    expect(next).toBe(andTree);
  });
});

// ── removeAt ────────────────────────────────────────────────────────────────

describe('removeAt', () => {
  it('returns undefined when removing the root', () => {
    expect(removeAt(leafTree, [])).toBeUndefined();
    expect(removeAt(andTree, [])).toBeUndefined();
  });

  it('removes a middle AND child', () => {
    const next = removeAt(andTree, [1]);
    expect(next).toEqual({
      kind: 'and',
      children: [hub('a'), hub('c')],
    });
  });

  it('collapses AND with 1 remaining child to that child', () => {
    const two: GateNode = { kind: 'and', children: [hub('a'), hub('b')] };
    const next = removeAt(two, [0]);
    expect(next).toEqual(hub('b'));
  });

  it('collapses nested AND with 1 remaining child', () => {
    // nestedTree[0] = hub('h1'); remove hub in OR child at [1, 0] leaves OR[h3], collapses to hub('h3')
    const next = removeAt(nestedTree, [1, 0]);
    expect(next).toEqual({
      kind: 'and',
      children: [
        hub('h1'),
        hub('h3'),
        {
          kind: 'not',
          child: hub('h4'),
        },
      ],
    });
  });

  it('removes NOT child and collapses the NOT itself', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [hub('a'), { kind: 'not', child: hub('b') }],
    };
    const next = removeAt(tree, [1, 'child']);
    // NOT loses its child → collapse NOT (index 1) → AND collapses to hub('a')
    expect(next).toEqual(hub('a'));
  });

  it('returns tree unchanged for invalid path', () => {
    const next = removeAt(andTree, [99]);
    expect(next).toBe(andTree);
  });

  it('collapses empty AND recursively when only child is removed', () => {
    const single: GateNode = { kind: 'and', children: [hub('solo')] };
    // removing the solo child → children.length === 0 → recursively removes parent → root deletion
    const next = removeAt(single, [0]);
    expect(next).toBeUndefined();
  });

  it('preserves AND with >=2 remaining children', () => {
    const four: GateNode = {
      kind: 'and',
      children: [hub('a'), hub('b'), hub('c'), hub('d')],
    };
    const next = removeAt(four, [2]);
    expect(next).toEqual({
      kind: 'and',
      children: [hub('a'), hub('b'), hub('d')],
    });
  });
});

// ── Round-trip / composition ────────────────────────────────────────────────

describe('gateNodeOps round-trips', () => {
  it('insertHubAsAndChild then removeAt restores original (AND append)', () => {
    const inserted = insertHubAsAndChild(andTree, [], 'new');
    // new child was appended at end
    const children = (inserted as { kind: 'and'; children: GateNode[] }).children;
    const lastIdx = children.length - 1;
    const removed = removeAt(inserted, [lastIdx]);
    expect(removed).toEqual(andTree);
  });

  it('getAt after updateAt reflects the mutation', () => {
    const updated = updateAt(andTree, [1], () => hub('changed'));
    const path: GatePath = [1];
    expect(getAt(updated, path)).toEqual(hub('changed'));
  });
});
