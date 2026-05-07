import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanvasStepCardModel } from '@variscout/hooks';
import { CanvasStepMiniChart } from '../CanvasStepMiniChart';

const numericCard = (overrides: Partial<CanvasStepCardModel> = {}): CanvasStepCardModel => ({
  stepId: 'mix',
  stepName: 'Mix',
  assignedColumns: ['Temperature'],
  metricColumn: 'Temperature',
  metricKind: 'numeric',
  values: [99, 100, 101],
  distribution: [],
  capability: { state: 'no-specs', n: 3, canAddSpecs: true },
  ...overrides,
});

describe('CanvasStepMiniChart', () => {
  it('keeps the histogram branch for histogram numeric cards', () => {
    render(<CanvasStepMiniChart card={numericCard({ numericRenderHint: 'histogram' })} />);

    expect(screen.getByTestId('canvas-step-mini-chart-mix')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas-step-mini-chart-mix-sparkline')).not.toBeInTheDocument();
  });

  it('renders an SVG polyline sparkline for time-series numeric cards', () => {
    const points = Array.from({ length: 40 }, (_, i) => ({ x: i, y: 100 + i * 0.1 }));

    render(
      <CanvasStepMiniChart
        card={numericCard({ numericRenderHint: 'time-series', timeSeriesPoints: points })}
      />
    );

    const sparkline = screen.getByTestId('canvas-step-mini-chart-mix-sparkline');
    const polyline = sparkline.querySelector('polyline');
    const pointsAttr = polyline?.getAttribute('points') ?? '';

    expect(polyline).not.toBeNull();
    expect(pointsAttr.split(/\s+/).filter(Boolean)).toHaveLength(40);
  });

  it('renders an empty time-series state when there are no points', () => {
    render(
      <CanvasStepMiniChart
        card={numericCard({ numericRenderHint: 'time-series', timeSeriesPoints: [] })}
      />
    );

    expect(screen.getByTestId('canvas-step-mini-chart-mix')).toHaveTextContent(/no.*points/i);
  });
});
