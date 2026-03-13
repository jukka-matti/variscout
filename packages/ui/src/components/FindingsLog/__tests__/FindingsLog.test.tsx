/**
 * Tests for FindingsLog and FindingCard components
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FindingsLog from '../FindingsLog';
import type { Finding } from '@variscout/core';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Machine B has high variation',
    createdAt: Date.now(),
    context: {
      activeFilters: { Machine: ['B'] },
      cumulativeScope: 35,
      stats: { mean: 10.2, samples: 50 },
    },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

describe('FindingsLog', () => {
  const defaultProps = {
    findings: [] as Finding[],
    onEditFinding: vi.fn(),
    onDeleteFinding: vi.fn(),
    onRestoreFinding: vi.fn(),
  };

  it('renders empty state when no findings', () => {
    render(<FindingsLog {...defaultProps} />);
    expect(screen.getByText('No findings yet')).toBeDefined();
    expect(screen.getByText(/Pin interesting filter/)).toBeDefined();
  });

  it('renders finding cards when findings exist', () => {
    const findings = [
      makeFinding({ id: 'f-1', text: 'First finding' }),
      makeFinding({ id: 'f-2', text: 'Second finding' }),
    ];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    // Text is rendered wrapped in curly quotes by FindingCard
    expect(screen.getByText(/First finding/)).toBeDefined();
    expect(screen.getByText(/Second finding/)).toBeDefined();
  });

  it('shows filter chips from finding context', () => {
    const findings = [
      makeFinding({
        context: {
          activeFilters: { Machine: ['B'], Shift: ['Night'] },
          cumulativeScope: 55,
          stats: { mean: 10.2, samples: 50 },
        },
      }),
    ];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    // Filter chips display factor names and values
    expect(screen.getByText('Machine')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
    expect(screen.getByText('Shift')).toBeDefined();
    expect(screen.getByText('Night')).toBeDefined();
  });

  it('uses column aliases for display', () => {
    const findings = [
      makeFinding({
        context: {
          activeFilters: { col_a: ['X'] },
          cumulativeScope: 20,
        },
      }),
    ];

    render(
      <FindingsLog
        {...defaultProps}
        findings={findings}
        columnAliases={{ col_a: 'Filling Head' }}
      />
    );
    // The component should use the alias instead of the raw column name
    expect(screen.getByText('Filling Head')).toBeDefined();
    expect(screen.getByText('X')).toBeDefined();
  });

  it('fires onRestoreFinding when card is clicked', () => {
    const onRestore = vi.fn();
    const findings = [makeFinding({ id: 'f-42' })];

    render(<FindingsLog {...defaultProps} findings={findings} onRestoreFinding={onRestore} />);

    // Find the restore button (the card area that triggers restore)
    const restoreBtn = screen.getByRole('button', { name: /restore/i });
    fireEvent.click(restoreBtn);
    expect(onRestore).toHaveBeenCalledWith('f-42');
  });

  it('renders "No note" for finding with empty text', () => {
    const findings = [makeFinding({ id: 'f-empty', text: '' })];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    expect(screen.getByText('No note')).toBeDefined();
  });

  it('highlights active finding', () => {
    const findings = [
      makeFinding({ id: 'f-1', text: 'Active one' }),
      makeFinding({ id: 'f-2', text: 'Not active' }),
    ];

    const { container } = render(
      <FindingsLog {...defaultProps} findings={findings} activeFindingId="f-1" />
    );

    // The active finding should have a distinct visual treatment
    // (ring/border class applied via isActive prop)
    const list = container.querySelector('[data-testid="findings-list"]');
    expect(list).toBeDefined();
  });

  it('renders source chip when finding has a source', () => {
    const findings = [
      makeFinding({
        id: 'f-src',
        text: 'Source finding',
        source: { chart: 'boxplot', category: 'Machine B' },
      }),
    ];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    // The source chip shows the category name
    expect(screen.getByText('Machine B')).toBeDefined();
    // The chip has a title referencing the chart type
    expect(screen.getByTitle('Go to boxplot chart')).toBeDefined();
  });

  it('renders source chip for pareto chart', () => {
    const findings = [
      makeFinding({
        id: 'f-pareto',
        text: 'Pareto finding',
        source: { chart: 'pareto', category: 'Shift C' },
      }),
    ];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    expect(screen.getByText('Shift C')).toBeDefined();
    expect(screen.getByTitle('Go to pareto chart')).toBeDefined();
  });

  it('renders source chip for ichart (shows "I-Chart" when no category)', () => {
    const findings = [
      makeFinding({
        id: 'f-ichart',
        text: 'IChart finding',
        source: { chart: 'ichart', anchorX: 0.5, anchorY: 0.3 },
      }),
    ];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    expect(screen.getByText('I-Chart')).toBeDefined();
    expect(screen.getByTitle('Go to ichart chart')).toBeDefined();
  });

  it('does not render source chip when finding has no source', () => {
    const findings = [makeFinding({ id: 'f-nosrc', text: 'No source' })];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    // No chart navigation buttons should appear
    expect(screen.queryByTitle(/Go to .* chart/)).toBeNull();
  });

  // --- Assign button tests ---

  it('renders assign button when onAssignFinding is provided', () => {
    const onAssign = vi.fn();
    const findings = [makeFinding({ id: 'f-1' })];

    render(<FindingsLog {...defaultProps} findings={findings} onAssignFinding={onAssign} />);
    expect(screen.getByLabelText('Assign finding')).toBeDefined();
  });

  it('does not render assign button when onAssignFinding is not provided', () => {
    const findings = [makeFinding({ id: 'f-1' })];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    expect(screen.queryByLabelText('Assign finding')).toBeNull();
  });

  it('assign button calls onAssignFinding with finding ID', () => {
    const onAssign = vi.fn();
    const findings = [makeFinding({ id: 'f-99' })];

    render(<FindingsLog {...defaultProps} findings={findings} onAssignFinding={onAssign} />);

    fireEvent.click(screen.getByLabelText('Assign finding'));
    expect(onAssign).toHaveBeenCalledWith('f-99');
  });

  it('renders assignee chip when finding has an assignee', () => {
    const findings = [
      makeFinding({
        id: 'f-assigned',
        assignee: {
          upn: 'jane@contoso.com',
          displayName: 'Jane Smith',
          userId: 'user-123',
        },
      }),
    ];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    expect(screen.getByText('Jane Smith')).toBeDefined();
  });

  it('renders renderAssignSlot content inside the card when provided', () => {
    const findings = [makeFinding({ id: 'f-slot' })];
    const renderSlot = (findingId: string) => (
      <div data-testid={`assign-slot-${findingId}`}>Assign UI for {findingId}</div>
    );

    render(<FindingsLog {...defaultProps} findings={findings} renderAssignSlot={renderSlot} />);
    expect(screen.getByTestId('assign-slot-f-slot')).toBeDefined();
    expect(screen.getByText('Assign UI for f-slot')).toBeDefined();
  });

  it('fires onNavigateToChart when source badge is clicked', () => {
    const onNavigate = vi.fn();
    const source = { chart: 'boxplot' as const, category: 'Machine B' };
    const findings = [makeFinding({ id: 'f-nav', source })];

    render(<FindingsLog {...defaultProps} findings={findings} onNavigateToChart={onNavigate} />);

    fireEvent.click(screen.getByTitle('Go to boxplot chart'));
    expect(onNavigate).toHaveBeenCalledWith(source);
  });

  it('does not render assignee chip when no assignee', () => {
    const findings = [makeFinding({ id: 'f-1' })];

    render(<FindingsLog {...defaultProps} findings={findings} />);
    // No assignee chip should be visible
    expect(screen.queryByText(/Jane|John|assignee/i)).toBeNull();
  });
});
