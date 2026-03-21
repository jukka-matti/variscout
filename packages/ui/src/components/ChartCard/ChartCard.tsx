import React from 'react';
import { Copy, Check, Maximize2 } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import './ChartCard.css';

export type ChartId = 'ichart' | 'boxplot' | 'pareto' | 'stats';

export interface ChartCardProps {
  /** Container ID for copy-to-clipboard targeting */
  id: string;
  /** Chart identifier for embed mode and styling */
  chartId: ChartId;
  /** Header content - typically an icon + editable title */
  title: React.ReactNode;
  /** Right-side controls slot (selectors, toggles, etc.) */
  controls?: React.ReactNode;
  /** Chart content */
  children: React.ReactNode;
  /** Copy button click handler */
  onCopy?: () => void;
  /** Maximize/focus button click handler */
  onMaximize?: () => void;
  /** Show copy success state (checkmark instead of copy icon) */
  copyFeedback?: boolean;
  /** CSS class for embed mode highlight animation */
  highlightClass?: string;
  /** Container click handler (for embed mode chart selection) */
  onClick?: () => void;
  /** Minimum height for the chart container */
  minHeight?: string;
  /** Whether to show the action buttons (copy, maximize) */
  showActions?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * ChartCard - A reusable container for dashboard charts
 *
 * Features:
 * - Consistent header with title and controls slots
 * - Copy and maximize action buttons
 * - Embed mode highlight support
 * - Responsive sizing with CSS custom properties
 *
 * @example
 * <ChartCard
 *   id="ichart-card"
 *   chartId="ichart"
 *   title={<><Activity /> I-Chart</>}
 *   controls={<FactorSelector />}
 *   onCopy={handleCopy}
 *   onMaximize={handleMaximize}
 * >
 *   <IChart />
 * </ChartCard>
 */
export const ChartCard = ({
  ref,
  id,
  chartId,
  title,
  controls,
  children,
  onCopy,
  onMaximize,
  copyFeedback = false,
  highlightClass = '',
  onClick,
  minHeight = '280px',
  showActions = true,
  className = '',
}: ChartCardProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const { t } = useTranslation();
  return (
    <div
      ref={ref}
      id={id}
      data-chart-id={chartId}
      onClick={onClick}
      className={`chart-card ${highlightClass} ${className}`}
      style={{ minHeight }}
    >
      <div className="chart-card__header">
        <div className="chart-card__title">{title}</div>

        <div className="chart-card__controls">
          {controls}

          {showActions && (
            <div className="chart-card__actions">
              {onCopy && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  className={`chart-card__action-btn ${
                    copyFeedback ? 'chart-card__action-btn--success' : ''
                  }`}
                  title={t('chart.copyToClipboard')}
                >
                  {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
              {onMaximize && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onMaximize();
                  }}
                  className="chart-card__action-btn"
                  title={t('chart.maximize')}
                >
                  <Maximize2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="chart-card__content">{children}</div>
    </div>
  );
};

export default ChartCard;
