import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CurrentProcessState, ProcessStateItem, ProcessStateLens } from '@variscout/core';
import { ProcessHubCurrentStatePanel } from '../ProcessHubCurrentStatePanel';

const HUB = {
  id: 'h-1',
  name: 'Filling Line A',
  description: undefined,
  processOwner: undefined,
};

const ZERO_LENS_COUNTS: Record<ProcessStateLens, number> = {
  outcome: 0,
  flow: 0,
  conversion: 0,
  measurement: 0,
  sustainment: 0,
};

const buildState = (overrides: Partial<CurrentProcessState> = {}): CurrentProcessState => ({
  hub: HUB,
  assessedAt: '2026-04-27T00:00:00.000Z',
  overallSeverity: 'neutral',
  items: [],
  lensCounts: { ...ZERO_LENS_COUNTS },
  responsePathCounts: {},
  ...overrides,
});

const buildItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Capability gap',
  ...overrides,
});

describe('ProcessHubCurrentStatePanel', () => {
  it('renders the heading and overall severity badge', () => {
    render(<ProcessHubCurrentStatePanel state={buildState({ overallSeverity: 'red' })} />);
    expect(screen.getByTestId('current-process-state')).toBeInTheDocument();
    expect(screen.getByText('Current Process State')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('renders all five lens count cards using lensCounts', () => {
    const state = buildState({
      lensCounts: { outcome: 3, flow: 1, conversion: 0, measurement: 2, sustainment: 5 },
    });
    render(<ProcessHubCurrentStatePanel state={state} />);
    expect(screen.getByTestId('current-state-lens-outcome')).toHaveTextContent('3');
    expect(screen.getByTestId('current-state-lens-flow')).toHaveTextContent('1');
    expect(screen.getByTestId('current-state-lens-conversion')).toHaveTextContent('0');
    expect(screen.getByTestId('current-state-lens-measurement')).toHaveTextContent('2');
    expect(screen.getByTestId('current-state-lens-sustainment')).toHaveTextContent('5');
  });

  it('shows the empty placeholder when there are no items', () => {
    render(<ProcessHubCurrentStatePanel state={buildState()} />);
    expect(screen.getByText('No current process state signals yet')).toBeInTheDocument();
  });

  it('renders item cards capped at 6 with a +N indicator for the rest', () => {
    const items = Array.from({ length: 9 }, (_, i) =>
      buildItem({ id: `item-${i}`, label: `Item ${i + 1}` })
    );
    render(<ProcessHubCurrentStatePanel state={buildState({ items })} />);
    expect(screen.getAllByTestId('current-state-item')).toHaveLength(6);
    expect(screen.getByText('+3 more current-state items')).toBeInTheDocument();
  });

  it('formats Cpk vs target detail when both are present on metric', () => {
    const item = buildItem({
      lens: 'outcome',
      metric: { cpk: 1.05, cpkTarget: 1.33 },
    });
    render(<ProcessHubCurrentStatePanel state={buildState({ items: [item] })} />);
    const card = screen.getByTestId('current-state-item');
    expect(within(card).getByText(/Cpk 1\.05 vs target 1\.33/)).toBeInTheDocument();
  });

  it('formats change-signal count using singular vs plural', () => {
    const items = [
      buildItem({ id: 'a', lens: 'flow', metric: { changeSignalCount: 1 } }),
      buildItem({ id: 'b', lens: 'flow', metric: { changeSignalCount: 4 } }),
    ];
    render(<ProcessHubCurrentStatePanel state={buildState({ items, overallSeverity: 'amber' })} />);
    expect(screen.getByText('1 change signal')).toBeInTheDocument();
    expect(screen.getByText('4 change signals')).toBeInTheDocument();
  });

  it('falls back to item.detail when no metric formatter applies', () => {
    const item = buildItem({ detail: 'Free-text fallback' });
    render(<ProcessHubCurrentStatePanel state={buildState({ items: [item] })} />);
    expect(screen.getByText('Free-text fallback')).toBeInTheDocument();
  });

  it('renders the response path label per item', () => {
    const item = buildItem({ responsePath: 'chartered-project' });
    render(<ProcessHubCurrentStatePanel state={buildState({ items: [item] })} />);
    expect(screen.getByText('Chartered project')).toBeInTheDocument();
  });
});
