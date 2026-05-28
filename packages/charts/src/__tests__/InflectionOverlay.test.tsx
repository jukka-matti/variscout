import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { InflectionOverlay } from '../InflectionOverlay';
import { chartColors } from '../colors';

const stubXScale = (v: number) => v * 10; // simple linear mapping
const stubYRange: [number, number] = [10, 200];

const defaultProps = {
  xScale: stubXScale,
  yRange: stubYRange,
  variant: 'solid' as const,
};

describe('InflectionOverlay', () => {
  it('renders N vertical lines for N cuts', () => {
    const { container, getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5, 12, 20]} {...defaultProps} />
      </svg>
    );

    const group = getByTestId('inflection-overlay');
    expect(group).not.toBeNull();

    const lines = container.querySelectorAll('[data-testid^="inflection-cut-"]');
    expect(lines).toHaveLength(3);
  });

  it('renders nothing when cuts is empty', () => {
    const { container } = render(
      <svg>
        <InflectionOverlay cuts={[]} {...defaultProps} />
      </svg>
    );

    const overlay = container.querySelector('[data-testid="inflection-overlay"]');
    expect(overlay).toBeNull();
  });

  it('ghost variant has strokeOpacity 0.5', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5, 10]} xScale={stubXScale} yRange={stubYRange} variant="ghost" />
      </svg>
    );

    const line = getByTestId('inflection-cut-0');
    expect(line.getAttribute('stroke-opacity')).toBe('0.5');
  });

  it('solid variant has strokeOpacity 1', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5, 10]} xScale={stubXScale} yRange={stubYRange} variant="solid" />
      </svg>
    );

    const line = getByTestId('inflection-cut-0');
    expect(line.getAttribute('stroke-opacity')).toBe('1');
  });

  it('lines are positioned at xScale(cut) with correct y bounds', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5]} xScale={stubXScale} yRange={[10, 200]} variant="solid" />
      </svg>
    );

    const line = getByTestId('inflection-cut-0');
    // stubXScale(5) = 50
    expect(line.getAttribute('x1')).toBe('50');
    expect(line.getAttribute('x2')).toBe('50');
    expect(line.getAttribute('y1')).toBe('10');
    expect(line.getAttribute('y2')).toBe('200');
  });

  it('stroke matches chartColors.control (cyan-500)', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5]} {...defaultProps} />
      </svg>
    );

    const line = getByTestId('inflection-cut-0');
    expect(line.getAttribute('stroke')).toBe(chartColors.control);
  });

  it('group has aria-hidden="true"', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5, 10]} {...defaultProps} />
      </svg>
    );

    const group = getByTestId('inflection-overlay');
    expect(group.getAttribute('aria-hidden')).toBe('true');
  });

  it('assigns data-testid per cut index', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[1, 2, 3]} {...defaultProps} />
      </svg>
    );

    expect(getByTestId('inflection-cut-0')).not.toBeNull();
    expect(getByTestId('inflection-cut-1')).not.toBeNull();
    expect(getByTestId('inflection-cut-2')).not.toBeNull();
  });

  it('uses strokeDasharray "4,4" for dashed lines', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5]} {...defaultProps} />
      </svg>
    );

    const line = getByTestId('inflection-cut-0');
    expect(line.getAttribute('stroke-dasharray')).toBe('4,4');
  });

  it('line elements include transition-opacity duration-300 ease-out className', () => {
    const { getByTestId } = render(
      <svg>
        <InflectionOverlay cuts={[5, 10]} {...defaultProps} />
      </svg>
    );

    const line0 = getByTestId('inflection-cut-0');
    const line1 = getByTestId('inflection-cut-1');
    expect(line0.getAttribute('class')).toContain('transition-opacity');
    expect(line0.getAttribute('class')).toContain('duration-300');
    expect(line0.getAttribute('class')).toContain('ease-out');
    expect(line1.getAttribute('class')).toContain('transition-opacity');
    expect(line1.getAttribute('class')).toContain('duration-300');
    expect(line1.getAttribute('class')).toContain('ease-out');
  });
});
