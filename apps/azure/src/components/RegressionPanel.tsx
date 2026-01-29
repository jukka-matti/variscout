import React, { useMemo } from 'react';
import {
  calculateRegression,
  calculateMultipleRegression,
  type RegressionResult,
} from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import { useColumnClassification, useRegressionState } from '@variscout/hooks';
import { useData } from '../context/DataContext';
import { BarChart3, Layers } from 'lucide-react';
import { ExpandedScatterModal, SimpleRegressionView, AdvancedRegressionView } from './regression';

/**
 * RegressionPanel - 2×2 grid of scatter plots (Simple) or GLM analysis (Advanced)
 */
const RegressionPanel: React.FC = () => {
  const { filteredData, outcome, specs } = useData();
  const { getTerm } = useGlossary();

  // Classify columns by type
  const columns = useColumnClassification(filteredData, {
    excludeColumn: outcome,
    maxCategoricalUnique: 10,
  });

  // Regression state management
  const regression = useRegressionState({
    numericColumns: columns.numeric,
    maxSimpleColumns: 4,
  });

  // Calculate simple regression for each selected X column
  const regressionResults = useMemo(() => {
    if (!outcome || filteredData.length < 3 || regression.mode !== 'simple') return [];

    return regression.selectedXColumns
      .map(xCol => calculateRegression(filteredData, xCol, outcome))
      .filter((r): r is RegressionResult => r !== null);
  }, [filteredData, outcome, regression.selectedXColumns, regression.mode]);

  // Calculate multiple regression for advanced mode
  const multiRegressionResult = useMemo(() => {
    if (!outcome || filteredData.length < 5 || regression.mode !== 'advanced') return null;
    if (regression.advSelectedPredictors.length === 0) return null;

    return calculateMultipleRegression(filteredData, outcome, regression.advSelectedPredictors, {
      categoricalColumns: Array.from(regression.categoricalColumns),
      includeInteractions: regression.includeInteractions,
    });
  }, [
    filteredData,
    outcome,
    regression.advSelectedPredictors,
    regression.categoricalColumns,
    regression.includeInteractions,
    regression.mode,
  ]);

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

  if (!outcome) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Select an outcome variable to view regression analysis
      </div>
    );
  }

  if (columns.numeric.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No numeric columns available for regression
      </div>
    );
  }

  // Expanded chart modal (Simple mode only)
  if (regression.expandedChart && regression.mode === 'simple') {
    const result = regressionResults.find(r => r.xColumn === regression.expandedChart);
    if (result) {
      return (
        <ExpandedScatterModal
          result={result}
          specs={specs}
          onClose={() => regression.setExpandedChart(null)}
        />
      );
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Mode toggle */}
      <div className="flex-none px-4 py-2 border-b border-slate-700 bg-slate-800/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => regression.setMode('simple')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              regression.mode === 'simple'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <BarChart3 size={14} />
            Simple
          </button>
          <button
            onClick={() => regression.setMode('advanced')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              regression.mode === 'advanced'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Layers size={14} />
            Advanced (GLM)
            <HelpTooltip term={getTerm('multipleRegression')} iconSize={12} />
          </button>
        </div>
      </div>

      {regression.mode === 'simple' ? (
        <SimpleRegressionView
          outcome={outcome}
          numericColumns={columns.numeric}
          selectedXColumns={regression.selectedXColumns}
          toggleXColumn={regression.toggleXColumn}
          regressionResults={regressionResults}
          sortedByStrength={sortedByStrength}
          specs={specs}
          onExpandChart={regression.setExpandedChart}
        />
      ) : (
        <AdvancedRegressionView
          outcome={outcome}
          columns={columns}
          advSelectedPredictors={regression.advSelectedPredictors}
          toggleAdvPredictor={regression.toggleAdvPredictor}
          categoricalColumns={regression.categoricalColumns}
          toggleCategorical={regression.toggleCategorical}
          includeInteractions={regression.includeInteractions}
          setIncludeInteractions={regression.setIncludeInteractions}
          multiRegressionResult={multiRegressionResult}
        />
      )}
    </div>
  );
};

export default RegressionPanel;
