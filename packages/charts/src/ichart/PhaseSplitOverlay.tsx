import React from 'react';
import type { IChartDataPoint } from '@variscout/core';
import type { IChartEventFlag, IChartPhaseLimits, IChartPhaseSplit } from '../types';
import { chartColors, chromeColors } from '../colors';

type ViScale = { (value: number): number };

interface PhaseSplitOverlayProps {
  data: IChartDataPoint[];
  width: number;
  height: number;
  xScale: ViScale;
  yScale: ViScale;
  phaseSplit?: IChartPhaseSplit;
  phaseLimits?: IChartPhaseLimits;
  eventFlags?: IChartEventFlag[];
}

function parseISO(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPointTime(point: IChartDataPoint): number | null {
  return parseISO(point.isoTimestamp) ?? parseISO(point.timeValue);
}

function resolveISOX(
  data: IChartDataPoint[],
  atISO: string,
  xScale: ViScale,
  width: number
): number | null {
  const target = parseISO(atISO);
  if (target === null) return null;

  const timedPoints = data
    .map(point => ({ time: getPointTime(point), x: point.x }))
    .filter((point): point is { time: number; x: number } => point.time !== null)
    .sort((a, b) => a.time - b.time);

  if (timedPoints.length === 0) return null;

  const first = timedPoints[0]!;
  const last = timedPoints[timedPoints.length - 1]!;
  if (target <= first.time) return clamp(xScale(first.x), 0, width);
  if (target >= last.time) return clamp(xScale(last.x), 0, width);

  const exact = timedPoints.find(point => point.time === target);
  if (exact) return clamp(xScale(exact.x), 0, width);

  for (let i = 1; i < timedPoints.length; i++) {
    const previous = timedPoints[i - 1]!;
    const next = timedPoints[i]!;
    if (target >= previous.time && target <= next.time) {
      const ratio = (target - previous.time) / (next.time - previous.time);
      const x = xScale(previous.x) + (xScale(next.x) - xScale(previous.x)) * ratio;
      return clamp(x, 0, width);
    }
  }

  return null;
}

const PhaseSplitOverlay: React.FC<PhaseSplitOverlayProps> = ({
  data,
  width,
  height,
  xScale,
  yScale,
  phaseSplit,
  phaseLimits,
  eventFlags = [],
}) => {
  const splitX = phaseSplit ? resolveISOX(data, phaseSplit.atISO, xScale, width) : null;

  const renderPhaseLine = (
    phase: 'before' | 'after',
    key: 'ucl' | 'mean' | 'lcl',
    value: number,
    x1: number,
    x2: number
  ) => (
    <line
      key={`${phase}-${key}`}
      data-testid={`ichart-phase-limits-${phase}-${key}`}
      x1={x1}
      x2={x2}
      y1={yScale(value)}
      y2={yScale(value)}
      stroke={key === 'mean' ? chartColors.mean : chartColors.control}
      strokeWidth={key === 'mean' ? 2 : 1}
      strokeDasharray={key === 'mean' ? undefined : '6,4'}
      strokeOpacity={key === 'mean' ? 0.9 : 0.75}
    />
  );

  const limitSegments =
    splitX === null ? null : (
      <>
        {phaseLimits?.before &&
          (['ucl', 'mean', 'lcl'] as const).map(key =>
            renderPhaseLine('before', key, phaseLimits.before![key], 0, splitX)
          )}
        {phaseLimits?.after &&
          (['ucl', 'mean', 'lcl'] as const).map(key =>
            renderPhaseLine('after', key, phaseLimits.after![key], splitX, width)
          )}
      </>
    );

  return (
    <>
      {limitSegments}

      {splitX !== null && phaseSplit && (
        <>
          <line
            data-testid="ichart-phase-split-marker"
            x1={splitX}
            x2={splitX}
            y1={0}
            y2={height}
            stroke={chromeColors.stageDivider}
            strokeWidth={1.5}
            strokeDasharray="5,5"
          />
          {phaseSplit.label && (
            <text
              data-testid="ichart-phase-split-label"
              x={clamp(splitX + 6, 0, width)}
              y={12}
              fill={chromeColors.stageDivider}
              fontSize={11}
              fontWeight={600}
            >
              {phaseSplit.label}
            </text>
          )}
        </>
      )}

      {eventFlags.map((flag, index) => {
        const x = resolveISOX(data, flag.atISO, xScale, width);
        if (x === null) return null;
        return (
          <g
            key={`${flag.atISO}-${index}`}
            data-testid={`ichart-event-flag-${index}`}
            transform={`translate(${x}, 0)`}
          >
            <polygon
              points="-5,-12 5,-12 0,-2"
              fill={chartColors.warning}
              stroke={chartColors.warning}
            />
            <text
              data-testid={`ichart-event-flag-label-${index}`}
              x={6}
              y={-8}
              fill={chartColors.warning}
              fontSize={10}
              fontWeight={600}
            >
              {flag.label}
            </text>
          </g>
        );
      })}
    </>
  );
};

export default PhaseSplitOverlay;
