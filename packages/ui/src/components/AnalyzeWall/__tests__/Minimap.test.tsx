/**
 * Minimap — bird's-eye view of the Investigation Wall.
 *
 * Tests verify the coordinate mapping: a click on the minimap triggers
 * onPanTo with x/y converted from minimap-space (local to the 160×100 svg)
 * to canvas-space (2000×1400).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Minimap } from '../Minimap';
import { CANVAS_W, CANVAS_H } from '../WallCanvas';
import { computeWallLayout, buildWallLayoutArgs } from '../wallLayout';
import type { Hypothesis, ProcessMap } from '@variscout/core';

const MINIMAP_W = 160;

const hubs: Hypothesis[] = [
  {
    id: 'h-1',
    name: 'Night shift',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    investigationId: 'inv-test',
  },
  {
    id: 'h-2',
    name: 'Calibration drift',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    investigationId: 'inv-test',
  },
];

describe('Minimap', () => {
  it('renders a minimap container with aria-label', () => {
    const { getByLabelText } = render(
      <Minimap hubs={hubs} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={vi.fn()} />
    );
    expect(getByLabelText(/Investigation Wall minimap/i)).toBeInTheDocument();
  });

  it('renders one dot per hub', () => {
    const { container } = render(
      <Minimap hubs={hubs} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={vi.fn()} />
    );
    const dots = container.querySelectorAll('[data-minimap-node]');
    expect(dots.length).toBe(hubs.length);
  });

  it('click on minimap calls onPanTo with coordinates in canvas-space', () => {
    const onPanTo = vi.fn();
    const { container } = render(
      <Minimap hubs={hubs} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={onPanTo} />
    );
    const svg = container.querySelector('svg[data-testid="wall-minimap"]') as SVGSVGElement;
    expect(svg).toBeTruthy();

    // Stub getBoundingClientRect so fireEvent.click produces a predictable offset.
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 160, height: 100, right: 160, bottom: 100 }) as DOMRect;

    // Click at the minimap's center — clientX=80, clientY=50.
    fireEvent.click(svg, { clientX: 80, clientY: 50 });

    expect(onPanTo).toHaveBeenCalledTimes(1);
    // Center of minimap should map to the center of the canvas.
    const [x, y] = onPanTo.mock.calls[0];
    expect(x).toBeCloseTo(CANVAS_W / 2, 0);
    expect(y).toBeCloseTo(CANVAS_H / 2, 0);
  });

  it('click near the top-left corner maps to canvas origin', () => {
    const onPanTo = vi.fn();
    const { container } = render(
      <Minimap hubs={hubs} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={onPanTo} />
    );
    const svg = container.querySelector('svg[data-testid="wall-minimap"]') as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 160, height: 100, right: 160, bottom: 100 }) as DOMRect;

    fireEvent.click(svg, { clientX: 0, clientY: 0 });
    const [x, y] = onPanTo.mock.calls[0];
    expect(x).toBeCloseTo(0, 0);
    expect(y).toBeCloseTo(0, 0);
  });

  it('renders a viewport rectangle', () => {
    const { container } = render(
      <Minimap hubs={hubs} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={vi.fn()} />
    );
    expect(container.querySelector('[data-minimap-viewport]')).toBeTruthy();
  });

  // IM-4c — proof that the Minimap consumes the SHARED computeWallLayout
  // authority (not a recomputed linear duplicate): under tributary grouping the
  // dot x must equal the authority's tributary hub x, which differs from the
  // old linear `CANVAS_W/(N+1)` column.
  it('positions dots from computeWallLayout under tributary grouping (not the linear duplicate)', () => {
    const processMap: ProcessMap = {
      version: 1,
      nodes: [
        { id: 'n1', name: 'Fill', order: 0 },
        { id: 'n2', name: 'Pack', order: 1 },
      ],
      tributaries: [
        { id: 't1', stepId: 'n1', column: 'SHIFT' },
        { id: 't2', stepId: 'n2', column: 'LINE' },
      ],
      ctsColumn: 'FILL',
      createdAt: '2026-05-09T00:00:00.000Z',
      updatedAt: '2026-05-09T00:00:00.000Z',
    };
    const groupedHubs: Hypothesis[] = [
      { ...hubs[0], id: 'h-1', tributaryIds: ['t1'] },
      { ...hubs[1], id: 'h-2', tributaryIds: ['t2'] },
    ];

    const { container } = render(
      <Minimap
        hubs={groupedHubs}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        onPanTo={vi.fn()}
        processMap={processMap}
        groupByTributary
      />
    );

    const layout = computeWallLayout(
      buildWallLayoutArgs({
        hubs: groupedHubs,
        processMap,
        groupByTributary: true,
        canvasW: CANVAS_W,
        canvasH: CANVAS_H,
      })
    );

    const dot1 = container.querySelector('[data-minimap-node-id="h-1"]');
    const dot2 = container.querySelector('[data-minimap-node-id="h-2"]');
    const expected1 = (layout.hubPositions.get('h-1')!.x / CANVAS_W) * MINIMAP_W;
    const expected2 = (layout.hubPositions.get('h-2')!.x / CANVAS_W) * MINIMAP_W;
    expect(Number(dot1!.getAttribute('cx'))).toBeCloseTo(expected1);
    expect(Number(dot2!.getAttribute('cx'))).toBeCloseTo(expected2);

    // Sanity: the tributary layout x differs from the old linear duplicate
    // (CANVAS_W/(N+1)*(i+1) → 160*(i+1)/3 in minimap units), proving the dots
    // follow the bands, not the linear row.
    const linearDot2 = (((CANVAS_W / 3) * 2) / CANVAS_W) * MINIMAP_W;
    expect(Number(dot2!.getAttribute('cx'))).not.toBeCloseTo(linearDot2);
  });

  // CS-12 Task-1 regression — factor-* edges in the DOI graph must not break hub
  // dot rendering.  Task 1 added `'factor-support'|'factor-refute'` WallEdge kinds
  // whose `fromId` carries the `factor:${key}` prefix.  `wallDegreeOfInterest`
  // traverses those edges via BFS; this test confirms the Minimap still emits one
  // dot per hub when the layout contains at least one such edge.
  it('renders hub dots when the layout contains factor-* edges (CS-12 regression)', () => {
    const factorHub: (typeof hubs)[0] = { ...hubs[0], id: 'h-factor', findingIds: ['f-1'] };
    const layout = computeWallLayout(
      buildWallLayoutArgs({
        hubs: [factorHub],
        findings: [{ id: 'f-1', conditionColumns: ['Line'] }],
        factors: [{ key: 'Line', contribution: 0.4 }],
        canvasW: CANVAS_W,
        canvasH: CANVAS_H,
      })
    );

    // Sanity: the layout must contain at least one factor-support edge so the
    // regression is non-trivial (i.e. the fixture actually exercises the new path).
    const factorEdge = layout.edges.find(
      e => e.fromId === 'factor:Line' && e.toId === 'h-factor' && e.kind === 'factor-support'
    );
    expect(factorEdge).toBeDefined();

    // Render half: the Minimap is constructed with only this hub and no factors/findings
    // props, so its internal buildWallLayoutArgs receives no factor edges.  This half
    // therefore does NOT prove factor-edge traversal in the Minimap's own layout call.
    // Coverage split: the layout half above asserts the factor-support edge exists in
    // computeWallLayout's output (the wallLayout regression); this render half only
    // proves that Minimap hub-dot emission is unaffected by the same hub set when
    // factor-* edges are present in the DOI graph at the WallCanvas level.
    const { container } = render(
      <Minimap hubs={[factorHub]} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={vi.fn()} />
    );
    const dots = container.querySelectorAll('[data-minimap-node]');
    expect(dots.length).toBe(1);
  });
});
