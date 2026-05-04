/**
 * ColumnMapping — Hub-level data mapper for Stage 3 of Mode B.
 *
 * Refactored in slice 2 to be the canonical Hub-level mapper:
 * - Multi-outcome selection via OutcomeCandidateRow (each row is independently toggled)
 * - Inline specs per selected outcome (within the row, no separate SpecsSection for setup)
 * - PrimaryScopeDimensionsSelector sub-step for scope dimension confirmation
 * - OutcomeNoMatchBanner when all candidates score below threshold
 * - onConfirm emits ColumnMappingConfirmPayload (Hub-shaped, no legacy 3-arg form)
 *
 * In mode='edit': pre-loads existing Hub outcomes + primaryScopeDimensions.
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
import { OutcomeCandidateRow } from '../OutcomeCandidateRow/OutcomeCandidateRow';
import type { OutcomeCandidate } from '../OutcomeCandidateRow/OutcomeCandidateRow';
import { PrimaryScopeDimensionsSelector } from '../PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector';
import { OutcomeNoMatchBanner } from '../OutcomeNoMatchBanner/OutcomeNoMatchBanner';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type {
  ColumnAnalysis,
  CharacteristicType as LegacyCharacteristicType,
  DataQualityReport,
  DataRow,
  TimeExtractionConfig,
  InvestigationCategory,
  TargetMetric,
  StackConfig,
  StackSuggestion,
  ParetoMode,
} from '@variscout/core';
import {
  inferCategoryName,
  findMatchedCategoryKeyword,
  createInvestigationCategory,
  CATEGORY_COLORS,
} from '@variscout/core';
import { suggestPrimaryDimensions } from '@variscout/core';

/** Analysis brief data for investigation context (optional) */
export interface AnalysisBrief {
  /** What is being investigated (max 500 chars) */
  issueStatement?: string;
  /** Upfront question entries */
  questions?: Array<{ text: string; factor?: string; level?: string }>;
  /** Improvement target */
  target?: {
    metric: TargetMetric;
    direction: 'minimize' | 'maximize' | 'target';
    value: number;
  };
}

/**
 * New onConfirm contract — Hub-shaped payload.
 * All three call sites use this shape; the legacy (outcome, factors, specs) signature is gone.
 */
export interface ColumnMappingConfirmPayload {
  /** Multi-outcome selection (was: single `outcome` string). */
  outcomes: OutcomeSpec[];
  /** Columns the analyst will slice analysis by most often (was: `factors` in setup mode). */
  primaryScopeDimensions: string[];
  /** Stack config from wide-form detection (unchanged from slice-1). */
  stack?: StackConfig | null;
  /** Time extraction config (unchanged from slice-1). */
  timeExtraction?: TimeExtractionConfig;
  /** Pareto mode (unchanged from slice-1). */
  paretoMode?: ParetoMode;
  /** Separate Pareto filename when paretoMode='separate' (unchanged from slice-1). */
  separateParetoFilename?: string | null;
  /**
   * Investigation categories inferred from the selected factors.
   * Carried forward for downstream investigation store compatibility.
   * @deprecated Investigation categories are inferred separately; this is
   * included for backward compatibility with existing factor-based inference.
   */
  categories?: InvestigationCategory[];
  /** Analysis brief from Azure full-brief fields. */
  brief?: AnalysisBrief;
  /**
   * Legacy single factor columns (for downstream investigation flow compat).
   * Set to the union of all selected outcome columnNames where they behave
   * as inputs — OR to the explicitly selected factor columns in edit mode.
   * Remove this field in a future slice when importFlow is fully migrated.
   */
  factors: string[];
  /**
   * Legacy single outcome column name.
   * Set to the first selected outcome's columnName for importFlow compat.
   * Remove in a future slice when importFlow is fully migrated.
   */
  outcome: string;
  /**
   * Legacy specs — first outcome's specs for importFlow compat.
   * Remove in a future slice when importFlow is fully migrated.
   */
  specs?: {
    target?: number;
    lsl?: number;
    usl?: number;
    characteristicType?: LegacyCharacteristicType;
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
  /**
   * Legacy initial outcome column name.
   * Used to seed the initial selected outcome when no initialOutcomes provided.
   */
  initialOutcome: string | null;
  /**
   * Legacy initial factor columns.
   * Used to seed initial scope dimensions when no initialPrimaryScopeDimensions provided.
   */
  initialFactors: string[];
  /** Initial outcomes (Hub-level, for mode='edit' round-trip). */
  initialOutcomes?: OutcomeSpec[];
  /** Initial primary scope dimensions (Hub-level, for mode='edit' round-trip). */
  initialPrimaryScopeDimensions?: string[];
  datasetName?: string;
  /** New Hub-shaped onConfirm contract. */
  onConfirm: (payload: ColumnMappingConfirmPayload) => void;
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
  /** Show analysis brief fields (issue statement, question, target). Default: false (PWA). */
  showBrief?: boolean;
  /** Initial issue statement (from persisted ProcessContext) */
  initialIssueStatement?: string;
  /** Stack suggestion from detectColumns() (shown when wide-form data detected) */
  suggestedStack?: StackSuggestion;
  /** Initial stack config (from persisted project state) */
  initialStackConfig?: StackConfig | null;
  /** Callback when stack config changes — parent uses this to re-run stackColumns() */
  onStackConfigChange?: (config: StackConfig | null) => void;
  /** Platform row limit for stack warning (default: 50000) */
  rowLimit?: number;
  /** Hide specification limits section (e.g., defect mode where Cpk is not applicable) */
  hideSpecs?: boolean;
  /**
   * Goal narrative from Stage 1, used for outcome detection biasing.
   * Keywords extracted deterministically (D4) to bias candidate ranking.
   */
  goalContext?: string;
  /** Score threshold below which OutcomeNoMatchBanner is shown (default: 0.1) */
  noMatchThreshold?: number;
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

/** Threshold for outcome candidate match score below which the banner surfaces. */
const DEFAULT_NO_MATCH_THRESHOLD = 0.1;

/**
 * Build OutcomeCandidate list from ColumnAnalysis, biased by goal context keywords.
 * Uses deterministic scoring (D4): keyword overlap in column name is additive on top
 * of existing type-based ranking. No σ-based suggestions (spec §3.3).
 */
function buildOutcomeCandidates(
  columns: ColumnAnalysis[],
  goalContext?: string
): OutcomeCandidate[] {
  // Extract goal keywords deterministically (D4)
  const goalKeywords = goalContext
    ? goalContext
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2)
    : [];

  return columns.map(col => {
    // Base score: numeric columns score higher as outcome candidates
    let score = col.type === 'numeric' ? 0.5 : 0.05;

    // Bonus for column names matching typical outcome heuristics
    const lower = col.name.toLowerCase();
    const outcomeKeywords = [
      'weight',
      'height',
      'length',
      'width',
      'temp',
      'temperature',
      'pressure',
      'yield',
      'rate',
      'count',
      'defect',
      'time',
      'duration',
      'measure',
      'value',
      'output',
      'result',
    ];
    if (outcomeKeywords.some(k => lower.includes(k))) {
      score += 0.2;
    }

    // Goal context bias (D4): keyword match is additive
    let goalKeywordMatch: string | undefined;
    for (const kw of goalKeywords) {
      const nameParts = lower.split(/[_\s-]+/);
      if (nameParts.some(part => part === kw || part.startsWith(kw) || kw.startsWith(part))) {
        score += 0.3;
        goalKeywordMatch = kw;
        break;
      }
    }

    // Parse numeric values from sampleValues
    const values: number[] = col.sampleValues
      .map(v => parseFloat(String(v)))
      .filter(v => Number.isFinite(v));

    // Determine characteristic type: default to nominalIsBest
    const characteristicType: OutcomeSpec['characteristicType'] = 'nominalIsBest';

    return {
      columnName: col.name,
      type: col.type === 'numeric' ? ('continuous' as const) : ('discrete' as const),
      characteristicType,
      values,
      matchScore: Math.min(1, score),
      goalKeywordMatch,
      qualityReport: {
        validCount: (col.uniqueCount || 0) + values.length, // approximate
        invalidCount: 0,
        missingCount: col.missingCount,
      },
    };
  });
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
  initialOutcomes,
  initialPrimaryScopeDimensions,
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
  initialIssueStatement,
  suggestedStack,
  initialStackConfig,
  onStackConfigChange,
  rowLimit = 50000,
  hideSpecs = false,
  goalContext,
  noMatchThreshold = DEFAULT_NO_MATCH_THRESHOLD,
}) => {
  const { t } = useTranslation();
  const isPhone = useIsMobile(BREAKPOINTS.phone);

  // ── Stack config ─────────────────────────────────────────────────────────
  const [stackConfig, setStackConfig] = useState<StackConfig | null>(() => {
    return initialStackConfig ?? null;
  });

  const handleStackConfigChange = useCallback(
    (config: StackConfig | null) => {
      setStackConfig(config);
      onStackConfigChange?.(config);
    },
    [onStackConfigChange]
  );

  const isStackValid =
    !stackConfig ||
    (!!stackConfig.measureName.trim() &&
      !!stackConfig.labelName.trim() &&
      stackConfig.columnsToStack.length > 0);

  // ── Resolve column analysis ───────────────────────────────────────────────
  const columns = useMemo(() => {
    if (columnAnalysisProp && columnAnalysisProp.length > 0) return columnAnalysisProp;
    if (availableColumns && availableColumns.length > 0) return buildStubAnalysis(availableColumns);
    return [];
  }, [columnAnalysisProp, availableColumns]);

  const hasRichData = !!(columnAnalysisProp && columnAnalysisProp.length > 0);
  const numericColumns = useMemo(() => columns.filter(c => c.type === 'numeric'), [columns]);
  const nonNumericColumns = useMemo(() => columns.filter(c => c.type !== 'numeric'), [columns]);

  // ── Outcome candidates (Hub-level multi-select) ───────────────────────────
  const outcomeCandidates = useMemo(
    () => buildOutcomeCandidates(columns, goalContext),
    [columns, goalContext]
  );

  /**
   * Map of columnName → selected OutcomeSpec (partial — user fills in specs inline).
   * Seeded from initialOutcomes (edit mode) or initialOutcome (legacy setup mode).
   */
  const [selectedOutcomeSpecs, setSelectedOutcomeSpecs] = useState<
    Record<string, Partial<OutcomeSpec>>
  >(() => {
    if (initialOutcomes && initialOutcomes.length > 0) {
      return Object.fromEntries(initialOutcomes.map(o => [o.columnName, o]));
    }
    if (initialOutcome) {
      const candidate = outcomeCandidates.find(c => c.columnName === initialOutcome);
      return {
        [initialOutcome]: {
          columnName: initialOutcome,
          characteristicType: candidate?.characteristicType ?? 'nominalIsBest',
        },
      };
    }
    return {};
  });

  const selectedOutcomeNames = useMemo(
    () => new Set(Object.keys(selectedOutcomeSpecs)),
    [selectedOutcomeSpecs]
  );

  const handleToggleOutcome = useCallback((columnName: string, candidate: OutcomeCandidate) => {
    setSelectedOutcomeSpecs(prev => {
      if (columnName in prev) {
        // Deselect
        const { [columnName]: _removed, ...rest } = prev;
        return rest;
      }
      // Select — seed with characteristicType from candidate
      return {
        ...prev,
        [columnName]: {
          columnName,
          characteristicType: candidate.characteristicType,
        },
      };
    });
  }, []);

  const handleSpecsChange = useCallback((columnName: string, specs: Partial<OutcomeSpec>) => {
    setSelectedOutcomeSpecs(prev => ({
      ...prev,
      [columnName]: { ...prev[columnName], ...specs, columnName },
    }));
  }, []);

  // Determine if no-match banner should surface
  const allCandidatesBelowThreshold = useMemo(
    () =>
      outcomeCandidates.length > 0 && outcomeCandidates.every(c => c.matchScore < noMatchThreshold),
    [outcomeCandidates, noMatchThreshold]
  );

  // ── Primary scope dimensions ───────────────────────────────────────────────
  const dimensionCandidates = useMemo(
    () =>
      nonNumericColumns.map(c => ({
        name: c.name,
        uniqueCount: c.uniqueCount || c.sampleValues.length,
      })),
    [nonNumericColumns]
  );

  const suggestedDimensions = useMemo(
    () => suggestPrimaryDimensions(dimensionCandidates),
    [dimensionCandidates]
  );

  const [primaryScopeDimensions, setPrimaryScopeDimensions] = useState<string[]>(() => {
    if (initialPrimaryScopeDimensions && initialPrimaryScopeDimensions.length > 0) {
      return initialPrimaryScopeDimensions;
    }
    // In legacy setup mode, seed from initialFactors
    if (initialFactors && initialFactors.length > 0) {
      return initialFactors;
    }
    // Auto-suggest on first render (setup mode)
    return [];
  });

  // ── Legacy factor selection (kept for factors → categories inference) ─────
  const [factors, setFactors] = useState<string[]>(initialFactors || []);
  const [showAllOutcome, setShowAllOutcome] = useState(false);
  const [showAllFactors, setShowAllFactors] = useState(false);
  const [dismissedRoles, setDismissedRoles] = useState<Set<string>>(new Set());

  const outcomeColumns = hasRichData && !showAllOutcome ? numericColumns : columns;
  const factorColumns = hasRichData && !showAllFactors ? nonNumericColumns : columns;

  // Derived legacy outcome string for factors section exclusion logic
  const legacyOutcome = useMemo(
    () => (selectedOutcomeNames.size > 0 ? [...selectedOutcomeNames][0] : (initialOutcome ?? '')),
    [selectedOutcomeNames, initialOutcome]
  );

  const toggleFactor = (col: string) => {
    if (selectedOutcomeNames.has(col)) return;
    if (factors.includes(col)) {
      setFactors(factors.filter(f => f !== col));
    } else {
      if (factors.length < maxFactors) {
        setFactors([...factors, col]);
      }
    }
  };

  // ── Category inference (kept for downstream investigation store compat) ───
  const initialCategories = useMemo(() => {
    if (initialCategoriesProp && initialCategoriesProp.length > 0) return initialCategoriesProp;
    return [];
  }, [initialCategoriesProp]);

  const inferredCategories = useMemo(() => {
    const result: Record<string, { categoryName: string; keyword: string }> = {};
    for (const factor of factors) {
      if (dismissedRoles.has(factor)) continue;
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

  const categoryColorMap = useMemo(() => {
    const uniqueNames = [...new Set(Object.values(inferredCategories).map(c => c.categoryName))];
    const colorMap: Record<string, string> = {};
    for (const cat of initialCategories) {
      if (cat.color) colorMap[cat.name] = cat.color;
    }
    let colorIndex = initialCategories.length;
    for (const name of uniqueNames) {
      if (!colorMap[name]) {
        colorMap[name] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
        colorIndex++;
      }
    }
    return colorMap;
  }, [inferredCategories, initialCategories]);

  // ── Analysis brief state ──────────────────────────────────────────────────
  const [issueStatement, setIssueStatement] = useState(initialIssueStatement || '');
  const [briefQuestions, setBriefQuestions] = useState<
    Array<{ text: string; factor: string; level: string }>
  >([]);
  const [briefExpanded, setBriefExpanded] = useState(!!initialIssueStatement);
  const [targetMetric, setTargetMetric] = useState<TargetMetric | ''>('');
  const [targetDirection, setTargetDirection] = useState<'minimize' | 'maximize' | 'target'>(
    'minimize'
  );
  const [targetValue, setTargetValue] = useState('');

  const addBriefQuestion = useCallback(() => {
    setBriefQuestions(prev => [...prev, { text: '', factor: '', level: '' }]);
  }, []);

  const updateBriefQuestion = useCallback(
    (index: number, field: 'text' | 'factor' | 'level', value: string) => {
      setBriefQuestions(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const removeBriefQuestion = useCallback((index: number) => {
    setBriefQuestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFactorLevels = useCallback(
    (factorName: string): string[] => {
      const col = columns.find(c => c.name === factorName);
      if (!col || col.type === 'numeric') return [];
      return col.sampleValues;
    },
    [columns]
  );

  // ── Standalone specs section (edit mode only, or when hideSpecs=false & no candidates) ──
  // In setup mode, specs are now inline per OutcomeCandidateRow.
  // In edit mode, the standalone SpecsSection remains for single-outcome compat.
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [specTarget, setSpecTarget] = useState('');
  const [specLsl, setSpecLsl] = useState('');
  const [specUsl, setSpecUsl] = useState('');
  const [specCharType, setSpecCharType] = useState<LegacyCharacteristicType | null>(null);

  // ── Validation ────────────────────────────────────────────────────────────
  const hasAtLeastOneOutcome = selectedOutcomeNames.size > 0;
  const isValid = hasAtLeastOneOutcome && isStackValid;

  // ── Confirm handler ───────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    // Build OutcomeSpec[] from selected specs
    const outcomes: OutcomeSpec[] = Object.entries(selectedOutcomeSpecs).map(
      ([columnName, partial]) => ({
        columnName,
        characteristicType: partial.characteristicType ?? 'nominalIsBest',
        ...(partial.target !== undefined ? { target: partial.target } : {}),
        ...(partial.lsl !== undefined ? { lsl: partial.lsl } : {}),
        ...(partial.usl !== undefined ? { usl: partial.usl } : {}),
        ...(partial.cpkTarget !== undefined ? { cpkTarget: partial.cpkTarget } : {}),
      })
    );

    // Build legacy categories from inferred
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
        const existing = initialCategories.find(c => c.name === name);
        if (existing) {
          categories.push({ ...existing, factorNames });
        } else {
          categories.push(createInvestigationCategory(name, factorNames, idx));
        }
        idx++;
      }
    }

    // Build analysis brief
    const brief: AnalysisBrief = {};
    if (issueStatement.trim()) brief.issueStatement = issueStatement.trim();
    const validQuestions = briefQuestions.filter(h => h.text.trim());
    if (validQuestions.length > 0) {
      brief.questions = validQuestions.map(h => ({
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
    const hasBrief = brief.issueStatement || brief.questions || brief.target;

    // Build legacy specs for the first selected outcome (importFlow compat)
    const firstOutcome = outcomes[0];
    // Build legacy specs for importFlow compat (first outcome's numeric values).
    // Note: characteristicType is omitted here because the OutcomeSpec type
    // ('nominalIsBest'|'smallerIsBetter'|'largerIsBetter') differs from the legacy
    // SpecLimits CharacteristicType ('nominal'|'smaller'|'larger'). Downstream
    // importFlow only uses target/lsl/usl; characteristicType from standalone
    // SpecsSection (edit mode) uses the legacy type and is kept.
    const legacySpecs =
      firstOutcome &&
      (firstOutcome.target !== undefined ||
        firstOutcome.lsl !== undefined ||
        firstOutcome.usl !== undefined)
        ? {
            ...(firstOutcome.target !== undefined ? { target: firstOutcome.target } : {}),
            ...(firstOutcome.lsl !== undefined ? { lsl: firstOutcome.lsl } : {}),
            ...(firstOutcome.usl !== undefined ? { usl: firstOutcome.usl } : {}),
            // characteristicType intentionally omitted: processHub and legacy types differ
          }
        : // Fall back to standalone specs section values (edit mode)
          (() => {
            const target = specTarget.trim() ? parseFloat(specTarget) : undefined;
            const lsl = specLsl.trim() ? parseFloat(specLsl) : undefined;
            const usl = specUsl.trim() ? parseFloat(specUsl) : undefined;
            const hasAnySpec =
              (target !== undefined && !isNaN(target)) ||
              (lsl !== undefined && !isNaN(lsl)) ||
              (usl !== undefined && !isNaN(usl));
            return hasAnySpec
              ? {
                  ...(target !== undefined && !isNaN(target) ? { target } : {}),
                  ...(lsl !== undefined && !isNaN(lsl) ? { lsl } : {}),
                  ...(usl !== undefined && !isNaN(usl) ? { usl } : {}),
                  ...(specCharType ? { characteristicType: specCharType } : {}),
                }
              : undefined;
          })();

    onConfirm({
      outcomes,
      primaryScopeDimensions,
      // Stack/time/pareto pass-through
      stack: stackConfig,
      // timeExtraction is managed by parent via onTimeExtractionChange; not stored here
      paretoMode: paretoMode as ColumnMappingConfirmPayload['paretoMode'],
      separateParetoFilename: separateParetoFilename ?? null,
      // Legacy compat fields
      categories: categories ?? undefined,
      brief: hasBrief ? brief : undefined,
      factors,
      outcome: firstOutcome?.columnName ?? legacyOutcome,
      specs: legacySpecs,
    });
  }, [
    selectedOutcomeSpecs,
    primaryScopeDimensions,
    inferredCategories,
    initialCategories,
    issueStatement,
    briefQuestions,
    targetMetric,
    targetDirection,
    targetValue,
    specTarget,
    specLsl,
    specUsl,
    specCharType,
    stackConfig,
    paretoMode,
    separateParetoFilename,
    factors,
    legacyOutcome,
    onConfirm,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Settings2 size={24} />
            </div>
            <h2 data-testid="map-your-data-heading" className="text-xl font-bold text-white">
              {t('data.mapHeading')}
            </h2>
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
                  {/* Issue statement */}
                  <div>
                    <textarea
                      value={issueStatement}
                      onChange={e => setIssueStatement(e.target.value.slice(0, 500))}
                      placeholder={t('data.issueStatementPlaceholder')}
                      className="w-full text-sm bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500/50"
                      rows={2}
                      maxLength={500}
                      data-testid="brief-issue-statement"
                    />
                    <span className="text-[0.625rem] text-slate-600 float-right">
                      {issueStatement.length}/500
                    </span>
                  </div>

                  {/* Questions */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{t('investigation.questions')}</span>
                    </div>
                    {briefQuestions.map((hyp, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1.5 mb-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
                        data-testid={`brief-question-${idx}`}
                      >
                        <input
                          type="text"
                          value={hyp.text}
                          onChange={e => updateBriefQuestion(idx, 'text', e.target.value)}
                          placeholder="e.g., Night shift has higher variation"
                          className="w-full text-sm bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                        <div className="flex gap-2">
                          <select
                            value={hyp.factor}
                            onChange={e => updateBriefQuestion(idx, 'factor', e.target.value)}
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
                            onChange={e => updateBriefQuestion(idx, 'level', e.target.value)}
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
                            onClick={() => removeBriefQuestion(idx)}
                            className="text-slate-500 hover:text-red-400 text-xs px-1"
                            type="button"
                            aria-label="Remove question"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addBriefQuestion}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      type="button"
                      data-testid="brief-add-question"
                    >
                      + {t('data.addQuestion')}
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

          {/* Issue statement (PWA mode — showBrief=false but issueStatement always available in setup) */}
          {!showBrief && mode === 'setup' && (
            <div data-testid="issue-statement-simple">
              <textarea
                value={issueStatement}
                onChange={e => setIssueStatement(e.target.value.slice(0, 500))}
                placeholder="What are you investigating? (optional)"
                className="w-full text-sm bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500/50"
                rows={1}
                maxLength={500}
                data-testid="brief-issue-statement"
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

          {/* ── Outcome candidates (Hub-level multi-select) ── */}
          <div data-testid="outcome-candidates-section">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                Y
              </div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                {t('data.selectOutcome')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('data.outcomeDesc')}</p>

            {/* OutcomeNoMatchBanner — surfaces when all candidates score below threshold */}
            {allCandidatesBelowThreshold && (
              <OutcomeNoMatchBanner
                onRename={() => {}}
                onExpectedChange={() => {}}
                onSkip={() => {}}
              />
            )}

            {/* OutcomeCandidateRow list — multi-select */}
            {outcomeCandidates.length > 0 ? (
              <div
                className="space-y-2 max-h-64 overflow-y-auto"
                data-testid="outcome-candidate-list"
              >
                {outcomeCandidates.map(candidate => (
                  <OutcomeCandidateRow
                    key={candidate.columnName}
                    candidate={candidate}
                    isSelected={selectedOutcomeNames.has(candidate.columnName)}
                    onToggleSelect={() => handleToggleOutcome(candidate.columnName, candidate)}
                    specs={selectedOutcomeSpecs[candidate.columnName] ?? {}}
                    onSpecsChange={specs => handleSpecsChange(candidate.columnName, specs)}
                  />
                ))}
              </div>
            ) : (
              /* Fallback: legacy ColumnCard-based outcome selection when no rich analysis */
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {outcomeColumns.map(col => (
                    <ColumnCard
                      key={`outcome-${col.name}`}
                      column={col}
                      role="outcome"
                      selected={legacyOutcome === col.name}
                      alias={columnAliases?.[col.name]}
                      onSelect={() => {
                        const candidate = outcomeCandidates.find(
                          c => c.columnName === col.name
                        ) ?? {
                          columnName: col.name,
                          type: 'continuous' as const,
                          characteristicType: 'nominalIsBest' as const,
                          values: [],
                          matchScore: 0.5,
                          qualityReport: { validCount: 0, invalidCount: 0, missingCount: 0 },
                        };
                        handleToggleOutcome(col.name, candidate);
                      }}
                      onRename={onColumnRename}
                    />
                  ))}
                </div>
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
            )}
          </div>

          {/* ── Primary scope dimensions (replaces factor-picker in setup) ── */}
          {mode === 'setup' && dimensionCandidates.length > 0 && (
            <PrimaryScopeDimensionsSelector
              columns={dimensionCandidates}
              suggested={suggestedDimensions}
              value={primaryScopeDimensions}
              onChange={setPrimaryScopeDimensions}
              onSkip={() => setPrimaryScopeDimensions([])}
            />
          )}

          {/* ── Legacy factor selection (edit mode — keeps investigation compat) ── */}
          {mode === 'edit' && (
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
                  const isOutcomeCol = selectedOutcomeNames.has(col.name);
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
          )}

          {/* Specification Limits (edit mode only — in setup mode specs are inline per row) */}
          {mode === 'edit' && !hideSpecs && (
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
            onClick={handleConfirm}
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
