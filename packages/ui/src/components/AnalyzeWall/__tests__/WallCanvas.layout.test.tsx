/**
 * WallCanvas.layout.seam test (IM-4c Task 2 + 3).
 *
 * Renders the PRODUCTION `WallCanvas` and asserts that hub/finding nodes are
 * positioned at the EXACT `computeWallLayout` coordinates — proving WallCanvas
 * renders from the single position authority (not its own inline math). It also
 * pins the two regression guards that must survive the re-layout:
 *   #5 counts-against chips keep their LOUD warning styling
 *   #6 evidence tethers still connect finding positions to hub anchors
 *
 * A dead refactor (WallCanvas keeping its own math while the authority drifts)
 * FAILS these: the `data-wall-node-id` position attrs would not equal the
 * authority's output.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { WallCanvas, CANVAS_W, CANVAS_H } from '../WallCanvas';
import { computeWallLayout } from '../wallLayout';
import { chartColors } from '@variscout/charts';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import type { Hypothesis, Finding } from '@variscout/core';

const evidenceRows = [
  { SHIFT: 'night', lead_time: 50 },
  { SHIFT: 'night', lead_time: 52 },
  { SHIFT: 'day', lead_time: 20 },
  { SHIFT: 'day', lead_time: 22 },
];

const hubA: Hypothesis = {
  id: 'hA',
  name: 'Night shift effect',
  synthesis: '',
  condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
  findingIds: ['f-support', 'f-counter'],
  counterFindingIds: ['f-counter'],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};

const hubB: Hypothesis = {
  ...hubA,
  id: 'hB',
  name: 'Operator drift',
  condition: undefined,
  findingIds: [],
  counterFindingIds: [],
};

const findings: Finding[] = [
  {
    id: 'f-support',
    text: 'Night runs spike',
    evidenceType: 'data',
    createdAt: 1,
    deletedAt: null,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
  } as unknown as Finding,
  {
    id: 'f-counter',
    text: 'Day batch also high',
    evidenceType: 'data',
    createdAt: 1,
    deletedAt: null,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
  } as unknown as Finding,
  {
    id: 'f-orphan',
    text: 'Unattached observation',
    evidenceType: 'data',
    createdAt: 1,
    deletedAt: null,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
  } as unknown as Finding,
];

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

describe('WallCanvas renders from computeWallLayout (single position authority)', () => {
  it('positions each hub node at the authority x/y', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hubA, hubB]}
        findings={findings}
        problemCpk={0.78}
        eventsPerWeek={42}
        rows={evidenceRows}
      />
    );
    const layout = computeWallLayout({
      hubs: [
        { id: 'hA', findingIds: ['f-support', 'f-counter'], counterFindingIds: ['f-counter'] },
        { id: 'hB', findingIds: [], counterFindingIds: [] },
      ],
      findings: [{ id: 'f-support' }, { id: 'f-counter' }, { id: 'f-orphan' }],
      factors: [],
      grouping: 'linear',
      canvasW: CANVAS_W,
      canvasH: CANVAS_H,
    });

    for (const id of ['hA', 'hB']) {
      const node = container.querySelector(`[data-wall-node-id="${id}"]`);
      expect(node).toBeTruthy();
      const pos = layout.hubPositions.get(id)!;
      expect(Number(node!.getAttribute('data-x'))).toBeCloseTo(pos.x);
      expect(Number(node!.getAttribute('data-y'))).toBeCloseTo(pos.y);
    }
  });

  it('places the orphan finding chip at the authority orphan-lane position', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hubA]}
        findings={findings}
        problemCpk={0.78}
        eventsPerWeek={42}
        rows={evidenceRows}
      />
    );
    const layout = computeWallLayout({
      hubs: [
        { id: 'hA', findingIds: ['f-support', 'f-counter'], counterFindingIds: ['f-counter'] },
      ],
      findings: [{ id: 'f-support' }, { id: 'f-counter' }, { id: 'f-orphan' }],
      factors: [],
      grouping: 'linear',
      canvasW: CANVAS_W,
      canvasH: CANVAS_H,
    });
    const orphanNode = container.querySelector('[data-wall-node-id="f-orphan"]');
    expect(orphanNode).toBeTruthy();
    const pos = layout.findingPositions.get('f-orphan')!;
    expect(Number(orphanNode!.getAttribute('data-x'))).toBeCloseTo(pos.x);
    expect(Number(orphanNode!.getAttribute('data-y'))).toBeCloseTo(pos.y);
  });

  it('keeps counts-against tether + label LOUD through the re-layout (regression #5)', () => {
    const { container, getByText } = render(
      <WallCanvas
        hubs={[hubA]}
        findings={findings}
        problemCpk={0.78}
        eventsPerWeek={42}
        rows={evidenceRows}
      />
    );
    // The counter tether keeps the warning stroke.
    const counterTether = container.querySelector(
      '[data-evidence-tether="hA"][data-evidence-kind="counter"]'
    );
    expect(counterTether).toBeTruthy();
    expect(counterTether!.getAttribute('stroke')).toBe(chartColors.warning);
    // The "Counts against" label keeps bold styling + warning fill.
    const label = getByText(/Counts against/);
    expect(label.getAttribute('class')).toMatch(/font-bold/);
    expect(label.getAttribute('fill')).toBe(chartColors.warning);
  });

  it('tethers connect the finding position to the hub anchor (regression #6)', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hubA]}
        findings={findings}
        problemCpk={0.78}
        eventsPerWeek={42}
        rows={evidenceRows}
      />
    );
    const layout = computeWallLayout({
      hubs: [
        { id: 'hA', findingIds: ['f-support', 'f-counter'], counterFindingIds: ['f-counter'] },
      ],
      findings: [{ id: 'f-support' }, { id: 'f-counter' }, { id: 'f-orphan' }],
      factors: [],
      grouping: 'linear',
      canvasW: CANVAS_W,
      canvasH: CANVAS_H,
    });
    const hubX = layout.hubPositions.get('hA')!.x;
    const supportX = layout.findingPositions.get('f-support')!.x;
    const supportTether = container.querySelector(
      '[data-evidence-tether="hA"][data-evidence-kind="support"]'
    );
    expect(supportTether).toBeTruthy();
    // The tether's hub end is at the hub anchor x; its chip end at the chip x.
    expect(Number(supportTether!.getAttribute('x2'))).toBeCloseTo(hubX);
    expect(Number(supportTether!.getAttribute('x1'))).toBeCloseTo(supportX);
  });
});
