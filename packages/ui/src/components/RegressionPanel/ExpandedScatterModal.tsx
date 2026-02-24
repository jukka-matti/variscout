import React, { useEffect } from 'react';
import { ScatterPlot } from '@variscout/charts';
import { formatPValue, getStars } from '@variscout/core';
import { useChartCopy } from '@variscout/hooks';
import { HelpTooltip } from '../HelpTooltip';
import { ChartDownloadMenu } from '../ChartExportMenu';
import { useGlossary } from '../../hooks';
import { TrendingUp, X, Copy, Check } from 'lucide-react';
import {
  regressionViewDefaultColorScheme,
  type ExpandedScatterModalComponentProps,
} from './regressionViewColors';

/**
 * Full-screen modal for viewing an expanded scatter plot
 */
export const ExpandedScatterModal: React.FC<ExpandedScatterModalComponentProps> = ({
  result,
  specs,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
  showBranding = true,
  colorScheme = regressionViewDefaultColorScheme,
}) => {
  const { getTerm } = useGlossary();
  const c = colorScheme;
  const { copyFeedback, handleCopyChart, handleDownloadPng, handleDownloadSvg } = useChartCopy();

  // Keyboard navigation: Escape to close, arrow keys to cycle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && onNext) onNext();
      else if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  const rSquared =
    result.recommendedFit === 'quadratic' && result.quadratic
      ? result.quadratic.rSquared
      : result.linear.rSquared;

  return (
    <div className={`fixed inset-0 z-50 ${c.modalBg} flex flex-col`}>
      <div className={`flex items-center justify-between p-4 border-b ${c.border}`}>
        <div className="flex items-center gap-3">
          <TrendingUp className="text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-white">
            {result.xColumn} vs {result.yColumn}
          </h2>
          {currentIndex !== undefined && totalCount !== undefined && totalCount > 1 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.inputBg} ${c.secondaryText}`}>
              {currentIndex} of {totalCount}
            </span>
          )}
          <span className={`${c.secondaryText} text-sm flex items-center gap-1`}>
            R² = {rSquared.toFixed(3)}{' '}
            <span className="text-yellow-400">{getStars(result.strengthRating)}</span>
            <HelpTooltip term={getTerm('rSquared')} iconSize={12} />
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCopyChart('scatter-expanded', 'scatter')}
            className={`p-1.5 rounded transition-all ${
              copyFeedback === 'scatter'
                ? 'bg-green-500/20 text-green-400'
                : `${c.secondaryText} hover:text-white ${c.hoverBg}`
            }`}
            title="Copy to clipboard"
            aria-label="Copy scatter plot to clipboard"
          >
            {copyFeedback === 'scatter' ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <ChartDownloadMenu
            containerId="scatter-expanded"
            chartName="scatter"
            onDownloadPng={handleDownloadPng}
            onDownloadSvg={handleDownloadSvg}
          />
          <button
            onClick={onClose}
            className={`p-2 ${c.secondaryText} hover:text-white ${c.hoverBg} rounded-lg transition-colors`}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div id="scatter-expanded" className={`h-full ${c.cardBg} rounded-xl border ${c.border}`}>
          <ScatterPlot
            regression={result}
            specs={specs ?? undefined}
            xAxisLabel={result.xColumn}
            yAxisLabel={result.yColumn}
            showBranding={showBranding}
          />
        </div>
      </div>

      <div className={`p-4 border-t ${c.border} ${c.sectionBg}`}>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className={c.secondaryText}>
            <span className={c.mutedText}>Fit:</span>{' '}
            <span className="text-white capitalize">{result.recommendedFit}</span>
          </div>
          <div className={c.secondaryText}>
            <span className={c.mutedText}>n:</span> <span className="text-white">{result.n}</span>
          </div>
          <div className={`${c.secondaryText} flex items-center gap-1`}>
            <span className={c.mutedText}>Slope:</span>{' '}
            <span className="text-white">{result.linear.slope.toFixed(4)}</span>
            <HelpTooltip term={getTerm('slope')} iconSize={12} />
          </div>
          <div className={`${c.secondaryText} flex items-center gap-1`}>
            <span className={c.mutedText}>p-value:</span>{' '}
            <span className={result.linear.isSignificant ? 'text-green-400' : c.contentText}>
              {formatPValue(result.linear.pValue)}
            </span>
            <HelpTooltip term={getTerm('pValue')} iconSize={12} />
          </div>
          <div className="text-blue-400 font-medium">{result.insight}</div>
        </div>
      </div>
    </div>
  );
};
