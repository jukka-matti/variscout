/**
 * Data point rendering for I-Chart.
 *
 * Renders individual data points (primary + secondary series) with:
 * - Color coding based on violation type (spec, control, Nelson rules)
 * - Shape coding via ViolationPoint (diamond, square, triangle, circle)
 * - Click/hover handlers for tooltip and drill-down
 * - Brush selection support with visual feedback
 * - Highlighted point ring animation
 */

import React, { useMemo, useCallback } from 'react';
import { LinePath, Circle } from '@visx/shape';
import { inferCharacteristicType, type StatsResult, type SpecLimits } from '@variscout/core';
import type { IChartDataPoint, StageBoundary } from '@variscout/core';
import { chartColors, operatorColors } from '../colors';
import { interactionStyles } from '../styles/interactionStyles';
import { getDataPointA11yProps } from '../utils/accessibility';
import ViolationPoint from './ViolationShapes';
import type { ViolationShape } from './ViolationShapes';

/** Visx scale type (avoids d3-scale direct dependency) */
type ViScale = { (value: number): number };

interface DataPointsProps {
  /** Primary data series */
  data: IChartDataPoint[];
  /** X-axis scale */
  xScale: ViScale;
  /** Y-axis scale */
  yScale: ViScale;
  /** Overall stats (for non-staged mode) */
  stats: StatsResult | null;
  /** Staged stats (for stage-specific control limits) */
  stagedStats?: { stages: Map<string, StatsResult> };
  /** Spec limits */
  specs: SpecLimits;
  /** Whether chart is in staged mode */
  isStaged: boolean;
  /** Stage boundaries */
  stageBoundaries: StageBoundary[];
  /** Nelson Rule 2 violation indices */
  nelsonRule2Violations: Set<number>;
  /** Nelson Rule 3 violation indices */
  nelsonRule3Violations: Set<number>;
  /** Nelson Rule 3 sequences (for directional triangle shapes) */
  nelsonRule3Sequences: Array<{
    startIndex: number;
    endIndex: number;
    direction: 'increasing' | 'decreasing';
  }>;
  /** Chrome colors from theme */
  chrome: { dataLine: string; pointStroke: string };
  /** Translation function */
  t: (key: keyof import('@variscout/core').MessageCatalog) => string;
  /** Click handler for a data point */
  onPointClick?: (index: number, originalIndex?: number) => void;
  /** Whether brush selection is enabled */
  enableBrushSelection: boolean;
  /** Index of highlighted point (e.g., from finding navigation) */
  highlightedPointIndex?: number | null;
  /** Selection change handler */
  onSelectionChange?: (indices: Set<number>) => void;
  /** Check if point is selected (from brush) */
  isPointSelected: (index: number) => boolean;
  /** Get opacity for point (from brush) */
  getPointOpacity: (index: number) => number;
  /** Get size for point (from brush) */
  getPointSize: (index: number) => number;
  /** Get stroke width for point (from brush) */
  getPointStrokeWidth: (index: number) => number;
  /** Brush point click handler */
  handleBrushPointClick: (index: number, e: React.MouseEvent) => void;
  /** Show tooltip at coordinates */
  showTooltipAtCoords: (
    x: number,
    y: number,
    data: { x: number; y: number; index: number; stage?: string; timeValue?: string }
  ) => void;
  /** Hide tooltip */
  hideTooltip: () => void;
  /** Secondary data series */
  secondaryData?: IChartDataPoint[];
}

const DataPoints: React.FC<DataPointsProps> = ({
  data,
  xScale,
  yScale,
  stats,
  stagedStats,
  specs,
  isStaged,
  nelsonRule2Violations,
  nelsonRule3Violations,
  nelsonRule3Sequences,
  chrome,
  t,
  onPointClick,
  enableBrushSelection,
  highlightedPointIndex,
  onSelectionChange,
  isPointSelected,
  getPointOpacity,
  getPointSize,
  getPointStrokeWidth,
  handleBrushPointClick,
  showTooltipAtCoords,
  hideTooltip,
  secondaryData,
}) => {
  const hasSecondary = secondaryData && secondaryData.length > 0;

  // Infer characteristic type once for color/shape decisions
  const characteristicType = useMemo(() => inferCharacteristicType(specs), [specs]);

  const isFavorableControlViolation = useCallback(
    (direction: 'above' | 'below'): boolean => {
      if (characteristicType === 'smaller' && direction === 'below') return true;
      if (characteristicType === 'larger' && direction === 'above') return true;
      return false;
    },
    [characteristicType]
  );

  // Get stage stats for a specific data point
  const getStageStatsForPoint = useCallback(
    (stage?: string): StatsResult | null => {
      if (!isStaged || !stage) return stats;
      return stagedStats?.stages.get(stage) ?? null;
    },
    [isStaged, stats, stagedStats]
  );

  // Determine point color using Two Voices model with direction awareness
  const getPointColor = useCallback(
    (value: number, index: number, stage?: string): string => {
      if (specs.usl !== undefined && value > specs.usl) return chartColors.spec;
      if (specs.lsl !== undefined && value < specs.lsl) return chartColors.spec;

      const stageStats = getStageStatsForPoint(stage);
      if (stageStats) {
        if (value > stageStats.ucl) {
          return isFavorableControlViolation('above') ? chartColors.pass : chartColors.fail;
        }
        if (value < stageStats.lcl) {
          return isFavorableControlViolation('below') ? chartColors.pass : chartColors.fail;
        }
      }

      if (nelsonRule2Violations.has(index)) return chartColors.fail;
      if (nelsonRule3Violations.has(index)) return chartColors.fail;

      return chartColors.mean;
    },
    [
      specs,
      getStageStatsForPoint,
      isFavorableControlViolation,
      nelsonRule2Violations,
      nelsonRule3Violations,
    ]
  );

  // Determine point shape using violation priority
  const getPointShape = useCallback(
    (value: number, index: number, stage?: string): ViolationShape => {
      if (specs.usl !== undefined && value > specs.usl) return 'diamond';
      if (specs.lsl !== undefined && value < specs.lsl) return 'diamond';

      const stageStats = getStageStatsForPoint(stage);
      if (stageStats) {
        if (value > stageStats.ucl || value < stageStats.lcl) return 'diamond';
      }

      if (nelsonRule2Violations.has(index)) return 'square';

      if (nelsonRule3Violations.has(index)) {
        const sequence = nelsonRule3Sequences.find(
          seq => index >= seq.startIndex && index <= seq.endIndex
        );
        return sequence?.direction === 'decreasing' ? 'triangle-down' : 'triangle-up';
      }

      return 'circle';
    },
    [
      specs,
      getStageStatsForPoint,
      nelsonRule2Violations,
      nelsonRule3Violations,
      nelsonRule3Sequences,
    ]
  );

  return (
    <>
      {/* Secondary series data line + dots */}
      {hasSecondary && (
        <>
          <LinePath
            data={secondaryData!}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke={operatorColors[1]}
            strokeWidth={1}
            strokeOpacity={0.4}
          />
          {secondaryData!.map((d, i) => (
            <Circle
              key={`sec-${i}`}
              cx={xScale(d.x)}
              cy={yScale(d.y)}
              r={3}
              fill={operatorColors[1]}
              stroke={chrome.pointStroke}
              strokeWidth={0.5}
              opacity={0.7}
              onMouseOver={() =>
                showTooltipAtCoords(xScale(d.x), yScale(d.y), {
                  x: d.x,
                  y: d.y,
                  index: i,
                  stage: d.stage,
                })
              }
              onMouseLeave={hideTooltip}
            />
          ))}
        </>
      )}

      {/* Primary data line */}
      <LinePath
        data={data}
        x={d => xScale(d.x)}
        y={d => yScale(d.y)}
        stroke={chrome.dataLine}
        strokeWidth={1}
        strokeOpacity={0.5}
      />

      {/* Primary data points */}
      {data.map((d, i) => {
        const isHighlighted = highlightedPointIndex === i;
        const isSelected = enableBrushSelection && isPointSelected(i);
        const pointOpacity = enableBrushSelection ? getPointOpacity(i) : 1;
        const pointSize =
          enableBrushSelection && isSelected ? getPointSize(i) : isHighlighted ? 6 : 4;
        const strokeWidth =
          enableBrushSelection && isSelected ? getPointStrokeWidth(i) : isHighlighted ? 2 : 1;

        return (
          <g key={i} opacity={pointOpacity}>
            {/* Highlight ring for selected point */}
            {isHighlighted && (
              <Circle
                cx={xScale(d.x)}
                cy={yScale(d.y)}
                r={12}
                fill="transparent"
                stroke={chartColors.mean}
                strokeWidth={2}
                className="animate-pulse"
              />
            )}
            <ViolationPoint
              cx={xScale(d.x)}
              cy={yScale(d.y)}
              r={pointSize}
              shape={getPointShape(d.y, i, d.stage)}
              fill={getPointColor(d.y, i, d.stage)}
              stroke={
                isSelected ? '#ffffff' : isHighlighted ? chartColors.mean : chrome.pointStroke
              }
              strokeWidth={strokeWidth}
              className={onPointClick || enableBrushSelection ? interactionStyles.clickable : ''}
              onClick={e => {
                if (enableBrushSelection && onSelectionChange) {
                  handleBrushPointClick(i, e);
                } else {
                  onPointClick?.(i, d.originalIndex);
                }
              }}
              onMouseOver={() =>
                showTooltipAtCoords(xScale(d.x), yScale(d.y), {
                  x: d.x,
                  y: d.y,
                  index: i,
                  stage: d.stage,
                })
              }
              onMouseLeave={hideTooltip}
              {...getDataPointA11yProps(
                t('chart.observation'),
                d.y,
                i,
                onPointClick ? () => onPointClick(i, d.originalIndex) : undefined
              )}
            />
          </g>
        );
      })}
    </>
  );
};

export default DataPoints;
