import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCategorySheet } from '../MobileCategorySheet';
import type { MobileCategorySheetData, MobileCategorySheetProps } from '../MobileCategorySheet';

const boxplotData: MobileCategorySheetData = {
  categoryKey: 'Shift B',
  chartType: 'boxplot',
  sampleN: 47,
  mean: 12.6,
  median: 12.4,
  iqr: 1.8,
  stdDev: 0.9,
  contributionPct: 38,
};

const paretoData: MobileCategorySheetData = {
  categoryKey: 'Machine 3',
  chartType: 'pareto',
  contributionPct: 42,
};

const defaultProps: MobileCategorySheetProps = {
  data: boxplotData,
  factor: 'Shift',
  onDrillDown: vi.fn(),
  onSetHighlight: vi.fn(),
  onPinFinding: vi.fn(),
  onClose: vi.fn(),
};

describe('MobileCategorySheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when data is null', () => {
    const { container } = render(<MobileCategorySheet {...defaultProps} data={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders category name in header', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    expect(screen.getByTestId('category-sheet-title').textContent).toBe('Shift B');
  });

  it('shows boxplot stats (n, mean, median, IQR, contribution)', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    const stats = screen.getByTestId('category-sheet-stats');
    expect(stats.textContent).toContain('47');
    expect(stats.textContent).toContain('12.60');
    expect(stats.textContent).toContain('12.40');
    expect(stats.textContent).toContain('1.80');
    expect(stats.textContent).toContain('38%');
  });

  it('shows pareto stats (contribution only)', () => {
    render(<MobileCategorySheet {...defaultProps} data={paretoData} />);
    const stats = screen.getByTestId('category-sheet-stats');
    expect(stats.textContent).toContain('42%');
    expect(stats.textContent).not.toContain('Mean');
  });

  it('calls onDrillDown and onClose when drill-down button is clicked', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    fireEvent.click(screen.getByTestId('category-sheet-drill-down'));
    expect(defaultProps.onDrillDown).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    fireEvent.click(screen.getByTestId('category-sheet-backdrop'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('sets highlight color on tap', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('red highlight'));
    expect(defaultProps.onSetHighlight).toHaveBeenCalledWith('red');
  });

  it('clears highlight when tapping same color twice', () => {
    render(<MobileCategorySheet {...defaultProps} currentHighlight="red" />);
    fireEvent.click(screen.getByLabelText('red highlight (active)'));
    expect(defaultProps.onSetHighlight).toHaveBeenCalledWith(undefined);
  });

  it('clears highlight via clear button', () => {
    render(<MobileCategorySheet {...defaultProps} currentHighlight="amber" />);
    fireEvent.click(screen.getByLabelText('Clear highlight'));
    expect(defaultProps.onSetHighlight).toHaveBeenCalledWith(undefined);
  });

  it('renders all 3 highlight color options plus clear', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    expect(screen.getByLabelText('red highlight')).toBeTruthy();
    expect(screen.getByLabelText('amber highlight')).toBeTruthy();
    expect(screen.getByLabelText('green highlight')).toBeTruthy();
    expect(screen.getByLabelText('Clear highlight')).toBeTruthy();
  });

  it('pins finding with note text', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    const textarea = screen.getByTestId('category-sheet-note');
    fireEvent.change(textarea, { target: { value: 'Shift B runs hot' } });
    fireEvent.click(screen.getByTestId('category-sheet-pin-finding'));
    expect(defaultProps.onPinFinding).toHaveBeenCalledWith('Shift B runs hot');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('pins finding with empty note when no text entered', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    fireEvent.click(screen.getByTestId('category-sheet-pin-finding'));
    expect(defaultProps.onPinFinding).toHaveBeenCalledWith('');
  });

  it('does not render pin-finding section when onPinFinding is not provided', () => {
    render(<MobileCategorySheet {...defaultProps} onPinFinding={undefined} />);
    expect(screen.queryByTestId('category-sheet-note')).toBeNull();
    expect(screen.queryByTestId('category-sheet-pin-finding')).toBeNull();
  });

  it('dismisses on swipe down >60px', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    const sheet = screen.getByTestId('mobile-category-sheet');
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 200 }] });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss on small vertical touch movement', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    const sheet = screen.getByTestId('mobile-category-sheet');
    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 130 }] });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('has dialog role and accessible label', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    const sheet = screen.getByRole('dialog');
    expect(sheet.getAttribute('aria-label')).toBe('Actions for Shift B');
  });

  it('renders drill-down button with category name', () => {
    render(<MobileCategorySheet {...defaultProps} />);
    const btn = screen.getByTestId('category-sheet-drill-down');
    expect(btn.textContent).toContain('Drill down into');
    expect(btn.textContent).toContain('Shift B');
  });
});
