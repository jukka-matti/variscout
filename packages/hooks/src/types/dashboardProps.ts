/**
 * Dashboard Props Type Definitions
 *
 * Grouped interfaces for Dashboard component props to improve
 * organization and reusability across PWA and Azure apps.
 */

import type { ChartId } from '../useChartNavigation';

/**
 * Analysis view types across all dashboards
 */
export type AnalysisView = 'dashboard' | 'regression' | 'gagerr' | 'performance';

/**
 * Highlight intensity options for embed mode
 */
export type HighlightIntensity = 'pulse' | 'glow' | 'ring';

/**
 * Props for controlling which analysis view is active
 */
export interface DashboardModeProps {
  /** Currently active analysis view */
  activeView?: AnalysisView;
  /** Whether presentation mode is active */
  isPresentationMode?: boolean;
  /** Callback when exiting presentation mode */
  onExitPresentation?: () => void;
}

/**
 * Props for embed mode (iframe embedding)
 */
export interface DashboardEmbedProps {
  /** Which chart to highlight in embed mode */
  highlightedChart?: ChartId | null;
  /** How to visually highlight the chart */
  highlightIntensity?: HighlightIntensity;
  /** Focus on a single chart (renders only that chart) */
  embedFocusChart?: 'ichart' | 'boxplot' | 'pareto' | 'stats' | null;
  /** Auto-select this tab in StatsPanel when embedded */
  embedStatsTab?: 'summary' | 'histogram' | 'normality' | null;
  /** Callback when a chart is clicked in embed mode */
  onChartClick?: (chartId: ChartId) => void;
}

/**
 * Props for Performance Mode drill-down integration
 */
export interface DashboardPerformanceProps {
  /** Measure ID when drilled from Performance Mode */
  drillFromPerformance?: string | null;
  /** Callback to return to Performance Mode */
  onBackToPerformance?: () => void;
  /** Callback to drill to a specific measure */
  onDrillToMeasure?: (measureId: string) => void;
}

/**
 * Props for chart-data bi-directional interaction
 */
export interface DashboardInteractionProps {
  /** Callback when a chart point is clicked */
  onPointClick?: (index: number) => void;
  /** Highlighted point index from data panel */
  highlightedPointIndex?: number | null;
  /** Callback to open column mapping dialog */
  onOpenColumnMapping?: () => void;
}

/**
 * Props for spec editor integration
 */
export interface DashboardSpecEditorProps {
  /** External trigger to open spec editor */
  openSpecEditorRequested?: boolean;
  /** Callback after spec editor opens */
  onSpecEditorOpened?: () => void;
}

/**
 * Complete Dashboard props interface
 * Combines all prop groups for full Dashboard component
 */
export interface DashboardProps
  extends
    DashboardModeProps,
    DashboardEmbedProps,
    DashboardPerformanceProps,
    DashboardInteractionProps,
    DashboardSpecEditorProps {}

/**
 * Minimal Dashboard props for Azure (simpler interface)
 */
export interface AzureDashboardProps
  extends
    Pick<DashboardModeProps, 'activeView'>,
    DashboardPerformanceProps,
    Pick<DashboardInteractionProps, 'onPointClick' | 'highlightedPointIndex'> {}
