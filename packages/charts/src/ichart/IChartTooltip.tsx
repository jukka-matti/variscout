/**
 * Tooltip content and positioning for I-Chart data points.
 *
 * Shows point index, value, stage name (if staged), time value,
 * and violation reason with color coding.
 */

import React, { useMemo, useCallback } from 'react';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import {
  inferCharacteristicType,
  type StatsResult,
  type SpecLimits,
  type MessageCatalog,
} from '@variscout/core';
import type { ChartFonts } from '@variscout/core';
import type { NelsonRule2Sequence, NelsonRule3Sequence } from '@variscout/core';
import { chartColors } from '../colors';

interface TooltipData {
  x: number;
  y: number;
  index: number;
  stage?: string;
  timeValue?: string;
  /** Factor column values for this data point (e.g., {Month: "Jul", Year: "2019"}) */
  factorValues?: Record<string, string>;
}

interface IChartTooltipProps {
  /** Whether tooltip is open */
  tooltipOpen: boolean;
  /** Tooltip data */
  tooltipData: TooltipData | undefined;
  /** Tooltip x position (relative to chart area) */
  tooltipLeft: number | undefined;
  /** Tooltip y position (relative to chart area) */
  tooltipTop: number | undefined;
  /** Left margin offset */
  marginLeft: number;
  /** Top margin offset */
  marginTop: number;
  /** Chrome colors from theme */
  chrome: {
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    labelSecondary: string;
  };
  /** Font sizes */
  fonts: ChartFonts;
  /** Format a stat value for display */
  formatStat: (value: number, decimals?: number) => string;
  /** Translation function */
  t: (key: keyof MessageCatalog) => string;
  /** Template translation function */
  tf: (key: keyof MessageCatalog, params: Record<string, string | number>) => string;
  /** Overall stats */
  stats: StatsResult | null;
  /** Staged stats */
  stagedStats?: { stages: Map<string, StatsResult> } | null;
  /** Spec limits */
  specs: SpecLimits;
  /** Whether chart is in staged mode */
  isStaged: boolean;
  /** Nelson Rule 2 violation indices */
  nelsonRule2Violations: Set<number>;
  /** Nelson Rule 2 sequences */
  nelsonRule2Sequences: NelsonRule2Sequence[];
  /** Nelson Rule 3 violation indices */
  nelsonRule3Violations: Set<number>;
  /** Nelson Rule 3 sequences */
  nelsonRule3Sequences: NelsonRule3Sequence[];
}

const IChartTooltip: React.FC<IChartTooltipProps> = ({
  tooltipOpen,
  tooltipData,
  tooltipLeft,
  tooltipTop,
  marginLeft,
  marginTop,
  chrome,
  fonts,
  formatStat,
  t,
  tf,
  stats,
  stagedStats,
  specs,
  isStaged,
  nelsonRule2Violations,
  nelsonRule2Sequences,
  nelsonRule3Violations,
  nelsonRule3Sequences,
}) => {
  const characteristicType = useMemo(() => inferCharacteristicType(specs), [specs]);

  const isFavorableControlViolation = useCallback(
    (direction: 'above' | 'below'): boolean => {
      if (characteristicType === 'smaller' && direction === 'below') return true;
      if (characteristicType === 'larger' && direction === 'above') return true;
      return false;
    },
    [characteristicType]
  );

  const getStageStatsForPoint = useCallback(
    (stage?: string): StatsResult | null => {
      if (!isStaged || !stage) return stats;
      return stagedStats?.stages.get(stage) ?? null;
    },
    [isStaged, stats, stagedStats]
  );

  const getViolationReason = useCallback(
    (value: number, index: number, stage?: string): { text: string; favorable: boolean } | null => {
      // Priority 1: Spec limit violations
      if (specs.usl !== undefined && value > specs.usl)
        return {
          text: tf('chart.violation.aboveUsl', { value: formatStat(specs.usl) }),
          favorable: false,
        };
      if (specs.lsl !== undefined && value < specs.lsl)
        return {
          text: tf('chart.violation.belowLsl', { value: formatStat(specs.lsl) }),
          favorable: false,
        };

      // Priority 2: Control limit violations (direction-aware)
      const stageStats = getStageStatsForPoint(stage);
      if (stageStats) {
        if (value > stageStats.ucl) {
          const favorable = isFavorableControlViolation('above');
          return {
            text: t(favorable ? 'chart.violation.aboveUclFavorable' : 'chart.violation.aboveUcl'),
            favorable,
          };
        }
        if (value < stageStats.lcl) {
          const favorable = isFavorableControlViolation('below');
          return {
            text: t(favorable ? 'chart.violation.belowLclFavorable' : 'chart.violation.belowLcl'),
            favorable,
          };
        }
      }

      // Priority 3: Nelson Rule 2 violations
      if (nelsonRule2Violations.has(index)) {
        const sequence = nelsonRule2Sequences.find(
          seq => index >= seq.startIndex && index <= seq.endIndex
        );
        if (sequence) {
          const count = sequence.endIndex - sequence.startIndex + 1;
          return {
            text: tf('chart.violation.nelson2.detail', {
              count,
              side: t(`chart.violation.side.${sequence.side}` as keyof MessageCatalog),
              start: sequence.startIndex + 1,
              end: sequence.endIndex + 1,
            }),
            favorable: false,
          };
        }
        return { text: t('chart.violation.nelson2'), favorable: false };
      }

      // Priority 4: Nelson Rule 3 violations
      if (nelsonRule3Violations.has(index)) {
        const sequence = nelsonRule3Sequences.find(
          seq => index >= seq.startIndex && index <= seq.endIndex
        );
        if (sequence) {
          const count = sequence.endIndex - sequence.startIndex + 1;
          return {
            text: tf('chart.violation.nelson3.detail', {
              count,
              direction: t(
                `chart.violation.direction.${sequence.direction}` as keyof MessageCatalog
              ),
              start: sequence.startIndex + 1,
              end: sequence.endIndex + 1,
            }),
            favorable: false,
          };
        }
        return { text: t('chart.violation.nelson3'), favorable: false };
      }

      return null; // In-control
    },
    [
      specs,
      getStageStatsForPoint,
      isFavorableControlViolation,
      nelsonRule2Violations,
      nelsonRule2Sequences,
      nelsonRule3Violations,
      nelsonRule3Sequences,
      t,
      tf,
      formatStat,
    ]
  );

  if (!tooltipOpen || tooltipData == null) return null;

  const violation = getViolationReason(tooltipData.y, tooltipData.index, tooltipData.stage);

  return (
    <TooltipWithBounds
      left={marginLeft + (tooltipLeft ?? 0)}
      top={marginTop + (tooltipTop ?? 0)}
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
        <strong>#{tooltipData.index + 1}</strong>
        {tooltipData.stage && (
          <span style={{ color: chrome.labelSecondary, marginLeft: 8 }}>{tooltipData.stage}</span>
        )}
        {tooltipData.timeValue && (
          <div
            style={{
              color: chrome.labelSecondary,
              fontSize: fonts.tooltipText - 1,
              marginTop: 2,
            }}
          >
            {tooltipData.timeValue}
          </div>
        )}
        {tooltipData.factorValues && Object.keys(tooltipData.factorValues).length > 0 && (
          <div
            style={{
              color: chrome.labelSecondary,
              fontSize: fonts.tooltipText - 1,
              marginTop: 2,
            }}
          >
            {Object.entries(tooltipData.factorValues).map(([name, value]) => (
              <span key={name} style={{ marginRight: 8 }}>
                {name}: <span style={{ color: chrome.tooltipText }}>{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        {t('chart.label.value')} {formatStat(tooltipData.y)}
      </div>
      {violation &&
        (() => {
          const isSpecViolation =
            (specs.usl !== undefined && tooltipData.y > specs.usl) ||
            (specs.lsl !== undefined && tooltipData.y < specs.lsl);
          const color = isSpecViolation
            ? chartColors.spec
            : violation.favorable
              ? chartColors.pass
              : chartColors.fail;
          return (
            <div style={{ marginTop: 4, color, fontWeight: 500 }}>
              {!isSpecViolation && !violation.favorable ? '\u26A0\uFE0F ' : ''}
              {violation.text}
            </div>
          );
        })()}
    </TooltipWithBounds>
  );
};

export default IChartTooltip;
