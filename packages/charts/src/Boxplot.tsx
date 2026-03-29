import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import ViolinPlot from '@visx/stats/lib/ViolinPlot';
import type { BoxplotProps, BoxplotGroupData } from './types';
import ChartSourceBar from './ChartSourceBar';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { useChartLayout, useChartTooltip, useSelectionState } from './hooks';
import { interactionStyles } from './styles/interactionStyles';
import { getBoxplotA11yProps, getInteractiveA11yProps } from './utils/accessibility';
import { calculateKDE } from '@variscout/core';

/** Minimum data points required to render a box-and-whisker; fewer renders jittered dots */
export const MIN_BOXPLOT_VALUES = 7;

/** Default threshold for high variation highlight (50%) */
const DEFAULT_VARIATION_THRESHOLD = 50;

/** Map highlight color name to hex fill color */
/** Map highlight color name to hex fill color */
const getHighlightFillColors = (colors: Record<string, string>) => ({
  red: colors.fail,
  amber: colors.warning,
  green: colors.pass,
});

/**
 * Boxplot Chart - Props-based version
 * Shows distribution comparison across groups
 */
const BoxplotBase: React.FC<BoxplotProps> = ({
  data,
  specs,
  yAxisLabel = 'Value',
  xAxisLabel = 'Group',
  yDomainOverride,
  selectedGroups = [],
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onBoxClick,
  sampleSize,
  variationPct,
  variationThreshold = DEFAULT_VARIATION_THRESHOLD,
  categoryContributions,
  showContributionLabels = false,
  showContributionBars,
  onYAxisClick,
  onXAxisClick,
  xTickFormat,
  showViolin = false,
  violinData: violinDataProp,
  highlightedCategories,
  onBoxContextMenu,
  fillOverrides,
  groupSize,
}) => {
  // Show contribution bars by default when categoryContributions is provided
  const shouldShowBars = showContributionBars ?? categoryContributions !== undefined;
  // Determine if this factor should be highlighted as a drill target
  const isHighVariation = variationPct !== undefined && variationPct >= variationThreshold;

  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'boxplot',
    showBranding,
  });

  const { chrome, colors, formatStat, t } = useChartTheme();
  const highlightFillColors = getHighlightFillColors(colors);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltipAtCoords, hideTooltip } =
    useChartTooltip<BoxplotGroupData>();

  const { isSelected, getOpacity } = useSelectionState({
    selectedKeys: selectedGroups,
  });

  // Calculate Y domain from data
  const yDomain = useMemo(() => {
    // Priority 1: yDomainOverride (for Y-axis lock feature)
    if (yDomainOverride) {
      return [yDomainOverride.min, yDomainOverride.max] as [number, number];
    }

    // Priority 2: Auto-calculate from data
    if (data.length === 0) return [0, 1] as [number, number];

    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const d of data) {
      if (d.min < minVal) minVal = d.min;
      if (d.max > maxVal) maxVal = d.max;
      for (const o of d.outliers) {
        if (o < minVal) minVal = o;
        if (o > maxVal) maxVal = o;
      }
    }

    // Include spec limits
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    const padding = (maxVal - minVal) * 0.1;
    return [minVal - padding, maxVal + padding] as [number, number];
  }, [data, specs, yDomainOverride]);

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

  // Use pre-computed KDE data from prop, or compute internally as fallback
  const violinData = useMemo(() => {
    if (!showViolin) return new Map<string, Array<{ value: number; count: number }>>();
    if (violinDataProp && violinDataProp.size > 0) return violinDataProp;
    const map = new Map<string, Array<{ value: number; count: number }>>();
    for (const d of data) {
      if (d.values.length >= 2) {
        map.set(d.key, calculateKDE(d.values));
      }
    }
    return map;
  }, [data, showViolin, violinDataProp]);

  if (data.length === 0) return null;

  const totalSampleSize = sampleSize ?? data.reduce((sum, d) => sum + d.values.length, 0);

  // Calculate the n label vertical offset based on whether contribution labels are shown
  const nLabelOffset =
    showContributionLabels && categoryContributions
      ? parentWidth < 400
        ? 36
        : 42
      : parentWidth < 400
        ? 24
        : 28;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        width={parentWidth}
        height={parentHeight}
        role="img"
        aria-label={`Boxplot: ${yAxisLabel} distribution`}
      >
        <Group left={margin.left} top={margin.top}>
          {/* Spec Lines */}
          {specs.usl !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={yScale(specs.usl)}
              y2={yScale(specs.usl)}
              stroke={colors.spec}
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
              stroke={colors.spec}
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
              stroke={colors.target}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}

          {/* Boxplots */}
          {data.map((d, i) => {
            const x = xScale(d.key) || 0;
            const barWidth = xScale.bandwidth();

            return (
              <Group
                key={i}
                onClick={() => onBoxClick?.(d.key)}
                onContextMenu={
                  onBoxContextMenu
                    ? (e: React.MouseEvent) => {
                        e.preventDefault();
                        onBoxContextMenu(d.key, e);
                      }
                    : undefined
                }
                onMouseOver={() => showTooltipAtCoords(x + barWidth, yScale(d.median), d)}
                onMouseLeave={hideTooltip}
                className={onBoxClick || onBoxContextMenu ? interactionStyles.clickable : ''}
                opacity={getOpacity(d.key)}
                {...getBoxplotA11yProps(
                  d.key,
                  d.median,
                  d.values.length,
                  onBoxClick ? () => onBoxClick(d.key) : undefined
                )}
              >
                {/* Transparent capture rect for better clickability */}
                <rect x={x - 5} y={0} width={barWidth + 10} height={height} fill="transparent" />

                {d.values.length < MIN_BOXPLOT_VALUES ? (
                  <>
                    {/* Dot fallback mode: jittered dots for small sample sizes */}
                    {d.values.map((v, j) => {
                      const jitter =
                        ((((j * 7 + Math.round(v * 13)) % 11) - 5) / 5) * barWidth * 0.2;
                      const dotFill = highlightedCategories?.[d.key]
                        ? highlightFillColors[highlightedCategories[d.key]]
                        : fillOverrides?.[d.key]
                          ? fillOverrides[d.key]
                          : isSelected(d.key)
                            ? colors.selected
                            : chrome.labelSecondary;
                      return (
                        <circle
                          key={j}
                          cx={x + barWidth / 2 + jitter}
                          cy={yScale(v)}
                          r={4}
                          fill={dotFill}
                          opacity={0.8}
                          data-testid={`dot-fallback-${d.key}-${j}`}
                        />
                      );
                    })}

                    {/* Mean marker (diamond) */}
                    <polygon
                      points={`
                        ${x + barWidth / 2},${yScale(d.mean) - 4}
                        ${x + barWidth / 2 + 4},${yScale(d.mean)}
                        ${x + barWidth / 2},${yScale(d.mean) + 4}
                        ${x + barWidth / 2 - 4},${yScale(d.mean)}
                      `}
                      fill={chrome.labelPrimary}
                    />
                  </>
                ) : showViolin && violinData.has(d.key) ? (
                  <>
                    {/* Violin-primary mode: prominent density curve with thin inner box */}
                    <ViolinPlot
                      data={violinData.get(d.key)!}
                      left={x + barWidth / 2}
                      width={barWidth}
                      valueScale={yScale}
                      value={(d: { value: number; count: number }) => d.value}
                      count={(d: { value: number; count: number }) => d.count}
                      fill={chrome.boxDefault}
                      fillOpacity={0.35}
                      stroke={chrome.boxBorder}
                      strokeWidth={1.5}
                      strokeOpacity={0.7}
                    />

                    {/* Thin inner box (20% of barWidth, centered) */}
                    <rect
                      x={x + barWidth * 0.4}
                      y={yScale(d.q3)}
                      width={barWidth * 0.2}
                      height={Math.abs(yScale(d.q1) - yScale(d.q3))}
                      fill={chrome.boxDefault}
                      fillOpacity={0.6}
                      stroke={chrome.boxBorder}
                      rx={1}
                    />

                    {/* Median line (spans thin box) */}
                    <line
                      x1={x + barWidth * 0.4}
                      x2={x + barWidth * 0.6}
                      y1={yScale(d.median)}
                      y2={yScale(d.median)}
                      stroke={chartColors.cumulative}
                      strokeWidth={2}
                    />

                    {/* Mean marker (diamond, centered) */}
                    <polygon
                      points={`
                        ${x + barWidth / 2},${yScale(d.mean) - 4}
                        ${x + barWidth / 2 + 4},${yScale(d.mean)}
                        ${x + barWidth / 2},${yScale(d.mean) + 4}
                        ${x + barWidth / 2 - 4},${yScale(d.mean)}
                      `}
                      fill={chrome.labelPrimary}
                    />
                  </>
                ) : (
                  <>
                    {/* Standard boxplot mode: full box, whiskers, outliers */}

                    {/* Whisker Line */}
                    <line
                      x1={x + barWidth / 2}
                      x2={x + barWidth / 2}
                      y1={yScale(d.min)}
                      y2={yScale(d.max)}
                      stroke={chrome.whisker}
                      strokeWidth={1}
                    />

                    {/* Min whisker cap */}
                    <line
                      x1={x + barWidth / 4}
                      x2={x + (3 * barWidth) / 4}
                      y1={yScale(d.min)}
                      y2={yScale(d.min)}
                      stroke={chrome.whisker}
                      strokeWidth={1}
                    />

                    {/* Max whisker cap */}
                    <line
                      x1={x + barWidth / 4}
                      x2={x + (3 * barWidth) / 4}
                      y1={yScale(d.max)}
                      y2={yScale(d.max)}
                      stroke={chrome.whisker}
                      strokeWidth={1}
                    />

                    {/* Box */}
                    <rect
                      x={x}
                      y={yScale(d.q3)}
                      width={barWidth}
                      height={Math.abs(yScale(d.q1) - yScale(d.q3))}
                      fill={
                        highlightedCategories?.[d.key]
                          ? highlightFillColors[highlightedCategories[d.key]]
                          : fillOverrides?.[d.key]
                            ? fillOverrides[d.key]
                            : isSelected(d.key)
                              ? colors.selected
                              : chrome.boxDefault
                      }
                      fillOpacity={highlightedCategories?.[d.key] ? 0.7 : 1}
                      stroke={
                        highlightedCategories?.[d.key]
                          ? highlightFillColors[highlightedCategories[d.key]]
                          : isSelected(d.key)
                            ? colors.selectedBorder
                            : chrome.boxBorder
                      }
                      rx={2}
                      data-testid={`boxplot-box-${d.key}`}
                    />

                    {/* Median Line */}
                    <line
                      x1={x}
                      x2={x + barWidth}
                      y1={yScale(d.median)}
                      y2={yScale(d.median)}
                      stroke={colors.cumulative}
                      strokeWidth={2}
                    />

                    {/* Mean marker (diamond) */}
                    <polygon
                      points={`
                        ${x + barWidth / 2},${yScale(d.mean) - 4}
                        ${x + barWidth / 2 + 4},${yScale(d.mean)}
                        ${x + barWidth / 2},${yScale(d.mean) + 4}
                        ${x + barWidth / 2 - 4},${yScale(d.mean)}
                      `}
                      fill={chrome.labelPrimary}
                    />

                    {/* Outliers */}
                    {d.outliers.map((o, j) => (
                      <circle
                        key={j}
                        cx={x + barWidth / 2}
                        cy={yScale(o)}
                        r={3}
                        fill={colors.fail}
                        opacity={0.6}
                      />
                    ))}
                  </>
                )}
              </Group>
            );
          })}

          {/* Group separator lines (for staged boxplot) */}
          {groupSize &&
            groupSize > 1 &&
            data.map((_, i) => {
              // Draw separator after every groupSize boxes (between groups)
              if ((i + 1) % groupSize !== 0 || i === data.length - 1) return null;
              const nextKey = data[i + 1]?.key;
              if (!nextKey) return null;
              const x1Pos = (xScale(data[i].key) || 0) + xScale.bandwidth();
              const x2Pos = xScale(nextKey) || 0;
              const lineX = (x1Pos + x2Pos) / 2;
              return (
                <line
                  key={`sep-${i}`}
                  x1={lineX}
                  x2={lineX}
                  y1={0}
                  y2={height}
                  stroke={chrome.stageDivider}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  data-testid={`group-separator-${i}`}
                />
              );
            })}

          {/* Y-Axis */}
          <AxisLeft
            scale={yScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: 'monospace',
              fontWeight: 400,
            })}
          />

          {/* Y-Axis Label */}
          <text
            x={parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50}
            y={height / 2}
            transform={`rotate(-90 ${parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50} ${height / 2})`}
            textAnchor="middle"
            fill={chrome.labelPrimary}
            fontSize={fonts.axisLabel}
            fontWeight={500}
            onClick={onYAxisClick}
            className={onYAxisClick ? interactionStyles.clickableSubtle : ''}
            {...getInteractiveA11yProps(t('chart.edit.axisLabel'), onYAxisClick)}
          >
            {onYAxisClick && <title>{t('chart.edit.axisLabel')}</title>}
            {yAxisLabel}
          </text>

          {/* X-Axis */}
          <AxisBottom
            top={height}
            scale={xScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            tickFormat={xTickFormat}
            tickLabelProps={() => ({
              fill: chrome.labelSecondary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
              fontWeight: 400,
            })}
          />

          {/* Contribution Labels (below X-axis) */}
          {showContributionLabels &&
            categoryContributions &&
            data.map(d => {
              const contribution = categoryContributions.get(d.key);
              if (contribution === undefined) return null;
              const x = xScale(d.key) || 0;
              const barWidth = xScale.bandwidth();
              return (
                <text
                  key={`contrib-${d.key}`}
                  x={x + barWidth / 2}
                  y={height + (parentWidth < 400 ? 24 : 28)}
                  textAnchor="middle"
                  fill={contribution >= variationThreshold ? '#f87171' : chrome.labelSecondary}
                  fontSize={fonts.statLabel}
                  fontWeight={contribution >= variationThreshold ? 600 : 400}
                >
                  {Math.round(contribution)}%
                </text>
              );
            })}

          {/* n Labels (always visible below contribution labels or below x-axis) */}
          {data.map(d => {
            const x = xScale(d.key) || 0;
            const barWidth = xScale.bandwidth();
            return (
              <text
                key={`n-${d.key}`}
                x={x + barWidth / 2}
                y={height + nLabelOffset}
                textAnchor="middle"
                fill={chrome.labelMuted}
                fontSize={fonts.statLabel - 1}
              >
                n={d.values.length}
              </text>
            );
          })}

          {/* Contribution Bars (small horizontal bars under each box) */}
          {shouldShowBars &&
            categoryContributions &&
            data.map(d => {
              const contribution = categoryContributions.get(d.key) ?? 0;
              const x = xScale(d.key) || 0;
              const boxWidth = xScale.bandwidth();
              // Bar width proportional to contribution (max 100%)
              const contribBarWidth = Math.min(contribution / 100, 1) * boxWidth;
              const barY = height + nLabelOffset + 6;
              const isHighContrib = contribution >= variationThreshold;

              return (
                <rect
                  key={`bar-${d.key}`}
                  x={x}
                  y={barY}
                  width={contribBarWidth}
                  height={4}
                  fill={isHighContrib ? '#f87171' : chrome.labelSecondary}
                  rx={2}
                />
              );
            })}

          {/* X-Axis Label with Variation Indicator */}
          <text
            x={width / 2}
            y={height + (parentWidth < 400 ? 35 : 50)}
            textAnchor="middle"
            fill={isHighVariation ? '#f87171' : chrome.labelSecondary}
            fontSize={fonts.axisLabel}
            fontWeight={isHighVariation ? 600 : 500}
            onClick={onXAxisClick}
            className={onXAxisClick ? interactionStyles.clickableSubtle : ''}
            {...getInteractiveA11yProps(t('chart.edit.axisLabel'), onXAxisClick)}
          >
            {onXAxisClick && <title>{t('chart.edit.axisLabel')}</title>}
            {xAxisLabel}
          </text>
          {/* Drill suggestion indicator */}
          {isHighVariation && (
            <text
              x={width / 2}
              y={height + (parentWidth < 400 ? 35 : 50) + 14}
              textAnchor="middle"
              fill="#f87171"
              fontSize={fonts.statLabel}
            >
              {t('chart.drillHere')}
            </text>
          )}
        </Group>

        {/* Source Bar (branding) */}
        {showBranding && (
          <ChartSourceBar
            width={parentWidth}
            top={parentHeight - sourceBarHeight}
            n={totalSampleSize}
            brandingText={brandingText}
            fontSize={fonts.brandingText}
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={margin.left + (tooltipLeft ?? 0)}
          top={margin.top + (tooltipTop ?? 0)}
          style={{
            ...defaultStyles,
            backgroundColor: chrome.tooltipBg,
            color: chrome.tooltipText,
            border: `1px solid ${chrome.tooltipBorder}`,
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: fonts.tooltipText,
          }}
        >
          <div>
            <strong>{tooltipData.key}</strong>
          </div>
          <div>
            {t('chart.median')}: {formatStat(tooltipData.median)}
          </div>
          <div>
            {t('stats.mean')}: {formatStat(tooltipData.mean)}
          </div>
          <div>
            {t('chart.q1')}: {formatStat(tooltipData.q1)}
          </div>
          <div>
            {t('chart.q3')}: {formatStat(tooltipData.q3)}
          </div>
          <div>
            {t('chart.label.n')} {tooltipData.values.length}
          </div>
          {categoryContributions && categoryContributions.has(tooltipData.key) && (
            <div style={{ color: '#f87171', fontWeight: 500, marginTop: 4 }}>
              {t('report.kpi.variation')}:{' '}
              {Math.round(categoryContributions.get(tooltipData.key) ?? 0)}%
            </div>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
};

// Export with responsive wrapper
const Boxplot = withParentSize(BoxplotBase);
export default Boxplot;

// Also export the base component for custom sizing
export { BoxplotBase };
