import React, { useMemo, useCallback } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS } from '@variscout/core';
import type { ActivityType } from '@variscout/core';
import type { YamazumiChartProps } from './types';
import ChartSourceBar from './ChartSourceBar';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { useChartLayout, useChartTooltip } from './hooks';
import { interactionStyles } from './styles/interactionStyles';
import { getBarA11yProps } from './utils/accessibility';

/** Highlight color name → hex fill color */
const getHighlightFillColors = (colors: Record<string, string>) => ({
  red: colors.fail,
  amber: colors.warning,
  green: colors.pass,
});

interface TooltipData {
  stepKey: string;
  activityType: ActivityType;
  time: number;
  percentage: number;
  count: number;
  totalTime: number;
}

/**
 * Yamazumi Chart — stacked bar chart for lean time study analysis
 *
 * Visualizes cycle time composition by activity type (VA/NVA Required/Waste/Wait)
 * across process steps. Uses fixed semantic colors that never change by drill level.
 */
const YamazumiChartBase: React.FC<YamazumiChartProps> = ({
  data,
  taktTime,
  selectedBars = [],
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onBarClick,
  onSegmentClick,
  onBarContextMenu,
  highlightedBars,
  showPercentLabels = false,
  yAxisLabel = 'Cycle Time',
}) => {
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'yamazumi',
    showBranding,
  });

  const { chrome, formatStat, t } = useChartTheme();
  const tooltip = useChartTooltip<TooltipData>();

  const highlightFillColors = useMemo(() => getHighlightFillColors(chartColors), []);

  // Scales
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map(d => d.key),
        range: [0, width],
        padding: 0.2,
      }),
    [data, width]
  );

  const maxTime = useMemo(() => {
    const dataMax = Math.max(...data.map(d => d.totalTime), 0);
    return taktTime ? Math.max(dataMax, taktTime * 1.1) : dataMax;
  }, [data, taktTime]);

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxTime * 1.05],
        range: [height, 0],
        nice: true,
      }),
    [maxTime, height]
  );

  const handleBarClick = useCallback(
    (key: string) => {
      onBarClick?.(key);
    },
    [onBarClick]
  );

  const handleSegmentClick = useCallback(
    (key: string, activityType: ActivityType) => {
      onSegmentClick?.(key, activityType);
    },
    [onSegmentClick]
  );

  const handleContextMenu = useCallback(
    (key: string, event: React.MouseEvent) => {
      event.preventDefault();
      onBarContextMenu?.(key, event);
    },
    [onBarContextMenu]
  );

  if (width < 10 || height < 10) return null;

  const barWidth = xScale.bandwidth();

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width={parentWidth}
        height={parentHeight - sourceBarHeight}
        data-testid="chart-yamazumi"
        role="img"
        aria-label="Yamazumi chart — Shows cycle time composition by activity type across process steps"
      >
        <Group left={margin.left} top={margin.top}>
          {/* Grid lines */}
          <GridRows
            scale={yScale}
            width={width}
            stroke={chrome.gridLine}
            strokeOpacity={0.5}
            numTicks={5}
          />

          {/* Stacked bars */}
          {data.map(bar => {
            const x = xScale(bar.key) ?? 0;
            const isSelected = selectedBars.length === 0 || selectedBars.includes(bar.key);
            const highlightColor = highlightedBars?.[bar.key];
            let yOffset = height;

            return (
              <Group key={bar.key}>
                {bar.segments.map(segment => {
                  const barHeight = height - yScale(segment.totalTime);
                  yOffset -= barHeight;

                  const fill = highlightColor
                    ? highlightFillColors[highlightColor]
                    : ACTIVITY_TYPE_COLORS[segment.activityType];

                  return (
                    <Bar
                      key={`${bar.key}-${segment.activityType}`}
                      x={x}
                      y={yOffset}
                      width={barWidth}
                      height={Math.max(0, barHeight)}
                      fill={fill}
                      opacity={isSelected ? 1 : 0.3}
                      className={onBarClick || onSegmentClick ? interactionStyles.clickable : ''}
                      onClick={() => {
                        if (onSegmentClick) {
                          handleSegmentClick(bar.key, segment.activityType);
                        } else {
                          handleBarClick(bar.key);
                        }
                      }}
                      onContextMenu={(e: React.MouseEvent) => handleContextMenu(bar.key, e)}
                      onMouseMove={(event: React.MouseEvent) => {
                        tooltip.showTooltipAtPoint(event, {
                          stepKey: bar.key,
                          activityType: segment.activityType,
                          time: segment.totalTime,
                          percentage: segment.percentage,
                          count: segment.count,
                          totalTime: bar.totalTime,
                        });
                      }}
                      onMouseLeave={() => tooltip.hideTooltip()}
                      {...getBarA11yProps(
                        `${bar.key} - ${ACTIVITY_TYPE_LABELS[segment.activityType]}`,
                        segment.totalTime
                      )}
                    />
                  );
                })}

                {/* Percentage labels on segments */}
                {showPercentLabels &&
                  (() => {
                    let labelY = height;
                    return bar.segments.map(segment => {
                      const barH = height - yScale(segment.totalTime);
                      labelY -= barH;
                      if (barH < 14) return null;
                      return (
                        <text
                          key={`label-${bar.key}-${segment.activityType}`}
                          x={x + barWidth / 2}
                          y={labelY + barH / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={fonts.tickLabel}
                          fontWeight={600}
                          pointerEvents="none"
                        >
                          {Math.round(segment.percentage * 100)}%
                        </text>
                      );
                    });
                  })()}
              </Group>
            );
          })}

          {/* Takt time line */}
          {taktTime !== undefined && taktTime > 0 && (
            <Group>
              <line
                x1={0}
                x2={width}
                y1={yScale(taktTime)}
                y2={yScale(taktTime)}
                stroke={chartColors.spec}
                strokeWidth={2}
                strokeDasharray="6,4"
                pointerEvents="none"
              />
              <text
                x={width - 4}
                y={yScale(taktTime) - 6}
                textAnchor="end"
                fill={chartColors.spec}
                fontSize={fonts.tickLabel}
                fontWeight={600}
              >
                {t?.('yamazumi.takt') ?? 'Takt'}: {formatStat(taktTime)}
              </text>
            </Group>
          )}

          {/* X-axis */}
          <AxisBottom
            top={height}
            scale={xScale}
            tickLabelProps={() => ({
              fill: chrome.axisPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end' as const,
              dy: '0.25em',
              angle: data.length > 6 ? -45 : 0,
              ...(data.length <= 6 ? { textAnchor: 'middle' as const } : {}),
            })}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            hideAxisLine={false}
          />

          {/* Y-axis */}
          <AxisLeft
            scale={yScale}
            tickLabelProps={() => ({
              fill: chrome.axisPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end' as const,
              dx: '-0.25em',
              dy: '0.3em',
            })}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            numTicks={5}
            label={yAxisLabel}
            labelProps={{
              fill: chrome.labelPrimary,
              fontSize: fonts.axisLabel,
              textAnchor: 'middle',
            }}
          />
        </Group>
      </svg>

      {/* Branding */}
      {showBranding && (
        <ChartSourceBar
          width={parentWidth}
          top={parentHeight - sourceBarHeight}
          brandingText={brandingText}
        />
      )}

      {/* Tooltip */}
      {tooltip.tooltipOpen && tooltip.tooltipData && (
        <TooltipWithBounds
          left={tooltip.tooltipLeft}
          top={tooltip.tooltipTop}
          style={{
            ...defaultStyles,
            backgroundColor: chrome.tooltipBg ?? '#1e293b',
            color: '#e2e8f0',
            padding: '8px 12px',
            fontSize: fonts.tickLabel,
            borderRadius: 6,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{tooltip.tooltipData.stepKey}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: ACTIVITY_TYPE_COLORS[tooltip.tooltipData.activityType],
                display: 'inline-block',
              }}
            />
            <span>{ACTIVITY_TYPE_LABELS[tooltip.tooltipData.activityType]}</span>
          </div>
          <div style={{ marginTop: 2 }}>
            {formatStat(tooltip.tooltipData.time)} (
            {Math.round(tooltip.tooltipData.percentage * 100)}%)
          </div>
          <div style={{ color: '#94a3b8', marginTop: 2, fontSize: fonts.tickLabel - 1 }}>
            Total: {formatStat(tooltip.tooltipData.totalTime)} · {tooltip.tooltipData.count}{' '}
            {tooltip.tooltipData.count === 1 ? 'row' : 'rows'}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

/** Responsive wrapper with automatic parent size detection */
const YamazumiChart = withParentSize(YamazumiChartBase);

export default YamazumiChart;
export { YamazumiChartBase };
