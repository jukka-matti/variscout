import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Finding, SuspectedCause } from '@variscout/core';
import {
  getInvestigationInitialState,
  useInvestigationStore,
  useWallLayoutStore,
} from '@variscout/stores';
import { useWallIsMobile } from '@variscout/charts';
import { CanvasWallOverlay } from '../CanvasWallOverlay';

vi.mock('@variscout/charts', () => ({
  useWallIsMobile: vi.fn(),
  WallCanvas: (props: {
    mode?: string;
    hubs: SuspectedCause[];
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
      data-hubs-count={props.hubs.length}
      data-findings-count={props.findings.length}
      data-compose-gate={props.onComposeGate ? 'present' : 'absent'}
    >
      <button type="button" onClick={() => props.onSelectHub?.('hub-1')}>
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
      <button type="button" onClick={() => props.onFocusHubFromGap?.('hub-1')}>
        focus gap
      </button>
    </div>
  ),
}));

const useWallIsMobileMock = vi.mocked(useWallIsMobile);

const sampleHub: SuspectedCause = {
  id: 'hub-1',
  name: 'Thermal drift',
  synthesis: '',
  status: 'suspected',
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
  status: 'observed',
  comments: [],
  statusChangedAt: 1714000000000,
  createdAt: 1714000000000,
  deletedAt: null,
  investigationId: 'inv-test-001',
};

function renderOverlay(overrides: Partial<React.ComponentProps<typeof CanvasWallOverlay>> = {}) {
  return render(
    <CanvasWallOverlay
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

describe('CanvasWallOverlay', () => {
  beforeEach(() => {
    useWallIsMobileMock.mockReturnValue(false);
    useInvestigationStore.setState(getInvestigationInitialState());
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('returns null when wall overlay is not active', () => {
    useInvestigationStore.setState({ suspectedCauses: [sampleHub] });

    renderOverlay({ activeOverlays: ['hypotheses'] });

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
  });

  it('returns null when investigation content is empty', () => {
    renderOverlay();

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
  });

  it('returns null on mobile', () => {
    useWallIsMobileMock.mockReturnValue(true);
    useInvestigationStore.setState({ suspectedCauses: [sampleHub] });

    renderOverlay();

    expect(screen.queryByTestId('wall-canvas')).toBeNull();
  });

  it('renders the wrapper and WallCanvas in overlay mode when desktop, wall active, and content exists', () => {
    useInvestigationStore.setState({ suspectedCauses: [sampleHub] });

    renderOverlay();

    const wrapper = screen.getByTestId('canvas-wall-overlay');
    expect(wrapper).toHaveClass('pointer-events-auto');
    expect(wrapper).not.toHaveAttribute('aria-hidden');
    expect(wrapper).not.toHaveAttribute('inert');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-mode', 'overlay');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-compose-gate', 'absent');
  });

  it('makes the wrapper inert, pointer-events-none, and aria-hidden while drawing hypotheses', () => {
    useInvestigationStore.setState({ suspectedCauses: [sampleHub] });

    renderOverlay({ activeCanvasTool: 'draw-hypothesis' });

    const wrapper = screen.getByTestId('canvas-wall-overlay');
    expect(wrapper).toHaveClass('pointer-events-none');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper).toHaveAttribute('inert');
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
    useInvestigationStore.setState({ suspectedCauses: [sampleHub] });

    renderOverlay({ onOpenWall });

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(onOpenWall).toHaveBeenCalledTimes(1);
    expect(onOpenWall).toHaveBeenCalledWith();
  });

  it('mounts for finding-only content even when there are no hubs', () => {
    renderOverlay({ findings: [sampleFinding] });

    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-hubs-count', '0');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-findings-count', '1');
  });
});
