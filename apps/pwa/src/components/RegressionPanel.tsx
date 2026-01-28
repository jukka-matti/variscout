import React, { useMemo, useState } from 'react';
import { ScatterPlot } from '@variscout/charts';
import {
  calculateRegression,
  calculateMultipleRegression,
  type RegressionResult,
  type MultiRegressionResult,
} from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import { useData } from '../context/DataContext';
import { ChevronDown, TrendingUp, X, AlertTriangle, BarChart3, Layers } from 'lucide-react';

/**
 * Get star rating display
 */
function getStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * Format p-value for display
 */
function formatPValue(p: number): string {
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
}

type RegressionMode = 'simple' | 'advanced';

/**
 * RegressionPanel - 2×2 grid of scatter plots (Simple) or GLM analysis (Advanced)
 */
const RegressionPanel: React.FC = () => {
  const { filteredData, outcome, specs } = useData();
  const { getTerm } = useGlossary();
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [mode, setMode] = useState<RegressionMode>('simple');

  // Advanced mode state
  const [advSelectedPredictors, setAdvSelectedPredictors] = useState<string[]>([]);
  const [categoricalColumns, setCategoricalColumns] = useState<Set<string>>(new Set());
  const [includeInteractions, setIncludeInteractions] = useState(false);

  // Get all columns categorized by type
  const columns = useMemo(() => {
    if (filteredData.length === 0) return { numeric: [], categorical: [] };
    const row = filteredData[0];
    const numeric: string[] = [];
    const categorical: string[] = [];

    Object.keys(row).forEach(key => {
      if (key === outcome) return;
      if (typeof row[key] === 'number') {
        numeric.push(key);
      } else if (typeof row[key] === 'string') {
        // Check if categorical (limited unique values)
        const uniqueValues = new Set(filteredData.map(r => r[key]));
        if (uniqueValues.size <= 10) {
          categorical.push(key);
        }
      }
    });

    return { numeric, categorical };
  }, [filteredData, outcome]);

  const numericColumns = columns.numeric;

  // Simple mode: Allow selecting up to 4 X columns
  const [selectedXColumns, setSelectedXColumns] = useState<string[]>([]);

  // Auto-select first 4 numeric columns if none selected
  React.useEffect(() => {
    if (selectedXColumns.length === 0 && numericColumns.length > 0) {
      setSelectedXColumns(numericColumns.slice(0, 4));
    }
  }, [numericColumns, selectedXColumns.length]);

  // Calculate simple regression for each selected X column
  const regressionResults = useMemo(() => {
    if (!outcome || filteredData.length < 3 || mode !== 'simple') return [];

    return selectedXColumns
      .map(xCol => calculateRegression(filteredData, xCol, outcome))
      .filter((r): r is RegressionResult => r !== null);
  }, [filteredData, outcome, selectedXColumns, mode]);

  // Calculate multiple regression for advanced mode
  const multiRegressionResult = useMemo((): MultiRegressionResult | null => {
    if (!outcome || filteredData.length < 5 || mode !== 'advanced') return null;
    if (advSelectedPredictors.length === 0) return null;

    return calculateMultipleRegression(filteredData, outcome, advSelectedPredictors, {
      categoricalColumns: Array.from(categoricalColumns),
      includeInteractions,
    });
  }, [filteredData, outcome, advSelectedPredictors, categoricalColumns, includeInteractions, mode]);

  // Sort by R² for ranking display (simple mode)
  const sortedByStrength = useMemo(() => {
    return [...regressionResults].sort((a, b) => {
      const aR2 =
        a.recommendedFit === 'quadratic' && a.quadratic ? a.quadratic.rSquared : a.linear.rSquared;
      const bR2 =
        b.recommendedFit === 'quadratic' && b.quadratic ? b.quadratic.rSquared : b.linear.rSquared;
      return bR2 - aR2;
    });
  }, [regressionResults]);

  const toggleXColumn = (col: string) => {
    if (selectedXColumns.includes(col)) {
      setSelectedXColumns(prev => prev.filter(c => c !== col));
    } else if (selectedXColumns.length < 4) {
      setSelectedXColumns(prev => [...prev, col]);
    }
  };

  const toggleAdvPredictor = (col: string) => {
    if (advSelectedPredictors.includes(col)) {
      setAdvSelectedPredictors(prev => prev.filter(c => c !== col));
      // Also remove from categorical if present
      setCategoricalColumns(prev => {
        const next = new Set(prev);
        next.delete(col);
        return next;
      });
    } else {
      setAdvSelectedPredictors(prev => [...prev, col]);
    }
  };

  const toggleCategorical = (col: string) => {
    setCategoricalColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  if (!outcome) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted">
        Select an outcome variable to view regression analysis
      </div>
    );
  }

  if (numericColumns.length === 0 && columns.categorical.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted">
        No columns available for regression
      </div>
    );
  }

  // Expanded chart modal (Simple mode only)
  if (expandedChart && mode === 'simple') {
    const result = regressionResults.find(r => r.xColumn === expandedChart);
    if (result) {
      const rSquared =
        result.recommendedFit === 'quadratic' && result.quadratic
          ? result.quadratic.rSquared
          : result.linear.rSquared;

      return (
        <div className="fixed inset-0 z-50 bg-surface/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-edge">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-blue-400" size={20} />
              <h2 className="text-lg font-semibold text-white">
                {result.xColumn} vs {result.yColumn}
              </h2>
              <span className="text-content-secondary text-sm flex items-center gap-1">
                R² = {rSquared.toFixed(3)}{' '}
                <span className="text-yellow-400">{getStars(result.strengthRating)}</span>
                <HelpTooltip term={getTerm('rSquared')} iconSize={12} />
              </span>
            </div>
            <button
              onClick={() => setExpandedChart(null)}
              className="p-2 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4">
            <div className="h-full bg-surface-secondary rounded-xl border border-edge">
              <ScatterPlot
                regression={result}
                specs={specs}
                xAxisLabel={result.xColumn}
                yAxisLabel={result.yColumn}
                showBranding={true}
              />
            </div>
          </div>

          <div className="p-4 border-t border-edge bg-surface-secondary/50">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="text-content-secondary">
                <span className="text-content-muted">Fit:</span>{' '}
                <span className="text-white capitalize">{result.recommendedFit}</span>
              </div>
              <div className="text-content-secondary">
                <span className="text-content-muted">n:</span>{' '}
                <span className="text-white">{result.n}</span>
              </div>
              <div className="text-content-secondary flex items-center gap-1">
                <span className="text-content-muted">Slope:</span>{' '}
                <span className="text-white">{result.linear.slope.toFixed(4)}</span>
                <HelpTooltip term={getTerm('slope')} iconSize={12} />
              </div>
              <div className="text-content-secondary flex items-center gap-1">
                <span className="text-content-muted">p-value:</span>{' '}
                <span className={result.linear.isSignificant ? 'text-green-400' : 'text-content'}>
                  {formatPValue(result.linear.pValue)}
                </span>
                <HelpTooltip term={getTerm('pValue')} iconSize={12} />
              </div>
              <div className="text-blue-400 font-medium">{result.insight}</div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Mode toggle */}
      <div className="flex-none px-4 py-2 border-b border-edge bg-surface-tertiary/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('simple')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              mode === 'simple'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            <BarChart3 size={14} />
            Simple
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              mode === 'advanced'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            <Layers size={14} />
            Advanced (GLM)
            <HelpTooltip term={getTerm('multipleRegression')} iconSize={12} />
          </button>
        </div>
      </div>

      {mode === 'simple' ? (
        // Simple mode: 2x2 grid of scatter plots
        <>
          {/* Column selector */}
          <div className="flex-none px-4 py-3 border-b border-edge bg-surface-secondary/50">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-content-secondary uppercase tracking-wider">
                X Variables:
              </span>
              <div className="relative">
                <select
                  onChange={e => {
                    const col = e.target.value;
                    if (col && !selectedXColumns.includes(col)) {
                      toggleXColumn(col);
                    }
                    e.target.value = '';
                  }}
                  className="bg-surface border border-edge-secondary text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500"
                >
                  <option value="">+ Add column</option>
                  {numericColumns
                    .filter(c => !selectedXColumns.includes(c))
                    .map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-content-secondary pointer-events-none"
                />
              </div>
              {selectedXColumns.map(col => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                >
                  {col}
                  <button onClick={() => toggleXColumn(col)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <span className="text-xs text-content-muted">→ {outcome}</span>
            </div>
          </div>

          {/* 2×2 Grid of scatter plots */}
          <div className="flex-1 p-4 overflow-auto">
            {regressionResults.length === 0 ? (
              <div className="flex items-center justify-center h-full text-content-muted">
                Select X variables above to view regression analysis
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {regressionResults.map(result => {
                  const rSquared =
                    result.recommendedFit === 'quadratic' && result.quadratic
                      ? result.quadratic.rSquared
                      : result.linear.rSquared;

                  return (
                    <div
                      key={result.xColumn}
                      className="bg-surface-secondary rounded-xl border border-edge overflow-hidden flex flex-col min-h-[280px]"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-edge/50">
                        <span className="text-xs font-medium text-content truncate">
                          {result.xColumn} vs {result.yColumn}
                        </span>
                        <span className="text-xs text-content-secondary flex items-center gap-1">
                          R²={rSquared.toFixed(2)}{' '}
                          <span className="text-yellow-400">{getStars(result.strengthRating)}</span>
                          <HelpTooltip term={getTerm('rSquared')} iconSize={10} />
                        </span>
                      </div>
                      <div
                        className="flex-1 min-h-0 cursor-pointer"
                        onClick={() => setExpandedChart(result.xColumn)}
                      >
                        <ScatterPlot
                          regression={result}
                          specs={specs}
                          showBranding={false}
                          showStars={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary ranking bar */}
          {sortedByStrength.length > 1 && (
            <div className="flex-none px-4 py-3 border-t border-edge bg-surface-secondary/50">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-content-secondary">Ranking:</span>
                {sortedByStrength.map((r, i) => (
                  <React.Fragment key={r.xColumn}>
                    {i > 0 && <span className="text-content-muted">→</span>}
                    <span
                      className={`px-2 py-0.5 rounded ${
                        i === 0
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-surface-tertiary text-content'
                      }`}
                    >
                      {r.xColumn}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // Advanced mode: Multiple regression
        <>
          {/* Predictor selection */}
          <div className="flex-none px-4 py-3 border-b border-edge bg-surface-secondary/50">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-content-secondary uppercase tracking-wider">
                  Response:
                </span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  {outcome}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-content-secondary uppercase tracking-wider">
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
                    className="bg-surface border border-edge-secondary text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-content-secondary pointer-events-none"
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
                          className="ml-1 text-[10px] px-1 rounded bg-surface-tertiary hover:bg-surface"
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
                <label className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInteractions}
                    onChange={e => setIncludeInteractions(e.target.checked)}
                    className="rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500"
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
              <div className="flex items-center justify-center h-full text-content-muted">
                {advSelectedPredictors.length === 0
                  ? 'Select predictors above to run multiple regression'
                  : 'Insufficient data for multiple regression'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Model Summary Card */}
                <div className="bg-surface-secondary rounded-xl border border-edge p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-content mb-1">Model Summary</h3>
                      <p className="text-xs text-content-muted">
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
                      <div className="text-xs text-content-secondary flex items-center gap-1 justify-end">
                        Adj. R²
                        <HelpTooltip term={getTerm('adjustedRSquared')} iconSize={10} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-content-muted">R²</span>
                      <div className="text-content font-medium">
                        {multiRegressionResult.rSquared.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-content-muted">F-statistic</span>
                      <div className="text-content font-medium">
                        {multiRegressionResult.fStatistic.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-content-muted flex items-center gap-1">
                        p-value <HelpTooltip term={getTerm('pValue')} iconSize={10} />
                      </span>
                      <div
                        className={`font-medium ${multiRegressionResult.isSignificant ? 'text-green-400' : 'text-content'}`}
                      >
                        {formatPValue(multiRegressionResult.pValue)}
                        {multiRegressionResult.isSignificant && ' ✓'}
                      </div>
                    </div>
                    <div>
                      <span className="text-content-muted">RMSE</span>
                      <div className="text-content font-medium">
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
                  <div className="bg-surface-secondary rounded-xl border border-edge p-4">
                    <h3 className="text-sm font-medium text-content mb-3">
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
                              <span className="text-xs text-content-muted w-4">{i + 1}</span>
                              <span className="text-xs text-content w-32 truncate">
                                {coef.term}
                              </span>
                              <div className="flex-1 h-4 bg-surface rounded overflow-hidden">
                                <div
                                  className={`h-full ${coef.coefficient > 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                              <span className="text-xs text-content-secondary w-16 text-right">
                                β = {coef.standardized.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Coefficients Table */}
                <div className="bg-surface-secondary rounded-xl border border-edge overflow-hidden">
                  <div className="px-4 py-3 border-b border-edge/50">
                    <h3 className="text-sm font-medium text-content">Coefficients</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-edge/50 text-content-secondary">
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
                        <tr className="border-b border-edge/30">
                          <td className="px-4 py-2 text-content-muted">(Intercept)</td>
                          <td className="text-right px-4 py-2 text-content">
                            {multiRegressionResult.intercept.toFixed(4)}
                          </td>
                          <td className="text-right px-4 py-2 text-content-muted">-</td>
                          <td className="text-right px-4 py-2 text-content-muted">-</td>
                          <td className="text-right px-4 py-2 text-content-muted">-</td>
                          <td className="text-right px-4 py-2 text-content-muted">-</td>
                        </tr>
                        {multiRegressionResult.coefficients.map(coef => (
                          <tr key={coef.term} className="border-b border-edge/30">
                            <td className="px-4 py-2 text-content">{coef.term}</td>
                            <td className="text-right px-4 py-2 text-content">
                              {coef.coefficient.toFixed(4)}
                            </td>
                            <td className="text-right px-4 py-2 text-content-muted">
                              {coef.stdError.toFixed(4)}
                            </td>
                            <td className="text-right px-4 py-2 text-content">
                              {coef.tStatistic.toFixed(2)}
                            </td>
                            <td
                              className={`text-right px-4 py-2 ${coef.isSignificant ? 'text-green-400' : 'text-content-muted'}`}
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
                                    : 'text-content-muted'
                              }`}
                            >
                              {coef.vif?.toFixed(2) ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 text-xs text-content-muted border-t border-edge/50">
                    * Significant at p {'<'} 0.05
                  </div>
                </div>

                {/* Model Equation */}
                <div className="bg-surface-secondary rounded-xl border border-edge p-4">
                  <h3 className="text-sm font-medium text-content mb-2">Model Equation</h3>
                  <div className="font-mono text-xs text-content-secondary bg-surface rounded p-3 overflow-x-auto">
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
      )}
    </div>
  );
};

export default RegressionPanel;
