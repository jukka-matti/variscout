/**
 * Tests for ImprovementSummaryBar component
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    tf: (key: string, _params: Record<string, unknown>) => key,
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { ImprovementSummaryBar } from '../ImprovementSummaryBar';
import type { ImprovementSummaryBarProps } from '../ImprovementSummaryBar';

const defaultProps: ImprovementSummaryBarProps = {
  selectedCount: 3,
  timeframeBreakdown: { 'just-do': 1, days: 1, weeks: 0, months: 1 },
};

describe('ImprovementSummaryBar', () => {
  it('renders the selected count', () => {
    render(<ImprovementSummaryBar {...defaultProps} />);
    const countEl = screen.getByTestId('summary-selected-count');
    // tf returns the key
    expect(countEl.textContent).toBe('improve.selectedCount');
  });

  it('renders timeframe breakdown with correct values', () => {
    render(<ImprovementSummaryBar {...defaultProps} />);
    const breakdown = screen.getByTestId('summary-timeframe-breakdown');
    // Check that the numeric values appear in the breakdown
    expect(breakdown.textContent).toContain('1');
    expect(breakdown.textContent).toContain('0');
  });

  it('renders timeframe values in colored spans', () => {
    render(
      <ImprovementSummaryBar
        {...defaultProps}
        timeframeBreakdown={{ 'just-do': 2, days: 3, weeks: 4, months: 5 }}
      />
    );
    const breakdown = screen.getByTestId('summary-timeframe-breakdown');
    const spans = breakdown.querySelectorAll('span');
    // First colored span: just-do (green)
    const justDoSpan = spans[0];
    expect(justDoSpan.textContent).toBe('2');
    expect(justDoSpan.className).toContain('text-green-500');
    // Second: days (cyan)
    const daysSpan = spans[1];
    expect(daysSpan.textContent).toBe('3');
    expect(daysSpan.className).toContain('text-cyan-500');
    // Third: weeks (amber)
    const weeksSpan = spans[2];
    expect(weeksSpan.textContent).toBe('4');
    expect(weeksSpan.className).toContain('text-amber-500');
    // Fourth: months (red)
    const monthsSpan = spans[3];
    expect(monthsSpan.textContent).toBe('5');
    expect(monthsSpan.className).toContain('text-red-400');
  });

  it('renders max risk with correct color class', () => {
    render(<ImprovementSummaryBar {...defaultProps} maxRisk="high" />);
    const riskEl = screen.getByTestId('summary-max-risk');
    expect(riskEl.className).toContain('text-red-400');
    expect(riskEl.textContent).toContain('improve.maxRisk');
  });

  it('renders max risk very-high with red-600', () => {
    render(<ImprovementSummaryBar {...defaultProps} maxRisk="very-high" />);
    const riskEl = screen.getByTestId('summary-max-risk');
    expect(riskEl.className).toContain('text-red-600');
  });

  it('renders max risk low with green', () => {
    render(<ImprovementSummaryBar {...defaultProps} maxRisk="low" />);
    const riskEl = screen.getByTestId('summary-max-risk');
    expect(riskEl.className).toContain('text-green-500');
  });

  it('does not render max risk when not provided', () => {
    render(<ImprovementSummaryBar {...defaultProps} />);
    expect(screen.queryByTestId('summary-max-risk')).toBeNull();
  });

  it('renders cost total when totalCost is provided without budget', () => {
    render(<ImprovementSummaryBar {...defaultProps} totalCost={5000} />);
    const costEl = screen.getByTestId('summary-cost');
    // tf('improve.totalCost', ...) returns the key
    expect(costEl.textContent).toBe('improve.totalCost');
  });

  it('renders budget status when both totalCost and budget are set', () => {
    render(<ImprovementSummaryBar {...defaultProps} totalCost={3000} budget={10000} />);
    const costEl = screen.getByTestId('summary-cost');
    expect(costEl.textContent).toBe('improve.budgetStatus');
  });

  it('does not render cost element when totalCost is 0', () => {
    render(<ImprovementSummaryBar {...defaultProps} totalCost={0} />);
    expect(screen.queryByTestId('summary-cost')).toBeNull();
  });

  it('does not render cost element when totalCost is not provided', () => {
    render(<ImprovementSummaryBar {...defaultProps} />);
    expect(screen.queryByTestId('summary-cost')).toBeNull();
  });

  it('renders convert button when onConvertToActions is provided', () => {
    const onConvert = vi.fn();
    render(<ImprovementSummaryBar {...defaultProps} onConvertToActions={onConvert} />);
    const btn = screen.getByTestId('summary-convert-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe('improve.convertToActions');
  });

  it('does not render convert button when onConvertToActions is not provided', () => {
    render(<ImprovementSummaryBar {...defaultProps} />);
    expect(screen.queryByTestId('summary-convert-btn')).toBeNull();
  });

  it('convert button is disabled when selectedCount is 0', () => {
    const onConvert = vi.fn();
    render(
      <ImprovementSummaryBar {...defaultProps} selectedCount={0} onConvertToActions={onConvert} />
    );
    const btn = screen.getByTestId('summary-convert-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('convert button is disabled when convertDisabled is true', () => {
    const onConvert = vi.fn();
    render(
      <ImprovementSummaryBar {...defaultProps} onConvertToActions={onConvert} convertDisabled />
    );
    const btn = screen.getByTestId('summary-convert-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('convert button is enabled when selectedCount > 0 and convertDisabled is false', () => {
    const onConvert = vi.fn();
    render(
      <ImprovementSummaryBar {...defaultProps} selectedCount={5} onConvertToActions={onConvert} />
    );
    const btn = screen.getByTestId('summary-convert-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('calls onConvertToActions when convert button is clicked', () => {
    const onConvert = vi.fn();
    render(
      <ImprovementSummaryBar {...defaultProps} selectedCount={2} onConvertToActions={onConvert} />
    );
    fireEvent.click(screen.getByTestId('summary-convert-btn'));
    expect(onConvert).toHaveBeenCalledOnce();
  });

  it('renders projected Cpk when provided', () => {
    render(<ImprovementSummaryBar {...defaultProps} projectedCpk={1.45} />);
    const cpkEl = screen.getByTestId('summary-projected-cpk');
    expect(cpkEl.textContent).toContain('improve.projectedCpk');
  });

  it('renders Cpk delta when both projectedCpk and targetCpk are provided', () => {
    render(<ImprovementSummaryBar {...defaultProps} projectedCpk={1.45} targetCpk={1.33} />);
    const deltaEl = screen.getByTestId('summary-cpk-delta');
    expect(deltaEl.textContent).toContain('improve.targetDelta');
    // Positive delta => green
    expect(deltaEl.className).toContain('text-green-500');
  });

  it('renders negative Cpk delta in red', () => {
    render(<ImprovementSummaryBar {...defaultProps} projectedCpk={1.0} targetCpk={1.33} />);
    const deltaEl = screen.getByTestId('summary-cpk-delta');
    expect(deltaEl.className).toContain('text-red-400');
  });

  it('does not render projected Cpk when not provided', () => {
    render(<ImprovementSummaryBar {...defaultProps} />);
    expect(screen.queryByTestId('summary-projected-cpk')).toBeNull();
  });

  it('renders the summary bar container with correct test id', () => {
    render(<ImprovementSummaryBar {...defaultProps} />);
    expect(screen.getByTestId('improvement-summary-bar')).toBeTruthy();
  });
});
