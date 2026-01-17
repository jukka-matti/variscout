import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scalePoint, scaleLinear, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath, Circle } from '@visx/shape';
import { curveLinear } from '@visx/curve';
import { withParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import type { GageRRInteraction } from '@variscout/core';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import { chromeColors, operatorColors } from './colors';
import { useChartLayout } from './hooks';

export interface InteractionPlotProps {
  /** Interaction data from Gage R&R result */
  data: GageRRInteraction[];
  /** Container width from withParentSize */
  parentWidth: number;
  /** Container height from withParentSize */
  parentHeight: number;
  /** Show branding footer */
  showBranding?: boolean;
  /** Custom branding text */
  brandingText?: string;
}

/**
 * InteractionPlot - Shows Operator × Part interaction for Gage R&R
 * Lines should be parallel if no interaction exists
 */
const InteractionPlotBase: React.FC<InteractionPlotProps> = ({
  data,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
}) => {
  // InteractionPlot uses custom margins (different from responsive margins)
  const customSourceBarHeight = getSourceBarHeight(showBranding);
  const customMargin = useMemo(
    () => ({
      top: 30,
      right: 100, // Legend space
      bottom: 50 + customSourceBarHeight,
      left: 60,
    }),
    [customSourceBarHeight]
  );

  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'scatter', // closest match for base calculations
    showBranding,
    marginOverride: customMargin,
  });

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<GageRRInteraction>();

  // Extract unique parts and operators
  const parts = useMemo(() => [...new Set(data.map(d => d.part))], [data]);
  const operators = useMemo(() => [...new Set(data.map(d => d.operator))], [data]);

  // Group data by operator
  const operatorLines = useMemo(() => {
    const result: Map<string, GageRRInteraction[]> = new Map();
    operators.forEach(op => {
      result.set(
        op,
        data
          .filter(d => d.operator === op)
          .sort((a, b) => parts.indexOf(a.part) - parts.indexOf(b.part))
      );
    });
    return result;
  }, [data, operators, parts]);

  // Scales
  const xScale = useMemo(
    () =>
      scalePoint({
        range: [0, width],
        domain: parts,
        padding: 0.5,
      }),
    [parts, width]
  );

  const yDomain = useMemo(() => {
    if (data.length === 0) return [0, 1] as [number, number];
    const values = data.map(d => d.mean);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding] as [number, number];
  }, [data]);

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height, 0],
        domain: yDomain,
        nice: true,
      }),
    [height, yDomain]
  );

  const colorScale = useMemo(
    () =>
      scaleOrdinal({
        domain: operators,
        range: operatorColors.slice(0, operators.length),
      }),
    [operators]
  );

  if (parentWidth < 100 || parentHeight < 100 || data.length === 0) return null;

  const handleMouseMove = (event: React.MouseEvent, point: GageRRInteraction) => {
    const coords = localPoint(event);
    if (!coords) return;
    showTooltip({
      tooltipData: point,
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
    });
  };

  return (
    <>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          {/* Lines for each operator */}
          {operators.map(op => {
            const points = operatorLines.get(op) || [];
            return (
              <LinePath
                key={op}
                data={points}
                x={d => xScale(d.part) ?? 0}
                y={d => yScale(d.mean)}
                stroke={colorScale(op)}
                strokeWidth={2}
                curve={curveLinear}
              />
            );
          })}

          {/* Points for each data item */}
          {data.map(d => (
            <Circle
              key={`${d.part}-${d.operator}`}
              cx={xScale(d.part) ?? 0}
              cy={yScale(d.mean)}
              r={5}
              fill={colorScale(d.operator)}
              stroke={chromeColors.pointStroke}
              strokeWidth={1}
              style={{ cursor: 'pointer' }}
              onMouseMove={e => handleMouseMove(e, d)}
              onMouseLeave={hideTooltip}
            />
          ))}

          {/* Y Axis */}
          <AxisLeft
            scale={yScale}
            stroke={chromeColors.stageDivider}
            tickStroke={chromeColors.stageDivider}
            numTicks={5}
            tickLabelProps={() => ({
              fill: chromeColors.labelSecondary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dy: '0.33em',
            })}
          />

          {/* X Axis */}
          <AxisBottom
            scale={xScale}
            top={height}
            stroke={chromeColors.stageDivider}
            tickStroke={chromeColors.stageDivider}
            tickLabelProps={() => ({
              fill: chromeColors.labelSecondary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 4,
            })}
          />

          {/* Axis labels */}
          <text
            x={-height / 2}
            y={-45}
            transform="rotate(-90)"
            fill={chromeColors.labelSecondary}
            fontSize={fonts.axisLabel}
            textAnchor="middle"
          >
            Mean Measurement
          </text>
          <text
            x={width / 2}
            y={height + 40}
            fill={chromeColors.labelSecondary}
            fontSize={fonts.axisLabel}
            textAnchor="middle"
          >
            Part
          </text>

          {/* Legend */}
          <Group left={width + 15} top={0}>
            {operators.map((op, i) => (
              <Group key={op} top={i * 20}>
                <line x1={0} x2={15} y1={0} y2={0} stroke={colorScale(op)} strokeWidth={2} />
                <Circle cx={7.5} cy={0} r={4} fill={colorScale(op)} />
                <text
                  x={20}
                  y={0}
                  fill={chromeColors.labelSecondary}
                  fontSize={fonts.tickLabel}
                  dominantBaseline="middle"
                >
                  {op}
                </text>
              </Group>
            ))}
          </Group>
        </Group>

        {/* Branding */}
        {showBranding && (
          <ChartSourceBar
            left={0}
            top={parentHeight - sourceBarHeight}
            width={parentWidth}
            brandingText={brandingText}
            fontSize={fonts.brandingText}
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            ...defaultStyles,
            background: chromeColors.tooltipBg,
            border: `1px solid ${chromeColors.tooltipBorder}`,
            color: chromeColors.tooltipText,
            fontSize: fonts.tooltipText,
            padding: '8px 12px',
          }}
        >
          <div>
            <strong>{tooltipData.operator}</strong> × {tooltipData.part}
          </div>
          <div>Mean: {tooltipData.mean.toFixed(3)}</div>
        </TooltipWithBounds>
      )}
    </>
  );
};

// Wrapped version with responsive sizing
const InteractionPlot = withParentSize(InteractionPlotBase);

export { InteractionPlot as default, InteractionPlotBase };
