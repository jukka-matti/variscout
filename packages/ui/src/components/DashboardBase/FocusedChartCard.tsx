import React from 'react';
import { Minimize2, Copy, Check } from 'lucide-react';
import { ChartDownloadMenu, type ChartDownloadMenuColorScheme } from '../ChartExportMenu';
import { FilterContextBar, type FilterContextBarColorScheme } from '../FilterContextBar';
import type { FilterChipData } from '@variscout/hooks';

export interface FocusedChartCardProps {
  /** Container ID (e.g. "ichart-focus") */
  id: string;
  /** Header content: title + controls on the left side */
  header: React.ReactNode;
  /** Optional stats bar on the right side of the header row */
  headerRight?: React.ReactNode;
  /** Chart content (ErrorBoundary + chart component) */
  children: React.ReactNode;
  /** Footer content below the chart (BoxplotStatsTable, AnovaResults) */
  footer?: React.ReactNode;
  /** Exit focused mode */
  onExit: () => void;
  /** Chart name for export functions */
  chartName: string;
  /** Copy feedback state */
  copyFeedback?: string | null;
  /** Copy handler */
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  /** PNG download handler */
  onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
  /** SVG download handler */
  onDownloadSvg?: (containerId: string, chartName: string) => void;
  /** Filter context bar props */
  filterChipData?: FilterChipData[];
  columnAliases?: Record<string, string>;
  cumulativeVariationPct?: number | null;
  showFilterContext?: boolean;
  /** ColorSchemes */
  filterContextBarColorScheme?: FilterContextBarColorScheme;
  chartDownloadMenuColorScheme?: ChartDownloadMenuColorScheme;
  /** Additional class on the card */
  className?: string;
}

/**
 * FocusedChartCard — Card container for focused (maximized) chart mode.
 *
 * Renders a full-height card with:
 * - Header with title/controls + export buttons + minimize button
 * - FilterContextBar
 * - Chart content area (flex-1)
 * - Optional footer (stats table, ANOVA)
 */
const FocusedChartCard: React.FC<FocusedChartCardProps> = ({
  id,
  header,
  headerRight,
  children,
  footer,
  onExit,
  chartName,
  copyFeedback,
  onCopyChart,
  onDownloadPng,
  onDownloadSvg,
  filterChipData,
  columnAliases,
  cumulativeVariationPct,
  showFilterContext = true,
  filterContextBarColorScheme,
  chartDownloadMenuColorScheme,
  className = '',
}) => {
  const showExportButtons = onCopyChart && onDownloadPng && onDownloadSvg;

  return (
    <div
      id={id}
      className={`flex-1 bg-surface-secondary border border-edge p-4 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full ${className}`}
    >
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          {header}

          {showExportButtons && (
            <div className="flex items-center gap-1" data-export-hide>
              <button
                onClick={() => onCopyChart(id, chartName)}
                className={`p-1.5 rounded transition-all ${
                  copyFeedback === chartName
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-content-muted hover:text-content hover:bg-surface-tertiary'
                }`}
                title={`Copy ${chartName} to clipboard`}
                aria-label={`Copy ${chartName} to clipboard`}
              >
                {copyFeedback === chartName ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <ChartDownloadMenu
                containerId={id}
                chartName={chartName}
                onDownloadPng={onDownloadPng}
                onDownloadSvg={onDownloadSvg}
                colorScheme={chartDownloadMenuColorScheme}
              />
            </div>
          )}

          <button
            onClick={onExit}
            className="p-2 rounded text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors ml-4 bg-surface-tertiary/50"
            aria-label="Exit focus mode"
            title="Exit Focus Mode"
          >
            <Minimize2 size={20} />
          </button>
        </div>

        {headerRight}
      </div>

      {filterChipData && columnAliases && (
        <FilterContextBar
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          cumulativeVariationPct={cumulativeVariationPct}
          show={showFilterContext}
          colorScheme={filterContextBarColorScheme}
        />
      )}

      <div className="flex-1 min-h-0 w-full">{children}</div>

      {footer}
    </div>
  );
};

export default FocusedChartCard;
