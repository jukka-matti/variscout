import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChartInsightChip from '../ChartInsightChip';

describe('ChartInsightChip', () => {
  const defaultProps = {
    text: 'Process shift detected',
    onDismiss: vi.fn(),
    chartType: 'ichart',
  };

  it('renders insight text', () => {
    render(<ChartInsightChip {...defaultProps} />);
    expect(screen.getByText('Process shift detected')).toBeDefined();
  });

  it('has correct data-testid', () => {
    render(<ChartInsightChip {...defaultProps} />);
    expect(screen.getByTestId('insight-chip-ichart')).toBeDefined();
  });

  it('renders null when text is empty', () => {
    const { container } = render(<ChartInsightChip {...defaultProps} text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders shimmer when loading', () => {
    render(<ChartInsightChip {...defaultProps} isLoading />);
    const chip = screen.getByTestId('insight-chip-ichart');
    expect(chip.className).toContain('animate-pulse');
  });

  it('calls onDismiss when X clicked', () => {
    const onDismiss = vi.fn();
    render(<ChartInsightChip {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stops event propagation on dismiss', () => {
    const onDismiss = vi.fn();
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <ChartInsightChip {...defaultProps} onDismiss={onDismiss} />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('applies suggestion style', () => {
    render(<ChartInsightChip {...defaultProps} chipType="suggestion" />);
    const chip = screen.getByTestId('insight-chip-ichart');
    expect(chip.className).toContain('bg-blue-500/10');
  });

  it('applies warning style', () => {
    render(<ChartInsightChip {...defaultProps} chipType="warning" />);
    const chip = screen.getByTestId('insight-chip-ichart');
    expect(chip.className).toContain('bg-amber-500/10');
  });

  it('applies info style by default', () => {
    render(<ChartInsightChip {...defaultProps} />);
    const chip = screen.getByTestId('insight-chip-ichart');
    expect(chip.className).toContain('bg-slate-500/10');
  });

  it('shows sparkle icon and AI label when isAI is true', () => {
    const { container } = render(<ChartInsightChip {...defaultProps} isAI />);
    const sparkle = container.querySelector('.text-purple-400');
    expect(sparkle).not.toBeNull();
    expect(screen.getByText('AI')).toBeDefined();
  });

  it('does not show sparkle icon or AI label when isAI is false', () => {
    const { container } = render(<ChartInsightChip {...defaultProps} isAI={false} />);
    const sparkle = container.querySelector('.text-purple-400');
    expect(sparkle).toBeNull();
    expect(screen.queryByText('AI')).toBeNull();
  });
});
