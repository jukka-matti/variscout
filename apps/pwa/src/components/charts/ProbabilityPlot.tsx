import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { LinePath, Circle } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { GridRows } from '@visx/grid';
import { calculateProbabilityPlotData, normalQuantile } from '../../logic/stats';
import {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
} from '../../hooks/useResponsiveChartMargins';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';

interface ProbabilityPlotProps {
  parentWidth: number;
  parentHeight: number;
  data: number[];
  mean: number;
  stdDev: number;
}

const ProbabilityPlot = ({
  parentWidth,
  parentHeight,
  data,
  mean,
  stdDev,
}: ProbabilityPlotProps) => {
  const sourceBarHeight = getSourceBarHeight();
  const margin = useResponsiveChartMargins(parentWidth, 'probability', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Calculate plot data with CI bands
  const plotData = useMemo(() => calculateProbabilityPlotData(data), [data]);

  // X Scale (data values)
  const xScale = useMemo(() => {
    if (plotData.length === 0) return null;

    const values = plotData.map(d => d.value);
    const ciValues = plotData.flatMap(d => [d.lowerCI, d.upperCI]);
    const allValues = [...values, ...ciValues].filter(v => isFinite(v));

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 1;

    return scaleLinear({
      range: [0, width],
      domain: [min - padding, max + padding],
      nice: true,
    });
  }, [plotData, width]);

  // Y Scale (percentile)
  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height, 0],
        domain: [0.5, 99.5],
      }),
    [height]
  );

  // Fitted line (theoretical normal distribution)
  const fittedLine = useMemo(() => {
    const percentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99];
    return percentiles.map(p => {
      const z = normalQuantile(p / 100);
      return {
        x: mean + z * stdDev,
        y: p,
      };
    });
  }, [mean, stdDev]);

  // CI band data
  const lowerBand = useMemo(
    () => plotData.map(d => ({ x: d.lowerCI, y: d.expectedPercentile })),
    [plotData]
  );

  const upperBand = useMemo(
    () => plotData.map(d => ({ x: d.upperCI, y: d.expectedPercentile })),
    [plotData]
  );

  if (data.length === 0 || !xScale) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
        No data available for probability plot
      </div>
    );
  }

  // Build CI band path
  const bandPath = `
    M ${xScale(lowerBand[0]?.x ?? 0)} ${yScale(lowerBand[0]?.y ?? 0)}
    ${lowerBand.map(d => `L ${xScale(d.x)} ${yScale(d.y)}`).join(' ')}
    ${[...upperBand]
      .reverse()
      .map(d => `L ${xScale(d.x)} ${yScale(d.y)}`)
      .join(' ')}
    Z
  `;

  return (
    <svg width={parentWidth} height={parentHeight}>
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines */}
        <GridRows
          scale={yScale}
          width={width}
          stroke="#334155"
          strokeOpacity={0.5}
          tickValues={[1, 5, 10, 25, 50, 75, 90, 95, 99]}
        />

        {/* CI Bands (shaded area) */}
        <path d={bandPath} fill="#3b82f6" fillOpacity={0.1} />

        {/* Lower CI line */}
        <LinePath
          data={lowerBand}
          x={d => xScale(d.x)}
          y={d => yScale(d.y)}
          stroke="#64748b"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Upper CI line */}
        <LinePath
          data={upperBand}
          x={d => xScale(d.x)}
          y={d => yScale(d.y)}
          stroke="#64748b"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Fitted distribution line */}
        <LinePath
          data={fittedLine}
          x={d => xScale(d.x)}
          y={d => yScale(d.y)}
          stroke="#3b82f6"
          strokeWidth={2}
        />

        {/* Data points */}
        {plotData.map((d, i) => (
          <Circle
            key={i}
            cx={xScale(d.value)}
            cy={yScale(d.expectedPercentile)}
            r={4}
            fill="#22c55e"
            stroke="#fff"
            strokeWidth={1}
          />
        ))}

        {/* Y Axis (Percent) */}
        <AxisLeft
          scale={yScale}
          stroke="#64748b"
          tickStroke="#64748b"
          tickValues={parentWidth < 300 ? [5, 25, 50, 75, 95] : [1, 5, 10, 25, 50, 75, 90, 95, 99]}
          tickLabelProps={() => ({
            fill: '#94a3b8',
            fontSize: fonts.tickLabel,
            textAnchor: 'end',
            dy: '0.33em',
            dx: -4,
          })}
          label={parentWidth > 300 ? 'Percent' : ''}
          labelOffset={parentWidth < 400 ? 28 : 36}
          labelProps={{
            fill: '#94a3b8',
            fontSize: fonts.axisLabel,
            textAnchor: 'middle',
          }}
        />

        {/* X Axis (Value) */}
        <AxisBottom
          scale={xScale}
          top={height}
          stroke="#64748b"
          tickStroke="#64748b"
          numTicks={parentWidth < 300 ? 4 : 6}
          tickLabelProps={() => ({
            fill: '#94a3b8',
            fontSize: fonts.tickLabel,
            textAnchor: 'middle',
            dy: 4,
          })}
        />

        {/* Signature (painter-style branding) */}
        <ChartSignature x={width - 10} y={height + margin.bottom - sourceBarHeight - 18} />

        {/* Source Bar (branding) */}
        <ChartSourceBar
          width={width}
          top={height + margin.bottom - sourceBarHeight}
          n={data.length}
        />
      </Group>
    </svg>
  );
};

export default withParentSize(ProbabilityPlot);
