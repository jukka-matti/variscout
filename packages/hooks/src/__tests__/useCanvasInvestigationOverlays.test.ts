import { describe, expect, it } from 'vitest';
import type { CausalLink, Finding, Question, SuspectedCause } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import {
  CANVAS_OVERLAY_REGISTRY,
  buildCanvasInvestigationOverlays,
  coerceCanvasOverlays,
  enabledCanvasOverlays,
} from '../useCanvasInvestigationOverlays';

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

function question(overrides: Partial<Question> & { id: string; factor?: string }): Question {
  const { id } = overrides;
  return {
    text: `Question ${id}`,
    status: 'open',
    linkedFindingIds: [],
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    ...overrides,
  };
}

function finding(overrides: Partial<Finding> & { id: string }): Finding {
  const { id } = overrides;
  return {
    text: `Finding ${id}`,
    createdAt: 1,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    ...overrides,
  };
}

function hub(overrides: Partial<SuspectedCause> & { id: string }): SuspectedCause {
  const { id } = overrides;
  return {
    name: `Hub ${id}`,
    synthesis: 'Evidence connects here.',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
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
    questionIds: [],
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
      'suspected-causes',
      'findings',
    ]);
    expect(CANVAS_OVERLAY_REGISTRY.findings.enabled).toBe(true);
    expect(coerceCanvasOverlays(['findings', 'unknown', 'findings'])).toEqual(['findings']);
  });
});

describe('buildCanvasInvestigationOverlays', () => {
  it('binds questions through factor columns and findings through active filters', () => {
    const overlays = buildCanvasInvestigationOverlays({
      map,
      questions: [question({ id: 'q-machine', factor: 'Machine' })],
      findings: [
        finding({
          id: 'f-defect',
          context: { activeFilters: { Defect: ['Scratch'] }, cumulativeScope: 10 },
        }),
      ],
    });

    expect(overlays.byStep.mix.questions.map(item => item.id)).toEqual(['q-machine']);
    expect(overlays.byStep.pack.findings.map(item => item.id)).toEqual(['f-defect']);
    expect(overlays.unresolved.questions).toEqual([]);
    expect(overlays.unresolved.findings).toEqual([]);
  });

  it('binds findings through their linked question when active filters do not resolve', () => {
    const overlays = buildCanvasInvestigationOverlays({
      map,
      questions: [question({ id: 'q-fill', factor: 'Fill Head' })],
      findings: [finding({ id: 'f-linked', questionId: 'q-fill' })],
    });

    expect(overlays.byStep.fill.findings.map(item => item.id)).toEqual(['f-linked']);
  });

  it('projects suspected causes from explicit tributary ids before fallback derivation', () => {
    const overlays = buildCanvasInvestigationOverlays({
      map,
      suspectedCauses: [
        hub({
          id: 'hub-explicit',
          status: 'confirmed',
          tributaryIds: ['trib-fill-head'],
          questionIds: ['q-fill'],
        }),
      ],
    });

    expect(overlays.byStep.fill.suspectedCauses).toEqual([
      expect.objectContaining({ id: 'hub-explicit', status: 'confirmed', questionId: 'q-fill' }),
    ]);
    expect(overlays.byStep.fill.investigationCounts.supported).toBe(1);
  });

  it('uses linked finding filters as suspected-cause fallback derivation', () => {
    const overlays = buildCanvasInvestigationOverlays({
      map,
      findings: [
        finding({
          id: 'f-machine',
          context: { activeFilters: { Machine: ['A'] }, cumulativeScope: 20 },
        }),
      ],
      suspectedCauses: [hub({ id: 'hub-derived', findingIds: ['f-machine'] })],
    });

    expect(overlays.byStep.mix.suspectedCauses.map(item => item.id)).toEqual(['hub-derived']);
  });

  it('renders draft causal links as arrows unless a promoted hub owns the link', () => {
    const draft = buildCanvasInvestigationOverlays({
      map,
      causalLinks: [link({ id: 'link-draft', questionIds: ['q-1'] })],
    });
    const promoted = buildCanvasInvestigationOverlays({
      map,
      suspectedCauses: [hub({ id: 'hub-promoted', questionIds: ['q-1'] })],
      causalLinks: [link({ id: 'link-promoted', questionIds: ['q-1'] })],
    });

    expect(draft.arrows).toEqual([
      expect.objectContaining({ id: 'link-draft', fromStepId: 'mix', toStepId: 'fill' }),
    ]);
    expect(promoted.arrows).toEqual([]);
  });

  it('omits unresolved entities from markers while tracking them for tests/debugging', () => {
    const overlays = buildCanvasInvestigationOverlays({
      map,
      questions: [question({ id: 'q-missing', factor: 'Unknown' })],
      findings: [
        finding({
          id: 'f-missing',
          context: { activeFilters: { Unknown: ['x'] }, cumulativeScope: null },
        }),
      ],
      suspectedCauses: [hub({ id: 'hub-missing', tributaryIds: ['missing-tributary'] })],
      causalLinks: [link({ id: 'link-missing', toFactor: 'Unknown' })],
    });

    expect(overlays.unresolved).toEqual({
      questions: ['q-missing'],
      findings: ['f-missing'],
      suspectedCauses: ['hub-missing'],
      causalLinks: ['link-missing'],
    });
    expect(overlays.byStep.mix.questions).toEqual([]);
    expect(overlays.byStep.mix.findings).toEqual([]);
    expect(overlays.byStep.mix.suspectedCauses).toEqual([]);
    expect(overlays.arrows).toEqual([]);
  });
});
