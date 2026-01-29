import React from 'react';
import { formatPValue, getStars, type MultiRegressionResult } from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import { ChevronDown, X, AlertTriangle } from 'lucide-react';
import type { ColumnClassification } from '@variscout/hooks';

interface AdvancedRegressionViewProps {
  outcome: string;
  columns: ColumnClassification;
  advSelectedPredictors: string[];
  toggleAdvPredictor: (col: string) => void;
  categoricalColumns: Set<string>;
  toggleCategorical: (col: string) => void;
  includeInteractions: boolean;
  setIncludeInteractions: (include: boolean) => void;
  multiRegressionResult: MultiRegressionResult | null;
}

/**
 * Advanced regression mode: GLM analysis with predictor selection
 */
export const AdvancedRegressionView: React.FC<AdvancedRegressionViewProps> = ({
  outcome,
  columns,
  advSelectedPredictors,
  toggleAdvPredictor,
  categoricalColumns,
  toggleCategorical,
  includeInteractions,
  setIncludeInteractions,
  multiRegressionResult,
}) => {
  const { getTerm } = useGlossary();
  const numericColumns = columns.numeric;

  return (
    <>
      {/* Predictor selection */}
      <div className="flex-none px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Response:</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
              {outcome}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Predictors:</span>
            <div className="relative">
              <select
                onChange={e => {
                  const col = e.target.value;
                  if (col && !advSelectedPredictors.includes(col)) {
                    toggleAdvPredictor(col);
                  }
                  e.target.value = '';
                }}
                className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500"
              >
                <option value="">+ Add predictor</option>
                <optgroup label="Numeric">
                  {numericColumns
                    .filter(c => !advSelectedPredictors.includes(c))
                    .map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                </optgroup>
                {columns.categorical.length > 0 && (
                  <optgroup label="Categorical">
                    {columns.categorical
                      .filter(c => !advSelectedPredictors.includes(c))
                      .map(col => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {advSelectedPredictors.map(col => {
              const isCat = categoricalColumns.has(col);
              return (
                <span
                  key={col}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isCat ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {col}
                  {numericColumns.includes(col) && (
                    <button
                      onClick={() => toggleCategorical(col)}
                      className="ml-1 text-[10px] px-1 rounded bg-slate-700 hover:bg-slate-600"
                      title={isCat ? 'Treat as continuous' : 'Treat as categorical'}
                    >
                      {isCat ? 'cat' : 'num'}
                    </button>
                  )}
                  <button onClick={() => toggleAdvPredictor(col)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>

          {advSelectedPredictors.length >= 2 && (
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInteractions}
                onChange={e => setIncludeInteractions(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
              />
              Include interactions
              <HelpTooltip term={getTerm('interactionEffect')} iconSize={12} />
            </label>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-4 overflow-auto">
        {!multiRegressionResult ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            {advSelectedPredictors.length === 0
              ? 'Select predictors above to run multiple regression'
              : 'Insufficient data for multiple regression'}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Model Summary Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-1">Model Summary</h3>
                  <p className="text-xs text-slate-500">
                    n = {multiRegressionResult.n} observations
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-white">
                      {(multiRegressionResult.adjustedRSquared * 100).toFixed(1)}%
                    </span>
                    <span className="text-yellow-400 text-lg">
                      {getStars(multiRegressionResult.strengthRating)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                    Adj. R²
                    <HelpTooltip term={getTerm('adjustedRSquared')} iconSize={10} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">R²</span>
                  <div className="text-slate-300 font-medium">
                    {multiRegressionResult.rSquared.toFixed(4)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">F-statistic</span>
                  <div className="text-slate-300 font-medium">
                    {multiRegressionResult.fStatistic.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    p-value <HelpTooltip term={getTerm('pValue')} iconSize={10} />
                  </span>
                  <div
                    className={`font-medium ${multiRegressionResult.isSignificant ? 'text-green-400' : 'text-slate-300'}`}
                  >
                    {formatPValue(multiRegressionResult.pValue)}
                    {multiRegressionResult.isSignificant && ' ✓'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">RMSE</span>
                  <div className="text-slate-300 font-medium">
                    {multiRegressionResult.rmse.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-sm text-blue-400">
                {multiRegressionResult.insight}
              </div>
            </div>

            {/* VIF Warnings */}
            {multiRegressionResult.vifWarnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                  <AlertTriangle size={16} />
                  Multicollinearity Warning
                  <HelpTooltip term={getTerm('vif')} iconSize={12} />
                </div>
                <ul className="text-xs text-amber-300/80 space-y-1">
                  {multiRegressionResult.vifWarnings.map(w => (
                    <li key={w.term}>
                      <span className="font-medium">{w.term}</span> VIF = {w.vif.toFixed(1)} -{' '}
                      {w.suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Predictors */}
            {multiRegressionResult.topPredictors.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">
                  Top Predictors (by importance)
                </h3>
                <div className="space-y-2">
                  {multiRegressionResult.coefficients
                    .filter(c => c.isSignificant)
                    .sort((a, b) => Math.abs(b.standardized) - Math.abs(a.standardized))
                    .slice(0, 5)
                    .map((coef, i) => {
                      const maxStd = Math.max(
                        ...multiRegressionResult.coefficients.map(c => Math.abs(c.standardized))
                      );
                      const barWidth =
                        maxStd > 0 ? (Math.abs(coef.standardized) / maxStd) * 100 : 0;

                      return (
                        <div key={coef.term} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                          <span className="text-xs text-slate-300 w-32 truncate">{coef.term}</span>
                          <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                            <div
                              className={`h-full ${coef.coefficient > 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-16 text-right">
                            β = {coef.standardized.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Coefficients Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300">Coefficients</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-slate-400">
                      <th className="text-left px-4 py-2">Term</th>
                      <th className="text-right px-4 py-2">Coefficient</th>
                      <th className="text-right px-4 py-2">Std Error</th>
                      <th className="text-right px-4 py-2">t-stat</th>
                      <th className="text-right px-4 py-2">p-value</th>
                      <th className="text-right px-4 py-2">
                        VIF
                        <HelpTooltip term={getTerm('vif')} iconSize={10} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-4 py-2 text-slate-500">(Intercept)</td>
                      <td className="text-right px-4 py-2 text-slate-300">
                        {multiRegressionResult.intercept.toFixed(4)}
                      </td>
                      <td className="text-right px-4 py-2 text-slate-500">-</td>
                      <td className="text-right px-4 py-2 text-slate-500">-</td>
                      <td className="text-right px-4 py-2 text-slate-500">-</td>
                      <td className="text-right px-4 py-2 text-slate-500">-</td>
                    </tr>
                    {multiRegressionResult.coefficients.map(coef => (
                      <tr key={coef.term} className="border-b border-slate-700/30">
                        <td className="px-4 py-2 text-slate-300">{coef.term}</td>
                        <td className="text-right px-4 py-2 text-slate-300">
                          {coef.coefficient.toFixed(4)}
                        </td>
                        <td className="text-right px-4 py-2 text-slate-500">
                          {coef.stdError.toFixed(4)}
                        </td>
                        <td className="text-right px-4 py-2 text-slate-300">
                          {coef.tStatistic.toFixed(2)}
                        </td>
                        <td
                          className={`text-right px-4 py-2 ${coef.isSignificant ? 'text-green-400' : 'text-slate-500'}`}
                        >
                          {formatPValue(coef.pValue)}
                          {coef.isSignificant && ' *'}
                        </td>
                        <td
                          className={`text-right px-4 py-2 ${
                            (coef.vif ?? 0) > 10
                              ? 'text-red-400'
                              : (coef.vif ?? 0) > 5
                                ? 'text-amber-400'
                                : 'text-slate-500'
                          }`}
                        >
                          {coef.vif?.toFixed(2) ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700/50">
                * Significant at p {'<'} 0.05
              </div>
            </div>

            {/* Model Equation */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Model Equation</h3>
              <div className="font-mono text-xs text-slate-400 bg-slate-900 rounded p-3 overflow-x-auto">
                {outcome} = {multiRegressionResult.intercept.toFixed(2)}
                {multiRegressionResult.coefficients.map(c => {
                  const sign = c.coefficient >= 0 ? ' + ' : ' - ';
                  const coef = Math.abs(c.coefficient).toFixed(3);
                  return `${sign}${coef} × ${c.term}`;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
