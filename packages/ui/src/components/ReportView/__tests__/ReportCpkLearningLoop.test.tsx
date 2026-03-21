import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportCpkLearningLoop } from '../ReportCpkLearningLoop';

describe('ReportCpkLearningLoop', () => {
  it('renders with default Cpk label', () => {
    render(<ReportCpkLearningLoop valueBefore={1.0} valueAfter={1.5} />);
    // Default metricLabel "Cpk" appears in the delta text
    expect(screen.getByText('+0.50 Cpk')).toBeDefined();
    expect(screen.getByText('1.00')).toBeDefined();
    expect(screen.getByText('1.50')).toBeDefined();
  });

  it('renders with custom metric label', () => {
    render(
      <ReportCpkLearningLoop
        valueBefore={0.45}
        valueAfter={0.68}
        metricLabel="VA Ratio"
        formatValue={v => `${Math.round(v * 100)}%`}
      />
    );
    // Custom metricLabel appears in the delta text
    expect(screen.getByText('+0.23 VA Ratio')).toBeDefined();
    expect(screen.getByText('45%')).toBeDefined();
    expect(screen.getByText('68%')).toBeDefined();
  });

  it('uses default 2-decimal format when no formatValue provided', () => {
    render(<ReportCpkLearningLoop valueBefore={1.333} valueAfter={1.667} />);
    expect(screen.getByText('1.33')).toBeDefined();
    expect(screen.getByText('1.67')).toBeDefined();
  });

  it('renders before/projected/actual timeline', () => {
    render(
      <ReportCpkLearningLoop
        valueBefore={0.8}
        projectedValue={1.2}
        valueAfter={1.15}
        verdict="yes"
      />
    );
    expect(screen.getByTestId('report-cpk-learning-loop')).toBeDefined();
    expect(screen.getByText('0.80')).toBeDefined();
    expect(screen.getByText('1.20')).toBeDefined();
    expect(screen.getByText('1.15')).toBeDefined();
  });

  it('handles null valueAfter (pending state)', () => {
    render(<ReportCpkLearningLoop valueBefore={0.8} projectedValue={1.2} />);
    expect(screen.getByTestId('report-cpk-learning-loop')).toBeDefined();
    expect(screen.getByText('0.80')).toBeDefined();
    // valueAfter renders as dash
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('renders verdict label for each verdict type', () => {
    const { rerender } = render(
      <ReportCpkLearningLoop valueBefore={0.8} valueAfter={1.2} verdict="yes" />
    );
    expect(screen.getByTestId('report-cpk-learning-loop')).toBeDefined();

    rerender(<ReportCpkLearningLoop valueBefore={0.8} valueAfter={0.9} verdict="partial" />);
    expect(screen.getByTestId('report-cpk-learning-loop')).toBeDefined();

    rerender(<ReportCpkLearningLoop valueBefore={0.8} valueAfter={0.7} verdict="no" />);
    expect(screen.getByTestId('report-cpk-learning-loop')).toBeDefined();
  });

  it('returns null when no data', () => {
    const { container } = render(<ReportCpkLearningLoop />);
    expect(container.innerHTML).toBe('');
  });

  it('renders without projected value', () => {
    render(<ReportCpkLearningLoop valueBefore={0.8} valueAfter={1.1} verdict="yes" />);
    expect(screen.getByText('0.80')).toBeDefined();
    expect(screen.getByText('1.10')).toBeDefined();
  });

  it('shows delta when before and after are present', () => {
    render(<ReportCpkLearningLoop valueBefore={0.8} valueAfter={1.15} verdict="yes" />);
    expect(screen.getByText('+0.35 Cpk')).toBeDefined();
  });

  it('shows negative delta when actual is worse', () => {
    render(<ReportCpkLearningLoop valueBefore={1.2} valueAfter={0.9} verdict="no" />);
    expect(screen.getByText('-0.30 Cpk')).toBeDefined();
  });

  it('shows custom metric label in delta text', () => {
    render(
      <ReportCpkLearningLoop
        valueBefore={0.5}
        valueAfter={0.8}
        metricLabel="VA Ratio"
        formatValue={v => v.toFixed(2)}
        verdict="yes"
      />
    );
    expect(screen.getByText('+0.30 VA Ratio')).toBeDefined();
  });

  it('uses custom formatValue for projected value', () => {
    render(
      <ReportCpkLearningLoop
        valueBefore={0.5}
        projectedValue={0.75}
        valueAfter={0.8}
        formatValue={v => `${Math.round(v * 100)}%`}
      />
    );
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('75%')).toBeDefined();
    expect(screen.getByText('80%')).toBeDefined();
  });
});
