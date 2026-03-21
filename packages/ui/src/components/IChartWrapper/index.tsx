/**
 * IChartWrapperBase - Shared I-Chart wrapper for PWA and Azure apps
 *
 * Contains all rendering logic:
 * - Transforms data via useIChartData / useIChartWrapperData
 * - Manages Y-axis editor state
 * - Renders IChartBase + ChartAnnotationLayer + YAxisPopover
 * - Tier-aware branding via shouldShowBranding()
 *
 * Each app keeps a thin wrapper that calls useData() + useChartScale()
 * and spreads the result as props.
 */
import React, { useState } from 'react';
import { IChartBase, getScaledFonts } from '@variscout/charts';
import { useIChartData, useIChartWrapperData } from '@variscout/hooks';
import { shouldShowBranding, getBrandingText } from '@variscout/core';
import { ChartAnnotationLayer } from '../ChartAnnotationLayer';
import { YAxisPopover } from '../YAxisPopover';
import type {
  DataRow,
  StatsResult,
  SpecLimits,
  StagedStatsResult,
  Finding,
  IChartDataPoint,
} from '@variscout/core';
import type { DisplayOptions } from '@variscout/hooks';

export interface IChartWrapperBaseProps {
  parentWidth: number;
  parentHeight: number;
  /** Filtered data rows (or staged data when stage column is active) */
  filteredData: DataRow[];
  /** Outcome column name */
  outcome: string | null;
  /** Time/order column for X-axis */
  timeColumn: string | null;
  /** Stage column for staged analysis */
  stageColumn: string | null;
  /** Staged data rows (used when stageColumn is set) */
  stagedData: DataRow[];
  /** Overall stats */
  stats: StatsResult | null;
  /** Per-stage stats */
  stagedStats: StagedStatsResult | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Y-axis settings */
  axisSettings: { min?: number; max?: number };
  /** Callback to update axis settings */
  onAxisSettingsChange: (settings: { min?: number; max?: number }) => void;
  /** Auto-calculated Y min from useChartScale */
  autoMin: number;
  /** Auto-calculated Y max from useChartScale */
  autoMax: number;
  /** Column display aliases */
  columnAliases: Record<string, string>;
  /** Display toggles */
  displayOptions: Pick<DisplayOptions, 'showControlLimits' | 'showSpecs'>;
  /** Selected point indices (brush selection) */
  selectedPoints?: Set<number>;
  /** Callback for selection changes */
  onSelectionChange?: (indices: Set<number>) => void;
  /** Callback when a data point is clicked */
  onPointClick?: (index: number) => void;
  /** Callback when a spec label is clicked */
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  /** Override branding display (undefined = auto-detect via tier) */
  showBranding?: boolean;
  /** Show UCL/LCL/Mean labels on control limits (default: true) */
  showLimitLabels?: boolean;
  /** Highlighted point index from data panel sync (Azure) */
  highlightedPointIndex?: number | null;
  /** Findings linked to this chart (rendered as annotation boxes) */
  ichartFindings?: Finding[];
  /** Callback to create a chart observation at position */
  onCreateObservation?: (anchorX: number, anchorY: number) => void;
  /** Edit a finding's text from the annotation box */
  onEditFinding?: (id: string, text: string) => void;
  /** Delete a finding from the annotation box */
  onDeleteFinding?: (id: string) => void;
  // --- Capability mode (dual series) ---
  /** When true, renders capability mode with dual Cp/Cpk series */
  isCapabilityMode?: boolean;
  /** Cpk data points (primary series in capability mode) */
  capabilityCpkData?: IChartDataPoint[];
  /** Cp data points (secondary series in capability mode) */
  capabilityCpData?: IChartDataPoint[];
  /** Stats for Cpk series control limits */
  capabilityCpkStats?: StatsResult | null;
  /** Stats for Cp series control limits */
  capabilityCpStats?: StatsResult | null;
}

export const IChartWrapperBase = ({
  parentWidth,
  parentHeight,
  filteredData,
  outcome,
  timeColumn,
  stageColumn,
  stagedData,
  stats,
  stagedStats,
  specs,
  axisSettings,
  onAxisSettingsChange,
  autoMin,
  autoMax,
  columnAliases,
  displayOptions,
  selectedPoints,
  onSelectionChange,
  onPointClick,
  onSpecClick,
  showBranding: showBrandingProp,
  showLimitLabels = true,
  highlightedPointIndex,
  ichartFindings = [],
  onCreateObservation,
  onEditFinding,
  onDeleteFinding,
  isCapabilityMode = false,
  capabilityCpkData,
  capabilityCpData,
  capabilityCpkStats,
  capabilityCpStats,
}: IChartWrapperBaseProps) => {
  const [isEditingScale, setIsEditingScale] = useState(false);

  // Use staged data when stage column is active
  const sourceData = stageColumn ? stagedData : filteredData;

  const data = useIChartData(sourceData, outcome, stageColumn, timeColumn);

  const { effectiveStats, effectiveStagedStats, categoryPositions, handleContextMenu } =
    useIChartWrapperData({
      parentWidth,
      parentHeight,
      stats,
      stagedStats,
      displayOptions,
      ichartFindings,
      onCreateObservation,
    });

  if (!outcome || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted italic">
        No data available for I-Chart
      </div>
    );
  }

  const showBranding = showBrandingProp ?? shouldShowBranding();
  const fonts = getScaledFonts(parentWidth);

  // In capability mode, use capability data instead of raw measurement data
  const chartData = isCapabilityMode && capabilityCpkData?.length ? capabilityCpkData : data;
  const chartStats = isCapabilityMode && capabilityCpkStats ? capabilityCpkStats : effectiveStats;
  const chartYLabel = isCapabilityMode ? 'Cpk' : columnAliases[outcome] || outcome;

  return (
    <div className="relative w-full h-full" onContextMenu={handleContextMenu}>
      <IChartBase
        data={chartData}
        stats={chartStats}
        stagedStats={isCapabilityMode ? undefined : effectiveStagedStats}
        specs={isCapabilityMode ? {} : displayOptions.showSpecs !== false ? specs : {}}
        yAxisLabel={chartYLabel}
        axisSettings={isCapabilityMode ? {} : axisSettings}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
        onPointClick={onPointClick}
        onSpecClick={isCapabilityMode ? undefined : onSpecClick}
        onYAxisClick={isCapabilityMode ? undefined : () => setIsEditingScale(true)}
        enableBrushSelection={!isCapabilityMode}
        selectedPoints={isCapabilityMode ? undefined : selectedPoints}
        onSelectionChange={isCapabilityMode ? undefined : onSelectionChange}
        highlightedPointIndex={isCapabilityMode ? undefined : highlightedPointIndex}
        showLimitLabels={showLimitLabels}
        secondaryData={isCapabilityMode ? capabilityCpData : undefined}
        secondaryStats={isCapabilityMode ? capabilityCpStats : undefined}
        primaryLabel={isCapabilityMode ? 'Cpk' : undefined}
        secondaryLabel={isCapabilityMode ? 'Cp' : undefined}
      />

      {ichartFindings.length > 0 && onEditFinding && onDeleteFinding && (
        <ChartAnnotationLayer
          findings={ichartFindings}
          onEditFinding={onEditFinding}
          onDeleteFinding={onDeleteFinding}
          isActive={true}
          categoryPositions={categoryPositions}
          maxWidth={parentWidth * 0.7}
          textColor="var(--color-content-primary, #cbd5e1)"
          fontSize={fonts.statLabel}
        />
      )}

      <YAxisPopover
        isOpen={isEditingScale}
        onClose={() => setIsEditingScale(false)}
        currentMin={axisSettings.min}
        currentMax={axisSettings.max}
        autoMin={autoMin}
        autoMax={autoMax}
        onSave={onAxisSettingsChange}
        anchorPosition={{ top: 20, left: 10 }}
      />
    </div>
  );
};
