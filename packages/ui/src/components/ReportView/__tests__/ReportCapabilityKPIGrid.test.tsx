import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportCapabilityKPIGrid } from '../ReportCapabilityKPIGrid';

const props = {
  meanCpk: 1.45,
  meanCp: 1.62,
  cpkTarget: 1.33,
  subgroupCount: 20,
  passingCount: 18,
};

describe('ReportCapabilityKPIGrid', () => {
  it('renders mean Cpk with value', () => {
    render(<ReportCapabilityKPIGrid {...props} />);
    expect(screen.getByText('1.45')).toBeDefined();
    expect(screen.getByText(/mean cpk/i)).toBeDefined();
  });

  it('renders % passing', () => {
    render(<ReportCapabilityKPIGrid {...props} />);
    expect(screen.getByText('90%')).toBeDefined();
  });

  it('renders centering loss', () => {
    render(<ReportCapabilityKPIGrid {...props} />);
    expect(screen.getByText('0.17')).toBeDefined(); // 1.62 - 1.45
  });

  it('hides Cp when undefined (one-sided specs)', () => {
    render(<ReportCapabilityKPIGrid {...props} meanCp={undefined} />);
    expect(screen.queryByText(/mean cp$/i)).toBeNull();
  });

  it('shows green for Cpk above target', () => {
    const { container } = render(<ReportCapabilityKPIGrid {...props} />);
    expect(container.querySelector('.text-green-600, .text-green-400')).not.toBeNull();
  });

  it('shows subgroup count subtitle', () => {
    render(<ReportCapabilityKPIGrid {...props} />);
    expect(screen.getByText('18/20 subgroups')).toBeDefined();
  });
});
