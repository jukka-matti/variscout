import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CapabilityHistogramBase } from '../CapabilityHistogram';

/** Generate N random-ish values centered around a mean */
function makeData(n: number, center = 10): number[] {
  return Array.from({ length: n }, (_, i) => center + Math.sin(i) * 2);
}

const defaultProps = {
  parentWidth: 800,
  parentHeight: 600,
  showBranding: false,
};

describe('CapabilityHistogramBase rendering', () => {
  it('returns null for empty data', () => {
    const { container } = render(
      <CapabilityHistogramBase data={[]} specs={{ usl: 15, lsl: 5 }} mean={10} {...defaultProps} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders an SVG with role="img"', () => {
    const data = makeData(30);
    const { container } = render(
      <CapabilityHistogramBase
        data={data}
        specs={{ usl: 15, lsl: 5 }}
        mean={10}
        {...defaultProps}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
    expect(svg!.getAttribute('aria-label')).toContain('histogram');
  });

  it('renders histogram bars', () => {
    const data = makeData(30);
    const { container } = render(
      <CapabilityHistogramBase
        data={data}
        specs={{ usl: 15, lsl: 5 }}
        mean={10}
        {...defaultProps}
      />
    );

    // Bars are rendered as <rect> elements inside the chart
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('shows spec limit lines when specs provided', () => {
    const data = makeData(30);
    const { container } = render(
      <CapabilityHistogramBase
        data={data}
        specs={{ usl: 15, lsl: 5 }}
        mean={10}
        {...defaultProps}
      />
    );

    // LSL and USL render as <line> elements (dashed), plus the mean line
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(3); // LSL + USL + mean
  });

  it('shows mean line', () => {
    const data = makeData(30);
    const { container } = render(
      <CapabilityHistogramBase data={data} specs={{}} mean={10} {...defaultProps} />
    );

    // Mean line is always rendered; at least 1 line element
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('renders without spec limits (empty specs)', () => {
    const data = makeData(30);
    const { container } = render(
      <CapabilityHistogramBase data={data} specs={{}} mean={10} {...defaultProps} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders with showBranding=true without error', () => {
    const data = makeData(30);
    const { container } = render(
      <CapabilityHistogramBase
        data={data}
        specs={{ usl: 15, lsl: 5 }}
        mean={10}
        {...defaultProps}
        showBranding={true}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
