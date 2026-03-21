import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportYamazumiKPIGrid } from '../ReportYamazumiKPIGrid';
import type { YamazumiSummary } from '@variscout/core';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockSummary: YamazumiSummary = {
  totalLeadTime: 480,
  vaTime: 216,
  nvaTime: 96,
  wasteTime: 120,
  waitTime: 48,
  vaRatio: 0.45,
  processEfficiency: 0.692,
  taktTime: 60,
  stepsOverTakt: ['Pick', 'Wave Solder', 'Test'],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportYamazumiKPIGrid', () => {
  it('renders VA Ratio as percentage', () => {
    render(<ReportYamazumiKPIGrid summary={mockSummary} />);
    expect(screen.getByText('45%')).toBeDefined();
  });

  it('renders takt time', () => {
    render(<ReportYamazumiKPIGrid summary={mockSummary} />);
    expect(screen.getByText('60s')).toBeDefined();
  });

  it('renders steps over takt count and names', () => {
    render(<ReportYamazumiKPIGrid summary={mockSummary} />);
    expect(screen.getByText('3 steps')).toBeDefined();
    expect(screen.getByText(/Pick/)).toBeDefined();
  });

  it('truncates step names when more than 3', () => {
    const summary = { ...mockSummary, stepsOverTakt: ['A', 'B', 'C', 'D', 'E'] };
    render(<ReportYamazumiKPIGrid summary={summary} />);
    expect(screen.getByText('5 steps')).toBeDefined();
    expect(screen.getByText(/\+2 more/)).toBeDefined();
  });

  it('shows green when no steps over takt', () => {
    const summary = { ...mockSummary, stepsOverTakt: [], taktTime: 100 };
    const { container } = render(<ReportYamazumiKPIGrid summary={summary} />);
    expect(screen.getByText('0 steps')).toBeDefined();
    const greenValue = container.querySelector('.text-green-600, .text-green-400');
    expect(greenValue).not.toBeNull();
  });

  it('shows dash when takt time not set', () => {
    const summary = { ...mockSummary, taktTime: undefined, stepsOverTakt: [] };
    render(<ReportYamazumiKPIGrid summary={summary} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders process efficiency as percentage', () => {
    render(<ReportYamazumiKPIGrid summary={mockSummary} />);
    expect(screen.getByText('69%')).toBeDefined();
  });

  it('applies red color when VA ratio is below 30%', () => {
    const summary = { ...mockSummary, vaRatio: 0.25 };
    const { container } = render(<ReportYamazumiKPIGrid summary={summary} />);
    const redValue = container.querySelector('.text-red-600, .text-red-400');
    expect(redValue).not.toBeNull();
  });

  it('applies green color when VA ratio is above 50%', () => {
    const summary = { ...mockSummary, vaRatio: 0.55 };
    const { container } = render(<ReportYamazumiKPIGrid summary={summary} />);
    const greenValue = container.querySelector('.text-green-600, .text-green-400');
    expect(greenValue).not.toBeNull();
  });
});
