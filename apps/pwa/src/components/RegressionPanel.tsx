import React, { useMemo, useState } from 'react';
import { ScatterPlot } from '@variscout/charts';
import { calculateRegression, type RegressionResult } from '@variscout/core';
import { useData } from '../context/DataContext';
import { ChevronDown, TrendingUp, X } from 'lucide-react';

/**
 * Get star rating display
 */
function getStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * RegressionPanel - 2×2 grid of scatter plots with regression analysis
 */
const RegressionPanel: React.FC = () => {
  const { filteredData, outcome, specs } = useData();
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // Get all numeric columns except the outcome
  const numericColumns = useMemo(() => {
    if (filteredData.length === 0) return [];
    const row = filteredData[0];
    return Object.keys(row).filter(key => {
      if (key === outcome) return false;
      return typeof row[key] === 'number';
    });
  }, [filteredData, outcome]);

  // Allow selecting up to 4 X columns
  const [selectedXColumns, setSelectedXColumns] = useState<string[]>([]);

  // Auto-select first 4 numeric columns if none selected
  React.useEffect(() => {
    if (selectedXColumns.length === 0 && numericColumns.length > 0) {
      setSelectedXColumns(numericColumns.slice(0, 4));
    }
  }, [numericColumns, selectedXColumns.length]);

  // Calculate regression for each selected X column
  const regressionResults = useMemo(() => {
    if (!outcome || filteredData.length < 3) return [];

    return selectedXColumns
      .map(xCol => calculateRegression(filteredData, xCol, outcome))
      .filter((r): r is RegressionResult => r !== null);
  }, [filteredData, outcome, selectedXColumns]);

  // Sort by R² for ranking display
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

  if (!outcome) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Select an outcome variable to view regression analysis
      </div>
    );
  }

  if (numericColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No numeric columns available for regression
      </div>
    );
  }

  // Expanded chart modal
  if (expandedChart) {
    const result = regressionResults.find(r => r.xColumn === expandedChart);
    if (result) {
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
              <span className="text-slate-400 text-sm">
                R² = {rSquared.toFixed(3)}{' '}
                <span className="text-yellow-400">{getStars(result.strengthRating)}</span>
              </span>
            </div>
            <button
              onClick={() => setExpandedChart(null)}
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
              <div className="text-slate-400">
                <span className="text-slate-500">Slope:</span>{' '}
                <span className="text-white">{result.linear.slope.toFixed(4)}</span>
              </div>
              <div className="text-slate-400">
                <span className="text-slate-500">p-value:</span>{' '}
                <span className={result.linear.isSignificant ? 'text-green-400' : 'text-slate-300'}>
                  {result.linear.pValue < 0.001 ? '< 0.001' : result.linear.pValue.toFixed(3)}
                </span>
              </div>
              <div className="text-blue-400 font-medium">{result.insight}</div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Column selector */}
      <div className="flex-none px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-400 uppercase tracking-wider">X Variables:</span>
          <div className="relative">
            <select
              onChange={e => {
                const col = e.target.value;
                if (col && !selectedXColumns.includes(col)) {
                  toggleXColumn(col);
                }
                e.target.value = '';
              }}
              className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
          <span className="text-xs text-slate-500">→ {outcome}</span>
        </div>
      </div>

      {/* 2×2 Grid of scatter plots */}
      <div className="flex-1 p-4 overflow-auto">
        {regressionResults.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
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
                  className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col min-h-[280px]"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300 truncate">
                      {result.xColumn} vs {result.yColumn}
                    </span>
                    <span className="text-xs text-slate-400">
                      R²={rSquared.toFixed(2)}{' '}
                      <span className="text-yellow-400">{getStars(result.strengthRating)}</span>
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
        <div className="flex-none px-4 py-3 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Ranking:</span>
            {sortedByStrength.map((r, i) => (
              <React.Fragment key={r.xColumn}>
                {i > 0 && <span className="text-slate-600">→</span>}
                <span
                  className={`px-2 py-0.5 rounded ${
                    i === 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {r.xColumn}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegressionPanel;
