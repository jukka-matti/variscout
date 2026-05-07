import React from 'react';
import { chartColors } from '@variscout/charts';
import type { CanvasStepCardModel } from '@variscout/hooks';

interface CanvasStepMiniChartProps {
  card: CanvasStepCardModel;
}

const SPARK_WIDTH = 100;
const SPARK_HEIGHT = 32;

function numericBars(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.slice(0, 12).map(() => 0.5);
  return values.slice(0, 12).map(value => (value - min) / (max - min));
}

function sparklinePoints(points: ReadonlyArray<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;
  const yPad = 1;
  const yPlot = SPARK_HEIGHT - yPad * 2;

  return points
    .map(point => {
      const x = ((point.x - minX) / xRange) * SPARK_WIDTH;
      const y = yPad + yPlot - ((point.y - minY) / yRange) * yPlot;
      return `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;
    })
    .join(' ');
}

export const CanvasStepMiniChart: React.FC<CanvasStepMiniChartProps> = ({ card }) => {
  if (card.metricKind === 'numeric' && card.numericRenderHint === 'time-series') {
    const points = card.timeSeriesPoints ?? [];
    if (points.length === 0) {
      return (
        <div
          className="flex h-10 items-center text-xs text-content-muted"
          data-testid={`canvas-step-mini-chart-${card.stepId}`}
        >
          No time-series points
        </div>
      );
    }

    return (
      <div
        className="flex h-10 items-center"
        aria-label={`${card.stepName} time-series sparkline`}
        data-testid={`canvas-step-mini-chart-${card.stepId}`}
      >
        <svg
          viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
          width="100%"
          height={SPARK_HEIGHT}
          preserveAspectRatio="none"
          data-testid={`canvas-step-mini-chart-${card.stepId}-sparkline`}
          role="img"
          aria-label={`${card.stepName} time-series sparkline`}
        >
          <polyline
            fill="none"
            stroke={chartColors.mean}
            strokeWidth={1}
            points={sparklinePoints(points)}
          />
        </svg>
      </div>
    );
  }

  if (card.metricKind === 'numeric') {
    const bars = numericBars(card.values);
    return (
      <div
        className="flex h-10 items-end gap-0.5"
        aria-label={`${card.stepName} numeric distribution`}
        data-testid={`canvas-step-mini-chart-${card.stepId}`}
      >
        {bars.length > 0 ? (
          bars.map((height, index) => (
            <span
              key={`${card.stepId}-bar-${index}`}
              className="w-full rounded-sm"
              style={{
                backgroundColor: `${chartColors.mean}99`,
                height: `${Math.max(15, height * 100)}%`,
              }}
            />
          ))
        ) : (
          <span className="text-xs text-content-muted">No numeric values</span>
        )}
      </div>
    );
  }

  if (card.metricKind === 'categorical') {
    const max = Math.max(1, ...card.distribution.map(item => item.count));
    return (
      <div
        className="flex h-10 flex-col justify-end gap-1"
        aria-label={`${card.stepName} categorical distribution`}
        data-testid={`canvas-step-mini-chart-${card.stepId}`}
      >
        {card.distribution.slice(0, 3).map(item => (
          <div key={item.label} className="flex items-center gap-1 text-[11px] text-content-muted">
            <span className="w-12 truncate">{item.label}</span>
            <span
              className="h-1.5 rounded-full"
              style={{
                backgroundColor: `${chartColors.warning}b3`,
                width: `${Math.max(12, (item.count / max) * 72)}px`,
              }}
            />
            <span>{item.count}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex h-10 items-center text-xs text-content-muted"
      data-testid={`canvas-step-mini-chart-${card.stepId}`}
    >
      No mapped metric
    </div>
  );
};
