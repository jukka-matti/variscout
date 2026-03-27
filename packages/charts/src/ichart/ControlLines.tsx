/**
 * Control limit, spec limit, and mean reference lines for I-Chart.
 *
 * Renders horizontal lines for UCL, LCL, mean (both staged and non-staged),
 * spec limits (USL, LSL, target), and secondary series control limits.
 */

import React from 'react';
import { Line } from '@visx/shape';
import type { StatsResult, StageBoundary, SpecLimits, MessageCatalog } from '@variscout/core';
import type { ChartFonts } from '@variscout/core';
import { chartColors, operatorColors } from '../colors';
import { interactionStyles } from '../styles/interactionStyles';
import { getInteractiveA11yProps } from '../utils/accessibility';

/** Visx scale type (avoids d3-scale direct dependency) */
type ViScale = { (value: number): number };

interface ControlLinesProps {
  /** Chart plot area width */
  width: number;
  /** Chart plot area height */
  height: number;
  /** Y-axis scale */
  yScale: ViScale;
  /** X-axis scale */
  xScale: ViScale;
  /** Overall stats (used in non-staged mode) */
  stats: StatsResult | null;
  /** Spec limits */
  specs: SpecLimits;
  /** Whether chart is in staged mode */
  isStaged: boolean;
  /** Stage boundaries for staged mode */
  stageBoundaries: StageBoundary[];
  /** Whether to show limit labels on the right edge */
  showLimitLabels: boolean;
  /** Font sizes for labels */
  fonts: ChartFonts;
  /** Chrome colors from theme */
  chrome: {
    labelSecondary: string;
    stageDivider: string;
  };
  /** Format a stat value for display */
  formatStat: (value: number, decimals?: number) => string;
  /** Translation function */
  t: (key: keyof MessageCatalog) => string;
  /** Template translation function */
  tf: (key: keyof MessageCatalog, params: Record<string, string | number>) => string;
  /** Callback when a spec label is clicked */
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  /** Custom target label text */
  targetLabel?: string;
  /** Secondary series stats (for capability/dual-series mode) */
  secondaryStats?: StatsResult | null;
  /** Whether secondary series is present */
  hasSecondary: boolean;
}

/**
 * Resolve overlapping label positions by nudging labels apart.
 *
 * Sorts labels by y-position, then iteratively enforces a minimum gap between
 * adjacent labels using alternating top-down/bottom-up passes. Each pass pushes
 * overlapping pairs apart evenly, converging within a few iterations.
 */
function resolveLabels(
  entries: { key: string; y: number }[],
  minGap: number,
  chartHeight: number
): Map<string, number> {
  if (entries.length === 0) return new Map();

  const sorted = [...entries].sort((a, b) => a.y - b.y);
  const pos = sorted.map(e => e.y);

  // Iterative relaxation: alternate top-down and bottom-up passes
  for (let iter = 0; iter < 8; iter++) {
    let settled = true;

    // Top-down: push overlapping labels apart
    for (let i = 1; i < pos.length; i++) {
      const overlap = minGap - (pos[i] - pos[i - 1]);
      if (overlap > 0) {
        pos[i - 1] -= overlap / 2;
        pos[i] += overlap / 2;
        settled = false;
      }
    }

    // Bottom-up: push overlapping labels apart
    for (let i = pos.length - 2; i >= 0; i--) {
      const overlap = minGap - (pos[i + 1] - pos[i]);
      if (overlap > 0) {
        pos[i] -= overlap / 2;
        pos[i + 1] += overlap / 2;
        settled = false;
      }
    }

    if (settled) break;
  }

  // Clamp to chart bounds
  for (let i = 0; i < pos.length; i++) {
    pos[i] = Math.max(minGap / 2, Math.min(chartHeight - minGap / 2, pos[i]));
  }

  const result = new Map<string, number>();
  sorted.forEach((entry, i) => result.set(entry.key, pos[i]));
  return result;
}

const ControlLines: React.FC<ControlLinesProps> = ({
  width,
  height,
  yScale,
  xScale,
  stats,
  specs,
  isStaged,
  stageBoundaries,
  showLimitLabels,
  fonts,
  chrome,
  formatStat,
  t,
  tf,
  onSpecClick,
  targetLabel,
  secondaryStats,
  hasSecondary,
}) => {
  // Build resolved label positions to avoid overlap
  const labelPositions = React.useMemo(() => {
    if (!showLimitLabels) return new Map<string, number>();

    const entries: { key: string; y: number }[] = [];

    // Control limits (non-staged only)
    if (!isStaged && stats) {
      entries.push({ key: 'ucl', y: yScale(stats.ucl) });
      entries.push({ key: 'mean', y: yScale(stats.mean) });
      entries.push({ key: 'lcl', y: yScale(stats.lcl) });
    }

    // Spec limits
    if (specs.usl !== undefined) {
      entries.push({ key: 'usl', y: yScale(specs.usl) });
    }
    if (specs.lsl !== undefined) {
      entries.push({ key: 'lsl', y: yScale(specs.lsl) });
    }
    if (specs.target !== undefined) {
      entries.push({ key: 'target', y: yScale(specs.target) });
    }

    // Ideal gap is 1.4× font size, but shrink if labels won't fit in the chart height
    const idealGap = fonts.statLabel * 1.4;
    const totalNeeded = idealGap * (entries.length - 1);
    const minGap = totalNeeded > height ? height / Math.max(entries.length, 1) : idealGap;
    return resolveLabels(entries, minGap, height);
  }, [showLimitLabels, isStaged, stats, specs, yScale, fonts.statLabel, height]);

  /** Get the resolved y-position for a label, falling back to the raw scaled value. */
  const labelY = (key: string, rawY: number): number => labelPositions.get(key) ?? rawY;

  return (
    <>
      {/* Control limits - Staged mode */}
      {isStaged &&
        stageBoundaries.map((boundary, idx) => {
          const x1 = xScale(boundary.startX);
          const x2 = xScale(boundary.endX);
          const stageWidth = x2 - x1;

          return (
            <React.Fragment key={boundary.name}>
              {/* Stage divider (vertical line at stage boundary) */}
              {idx > 0 && (
                <Line
                  from={{ x: x1 - 5, y: 0 }}
                  to={{ x: x1 - 5, y: height }}
                  stroke={chrome.stageDivider}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              )}

              {/* Stage label at top */}
              <text
                x={x1 + stageWidth / 2}
                y={-8}
                textAnchor="middle"
                fill={chrome.labelSecondary}
                fontSize={fonts.tickLabel}
                fontWeight={500}
              >
                {boundary.name}
              </text>

              {/* UCL for this stage */}
              <Line
                from={{ x: x1, y: yScale(boundary.stats.ucl) }}
                to={{ x: x2, y: yScale(boundary.stats.ucl) }}
                stroke={chartColors.control}
                strokeWidth={0.8}
                strokeDasharray="6,4"
                strokeOpacity={0.6}
              />

              {/* Mean for this stage */}
              <Line
                from={{ x: x1, y: yScale(boundary.stats.mean) }}
                to={{ x: x2, y: yScale(boundary.stats.mean) }}
                stroke={chartColors.mean}
                strokeWidth={2}
              />

              {/* LCL for this stage */}
              <Line
                from={{ x: x1, y: yScale(boundary.stats.lcl) }}
                to={{ x: x2, y: yScale(boundary.stats.lcl) }}
                stroke={chartColors.control}
                strokeWidth={0.8}
                strokeDasharray="6,4"
                strokeOpacity={0.6}
              />
            </React.Fragment>
          );
        })}

      {/* Control limits - Non-staged mode */}
      {!isStaged && stats && (
        <>
          {/* UCL */}
          <Line
            from={{ x: 0, y: yScale(stats.ucl) }}
            to={{ x: width, y: yScale(stats.ucl) }}
            stroke={chartColors.control}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          {/* UCL label */}
          {showLimitLabels && (
            <text
              x={width + 4}
              y={labelY('ucl', yScale(stats.ucl))}
              fill={chartColors.control}
              fontSize={fonts.statLabel}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {t('chart.label.ucl')} {formatStat(stats.ucl, 1)}
            </text>
          )}
          {/* Mean */}
          <Line
            from={{ x: 0, y: yScale(stats.mean) }}
            to={{ x: width, y: yScale(stats.mean) }}
            stroke={chartColors.mean}
            strokeWidth={1.5}
          />
          {/* Mean label */}
          {showLimitLabels && (
            <text
              x={width + 4}
              y={labelY('mean', yScale(stats.mean))}
              fill={chartColors.mean}
              fontSize={fonts.statLabel}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {t('chart.label.mean')} {formatStat(stats.mean, 1)}
            </text>
          )}
          {/* LCL */}
          <Line
            from={{ x: 0, y: yScale(stats.lcl) }}
            to={{ x: width, y: yScale(stats.lcl) }}
            stroke={chartColors.control}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          {/* LCL label */}
          {showLimitLabels && (
            <text
              x={width + 4}
              y={labelY('lcl', yScale(stats.lcl))}
              fill={chartColors.control}
              fontSize={fonts.statLabel}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {t('chart.label.lcl')} {formatStat(stats.lcl, 1)}
            </text>
          )}
        </>
      )}

      {/* Spec limits */}
      {specs.usl !== undefined && (
        <>
          <Line
            from={{ x: 0, y: yScale(specs.usl) }}
            to={{ x: width, y: yScale(specs.usl) }}
            stroke={chartColors.spec}
            strokeWidth={1.5}
            strokeDasharray="8,3,2,3"
            strokeOpacity={0.7}
          />
          {/* USL label - clickable for editing */}
          {showLimitLabels && (
            <text
              x={width + 4}
              y={labelY('usl', yScale(specs.usl))}
              fill={chartColors.spec}
              fontSize={fonts.statLabel}
              textAnchor="start"
              dominantBaseline="middle"
              className={onSpecClick ? interactionStyles.clickableSubtle : ''}
              onClick={() => onSpecClick?.('usl')}
              {...getInteractiveA11yProps(
                tf('chart.edit.spec', { spec: t('limits.usl') }),
                onSpecClick ? () => onSpecClick('usl') : undefined
              )}
            >
              {onSpecClick && <title>{tf('chart.edit.spec', { spec: t('limits.usl') })}</title>}
              {t('chart.label.usl')} {formatStat(specs.usl, 1)}
            </text>
          )}
        </>
      )}
      {specs.lsl !== undefined && (
        <>
          <Line
            from={{ x: 0, y: yScale(specs.lsl) }}
            to={{ x: width, y: yScale(specs.lsl) }}
            stroke={chartColors.spec}
            strokeWidth={1.5}
            strokeDasharray="8,3,2,3"
            strokeOpacity={0.7}
          />
          {/* LSL label - clickable for editing */}
          {showLimitLabels && (
            <text
              x={width + 4}
              y={labelY('lsl', yScale(specs.lsl))}
              fill={chartColors.spec}
              fontSize={fonts.statLabel}
              textAnchor="start"
              dominantBaseline="middle"
              className={onSpecClick ? interactionStyles.clickableSubtle : ''}
              onClick={() => onSpecClick?.('lsl')}
              {...getInteractiveA11yProps(
                tf('chart.edit.spec', { spec: t('limits.lsl') }),
                onSpecClick ? () => onSpecClick('lsl') : undefined
              )}
            >
              {onSpecClick && <title>{tf('chart.edit.spec', { spec: t('limits.lsl') })}</title>}
              {t('chart.label.lsl')} {formatStat(specs.lsl, 1)}
            </text>
          )}
        </>
      )}
      {specs.target !== undefined && (
        <>
          <Line
            from={{ x: 0, y: yScale(specs.target) }}
            to={{ x: width, y: yScale(specs.target) }}
            stroke={chartColors.target}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          {/* Target label - clickable for editing */}
          {showLimitLabels && (
            <text
              x={width + 4}
              y={labelY('target', yScale(specs.target))}
              fill={chartColors.target}
              fontSize={fonts.statLabel}
              textAnchor="start"
              dominantBaseline="middle"
              className={onSpecClick ? interactionStyles.clickableSubtle : ''}
              onClick={() => onSpecClick?.('target')}
              {...getInteractiveA11yProps(
                tf('chart.edit.spec', { spec: t('stats.target') }),
                onSpecClick ? () => onSpecClick('target') : undefined
              )}
            >
              {onSpecClick && <title>{tf('chart.edit.spec', { spec: t('stats.target') })}</title>}
              {targetLabel ?? t('chart.label.tgt')} {formatStat(specs.target, 1)}
            </text>
          )}
        </>
      )}

      {/* Secondary series control limits (dashed, distinct color) */}
      {hasSecondary && secondaryStats && (
        <>
          <Line
            from={{ x: 0, y: yScale(secondaryStats.ucl) }}
            to={{ x: width, y: yScale(secondaryStats.ucl) }}
            stroke={operatorColors[1]}
            strokeWidth={0.8}
            strokeDasharray="3,3"
            strokeOpacity={0.5}
          />
          <Line
            from={{ x: 0, y: yScale(secondaryStats.mean) }}
            to={{ x: width, y: yScale(secondaryStats.mean) }}
            stroke={operatorColors[1]}
            strokeWidth={1}
            strokeOpacity={0.6}
          />
          <Line
            from={{ x: 0, y: yScale(secondaryStats.lcl) }}
            to={{ x: width, y: yScale(secondaryStats.lcl) }}
            stroke={operatorColors[1]}
            strokeWidth={0.8}
            strokeDasharray="3,3"
            strokeOpacity={0.5}
          />
        </>
      )}
    </>
  );
};

export default ControlLines;
