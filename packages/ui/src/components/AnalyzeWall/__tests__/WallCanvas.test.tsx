import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { Hypothesis, ProcessMap, Finding } from '@variscout/core';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

interface D3ZoomSvgElement extends SVGSVGElement {
  __zoom?: { k: number; x: number; y: number };
  __on?: Array<{ type: string; name: string; value: (event: Event) => void }>;
}

/**
 * Override `window.matchMedia` for a single test to force the mobile branch
 * of `useWallIsMobile`. Returns a restore function that the caller invokes
 * in `afterEach` (or directly) to put the default jsdom desktop stub back.
 */
function installMobileMatchMedia() {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: original,
    });
  };
}

function sizeSvgForD3Zoom(element: SVGSVGElement) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 400 });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: 300 });
  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      width: 400,
      height: 300,
      toJSON: () => ({}),
    }) as DOMRect;
}

const processMap: ProcessMap = {
  version: 1,
  nodes: [{ id: 'n1', name: 'Fill', order: 0 }],
  tributaries: [{ id: 't1', stepId: 'n1', column: 'SHIFT' }],
  ctsColumn: 'FILL',
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
};

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-test',
};

/**
 * A hub with status='evidenced' (1 finding, evidenceType='data') triggers
 * the data-collection survey rule, causing MissingEvidencePanel to render.
 */
const hubWithEvidenced: Hypothesis = {
  ...hub,
  id: 'h-evidenced',
  status: 'evidenced',
  findingIds: ['f-data-1'],
};

const evidencedFindings: Finding[] = [
  {
    id: 'f-data-1',
    text: 'Data finding',
    evidenceType: 'data',
    createdAt: 1,
    deletedAt: null,
    investigationId: 'inv-test',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
  } as unknown as Finding,
];

describe('WallCanvas', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
  });

  it('renders empty state when no hubs', () => {
    render(
      <WallCanvas
        hubs={[]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Start a Mechanism Branch/i)).toBeInTheDocument();
  });

  it('renders Problem card + hub cards when hubs present', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Problem condition/i)).toBeInTheDocument();
    expect(screen.getByText(/Nozzle runs hot/i)).toBeInTheDocument();
  });

  it('preserves unfiltered desktop rendering when filterByStepId is omitted', () => {
    const fillHub: Hypothesis = {
      ...hub,
      id: 'h-fill',
      name: 'Fill shift effect',
      condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
    };
    const packHub: Hypothesis = {
      ...hub,
      id: 'h-pack',
      name: 'Pack operator effect',
      condition: { kind: 'leaf', column: 'Operator', op: 'eq', value: 'alice' },
    };

    render(
      <WallCanvas
        hubs={[fillHub, packHub]}
        findings={[]}
        processMap={{
          ...processMap,
          nodes: [...processMap.nodes, { id: 'n2', name: 'Pack', order: 1 }],
          assignments: { Operator: 'n2' },
        }}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );

    expect(screen.getByText(/Fill shift effect/i)).toBeInTheDocument();
    expect(screen.getByText(/Pack operator effect/i)).toBeInTheDocument();
  });

  it('filters desktop hubs by focal step referenced through condition columns', () => {
    const fillHub: Hypothesis = {
      ...hub,
      id: 'h-fill',
      name: 'Fill shift effect',
      condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
    };
    const packHub: Hypothesis = {
      ...hub,
      id: 'h-pack',
      name: 'Pack operator effect',
      condition: { kind: 'leaf', column: 'Operator', op: 'eq', value: 'alice' },
    };

    render(
      <WallCanvas
        hubs={[fillHub, packHub]}
        findings={[]}
        processMap={{
          ...processMap,
          nodes: [...processMap.nodes, { id: 'n2', name: 'Pack', order: 1 }],
          assignments: { Operator: 'n2' },
        }}
        filterByStepId="n1"
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );

    expect(screen.getByText(/Fill shift effect/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pack operator effect/i)).not.toBeInTheDocument();
  });

  it('matches filterByStepId through a focal step ctq column', () => {
    render(
      <WallCanvas
        hubs={[
          {
            ...hub,
            id: 'h-ctq',
            name: 'Fill weight excursions',
            condition: { kind: 'leaf', column: 'Fill Weight', op: 'gt', value: 100 },
          },
        ]}
        findings={[]}
        processMap={{
          ...processMap,
          nodes: [{ id: 'n1', name: 'Fill', order: 0, ctqColumn: 'Fill Weight' }],
          tributaries: [],
        }}
        filterByStepId="n1"
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );

    expect(screen.getByText(/Fill weight excursions/i)).toBeInTheDocument();
  });

  it('derives needs-disconfirmation from evidence (≥2 types, no survived disconfirmation)', () => {
    // IM-4a Task 3: status comes from deriveHypothesisStatus, not a stored echo.
    // ≥2 distinct evidence types + no survived disconfirmation → needs-disconfirmation.
    const evidencedHub: Hypothesis = {
      ...hub,
      id: 'h-needs-disconfirmation',
      // Stored status deliberately differs from the derived one to prove the echo is gone.
      status: 'proposed',
      findingIds: ['f-data', 'f-gemba'],
    };
    const twoTypeFindings: Finding[] = [
      {
        ...evidencedFindings[0],
        id: 'f-data',
        evidenceType: 'data',
      } as Finding,
      {
        ...evidencedFindings[0],
        id: 'f-gemba',
        evidenceType: 'gemba',
      } as Finding,
    ];
    const { container } = render(
      <WallCanvas
        hubs={[evidencedHub]}
        findings={twoTypeFindings}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );

    expect(screen.getByText(/Needs disconfirmation/i)).toBeInTheDocument();
    expect(container.querySelector('[data-status="needs-disconfirmation"]')).toBeTruthy();
  });

  it('derives confirmed only with ≥2 evidence types AND a survived disconfirmation', () => {
    const confirmedHub: Hypothesis = {
      ...hub,
      id: 'h-confirmed',
      // Stored echo says proposed; derivation must override to confirmed.
      status: 'proposed',
      findingIds: ['f-data', 'f-gemba'],
      disconfirmationAttempts: [
        {
          id: 'd1',
          attemptedAt: '2026-05-30T00:00:00.000Z',
          attemptedBy: { displayName: 'Analyst' },
          description: 'Checked against day shift',
          verdict: 'survived',
          linkedFindingIds: [],
        },
      ],
    };
    const twoTypeFindings: Finding[] = [
      { ...evidencedFindings[0], id: 'f-data', evidenceType: 'data' } as Finding,
      { ...evidencedFindings[0], id: 'f-gemba', evidenceType: 'gemba' } as Finding,
    ];
    const { container } = render(
      <WallCanvas
        hubs={[confirmedHub]}
        findings={twoTypeFindings}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(container.querySelector('[data-status="confirmed"]')).toBeTruthy();
  });

  it('derives evidenced (not confirmed) with only 1 evidence type, ignoring a stored confirmed echo', () => {
    const oneTypeHub: Hypothesis = {
      ...hub,
      id: 'h-one-type',
      status: 'confirmed', // stale echo — must NOT survive derivation
      findingIds: ['f-data'],
    };
    const oneTypeFindings: Finding[] = [
      { ...evidencedFindings[0], id: 'f-data', evidenceType: 'data' } as Finding,
    ];
    const { container } = render(
      <WallCanvas
        hubs={[oneTypeHub]}
        findings={oneTypeFindings}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(container.querySelector('[data-status="evidenced"]')).toBeTruthy();
    expect(container.querySelector('[data-status="confirmed"]')).toBeNull();
  });

  it('renders branch cards without a process map', () => {
    render(
      <WallCanvas
        hubs={[{ ...hub, nextMove: 'Check nozzle temperature.' }]}
        findings={[]}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Problem condition/i)).toBeInTheDocument();
    expect(screen.getByText(/Nozzle runs hot/i)).toBeInTheDocument();
    expect(screen.getByText(/Mechanism Branch/i)).toBeInTheDocument();
    expect(screen.getByText(/Next: Check nozzle temperature/i)).toBeInTheDocument();
  });

  it('renders tributary footer row', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/SHIFT/)).toBeInTheDocument();
  });

  it('flags missing-column when hub condition references a column not in activeColumns', () => {
    const hubWithCondition: Hypothesis = {
      ...hub,
      id: 'h-missing',
      condition: {
        kind: 'leaf',
        column: 'DROPPED_COLUMN',
        op: 'eq',
        value: 'x',
      },
    };
    render(
      <WallCanvas
        hubs={[hubWithCondition]}
        findings={[]}
        processMap={processMap}
        problemCpk={0}
        eventsPerWeek={0}
        activeColumns={['SHIFT', 'NOZZLE.TEMP']}
      />
    );
    expect(screen.getByLabelText(/references missing column/i)).toBeInTheDocument();
  });

  it('does not flag missing-column when all referenced columns are present', () => {
    const hubWithCondition: Hypothesis = {
      ...hub,
      id: 'h-ok',
      condition: {
        kind: 'leaf',
        column: 'SHIFT',
        op: 'eq',
        value: 'night',
      },
    };
    render(
      <WallCanvas
        hubs={[hubWithCondition]}
        findings={[]}
        processMap={processMap}
        problemCpk={0}
        eventsPerWeek={0}
        activeColumns={['SHIFT', 'NOZZLE.TEMP']}
      />
    );
    expect(screen.queryByLabelText(/references missing column/i)).toBeNull();
  });

  it('does not flag missing-column when activeColumns is not provided', () => {
    const hubWithCondition: Hypothesis = {
      ...hub,
      id: 'h-unknown',
      condition: {
        kind: 'leaf',
        column: 'ANY_COLUMN',
        op: 'eq',
        value: 'x',
      },
    };
    render(
      <WallCanvas
        hubs={[hubWithCondition]}
        findings={[]}
        processMap={processMap}
        problemCpk={0}
        eventsPerWeek={0}
      />
    );
    expect(screen.queryByLabelText(/references missing column/i)).toBeNull();
  });

  it('renders draggable hubs when onComposeGate is provided (DnD enabled)', () => {
    const onComposeGate = vi.fn();
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        onComposeGate={onComposeGate}
      />
    );
    // DraggableHypothesisCard wraps with data-draggable-hub attr.
    expect(container.querySelector('[data-draggable-hub="h1"]')).toBeTruthy();
  });

  it('renders static hubs when onComposeGate is not provided (DnD disabled)', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    // No draggable wrapper when DnD is off.
    expect(container.querySelector('[data-draggable-hub]')).toBeNull();
  });

  describe('mode prop', () => {
    it('default mode is destination — renders MissingEvidencePanel', () => {
      render(
        <WallCanvas
          hubs={[hubWithEvidenced]}
          findings={evidencedFindings}
          processMap={processMap}
          problemCpk={0}
          eventsPerWeek={0}
        />
      );
      expect(screen.getByLabelText(/Missing evidence digest/i)).toBeInTheDocument();
    });

    it('mode=overlay omits MissingEvidencePanel', () => {
      render(
        <WallCanvas
          hubs={[hubWithEvidenced]}
          findings={evidencedFindings}
          processMap={processMap}
          problemCpk={0}
          eventsPerWeek={0}
          mode="overlay"
        />
      );
      expect(screen.queryByLabelText(/Missing evidence digest/i)).not.toBeInTheDocument();
    });

    it('mode=overlay with empty hubs renders an empty-marker SVG (no EmptyState component)', () => {
      const { container } = render(
        <WallCanvas
          hubs={[]}
          findings={[]}
          processMap={processMap}
          problemCpk={0}
          eventsPerWeek={0}
          mode="overlay"
        />
      );
      // EmptyState contains the "Write a hypothesis" CTA text in destination mode.
      // Overlay mode renders an empty SVG canvas instead so the wrapper can
      // decide whether to mount at all.
      expect(screen.queryByText(/write a hypothesis/i)).not.toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('mode=overlay renders static hubs even when onComposeGate is provided', () => {
      const onComposeGate = vi.fn();
      const { container } = render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
          onComposeGate={onComposeGate}
          mode="overlay"
        />
      );
      expect(container.querySelector('[data-draggable-hub]')).toBeNull();
    });
  });

  it('applies identity transform (zoom=1, pan=0,0) by default', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    const transformGroup = container.querySelector('[data-wall-viewport]');
    expect(transformGroup).toBeTruthy();
    expect(transformGroup?.getAttribute('transform')).toContain('translate(0, 0)');
    expect(transformGroup?.getAttribute('transform')).toContain('scale(1)');
  });

  it('wraps hubs in a tributary-group frame when groupByTributary is on', () => {
    const hubA: Hypothesis = { ...hub, id: 'hA', tributaryIds: ['t1'] };
    const hubB: Hypothesis = { ...hub, id: 'hB', tributaryIds: ['t1'] };
    const { container } = render(
      <WallCanvas
        hubs={[hubA, hubB]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        groupByTributary
      />
    );
    const group = container.querySelector('[data-tributary-group="t1"]');
    expect(group).toBeTruthy();
    // Both hubs live inside the group frame.
    expect(group?.querySelectorAll('[aria-label*="Mechanism Branch"]').length).toBe(2);
  });

  it('does not render tributary-group frame when groupByTributary is off', () => {
    const hubA: Hypothesis = { ...hub, id: 'hA', tributaryIds: ['t1'] };
    const { container } = render(
      <WallCanvas
        hubs={[hubA]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(container.querySelector('[data-tributary-group]')).toBeNull();
  });

  it('buckets hubs without matching tributary into an unassigned group', () => {
    const hubA: Hypothesis = { ...hub, id: 'hA' }; // no tributaryIds
    const { container } = render(
      <WallCanvas
        hubs={[hubA]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        groupByTributary
      />
    );
    expect(container.querySelector('[data-tributary-group="unassigned"]')).toBeTruthy();
  });

  it('applies provided zoom + pan to the viewport transform', () => {
    const { container } = render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        zoom={0.5}
        pan={{ x: 100, y: 50 }}
      />
    );
    const transformGroup = container.querySelector('[data-wall-viewport]');
    expect(transformGroup?.getAttribute('transform')).toContain('translate(100, 50)');
    expect(transformGroup?.getAttribute('transform')).toContain('scale(0.5)');
  });

  it('binds d3 zoom input to the destination SVG when hubId is provided', () => {
    const hubId = h('wall-destination-hub');
    const { container } = render(
      <WallCanvas
        hubId={hubId}
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    const svg = container.querySelector('svg[role="img"]') as D3ZoomSvgElement;
    sizeSvgForD3Zoom(svg);

    expect(svg.__zoom).toMatchObject({ k: 1, x: 0, y: 0 });
    expect(svg.__on?.some(listener => listener.name === 'zoom')).toBe(true);

    fireEvent.wheel(svg, {
      bubbles: true,
      cancelable: true,
      deltaY: -180,
      clientX: 200,
      clientY: 150,
    });

    const viewport = useCanvasViewportStore.getState().getViewport(hubId);
    expect(viewport.zoom).toBeGreaterThan(1);
    expect(viewport.pan.x).toBeLessThan(0);
    expect(viewport.pan.y).toBeLessThan(0);
  });

  it('keeps descendant role-button wheel from updating the hub viewport while background wheel still works', () => {
    const hubId = h('wall-role-button-guard');
    const { container } = render(
      <WallCanvas
        hubId={hubId}
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    const svg = container.querySelector('svg[role="img"]') as D3ZoomSvgElement;
    sizeSvgForD3Zoom(svg);

    fireEvent.wheel(screen.getByRole('button', { name: /problem condition/i }), {
      bubbles: true,
      cancelable: true,
      deltaY: -180,
      clientX: 200,
      clientY: 150,
    });

    expect(useCanvasViewportStore.getState().getViewport(hubId)).toMatchObject({
      zoom: 1,
      pan: { x: 0, y: 0 },
    });

    fireEvent.wheel(svg, {
      bubbles: true,
      cancelable: true,
      deltaY: -180,
      clientX: 200,
      clientY: 150,
    });

    expect(useCanvasViewportStore.getState().getViewport(hubId).zoom).toBeGreaterThan(1);
  });

  it('does not bind d3 zoom input for overlay SVG even when hubId is provided defensively', () => {
    const { container } = render(
      <WallCanvas
        hubId={h('wall-overlay-hub')}
        hubs={[hub]}
        findings={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
        mode="overlay"
      />
    );
    const svg = container.querySelector('svg[role="img"]') as D3ZoomSvgElement;

    expect(svg.__zoom).toBeUndefined();
    expect(svg.__on?.some(listener => listener.name === 'zoom')).not.toBe(true);
  });

  describe('mobile breakpoint', () => {
    let restoreMatchMedia: (() => void) | undefined;

    afterEach(() => {
      restoreMatchMedia?.();
      restoreMatchMedia = undefined;
    });

    it('renders MobileCardList instead of the SVG canvas below 768px', () => {
      restoreMatchMedia = installMobileMatchMedia();
      const { container } = render(
        <WallCanvas
          hubId={h('wall-mobile-hub')}
          hubs={[hub]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
        />
      );
      // Mobile card list is present...
      expect(screen.getByTestId('wall-mobile-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('wall-mobile-hub-h1')).toBeInTheDocument();
      // ...and the desktop SVG viewport group is not.
      expect(container.querySelector('[data-wall-viewport]')).toBeNull();
      expect(container.querySelector('svg')).toBeNull();
    });

    it('filters mobile card list hubs by focal step referenced through condition columns', () => {
      restoreMatchMedia = installMobileMatchMedia();
      const fillHub: Hypothesis = {
        ...hub,
        id: 'h-fill',
        name: 'Fill shift effect',
        condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
      };
      const packHub: Hypothesis = {
        ...hub,
        id: 'h-pack',
        name: 'Pack operator effect',
        condition: { kind: 'leaf', column: 'Operator', op: 'eq', value: 'alice' },
      };

      render(
        <WallCanvas
          hubs={[fillHub, packHub]}
          findings={[]}
          processMap={{
            ...processMap,
            nodes: [...processMap.nodes, { id: 'n2', name: 'Pack', order: 1 }],
            assignments: { Operator: 'n2' },
          }}
          filterByStepId="n1"
          problemCpk={0.78}
          eventsPerWeek={42}
        />
      );

      expect(screen.getByTestId('wall-mobile-hub-h-fill')).toBeInTheDocument();
      expect(screen.queryByTestId('wall-mobile-hub-h-pack')).not.toBeInTheDocument();
    });

    it('still renders MissingEvidencePanel below the card list on mobile', () => {
      restoreMatchMedia = installMobileMatchMedia();
      render(
        <WallCanvas
          hubs={[hubWithEvidenced]}
          findings={evidencedFindings}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
        />
      );
      // Panel renders as a collapsed section — the aria-label is enough to
      // confirm the panel mounted alongside the mobile card list.
      expect(screen.getByLabelText(/Missing evidence digest/i)).toBeInTheDocument();
    });

    it('mode=overlay with empty hubs renders defensive SVG instead of mobile EmptyState', () => {
      restoreMatchMedia = installMobileMatchMedia();
      const { container } = render(
        <WallCanvas
          hubs={[]}
          findings={[]}
          processMap={processMap}
          problemCpk={0}
          eventsPerWeek={0}
          mode="overlay"
        />
      );
      expect(screen.queryByTestId('wall-mobile-card-list')).not.toBeInTheDocument();
      expect(screen.queryByText(/write a hypothesis/i)).not.toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('mode=overlay with hubs renders SVG projection instead of mobile card list', () => {
      restoreMatchMedia = installMobileMatchMedia();
      const { container } = render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
          mode="overlay"
        />
      );
      expect(screen.queryByTestId('wall-mobile-card-list')).not.toBeInTheDocument();
      expect(container.querySelector('[data-wall-viewport]')).toBeInTheDocument();
      expect(screen.getByText(/Nozzle runs hot/i)).toBeInTheDocument();
    });
  });

  describe('planningProps — HypothesisCardWithPlans wiring', () => {
    const basePlan: MeasurementPlan = {
      id: 'plan-1',
      hypothesisId: 'h1',
      outcome: 'Fill Weight',
      primaryFactor: 'Nozzle Temp',
      neededFactors: [],
      method: 'sensor',
      sampleSize: 30,
      owner: 'user-1',
      status: 'planned',
      scope: [],
      processLocation: '',
      createdAt: 1,
      deletedAt: null,
    };

    it('renders plans-section foreignObject when planningProps with matching plan are supplied', () => {
      const onAddPlan = vi.fn();
      const onLinkFinding = vi.fn();
      const onEditPlan = vi.fn();
      const { container } = render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
          planningProps={{
            plans: [basePlan],
            members: [],
            currentUserId: 'test-user',
            onAddPlan,
            onLinkFinding,
            onEditPlan,
          }}
        />
      );
      // plans-section foreignObject should be present (plan chip rendered)
      expect(container.querySelector('[data-testid="plans-section"]')).toBeTruthy();
    });

    it('does not render plans-section when planningProps is not supplied', () => {
      const { container } = render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
        />
      );
      expect(container.querySelector('[data-testid="plans-section"]')).toBeNull();
    });

    it('filters plans per hypothesis: plan chip appears under h1 but not under h2', () => {
      const hub2: Hypothesis = { ...hub, id: 'h2', name: 'Other hub' };
      const planForH1: MeasurementPlan = {
        ...basePlan,
        primaryFactor: 'Nozzle Temp',
        hypothesisId: 'h1',
      };
      const onAddPlan = vi.fn();
      const onLinkFinding = vi.fn();
      const onEditPlan = vi.fn();
      render(
        <WallCanvas
          hubs={[hub, hub2]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
          planningProps={{
            plans: [planForH1],
            members: [],
            currentUserId: 'test-user',
            onAddPlan,
            onLinkFinding,
            onEditPlan,
          }}
        />
      );
      // The plan for 'Nozzle Temp' belongs to h1 only. IM-4b renders the factor
      // in BOTH the data-collection-task header ("collect Nozzle Temp") AND the
      // embedded chip, so it appears exactly twice — and only under h1 (h2 has
      // no matching plan, so 0 there → 2 total, proving per-hypothesis filtering).
      expect(screen.getAllByText(/Nozzle Temp/i).length).toBe(2);
    });

    it('filters out soft-deleted plans (deletedAt !== null) — deleted plan chip absent', () => {
      const activePlan: MeasurementPlan = { ...basePlan, primaryFactor: 'ActiveFactor' };
      const deletedPlan: MeasurementPlan = {
        ...basePlan,
        id: 'plan-deleted',
        primaryFactor: 'DeletedFactor',
        deletedAt: Date.now(),
      };
      const onAddPlan = vi.fn();
      const onLinkFinding = vi.fn();
      const onEditPlan = vi.fn();
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
          planningProps={{
            plans: [activePlan, deletedPlan],
            members: [],
            currentUserId: 'test-user',
            onAddPlan,
            onLinkFinding,
            onEditPlan,
          }}
        />
      );
      // Active plan visible (factor appears in both the collect-task header and
      // the chip — IM-4b); deleted plan absent entirely.
      expect(screen.getAllByText(/ActiveFactor/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/DeletedFactor/i)).not.toBeInTheDocument();
    });

    it('derives step options from processMap and renders the step select inside AddPlanForm', () => {
      // The single-node processMap fixture has node 'Fill' (id='n1').
      // planningStepOptions useMemo should derive [{id:'n1', label:'Fill'}]
      // and forward it through hubPlanningProps to HypothesisCardWithPlans.
      const onAddPlan = vi.fn();
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          processMap={processMap}
          problemCpk={0.78}
          eventsPerWeek={42}
          planningProps={{
            plans: [],
            members: [
              {
                id: 'pm-test',
                userId: 'test-user',
                displayName: 'Test User',
                role: 'lead',
                invitedAt: 1,
                createdAt: 1,
                deletedAt: null,
              },
            ],
            currentUserId: 'test-user',
            onAddPlan,
            onLinkFinding: vi.fn(),
            onEditPlan: vi.fn(),
          }}
        />
      );

      // Open the AddPlanForm
      fireEvent.click(screen.getByRole('button', { name: /add plan/i }));

      // The Process step select should be rendered with the derived 'Fill' option
      const stepSelect = screen.getByLabelText(/process step/i) as HTMLSelectElement;
      const stepValues = Array.from(stepSelect.options).map(o => o.value);
      expect(stepValues).toContain('n1');
      expect(stepValues.some(v => v === 'n1')).toBe(true);
      // Confirm label is rendered as option text
      expect(screen.getByRole('option', { name: 'Fill' })).toBeInTheDocument();
    });

    it('hides step select in AddPlanForm when processMap is absent (undefined fallback path)', () => {
      const onAddPlan = vi.fn();
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          // processMap intentionally omitted
          problemCpk={0.78}
          eventsPerWeek={42}
          planningProps={{
            plans: [],
            members: [
              {
                id: 'pm-test',
                userId: 'test-user',
                displayName: 'Test User',
                role: 'lead',
                invitedAt: 1,
                createdAt: 1,
                deletedAt: null,
              },
            ],
            currentUserId: 'test-user',
            onAddPlan,
            onLinkFinding: vi.fn(),
            onEditPlan: vi.fn(),
          }}
        />
      );

      // Open the AddPlanForm
      fireEvent.click(screen.getByRole('button', { name: /add plan/i }));

      // No process step select should appear — planningStepOptions is undefined
      expect(screen.queryByLabelText(/process step/i)).not.toBeInTheDocument();
    });
  });

  describe('scope anchor (IM-4a)', () => {
    // 10 rows: Machine B subset (4 rows, low values) vs complement (6 rows).
    const scopeRows = [
      { Machine: 'B', lead_time: 50 },
      { Machine: 'B', lead_time: 52 },
      { Machine: 'B', lead_time: 48 },
      { Machine: 'B', lead_time: 51 },
      { Machine: 'A', lead_time: 20 },
      { Machine: 'A', lead_time: 22 },
      { Machine: 'A', lead_time: 19 },
      { Machine: 'C', lead_time: 21 },
      { Machine: 'C', lead_time: 23 },
      { Machine: 'C', lead_time: 18 },
    ];

    const scope = {
      id: 'scope-1',
      investigationId: 'inv-test',
      outcome: 'lead_time',
      predicates: [{ kind: 'leaf' as const, column: 'Machine', op: 'eq' as const, value: 'B' }],
      hypothesisIds: [],
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
    };

    it('renders the compound condition text from the active scope', () => {
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={scopeRows}
          activeScope={scope}
        />
      );
      expect(screen.getByTestId('problem-scope-condition')).toHaveTextContent('Machine = B');
    });

    it('renders coverage % matching computeConditionCoverage', () => {
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={scopeRows}
          activeScope={scope}
        />
      );
      // 4 of 10 rows match Machine=B → 40%.
      expect(screen.getByTestId('problem-scope-projection')).toHaveTextContent('40%');
    });

    it('renders HOLDS N/M matching runAndCheck over the scope gateNode', () => {
      const gatedScope = {
        ...scope,
        gateNode: { kind: 'hub' as const, hubId: 'h-cond' },
      };
      const condHub: Hypothesis = {
        ...hub,
        id: 'h-cond',
        condition: { kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' },
      };
      render(
        <WallCanvas
          hubs={[condHub]}
          findings={[]}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={scopeRows}
          activeScope={gatedScope}
        />
      );
      // gateNode = hub h-cond whose condition is Machine=B → HOLDS 4/10.
      expect(screen.getByTestId('problem-scope-holds')).toHaveTextContent('4/10');
    });

    it('renders the What-If projected Cpk when specs are provided', () => {
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={scopeRows}
          activeScope={scope}
          activeScopeSpecs={{ usl: 60, lsl: 0 }}
        />
      );
      // What-If row renders (a Cpk value present) — projection is non-null for
      // this subset/complement split with specs.
      expect(screen.getByTestId('problem-scope-projection')).toHaveTextContent(/Cpk/);
    });

    it('omits scope rows entirely when no activeScope is passed', () => {
      render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={scopeRows}
        />
      );
      expect(screen.queryByTestId('problem-scope-condition')).toBeNull();
      expect(screen.queryByTestId('problem-scope-holds')).toBeNull();
      expect(screen.queryByTestId('problem-scope-projection')).toBeNull();
    });
  });

  describe('evidence band + per-hypothesis HOLDS (IM-4a Task 5)', () => {
    const evidenceRows = [
      { SHIFT: 'night', lead_time: 50 },
      { SHIFT: 'night', lead_time: 52 },
      { SHIFT: 'day', lead_time: 20 },
      { SHIFT: 'day', lead_time: 22 },
    ];
    const condHub: Hypothesis = {
      ...hub,
      id: 'h-evid',
      name: 'Night shift effect',
      condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
      findingIds: ['f-support'],
      counterFindingIds: ['f-counter'],
    };
    const bandFindings: Finding[] = [
      { ...evidencedFindings[0], id: 'f-support', text: 'Night runs spike' } as Finding,
      { ...evidencedFindings[0], id: 'f-counter', text: 'Day batch also high' } as Finding,
    ];

    it('renders a per-hypothesis GateBadge with HOLDS over the hub condition', () => {
      render(
        <WallCanvas
          hubs={[condHub]}
          findings={bandFindings}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={evidenceRows}
        />
      );
      // condition SHIFT=night → 2 of 4 rows.
      const badge = screen.getByTestId(`hub-holds-${condHub.id}`);
      expect(badge).toHaveTextContent('2/4');
    });

    it('renders FindingChips tethered to their parent hypothesis', () => {
      const { container } = render(
        <WallCanvas
          hubs={[condHub]}
          findings={bandFindings}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={evidenceRows}
        />
      );
      // Each linked finding renders a chip + a dashed tether line.
      expect(screen.getByText(/Night runs spike/)).toBeInTheDocument();
      expect(screen.getByText(/Day batch also high/)).toBeInTheDocument();
      expect(
        container.querySelectorAll(`[data-evidence-tether="${condHub.id}"]`).length
      ).toBeGreaterThanOrEqual(2);
    });

    it('labels supporting vs counter evidence (Supports / Counts against)', () => {
      render(
        <WallCanvas
          hubs={[condHub]}
          findings={bandFindings}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={evidenceRows}
        />
      );
      expect(screen.getByText(/Supports/)).toBeInTheDocument();
      expect(screen.getByText(/Counts against/)).toBeInTheDocument();
    });

    it('omits the per-hypothesis HOLDS badge when the hub has no condition', () => {
      render(
        <WallCanvas
          hubs={[{ ...hub, id: 'h-no-cond', condition: undefined }]}
          findings={[]}
          problemCpk={0.78}
          eventsPerWeek={42}
          rows={evidenceRows}
        />
      );
      expect(screen.queryByTestId('hub-holds-h-no-cond')).toBeNull();
    });
  });
});
