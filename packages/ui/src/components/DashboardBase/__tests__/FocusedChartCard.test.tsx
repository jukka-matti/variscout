/**
 * Tests for FocusedChartCard — focused (maximized) chart card.
 *
 * Covers the svg-paint skeleton overlay (the maximize path's blank-window fix:
 * the overlay holds until the chart's svg actually paints) alongside the basic
 * header/exit structure.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FocusedChartCard from '../FocusedChartCard';
import type { FocusedChartCardProps } from '../FocusedChartCard';
import { flushRaf } from '../../../test-utils/raf';

const defaultProps: FocusedChartCardProps = {
  id: 'ichart-focus',
  header: <span>I-Chart</span>,
  chartName: 'ichart',
  onExit: vi.fn(),
  children: <div data-testid="focus-content">Focused chart</div>,
};

describe('FocusedChartCard', () => {
  it('renders the header and exit control', () => {
    render(<FocusedChartCard {...defaultProps} />);
    expect(screen.getByText('I-Chart')).toBeDefined();
    expect(screen.getByLabelText('Exit focus mode')).toBeDefined();
  });

  it('calls onExit when the exit button is clicked', () => {
    const onExit = vi.fn();
    render(<FocusedChartCard {...defaultProps} onExit={onExit} />);
    fireEvent.click(screen.getByLabelText('Exit focus mode'));
    expect(onExit).toHaveBeenCalled();
  });

  // --- skeleton overlay (svg-paint latch) ---

  const childrenWithSvg = (
    <div data-testid="focus-content">
      <svg data-testid="focus-svg" />
    </div>
  );

  it('mounts children underneath the skeleton overlay (overlay, not swap)', () => {
    render(<FocusedChartCard {...defaultProps} />);
    // defaultProps.children has no <svg> → overlay stays up, children mounted.
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
    expect(screen.getByTestId('focus-content')).toBeDefined();
  });

  it('hides the overlay once the slot contains an svg', async () => {
    render(<FocusedChartCard {...defaultProps}>{childrenWithSvg}</FocusedChartCard>);
    expect(screen.getByTestId('focus-svg')).toBeDefined();
    await flushRaf();
    expect(screen.queryByTestId('chart-skeleton')).toBeNull();
    expect(screen.getByTestId('focus-content')).toBeDefined();
  });

  it('keeps the overlay while isLoading is true even with an svg present', async () => {
    render(
      <FocusedChartCard {...defaultProps} isLoading>
        {childrenWithSvg}
      </FocusedChartCard>
    );
    await flushRaf();
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
  });

  it('drops the overlay when isLoading flips false with an svg painted', async () => {
    const { rerender } = render(
      <FocusedChartCard {...defaultProps} isLoading>
        {childrenWithSvg}
      </FocusedChartCard>
    );
    await flushRaf();
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
    rerender(
      <FocusedChartCard {...defaultProps} isLoading={false}>
        {childrenWithSvg}
      </FocusedChartCard>
    );
    await flushRaf();
    expect(screen.queryByTestId('chart-skeleton')).toBeNull();
  });

  it('latches: once hidden, isLoading true again does NOT bring the overlay back', async () => {
    const { rerender } = render(
      <FocusedChartCard {...defaultProps}>{childrenWithSvg}</FocusedChartCard>
    );
    await flushRaf();
    expect(screen.queryByTestId('chart-skeleton')).toBeNull();
    rerender(
      <FocusedChartCard {...defaultProps} isLoading>
        {childrenWithSvg}
      </FocusedChartCard>
    );
    await flushRaf();
    expect(screen.queryByTestId('chart-skeleton')).toBeNull();
  });
});
