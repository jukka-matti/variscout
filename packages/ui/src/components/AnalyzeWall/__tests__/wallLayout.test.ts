/**
 * wallLayout.test.ts — unit tests for the pure Wall position authority.
 *
 * `computeWallLayout` is the single source of truth for hub / finding / factor
 * positions on the Investigation Wall. It must be deterministic (no Date.now /
 * Math.random) so Minimap + both apps' pan-to-node can recompute the SAME
 * positions from the SAME inputs (IM-4c, kills the 3× duplicated layout math).
 *
 * These tests pin the exact pixel formulas lifted out of WallCanvas so the
 * Task-2 refactor preserves every existing WallCanvas pixel test.
 */
import { describe, it, expect } from 'vitest';
import { computeWallLayout, type WallLayoutArgs } from '../wallLayout';
import { CANVAS_W, CANVAS_H } from '../WallCanvas';

const HUB_Y = 400;

function baseArgs(overrides: Partial<WallLayoutArgs> = {}): WallLayoutArgs {
  return {
    hubs: [],
    findings: [],
    factors: [],
    grouping: 'linear',
    canvasW: CANVAS_W,
    canvasH: CANVAS_H,
    ...overrides,
  };
}

describe('computeWallLayout — hub positions (linear)', () => {
  it('places N hubs at canvasW/(N+1)*(i+1), all at hubY=400', () => {
    const args = baseArgs({
      hubs: [
        { id: 'h1', findingIds: [], counterFindingIds: [] },
        { id: 'h2', findingIds: [], counterFindingIds: [] },
        { id: 'h3', findingIds: [], counterFindingIds: [] },
      ],
    });
    const layout = computeWallLayout(args);
    const spacing = CANVAS_W / 4;
    expect(layout.hubPositions.get('h1')?.x).toBeCloseTo(spacing * 1);
    expect(layout.hubPositions.get('h2')?.x).toBeCloseTo(spacing * 2);
    expect(layout.hubPositions.get('h3')?.x).toBeCloseTo(spacing * 3);
    for (const id of ['h1', 'h2', 'h3']) {
      expect(layout.hubPositions.get(id)?.y).toBeCloseTo(HUB_Y);
    }
  });

  it('positions the scope anchor at (canvasW/2, 40)', () => {
    const layout = computeWallLayout(
      baseArgs({ hubs: [{ id: 'h1', findingIds: [], counterFindingIds: [] }] })
    );
    expect(layout.scopeAnchor.x).toBeCloseTo(CANVAS_W / 2);
    expect(layout.scopeAnchor.y).toBeCloseTo(40);
  });
});

describe('computeWallLayout — finding positions + edges', () => {
  it('places supporting findings LEFT (x-130) and counter findings RIGHT (x+130) of their hub', () => {
    const args = baseArgs({
      hubs: [{ id: 'h1', findingIds: ['fs', 'fc'], counterFindingIds: ['fc'] }],
      findings: [{ id: 'fs' }, { id: 'fc' }],
    });
    const layout = computeWallLayout(args);
    const hubX = layout.hubPositions.get('h1')!.x;
    expect(layout.findingPositions.get('fs')!.x).toBeCloseTo(hubX - 130);
    expect(layout.findingPositions.get('fc')!.x).toBeCloseTo(hubX + 130);
  });

  it('emits one support/refute edge per linked finding', () => {
    const args = baseArgs({
      hubs: [{ id: 'h1', findingIds: ['fs', 'fc'], counterFindingIds: ['fc'] }],
      findings: [{ id: 'fs' }, { id: 'fc' }],
    });
    const layout = computeWallLayout(args);
    const support = layout.edges.find(e => e.fromId === 'fs' && e.toId === 'h1');
    const refute = layout.edges.find(e => e.fromId === 'fc' && e.toId === 'h1');
    expect(support?.kind).toBe('support');
    expect(refute?.kind).toBe('refute');
    expect(layout.edges.filter(e => e.kind === 'support' || e.kind === 'refute')).toHaveLength(2);
  });

  it('stacks multiple supporting findings vertically from bandTop with CHIP_GAP', () => {
    const args = baseArgs({
      hubs: [{ id: 'h1', findingIds: ['f1', 'f2'], counterFindingIds: [] }],
      findings: [{ id: 'f1' }, { id: 'f2' }],
    });
    const layout = computeWallLayout(args);
    const y1 = layout.findingPositions.get('f1')!.y;
    const y2 = layout.findingPositions.get('f2')!.y;
    expect(y1).toBeCloseTo(296);
    expect(y2).toBeCloseTo(296 + 52);
  });
});

describe('computeWallLayout — orphan findings', () => {
  it('places a finding linked to no hub in the orphan lane, distinct from any hub column', () => {
    const args = baseArgs({
      hubs: [{ id: 'h1', findingIds: [], counterFindingIds: [] }],
      findings: [{ id: 'orphan-1' }],
    });
    const layout = computeWallLayout(args);
    const pos = layout.findingPositions.get('orphan-1');
    expect(pos).toBeDefined();
    // Orphan lane sits in the left gutter, distinct from the single hub column.
    const hubX = layout.hubPositions.get('h1')!.x;
    expect(pos!.x).not.toBeCloseTo(hubX);
    expect(pos!.x).toBeLessThan(hubX);
  });

  it('marks orphan finding ids and stacks multiple orphans vertically', () => {
    const args = baseArgs({
      hubs: [],
      findings: [{ id: 'o1' }, { id: 'o2' }],
    });
    const layout = computeWallLayout(args);
    expect(layout.orphanFindingIds).toEqual(['o1', 'o2']);
    const y1 = layout.findingPositions.get('o1')!.y;
    const y2 = layout.findingPositions.get('o2')!.y;
    expect(y2).toBeGreaterThan(y1);
    // Both orphans share one x column.
    expect(layout.findingPositions.get('o1')!.x).toBeCloseTo(layout.findingPositions.get('o2')!.x);
  });
});

describe('computeWallLayout — factor band', () => {
  it('places factors in the contributing-factors band ordered by contribution (desc)', () => {
    const args = baseArgs({
      hubs: [{ id: 'h1', findingIds: [], counterFindingIds: [] }],
      factors: [
        { key: 'low', contribution: 0.1 },
        { key: 'high', contribution: 0.9 },
        { key: 'mid', contribution: 0.5 },
      ],
    });
    const layout = computeWallLayout(args);
    const factorY = layout.factorPositions.get('high')!.y;
    // All factors share one band Y.
    expect(layout.factorPositions.get('mid')!.y).toBeCloseTo(factorY);
    expect(layout.factorPositions.get('low')!.y).toBeCloseTo(factorY);
    // Highest contribution sits leftmost (ordered desc).
    expect(layout.factorPositions.get('high')!.x).toBeLessThan(
      layout.factorPositions.get('mid')!.x
    );
    expect(layout.factorPositions.get('mid')!.x).toBeLessThan(layout.factorPositions.get('low')!.x);
  });
});

describe('computeWallLayout — tributary grouping', () => {
  it('partitions hubs into vertical bands; band hub x sits inside its band, not the linear column', () => {
    const args = baseArgs({
      grouping: 'tributary',
      hubs: [
        { id: 'a1', findingIds: [], counterFindingIds: [], groupId: 'g1' },
        { id: 'a2', findingIds: [], counterFindingIds: [], groupId: 'g1' },
        { id: 'b1', findingIds: [], counterFindingIds: [], groupId: 'g2' },
      ],
      groups: [
        { id: 'g1', hubIds: ['a1', 'a2'] },
        { id: 'g2', hubIds: ['b1'] },
      ],
    });
    const layout = computeWallLayout(args);
    // 2 groups → bands of width canvasW/2. Band 0 hubs live in [0, 1000], band 1 in [1000, 2000].
    const bandWidth = CANVAS_W / 2;
    expect(layout.hubPositions.get('a1')!.x).toBeGreaterThan(0);
    expect(layout.hubPositions.get('a1')!.x).toBeLessThan(bandWidth);
    expect(layout.hubPositions.get('a2')!.x).toBeLessThan(bandWidth);
    expect(layout.hubPositions.get('b1')!.x).toBeGreaterThan(bandWidth);
    // Band-0 single-column linear would have put a1 at canvasW/4 ≈ 500; tributary
    // packs 2 hubs into the band so a1 lands at a DIFFERENT x — proves grouping
    // is honored, not the linear duplicate.
    const GROUP_PAD_X = 40;
    const innerX0 = 0 * bandWidth + GROUP_PAD_X;
    const innerW = bandWidth - GROUP_PAD_X * 2;
    const perHub = innerW / (2 + 1);
    expect(layout.hubPositions.get('a1')!.x).toBeCloseTo(innerX0 + perHub * 1);
    expect(layout.hubPositions.get('a2')!.x).toBeCloseTo(innerX0 + perHub * 2);
    expect(layout.hubPositions.get('b1')!.x).toBeCloseTo(
      1 * bandWidth + GROUP_PAD_X + ((bandWidth - GROUP_PAD_X * 2) / (1 + 1)) * 1
    );
  });

  it('falls back to linear when grouping=tributary but no groups are supplied', () => {
    const args = baseArgs({
      grouping: 'tributary',
      hubs: [{ id: 'h1', findingIds: [], counterFindingIds: [] }],
    });
    const layout = computeWallLayout(args);
    expect(layout.hubPositions.get('h1')!.x).toBeCloseTo(CANVAS_W / 2);
  });
});
