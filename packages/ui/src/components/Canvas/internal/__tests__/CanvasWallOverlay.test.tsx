import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Finding, Hypothesis } from '@variscout/core';
import {
  getCanvasViewportInitialState,
  getInvestigationInitialState,
  useCanvasViewportStore,
  useInvestigationStore,
  type ProcessHubId,
} from '@variscout/stores';
import { useWallIsMobile } from '../../../InvestigationWall';
import { CanvasWallOverlay } from '../CanvasWallOverlay';

// Cast helper: acceptable inside test files per project convention
const h = (id: string) => id as ProcessHubId;

interface D3ZoomElement extends HTMLDivElement {
  __zoom?: { k: number; x: number; y: number };
  __on?: Array<{ type: string; name: string; value: (event: Event) => void }>;
}

vi.mock('../../../InvestigationWall', () => ({
  useWallIsMobile: vi.fn(),
  WallCanvas: (props: {
    mode?: string;
    hubId?: string;
    hubs: Hypothesis[];
    findings: Finding[];
    onSelectHub?: (id: string) => void;
    onPromoteQuestion?: (id: string) => void;
    onWriteHypothesis?: () => void;
    onPromoteFromQuestion?: () => void;
    onSeedFromFactorIntel?: () => void;
    onFocusHubFromGap?: (id: string) => void;
    onComposeGate?: unknown;
  }) => (
    <div
      data-testid="wall-canvas"
      data-mode={props.mode}
      data-hub-id={props.hubId ?? ''}
      data-hubs-count={props.hubs.length}
      data-findings-count={props.findings.length}
      data-compose-gate={props.onComposeGate ? 'present' : 'absent'}
    >
      <div role="button" tabIndex={0}>
        role button target
      </div>
      <button type="button" onClick={() => props.onSelectHub?.(h('hub-1'))}>
        open hub
      </button>
      <button type="button" onClick={() => props.onPromoteQuestion?.('q-1')}>
        promote question
      </button>
      <button type="button" onClick={() => props.onWriteHypothesis?.()}>
        write hypothesis
      </button>
      <button type="button" onClick={() => props.onPromoteFromQuestion?.()}>
        promote from question
      </button>
      <button type="button" onClick={() => props.onSeedFromFactorIntel?.()}>
        seed factor intel
      </button>
      <button type="button" onClick={() => props.onFocusHubFromGap?.(h('hub-1'))}>
        focus gap
      </button>
    </div>
  ),
}));

const useWallIsMobileMock = vi.mocked(useWallIsMobile);

const sampleHub: Hypothesis = {
  id: h('hub-1'),
  name: 'Thermal drift',
  synthesis: '',
  status: 'proposed',
  questionIds: [],
  findingIds: [],
  createdAt: 1714000000000,
  updatedAt: 1714000000000,
  deletedAt: null,
  investigationId: 'inv-test-001',
};

const sampleFinding: Finding = {
  id: 'finding-1',
  text: 'Variation changed after shift handoff',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 1714000000000,
  createdAt: 1714000000000,
  deletedAt: null,
  investigationId: 'inv-test-001',
};
const HUB_ID = h('hub-overlay-test');
const OTHER_HUB_ID = h('hub-overlay-other');

function renderOverlay(overrides: Partial<React.ComponentProps<typeof CanvasWallOverlay>> = {}) {
  return render(
    <CanvasWallOverlay
      hubId={HUB_ID}
      activeOverlays={['wall']}
      activeCanvasTool="select"
      findings={[]}
      processMap={undefined}
      problemCpk={0.81}
      eventsPerWeek={42}
      activeColumns={undefined}
      {...overrides}
    />
  );
}

function sizeElementForD3Zoom(element: HTMLElement) {
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

describe('CanvasWallOverlay', () => {
  beforeEach(() => {
    useWallIsMobileMock.mockReturnValue(false);
    useInvestigationStore.setState(getInvestigationInitialState());
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
  });

  it('returns null when wall overlay is not active', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    renderOverlay({ activeOverlays: ['hypotheses'] });

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
  });

  it('returns null when investigation content is empty', () => {
    renderOverlay();

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
  });

  it('returns null on mobile', () => {
    useWallIsMobileMock.mockReturnValue(true);
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    renderOverlay();

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
  });

  it('renders the wrapper and WallCanvas in overlay mode when desktop, wall active, and content exists', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    renderOverlay();

    const wrapper = screen.getByTestId('canvas-wall-overlay');
    expect(wrapper).toHaveClass('pointer-events-auto');
    expect(wrapper).toHaveClass('z-[15]');
    expect(wrapper).not.toHaveClass('z-30');
    expect(wrapper).not.toHaveAttribute('aria-hidden');
    expect(wrapper).not.toHaveAttribute('inert');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-mode', 'overlay');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-compose-gate', 'absent');
  });

  it('makes the wrapper inert, pointer-events-none, and aria-hidden while drawing hypotheses', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    renderOverlay({ activeCanvasTool: 'draw-hypothesis' });

    const wrapper = screen.getByTestId('canvas-wall-overlay');
    expect(wrapper).toHaveClass('pointer-events-none');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper).toHaveAttribute('inert');
  });

  it('binds d3 zoom input to the overlay wrapper and wheel updates the hub viewport', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });
    useCanvasViewportStore.getState().setZoom(OTHER_HUB_ID, 2);
    useCanvasViewportStore.getState().setPan(OTHER_HUB_ID, { x: -50, y: -50 });

    renderOverlay();

    const wrapper = screen.getByTestId('canvas-wall-overlay') as D3ZoomElement;
    sizeElementForD3Zoom(wrapper);
    expect(wrapper.__zoom).toMatchObject({ k: 1, x: 0, y: 0 });
    expect(wrapper.__on?.some(listener => listener.name === 'zoom')).toBe(true);

    fireEvent.wheel(wrapper, {
      bubbles: true,
      cancelable: true,
      deltaY: -180,
      clientX: 200,
      clientY: 150,
    });

    const viewport = useCanvasViewportStore.getState().getViewport(HUB_ID);
    expect(viewport.zoom).toBeGreaterThan(1);
    expect(viewport.pan.x).toBeLessThan(0);
    expect(viewport.pan.y).toBeLessThan(0);
    expect(useCanvasViewportStore.getState().getViewport(OTHER_HUB_ID)).toMatchObject({
      zoom: 2,
      pan: {
        x: -50,
        y: -50,
      },
    });
  });

  it('keeps descendant role-button wheel from updating the hub viewport while background wheel still works', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    renderOverlay();

    const wrapper = screen.getByTestId('canvas-wall-overlay') as D3ZoomElement;
    sizeElementForD3Zoom(wrapper);
    const roleButton = screen.getByRole('button', { name: 'role button target' });

    fireEvent.wheel(roleButton, {
      bubbles: true,
      cancelable: true,
      deltaY: -180,
      clientX: 200,
      clientY: 150,
    });

    expect(useCanvasViewportStore.getState().getViewport(HUB_ID)).toMatchObject({
      zoom: 1,
      pan: { x: 0, y: 0 },
    });

    fireEvent.wheel(wrapper, {
      bubbles: true,
      cancelable: true,
      deltaY: -180,
      clientX: 200,
      clientY: 150,
    });

    expect(useCanvasViewportStore.getState().getViewport(HUB_ID).zoom).toBeGreaterThan(1);
  });

  it('attaches d3 zoom input when the overlay becomes active after initially rendering null', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    const { rerender } = renderOverlay({ activeOverlays: ['hypotheses'] });
    expect(screen.queryByTestId('canvas-wall-overlay')).toBeNull();

    rerender(
      <CanvasWallOverlay
        hubId={HUB_ID}
        activeOverlays={['wall']}
        activeCanvasTool="select"
        findings={[]}
        processMap={undefined}
        problemCpk={0.81}
        eventsPerWeek={42}
        activeColumns={undefined}
      />
    );

    const wrapper = screen.getByTestId('canvas-wall-overlay') as D3ZoomElement;
    expect(wrapper.__zoom).toMatchObject({ k: 1, x: 0, y: 0 });
    expect(wrapper.__on?.some(listener => listener.name === 'zoom')).toBe(true);
  });

  it('does not pass hubId into overlay WallCanvas to avoid nested d3 zoom bindings', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    renderOverlay();

    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-hub-id', '');
  });

  it('does not attach d3 zoom input or update the store while drawing hypotheses', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });
    useCanvasViewportStore.getState().setPan(HUB_ID, { x: 12, y: -8 });

    renderOverlay({ activeCanvasTool: 'draw-hypothesis' });

    const wrapper = screen.getByTestId('canvas-wall-overlay') as D3ZoomElement;
    sizeElementForD3Zoom(wrapper);
    expect(wrapper.__zoom).toBeUndefined();
    expect(wrapper.__on?.some(listener => listener.name === 'zoom')).not.toBe(true);

    fireEvent.wheel(wrapper, {
      bubbles: true,
      cancelable: true,
      deltaY: -180,
      clientX: 200,
      clientY: 150,
    });

    expect(useCanvasViewportStore.getState().getViewport(HUB_ID)).toMatchObject({
      zoom: 1,
      pan: { x: 12, y: -8 },
    });
  });

  it('does not keep hand-rolled pointer drag panning on the overlay wrapper', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });
    useCanvasViewportStore.getState().setPan(HUB_ID, { x: 12, y: -8 });

    renderOverlay();

    const wrapper = screen.getByTestId('canvas-wall-overlay');
    fireEvent.pointerDown(wrapper, { pointerId: 1, clientX: 100, clientY: 200 });
    fireEvent.pointerMove(wrapper, { pointerId: 1, clientX: 130, clientY: 180 });
    fireEvent.pointerUp(wrapper, { pointerId: 1, clientX: 130, clientY: 180 });

    expect(useCanvasViewportStore.getState().getViewport(HUB_ID).pan).toEqual({ x: 12, y: -8 });
  });

  it('does not pan while drawing hypotheses', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });
    useCanvasViewportStore.getState().setPan(HUB_ID, { x: 12, y: -8 });

    renderOverlay({ activeCanvasTool: 'draw-hypothesis' });

    const wrapper = screen.getByTestId('canvas-wall-overlay');
    fireEvent.pointerDown(wrapper, { pointerId: 1, clientX: 100, clientY: 200 });
    fireEvent.pointerMove(wrapper, { pointerId: 1, clientX: 130, clientY: 180 });
    fireEvent.pointerUp(wrapper, { pointerId: 1, clientX: 130, clientY: 180 });

    expect(useCanvasViewportStore.getState().getViewport(HUB_ID).pan).toEqual({ x: 12, y: -8 });
  });

  it('leaves other hub viewport state untouched while drawing hypotheses', () => {
    useInvestigationStore.setState({ hypotheses: [sampleHub] });
    useCanvasViewportStore.getState().setPan(OTHER_HUB_ID, { x: -50, y: -50 });

    renderOverlay({ activeCanvasTool: 'draw-hypothesis' });

    expect(useCanvasViewportStore.getState().getViewport(OTHER_HUB_ID).pan).toEqual({
      x: -50,
      y: -50,
    });
  });

  it.each([
    'open hub',
    'promote question',
    'write hypothesis',
    'promote from question',
    'seed factor intel',
    'focus gap',
  ])('funnels the "%s" WallCanvas callback into onOpenWall exactly once', buttonName => {
    const onOpenWall = vi.fn();
    useInvestigationStore.setState({ hypotheses: [sampleHub] });

    renderOverlay({ onOpenWall });

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(onOpenWall).toHaveBeenCalledTimes(1);
    expect(onOpenWall).toHaveBeenCalledWith();
  });

  it('does not mount for finding-only content because findings have no standalone Wall visual', () => {
    renderOverlay({ findings: [sampleFinding] });

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
  });

  it('mounts for open question-only content even when there are no hubs', () => {
    useInvestigationStore.getState().addQuestion('Does shift handoff explain the change?');

    renderOverlay();

    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-hubs-count', '0');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-findings-count', '0');
  });
});
