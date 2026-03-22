import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportPerformanceKPIGrid } from '../ReportPerformanceKPIGrid';

const props = {
  totalChannels: 16,
  passingChannels: 12,
  worstCpk: 0.85,
  worstChannelName: 'Head 7',
  meanCpk: 1.28,
  cpkTarget: 1.33,
};

describe('ReportPerformanceKPIGrid', () => {
  it('renders channel pass count', () => {
    render(<ReportPerformanceKPIGrid {...props} />);
    expect(screen.getByText('12/16')).toBeInTheDocument();
  });

  it('renders worst channel with name', () => {
    render(<ReportPerformanceKPIGrid {...props} />);
    expect(screen.getByText('0.85')).toBeInTheDocument();
    expect(screen.getByText('Head 7')).toBeInTheDocument();
  });

  it('colors worst Cpk red when below 1.0', () => {
    const { container } = render(<ReportPerformanceKPIGrid {...props} />);
    const worstValue = container.querySelector('[data-testid="worst-cpk"]');
    expect(worstValue?.className).toContain('text-red');
  });

  it('renders mean Cpk', () => {
    render(<ReportPerformanceKPIGrid {...props} />);
    expect(screen.getByText('1.28')).toBeInTheDocument();
  });

  it('shows target subtitle', () => {
    render(<ReportPerformanceKPIGrid {...props} />);
    expect(screen.getByText('target: 1.33')).toBeInTheDocument();
  });

  it('colors channels green when all passing', () => {
    const { container } = render(<ReportPerformanceKPIGrid {...props} passingChannels={16} />);
    expect(container.querySelector('.text-green-600, .text-green-400')).not.toBeNull();
  });
});
