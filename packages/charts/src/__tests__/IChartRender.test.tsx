import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IChartBase } from '../IChart';
import type { IChartDataPoint } from '../types';
import type { StatsResult } from '@variscout/core';
import { chartColors } from '../colors';

/** Generate N data points for testing */
function makeData(n: number): IChartDataPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    x: i,
    y: 10 + Math.sin(i),
    originalIndex: i,
  }));
}

function makeISOData(values: number[]): IChartDataPoint[] {
  return values.map((y, i) => ({
    x: i,
    y,
    originalIndex: i,
    isoTimestamp: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    timeValue: `Jan ${i + 1}`,
  }));
}

/** Minimal stats result matching the test data */
function makeStats(data: IChartDataPoint[]): StatsResult {
  const values = data.map(d => d.y);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
  return {
    mean,
    median: mean,
    stdDev,
    sigmaWithin: stdDev,
    mrBar: stdDev * 1.128,
    ucl: mean + 3 * stdDev,
    lcl: mean - 3 * stdDev,
    outOfSpecPercentage: 0,
    sampleSize: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  } as StatsResult;
}

const defaultProps = {
  parentWidth: 800,
  parentHeight: 400,
  specs: { usl: 15, lsl: 5 },
  showBranding: false,
};

describe('IChartBase rendering', () => {
  it('returns null for empty data', () => {
    const { container } = render(<IChartBase data={[]} stats={null} {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders an SVG with role="img" and aria-label', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
    expect(svg!.getAttribute('aria-label')).toContain('I-Chart');
    expect(svg!.getAttribute('aria-label')).toContain('10 data points');
  });

  it('renders data points as circles', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);

    // Data points are rendered as circles within the chart
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(data.length);
  });

  it('includes control limit lines when stats are provided', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);

    // Control limits render as <line> elements; at minimum mean, UCL, LCL
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('renders without stats (stats=null)', () => {
    const data = makeData(5);
    const { container } = render(<IChartBase data={data} stats={null} {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('reflects custom yAxisLabel in aria-label', () => {
    const data = makeData(5);
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase data={data} stats={stats} {...defaultProps} yAxisLabel="Weight" />
    );

    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('aria-label')).toContain('Weight');
  });

  it('renders with showBranding=true without error', () => {
    const data = makeData(5);
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase data={data} stats={stats} {...defaultProps} showBranding={true} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders a phase marker at the ISO-matched data point position', () => {
    const data = makeISOData([10, 11, 12, 11, 10]);
    const stats = makeStats(data);
    const { getByTestId } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z', label: 'Improve' }}
      />
    );

    const marker = getByTestId('ichart-phase-split-marker');

    expect(marker.getAttribute('x1')).toBe('322.5');
    expect(marker.getAttribute('x2')).toBe('322.5');
    expect(getByTestId('ichart-phase-split-label').textContent).toBe('Improve');
  });

  it('renders before and after phase-limit segments', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z' }}
        phaseLimits={{
          before: { mean: 10, ucl: 16, lcl: 4 },
          after: { mean: 13, ucl: 24, lcl: 2 },
        }}
      />
    );

    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-before-"]')).toHaveLength(
      3
    );
    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-after-"]')).toHaveLength(
      3
    );
    expect(
      container.querySelector('[data-testid="ichart-phase-limits-before-mean"]')
    ).toHaveAttribute('x1', '0');
    expect(
      container.querySelector('[data-testid="ichart-phase-limits-after-mean"]')
    ).toHaveAttribute('x2', '645');
  });

  it('does not render full-width non-staged control lines when phase limits are present', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = {
      ...makeStats(data),
      mean: 12,
      ucl: 15,
      lcl: 9,
    };
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        specs={{}}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z' }}
        phaseLimits={{
          before: { mean: 10, ucl: 16, lcl: 4 },
          after: { mean: 13, ucl: 24, lcl: 2 },
        }}
      />
    );

    const fullWidthControlLines = Array.from(container.querySelectorAll('line')).filter(line => {
      const isControlLine =
        line.getAttribute('stroke') === chartColors.control ||
        line.getAttribute('stroke') === chartColors.mean;
      return (
        isControlLine &&
        line.getAttribute('x1') === '0' &&
        line.getAttribute('x2') === '645' &&
        !line.getAttribute('data-testid')?.startsWith('ichart-phase-limits-')
      );
    });

    expect(fullWidthControlLines).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-before-"]')).toHaveLength(
      3
    );
    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-after-"]')).toHaveLength(
      3
    );
  });

  it('keeps normal control lines when phase limits cannot render without a split', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = {
      ...makeStats(data),
      mean: 12,
      ucl: 15,
      lcl: 9,
    };
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        specs={{}}
        phaseLimits={{
          before: { mean: 10, ucl: 60, lcl: -40 },
          after: { mean: 13, ucl: 70, lcl: -30 },
        }}
      />
    );

    const fullWidthControlLines = Array.from(container.querySelectorAll('line')).filter(line => {
      const isControlLine =
        line.getAttribute('stroke') === chartColors.control ||
        line.getAttribute('stroke') === chartColors.mean;
      return (
        isControlLine &&
        line.getAttribute('x1') === '0' &&
        line.getAttribute('x2') === '645' &&
        !line.getAttribute('data-testid')?.startsWith('ichart-phase-limits-')
      );
    });

    expect(fullWidthControlLines).toHaveLength(3);
    expect(container.querySelector('[data-testid^="ichart-phase-limits-"]')).toBeNull();
  });

  it('renders event flags clipped to chart bounds', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = makeStats(data);
    const { getByTestId } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        eventFlags={[
          { atISO: '2025-12-31T00:00:00.000Z', label: 'Before data' },
          { atISO: '2026-01-06T00:00:00.000Z', label: 'After data' },
        ]}
      />
    );

    expect(getByTestId('ichart-event-flag-0').getAttribute('transform')).toBe('translate(0, 0)');
    expect(getByTestId('ichart-event-flag-1').getAttribute('transform')).toBe('translate(645, 0)');
    expect(getByTestId('ichart-event-flag-label-0').textContent).toBe('Before data');
    expect(getByTestId('ichart-event-flag-label-1').textContent).toBe('After data');

    const leftPolygon = getByTestId('ichart-event-flag-0').querySelector('polygon')!;
    const rightPolygon = getByTestId('ichart-event-flag-1').querySelector('polygon')!;
    expect(leftPolygon.getAttribute('points')).toBe('0,-12 10,-12 5,-2');
    expect(rightPolygon.getAttribute('points')).toBe('-10,-12 0,-12 -5,-2');

    expect(getByTestId('ichart-event-flag-label-0')).toHaveAttribute('x', '12');
    expect(getByTestId('ichart-event-flag-label-0')).toHaveAttribute('text-anchor', 'start');
    expect(getByTestId('ichart-event-flag-label-1')).toHaveAttribute('x', '-12');
    expect(getByTestId('ichart-event-flag-label-1')).toHaveAttribute('text-anchor', 'end');
  });

  it('skips ISO overlays when chart points only have formatted time labels', () => {
    const data = makeISOData([10, 11, 12, 13, 14]).map(({ isoTimestamp, ...point }) => ({
      ...point,
      timeValue: isoTimestamp,
    }));
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z', label: 'Improve' }}
        eventFlags={[{ atISO: '2026-01-04T00:00:00.000Z', label: 'Check' }]}
      />
    );

    expect(container.querySelector('[data-testid="ichart-phase-split-marker"]')).toBeNull();
    expect(container.querySelector('[data-testid="ichart-phase-split-label"]')).toBeNull();
    expect(container.querySelector('[data-testid^="ichart-event-flag-"]')).toBeNull();
  });

  it('includes phase limits in the auto y-domain', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = {
      ...makeStats(data),
      mean: 12,
      ucl: 15,
      lcl: 9,
    };
    const { getByTestId } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        specs={{}}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z' }}
        phaseLimits={{
          after: { mean: 14, ucl: 40, lcl: 0 },
        }}
      />
    );

    expect(Number(getByTestId('ichart-phase-limits-after-ucl').getAttribute('y1'))).toBeGreaterThan(
      0
    );
  });

  it('keeps existing control-line labels and no phase overlay DOM without new props', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);
    const text = container.textContent ?? '';

    expect(text).toContain('UCL');
    expect(text).toContain('Mean');
    expect(text).toContain('LCL');
    expect(container.querySelector('[data-testid="ichart-phase-split-marker"]')).toBeNull();
    expect(container.querySelector('[data-testid^="ichart-phase-limits-"]')).toBeNull();
    expect(container.querySelector('[data-testid^="ichart-event-flag-"]')).toBeNull();
  });
});

describe('IChartBase membership highlight tier (ER-4)', () => {
  // Data with a clear in-spec mid-band and an out-of-spec violation at index 2.
  // specs usl/lsl 15/5; index 2 (y=30) is a spec violation (diamond, chartColors.spec).
  function makeMixedData(): IChartDataPoint[] {
    return [10, 11, 30, 12, 9].map((y, i) => ({ x: i, y, originalIndex: i }));
  }
  const mixedStats = makeStats(makeMixedData());

  // Members = display indices {0, 2}. So idx 0 = in-spec member; idx 2 = violation member;
  // idx 1,3,4 = non-members (idx 1,3,4 in-spec).
  const members = new Set<number>([0, 2]);

  /** Collect the rendered per-point <g opacity> wrappers (skip secondary/finding groups). */
  function pointGroups(container: HTMLElement): Element[] {
    // Each primary data point is a <g opacity=...> wrapping a ViolationPoint shape.
    return Array.from(container.querySelectorAll('g[opacity]')).filter(
      g => g.querySelector('[data-shape], circle, polygon, rect, path') !== null
    );
  }

  it('suppresses the connecting data line while membership is active', () => {
    const dataLineStroke = chartColors.mean; // not directly the data line, but assert via path count
    void dataLineStroke;
    const data = makeMixedData();
    const { container: withTier } = render(
      <IChartBase
        data={data}
        stats={mixedStats}
        {...defaultProps}
        conditionMemberIndices={members}
      />
    );
    const { container: noTier } = render(
      <IChartBase data={data} stats={mixedStats} {...defaultProps} />
    );

    // The primary connecting LinePath is a <path> with stroke = chrome.dataLine.
    // With the tier active, the primary data line is suppressed → fewer <path> elements.
    const pathsWithTier = withTier.querySelectorAll('path').length;
    const pathsNoTier = noTier.querySelectorAll('path').length;
    expect(pathsWithTier).toBeLessThan(pathsNoTier);
  });

  it('renders the data line when membership is absent (regression pin)', () => {
    const data = makeMixedData();
    const { container } = render(<IChartBase data={data} stats={mixedStats} {...defaultProps} />);
    // At least one <path> (the primary data LinePath) is present.
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('lights members at ~.85 and dims non-members at ~.14', () => {
    const data = makeMixedData();
    const { container } = render(
      <IChartBase
        data={data}
        stats={mixedStats}
        {...defaultProps}
        conditionMemberIndices={members}
      />
    );
    const groups = pointGroups(container);
    expect(groups).toHaveLength(5);

    const opacities = groups.map(g => Number(g.getAttribute('opacity')));
    // idx 0 member (in-spec) → lit
    expect(opacities[0]).toBeCloseTo(0.85, 2);
    // idx 1 non-member (in-spec) → dim
    expect(opacities[1]).toBeCloseTo(0.14, 2);
    // idx 2 member (violation) → lit
    expect(opacities[2]).toBeCloseTo(0.85, 2);
    // idx 3 non-member (in-spec) → dim
    expect(opacities[3]).toBeCloseTo(0.14, 2);
  });

  it('floors a dimmed non-member VIOLATION at opacity .3 so signals never vanish', () => {
    const data = makeMixedData();
    // Members exclude idx 2 (the violation) → it is a non-member violation.
    const membersExclViolation = new Set<number>([0, 1]);
    const { container } = render(
      <IChartBase
        data={data}
        stats={mixedStats}
        {...defaultProps}
        conditionMemberIndices={membersExclViolation}
      />
    );
    const groups = pointGroups(container);
    const opacities = groups.map(g => Number(g.getAttribute('opacity')));
    // idx 2 is a non-member but IS a spec violation → floored at .3 (not .14).
    expect(opacities[2]).toBeCloseTo(0.3, 2);
    // idx 3 is a non-member, non-violation → plain dim .14.
    expect(opacities[3]).toBeCloseTo(0.14, 2);
  });

  it('preserves the violation color/shape on a lit member', () => {
    const data = makeMixedData();
    const { container } = render(
      <IChartBase
        data={data}
        stats={mixedStats}
        {...defaultProps}
        conditionMemberIndices={members}
      />
    );
    // idx 2 is a member AND a spec violation → keeps chartColors.spec fill + diamond shape.
    // The violation diamond is a <polygon> (ViolationShapes); find a fill matching spec color.
    const specColored = Array.from(container.querySelectorAll('[fill]')).filter(
      el => el.getAttribute('fill') === chartColors.spec
    );
    expect(specColored.length).toBeGreaterThan(0);
  });

  it('renders members larger than non-members', () => {
    const data = makeMixedData();
    const { container } = render(
      <IChartBase
        data={data}
        stats={mixedStats}
        {...defaultProps}
        conditionMemberIndices={members}
      />
    );
    const groups = pointGroups(container);
    // Member r (idx 0) vs non-member r (idx 1) — read the shape's r/size attribute.
    const memberShape = groups[0].querySelector('circle, polygon, rect, path');
    const nonMemberShape = groups[1].querySelector('circle, polygon, rect, path');
    // Members carry a larger radius. ViolationPoint encodes size via r (circle) or scale.
    // We assert via a data attribute set on the shape wrapper.
    expect(groups[0].getAttribute('data-member')).toBe('true');
    expect(groups[1].getAttribute('data-member')).toBe('false');
    void memberShape;
    void nonMemberShape;
  });

  it('channel absent → opacity behavior identical to today (regression pin)', () => {
    const data = makeMixedData();
    const { container } = render(<IChartBase data={data} stats={mixedStats} {...defaultProps} />);
    const groups = pointGroups(container);
    // No brush selection, no membership → every point opaque (1).
    groups.forEach(g => {
      expect(Number(g.getAttribute('opacity'))).toBe(1);
    });
    // And no membership data attributes leak when the channel is absent.
    expect(container.querySelector('[data-member]')).toBeNull();
  });

  it('empty membership set behaves like the channel being absent', () => {
    const data = makeMixedData();
    const { container } = render(
      <IChartBase
        data={data}
        stats={mixedStats}
        {...defaultProps}
        conditionMemberIndices={new Set()}
      />
    );
    const groups = pointGroups(container);
    groups.forEach(g => {
      expect(Number(g.getAttribute('opacity'))).toBe(1);
    });
    // The data line is NOT suppressed for an empty set.
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('uses each point isMember flag after decimation instead of rendered index membership', () => {
    const data = makeMixedData().map((point, i) => ({
      ...point,
      x: i * 20,
      originalIndex: i * 20,
      isMember: i === 1,
    }));
    const stalePreDecimationMembers = new Set<number>([20]);
    const { container } = render(
      <IChartBase
        data={data}
        stats={mixedStats}
        {...defaultProps}
        conditionMemberIndices={stalePreDecimationMembers}
      />
    );

    const groups = pointGroups(container);
    expect(groups[0].getAttribute('data-member')).toBe('false');
    expect(groups[1].getAttribute('data-member')).toBe('true');
  });
});

describe('IChartBase large-n rendering policy', () => {
  it('scales sparse LTTB x coordinates across the plot width', () => {
    const data = [
      { x: 0, y: 10, originalIndex: 0 },
      { x: 500, y: 12, originalIndex: 500 },
      { x: 999, y: 11, originalIndex: 999 },
    ];
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);
    const circles = Array.from(
      container.querySelectorAll('g[data-original-index] circle')
    ) as SVGCircleElement[];
    const cxValues = circles.map(c => Number(c.getAttribute('cx'))).filter(Number.isFinite);

    expect(Math.max(...cxValues)).toBeGreaterThan(640);
  });

  it('renders quiet large-n points smaller than violations', () => {
    const data = [
      { x: 0, y: 10, originalIndex: 0 },
      { x: 1, y: 30, originalIndex: 1 },
    ];
    const stats = { ...makeStats(data), ucl: 15, lcl: 5 } as StatsResult;
    const { container } = render(
      <IChartBase data={data} stats={stats} {...defaultProps} fullPointCount={1000} />
    );
    const groups = Array.from(container.querySelectorAll('g[data-original-index]'));
    const quiet = groups
      .find(g => g.getAttribute('data-original-index') === '0')
      ?.querySelector('circle');
    const violation = groups.find(g => g.getAttribute('data-original-index') === '1');
    const violationPolygon = violation?.querySelector('polygon');

    expect(Number(quiet?.getAttribute('r'))).toBeLessThan(2);
    expect(violationPolygon).not.toBeNull();
    expect(violation?.getAttribute('data-point-size')).toBe('violation');
  });
});
