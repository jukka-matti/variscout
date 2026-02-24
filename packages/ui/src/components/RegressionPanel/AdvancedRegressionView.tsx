import React from 'react';
import { formatPValue, getStars } from '@variscout/core';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks';
import { ChevronDown, X, AlertTriangle, Lightbulb, CheckCircle, Beaker } from 'lucide-react';
import {
  regressionViewDefaultColorScheme,
  type AdvancedRegressionViewComponentProps,
} from './regressionViewColors';

/**
 * Advanced regression mode: GLM analysis with predictor selection and guided model reduction
 */
export const AdvancedRegressionView: React.FC<AdvancedRegressionViewComponentProps> = ({
  outcome,
  columns,
  advSelectedPredictors,
  toggleAdvPredictor,
  categoricalColumns,
  toggleCategorical,
  includeInteractions,
  setIncludeInteractions,
  multiRegressionResult,
  suggestion,
  reductionHistory,
  onRemoveTerm,
  onClearHistory,
  onNavigateToWhatIf,
  colorScheme = regressionViewDefaultColorScheme,
}) => {
  const { getTerm } = useGlossary();
  const c = colorScheme;
  const numericColumns = columns.numeric;

  return (
    <>
      {/* Predictor selection */}
      <div className={`flex-none px-4 py-3 border-b ${c.border} ${c.sectionBg}`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs ${c.secondaryText} uppercase tracking-wider`}>Response:</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
              {outcome}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs ${c.secondaryText} uppercase tracking-wider`}>
              Predictors:
            </span>
            <div className="relative">
              <select
                onChange={e => {
                  const col = e.target.value;
                  if (col && !advSelectedPredictors.includes(col)) {
                    toggleAdvPredictor(col);
                  }
                  e.target.value = '';
                }}
                className={`${c.inputBg} border ${c.inputBorder} text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500`}
              >
                <option value="">+ Add predictor</option>
                <optgroup label="Numeric">
                  {numericColumns
                    .filter(nc => !advSelectedPredictors.includes(nc))
                    .map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                </optgroup>
                {columns.categorical.length > 0 && (
                  <optgroup label="Categorical">
                    {columns.categorical
                      .filter(cc => !advSelectedPredictors.includes(cc))
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
                className={`absolute right-2 top-1/2 -translate-y-1/2 ${c.secondaryText} pointer-events-none`}
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
                      className={`ml-1 text-[10px] px-1 rounded ${c.tertiaryBg} ${c.toggleBtnHover}`}
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
            <label className={`flex items-center gap-2 text-xs ${c.secondaryText} cursor-pointer`}>
              <input
                type="checkbox"
                checked={includeInteractions}
                onChange={e => setIncludeInteractions(e.target.checked)}
                className={`rounded ${c.inputBorder} ${c.inputBg} text-blue-500 focus:ring-blue-500`}
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
          <div className={`flex items-center justify-center h-full ${c.mutedText}`}>
            {advSelectedPredictors.length === 0
              ? 'Select predictors above to run multiple regression'
              : 'Insufficient data for multiple regression'}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Model Summary Card */}
            <div className={`${c.cardBg} rounded-xl border ${c.border} p-4`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-medium ${c.contentText} mb-1`}>Model Summary</h3>
                  <p className={`text-xs ${c.mutedText}`}>
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
                  <div className={`text-xs ${c.secondaryText} flex items-center gap-1 justify-end`}>
                    Adj. R²
                    <HelpTooltip term={getTerm('adjustedRSquared')} iconSize={10} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className={c.mutedText}>R²</span>
                  <div className={`${c.contentText} font-medium`}>
                    {multiRegressionResult.rSquared.toFixed(4)}
                  </div>
                </div>
                <div>
                  <span className={c.mutedText}>F-statistic</span>
                  <div className={`${c.contentText} font-medium`}>
                    {multiRegressionResult.fStatistic.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className={`${c.mutedText} flex items-center gap-1`}>
                    p-value <HelpTooltip term={getTerm('pValue')} iconSize={10} />
                  </span>
                  <div
                    className={`font-medium ${multiRegressionResult.isSignificant ? 'text-green-400' : c.contentText}`}
                  >
                    {formatPValue(multiRegressionResult.pValue)}
                    {multiRegressionResult.isSignificant && ' \u2713'}
                  </div>
                </div>
                <div>
                  <span className={c.mutedText}>RMSE</span>
                  <div className={`${c.contentText} font-medium`}>
                    {multiRegressionResult.rmse.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-sm text-blue-400">
                {multiRegressionResult.insight}
              </div>
            </div>

            {/* Model Reduction Banner */}
            {suggestion ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-amber-400 mb-1">
                      Suggestion: Remove &ldquo;{suggestion.term}&rdquo; (p ={' '}
                      {suggestion.pValue.toFixed(3)})
                    </div>
                    <p className="text-xs text-amber-300/80 mb-3">{suggestion.explanation}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRemoveTerm(suggestion.term)}
                        className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                      >
                        Remove term
                      </button>
                      <button
                        onClick={() => {}}
                        className={`px-3 py-1.5 text-xs font-medium ${c.secondaryText} ${c.hoverText} ${c.hoverBg} rounded-lg transition-colors`}
                      >
                        Keep all
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : multiRegressionResult.coefficients.length > 0 ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle size={16} />
                    All terms significant — model is well-specified
                  </div>
                  {onNavigateToWhatIf && (
                    <button
                      onClick={() => onNavigateToWhatIf(multiRegressionResult)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                    >
                      <Beaker size={12} />
                      Project in What-If &rarr;
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Reduction History */}
            {reductionHistory.length > 0 && (
              <div className={`${c.cardBg} rounded-xl border ${c.border} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-medium ${c.contentText}`}>Reduction History</h3>
                  <button
                    onClick={onClearHistory}
                    className={`text-[10px] ${c.mutedText} ${c.hoverText} transition-colors`}
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  {reductionHistory.map((step, i) => {
                    const adjR2Change = step.adjR2After - step.adjR2Before;
                    const improved = adjR2Change >= -0.001;
                    return (
                      <div key={i} className={`flex items-center gap-2 ${c.secondaryText}`}>
                        <span className={`${c.mutedText} w-12`}>Step {i + 1}:</span>
                        <span>
                          Removed {step.term} (p={step.pValue.toFixed(2)})
                        </span>
                        <span className={c.mutedText}>&mdash;</span>
                        <span>
                          Adj. R²: {(step.adjR2Before * 100).toFixed(1)}% &rarr;{' '}
                          {(step.adjR2After * 100).toFixed(1)}%
                        </span>
                        <span className={improved ? 'text-green-400' : 'text-amber-400'}>
                          {improved ? '\u2713' : '\u2193'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
              <div className={`${c.cardBg} rounded-xl border ${c.border} p-4`}>
                <h3 className={`text-sm font-medium ${c.contentText} mb-3`}>
                  Top Predictors (by importance)
                </h3>
                <div className="space-y-2">
                  {multiRegressionResult.coefficients
                    .filter(coef => coef.isSignificant)
                    .sort((a, b) => Math.abs(b.standardized) - Math.abs(a.standardized))
                    .slice(0, 5)
                    .map((coef, i) => {
                      const maxStd = Math.max(
                        ...multiRegressionResult.coefficients.map(cf => Math.abs(cf.standardized))
                      );
                      const barWidth =
                        maxStd > 0 ? (Math.abs(coef.standardized) / maxStd) * 100 : 0;

                      return (
                        <div key={coef.term} className="flex items-center gap-3">
                          <span className={`text-xs ${c.mutedText} w-4`}>{i + 1}</span>
                          <span className={`text-xs ${c.contentText} w-32 truncate`}>
                            {coef.term}
                          </span>
                          <div className={`flex-1 h-4 ${c.inputBg} rounded overflow-hidden`}>
                            <div
                              className={`h-full ${coef.coefficient > 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className={`text-xs ${c.secondaryText} w-16 text-right`}>
                            &beta; = {coef.standardized.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Coefficients Table */}
            <div className={`${c.cardBg} rounded-xl border ${c.border} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${c.borderSubtle}`}>
                <h3 className={`text-sm font-medium ${c.contentText}`}>Coefficients</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b ${c.borderSubtle} ${c.secondaryText}`}>
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
                    <tr className={`border-b ${c.borderFaint}`}>
                      <td className={`px-4 py-2 ${c.mutedText}`}>(Intercept)</td>
                      <td className={`text-right px-4 py-2 ${c.contentText}`}>
                        {multiRegressionResult.intercept.toFixed(4)}
                      </td>
                      <td className={`text-right px-4 py-2 ${c.mutedText}`}>-</td>
                      <td className={`text-right px-4 py-2 ${c.mutedText}`}>-</td>
                      <td className={`text-right px-4 py-2 ${c.mutedText}`}>-</td>
                      <td className={`text-right px-4 py-2 ${c.mutedText}`}>-</td>
                    </tr>
                    {multiRegressionResult.coefficients.map(coef => {
                      const isSuggested = suggestion?.term === coef.term;
                      return (
                        <tr
                          key={coef.term}
                          className={`border-b ${c.borderFaint} ${isSuggested ? 'bg-amber-500/10' : ''}`}
                        >
                          <td className={`px-4 py-2 ${c.contentText}`}>
                            <span className="flex items-center gap-1.5">
                              {coef.term}
                              {isSuggested && (
                                <span className="text-[10px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                  weakest
                                </span>
                              )}
                            </span>
                          </td>
                          <td className={`text-right px-4 py-2 ${c.contentText}`}>
                            {coef.coefficient.toFixed(4)}
                          </td>
                          <td className={`text-right px-4 py-2 ${c.mutedText}`}>
                            {coef.stdError.toFixed(4)}
                          </td>
                          <td className={`text-right px-4 py-2 ${c.contentText}`}>
                            {coef.tStatistic.toFixed(2)}
                          </td>
                          <td
                            className={`text-right px-4 py-2 ${coef.isSignificant ? 'text-green-400' : c.mutedText}`}
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
                                  : c.mutedText
                            }`}
                          >
                            {coef.vif?.toFixed(2) ?? '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={`px-4 py-2 text-xs ${c.mutedText} border-t ${c.borderSubtle}`}>
                * Significant at p {'<'} 0.05
              </div>
            </div>

            {/* Model Equation */}
            <div className={`${c.cardBg} rounded-xl border ${c.border} p-4`}>
              <h3 className={`text-sm font-medium ${c.contentText} mb-2`}>Model Equation</h3>
              <div
                className={`font-mono text-xs ${c.secondaryText} ${c.inputBg} rounded p-3 overflow-x-auto`}
              >
                {outcome} = {multiRegressionResult.intercept.toFixed(2)}
                {multiRegressionResult.coefficients.map(coefItem => {
                  const sign = coefItem.coefficient >= 0 ? ' + ' : ' - ';
                  const coefVal = Math.abs(coefItem.coefficient).toFixed(3);
                  return `${sign}${coefVal} \u00d7 ${coefItem.term}`;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
