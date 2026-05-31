/**
 * wallFocus.test.ts — the Focus-lens degree-of-interest math (IM-4c Task 5).
 *
 * Pure, deterministic. `wallDegreeOfInterest` is undirected BFS graph-distance
 * over the WallLayout edges (finding/factor ↔ hub tethers); `focusOpacity` maps
 * the distance to an opacity tier. Focus lens is dimming ONLY — it never touches
 * CanvasLevel / LOD (spec §9).
 */
import { describe, it, expect } from 'vitest';
import { wallDegreeOfInterest, focusOpacity } from '../wallFocus';
import type { WallEdge } from '../wallLayout';

// h1 ── f1 (support), h1 ── f2 (refute); h2 is an unrelated sibling with f3.
const edges: WallEdge[] = [
  { fromId: 'f1', toId: 'h1', kind: 'support' },
  { fromId: 'f2', toId: 'h1', kind: 'refute' },
  { fromId: 'f3', toId: 'h2', kind: 'support' },
];

describe('wallDegreeOfInterest', () => {
  it('returns 0 for the focused entity itself', () => {
    expect(wallDegreeOfInterest('h1', 'h1', edges)).toBe(0);
  });

  it('returns 1 for an entity sharing an edge with the focused hub', () => {
    expect(wallDegreeOfInterest('h1', 'f1', edges)).toBe(1);
    expect(wallDegreeOfInterest('h1', 'f2', edges)).toBe(1);
  });

  it('returns >=2 for an unrelated sibling and its findings', () => {
    expect(wallDegreeOfInterest('h1', 'h2', edges)).toBeGreaterThanOrEqual(2);
    expect(wallDegreeOfInterest('h1', 'f3', edges)).toBeGreaterThanOrEqual(2);
  });

  it('treats edges as undirected (finding → its hub → sibling findings)', () => {
    // From f1: f1(0) → h1(1) → f2(2). f2 is 2 hops from f1.
    expect(wallDegreeOfInterest('f1', 'f2', edges)).toBe(2);
  });

  it('returns Infinity-tier (a large distance) for a node not in any edge', () => {
    // A disconnected entity is maximally distant.
    expect(wallDegreeOfInterest('h1', 'unconnected', edges)).toBeGreaterThanOrEqual(2);
  });

  it('returns 0 for every entity when nothing is focused (null) — no dimming', () => {
    expect(wallDegreeOfInterest(null, 'h1', edges)).toBe(0);
    expect(wallDegreeOfInterest(null, 'f3', edges)).toBe(0);
  });
});

describe('focusOpacity', () => {
  it('is vivid (1) for the focused entity (doi 0)', () => {
    expect(focusOpacity(0)).toBeCloseTo(1);
  });

  it('is a mid tier for adjacent entities (doi 1), dimmer than focused', () => {
    expect(focusOpacity(1)).toBeLessThan(1);
    expect(focusOpacity(1)).toBeGreaterThan(focusOpacity(2));
  });

  it('is the dim floor for distant entities (doi >= 2), and never below the floor', () => {
    const dim = focusOpacity(2);
    expect(dim).toBeLessThan(focusOpacity(1));
    expect(focusOpacity(5)).toBeCloseTo(dim);
    expect(dim).toBeGreaterThan(0);
  });
});
