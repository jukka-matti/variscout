import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeDetailCard } from '../EdgeDetailCard';

describe('EdgeDetailCard', () => {
  const defaultProps = {
    factorA: 'Supplier',
    factorB: 'Fill Head',
    relationshipType: 'interactive' as const,
    rSquaredAdj: 0.42,
    strength: 0.72,
    deltaRSquared: 0.04,
    x: 300,
    y: 200,
    onPromoteToCausal: vi.fn(),
    onAskCoScout: vi.fn(),
    onAskQuestion: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders factor names in header', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText(/Supplier/)).toBeTruthy();
    expect(screen.getByText(/Fill Head/)).toBeTruthy();
  });

  it('shows UI relationship type badge — Interact for interactive', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText('Interact')).toBeTruthy();
  });

  it('shows Overlap badge for overlapping type', () => {
    render(<EdgeDetailCard {...defaultProps} relationshipType="overlapping" />);
    expect(screen.getByText('Overlap')).toBeTruthy();
  });

  it('shows Independent badge for redundant type', () => {
    render(<EdgeDetailCard {...defaultProps} relationshipType="redundant" />);
    expect(screen.getByText('Independent')).toBeTruthy();
  });

  it('displays R²adj value', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText(/0\.42/)).toBeTruthy();
  });

  it('displays strength label Strong for >= 0.7', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText('Strong')).toBeTruthy();
  });

  it('shows Moderate for strength 0.5', () => {
    render(<EdgeDetailCard {...defaultProps} strength={0.5} />);
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('shows Weak for strength 0.15', () => {
    render(<EdgeDetailCard {...defaultProps} strength={0.15} />);
    expect(screen.getByText('Weak')).toBeTruthy();
  });

  it('renders 3 action buttons', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText('Promote to causal link')).toBeTruthy();
    expect(screen.getByText('Ask CoScout')).toBeTruthy();
    expect(screen.getByText('Ask question')).toBeTruthy();
  });

  it('calls onPromoteToCausal with both factors', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Promote to causal link'));
    expect(defaultProps.onPromoteToCausal).toHaveBeenCalledWith('Supplier', 'Fill Head');
  });

  it('calls onAskCoScout with both factors', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Ask CoScout'));
    expect(defaultProps.onAskCoScout).toHaveBeenCalledWith('Supplier', 'Fill Head');
  });

  it('calls onAskQuestion with both factors', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Ask question'));
    expect(defaultProps.onAskQuestion).toHaveBeenCalledWith('Supplier', 'Fill Head');
  });

  it('closes on Escape key', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  describe('interaction pattern guidance', () => {
    it('shows ordinal guidance for interactive + ordinal', () => {
      render(<EdgeDetailCard {...defaultProps} interactionPattern="ordinal" />);
      expect(
        screen.getByText('The gap between Fill Head levels changes across Supplier values.')
      ).toBeTruthy();
    });

    it('shows disordinal guidance for interactive + disordinal', () => {
      render(<EdgeDetailCard {...defaultProps} interactionPattern="disordinal" />);
      expect(
        screen.getByText('The ranking of Fill Head levels reverses across Supplier values.')
      ).toBeTruthy();
    });

    it('shows generic guidance when interactionPattern is not provided', () => {
      render(<EdgeDetailCard {...defaultProps} />);
      expect(screen.getByText('Optimize together')).toBeTruthy();
    });

    it('shows generic guidance for non-interactive type regardless of interactionPattern', () => {
      render(
        <EdgeDetailCard
          {...defaultProps}
          relationshipType="overlapping"
          interactionPattern="ordinal"
        />
      );
      expect(screen.getByText('Shared variation — investigate what connects them')).toBeTruthy();
    });
  });

  describe('cell counts display', () => {
    const cellCounts = [
      { levelA: 'A1', levelB: 'B1', n: 8 },
      { levelA: 'A1', levelB: 'B2', n: 3 },
      { levelA: 'A2', levelB: 'B1', n: 12 },
    ];

    it('renders cell counts when provided', () => {
      render(<EdgeDetailCard {...defaultProps} cellCounts={cellCounts} />);
      expect(screen.getByText('Cell sizes:')).toBeTruthy();
      expect(screen.getByText('A1×B1: n=8')).toBeTruthy();
      expect(screen.getByText('A1×B2: n=3')).toBeTruthy();
      expect(screen.getByText('A2×B1: n=12')).toBeTruthy();
    });

    it('does not render cell counts section when cellCounts is not provided', () => {
      render(<EdgeDetailCard {...defaultProps} />);
      expect(screen.queryByText('Cell sizes:')).toBeNull();
    });

    it('does not render cell counts section when cellCounts is empty', () => {
      render(<EdgeDetailCard {...defaultProps} cellCounts={[]} />);
      expect(screen.queryByText('Cell sizes:')).toBeNull();
    });

    it('flags cells with n < 5 in amber', () => {
      const { container } = render(<EdgeDetailCard {...defaultProps} cellCounts={cellCounts} />);
      const amberSpans = container.querySelectorAll('.text-amber-500');
      // Only A1×B2 (n=3) should be amber
      expect(amberSpans).toHaveLength(1);
      expect(amberSpans[0].textContent).toBe('A1×B2: n=3');
    });
  });
});
