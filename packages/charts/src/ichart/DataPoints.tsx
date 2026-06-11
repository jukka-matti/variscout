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
import { chartColors } from '../colors';
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
  chrome: { dataLine: string; pointStroke: string; labelSecondary: string };
  /** Translation function */
  t: (key: keyof import('@variscout/core').MessageCatalog) => string;
  /** Click handler for a data point */
  onPointClick?: (index: number, originalIndex?: number) => void;
  /** Visible capture affordance callback for a data point */
  onPointCapture?: (index: number, point: IChartDataPoint) => void;
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
    data: {
      x: number;
      y: number;
      index: number;
      stage?: string;
      timeValue?: string;
      factorValues?: Record<string, string>;
    }
  ) => void;
  /** Hide tooltip */
  hideTooltip: () => void;
  /** Secondary data series */
  secondaryData?: IChartDataPoint[];
  /** Full pre-decimation point count for marker sizing. */
  fullPointCount?: number;
  /**
   * Condition-membership set (ER-4) in display-index space. When present and non-empty the
   * highlight tier is ACTIVE: members keep their violation color/shape but lit; non-members
   * gray-muted; dimmed violations floor at .3; the connecting line is suppressed. Distinct
   * from `selectedPoints` (the brush) and from the violation channels.
   */
  conditionMemberIndices?: Set<number>;
}

// --- Membership highlight tier (ER-4) opacity/size constants ---
/** Lit member opacity (wireframe :439). */
const MEMBER_OPACITY = 0.85;
/** Dimmed non-member opacity (wireframe :440). */
const NON_MEMBER_OPACITY = 0.14;
/**
 * Floor opacity for a dimmed non-member that IS a violation. A deliberate, commented
 * divergence from the wireframe's uniform .14 — signals (spec/control/Nelson) never fully
 * vanish so a member-highlight pass can't hide an out-of-control point.
 */
const DIMMED_VIOLATION_FLOOR = 0.3;
/** Member point radius (wireframe r 2.3, scaled to the chart's base r=4 register). */
const MEMBER_POINT_SIZE = 5;
/** Non-member point radius (wireframe r 1.3, smaller than the base). */
const NON_MEMBER_POINT_SIZE = 3;

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
  onPointCapture,
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
  fullPointCount,
  conditionMemberIndices,
}) => {
  const hasSecondary = secondaryData && secondaryData.length > 0;
  // Highlight tier is active only when the channel is present AND non-empty (IChart already
  // gates on size, but guard here too so DataPoints is correct in isolation).
  const membershipActive = !!conditionMemberIndices && conditionMemberIndices.size > 0;

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
      {/* Secondary series: connecting lines + data line + dots */}
      {hasSecondary && (
        <>
          {/* Connecting lines between primary and secondary (centering gap) */}
          {data.map((primary, i) => {
            const secondary = secondaryData![i];
            if (!secondary) return null;
            return (
              <line
                key={`gap-${i}`}
                x1={xScale(primary.x)}
                y1={yScale(primary.y)}
                x2={xScale(secondary.x)}
                y2={yScale(secondary.y)}
                stroke={chrome.labelSecondary}
                strokeWidth={1.5}
                opacity={0.5}
              />
            );
          })}
          <LinePath
            data={secondaryData!}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke={chartColors.cpPotential}
            strokeWidth={1}
            strokeOpacity={0.4}
          />
          {secondaryData!.map((d, i) => (
            <Circle
              key={`sec-${i}`}
              cx={xScale(d.x)}
              cy={yScale(d.y)}
              r={4}
              fill={chartColors.cpPotential}
              stroke={chrome.pointStroke}
              strokeWidth={0.5}
              opacity={0.7}
              onMouseOver={() =>
                showTooltipAtCoords(xScale(d.x), yScale(d.y), {
                  x: d.x,
                  y: d.y,
                  index: i,
                  stage: d.stage,
                  factorValues: d.factorValues,
                })
              }
              onMouseLeave={hideTooltip}
            />
          ))}
        </>
      )}

      {/* Primary data line — suppressed under the membership highlight tier (wireframe :432):
          a connecting line through a masked, full-context series reads as noise. */}
      {!membershipActive && (
        <LinePath
          data={data}
          x={d => xScale(d.x)}
          y={d => yScale(d.y)}
          stroke={chrome.dataLine}
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      )}

      {/* Primary data points */}
      {data.map((d, i) => {
        const isHighlighted = highlightedPointIndex === i;
        const isSelected = enableBrushSelection && isPointSelected(i);
        const signalIndex = d.originalIndex ?? i;

        // --- Membership highlight tier (ER-4) ---
        // When active, the tier OWNS opacity + size (orthogonal to violation color/shape):
        // members lit, non-members dim; a non-member that is a violation floors at .3.
        const isMember = membershipActive ? (d.isMember ?? conditionMemberIndices!.has(i)) : false;
        const pointColor = getPointColor(d.y, signalIndex, d.stage);
        const isViolation = pointColor !== chartColors.mean;
        const isLargeSeries = (fullPointCount ?? data.length) >= 800;
        let pointOpacity: number;
        let pointSize: number;
        if (membershipActive) {
          if (isMember) {
            pointOpacity = MEMBER_OPACITY;
            pointSize = isLargeSeries ? 1.9 : MEMBER_POINT_SIZE;
          } else {
            pointOpacity = isViolation ? DIMMED_VIOLATION_FLOOR : NON_MEMBER_OPACITY;
            pointSize = isLargeSeries ? (isViolation ? 1.9 : 1.4) : NON_MEMBER_POINT_SIZE;
          }
        } else {
          pointOpacity = enableBrushSelection ? getPointOpacity(i) : 1;
          pointSize =
            enableBrushSelection && isSelected
              ? getPointSize(i)
              : isHighlighted
                ? 6
                : isLargeSeries
                  ? isViolation
                    ? 1.9
                    : 1.4
                  : 4;
        }
        const strokeWidth =
          enableBrushSelection && isSelected ? getPointStrokeWidth(i) : isHighlighted ? 2 : 1;

        return (
          <g
            key={i}
            opacity={pointOpacity}
            data-member={membershipActive ? String(isMember) : undefined}
            data-original-index={d.originalIndex}
            data-point-size={isViolation ? 'violation' : 'quiet'}
          >
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
              shape={getPointShape(d.y, signalIndex, d.stage)}
              fill={pointColor}
              stroke={
                isSelected
                  ? chartColors.selectedPointStroke
                  : isHighlighted
                    ? chartColors.mean
                    : chrome.pointStroke
              }
              strokeWidth={strokeWidth}
              className={
                onPointClick || enableBrushSelection || onPointCapture
                  ? interactionStyles.clickable
                  : ''
              }
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
                  factorValues: d.factorValues,
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
            {onPointCapture && (
              <g
                role="button"
                tabIndex={0}
                aria-label={`Capture observation ${i + 1}`}
                data-testid={`ichart-capture-point-${i}`}
                transform={`translate(${xScale(d.x) + 8}, ${yScale(d.y) - 8})`}
                className={interactionStyles.clickable}
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  onPointCapture(d.originalIndex ?? i, d);
                }}
                onMouseDown={(event: React.MouseEvent) => {
                  event.stopPropagation();
                }}
                onKeyDown={(event: React.KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onPointCapture(d.originalIndex ?? i, d);
                  }
                }}
              >
                <circle r={5} fill={chartColors.selected} stroke={chrome.pointStroke} />
                <path d="M-2 0h4M0-2v4" stroke={chrome.pointStroke} strokeWidth={1.25} />
              </g>
            )}
          </g>
        );
      })}
    </>
  );
};

export default DataPoints;
