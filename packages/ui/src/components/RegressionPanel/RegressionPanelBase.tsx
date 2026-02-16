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
}

/**
 * Props for ExpandedScatterModal render
 */
export interface ExpandedScatterModalProps {
  result: RegressionResult;
  specs?: SpecLimits | null;
  onClose: () => void;
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
}) => {
  const { getTerm } = useGlossary();

  // Classify columns by type
  const columns = useColumnClassification(filteredData, {
    excludeColumn: outcome ?? undefined,
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
      return renderExpandedModal({
        result,
        specs,
        onClose: () => regression.setExpandedChart(null),
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
      </div>

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
          })}
    </div>
  );
};

export default RegressionPanelBase;
