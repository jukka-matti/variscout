/**
 * Tests for DashboardChartCard component
 *
 * Validates: observation count badge rendering, export buttons, maximize button,
 * share button, and basic card structure.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardChartCard from '../DashboardChartCard';
import type { DashboardChartCardProps } from '../DashboardChartCard';

const defaultProps: DashboardChartCardProps = {
  id: 'chart-boxplot',
  testId: 'chart-boxplot',
  title: <span>Boxplot</span>,
  chartName: 'Boxplot',
  children: <div data-testid="chart-content">Chart here</div>,
};

describe('DashboardChartCard', () => {
  it('renders title and children', () => {
    render(<DashboardChartCard {...defaultProps} />);
    expect(screen.getByText('Boxplot')).toBeDefined();
    expect(screen.getByTestId('chart-content')).toBeDefined();
  });

  it('renders with data-testid', () => {
    render(<DashboardChartCard {...defaultProps} />);
    expect(screen.getByTestId('chart-boxplot')).toBeDefined();
  });

  // --- observationCount badge ---

  it('shows observation count badge when observationCount > 0', () => {
    render(<DashboardChartCard {...defaultProps} observationCount={3} />);
    const badge = screen.getByTestId('observation-count-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe('3');
  });

  it('shows observation count badge with value 1', () => {
    render(<DashboardChartCard {...defaultProps} observationCount={1} />);
    const badge = screen.getByTestId('observation-count-badge');
    expect(badge.textContent).toBe('1');
  });

  it('hides observation count badge when observationCount is 0', () => {
    render(<DashboardChartCard {...defaultProps} observationCount={0} />);
    expect(screen.queryByTestId('observation-count-badge')).toBeNull();
  });

  it('hides observation count badge when observationCount is undefined', () => {
    render(<DashboardChartCard {...defaultProps} />);
    expect(screen.queryByTestId('observation-count-badge')).toBeNull();
  });

  // --- maximize button ---

  it('renders maximize button when onMaximize is provided', () => {
    const onMaximize = vi.fn();
    render(<DashboardChartCard {...defaultProps} onMaximize={onMaximize} />);
    const btn = screen.getByLabelText('Maximize chart');
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onMaximize).toHaveBeenCalled();
  });

  it('does not render maximize button when onMaximize is not provided', () => {
    render(<DashboardChartCard {...defaultProps} />);
    expect(screen.queryByLabelText('Maximize chart')).toBeNull();
  });

  // --- export buttons ---

  it('renders copy and download buttons when all export handlers are provided', () => {
    render(
      <DashboardChartCard
        {...defaultProps}
        onCopyChart={vi.fn()}
        onDownloadPng={vi.fn()}
        onDownloadSvg={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Copy Boxplot to clipboard')).toBeDefined();
  });

  it('does not render export buttons when handlers are missing', () => {
    render(<DashboardChartCard {...defaultProps} />);
    expect(screen.queryByLabelText('Copy Boxplot to clipboard')).toBeNull();
  });

  it('shows check icon when copyFeedback matches chartName', () => {
    render(
      <DashboardChartCard
        {...defaultProps}
        copyFeedback="Boxplot"
        onCopyChart={vi.fn()}
        onDownloadPng={vi.fn()}
        onDownloadSvg={vi.fn()}
      />
    );
    // Copy button should have green feedback class
    const copyBtn = screen.getByLabelText('Copy Boxplot to clipboard');
    expect(copyBtn.className).toContain('bg-green-500/20');
  });

  // --- share button ---

  it('renders share button when onShareChart is provided', () => {
    const onShare = vi.fn();
    render(<DashboardChartCard {...defaultProps} onShareChart={onShare} />);
    const btn = screen.getByLabelText('Share Boxplot');
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onShare).toHaveBeenCalledWith('Boxplot');
  });

  it('does not render share button when onShareChart is not provided', () => {
    render(<DashboardChartCard {...defaultProps} />);
    expect(screen.queryByLabelText(/Share/)).toBeNull();
  });

  // --- footer slot ---

  it('renders footer content when provided', () => {
    render(
      <DashboardChartCard {...defaultProps} footer={<div data-testid="card-footer">Footer</div>} />
    );
    expect(screen.getByTestId('card-footer')).toBeDefined();
  });

  // --- filter bar slot ---

  it('renders filterBar content when provided', () => {
    render(
      <DashboardChartCard
        {...defaultProps}
        filterBar={<div data-testid="filter-bar">Filters</div>}
      />
    );
    expect(screen.getByTestId('filter-bar')).toBeDefined();
  });

  // --- click handler (embed mode) ---

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<DashboardChartCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('chart-boxplot'));
    expect(onClick).toHaveBeenCalled();
  });
});
