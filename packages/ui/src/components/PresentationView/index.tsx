/**
 * PresentationViewBase - Shared fullscreen presentation layout
 *
 * Static grid: I-Chart top 45%, Boxplot + Pareto + Stats bottom 55%.
 * EditableChartTitle overlays on each card. Escape hint at bottom.
 * No click-to-focus, no keyboard nav — Azure's FocusedChartView serves that need.
 *
 * Each app provides chart renders via callbacks (same pattern as FocusedChartViewBase).
 */
import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { EditableChartTitle } from '../EditableChartTitle';
import { Activity } from 'lucide-react';

export interface PresentationViewBaseProps {
  /** Outcome column name (for default title) */
  outcome: string;
  /** Boxplot factor (for default title) */
  boxplotFactor: string;
  /** Pareto factor (for default title) */
  paretoFactor: string;
  /** Custom chart titles */
  chartTitles: {
    ichart?: string;
    boxplot?: string;
    pareto?: string;
  };
  /** Callback when a chart title changes */
  onChartTitleChange: (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => void;
  /** Render callback for I-Chart slot */
  renderIChart: () => React.ReactNode;
  /** Render callback for Boxplot slot */
  renderBoxplot: () => React.ReactNode;
  /** Render callback for Pareto slot */
  renderPareto: () => React.ReactNode;
  /** Render callback for Stats slot */
  renderStats: () => React.ReactNode;
  /** Callback to exit presentation mode (Escape key handled by parent) */
  onExit?: () => void;
}

export const PresentationViewBase: React.FC<PresentationViewBaseProps> = ({
  outcome,
  boxplotFactor,
  paretoFactor,
  chartTitles,
  onChartTitleChange,
  renderIChart,
  renderBoxplot,
  renderPareto,
  renderStats,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col p-4 gap-4">
      {/* I-Chart - top section */}
      <div className="flex-[45] min-h-0 bg-surface-secondary border border-edge rounded-2xl p-4 flex flex-col">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Activity className="text-blue-400" size={20} />
            <EditableChartTitle
              defaultTitle={`I-Chart: ${outcome}`}
              value={chartTitles.ichart || ''}
              onChange={title => onChartTitleChange('ichart', title)}
            />
          </h2>
        </div>
        <div className="flex-1 min-h-0">
          <ErrorBoundary componentName="I-Chart">{renderIChart()}</ErrorBoundary>
        </div>
      </div>

      {/* Bottom section - Boxplot, Pareto, Stats */}
      <div className="flex-[55] min-h-0 flex gap-4">
        <div className="flex-1 bg-surface-secondary border border-edge rounded-2xl p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-2">
            <EditableChartTitle
              defaultTitle={`Boxplot: ${boxplotFactor}`}
              value={chartTitles.boxplot || ''}
              onChange={title => onChartTitleChange('boxplot', title)}
            />
          </h3>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Boxplot">{renderBoxplot()}</ErrorBoundary>
          </div>
        </div>
        <div className="flex-1 bg-surface-secondary border border-edge rounded-2xl p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-2">
            <EditableChartTitle
              defaultTitle={`Pareto: ${paretoFactor}`}
              value={chartTitles.pareto || ''}
              onChange={title => onChartTitleChange('pareto', title)}
            />
          </h3>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Pareto Chart">{renderPareto()}</ErrorBoundary>
          </div>
        </div>
        <div className="w-80 bg-surface-secondary border border-edge rounded-2xl p-4">
          {renderStats()}
        </div>
      </div>

      {/* Exit hint */}
      <div className="absolute bottom-4 right-4 text-content-muted text-xs">
        Press Escape to exit
      </div>
    </div>
  );
};
