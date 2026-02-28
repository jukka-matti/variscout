import type React from 'react';
import type { AnovaResult, StatsResult, StagedStatsResult } from '@variscout/core';
import type { FilterChipData, ChartAnnotation } from '@variscout/hooks';

export type FocusedChartType = 'ichart' | 'boxplot' | 'pareto';

// ---- Grouped top-level props ----

export interface FocusedChartNavigation {
  focusedChart: FocusedChartType;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export interface ChartExportProps {
  copyFeedback?: string | null;
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadSvg?: (containerId: string, chartName: string) => void;
}

export interface FilterContextProps {
  filterChipData: FilterChipData[];
  columnAliases: Record<string, string>;
  cumulativeVariationPct?: number | null;
  showFilterContext: boolean;
}

// ---- Chart section props ----

export interface IChartSectionProps {
  outcome: string;
  availableOutcomes: string[];
  onSetOutcome: (outcome: string) => void;
  chartTitle: string;
  onTitleChange: (title: string) => void;
  stats: StatsResult | null;
  stageColumn?: string | null;
  stagedStats?: StagedStatsResult | null;
  annotations?: ChartAnnotation[];
  onClearAnnotations?: () => void;
  /** Azure injects stage column selector here */
  renderHeaderExtra?: React.ReactNode;
  renderChart: () => React.ReactNode;
}

export interface BoxplotSectionProps {
  factor: string;
  factors: string[];
  onSetFactor: (f: string) => void;
  filters: Record<string, (string | number)[]>;
  columnAliases: Record<string, string>;
  chartTitle: string;
  onTitleChange: (title: string) => void;
  anovaResult: AnovaResult | null;
  /** Render prop to avoid ui→charts dependency (BoxplotStatsTable) */
  renderStatsTable?: () => React.ReactNode;
  renderChart: () => React.ReactNode;
}

export interface ParetoSectionProps {
  factor: string;
  factors: string[];
  onSetFactor: (f: string) => void;
  filters: Record<string, (string | number)[]>;
  columnAliases: Record<string, string>;
  chartTitle: string;
  onTitleChange: (title: string) => void;
  renderChart: () => React.ReactNode;
}

// ---- Main component props ----

export interface FocusedChartViewBaseProps {
  navigation: FocusedChartNavigation;
  chartExport?: ChartExportProps;
  filterContext?: FilterContextProps;
  ichart: IChartSectionProps;
  boxplot: BoxplotSectionProps;
  pareto: ParetoSectionProps;
}
