import React from 'react';
import { ScatterPlot } from '@variscout/charts';
import { formatPValue, getStars, type RegressionResult, type SpecLimits } from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import { TrendingUp, X } from 'lucide-react';

interface ExpandedScatterModalProps {
  result: RegressionResult;
  specs: SpecLimits;
  onClose: () => void;
}

/**
 * Full-screen modal for viewing an expanded scatter plot
 */
export const ExpandedScatterModal: React.FC<ExpandedScatterModalProps> = ({
  result,
  specs,
  onClose,
}) => {
  const { getTerm } = useGlossary();

  const rSquared =
    result.recommendedFit === 'quadratic' && result.quadratic
      ? result.quadratic.rSquared
      : result.linear.rSquared;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-white">
            {result.xColumn} vs {result.yColumn}
          </h2>
          <span className="text-slate-400 text-sm flex items-center gap-1">
            R² = {rSquared.toFixed(3)}{' '}
            <span className="text-yellow-400">{getStars(result.strengthRating)}</span>
            <HelpTooltip term={getTerm('rSquared')} iconSize={12} />
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 p-4">
        <div className="h-full bg-slate-800 rounded-xl border border-slate-700">
          <ScatterPlot
            regression={result}
            specs={specs}
            xAxisLabel={result.xColumn}
            yAxisLabel={result.yColumn}
            showBranding={true}
          />
        </div>
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="text-slate-400">
            <span className="text-slate-500">Fit:</span>{' '}
            <span className="text-white capitalize">{result.recommendedFit}</span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-500">n:</span>{' '}
            <span className="text-white">{result.n}</span>
          </div>
          <div className="text-slate-400 flex items-center gap-1">
            <span className="text-slate-500">Slope:</span>{' '}
            <span className="text-white">{result.linear.slope.toFixed(4)}</span>
            <HelpTooltip term={getTerm('slope')} iconSize={12} />
          </div>
          <div className="text-slate-400 flex items-center gap-1">
            <span className="text-slate-500">p-value:</span>{' '}
            <span className={result.linear.isSignificant ? 'text-green-400' : 'text-slate-300'}>
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
