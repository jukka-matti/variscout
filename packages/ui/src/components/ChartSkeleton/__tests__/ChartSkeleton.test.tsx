import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartSkeleton from '../ChartSkeleton';

describe('ChartSkeleton', () => {
  it('renders the default testid', () => {
    render(<ChartSkeleton />);
    expect(screen.getByTestId('chart-skeleton')).toBeDefined();
  });

  it('accepts a custom testid', () => {
    render(<ChartSkeleton testId="ichart-skeleton" />);
    expect(screen.getByTestId('ichart-skeleton')).toBeDefined();
  });

  it('uses the house pulse pattern (animate-pulse on declared surface token)', () => {
    render(<ChartSkeleton />);
    const root = screen.getByTestId('chart-skeleton');
    // axis rail + plot band + bottom bar all pulse on bg-surface-tertiary
    const pulses = root.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThanOrEqual(3);
    pulses.forEach(el => {
      expect(el.className).toContain('bg-surface-tertiary');
    });
  });

  it('is aria-hidden (decorative placeholder)', () => {
    render(<ChartSkeleton />);
    expect(screen.getByTestId('chart-skeleton').getAttribute('aria-hidden')).toBe('true');
  });
});
