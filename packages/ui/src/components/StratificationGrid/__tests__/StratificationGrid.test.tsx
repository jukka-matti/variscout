import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StratificationGrid } from '..';
import type { MindmapNode } from '@variscout/charts';

const makeNode = (overrides: Partial<MindmapNode> & { factor: string }): MindmapNode => ({
  etaSquared: 0.5,
  state: 'available',
  isSuggested: false,
  categoryData: [],
  ...overrides,
});

const availableNode = makeNode({
  factor: 'Machine',
  etaSquared: 0.63,
  isSuggested: true,
  categoryData: [
    { value: 'A', count: 20, meanValue: 10.2, contributionPct: 45 },
    { value: 'B', count: 15, meanValue: 11.5, contributionPct: 18 },
  ],
});

const activeNode = makeNode({
  factor: 'Shift',
  etaSquared: 0,
  state: 'active',
  filteredValue: 'Morning',
  isSuggested: false,
});

const exhaustedNode = makeNode({
  factor: 'Operator',
  etaSquared: 0.005,
  state: 'exhausted',
  isSuggested: false,
});

describe('StratificationGrid', () => {
  it('renders all factor cards', () => {
    const { container } = render(
      <StratificationGrid
        nodes={[availableNode, activeNode, exhaustedNode]}
        drillTrail={['Shift']}
        cumulativeVariationPct={47}
      />
    );

    expect(container.querySelector('[data-testid="factor-card-Machine"]')).toBeDefined();
    expect(container.querySelector('[data-testid="factor-card-Shift"]')).toBeDefined();
    expect(container.querySelector('[data-testid="factor-card-Operator"]')).toBeDefined();
  });

  it('renders available card with categories', () => {
    render(
      <StratificationGrid nodes={[availableNode]} drillTrail={[]} cumulativeVariationPct={null} />
    );

    const card = screen.getByTestId('factor-card-Machine');
    expect(card.getAttribute('data-state')).toBe('available');
    expect(screen.getByText('Machine')).toBeDefined();
    expect(screen.getByText('63%')).toBeDefined();
    expect(screen.getByText('Explains 63% of variation')).toBeDefined();
    expect(screen.getByText('A')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
  });

  it('renders active card with filtered value', () => {
    render(
      <StratificationGrid nodes={[activeNode]} drillTrail={['Shift']} cumulativeVariationPct={47} />
    );

    const card = screen.getByTestId('factor-card-Shift');
    expect(card.getAttribute('data-state')).toBe('active');
    expect(screen.getByText('= Morning')).toBeDefined();
  });

  it('renders exhausted card with muted label', () => {
    render(
      <StratificationGrid nodes={[exhaustedNode]} drillTrail={[]} cumulativeVariationPct={null} />
    );

    const card = screen.getByTestId('factor-card-Operator');
    expect(card.getAttribute('data-state')).toBe('exhausted');
    expect(screen.getByText('< 1% variation')).toBeDefined();
  });

  it('sorts nodes: active first, then available by eta desc, then exhausted', () => {
    const { container } = render(
      <StratificationGrid
        nodes={[exhaustedNode, availableNode, activeNode]}
        drillTrail={['Shift']}
        cumulativeVariationPct={47}
      />
    );

    const cards = container.querySelectorAll('[data-testid^="factor-card-"]');
    expect(cards[0].getAttribute('data-testid')).toBe('factor-card-Shift'); // active
    expect(cards[1].getAttribute('data-testid')).toBe('factor-card-Machine'); // available (63%)
    expect(cards[2].getAttribute('data-testid')).toBe('factor-card-Operator'); // exhausted
  });

  it('calls onCategorySelect when category chip is clicked', () => {
    const onCategorySelect = vi.fn();
    render(
      <StratificationGrid
        nodes={[availableNode]}
        drillTrail={[]}
        cumulativeVariationPct={null}
        onCategorySelect={onCategorySelect}
      />
    );

    fireEvent.click(screen.getByTestId('category-chip-A'));
    expect(onCategorySelect).toHaveBeenCalledWith('Machine', 'A');
  });

  it('renders progress bar with percentage', () => {
    render(
      <StratificationGrid nodes={[availableNode]} drillTrail={[]} cumulativeVariationPct={42} />
    );

    expect(screen.getByText('Focused on 42% of variation')).toBeDefined();
    expect(screen.getByText('70% target')).toBeDefined();
  });

  it('renders progress bar with dash when no variation', () => {
    render(
      <StratificationGrid nodes={[availableNode]} drillTrail={[]} cumulativeVariationPct={null} />
    );

    expect(screen.getByText(/Focused on — of variation/)).toBeDefined();
  });

  it('applies column aliases to display names', () => {
    render(
      <StratificationGrid
        nodes={[availableNode]}
        drillTrail={[]}
        cumulativeVariationPct={null}
        columnAliases={{ Machine: 'Equipment' }}
      />
    );

    expect(screen.getByText('Equipment')).toBeDefined();
    expect(screen.queryByText('Machine')).toBeNull();
  });

  it('renders the grid container with correct testid', () => {
    render(<StratificationGrid nodes={[]} drillTrail={[]} cumulativeVariationPct={null} />);

    expect(screen.getByTestId('stratification-grid')).toBeDefined();
  });
});
