/**
 * ColumnMapping - Data-rich column mapping UI for data setup
 *
 * Allows users to:
 * - Preview first rows of data in a collapsible table
 * - Select outcome (Y) column with type-filtered cards
 * - Select factor (X) columns with type-filtered cards
 * - Rename columns (writes to columnAliases)
 * - Optionally upload separate Pareto file
 * - Shows data quality validation results
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Settings2, Eye, Search } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import { useIsMobile, BREAKPOINTS } from '../../hooks';
import { DataQualityBanner } from '../DataQualityBanner';
import { ColumnCard } from './ColumnCard';
import { DataPreviewTable } from './DataPreviewTable';
import SpecsSection from './SpecsSection';
import ParetoUpload from './ParetoUpload';
import TimeExtractionPanel from './TimeExtractionPanel';
import { StackSection } from './StackSection';
import type {
  ColumnAnalysis,
  CharacteristicType,
  DataQualityReport,
  DataRow,
  TimeExtractionConfig,
  InvestigationCategory,
  TargetMetric,
  StackConfig,
  StackSuggestion,
} from '@variscout/core';
import {
  inferCategoryName,
  findMatchedCategoryKeyword,
  createInvestigationCategory,
  CATEGORY_COLORS,
} from '@variscout/core';

/** Analysis brief data for investigation context (optional) */
export interface AnalysisBrief {
  /** What is being investigated (max 500 chars) */
  problemStatement?: string;
  /** Upfront hypothesis entries */
  hypotheses?: Array<{ text: string; factor?: string; level?: string }>;
  /** Improvement target */
  target?: {
    metric: TargetMetric;
    direction: 'minimize' | 'maximize' | 'target';
    value: number;
  };
}

export interface ColumnMappingProps {
  /** Rich column metadata from detectColumns(). Preferred over availableColumns. */
  columnAnalysis?: ColumnAnalysis[];
  /** Fallback: plain column names (used when columnAnalysis is not available) */
  availableColumns?: string[];
  /** Optional preview rows for the collapsible data table */
  previewRows?: DataRow[];
  /** Total number of rows in the dataset (for summary display) */
  totalRows?: number;
  /** Existing column aliases (for displaying renamed columns) */
  columnAliases?: Record<string, string>;
  /** Callback when user renames a column */
  onColumnRename?: (originalName: string, alias: string) => void;
  initialOutcome: string | null;
  initialFactors: string[];
  datasetName?: string;
  onConfirm: (
    outcome: string,
    factors: string[],
    specs?: {
      target?: number;
      lsl?: number;
      usl?: number;
      characteristicType?: CharacteristicType;
    },
    categories?: InvestigationCategory[],
    brief?: AnalysisBrief
  ) => void;
  onCancel: () => void;
  onBack?: () => void;
  /** Pre-existing investigation categories (from project load / previous mapping) */
  initialCategories?: InvestigationCategory[];
  // Validation integration
  dataQualityReport?: DataQualityReport | null;
  onViewExcludedRows?: () => void;
  onViewAllData?: () => void;
  // Pareto integration (optional - PWA supports, Azure may not)
  paretoMode?: 'derived' | 'separate';
  separateParetoFilename?: string | null;
  onParetoFileUpload?: (file: File) => Promise<boolean>;
  onClearParetoFile?: () => void;
  // Time extraction (optional)
  timeColumn?: string | null;
  hasTimeComponent?: boolean;
  onTimeExtractionChange?: (config: TimeExtractionConfig) => void;
  /** Maximum number of factors that can be selected (default: 3) */
  maxFactors?: number;
  /** Mode: 'setup' for first-time mapping, 'edit' for mid-analysis re-edit */
  mode?: 'setup' | 'edit';
  /** Show analysis brief fields (problem statement, hypothesis, target). Default: false (PWA). */
  showBrief?: boolean;
  /** Initial problem statement (from persisted ProcessContext) */
  initialProblemStatement?: string;
  /** Stack suggestion from detectColumns() (shown when wide-form data detected) */
  suggestedStack?: StackSuggestion;
  /** Initial stack config (from persisted project state) */
  initialStackConfig?: StackConfig | null;
  /** Callback when stack config changes — parent uses this to re-run stackColumns() */
  onStackConfigChange?: (config: StackConfig | null) => void;
  /** Platform row limit for stack warning (default: 50000) */
  rowLimit?: number;
}

/**
 * Build ColumnAnalysis stubs from plain column names (backwards compat).
 */
function buildStubAnalysis(names: string[]): ColumnAnalysis[] {
  return names.map(name => ({
    name,
    type: 'text' as const,
    uniqueCount: 0,
    hasVariation: true,
    missingCount: 0,
    sampleValues: [],
  }));
}

export const ColumnMapping: React.FC<ColumnMappingProps> = ({
  columnAnalysis: columnAnalysisProp,
  availableColumns,
  previewRows,
  totalRows,
  columnAliases,
  onColumnRename,
  initialOutcome,
  initialFactors,
  datasetName = 'Uploaded Dataset',
  onConfirm,
  onCancel,
  onBack,
  dataQualityReport,
  onViewExcludedRows,
  onViewAllData,
  paretoMode = 'derived',
  separateParetoFilename,
  onParetoFileUpload,
  onClearParetoFile,
  timeColumn,
  hasTimeComponent,
  onTimeExtractionChange,
  maxFactors = 3,
  mode = 'setup',
  initialCategories: initialCategoriesProp,
  showBrief = false,
  initialProblemStatement,
  suggestedStack,
  initialStackConfig,
  onStackConfigChange,
  rowLimit = 50000,
}) => {
  const { t } = useTranslation();
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const [outcome, setOutcome] = useState<string>(initialOutcome || '');
  const [factors, setFactors] = useState<string[]>(initialFactors || []);
  const [showAllOutcome, setShowAllOutcome] = useState(false);
  const [showAllFactors, setShowAllFactors] = useState(false);
  const [dismissedRoles, setDismissedRoles] = useState<Set<string>>(new Set());

  // Stack config state (internal — syncs to parent via onStackConfigChange)
  const [stackConfig, setStackConfig] = useState<StackConfig | null>(() => {
    if (initialStackConfig) return initialStackConfig;
    if (
      suggestedStack &&
      (suggestedStack.confidence === 'high' || suggestedStack.confidence === 'medium')
    ) {
      return {
        columnsToStack: suggestedStack.columnsToStack,
        measureName: suggestedStack.measureName ?? '',
        labelName: suggestedStack.labelName ?? '',
      };
    }
    return null;
  });

  const handleStackConfigChange = useCallback(
    (config: StackConfig | null) => {
      setStackConfig(config);
      onStackConfigChange?.(config);
    },
    [onStackConfigChange]
  );

  // Stack validation: both names required when stack is enabled
  const isStackValid =
    !stackConfig ||
    (!!stackConfig.measureName.trim() &&
      !!stackConfig.labelName.trim() &&
      stackConfig.columnsToStack.length > 0);

  // Brief fields state
  const [problemStatement, setProblemStatement] = useState(initialProblemStatement || '');
  const [briefHypotheses, setBriefHypotheses] = useState<
    Array<{ text: string; factor: string; level: string }>
  >([]);
  const [briefExpanded, setBriefExpanded] = useState(!!initialProblemStatement);
  const [targetMetric, setTargetMetric] = useState<TargetMetric | ''>('');
  const [targetDirection, setTargetDirection] = useState<'minimize' | 'maximize' | 'target'>(
    'minimize'
  );
  const [targetValue, setTargetValue] = useState('');

  const initialCategories = useMemo(() => {
    if (initialCategoriesProp && initialCategoriesProp.length > 0) return initialCategoriesProp;
    return [];
  }, [initialCategoriesProp]);

  // Infer category names for selected factors
  const inferredCategories = useMemo(() => {
    const result: Record<string, { categoryName: string; keyword: string }> = {};
    for (const factor of factors) {
      if (dismissedRoles.has(factor)) continue;
      // Check initialCategories first (persisted from previous session)
      const existingCat = initialCategories.find(c => c.factorNames.includes(factor));
      if (existingCat) {
        result[factor] = {
          categoryName: existingCat.name,
          keyword: existingCat.inferredFrom || '',
        };
        continue;
      }
      const catName = inferCategoryName(factor);
      if (catName) {
        const keyword = findMatchedCategoryKeyword(factor) || '';
        result[factor] = { categoryName: catName, keyword };
      }
    }
    return result;
  }, [factors, dismissedRoles, initialCategories]);

  // Compute color map for unique category names
  const categoryColorMap = useMemo(() => {
    const uniqueNames = [...new Set(Object.values(inferredCategories).map(c => c.categoryName))];
    const colorMap: Record<string, string> = {};
    // Preserve colors from initialCategories first
    for (const cat of initialCategories) {
      if (cat.color) colorMap[cat.name] = cat.color;
    }
    // Assign colors to remaining unique names
    let colorIndex = initialCategories.length;
    for (const name of uniqueNames) {
      if (!colorMap[name]) {
        colorMap[name] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
        colorIndex++;
      }
    }
    return colorMap;
  }, [inferredCategories, initialCategories]);

  // Brief hypothesis helpers
  const addBriefHypothesis = useCallback(() => {
    setBriefHypotheses(prev => [...prev, { text: '', factor: '', level: '' }]);
  }, []);

  const updateBriefHypothesis = useCallback(
    (index: number, field: 'text' | 'factor' | 'level', value: string) => {
      setBriefHypotheses(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const removeBriefHypothesis = useCallback((index: number) => {
    setBriefHypotheses(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Optional specs state
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [specTarget, setSpecTarget] = useState('');
  const [specLsl, setSpecLsl] = useState('');
  const [specUsl, setSpecUsl] = useState('');
  const [specCharType, setSpecCharType] = useState<CharacteristicType | null>(null);

  // Resolve column analysis: prefer rich data, fall back to stubs from names
  const columns = useMemo(() => {
    if (columnAnalysisProp && columnAnalysisProp.length > 0) return columnAnalysisProp;
    if (availableColumns && availableColumns.length > 0) return buildStubAnalysis(availableColumns);
    return [];
  }, [columnAnalysisProp, availableColumns]);

  // Has rich metadata?
  const hasRichData = !!(columnAnalysisProp && columnAnalysisProp.length > 0);

  // Get unique levels for a factor column from columnAnalysis
  const getFactorLevels = useCallback(
    (factorName: string): string[] => {
      const col = columns.find(c => c.name === factorName);
      if (!col || col.type === 'numeric') return [];
      return col.sampleValues;
    },
    [columns]
  );

  // Type-separated columns
  const numericColumns = useMemo(() => columns.filter(c => c.type === 'numeric'), [columns]);
  const nonNumericColumns = useMemo(() => columns.filter(c => c.type !== 'numeric'), [columns]);

  // Columns shown in each section
  const outcomeColumns = hasRichData && !showAllOutcome ? numericColumns : columns;
  const factorColumns = hasRichData && !showAllFactors ? nonNumericColumns : columns;

  const toggleFactor = (col: string) => {
    if (col === outcome) return;
    if (factors.includes(col)) {
      setFactors(factors.filter(f => f !== col));
    } else {
      if (factors.length < maxFactors) {
        setFactors([...factors, col]);
      }
    }
  };

  const handleOutcomeChange = (col: string) => {
    setOutcome(col);
    if (factors.includes(col)) {
      setFactors(factors.filter(f => f !== col));
    }
  };

  const isValid = !!outcome && isStackValid;

  return (
    <div className="flex flex-col h-full items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Settings2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">{t('data.mapHeading')}</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Confirm which columns to analyze from <strong>{datasetName}</strong>. You can adjust
            this later in Settings.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/30">
          {/* Data Quality Banner (hidden in edit mode) */}
          {mode === 'setup' && dataQualityReport && (
            <DataQualityBanner
              report={dataQualityReport}
              filename={datasetName}
              onViewExcludedRows={onViewExcludedRows}
              onViewAllData={onViewAllData}
              showActions={
                !!(onViewExcludedRows || onViewAllData) && dataQualityReport.excludedRows.length > 0
              }
            />
          )}

          {/* Data Preview Table (hidden in edit mode) */}
          {mode === 'setup' && previewRows && previewRows.length > 0 && hasRichData && (
            <DataPreviewTable rows={previewRows} columnAnalysis={columns} totalRows={totalRows} />
          )}

          {/* Analysis Brief (optional, Azure only by default) */}
          {showBrief && mode === 'setup' && (
            <div data-testid="analysis-brief">
              <button
                onClick={() => setBriefExpanded(!briefExpanded)}
                className="flex items-center gap-2 w-full text-left mb-2"
                type="button"
                data-testid="brief-toggle"
              >
                <div className="p-1.5 bg-amber-600/20 text-amber-400 rounded-lg">
                  <Search size={16} />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {t('data.analysisSection')}
                </h3>
                <span className="text-[0.625rem] text-slate-500 ml-1">({t('data.optional')})</span>
                <span className="ml-auto text-slate-500 text-xs">{briefExpanded ? '−' : '+'}</span>
              </button>

              {briefExpanded && (
                <div className="space-y-3 pl-1" data-testid="brief-fields">
                  {/* Problem statement */}
                  <div>
                    <textarea
                      value={problemStatement}
                      onChange={e => setProblemStatement(e.target.value.slice(0, 500))}
                      placeholder={t('data.problemPlaceholder')}
                      className="w-full text-sm bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500/50"
                      rows={2}
                      maxLength={500}
                      data-testid="brief-problem-statement"
                    />
                    <span className="text-[0.625rem] text-slate-600 float-right">
                      {problemStatement.length}/500
                    </span>
                  </div>

                  {/* Hypotheses */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">
                        {t('investigation.hypotheses')}
                      </span>
                    </div>
                    {briefHypotheses.map((hyp, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1.5 mb-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
                        data-testid={`brief-hypothesis-${idx}`}
                      >
                        <input
                          type="text"
                          value={hyp.text}
                          onChange={e => updateBriefHypothesis(idx, 'text', e.target.value)}
                          placeholder="e.g., Night shift has higher variation"
                          className="w-full text-sm bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                        <div className="flex gap-2">
                          <select
                            value={hyp.factor}
                            onChange={e => updateBriefHypothesis(idx, 'factor', e.target.value)}
                            className="flex-1 text-xs bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500/50"
                          >
                            <option value="">Factor (optional)</option>
                            {columns
                              .filter(c => c.type !== 'numeric')
                              .map(c => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                          <select
                            value={hyp.level}
                            onChange={e => updateBriefHypothesis(idx, 'level', e.target.value)}
                            className="flex-1 text-xs bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500/50"
                            disabled={!hyp.factor}
                          >
                            <option value="">Level (optional)</option>
                            {hyp.factor &&
                              getFactorLevels(hyp.factor).map(lv => (
                                <option key={lv} value={lv}>
                                  {lv}
                                </option>
                              ))}
                          </select>
                          <button
                            onClick={() => removeBriefHypothesis(idx)}
                            className="text-slate-500 hover:text-red-400 text-xs px-1"
                            type="button"
                            aria-label="Remove hypothesis"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addBriefHypothesis}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      type="button"
                      data-testid="brief-add-hypothesis"
                    >
                      + {t('data.addHypothesis')}
                    </button>
                  </div>

                  {/* Target */}
                  <div>
                    <span className="text-xs text-slate-400 mb-1 block">
                      {t('data.improvementTarget')}
                    </span>
                    <div className="flex gap-2 items-center">
                      <select
                        value={targetMetric}
                        onChange={e => setTargetMetric(e.target.value as TargetMetric | '')}
                        className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white focus:outline-none focus:border-blue-500/50"
                        data-testid="brief-target-metric"
                      >
                        <option value="">{t('data.metric')}</option>
                        <option value="mean">Mean</option>
                        <option value="sigma">Sigma</option>
                        <option value="cpk">Cpk</option>
                        <option value="yield">Yield</option>
                        <option value="passRate">Pass Rate</option>
                      </select>
                      <select
                        value={targetDirection}
                        onChange={e =>
                          setTargetDirection(e.target.value as 'minimize' | 'maximize' | 'target')
                        }
                        className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white focus:outline-none focus:border-blue-500/50"
                        disabled={!targetMetric}
                      >
                        <option value="minimize">≤</option>
                        <option value="maximize">≥</option>
                        <option value="target">=</option>
                      </select>
                      <input
                        type="number"
                        value={targetValue}
                        onChange={e => setTargetValue(e.target.value)}
                        placeholder="Value"
                        className="w-20 text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        disabled={!targetMetric}
                        data-testid="brief-target-value"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Problem statement only (PWA mode — showBrief=false but problemStatement always available in setup) */}
          {!showBrief && mode === 'setup' && (
            <div data-testid="problem-statement-simple">
              <textarea
                value={problemStatement}
                onChange={e => setProblemStatement(e.target.value.slice(0, 500))}
                placeholder="What are you investigating? (optional)"
                className="w-full text-sm bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500/50"
                rows={1}
                maxLength={500}
                data-testid="brief-problem-statement"
              />
            </div>
          )}

          {/* Stack Columns (wide-form data) */}
          {suggestedStack && (
            <StackSection
              suggestedStack={suggestedStack}
              columnAnalysis={columns}
              totalRows={totalRows ?? 0}
              rowLimit={rowLimit}
              stackConfig={stackConfig}
              onStackConfigChange={handleStackConfigChange}
            />
          )}

          {/* Outcome Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                Y
              </div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                {t('data.selectOutcome')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('data.outcomeDesc')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {outcomeColumns.map(col => (
                <ColumnCard
                  key={`outcome-${col.name}`}
                  column={col}
                  role="outcome"
                  selected={outcome === col.name}
                  alias={columnAliases?.[col.name]}
                  onSelect={() => handleOutcomeChange(col.name)}
                  onRename={onColumnRename}
                />
              ))}
            </div>

            {/* Show all toggle for outcome */}
            {hasRichData && numericColumns.length < columns.length && (
              <button
                onClick={() => setShowAllOutcome(!showAllOutcome)}
                className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                type="button"
                data-testid="show-all-outcome"
              >
                <Eye size={12} />
                {showAllOutcome
                  ? `${t('data.showNumericOnly')} (${numericColumns.length})`
                  : `${t('data.showAllColumns')} (${columns.length})`}
              </button>
            )}
          </div>

          {/* Factors Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold">
                X
              </div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                {t('data.selectFactors')}
              </h3>
              <span className="text-xs text-slate-500 ml-auto">
                {factors.length}/{maxFactors} selected
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('data.factorsDesc')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {factorColumns.map(col => {
                const isOutcomeCol = outcome === col.name;
                const inferred = inferredCategories[col.name];
                return (
                  <ColumnCard
                    key={`factor-${col.name}`}
                    column={col}
                    role="factor"
                    selected={factors.includes(col.name)}
                    disabled={isOutcomeCol}
                    disabledReason={t('data.alreadyOutcome')}
                    alias={columnAliases?.[col.name]}
                    onSelect={() => toggleFactor(col.name)}
                    onRename={onColumnRename}
                    roleBadge={
                      inferred
                        ? {
                            categoryName: inferred.categoryName,
                            categoryColor: categoryColorMap[inferred.categoryName],
                            matchedKeyword: inferred.keyword,
                            onDismiss: () =>
                              setDismissedRoles(prev => new Set([...prev, col.name])),
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>

            {/* Show all toggle for factors */}
            {hasRichData && nonNumericColumns.length < columns.length && (
              <button
                onClick={() => setShowAllFactors(!showAllFactors)}
                className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                type="button"
                data-testid="show-all-factors"
              >
                <Eye size={12} />
                {showAllFactors
                  ? `${t('data.showCategoricalOnly')} (${nonNumericColumns.length})`
                  : `${t('data.showAllColumns')} (${columns.length})`}
              </button>
            )}
          </div>

          {/* Specification Limits (hidden in edit mode — specs have their own editor) */}
          {mode === 'setup' && (
            <SpecsSection
              expanded={specsExpanded}
              onToggle={() => setSpecsExpanded(!specsExpanded)}
              target={specTarget}
              lsl={specLsl}
              usl={specUsl}
              onTargetChange={setSpecTarget}
              onLslChange={setSpecLsl}
              onUslChange={setSpecUsl}
              characteristicType={specCharType}
              onCharacteristicTypeChange={setSpecCharType}
            />
          )}

          {/* Pareto Source (Optional) */}
          {onParetoFileUpload && (
            <ParetoUpload
              paretoMode={paretoMode}
              separateParetoFilename={separateParetoFilename || null}
              onParetoFileUpload={onParetoFileUpload}
              onClearParetoFile={onClearParetoFile}
            />
          )}

          {/* Time Extraction (Optional) */}
          {timeColumn && (
            <TimeExtractionPanel
              timeColumn={timeColumn}
              hasTimeComponent={hasTimeComponent}
              onTimeExtractionChange={onTimeExtractionChange}
            />
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t border-slate-700 bg-slate-800 flex justify-between items-center${isPhone ? ' sticky bottom-0 z-10 safe-area-bottom' : ''}`}
        >
          <button
            onClick={onBack || onCancel}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{t('data.back')}</span>
          </button>

          <button
            onClick={() => {
              const target = specTarget.trim() ? parseFloat(specTarget) : undefined;
              const lsl = specLsl.trim() ? parseFloat(specLsl) : undefined;
              const usl = specUsl.trim() ? parseFloat(specUsl) : undefined;
              const hasAnySpec =
                (target !== undefined && !isNaN(target)) ||
                (lsl !== undefined && !isNaN(lsl)) ||
                (usl !== undefined && !isNaN(usl));
              const specs = hasAnySpec
                ? {
                    ...(target !== undefined && !isNaN(target) ? { target } : {}),
                    ...(lsl !== undefined && !isNaN(lsl) ? { lsl } : {}),
                    ...(usl !== undefined && !isNaN(usl) ? { usl } : {}),
                    ...(specCharType ? { characteristicType: specCharType } : {}),
                  }
                : undefined;
              // Build InvestigationCategory[] from inferred categories
              // Group factors by category name
              const catGroups = new Map<string, string[]>();
              for (const [factorName, { categoryName }] of Object.entries(inferredCategories)) {
                const group = catGroups.get(categoryName) || [];
                group.push(factorName);
                catGroups.set(categoryName, group);
              }
              let categories: InvestigationCategory[] | undefined;
              if (catGroups.size > 0) {
                categories = [];
                let idx = 0;
                for (const [name, factorNames] of catGroups) {
                  // Reuse existing category if available (preserves ID and color)
                  const existing = initialCategories.find(c => c.name === name);
                  if (existing) {
                    categories.push({ ...existing, factorNames });
                  } else {
                    categories.push(createInvestigationCategory(name, factorNames, idx));
                  }
                  idx++;
                }
              }
              // Build analysis brief from state
              const brief: AnalysisBrief = {};
              if (problemStatement.trim()) {
                brief.problemStatement = problemStatement.trim();
              }
              const validHypotheses = briefHypotheses.filter(h => h.text.trim());
              if (validHypotheses.length > 0) {
                brief.hypotheses = validHypotheses.map(h => ({
                  text: h.text.trim(),
                  ...(h.factor ? { factor: h.factor } : {}),
                  ...(h.level ? { level: h.level } : {}),
                }));
              }
              const tv = parseFloat(targetValue);
              if (targetMetric && !isNaN(tv)) {
                brief.target = {
                  metric: targetMetric as TargetMetric,
                  direction: targetDirection,
                  value: tv,
                };
              }
              const hasBrief = brief.problemStatement || brief.hypotheses || brief.target;
              onConfirm(outcome, factors, specs, categories, hasBrief ? brief : undefined);
            }}
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <span>{mode === 'edit' ? t('data.applyChanges') : t('data.startAnalysis')}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;
