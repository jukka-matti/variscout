import React from 'react';
import { Copy, Check } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';

export interface ReportChartSnapshotColorScheme {
  container: string;
  filterLabel: string;
  copyButton: string;
}

export const reportChartSnapshotDefaultColorScheme: ReportChartSnapshotColorScheme = {
  container:
    'relative rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden',
  filterLabel:
    'px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700',
  copyButton:
    'absolute top-2 right-2 p-1.5 rounded bg-slate-800/70 text-white opacity-0 group-hover:opacity-100 transition-opacity',
};

export interface ReportChartSnapshotProps {
  id: string;
  chartType: 'ichart' | 'boxplot' | 'pareto' | 'capability-ichart' | 'performance-ichart';
  filterLabel: string;
  renderChart: () => React.ReactNode;
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  copyFeedback?: string | null;
  colorScheme?: Partial<ReportChartSnapshotColorScheme>;
}

const chartTypeLabel: Record<ReportChartSnapshotProps['chartType'], string> = {
  ichart: 'I-Chart',
  boxplot: 'Boxplot',
  pareto: 'Pareto',
  'capability-ichart': 'Capability I-Chart',
  'performance-ichart': 'Performance I-Chart',
};

export const ReportChartSnapshot: React.FC<ReportChartSnapshotProps> = ({
  id,
  chartType,
  filterLabel,
  renderChart,
  onCopyChart,
  copyFeedback,
  colorScheme,
}) => {
  const scheme: ReportChartSnapshotColorScheme = {
    ...reportChartSnapshotDefaultColorScheme,
    ...colorScheme,
  };

  const isCopied = copyFeedback === id;
  const chartName = chartTypeLabel[chartType];

  return (
    <div id={id} className={`group ${scheme.container}`}>
      {/* Filter context label */}
      <div className={scheme.filterLabel}>{filterLabel}</div>

      {/* Chart — non-interactive */}
      <div style={{ pointerEvents: 'none' }}>
        <ErrorBoundary componentName={chartName}>{renderChart()}</ErrorBoundary>
      </div>

      {/* Copy button overlay */}
      {onCopyChart && (
        <button
          className={scheme.copyButton}
          onClick={() => onCopyChart(id, chartName)}
          aria-label={`Copy ${chartName} to clipboard`}
          data-export-hide
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
};
