import React, { useMemo, useRef, useEffect, ReactNode } from 'react';
import {
  calculateRegression,
  calculateMultipleRegression,
  suggestTermRemoval,
  type RegressionResult,
  type DataRow,
  type SpecLimits,
  type MultiRegressionResult,
  type TermRemovalSuggestion,
} from '@variscout/core';
import { useColumnClassification, useRegressionState, type ReductionStep } from '@variscout/hooks';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks/useGlossary';
import { BarChart3, Layers } from 'lucide-react';

/**
 * Color scheme for RegressionPanel
 */
export interface RegressionPanelColorScheme {
  /** Background for the main container */
  containerBg: string;
  /** Border color */
  border: string;
  /** Mode toggle bar background */
  modeToggleBg: string;
  /** Empty state text color */
  emptyStateText: string;
  /** Inactive button text */
  inactiveButtonText: string;
  /** Inactive button hover text */
  inactiveButtonHover: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: RegressionPanelColorScheme = {
  containerBg: 'bg-surface',
  border: 'border-edge',
  modeToggleBg: 'bg-surface-tertiary/30',
  emptyStateText: 'text-content-muted',
  inactiveButtonText: 'text-content-secondary',
  inactiveButtonHover: 'hover:text-content',
};

/**
 * Azure color scheme using Tailwind Slate palette
 */
export const azureColorScheme: RegressionPanelColorScheme = {
  containerBg: 'bg-slate-900',
  border: 'border-slate-700',
  modeToggleBg: 'bg-slate-800/30',
  emptyStateText: 'text-slate-500',
  inactiveButtonText: 'text-slate-400',
  inactiveButtonHover: 'hover:text-slate-300',
};

/**
 * Column classification result
 */
export interface ColumnClassification {
  numeric: string[];
  categorical: string[];
}

/**
 * Props for SimpleRegressionView render
 */
export interface SimpleRegressionViewProps {
  outcome: string;
  numericColumns: string[];
  selectedXColumns: string[];
  toggleXColumn: (col: string) => void;
  regressionResults: RegressionResult[];
  sortedByStrength: RegressionResult[];
  specs?: SpecLimits | null;
  onExpandChart: (col: string | null) => void;
}

/**
 * Props for AdvancedRegressionView render
 */
export interface AdvancedRegressionViewProps {
  outcome: string;
  columns: ColumnClassification;
  advSelectedPredictors: string[];
  toggleAdvPredictor: (col: string) => void;
  categoricalColumns: Set<string>;
  toggleCategorical: (col: string) => void;
  includeInteractions: boolean;
  setIncludeInteractions: (value: boolean) => void;
  multiRegressionResult: MultiRegressionResult | null;
  // Model reduction
  suggestion: TermRemovalSuggestion | null;
  reductionHistory: ReductionStep[];
  onRemoveTerm: (term: string) => void;
  onClearHistory: () => void;
  /** Callback to navigate to What-If with the current model */
  onNavigateToWhatIf?: (model: MultiRegressionResult) => void;
}

/**
 * Props for ExpandedScatterModal render
 */
export interface ExpandedScatterModalProps {
  result: RegressionResult;
  specs?: SpecLimits | null;
  onClose: () => void;
  /** Navigate to next scatter chart (right arrow key) */
  onNext?: () => void;
  /** Navigate to previous scatter chart (left arrow key) */
  onPrev?: () => void;
}

export interface RegressionPanelBaseProps {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Outcome (Y) variable name */
  outcome: string | null;
  /** Spec limits */
  specs: SpecLimits | null;
  /** Render function for Simple regression view */
  renderSimpleView: (props: SimpleRegressionViewProps) => ReactNode;
  /** Render function for Advanced regression view */
  renderAdvancedView: (props: AdvancedRegressionViewProps) => ReactNode;
  /** Render function for expanded scatter modal */
  renderExpandedModal?: (props: ExpandedScatterModalProps) => ReactNode;
  /** Color scheme for styling */
  colorScheme?: RegressionPanelColorScheme;
  /** External predictors to pre-populate in Advanced mode (from investigation bridge) */
  initialPredictors?: string[];
  /** Factors from investigation that the user hasn't added yet (for suggestion banner) */
  investigationFactors?: string[];
  /** Callback to navigate to What-If with the regression model */
  onNavigateToWhatIf?: (model: MultiRegressionResult) => void;
}

/**
 * RegressionPanelBase - Props-based regression panel
 *
 * Provides mode toggle (Simple/Advanced) and orchestrates regression views.
 * Uses render props for the actual chart views to allow app-specific implementations.
 *
 * @example
 * ```tsx
 * <RegressionPanelBase
 *   filteredData={data}
 *   outcome={outcome}
 *   specs={specs}
 *   renderSimpleView={(props) => <SimpleRegressionView {...props} />}
 *   renderAdvancedView={(props) => <AdvancedRegressionView {...props} />}
 *   colorScheme={azureColorScheme}
 * />
 * ```
 */
const RegressionPanelBase: React.FC<RegressionPanelBaseProps> = ({
  filteredData,
  outcome,
  specs,
  renderSimpleView,
  renderAdvancedView,
  renderExpandedModal,
  colorScheme = defaultColorScheme,
  initialPredictors,
  investigationFactors,
  onNavigateToWhatIf,
}) => {
  const { getTerm } = useGlossary();

  // Classify columns by type
  const columns = useColumnClassification(filteredData, {
    excludeColumn: outcome ?? undefined,
    maxCategoricalUnique: 10,
  });

  // Smart auto-selection: rank numeric columns by R² for simple mode
  const rankedColumns = useMemo(() => {
    if (!outcome || filteredData.length < 5 || columns.numeric.length <= 4) return undefined;
    const scored = columns.numeric.map(col => {
      const r = calculateRegression(filteredData, col, outcome);
      return { col, r2: r ? r.linear.rSquared : 0 };
    });
    scored.sort((a, b) => b.r2 - a.r2);
    return scored.map(s => s.col);
  }, [filteredData, outcome, columns.numeric]);

  // Regression state management
  const regression = useRegressionState({
    numericColumns: columns.numeric,
    maxSimpleColumns: 4,
    initialPredictors,
    rankedColumns,
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

  // Track pending reduction removal to update adjR2After on next render
  const pendingRemovalRef = useRef(false);

  useEffect(() => {
    if (pendingRemovalRef.current && multiRegressionResult) {
      regression.updateLastStepAdjR2After(multiRegressionResult.adjustedRSquared);
      pendingRemovalRef.current = false;
    }
  }, [multiRegressionResult, regression]);

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
      <div className={`flex items-center justify-center h-full ${colorScheme.emptyStateText}`}>
        Select an outcome variable to view regression analysis
      </div>
    );
  }

  if (columns.numeric.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${colorScheme.emptyStateText}`}>
        No numeric columns available for regression
      </div>
    );
  }

  // Expanded chart modal (Simple mode only)
  if (regression.expandedChart && regression.mode === 'simple' && renderExpandedModal) {
    const result = regressionResults.find(r => r.xColumn === regression.expandedChart);
    if (result) {
      const currentIdx = regression.selectedXColumns.indexOf(regression.expandedChart);
      const nextCol =
        currentIdx < regression.selectedXColumns.length - 1
          ? regression.selectedXColumns[currentIdx + 1]
          : undefined;
      const prevCol = currentIdx > 0 ? regression.selectedXColumns[currentIdx - 1] : undefined;
      return renderExpandedModal({
        result,
        specs,
        onClose: () => regression.setExpandedChart(null),
        onNext: nextCol ? () => regression.setExpandedChart(nextCol) : undefined,
        onPrev: prevCol ? () => regression.setExpandedChart(prevCol) : undefined,
      });
    }
  }

  return (
    <div
      data-testid="regression-panel"
      className={`flex flex-col h-full ${colorScheme.containerBg} overflow-hidden`}
    >
      {/* Mode toggle */}
      <div
        className={`flex-none px-4 py-2 border-b ${colorScheme.border} ${colorScheme.modeToggleBg}`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => regression.setMode('simple')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              regression.mode === 'simple'
                ? 'bg-blue-500/20 text-blue-400'
                : `${colorScheme.inactiveButtonText} ${colorScheme.inactiveButtonHover}`
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
                : `${colorScheme.inactiveButtonText} ${colorScheme.inactiveButtonHover}`
            }`}
          >
            <Layers size={14} />
            Advanced (GLM)
            <HelpTooltip term={getTerm('multipleRegression')} iconSize={12} />
          </button>
        </div>
        {/* Mode guidance text */}
        {regression.mode === 'simple' && (
          <p className={`text-xs ${colorScheme.emptyStateText} mt-1`}>
            Explore individual relationships — switch to Advanced to model factors together
          </p>
        )}
        {regression.mode === 'advanced' &&
          regression.advSelectedPredictors.length === 0 &&
          !investigationFactors?.length && (
            <p className={`text-xs ${colorScheme.emptyStateText} mt-1`}>
              Add factors from your investigation to build a model
            </p>
          )}
      </div>

      {/* Investigation factors suggestion banner */}
      {regression.mode === 'advanced' &&
        investigationFactors &&
        investigationFactors.length > 0 &&
        regression.advSelectedPredictors.length === 0 && (
          <div className="flex-none mx-4 mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-amber-400">
                You investigated <strong>{investigationFactors.join(', ')}</strong>. Add them as
                predictors?
              </span>
              <button
                onClick={() => {
                  for (const f of investigationFactors) {
                    if (!regression.advSelectedPredictors.includes(f)) {
                      regression.toggleAdvPredictor(f);
                    }
                  }
                }}
                className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition-colors"
              >
                Add all
              </button>
            </div>
          </div>
        )}

      {regression.mode === 'simple'
        ? renderSimpleView({
            outcome,
            numericColumns: columns.numeric,
            selectedXColumns: regression.selectedXColumns,
            toggleXColumn: regression.toggleXColumn,
            regressionResults,
            sortedByStrength,
            specs,
            onExpandChart: regression.setExpandedChart,
          })
        : renderAdvancedView({
            outcome,
            columns,
            advSelectedPredictors: regression.advSelectedPredictors,
            toggleAdvPredictor: regression.toggleAdvPredictor,
            categoricalColumns: regression.categoricalColumns,
            toggleCategorical: regression.toggleCategorical,
            includeInteractions: regression.includeInteractions,
            setIncludeInteractions: regression.setIncludeInteractions,
            multiRegressionResult,
            suggestion: multiRegressionResult ? suggestTermRemoval(multiRegressionResult) : null,
            reductionHistory: regression.reductionHistory,
            onRemoveTerm: (term: string) => {
              const adjR2Before = multiRegressionResult?.adjustedRSquared ?? 0;
              regression.addReductionStep({
                term,
                pValue: multiRegressionResult?.coefficients.find(c => c.term === term)?.pValue ?? 1,
                adjR2Before,
                adjR2After: adjR2Before, // Placeholder — updated via effect on next render
              });
              pendingRemovalRef.current = true;
              regression.toggleAdvPredictor(term);
            },
            onClearHistory: regression.clearReductionHistory,
            onNavigateToWhatIf,
          })}
    </div>
  );
};

export default RegressionPanelBase;
