import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FindingBoardView from '../FindingBoardView';
import type { Finding } from '@variscout/core';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Machine B has high variation',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'general-unassigned',
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

const defaultProps = {
  findings: [makeFinding()],
  onEditFinding: vi.fn(),
  onDeleteFinding: vi.fn(),
  onRestoreFinding: vi.fn(),
  onSetFindingStatus: vi.fn(),
  onAddComment: vi.fn(),
  onEditComment: vi.fn(),
  onDeleteComment: vi.fn(),
};

describe('FindingBoardView', () => {
  it('renders SynthesisCard when synthesis is provided', () => {
    render(
      <FindingBoardView {...defaultProps} synthesis="The root cause is operator variability." />
    );
    expect(screen.getByTestId('synthesis-card')).toBeDefined();
    expect(screen.getByText('The root cause is operator variability.')).toBeDefined();
  });

  it('does not render SynthesisCard when synthesis is absent', () => {
    render(<FindingBoardView {...defaultProps} />);
    expect(screen.queryByTestId('synthesis-card')).toBeNull();
  });

  it('renders linkedFindings badges on SynthesisCard', () => {
    render(
      <FindingBoardView
        {...defaultProps}
        synthesis="Cause identified"
        linkedFindings={[{ id: 'f-1', text: 'High variation in Machine B' }]}
      />
    );
    expect(screen.getByTestId('synthesis-finding-badge-f-1')).toBeDefined();
  });

  it('accepts projectedCpkMap without errors', () => {
    const finding = makeFinding({ id: 'f-1', status: 'observed' });
    // Verifies the prop threads through without runtime errors
    const { container } = render(
      <FindingBoardView {...defaultProps} findings={[finding]} projectedCpkMap={{ 'f-1': 1.5 }} />
    );
    expect(container.querySelector('[data-testid="findings-board"]')).toBeDefined();
  });
});
