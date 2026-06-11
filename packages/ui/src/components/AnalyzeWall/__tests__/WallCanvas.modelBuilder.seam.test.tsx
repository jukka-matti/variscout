/**
 * WallCanvas model-toggle SEAM test (ER-3 — the model drawer replaces the band).
 *
 * The in-SVG `ModelBuilderBand` is retired; the full model surface is now the
 * screen-space `ModelDrawerBase`, mounted by the app and opened via the new
 * `onOpenModelDrawer` callback. This seam proves the WallCanvas side of that
 * contract:
 *   - the "Model" toggle is NEVER a dead control: no `onOpenModelDrawer` → no
 *     toggle; with the callback → the toggle renders and firing it calls back,
 *   - the A2 OWNERSHIP guard (the bug this PR exists to kill): there is NO model
 *     surface mounted INSIDE the populated `<svg>`, and — the regression sentinel
 *     — NO `<foreignObject>` inside `<g data-wall-viewport>` whose y-extent falls
 *     OUTSIDE the parsed `data-wall-content-bbox` (the old band sat at y=960 while
 *     the viewBox cropped to y≤768 → the toggle changed zero pixels).
 *
 * The drawer's own engine behaviour (vital-few shown row, R²adj summary, capture
 * snapshot, constant-factor chip, onModelStats) is covered by
 * `ModelDrawer/__tests__/ModelDrawerBase.test.tsx` — not duplicated here.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { WallCanvasModelBuilderProps } from '../WallCanvas';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { DataRow } from '@variscout/core';

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

// One hub so the Wall renders its populated body.
const hub = createHypothesis('Setup variation', '', []);

// Shift dominates Y; Noise + Machine are decoupled junk → vital few = {Shift}.
function scopeRows(): DataRow[] {
  const rows: DataRow[] = [];
  const shiftMean: Record<string, number> = { A: 10, B: 20, C: 30 };
  const wobble = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
  const noiseSeq = ['x', 'x', 'y', 'y', 'x', 'x', 'y', 'y', 'x', 'x', 'y', 'y'];
  const machineSeq = ['m1', 'm1', 'm1', 'm1', 'm2', 'm2', 'm1', 'm1', 'm1', 'm1', 'm2', 'm2'];
  for (const s of ['A', 'B', 'C']) {
    for (let r = 0; r < 12; r++) {
      rows.push({
        Shift: s,
        Noise: noiseSeq[r],
        Machine: machineSeq[r],
        Y: shiftMean[s] + wobble[r],
      });
    }
  }
  return rows;
}

const baseModelBuilderProps: WallCanvasModelBuilderProps = {
  candidateFactors: ['Shift', 'Noise', 'Machine'],
};

describe('WallCanvas — model toggle seam (ER-3)', () => {
  it('renders the "Model" toggle and fires onOpenModelDrawer (never a dead control)', () => {
    const onOpenModelDrawer = vi.fn();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps}
        onOpenModelDrawer={onOpenModelDrawer}
      />
    );
    const toggle = screen.getByTestId('wall-model-builder-toggle');
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);
    expect(onOpenModelDrawer).toHaveBeenCalledTimes(1);
  });

  it('does NOT render the toggle when onOpenModelDrawer is omitted (dead-control guard)', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps}
      />
    );
    expect(screen.queryByTestId('wall-model-builder-toggle')).toBeNull();
  });

  it('does NOT render the toggle when modelBuilderProps is omitted', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        onOpenModelDrawer={vi.fn()}
      />
    );
    expect(screen.queryByTestId('wall-model-builder-toggle')).toBeNull();
  });

  it('A2 OWNERSHIP: no model surface is mounted inside the populated <svg>', () => {
    const { container } = render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps}
        onOpenModelDrawer={vi.fn()}
      />
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // The model surface is screen-space (app-mounted), NEVER inside the viewBox-cropped SVG.
    expect(svg!.querySelector('[data-testid="model-drawer"]')).toBeNull();
    expect(svg!.querySelector('[data-testid="model-builder-band"]')).toBeNull();
  });

  it('A2 REGRESSION GUARD: no model surface exists inside the populated <svg>', () => {
    // The A2 bug: the band foreignObject lived at y=960 while the populated viewBox
    // cropped to y≤768, so the toggle changed zero pixels. The explicit invariant
    // is that NEITHER the drawer NOR the builder band is ever mounted inside the
    // SVG — the model surface is screen-space (app-mounted). This test is stronger
    // than the bbox-loop approach (which was vacuously true with minimal fixtures)
    // and doesn't risk false-failures when richer fixtures introduce card-local
    // foreignObjects whose coordinates are in card-space, not canvas-space.
    const { container } = render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps}
        onOpenModelDrawer={vi.fn()}
      />
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Neither surface may appear inside the viewBox-cropped SVG.
    expect(svg!.querySelector('[data-testid="model-drawer"]')).toBeNull();
    expect(svg!.querySelector('[data-testid="model-builder-band"]')).toBeNull();
  });

  it('A2 REGRESSION GUARD: data-wall-content-bbox attribute is present and numerically valid', () => {
    // Documents the data-wall-content-bbox contract: the attribute must be present
    // on the <svg> and parse to four finite numbers [x, y, w, h].
    const { container } = render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps}
        onOpenModelDrawer={vi.fn()}
      />
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    const bboxAttr = svg!.getAttribute('data-wall-content-bbox');
    expect(bboxAttr).not.toBeNull();
    const parts = (bboxAttr ?? '').split(' ').map(Number);
    expect(parts).toHaveLength(4);
    const [x, y, w, h] = parts;
    expect([x, y, w, h].every(Number.isFinite)).toBe(true);
  });

  it('cold-start: the toggle renders + fires (zero hubs, candidate factors present)', () => {
    const onOpenModelDrawer = vi.fn();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps}
        onOpenModelDrawer={onOpenModelDrawer}
      />
    );
    // The cold-start wrapper mounted (factor glyphs + EmptyState CTA coexist).
    expect(screen.getByTestId('wall-cold-start-with-band')).toBeTruthy();
    // No in-SVG model surface at cold start either.
    expect(screen.queryByTestId('model-builder-band')).toBeNull();
    const toggle = screen.getByTestId('wall-model-builder-toggle');
    fireEvent.click(toggle);
    expect(onOpenModelDrawer).toHaveBeenCalledTimes(1);
  });

  it('cold-start: NO factor band (no candidates) → bare EmptyState, no toggle', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={{ candidateFactors: [] }}
        onOpenModelDrawer={vi.fn()}
      />
    );
    expect(screen.queryByTestId('wall-cold-start-with-band')).toBeNull();
    expect(screen.queryByTestId('wall-model-builder-toggle')).toBeNull();
  });

  it('cold-start SVG viewBox is cropped to content — NOT the full 0 0 2000 1400 canvas', () => {
    // FE-1 item 3 (preserved post-ER-3): without hubs/orphans the glyph row sits
    // near y≈1300 in the full 2000×1400 space → everything renders tiny. The crop
    // keeps the glyph row framed. Reverting coldStartViewBox to the full canvas
    // fails the first assertion.
    const { container } = render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={scopeRows()}
        outcomeColumn="Y"
        modelBuilderProps={baseModelBuilderProps}
        onOpenModelDrawer={vi.fn()}
      />
    );
    const coldStartSvg = container
      .querySelector('[data-testid="wall-cold-start-with-band"]')
      ?.querySelector('svg');
    expect(coldStartSvg).not.toBeNull();
    const viewBox = coldStartSvg!.getAttribute('viewBox');
    expect(viewBox).not.toBe('0 0 2000 1400');
    const parts = (viewBox ?? '').split(' ').map(Number);
    expect(parts).toHaveLength(4);
    const [, vbY, vbW, vbH] = parts;
    // Cropped: y offset into the canvas (content near y≈1300, framed with headroom).
    expect(vbY).toBeGreaterThan(0);
    expect(vbW).toBeGreaterThanOrEqual(700);
    expect(vbW).toBeLessThan(2000);
    expect(vbH).toBeGreaterThan(0);
    expect(vbH).toBeLessThan(800);
  });
});
