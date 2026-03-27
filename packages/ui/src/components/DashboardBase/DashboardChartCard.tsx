import React from 'react';
import { Copy, Check, Maximize2, Share2 } from 'lucide-react';
import { ChartDownloadMenu, type ChartDownloadMenuColorScheme } from '../ChartExportMenu';

export interface DashboardChartCardProps {
  /** Container ID for copy-to-clipboard targeting */
  id: string;
  /** data-testid for E2E selectors */
  testId: string;
  /** Left side of header: title area (icon + editable title + optional branding) */
  title: React.ReactNode;
  /** Right side of header: controls (selectors, toggles, etc.) — rendered before export buttons */
  controls?: React.ReactNode;
  /** FilterContextBar or other content between header and chart */
  filterBar?: React.ReactNode;
  /** Chart content (ErrorBoundary + chart component) */
  children: React.ReactNode;
  /** Footer content below the chart (e.g. BoxplotStatsTable, AnovaResults in focused mode) */
  footer?: React.ReactNode;
  /** Copy feedback chart name (matches this card → show check icon) */
  copyFeedback?: string | null;
  /** The chart name used for export buttons */
  chartName: string;
  /** Copy to clipboard handler */
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  /** Download as PNG handler */
  onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
  /** Download as SVG handler */
  onDownloadSvg?: (containerId: string, chartName: string) => void;
  /** Maximize (enter focus mode) handler */
  onMaximize?: () => void;
  /** Minimum height for the card */
  minHeight?: string;
  /** CSS classes for embed mode highlight */
  highlightClass?: string;
  /** Click handler for the card (embed mode chart selection) */
  onClick?: () => void;
  /** Additional CSS class */
  className?: string;
  /** ColorScheme for ChartDownloadMenu */
  downloadMenuColorScheme?: ChartDownloadMenuColorScheme;
  /** Share this chart via deep link. Hidden when not provided. */
  onShareChart?: (chartName: string) => void;
  /** Number of chart observations (findings linked to this chart) */
  observationCount?: number;
}

/**
 * DashboardChartCard — Shared chart card container for dashboard grid.
 *
 * Renders:
 * - Card container with consistent styling
 * - Header with title + controls + export buttons + maximize button
 * - Filter bar slot
 * - Chart content area
 * - Optional footer
 */
const DashboardChartCard: React.FC<DashboardChartCardProps> = ({
  id,
  testId,
  title,
  controls,
  filterBar,
  children,
  footer,
  copyFeedback,
  chartName,
  onCopyChart,
  onDownloadPng,
  onDownloadSvg,
  onMaximize,
  minHeight,
  highlightClass = '',
  onClick,
  className = '',
  downloadMenuColorScheme,
  onShareChart,
  observationCount,
}) => {
  const showExportButtons = onCopyChart && onDownloadPng && onDownloadSvg;

  return (
    <div
      id={id}
      data-testid={testId}
      onClick={onClick}
      className={`bg-surface-secondary border border-edge p-4 rounded-2xl shadow-xl shadow-black/20 flex flex-col min-h-0 h-full transition-all ${highlightClass} ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <div className="flex justify-between items-center mb-2 gap-4">
        <div className="flex items-center gap-1.5">
          {title}
          {observationCount != null && observationCount > 0 && (
            <span
              data-testid="observation-count-badge"
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium"
            >
              {observationCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end" data-export-hide>
          {controls}

          {showExportButtons && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onCopyChart(id, chartName);
                }}
                className={`p-1.5 rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  copyFeedback === chartName
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-content-muted hover:text-content hover:bg-surface-tertiary'
                }`}
                title={`Copy ${chartName} to clipboard`}
                aria-label={`Copy ${chartName} to clipboard`}
                data-export-hide
              >
                {copyFeedback === chartName ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <ChartDownloadMenu
                containerId={id}
                chartName={chartName}
                onDownloadPng={onDownloadPng}
                onDownloadSvg={onDownloadSvg}
                colorScheme={downloadMenuColorScheme}
              />
            </>
          )}

          {onShareChart && (
            <button
              onClick={e => {
                e.stopPropagation();
                onShareChart(chartName);
              }}
              className="p-1.5 rounded text-content-muted hover:text-blue-400 hover:bg-blue-400/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={`Share ${chartName}`}
              aria-label={`Share ${chartName}`}
              data-export-hide
            >
              <Share2 size={14} />
            </button>
          )}

          {onMaximize && (
            <button
              onClick={e => {
                e.stopPropagation();
                onMaximize();
              }}
              className="p-1.5 rounded text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Maximize Chart"
              aria-label="Maximize chart"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>
      </div>

      {filterBar}

      <div className="flex-1 min-h-0">{children}</div>

      {footer}
    </div>
  );
};

export default DashboardChartCard;
