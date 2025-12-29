import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { withParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { BoxplotProps, BoxplotGroupData } from './types';
import { getResponsiveMargins, getResponsiveFonts } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';

/**
 * Boxplot Chart - Props-based version
 * Shows distribution comparison across groups
 */
const BoxplotBase: React.FC<BoxplotProps> = ({
  data,
  specs,
  yAxisLabel = 'Value',
  xAxisLabel = 'Group',
  selectedGroups = [],
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onBoxClick,
  sampleSize,
}) => {
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'boxplot', sourceBarHeight);
  const fonts = getResponsiveFonts(parentWidth);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<BoxplotGroupData>();

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Calculate Y domain from data
  const yDomain = useMemo(() => {
    if (data.length === 0) return [0, 1] as [number, number];

    let minVal = Math.min(...data.flatMap(d => [d.min, ...d.outliers]));
    let maxVal = Math.max(...data.flatMap(d => [d.max, ...d.outliers]));

    // Include spec limits
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    const padding = (maxVal - minVal) * 0.1;
    return [minVal - padding, maxVal + padding] as [number, number];
  }, [data, specs]);

  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, width],
        domain: data.map(d => d.key),
        padding: 0.4,
      }),
    [data, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height, 0],
        domain: yDomain,
        nice: true,
      }),
    [height, yDomain]
  );

  if (data.length === 0) return null;

  const totalSampleSize = sampleSize ?? data.reduce((sum, d) => sum + d.values.length, 0);

  return (
    <>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          {/* Spec Lines */}
          {specs.usl !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={yScale(specs.usl)}
              y2={yScale(specs.usl)}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          )}
          {specs.lsl !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={yScale(specs.lsl)}
              y2={yScale(specs.lsl)}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          )}
          {specs.target !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={yScale(specs.target)}
              y2={yScale(specs.target)}
              stroke="#22c55e"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}

          {/* Boxplots */}
          {data.map((d, i) => {
            const x = xScale(d.key) || 0;
            const barWidth = xScale.bandwidth();
            const isSelected = selectedGroups.includes(d.key);
            const hasSelection = selectedGroups.length > 0;
            const opacity = hasSelection && !isSelected ? 0.3 : 1;

            return (
              <Group
                key={i}
                onClick={() => onBoxClick?.(d.key)}
                onMouseOver={() =>
                  showTooltip({
                    tooltipLeft: x + barWidth,
                    tooltipTop: yScale(d.median),
                    tooltipData: d,
                  })
                }
                onMouseLeave={hideTooltip}
                className={onBoxClick ? 'cursor-pointer' : ''}
                opacity={opacity}
              >
                {/* Transparent capture rect for better clickability */}
                <rect x={x - 5} y={0} width={barWidth + 10} height={height} fill="transparent" />

                {/* Whisker Line */}
                <line
                  x1={x + barWidth / 2}
                  x2={x + barWidth / 2}
                  y1={yScale(d.min)}
                  y2={yScale(d.max)}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />

                {/* Min whisker cap */}
                <line
                  x1={x + barWidth / 4}
                  x2={x + (3 * barWidth) / 4}
                  y1={yScale(d.min)}
                  y2={yScale(d.min)}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />

                {/* Max whisker cap */}
                <line
                  x1={x + barWidth / 4}
                  x2={x + (3 * barWidth) / 4}
                  y1={yScale(d.max)}
                  y2={yScale(d.max)}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />

                {/* Box */}
                <rect
                  x={x}
                  y={yScale(d.q3)}
                  width={barWidth}
                  height={Math.abs(yScale(d.q1) - yScale(d.q3))}
                  fill={isSelected ? '#0ea5e9' : '#475569'}
                  stroke={isSelected ? '#0284c7' : '#64748b'}
                  rx={2}
                />

                {/* Median Line */}
                <line
                  x1={x}
                  x2={x + barWidth}
                  y1={yScale(d.median)}
                  y2={yScale(d.median)}
                  stroke="#f97316"
                  strokeWidth={2}
                />

                {/* Outliers */}
                {d.outliers.map((o, j) => (
                  <circle
                    key={j}
                    cx={x + barWidth / 2}
                    cy={yScale(o)}
                    r={3}
                    fill="#ef4444"
                    opacity={0.6}
                  />
                ))}
              </Group>
            );
          })}

          {/* Y-Axis */}
          <AxisLeft
            scale={yScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: 'monospace',
            })}
          />

          {/* Y-Axis Label */}
          <text
            x={parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50}
            y={height / 2}
            transform={`rotate(-90 ${parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50} ${height / 2})`}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            {yAxisLabel}
          </text>

          {/* X-Axis */}
          <AxisBottom
            top={height}
            scale={xScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            tickLabelProps={() => ({
              fill: '#94a3b8',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
            })}
          />

          {/* X-Axis Label */}
          <text
            x={width / 2}
            y={height + (parentWidth < 400 ? 35 : 50)}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            {xAxisLabel}
          </text>

          {/* Source Bar (branding) */}
          {showBranding && (
            <ChartSourceBar
              width={width}
              top={height + margin.bottom - sourceBarHeight}
              n={totalSampleSize}
              brandingText={brandingText}
            />
          )}
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={margin.left + (tooltipLeft ?? 0)}
          top={margin.top + (tooltipTop ?? 0)}
          style={{
            ...defaultStyles,
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
          }}
        >
          <div>
            <strong>{tooltipData.key}</strong>
          </div>
          <div>Median: {tooltipData.median.toFixed(2)}</div>
          <div>Q1: {tooltipData.q1.toFixed(2)}</div>
          <div>Q3: {tooltipData.q3.toFixed(2)}</div>
          <div>n: {tooltipData.values.length}</div>
        </TooltipWithBounds>
      )}
    </>
  );
};

// Export with responsive wrapper
const Boxplot = withParentSize(BoxplotBase);
export default Boxplot;

// Also export the base component for custom sizing
export { BoxplotBase };
