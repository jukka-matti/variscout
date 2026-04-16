import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportDefectKPIGrid } from '../ReportDefectKPIGrid';

describe('ReportDefectKPIGrid', () => {
  const baseProps = {
    totalDefects: 142,
    defectRate: 3.55,
    rateLabel: 'unit',
    sampleCount: 500,
  };

  it('renders total defects', () => {
    render(<ReportDefectKPIGrid {...baseProps} />);
    expect(screen.getByText('142')).toBeDefined();
    expect(screen.getByText('Total Defects')).toBeDefined();
  });

  it('renders defect rate with unit label', () => {
    render(<ReportDefectKPIGrid {...baseProps} />);
    expect(screen.getByText('3.55')).toBeDefined();
    expect(screen.getByText('/unit')).toBeDefined();
  });

  it('renders sample count', () => {
    render(<ReportDefectKPIGrid {...baseProps} />);
    expect(screen.getByText(/500 observations/)).toBeDefined();
  });

  it('renders top defect type when provided', () => {
    render(<ReportDefectKPIGrid {...baseProps} topDefectType="Scratch" topDefectPercent={45.2} />);
    expect(screen.getByText('Scratch')).toBeDefined();
    expect(screen.getByText('45.2% of total')).toBeDefined();
  });

  it('renders 80/20 pareto when provided', () => {
    render(<ReportDefectKPIGrid {...baseProps} paretoCount80={3} totalTypes={12} />);
    expect(screen.getByText('3 of 12')).toBeDefined();
    expect(screen.getByText('types account for 80%')).toBeDefined();
  });

  it('renders trend arrow when direction is up', () => {
    render(<ReportDefectKPIGrid {...baseProps} trendDirection="up" />);
    const arrow = screen.getByLabelText('Trend up');
    expect(arrow).toBeDefined();
  });

  it('renders trend arrow when direction is down', () => {
    render(<ReportDefectKPIGrid {...baseProps} trendDirection="down" />);
    const arrow = screen.getByLabelText('Trend down');
    expect(arrow).toBeDefined();
  });

  it('handles non-finite defect rate gracefully', () => {
    render(<ReportDefectKPIGrid {...baseProps} defectRate={NaN} />);
    expect(screen.getByText('--')).toBeDefined();
  });

  it('omits top defect type section when not provided', () => {
    render(<ReportDefectKPIGrid {...baseProps} />);
    expect(screen.queryByText('Top Defect Type')).toBeNull();
  });
});
