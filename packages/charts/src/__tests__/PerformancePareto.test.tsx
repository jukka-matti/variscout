/**
 * PerformanceParetoBase — yMetric migration tests (P1.4)
 *
 * Tests:
 *   1. Regression: yMetric='cpk' (default) — channels sorted worst-Cpk-first, correct values.
 *   2. yMetric='percent-out-of-spec' — bar heights change, sorted by outOfSpecPercentage desc.
 *   3. Picker visibility — buttons rendered when availableYMetrics.length >= 2 + onYMetricSwitch.
 *   4. Picker fires onYMetricSwitch with correct id on click.
 *   5. Picker hidden when availableYMetrics undefined.
 *   6. Picker hidden when availableYMetrics.length < 2.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceParetoBase, PERFORMANCE_PARETO_Y_METRICS } from '../PerformancePareto';
import type { ChannelResult } from '../types';

// ---------------------------------------------------------------------------
// Deterministic test fixture
// ---------------------------------------------------------------------------

/** Create a minimal ChannelResult with controlled cpk + outOfSpecPercentage. */
function makeChannel(id: string, cpk: number, outOfSpecPercentage: number, n = 30): ChannelResult {
  return {
    id,
    label: id,
    n,
    mean: 10,
    stdDev: 1,
    cpk,
    cp: cpk,
    min: 7,
    max: 13,
    health: cpk >= 1.33 ? 'capable' : cpk >= 1.0 ? 'warning' : 'critical',
    outOfSpecPercentage,
    values: Array.from({ length: n }, (_, i) => 9 + (i % 3)),
  };
}

/**
 * Fixture channels — deliberately NOT in worst-first order.
 * ch_bad:  cpk=0.5  (worst),  outOfSpec=25%
 * ch_mid:  cpk=1.0,           outOfSpec=40% (most out-of-spec)
 * ch_good: cpk=1.5  (best),   outOfSpec=5%
 */
const FIXTURE_CHANNELS: ChannelResult[] = [
  makeChannel('ch_good', 1.5, 5),
  makeChannel('ch_bad', 0.5, 25),
  makeChannel('ch_mid', 1.0, 40),
];

const defaultProps = {
  parentWidth: 600,
  parentHeight: 400,
  showBranding: false,
};

// ---------------------------------------------------------------------------
// 1. Regression: cpk mode (default)
// ---------------------------------------------------------------------------

describe('PerformanceParetoBase — yMetric cpk (default)', () => {
  it('renders without throwing', () => {
    expect(() => {
      render(<PerformanceParetoBase {...defaultProps} channels={FIXTURE_CHANNELS} />);
    }).not.toThrow();
  });

  it('renders the Y axis label "Cpk" when yMetric is cpk', () => {
    const { container } = render(
      <PerformanceParetoBase {...defaultProps} channels={FIXTURE_CHANNELS} yMetric="cpk" />
    );
    // visx text nodes render as SVG <text> elements
    const allText = Array.from(container.querySelectorAll('text'));
    const cpkLabel = allText.find(el => el.textContent?.trim() === 'Cpk');
    expect(cpkLabel).toBeDefined();
  });

  it('orders channels worst-Cpk-first: ch_bad(0.5) before ch_mid(1.0) before ch_good(1.5)', () => {
    const { container } = render(
      <PerformanceParetoBase {...defaultProps} channels={FIXTURE_CHANNELS} yMetric="cpk" />
    );

    // AxisBottom tick labels appear as <text> nodes.
    // We check the text-content order: ch_bad must appear before ch_mid before ch_good.
    const allText = Array.from(container.querySelectorAll('text'))
      .map(el => el.textContent?.trim() ?? '')
      .filter(t => ['ch_bad', 'ch_mid', 'ch_good'].includes(t));

    // The first occurrence of ch_bad must precede ch_mid, which must precede ch_good.
    const idxBad = allText.indexOf('ch_bad');
    const idxMid = allText.indexOf('ch_mid');
    const idxGood = allText.indexOf('ch_good');

    expect(idxBad).toBeGreaterThanOrEqual(0);
    expect(idxMid).toBeGreaterThanOrEqual(0);
    expect(idxGood).toBeGreaterThanOrEqual(0);
    expect(idxBad).toBeLessThan(idxMid);
    expect(idxMid).toBeLessThan(idxGood);
  });

  it('shows Cpk threshold reference lines when yMetric=cpk', () => {
    const { container } = render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="cpk"
        cpkThresholds={{ critical: 1.0, warning: 1.33, capable: 1.67 }}
      />
    );
    // formatStatistic(1.0, 'en', 2) → "1.00"; formatStatistic(1.33, 'en', 2) → "1.33"
    const allText = Array.from(container.querySelectorAll('text')).map(
      el => el.textContent?.trim() ?? ''
    );
    // Critical threshold (1.0) label — rendered as "1.00"
    expect(allText.some(t => t === '1.00')).toBe(true);
    // Warning threshold (1.33) label
    expect(allText.some(t => t.includes('1.33'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. percent-out-of-spec mode
// ---------------------------------------------------------------------------

describe('PerformanceParetoBase — yMetric percent-out-of-spec', () => {
  it('renders the Y axis label "% out of spec"', () => {
    const { container } = render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="percent-out-of-spec"
      />
    );
    const allText = Array.from(container.querySelectorAll('text'));
    const label = allText.find(el => el.textContent?.includes('out of spec'));
    expect(label).toBeDefined();
  });

  it('orders channels by outOfSpecPercentage descending: ch_mid(40%) first, ch_bad(25%) second, ch_good(5%) last', () => {
    const { container } = render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="percent-out-of-spec"
      />
    );

    const allText = Array.from(container.querySelectorAll('text'))
      .map(el => el.textContent?.trim() ?? '')
      .filter(t => ['ch_bad', 'ch_mid', 'ch_good'].includes(t));

    const idxMid = allText.indexOf('ch_mid');
    const idxBad = allText.indexOf('ch_bad');
    const idxGood = allText.indexOf('ch_good');

    expect(idxMid).toBeGreaterThanOrEqual(0);
    expect(idxBad).toBeGreaterThanOrEqual(0);
    expect(idxGood).toBeGreaterThanOrEqual(0);
    // ch_mid (40%) should come before ch_bad (25%) which before ch_good (5%)
    expect(idxMid).toBeLessThan(idxBad);
    expect(idxBad).toBeLessThan(idxGood);
  });

  it('does NOT show Cpk threshold reference lines in percent-out-of-spec mode', () => {
    const { container } = render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="percent-out-of-spec"
        cpkThresholds={{ critical: 1.0, warning: 1.33, capable: 1.67 }}
      />
    );
    // The threshold value "1.33" should NOT appear as a text node in this mode
    const allText = Array.from(container.querySelectorAll('text')).map(
      el => el.textContent?.trim() ?? ''
    );
    expect(allText.some(t => t === '1.33')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3–6. Picker visibility
// ---------------------------------------------------------------------------

describe('PerformanceParetoBase — Y-metric picker', () => {
  it('shows picker buttons when availableYMetrics.length >= 2 and onYMetricSwitch provided', () => {
    render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="cpk"
        availableYMetrics={PERFORMANCE_PARETO_Y_METRICS}
        onYMetricSwitch={vi.fn()}
      />
    );
    // Picker buttons have aria-label="Y axis metric"
    const pickerBtns = screen.getAllByRole('button', { name: /Y axis metric/i });
    expect(pickerBtns.length).toBe(PERFORMANCE_PARETO_Y_METRICS.length);
  });

  it('fires onYMetricSwitch with the correct id when a picker button is clicked', () => {
    const onYMetricSwitch = vi.fn();
    render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="cpk"
        availableYMetrics={PERFORMANCE_PARETO_Y_METRICS}
        onYMetricSwitch={onYMetricSwitch}
      />
    );
    const buttons = screen.getAllByRole('button', { name: /Y axis metric/i });
    // Find the '% out of spec' button
    const pctBtn = buttons.find(btn => btn.textContent?.includes('out of spec'));
    expect(pctBtn).toBeDefined();
    fireEvent.click(pctBtn!);
    expect(onYMetricSwitch).toHaveBeenCalledWith('percent-out-of-spec');
  });

  it('hides picker when availableYMetrics is undefined', () => {
    render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="cpk"
        availableYMetrics={undefined}
        onYMetricSwitch={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /Y axis metric/i })).toBeNull();
  });

  it('hides picker when availableYMetrics.length < 2', () => {
    render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="cpk"
        availableYMetrics={[PERFORMANCE_PARETO_Y_METRICS[0]]}
        onYMetricSwitch={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /Y axis metric/i })).toBeNull();
  });

  it('hides picker when onYMetricSwitch not provided', () => {
    render(
      <PerformanceParetoBase
        {...defaultProps}
        channels={FIXTURE_CHANNELS}
        yMetric="cpk"
        availableYMetrics={PERFORMANCE_PARETO_Y_METRICS}
        // onYMetricSwitch intentionally omitted
      />
    );
    expect(screen.queryByRole('button', { name: /Y axis metric/i })).toBeNull();
  });

  it('renders empty state cleanly when no channels given', () => {
    expect(() => {
      render(<PerformanceParetoBase {...defaultProps} channels={[]} yMetric="cpk" />);
    }).not.toThrow();
  });
});
