import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@variscout/charts', () => ({
  CapabilityHistogramBase: (props: Record<string, unknown>) => (
    <div data-testid="histogram-base" data-width={props.parentWidth} />
  ),
}));

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    shouldShowBranding: () => false,
    getBrandingText: () => '',
  };
});

import { CapabilityHistogram } from '../index';

describe('CapabilityHistogram', () => {
  const baseProps = {
    parentWidth: 800,
    parentHeight: 600,
    data: [1, 2, 3, 4, 5],
    specs: { usl: 6, lsl: 0 },
    mean: 3,
  };

  it('renders without comparison badge when cpkBefore/cpkAfter not provided', () => {
    render(<CapabilityHistogram {...baseProps} />);
    expect(screen.queryByTestId('cpk-comparison-badge')).toBeNull();
  });

  it('renders comparison badge when both cpkBefore and cpkAfter provided', () => {
    render(<CapabilityHistogram {...baseProps} cpkBefore={0.89} cpkAfter={1.32} />);
    const badge = screen.getByTestId('cpk-comparison-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain('0.89');
    expect(badge.textContent).toContain('1.32');
    expect(badge.textContent).toContain('+0.43');
  });

  it('shows green color class for improved Cpk (delta > 0.05)', () => {
    render(<CapabilityHistogram {...baseProps} cpkBefore={0.5} cpkAfter={1.0} />);
    const badge = screen.getByTestId('cpk-comparison-badge');
    const deltaSpan = badge.querySelector('.text-green-500');
    expect(deltaSpan).not.toBeNull();
  });

  it('shows red color class for degraded Cpk (delta < -0.05)', () => {
    render(<CapabilityHistogram {...baseProps} cpkBefore={1.5} cpkAfter={0.8} />);
    const badge = screen.getByTestId('cpk-comparison-badge');
    const deltaSpan = badge.querySelector('.text-red-400');
    expect(deltaSpan).not.toBeNull();
  });

  it('shows amber color class for marginal change (|delta| <= 0.05)', () => {
    render(<CapabilityHistogram {...baseProps} cpkBefore={1.0} cpkAfter={1.03} />);
    const badge = screen.getByTestId('cpk-comparison-badge');
    const deltaSpan = badge.querySelector('.text-amber-500');
    expect(deltaSpan).not.toBeNull();
  });

  it('does not render badge when only cpkBefore is provided', () => {
    render(<CapabilityHistogram {...baseProps} cpkBefore={0.89} />);
    expect(screen.queryByTestId('cpk-comparison-badge')).toBeNull();
  });
});
