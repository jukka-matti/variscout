import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BoxplotBase } from '../Boxplot';
import type { BoxplotGroupData } from '../types';

/** Helper to create a BoxplotGroupData entry with N values */
function makeGroup(key: string, values: number[]): BoxplotGroupData {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const min = sorted[0];
  const max = sorted[n - 1];
  const q1 = sorted[Math.floor(n * 0.25)] ?? min;
  const median = sorted[Math.floor(n * 0.5)] ?? mean;
  const q3 = sorted[Math.floor(n * 0.75)] ?? max;
  return { key, values: sorted, min, q1, median, q3, max, mean, outliers: [] };
}

const defaultProps = {
  parentWidth: 600,
  parentHeight: 400,
  specs: { usl: 20, lsl: 0 },
  showBranding: false,
};

describe('BoxplotBase rendering', () => {
  it('returns null for empty data', () => {
    const { container } = render(<BoxplotBase data={[]} {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders an SVG with role="img" and aria-label', () => {
    const data = [makeGroup('GroupA', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
    expect(svg!.getAttribute('aria-label')).toContain('Boxplot');
  });

  it('renders spec limit lines when specs are provided', () => {
    const data = [makeGroup('GroupA', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(
      <BoxplotBase data={data} {...defaultProps} specs={{ usl: 12, lsl: 0 }} />
    );

    // Spec limits are rendered as <line> elements
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(2); // at least USL and LSL
  });

  it('renders without spec limits (empty specs)', () => {
    const data = [makeGroup('GroupA', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} specs={{}} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders box elements with data-testid for each group', () => {
    const data = [
      makeGroup('Alpha', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      makeGroup('Beta', [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    ];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    const boxAlpha = container.querySelector('[data-testid="boxplot-box-Alpha"]');
    const boxBeta = container.querySelector('[data-testid="boxplot-box-Beta"]');
    expect(boxAlpha).not.toBeNull();
    expect(boxBeta).not.toBeNull();
  });

  it('renders group labels on X-axis', () => {
    const data = [makeGroup('Machine1', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    // X-axis tick labels should contain the group key
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents.some(t => t?.includes('Machine1'))).toBe(true);
  });

  it('reflects custom yAxisLabel in aria-label', () => {
    const data = [makeGroup('G1', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(
      <BoxplotBase data={data} {...defaultProps} yAxisLabel="Temperature" />
    );

    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('aria-label')).toContain('Temperature');
  });

  it('supports selectedGroups highlighting', () => {
    const data = [
      makeGroup('A', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      makeGroup('B', [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    ];
    const { container } = render(
      <BoxplotBase data={data} {...defaultProps} selectedGroups={['A']} />
    );

    // Should render without error with selection active
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders target reference line when targetLine is provided', () => {
    const data = [makeGroup('G1', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(
      <BoxplotBase
        data={data}
        {...defaultProps}
        targetLine={{ value: 5, color: '#8b5cf6', label: 'Target' }}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Target line renders as a dashed line
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('renders with showBranding=true without error', () => {
    const data = [makeGroup('G1', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} showBranding={true} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
