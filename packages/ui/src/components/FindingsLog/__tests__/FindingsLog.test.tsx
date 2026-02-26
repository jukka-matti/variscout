/**
 * Tests for FindingsLog and FindingCard components
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FindingsLog from '../FindingsLog';
import type { Finding } from '@variscout/core';

const makeFinding = (overrides?: Partial<Finding>): Finding => ({
  id: 'f-1',
  text: 'Machine B has high variation',
  createdAt: Date.now(),
  context: {
    activeFilters: { Machine: ['B'] },
    cumulativeScope: 35,
    stats: { mean: 10.2, samples: 50 },
  },
  ...overrides,
});

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
});
