import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Line } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { bin, Bin } from 'd3';
import {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
} from '../../hooks/useResponsiveChartMargins';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';

type HistogramBin = Bin<number, number>;

interface CapabilityHistogramProps {
  parentWidth: number;
  parentHeight: number;
  data: number[];
  specs: { usl?: number; lsl?: number; target?: number };
  mean: number;
}

const CapabilityHistogram = ({
  parentWidth,
  parentHeight,
  data,
  specs,
  mean,
}: CapabilityHistogramProps) => {
  const sourceBarHeight = getSourceBarHeight();
  const margin = useResponsiveChartMargins(parentWidth, 'histogram', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  const bins: HistogramBin[] = useMemo(() => {
    if (data.length === 0) return [];

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);

    // Extend range slightly to include spec limits if they're outside data range
    const rangeMin = Math.min(minVal, specs.lsl ?? minVal);
    const rangeMax = Math.max(maxVal, specs.usl ?? maxVal);

    const binGenerator = bin<number, number>().domain([rangeMin, rangeMax]).thresholds(15);

    return binGenerator(data);
  }, [data, specs.lsl, specs.usl]);

  const xScale = useMemo(() => {
    if (bins.length === 0) return null;

    const minVal = bins[0]?.x0 ?? 0;
    const maxVal = bins[bins.length - 1]?.x1 ?? 1;

    return scaleLinear({
      range: [0, width],
      domain: [minVal, maxVal],
    });
  }, [bins, width]);

  const yScale = useMemo(() => {
    if (bins.length === 0) return null;

    const maxCount = Math.max(...bins.map(b => b.length));

    return scaleLinear({
      range: [height, 0],
      domain: [0, maxCount * 1.1],
      nice: true,
    });
  }, [bins, height]);

  if (data.length === 0 || !xScale || !yScale) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
        No data available for histogram
      </div>
    );
  }

  // Helper to determine if a bin is within spec
  const isWithinSpec = (binX0: number, binX1: number) => {
    const midpoint = (binX0 + binX1) / 2;
    const aboveLsl = specs.lsl === undefined || midpoint >= specs.lsl;
    const belowUsl = specs.usl === undefined || midpoint <= specs.usl;
    return aboveLsl && belowUsl;
  };

  return (
    <svg width={parentWidth} height={parentHeight}>
      <Group left={margin.left} top={margin.top}>
        {/* Histogram bars */}
        {bins.map((binData, i) => {
          const x0 = binData.x0 ?? 0;
          const x1 = binData.x1 ?? 0;
          const barX = xScale(x0);
          const barWidth = xScale(x1) - xScale(x0) - 1;
          const barHeight = height - yScale(binData.length);
          const barY = yScale(binData.length);
          const withinSpec = isWithinSpec(x0, x1);

          return (
            <Bar
              key={i}
              x={barX}
              y={barY}
              width={Math.max(0, barWidth)}
              height={Math.max(0, barHeight)}
              fill={withinSpec ? '#22c55e' : '#ef4444'}
              opacity={0.8}
              rx={2}
            />
          );
        })}

        {/* LSL line */}
        {specs.lsl !== undefined && (
          <>
            <Line
              from={{ x: xScale(specs.lsl), y: 0 }}
              to={{ x: xScale(specs.lsl), y: height }}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <text
              x={xScale(specs.lsl)}
              y={-5}
              textAnchor="middle"
              fill="#ef4444"
              fontSize={10}
              fontWeight="bold"
            >
              LSL
            </text>
          </>
        )}

        {/* USL line */}
        {specs.usl !== undefined && (
          <>
            <Line
              from={{ x: xScale(specs.usl), y: 0 }}
              to={{ x: xScale(specs.usl), y: height }}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <text
              x={xScale(specs.usl)}
              y={-5}
              textAnchor="middle"
              fill="#ef4444"
              fontSize={10}
              fontWeight="bold"
            >
              USL
            </text>
          </>
        )}

        {/* Target line */}
        {specs.target !== undefined && (
          <>
            <Line
              from={{ x: xScale(specs.target), y: 0 }}
              to={{ x: xScale(specs.target), y: height }}
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="6,3"
            />
            <text
              x={xScale(specs.target)}
              y={-5}
              textAnchor="middle"
              fill="#22c55e"
              fontSize={10}
              fontWeight="bold"
            >
              Target
            </text>
          </>
        )}

        {/* Mean line */}
        <Line
          from={{ x: xScale(mean), y: 0 }}
          to={{ x: xScale(mean), y: height }}
          stroke="#60a5fa"
          strokeWidth={2}
        />
        <text
          x={xScale(mean)}
          y={height + 25}
          textAnchor="middle"
          fill="#60a5fa"
          fontSize={10}
          fontWeight="bold"
        >
          Mean
        </text>

        {/* Y Axis */}
        <AxisLeft
          scale={yScale}
          numTicks={parentWidth < 300 ? 3 : 5}
          stroke="#64748b"
          tickStroke="#64748b"
          tickLabelProps={() => ({
            fill: '#94a3b8',
            fontSize: fonts.tickLabel,
            textAnchor: 'end',
            dy: '0.33em',
            dx: -4,
          })}
        />

        {/* X Axis */}
        <AxisBottom
          scale={xScale}
          top={height}
          numTicks={parentWidth < 300 ? 4 : 6}
          stroke="#64748b"
          tickStroke="#64748b"
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

export default withParentSize(CapabilityHistogram);
