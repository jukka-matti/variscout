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

import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Settings2, Eye } from 'lucide-react';
import { DataQualityBanner } from '../DataQualityBanner';
import { ColumnCard } from './ColumnCard';
import { DataPreviewTable } from './DataPreviewTable';
import SpecsSection from './SpecsSection';
import ParetoUpload from './ParetoUpload';
import TimeExtractionPanel from './TimeExtractionPanel';
import type {
  ColumnAnalysis,
  CharacteristicType,
  DataQualityReport,
  DataRow,
  TimeExtractionConfig,
} from '@variscout/core';

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
    specs?: { target?: number; lsl?: number; usl?: number; characteristicType?: CharacteristicType }
  ) => void;
  onCancel: () => void;
  onBack?: () => void;
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
}) => {
  const [outcome, setOutcome] = useState<string>(initialOutcome || '');
  const [factors, setFactors] = useState<string[]>(initialFactors || []);
  const [showAllOutcome, setShowAllOutcome] = useState(false);
  const [showAllFactors, setShowAllFactors] = useState(false);

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

  const isValid = !!outcome;

  return (
    <div className="flex flex-col h-full items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Settings2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Map Your Data</h2>
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

          {/* Outcome Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                Y
              </div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                Select Outcome (Measure)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Choose the numeric variable you want to improve (e.g., Weight, Diameter, Defect
              Count).
            </p>

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
                  ? `Show numeric only (${numericColumns.length})`
                  : `Show all columns (${columns.length})`}
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
                Select Factors (Categories)
              </h3>
              <span className="text-xs text-slate-500 ml-auto">
                {factors.length}/{maxFactors} selected
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Choose up to {maxFactors} categorical variables to group by (e.g., Machine, Shift,
              Operator).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {factorColumns.map(col => {
                const isOutcomeCol = outcome === col.name;
                return (
                  <ColumnCard
                    key={`factor-${col.name}`}
                    column={col}
                    role="factor"
                    selected={factors.includes(col.name)}
                    disabled={isOutcomeCol}
                    disabledReason="Already selected as outcome"
                    alias={columnAliases?.[col.name]}
                    onSelect={() => toggleFactor(col.name)}
                    onRename={onColumnRename}
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
                  ? `Show categorical/date only (${nonNumericColumns.length})`
                  : `Show all columns (${columns.length})`}
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
        <div className="p-6 border-t border-slate-700 bg-slate-800 flex justify-between items-center">
          <button
            onClick={onBack || onCancel}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
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
              onConfirm(outcome, factors, specs);
            }}
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <span>{mode === 'edit' ? 'Apply Changes' : 'Start Analysis'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;
