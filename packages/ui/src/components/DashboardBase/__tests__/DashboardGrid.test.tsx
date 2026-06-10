/**
 * Tests for DashboardGrid — the chart-generous scroll layout.
 *
 * Focus: the ER-2 optional factor-strip band between the I-Chart and the
 * boxplot, and the I-Chart wrapper height switch when the strip is present.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardGrid from '../DashboardGrid';

const baseProps = {
  ichartCard: <div data-testid="ichart-card">I-Chart</div>,
  boxplotCard: <div data-testid="boxplot-card">Boxplot</div>,
};

describe('DashboardGrid', () => {
  it('renders the I-Chart and boxplot cards', () => {
    render(<DashboardGrid {...baseProps} />);
    expect(screen.getByTestId('ichart-card')).toBeDefined();
    expect(screen.getByTestId('boxplot-card')).toBeDefined();
  });

  it('does not render a factor-strip band when factorStrip is absent', () => {
    render(<DashboardGrid {...baseProps} />);
    expect(screen.queryByTestId('factor-strip-band')).toBeNull();
  });

  it('renders the factor-strip band when factorStrip is provided', () => {
    render(
      <DashboardGrid {...baseProps} factorStrip={<div data-testid="strip-content">Strip</div>} />
    );
    const band = screen.getByTestId('factor-strip-band');
    expect(band).toBeDefined();
    expect(screen.getByTestId('strip-content')).toBeDefined();
  });

  it('places the factor-strip band between the I-Chart and the boxplot', () => {
    const { container } = render(
      <DashboardGrid {...baseProps} factorStrip={<div data-testid="strip-content">Strip</div>} />
    );
    const order = Array.from(container.querySelectorAll('[data-testid]'))
      .map(el => el.getAttribute('data-testid'))
      .filter(id => ['ichart-card', 'factor-strip-band', 'boxplot-card'].includes(id ?? ''));
    expect(order).toEqual(['ichart-card', 'factor-strip-band', 'boxplot-card']);
  });

  it('uses the taller I-Chart deduction (240px) when the strip is absent', () => {
    const { container } = render(<DashboardGrid {...baseProps} />);
    const ichartWrapper = screen.getByTestId('ichart-card').parentElement!;
    expect(ichartWrapper.className).toContain('h-[calc(100dvh_-_240px)]');
    expect(ichartWrapper.className).toContain('min-h-[500px]');
    expect(container).toBeDefined();
  });

  it('grows the I-Chart deduction (356px) when the strip is present', () => {
    render(
      <DashboardGrid {...baseProps} factorStrip={<div data-testid="strip-content">Strip</div>} />
    );
    const ichartWrapper = screen.getByTestId('ichart-card').parentElement!;
    expect(ichartWrapper.className).toContain('h-[calc(100dvh_-_356px)]');
    expect(ichartWrapper.className).toContain('min-h-[440px]');
    expect(ichartWrapper.className).not.toContain('h-[calc(100dvh_-_240px)]');
  });

  it('keeps the factor-strip band flex-none (never shrinks)', () => {
    render(
      <DashboardGrid {...baseProps} factorStrip={<div data-testid="strip-content">Strip</div>} />
    );
    const band = screen.getByTestId('factor-strip-band');
    expect(band.className).toContain('flex-none');
    expect(band.className).toContain('shrink-0');
  });
});
