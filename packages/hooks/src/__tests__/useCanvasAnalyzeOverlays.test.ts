import { describe, expect, it } from 'vitest';
import type { CausalLink, Finding, Hypothesis } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import {
  CANVAS_OVERLAY_REGISTRY,
  buildCanvasAnalyzeOverlays,
  coerceCanvasOverlays,
  enabledCanvasOverlays,
  type CanvasOverlayId,
} from '../useCanvasAnalyzeOverlays';

const map: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'mix', name: 'Mix', order: 0 },
    { id: 'fill', name: 'Fill', order: 1 },
    { id: 'pack', name: 'Pack', order: 2 },
  ],
  tributaries: [
    { id: 'trib-machine', stepId: 'mix', column: 'Machine', role: 'machine' },
    { id: 'trib-fill-head', stepId: 'fill', column: 'Fill Head', role: 'machine' },
  ],
  assignments: {
    Temperature: 'mix',
    Defect: 'pack',
  },
  createdAt: '2026-05-05T00:00:00.000Z',
  updatedAt: '2026-05-05T00:00:00.000Z',
};

function finding(overrides: Partial<Finding> & { id: string }): Finding {
  const { id } = overrides;
  return {
    text: `Finding ${id}`,
    createdAt: 1,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    ...overrides,
  };
}

function hub(overrides: Partial<Hypothesis> & { id: string }): Hypothesis {
  const { id } = overrides;
  return {
    name: `Hub ${id}`,
    synthesis: 'Evidence connects here.',
    findingIds: [],
    status: 'proposed',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    ...overrides,
  };
}

function link(overrides: Partial<CausalLink> & { id: string }): CausalLink {
  return {
    fromFactor: 'Machine',
    toFactor: 'Fill Head',
    whyStatement: 'Machine drives fill head behavior',
    direction: 'drives',
    evidenceType: 'unvalidated',
    findingIds: [],
    source: 'analyst',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

describe('canvas overlay registry', () => {
  it('exposes enabled overlays and coerces unknown ids out', () => {
    expect(enabledCanvasOverlays().map(overlay => overlay.id)).toEqual([
      'investigations',
      'hypotheses',
      'hypothesis-hubs',
      'findings',
      'wall',
    ]);
    expect(CANVAS_OVERLAY_REGISTRY.findings.enabled).toBe(true);
    expect(coerceCanvasOverlays(['findings', 'unknown', 'findings'])).toEqual(['findings']);
  });
});

describe('CanvasOverlayId — wall overlay', () => {
  it('registry includes a wall entry with overlay-appropriate label/description', () => {
    expect(CANVAS_OVERLAY_REGISTRY.wall).toBeDefined();
    expect(CANVAS_OVERLAY_REGISTRY.wall.id).toBe('wall');
    expect(CANVAS_OVERLAY_REGISTRY.wall.enabled).toBe(true);
    expect(CANVAS_OVERLAY_REGISTRY.wall.label.length).toBeGreaterThan(0);
  });

  it('enabledCanvasOverlays exposes wall', () => {
    const ids = enabledCanvasOverlays().map(o => o.id);
    expect(ids).toContain('wall');
  });

  it('coerceCanvasOverlays preserves wall through a round-trip', () => {
    const input: unknown[] = ['wall', 'hypotheses'];
    expect(coerceCanvasOverlays(input)).toEqual<CanvasOverlayId[]>(['wall', 'hypotheses']);
  });

  it('coerceCanvasOverlays deduplicates wall', () => {
    expect(coerceCanvasOverlays(['wall', 'wall'])).toEqual<CanvasOverlayId[]>(['wall']);
  });
});

describe('buildCanvasAnalyzeOverlays', () => {
  it('binds findings through active filters and populates step overlay', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [
        finding({
          id: 'f-defect',
          context: { activeFilters: { Defect: ['Scratch'] }, cumulativeScope: 10 },
          evidenceType: 'data',
        }),
      ],
    });

    expect(overlays.byStep.pack.findings.map(item => item.id)).toEqual(['f-defect']);
    expect(overlays.unresolved.findings).toEqual([]);
  });

  it('binds findings through linked hub findingIds when active filters do not resolve', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [finding({ id: 'f-linked' })],
      hypotheses: [
        hub({ id: 'hub-fill', tributaryIds: ['trib-fill-head'], findingIds: ['f-linked'] }),
      ],
    });

    expect(overlays.byStep.fill.findings.map(item => item.id)).toEqual(['f-linked']);
  });

  it('projects hypotheses from explicit tributary ids', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      hypotheses: [
        hub({
          id: 'hub-explicit',
          status: 'confirmed',
          tributaryIds: ['trib-fill-head'],
        }),
      ],
    });

    expect(overlays.byStep.fill.hypotheses).toEqual([
      expect.objectContaining({ id: 'hub-explicit', status: 'confirmed' }),
    ]);
    expect(overlays.byStep.fill.investigationCounts.supported).toBe(1);
  });

  it('uses linked finding filters as suspected-cause fallback derivation', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [
        finding({
          id: 'f-machine',
          context: { activeFilters: { Machine: ['A'] }, cumulativeScope: 20 },
          evidenceType: 'data',
        }),
      ],
      hypotheses: [hub({ id: 'hub-derived', findingIds: ['f-machine'] })],
    });

    expect(overlays.byStep.mix.hypotheses.map(item => item.id)).toEqual(['hub-derived']);
  });

  it('renders draft causal links as arrows unless a promoted hub owns the link via hypothesisId', () => {
    const draft = buildCanvasAnalyzeOverlays({
      map,
      causalLinks: [link({ id: 'link-draft' })],
    });
    const promoted = buildCanvasAnalyzeOverlays({
      map,
      hypotheses: [hub({ id: 'hub-promoted', status: 'confirmed' })],
      causalLinks: [link({ id: 'link-promoted', hypothesisId: 'hub-promoted' })],
    });

    expect(draft.arrows).toEqual([
      expect.objectContaining({ id: 'link-draft', fromStepId: 'mix', toStepId: 'fill' }),
    ]);
    expect(promoted.arrows).toEqual([]);
  });

  it('omits unresolved entities from markers while tracking them for tests/debugging', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [
        finding({
          id: 'f-missing',
          context: { activeFilters: { Unknown: ['x'] }, cumulativeScope: null },
          evidenceType: 'data',
        }),
      ],
      hypotheses: [hub({ id: 'hub-missing', tributaryIds: ['missing-tributary'] })],
      causalLinks: [link({ id: 'link-missing', toFactor: 'Unknown' })],
    });

    expect(overlays.unresolved.findings).toContain('f-missing');
    expect(overlays.unresolved.hypotheses).toContain('hub-missing');
    expect(overlays.unresolved.causalLinks).toContain('link-missing');
    expect(overlays.byStep.mix.findings).toEqual([]);
    expect(overlays.byStep.mix.hypotheses).toEqual([]);
    expect(overlays.arrows).toEqual([]);
  });

  it('PR-CS-5: surfaces a step-captured finding on its originStepId even with no column resolution', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [finding({ id: 'f-step', originStepId: 'fill' })],
    });

    expect(overlays.byStep.fill.findings.map(item => item.id)).toEqual(['f-step']);
    expect(overlays.unresolved.findings).toEqual([]);
  });

  it('PR-CS-5: UNION — a finding surfaces on BOTH its column-derived step AND its originStepId', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [
        finding({
          id: 'f-union',
          // Column-derives to `pack` (Defect → pack)...
          context: { activeFilters: { Defect: ['Scratch'] }, cumulativeScope: null },
          // ...AND was captured from the `mix` step.
          originStepId: 'mix',
        }),
      ],
    });

    expect(overlays.byStep.pack.findings.map(item => item.id)).toEqual(['f-union']);
    expect(overlays.byStep.mix.findings.map(item => item.id)).toEqual(['f-union']);
    expect(overlays.unresolved.findings).toEqual([]);
  });

  it('PR-CS-5: dedupes when the column-derived step equals originStepId', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [
        finding({
          id: 'f-dedupe',
          context: { activeFilters: { Defect: ['Scratch'] }, cumulativeScope: null },
          originStepId: 'pack',
        }),
      ],
    });

    expect(overlays.byStep.pack.findings.map(item => item.id)).toEqual(['f-dedupe']);
  });

  it('PR-CS-5: an originStepId that names no real node falls back to column derivation (no regression)', () => {
    const overlays = buildCanvasAnalyzeOverlays({
      map,
      findings: [
        finding({
          id: 'f-badstep',
          context: { activeFilters: { Defect: ['Scratch'] }, cumulativeScope: null },
          originStepId: 'step-does-not-exist',
        }),
      ],
    });

    // Still surfaces on the column-derived step; the bad originStepId is ignored.
    expect(overlays.byStep.pack.findings.map(item => item.id)).toEqual(['f-badstep']);
    expect(overlays.unresolved.findings).toEqual([]);
  });
});
