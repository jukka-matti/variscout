import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { Hypothesis, ProcessMap, Question, Finding } from '@variscout/core';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';

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
  questionIds: [],
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-test',
};

const openQuestion: Question = {
  id: 'q1',
  text: 'Does fill temperature drive this?',
  status: 'open',
  linkedFindingIds: [],
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
    refutes: false,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    investigationId: 'inv-test',
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
        questions={[]}
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
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );
    expect(screen.getByText(/Problem condition/i)).toBeInTheDocument();
    expect(screen.getByText(/Nozzle runs hot/i)).toBeInTheDocument();
  });

  it('renders canonical needs-disconfirmation status stored on a hub', () => {
    const needsDisconfirmationHub: Hypothesis = {
      ...hub,
      id: 'h-needs-disconfirmation',
      status: 'needs-disconfirmation',
    };
    const { container } = render(
      <WallCanvas
        hubs={[needsDisconfirmationHub]}
        findings={[]}
        questions={[]}
        processMap={processMap}
        problemCpk={0.78}
        eventsPerWeek={42}
      />
    );

    expect(screen.getByText(/Needs disconfirmation/i)).toBeInTheDocument();
    expect(container.querySelector('[data-status="needs-disconfirmation"]')).toBeTruthy();
  });

  it('renders branch cards without a process map', () => {
    render(
      <WallCanvas
        hubs={[{ ...hub, nextMove: 'Check nozzle temperature.' }]}
        findings={[]}
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
          questions={[]}
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
          questions={[]}
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
          questions={[]}
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

    it('mode=overlay renders open question-only Wall content instead of a blank SVG', () => {
      render(
        <WallCanvas
          hubs={[]}
          findings={[]}
          questions={[openQuestion]}
          processMap={processMap}
          problemCpk={0}
          eventsPerWeek={0}
          mode="overlay"
        />
      );

      expect(screen.queryByText(/write a hypothesis/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Does fill temperature drive this/i)).toBeInTheDocument();
    });

    it('mode=overlay renders static hubs even when onComposeGate is provided', () => {
      const onComposeGate = vi.fn();
      const { container } = render(
        <WallCanvas
          hubs={[hub]}
          findings={[]}
          questions={[]}
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
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
        questions={[]}
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
    const hubId = 'wall-destination-hub';
    const { container } = render(
      <WallCanvas
        hubId={hubId}
        hubs={[hub]}
        findings={[]}
        questions={[]}
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
    const hubId = 'wall-role-button-guard';
    const { container } = render(
      <WallCanvas
        hubId={hubId}
        hubs={[hub]}
        findings={[]}
        questions={[]}
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
        hubId="wall-overlay-hub"
        hubs={[hub]}
        findings={[]}
        questions={[]}
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
          hubId="wall-mobile-hub"
          hubs={[hub]}
          findings={[]}
          questions={[]}
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

    it('still renders MissingEvidencePanel below the card list on mobile', () => {
      restoreMatchMedia = installMobileMatchMedia();
      render(
        <WallCanvas
          hubs={[hubWithEvidenced]}
          findings={evidencedFindings}
          questions={[]}
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
          questions={[]}
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
          questions={[]}
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
});
