import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportActivityBreakdown } from '../ReportActivityBreakdown';
import type { YamazumiBarData } from '@variscout/core';

const mockBarData: YamazumiBarData = {
  key: 'Wave Solder',
  totalTime: 60,
  segments: [
    { activityType: 'va', totalTime: 28, percentage: 0.467, count: 10 },
    { activityType: 'nva-required', totalTime: 10, percentage: 0.167, count: 5 },
    { activityType: 'waste', totalTime: 18, percentage: 0.3, count: 8 },
    { activityType: 'wait', totalTime: 4, percentage: 0.067, count: 3 },
  ],
};

describe('ReportActivityBreakdown', () => {
  it('renders step name as heading', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    expect(screen.getByText(/Wave Solder/)).toBeDefined();
  });

  it('renders all activity types with times', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    expect(screen.getByText('28s')).toBeDefined();
    expect(screen.getByText('10s')).toBeDefined();
    expect(screen.getByText('18s')).toBeDefined();
    expect(screen.getByText('4s')).toBeDefined();
  });

  it('renders activity type labels', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    expect(screen.getByText('Value-Adding')).toBeDefined();
    expect(screen.getByText('NVA Required')).toBeDefined();
    expect(screen.getByText('Waste')).toBeDefined();
    expect(screen.getByText('Wait')).toBeDefined();
  });

  it('shows lean tooltips on activity type labels', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    const wasteLabel = screen.getByText('Waste');
    expect(wasteLabel.getAttribute('title')).toContain('Eliminate');
  });
});
