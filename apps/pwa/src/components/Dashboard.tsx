import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FilterChipData } from '@variscout/ui';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import { useProbabilityPlotData } from '@variscout/hooks';
import MobileDashboard from './MobileDashboard';
import SpecEditor from './settings/SpecEditor';
import { EmbedFocusView, FocusedChartView } from './views';
import { EditableChartTitle } from '@variscout/ui';
import {
  ErrorBoundary,
  ProcessHealthBar,
  VerificationCard,
  SegmentedControl,
  CaptureCard,
  DashboardLayoutBase,
  DashboardChartCard,
  FactorStripBase,
  FocusedViewOverlay,
  CapabilityMetricToggle,
  SubgroupConfigPopover,
  DefectSummary,
  ModelDrawerBase,
  ConditionPillBase,
  ScopeBarBase,
  useIsMobile,
  BREAKPOINTS,
  type ChartId,
  type WorkspaceProjectScopeLabels,
} from '@variscout/ui';
import {
  useKeyboardNavigation,
  useAnnotations,
  useFilterHandlers,
  useDashboardInsights,
  useProcessProjection,
  useJourneyPhase,
  useCapabilityIChartData,
  useDefectTransform,
  useDefectSummary,
  useTranslation,
  buildBrushCaptureDraft,
  buildBrushDerivedColumn,
  buildChangepointDerivedColumn,
  buildCategoryPointCaptureDraft,
  buildEngineSignalCaptureDraft,
  buildProbabilityBandCaptureDraft,
  buildValueBandDerivedColumn,
  applyDerivedFactorToFilters,
  resolveDerivedFactorName,
  useFactorStripModel,
  useConditionLoop,
  matchActiveScopeId,
  type CaptureDraft,
} from '@variscout/hooks';
import {
  usePreferencesStore,
  useProjectStore,
  useViewStore,
  useAnalyzeStore,
  useAnalysisScopeStore,
} from '@variscout/stores';
import {
  useFilteredData,
  useAnalysisStats,
  useStagedAnalysis,
  useLensedSampleCount,
  useDataDateRange,
} from '@variscout/hooks';
import { useDashboardCharts } from '../hooks/useDashboardCharts';
import type { UseFilterNavigationReturn } from '../hooks/useFilterNavigation';
import { useStatsWorker } from '../workers/useStatsWorker';
import { Activity, Settings2 } from 'lucide-react';
import {
  getColumnNames,
  getEtaSquared,
  getNelsonRule2Sequences,
  getNelsonRule3Sequences,
  timeLensIndices,
  DEFAULT_PROCESS_HUB_ID,
  excludeYDerivedFactors,
  type SpecLimits,
  type Finding,
  type IChartDataPoint,
} from '@variscout/core';
import { resolveMode as resolveModeUtil } from '@variscout/core/strategy';
import { resolveCpkTarget } from '@variscout/core/capability';
import { subgroupAxisColumns } from '@variscout/core/frame';
import { useProjectionStore } from '../features/projection/projectionStore';

import type { HighlightIntensity } from '../hooks/useEmbedMessaging';
import type { FindingsCallbacks } from '@variscout/ui';

// IM-6 / ADR-089: the verify card is no longer a "pick one of the always-on
// charts" lens switcher. Pareto is a first-class always-on grid card, so it is
// not a verify-card lens tab. The verify card only hosts the two supplementary
// distribution diagnostics (Probability Plot ⇄ Distribution/Capability
// histogram), converged with the Azure app.
type AnalysisLensTab = 'probability' | 'distribution';

interface DashboardProps {
  onPointClick?: (index: number) => void;
  // Embed mode highlight props
  highlightedChart?: ChartId | null;
  highlightIntensity?: HighlightIntensity;
  onChartClick?: (chartId: ChartId) => void;
  // Embed focus: when set, render only this single chart (for iframe embeds)
  embedFocusChart?: 'ichart' | 'boxplot' | 'pareto' | 'stats' | null;
  // Embed stats tab: when set, auto-selects this tab in PI Panel
  embedStatsTab?: 'summary' | 'data' | 'whatif' | null;
  onManageFactors?: () => void;
  openSpecEditorRequested?: boolean;
  onSpecEditorOpened?: () => void;
  highlightedPointIndex?: number | null;
  filterNav?: UseFilterNavigationReturn;
  onPinFinding?: (noteText?: string) => void;
  findingsCallbacks?: FindingsCallbacks;
  /** All findings (for methodology coach phase detection) */
  findings?: Finding[];
  /** When true, omit stats panel from grid (rendered as sidebar instead) */
  hideStatsInGrid?: boolean;
  /** Export CSV callback (context-line Export menu) */
  onExportCSV?: () => void;
  /** Export .vrs callback (context-line Export menu — PWA-only). */
  onExportVrs?: () => void;
  /** Export image callback (for toolbar) */
  onExportImage?: () => void;
  /** External factor switch request (from question click) — sets boxplot + pareto factor */
  requestedFactor?: { factor: string; seq: number } | null;
  workspaceProjectScope?: {
    title: string;
    labels: WorkspaceProjectScopeLabels;
  } | null;
  /**
   * Project-id key the scope what-if write-through matches against. MUST mirror
   * the value AnalyzeView stores scopes under (`String(canvasViewportHubId)` in
   * App.tsx) — re-deriving it here drifts from that key (sessionHub is a
   * randomUUID in the normal paste flow). Absent → falls back to the sentinel.
   */
  scopeProjectId?: string;
  onOpenWall?: () => void;
}

const Dashboard = ({
  onPointClick,
  highlightedChart,
  highlightIntensity = 'pulse',
  onChartClick,
  embedFocusChart,
  embedStatsTab,
  onManageFactors,
  openSpecEditorRequested,
  onSpecEditorOpened,
  highlightedPointIndex: _highlightedPointIndex,
  filterNav,
  onPinFinding,
  findingsCallbacks,
  findings: _allFindings,
  hideStatsInGrid: _hideStatsInGrid = false,
  onExportCSV,
  onExportVrs,
  onExportImage: _onExportImage,
  requestedFactor,
  scopeProjectId = DEFAULT_PROCESS_HUB_ID,
  onOpenWall,
}: DashboardProps) => {
  const { onAddChartObservation, chartFindings, onEditFinding, onDeleteFinding, onOpenFinding } =
    findingsCallbacks ?? {};
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const processContext = useProjectStore(s => s.processContext);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const rawData = useProjectStore(s => s.rawData);
  const setRawData = useProjectStore(s => s.setRawData);
  const specs = useProjectStore(s => s.specs);
  const setSpecs = useProjectStore(s => s.setSpecs);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const filters = useProjectStore(s => s.filters);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const stageColumn = useProjectStore(s => s.stageColumn);
  const setStageColumn = useProjectStore(s => s.setStageColumn);
  const stageOrderMode = useProjectStore(s => s.stageOrderMode);
  const setStageOrderMode = useProjectStore(s => s.setStageOrderMode);
  const chartTitles = useProjectStore(s => s.chartTitles);
  const setChartTitles = useProjectStore(s => s.setChartTitles);
  const paretoAggregation = useProjectStore(s => s.paretoAggregation);
  const setParetoAggregation = useProjectStore(s => s.setParetoAggregation);
  const timeColumn = useProjectStore(s => s.timeColumn);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const setDisplayOptions = useProjectStore(s => s.setDisplayOptions);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const setSubgroupConfig = useProjectStore(s => s.setSubgroupConfig);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const timeLens = usePreferencesStore(s => s.timeLens);
  const selectedPoints = useViewStore(s => s.selectedPoints);
  const setSelectedPoints = useViewStore(s => s.setSelectedPoints);
  const clearSelection = useViewStore(s => s.clearTransientSelections);
  const transientHighlight = useViewStore(s => s.transientHighlight);
  const setTransientHighlight = useViewStore(s => s.setTransientHighlight);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const { filteredData, filteredIndexMap } = useFilteredData();
  const lensedSampleCount = useLensedSampleCount();
  const dataDateRange = useDataDateRange();
  // Pass the worker so computeStats runs off the main thread; the I-Chart card's
  // skeleton gate covers the async round-trip (no blank window on tab return).
  const workerApi = useStatsWorker();
  const { stats, isComputing } = useAnalysisStats(workerApi);
  const { stagedStats } = useStagedAnalysis();
  const { t } = useTranslation();
  const [analysisLensTab, setAnalysisLensTab] = useState<AnalysisLensTab>('probability');
  const [captureDraft, setCaptureDraft] = useState<CaptureDraft | null>(null);
  // ER-3: Model drawer open state (Explore door).
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);

  // Defect mode: transform filtered data into aggregated defect rates
  const isDefectMode = resolveModeUtil(analysisMode) === 'defect';
  const defectResult = useDefectTransform(filteredData, defectMapping, analysisMode);

  // When in defect mode, override data + outcome + factors from the transform result
  const effectiveData = isDefectMode && defectResult ? defectResult.data : filteredData;
  const effectiveOutcome = isDefectMode && defectResult ? defectResult.outcomeColumn : outcome;
  const effectiveFactors = isDefectMode && defectResult ? defectResult.factors : factors;
  // Prefer the per-measure spec over the global spec for the column actually
  // shown. Spec-EDIT surfaces write measureSpecs[outcome] when an outcome is
  // set, so reading global specs alone leaves the histogram with no spec lines
  // and the verify tab never relabels Distribution -> Capability.
  const effectiveSpecs = effectiveOutcome ? (measureSpecs[effectiveOutcome] ?? specs) : specs;
  // Resolved specs keyed on the GLOBAL outcome (not effectiveOutcome). The
  // ProcessHealthBar Cpk chip + the Stats-panel/What-If surfaces read `stats`
  // from useAnalysisStats, which keys its spec resolution on `outcome` (the
  // global one); their other spec-scoped props here (cpkTarget, columnLabel)
  // also key on `outcome`. Match that source so the Cpk chip never hides while
  // stats.cpk is defined (the histogram, in contrast, follows effectiveOutcome).
  const outcomeSpecs = outcome ? (measureSpecs[outcome] ?? specs) : specs;
  const effectiveLensWindow = useMemo(
    () => timeLensIndices(effectiveData.length, timeLens),
    [effectiveData.length, timeLens]
  );
  const lensedEffectiveData = useMemo(
    () => effectiveData.slice(effectiveLensWindow.start, effectiveLensWindow.end),
    [effectiveData, effectiveLensWindow]
  );

  // ── ER-4 condition loop ─────────────────────────────────────────────────────
  // The brush pill / group pill / scope bar / apply / clear / take-to-Analyze
  // orchestration over the LENSED rows the grid plots. An applied condition lives in
  // analysisScopeStore.conditionLeaves ONLY — it does NOT write projectStore.filters.
  // So useFilteredData / useAnalysisStats stay full-series (the I-Chart plots the full
  // lensed series + lights the members); the condition (categorical AND range) is
  // evaluated at this seam via conditionRows, which feed the FILTER-tier charts.
  const conditionLoop = useConditionLoop({
    lensedRows: lensedEffectiveData,
    outcome: effectiveOutcome,
    scopeProjectId,
  });
  // The I-Chart membership channel = the applied condition's members, OR (when no
  // condition is applied) the transient highlight's members. Both are display-index
  // Sets, so the I-Chart's highlight tier renders the right rows lit.
  const ichartMemberIndices = useMemo(() => {
    if (conditionLoop.hasCondition) return conditionLoop.conditionMemberIndices;
    if (conditionLoop.transientMemberIndices.size > 0) return conditionLoop.transientMemberIndices;
    return undefined;
  }, [
    conditionLoop.hasCondition,
    conditionLoop.conditionMemberIndices,
    conditionLoop.transientMemberIndices,
  ]);
  // The brush pill summary (recomputed from the live brush selection). The brush is
  // mappable only when no stage column / not defect mode (same gate the legacy
  // brush-capture draft used).
  const brushPill = useMemo(() => {
    const canMapBrushToFilteredRows = !stageColumn && !isDefectMode;
    if (!canMapBrushToFilteredRows || selectedPoints.size === 0) return null;
    return conditionLoop.buildBrushPill(selectedPoints);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildBrushPill is stable per lensedRows/outcome
  }, [selectedPoints, stageColumn, isDefectMode, conditionLoop.buildBrushPill]);

  // ER-4: when a condition is applied, the FILTER-tier charts (boxplot / histogram
  // / probability) render over conditionRows — the FULL condition (categorical AND
  // range). No double-filter: projectStore.filters is empty under a condition, so the
  // lensed rows feeding conditionRows are unconditioned; conditionRows is the single
  // condition filter. Defect mode keeps its own override (its transform owns the data).
  const filterTierData = useMemo(() => {
    if (isDefectMode) return effectiveData;
    if (conditionLoop.hasCondition) return conditionLoop.conditionRows;
    return effectiveData;
  }, [isDefectMode, effectiveData, conditionLoop.hasCondition, conditionLoop.conditionRows]);
  // The boxplot/Pareto dataOverride: conditionRows under a condition (range filter),
  // the defect-transform rows in defect mode, else undefined (chart reads the store).
  const filterTierDataOverride =
    isDefectMode && defectResult
      ? effectiveData
      : conditionLoop.hasCondition
        ? conditionLoop.conditionRows
        : undefined;
  // Boxplot/Pareto group click → set the transient highlight + show the group pill
  // (no commit). Disabled in defect/stage where the brush mapping is unavailable.
  const handleGroupClick = useCallback(
    (column: string, level: string | number) => {
      setTransientHighlight({ column, value: level });
    },
    [setTransientHighlight]
  );

  // In defect mode + value aggregation, use cost/duration column for Pareto Σ mode
  const defectParetoOutcome = (() => {
    if (!isDefectMode || !defectResult || paretoAggregation !== 'value') return undefined;
    // Prefer cost column, fall back to duration, then to default outcome
    if (defectResult.costColumn) return defectResult.costColumn;
    if (defectResult.durationColumn) return defectResult.durationColumn;
    return undefined; // fall back to effectiveOutcome
  })();

  // Compute DefectSummary props from transformed data (extracted hook)
  const defectSummaryProps = useDefectSummary(isDefectMode ? defectResult : null, defectMapping);

  // Annotations (right-click context menu for highlights)
  const {
    hasAnnotations,
    clearAnnotations,
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    boxplotHighlights,
    paretoHighlights,
    setHighlight,
  } = useAnnotations({ displayOptions, setDisplayOptions });

  // Use the consolidated chart state hook
  const {
    // Factor selection
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    // Focus mode
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    // Panel toggles
    setShowParetoPanel,
    showParetoComparison,
    toggleParetoComparison,
    showSpecEditor,
    setShowSpecEditor,
    // Chart export
    copyFeedback,
    handleCopyChart,
    handleDownloadPng,
    handleDownloadSvg,
    // Embed mode helpers
    getHighlightClass,
    handleChartWrapperClick,
    // Computed data
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
    allFactors,
    // Filter navigation state
    filterStack,
    clearFilters,
    updateFilterValues,
    removeFilter,
    // Filter handler
    handleDrillDown,
  } = useDashboardCharts({
    externalFilterNav: filterNav,
    openSpecEditorRequested,
    onSpecEditorOpened,
    highlightedChart: highlightedChart as
      | 'ichart'
      | 'boxplot'
      | 'pareto'
      | 'stats'
      | null
      | undefined,
    highlightIntensity,
    onChartClick,
  });

  // Apply external factor switch (from question click)
  useEffect(() => {
    if (requestedFactor && effectiveFactors.includes(requestedFactor.factor)) {
      setBoxplotFactor(requestedFactor.factor);
      setParetoFactor(requestedFactor.factor);
    }
  }, [requestedFactor, effectiveFactors, setBoxplotFactor, setParetoFactor]);

  // Defect mode drill-down: auto-switch Boxplot/Pareto to next best factor
  // When user filters to a specific defect type, grouping by defect type is redundant.
  const prevDefectFilterRef = useRef(false);
  useEffect(() => {
    if (!isDefectMode || !defectMapping?.defectTypeColumn) {
      prevDefectFilterRef.current = false;
      return;
    }
    const defectCol = defectMapping.defectTypeColumn;
    const hasDefectFilter = defectCol in (filters ?? {});
    const wasFiltered = prevDefectFilterRef.current;
    prevDefectFilterRef.current = hasDefectFilter;

    // Only auto-switch on entering the drill (filter added), not on removal
    if (hasDefectFilter && !wasFiltered) {
      const nextFactor = effectiveFactors.find(f => f !== defectCol);
      if (nextFactor) {
        setBoxplotFactor(nextFactor);
        setParetoFactor(nextFactor);
      }
    }
  }, [isDefectMode, defectMapping, filters, effectiveFactors, setBoxplotFactor, setParetoFactor]);

  // Build filter chip data from filter stack for breadcrumb display
  const filterChipData: FilterChipData[] = useMemo(() => {
    if (!filterStack || filterStack.length === 0 || !rawData?.length) return [];
    return filterStack
      .filter((f): f is typeof f & { factor: string } => !!f.factor)
      .map(filter => {
        const allValues = [...new Set(rawData.map(row => row[filter.factor]))];
        return {
          factor: filter.factor,
          values: filter.values,
          availableValues: allValues.map(val => ({
            value: val as string | number,
            count: rawData.filter(row => row[filter.factor] === val).length,
            isSelected: filter.values.includes(val as string | number),
          })),
        };
      });
  }, [filterStack, rawData]);

  // Responsive mobile detection
  const isMobile = useIsMobile(BREAKPOINTS.phone);

  // Process projection intelligence (Phase 2-4)
  const journeyPhase = useJourneyPhase(!!rawData?.length, _allFindings ?? []);
  const projectionResult = useProcessProjection({
    rawData: rawData ?? [],
    filteredData: filteredData ?? [],
    outcome,
    specs,
    stats,
    filterStack,
    journeyPhase,
  });
  const { centeringOpportunity, specSuggestion, activeProjection } = projectionResult;

  // Sync projection data to store (consumed by sidebar)
  useEffect(() => {
    useProjectionStore.setState({
      activeProjection: projectionResult.activeProjection,
      drillProjection: projectionResult.drillProjection,
      benchmarkProjection: projectionResult.benchmarkProjection,
      cumulativeProjection: projectionResult.cumulativeProjection,
      centeringOpportunity: projectionResult.centeringOpportunity,
      specSuggestion: projectionResult.specSuggestion,
    });
  }, [
    projectionResult.activeProjection,
    projectionResult.drillProjection,
    projectionResult.benchmarkProjection,
    projectionResult.cumulativeProjection,
    projectionResult.centeringOpportunity,
    projectionResult.specSuggestion,
  ]);

  // Handler for saving specs from SpecEditor (per-column when outcome is set)
  const handleSaveSpecs = useCallback(
    (newSpecs: SpecLimits) => {
      if (outcome) {
        setMeasureSpec(outcome, newSpecs);
      } else {
        setSpecs(newSpecs);
      }
    },
    [outcome, setMeasureSpec, setSpecs]
  );

  // Keyboard navigation for Focus Mode
  useKeyboardNavigation({
    focusedItem: focusedChart,
    onNext: handleNextChart,
    onPrev: handlePrevChart,
    onEscape: () => setFocusedChart(null),
  });

  // ER-4 Esc cascade: transient highlight (+ its group pill) FIRST, then the brush
  // selection. The drawers/pills own their own Esc. ConditionPillBase also handles
  // its own Esc/outside-click, but this keyboard handler is the canonical cascade.
  const handleEscapeCascade = useCallback(() => {
    if (transientHighlight) {
      setTransientHighlight(null);
      return;
    }
    if (selectedPoints.size > 0) {
      clearSelection();
    }
  }, [transientHighlight, setTransientHighlight, selectedPoints, clearSelection]);
  useKeyboardNavigation({
    focusedItem: transientHighlight || selectedPoints.size > 0 ? 'condition-escape' : null,
    onEscape: handleEscapeCascade,
  });

  // Shared filter handler callbacks
  const { handleClearAllFilters, handleRemoveFilter, handleUpdateFilterValues } = useFilterHandlers(
    {
      clearFilters,
      removeFilter,
      updateFilterValues,
    }
  );

  // ── ER-4 condition-loop commit handlers ──
  // Apply a condition (from either pill): leaves → scope store ONLY (NOT
  // projectStore.filters); clears the live brush so the pill dismisses. With filters
  // untouched, useFilteredData / useAnalysisStats stay full-series for the I-Chart
  // (D6); the FILTER-tier charts feed via the conditionRows dataOverride below.
  const handleApplyCondition = useCallback(
    (leaves: Parameters<typeof conditionLoop.applyCondition>[0]) => {
      conditionLoop.applyCondition(leaves);
      clearSelection(); // dismiss the brush + its pill
    },
    [conditionLoop, clearSelection]
  );
  // The ONE coherent clear: projectStore.filters + filterStack + scope store +
  // transient highlight, together. Used by the scope-bar × AND the context-line
  // clear-all (so neither leaves a half-cleared condition behind).
  const handleCoherentClear = useCallback(() => {
    conditionLoop.clearCondition(() => handleClearAllFilters());
  }, [conditionLoop, handleClearAllFilters]);

  // ER-4: the auto-CaptureCard-on-brush effect is SUBSUMED by the brush pill — the
  // pill is the affordance now (it shows the y-band condition + honest n/x̄). The
  // CaptureCard only appears when the analyst clicks the pill's ✚ Capture, via
  // `openBrushCaptureDraft` below. (Previously this effect auto-drafted a
  // CaptureCard on every brush — that auto-draft is retired.)
  const openBrushCaptureDraft = useCallback(() => {
    const canMapBrushToFilteredRows = !stageColumn && !isDefectMode;
    if (!effectiveOutcome || selectedPoints.size === 0 || !canMapBrushToFilteredRows) return;
    setCaptureDraft(
      buildBrushCaptureDraft({
        rows: lensedEffectiveData,
        outcome: effectiveOutcome,
        selectedIndices: selectedPoints,
        activeFilters: filters,
        specs,
        existingColumnNames: getColumnNames(rawData),
      })
    );
  }, [
    effectiveOutcome,
    filters,
    lensedEffectiveData,
    rawData,
    selectedPoints,
    specs,
    stageColumn,
    isDefectMode,
  ]);

  const saveCaptureDraft = useCallback(
    (captureMode: 'capture' | 'factor-only') => {
      if (!captureDraft || !captureDraft.proposedFactorName || !effectiveOutcome) return;
      const factorName = resolveDerivedFactorName(
        captureDraft.proposedFactorName,
        getColumnNames(rawData)
      );
      if (!factorName) return;

      let updatedData = rawData;
      if (captureDraft.entryKind === 'brush') {
        const rawSelectedIndices = new Set<number>();
        selectedPoints.forEach(index => {
          const rawIndex = filteredIndexMap.get(effectiveLensWindow.start + index);
          if (rawIndex !== undefined) rawSelectedIndices.add(rawIndex);
        });
        if (rawSelectedIndices.size === 0) return;
        updatedData = buildBrushDerivedColumn(rawData, rawSelectedIndices, factorName);
      } else if (captureDraft.entryKind === 'probability-band') {
        if (captureDraft.source.chart !== 'probability') return;
        updatedData = buildValueBandDerivedColumn(
          rawData,
          effectiveOutcome,
          captureDraft.source.anchorY,
          captureDraft.source.anchorYMax ?? captureDraft.source.anchorY,
          factorName
        );
      } else if (captureDraft.entryKind === 'engine-signal') {
        if (captureDraft.source.chart !== 'ichart') return;
        const rawChangepointIndex =
          filteredIndexMap.get(effectiveLensWindow.start + captureDraft.source.anchorX) ??
          captureDraft.source.anchorX;
        updatedData = buildChangepointDerivedColumn(rawData, rawChangepointIndex, factorName);
      } else {
        return;
      }
      setRawData(updatedData);
      if (!factors.includes(factorName)) {
        useProjectStore.getState().setFactors([...factors, factorName]);
      }
      setBoxplotFactor(factorName);
      setParetoFactor(factorName);

      const activeFilters = applyDerivedFactorToFilters(captureDraft.activeFilters, factorName);
      // ER-4: the capture-afterglow toast retired (subsumed by the scope bar's
      // "Take it to Analyze →"); these handlers no longer track the finding result.
      if (captureMode === 'capture' && captureDraft.source.chart === 'ichart') {
        onAddChartObservation?.(
          'ichart',
          undefined,
          captureDraft.note,
          captureDraft.source.anchorX,
          captureDraft.source.anchorY,
          {
            brushedRange: captureDraft.source.brushedRange,
            captureMode,
            activeFilters,
            evidenceType: captureDraft.evidenceType,
          }
        );
      } else if (captureMode === 'capture' && captureDraft.source.chart === 'probability') {
        onAddChartObservation?.(
          'probability',
          undefined,
          captureDraft.note,
          captureDraft.source.anchorX,
          captureDraft.source.anchorY,
          {
            anchorYMax: captureDraft.source.anchorYMax,
            captureMode,
            activeFilters,
            evidenceType: captureDraft.evidenceType,
          }
        );
      }

      clearSelection();
      setCaptureDraft(null);
    },
    [
      captureDraft,
      clearSelection,
      effectiveOutcome,
      effectiveLensWindow.start,
      factors,
      filteredIndexMap,
      onAddChartObservation,
      rawData,
      selectedPoints,
      setBoxplotFactor,
      setParetoFactor,
      setRawData,
    ]
  );

  const saveCategoryCaptureDraft = useCallback(() => {
    if (!captureDraft || captureDraft.entryKind !== 'point') return;
    if (captureDraft.source.chart !== 'boxplot' && captureDraft.source.chart !== 'pareto') return;
    onAddChartObservation?.(
      captureDraft.source.chart,
      captureDraft.source.category,
      captureDraft.note,
      undefined,
      undefined,
      {
        captureMode: 'capture',
        activeFilters: captureDraft.activeFilters,
        evidenceType: captureDraft.evidenceType,
      }
    );
    setCaptureDraft(null);
  }, [captureDraft, onAddChartObservation]);

  const openCategoryCaptureDraft = useCallback(
    (chart: 'boxplot' | 'pareto', factor: string, categoryKey: string) => {
      if (!effectiveOutcome) return;
      setCaptureDraft(
        buildCategoryPointCaptureDraft({
          chart,
          factor,
          categoryKey,
          outcome: effectiveOutcome,
          rows: filteredData,
          activeFilters: filters,
        })
      );
    },
    [effectiveOutcome, filteredData, filters]
  );

  const openProbabilityCaptureDraft = useCallback(
    (point: { value: number; anchorX: number; anchorY: number; anchorYMax: number }) => {
      if (!effectiveOutcome) return;
      setCaptureDraft(
        buildProbabilityBandCaptureDraft({
          outcome: effectiveOutcome,
          minValue: point.anchorY,
          maxValue: point.anchorYMax,
          rows: filteredData,
          activeFilters: filters,
          anchorX: point.anchorX,
          specs,
          existingColumnNames: getColumnNames(rawData),
        })
      );
    },
    [effectiveOutcome, filteredData, filters, rawData, specs]
  );

  const openIChartPointCaptureDraft = useCallback(
    (index: number, _point: IChartDataPoint) => {
      if (!effectiveOutcome) return;
      const selected = new Set([index]);
      setSelectedPoints(selected);
      setCaptureDraft(
        buildBrushCaptureDraft({
          rows: lensedEffectiveData,
          outcome: effectiveOutcome,
          selectedIndices: selected,
          activeFilters: filters,
          specs,
          existingColumnNames: getColumnNames(rawData),
        })
      );
    },
    [effectiveOutcome, filters, lensedEffectiveData, rawData, setSelectedPoints, specs]
  );

  const openEngineSignalCaptureDraft = useCallback(() => {
    if (isDefectMode) return;
    if (!effectiveOutcome || !stats) return;
    const values = lensedEffectiveData
      .map(row => Number(row[effectiveOutcome]))
      .filter(value => Number.isFinite(value));
    const rule2Sequences = getNelsonRule2Sequences(values, stats.mean);
    const rule3Sequences = getNelsonRule3Sequences(values);
    const signal = rule2Sequences[0]
      ? {
          index: rule2Sequences[0].startIndex,
          label: 'Process shift detected',
        }
      : rule3Sequences[0]
        ? {
            index: rule3Sequences[0].startIndex,
            label: 'Trend detected',
          }
        : null;
    if (!signal) return;

    setCaptureDraft(
      buildEngineSignalCaptureDraft({
        rows: lensedEffectiveData,
        outcome: effectiveOutcome,
        signalLabel: signal.label,
        changepointIndex: signal.index,
        activeFilters: filters,
        specs,
        existingColumnNames: getColumnNames(rawData),
      })
    );
  }, [effectiveOutcome, filters, isDefectMode, lensedEffectiveData, rawData, specs, stats]);

  // Helper to update chart titles (must be before early returns — rules-of-hooks)
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...chartTitles, [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

  // Histogram data for standalone chart cards (grid mode). ER-4: under an applied
  // condition the FILTER-tier distribution charts (histogram / probability) re-check
  // the regime over conditionRows (filterTierData) — the probability plot's regime
  // check works mechanically once the rows filter (no new math).
  const histogramData = useMemo(() => {
    if (!effectiveOutcome || !filterTierData || filterTierData.length === 0) return [];
    return filterTierData
      .map((d: Record<string, unknown>) => Number(d[effectiveOutcome]))
      .filter((v: number) => !isNaN(v));
  }, [filterTierData, effectiveOutcome]);

  // Probability plot series — linked to boxplot factor for multi-series grouping.
  // ER-4: rows = filterTierData so the regime is recomputed within the condition.
  const probabilitySeries = useProbabilityPlotData({
    values: histogramData,
    factorColumn: boxplotFactor,
    rows: filterTierData,
  });

  const hasSpecs = effectiveSpecs.usl !== undefined || effectiveSpecs.lsl !== undefined;

  const subgroupEmptyState = useMemo(() => {
    const timeLabel = timeColumn ? columnAliases[timeColumn] || timeColumn : null;
    const guidance = timeLabel
      ? `Add subgroup columns in Factors, or extract time-based factors from ${timeLabel} to compare day, week, or shift patterns.`
      : 'Add subgroup columns in Factors to compare variation sources, or create a factor from a brushed selection in the I-Chart.';

    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <div>
            <h4 className="text-base font-semibold text-content">No subgroup data yet</h4>
            <p className="mt-2 text-sm text-content-secondary">{guidance}</p>
          </div>
          {onManageFactors && (
            <button
              type="button"
              onClick={onManageFactors}
              className="inline-flex items-center justify-center rounded-lg bg-surface-tertiary px-3 py-2 text-sm font-medium text-content transition-colors hover:bg-surface"
            >
              Factors
            </button>
          )}
        </div>
      </div>
    );
  }, [columnAliases, onManageFactors, timeColumn]);

  const analysisLensTabs = [
    {
      id: 'probability',
      label: t('verify.tab.probability'),
      content: (
        <ProbabilityPlot series={probabilitySeries} onPointCapture={openProbabilityCaptureDraft} />
      ),
    },
    {
      id: 'distribution',
      label: hasSpecs ? t('verify.tab.capability') : t('verify.tab.distribution'),
      content: (
        <CapabilityHistogram data={histogramData} specs={effectiveSpecs} mean={stats?.mean ?? 0} />
      ),
    },
  ] satisfies Array<{ id: AnalysisLensTab; label: string; content: React.ReactNode }>;

  const activeAnalysisLensTab = analysisLensTabs.some(tab => tab.id === analysisLensTab)
    ? analysisLensTab
    : (analysisLensTabs[0]?.id ?? 'probability');

  // Accessible live region text for screen readers
  const liveRegionText = useMemo(() => {
    const filterCount = Object.keys(filters || {}).length;
    const parts = [`Showing ${filteredData.length} of ${rawData.length} data points`];
    if (filterCount > 0) {
      parts.push(`${filterCount} filter${filterCount > 1 ? 's' : ''} active`);
    }
    return parts.join('. ');
  }, [filteredData.length, rawData.length, filters]);

  // Compute η² per factor for insight chips (replaces deleted useVariationTracking)
  const factorVariations = useMemo(() => {
    if (!effectiveOutcome || !effectiveData?.length || !effectiveFactors?.length)
      return new Map<string, number>();
    return new Map(
      effectiveFactors.map(f => [f, getEtaSquared(effectiveData, f, effectiveOutcome) * 100])
    );
  }, [effectiveData, effectiveFactors, effectiveOutcome]);

  // --- Chart Insight Chips + Capability mode (shared hook) ---
  const {
    ichartInsight,
    boxplotInsight,
    paretoInsight,
    statsInsight,
    handleCpkClick,
    isCapabilityMode,
  } = useDashboardInsights({
    stats,
    filteredData: effectiveData,
    outcome: effectiveOutcome,
    specs,
    cpkTarget,
    factorVariations,
    boxplotFactor,
    paretoFactor,
    displayOptions,
    setDisplayOptions,
    subgroupConfig,
  });

  // Capability I-Chart data for ProcessHealthBar stats
  const capabilityIChartData = useCapabilityIChartData({
    filteredData,
    outcome: outcome ?? '',
    specs,
    subgroupConfig,
    cpkTarget,
    enabled: isCapabilityMode,
  });

  const capabilityStats =
    isCapabilityMode && capabilityIChartData.subgroupResults.length > 0
      ? {
          subgroupsMeetingTarget: capabilityIChartData.subgroupsMeetingTarget ?? 0,
          totalSubgroups: capabilityIChartData.subgroupResults.length,
        }
      : undefined;

  // ── ER-2 Factor strip ──────────────────────────────────────────────────────
  // Ranks every candidate factor by cardinality-penalised share of variation over
  // the SAME rows + outcome the rendered Variation Sources boxplot uses
  // (effectiveData / effectiveOutcome), so the strip and the comparison agree.
  // bindings: the PWA Dashboard has no live ImprovementProject handle (binnings
  // live on the IP, not threaded here) → undefined; D11 still keys off the
  // `${outcome}_bin` name convention. The strip is hidden when the model is null.
  const stripModel = useFactorStripModel({
    rows: effectiveData,
    outcome: effectiveOutcome,
    allFactors,
    selectedFactors: effectiveFactors,
    specs: effectiveSpecs,
    bindings: undefined,
  });

  // Examined keys are stored `${outcome}::${factor}`; the component takes a
  // factor-name Set for the active outcome — project it here.
  const examinedFactors = useViewStore(s => s.examinedFactors);
  const markFactorExamined = useViewStore(s => s.markFactorExamined);
  const examinedFactorNames = useMemo(() => {
    const prefix = `${effectiveOutcome ?? ''}::`;
    const names = new Set<string>();
    examinedFactors.forEach(key => {
      if (key.startsWith(prefix)) names.add(key.slice(prefix.length));
    });
    return names;
  }, [examinedFactors, effectiveOutcome]);

  const isDrilling = Object.keys(filters ?? {}).length > 0;

  // ER-3: D11-excluded candidates for the model drawer — mirrors the exclusion
  // inside useFactorStripModel so the drawer and strip rank from the same pool.
  // PWA has no live bindings (undefined) → only name-convention exclusion applies.
  const candidateFactorsForDrawer = useMemo(
    () => (effectiveOutcome ? excludeYDerivedFactors(allFactors, effectiveOutcome, undefined) : []),
    [allFactors, effectiveOutcome]
  );

  // ER-3: Scope label for the model drawer header.
  const modelDrawerScopeLabel = useMemo(() => {
    if (!isDrilling) return t('modelDrawer.allData');
    return Object.entries(filters ?? {})
      .map(([col, vals]) => `${col}=${vals.join(',')}`)
      .join(' · ');
  }, [isDrilling, filters, t]);

  // Scope what-if write-through: when a chip is selected AND the live drill
  // matches an EXISTING ProblemStatementScope, refresh that scope's stored
  // what-if number. NEVER creates a scope (ER-4 owns creation). The drill source
  // is analysisScopeStore.categoricalFilters (the canonical scope-drill bridge),
  // keyed by `scopeProjectId` — threaded from App.tsx as String(canvasViewportHubId)
  // so it mirrors the key AnalyzeView stores scopes under (NOT re-derived here:
  // sessionHub.id is a randomUUID in the normal paste flow, which would miss).
  const maybeRefreshScopeWhatIf = useCallback(() => {
    const scopeId = matchActiveScopeId({
      categoricalFilters: useAnalysisScopeStore.getState().categoricalFilters,
      outcome: effectiveOutcome,
      scopeProjectId,
      scopes: useAnalyzeStore.getState().scopes,
    });
    if (scopeId) useAnalyzeStore.getState().recomputeScopeWhatIf(scopeId);
  }, [effectiveOutcome, scopeProjectId]);

  const factorStripNode =
    stripModel && effectiveOutcome ? (
      <FactorStripBase
        chips={stripModel.chips}
        residualPct={stripModel.residualPct}
        selectedFactor={boxplotFactor}
        examinedKeys={examinedFactorNames}
        isScoped={isDrilling}
        cpkTarget={
          resolveCpkTarget(effectiveOutcome, {
            measureSpecs,
            projectCpkTarget: cpkTarget,
          }).value
        }
        outcomeLabel={columnAliases[effectiveOutcome] ?? effectiveOutcome}
        onFactorSelect={f => {
          setBoxplotFactor(f);
          markFactorExamined(effectiveOutcome, f);
          maybeRefreshScopeWhatIf();
        }}
        onAnovaLinkClick={() => setModelDrawerOpen(true)}
      />
    ) : undefined;

  if (!effectiveOutcome) return null;

  // Embed Focus Mode - render only the specified chart (for iframe embeds)
  if (embedFocusChart) {
    return (
      <EmbedFocusView
        focusChart={embedFocusChart}
        outcome={effectiveOutcome}
        boxplotFactor={boxplotFactor}
        paretoFactor={paretoFactor}
        factors={effectiveFactors}
        stats={stats}
        specs={outcomeSpecs}
        filteredData={filteredData}
        filters={filters}
        showParetoComparison={showParetoComparison}
        onToggleParetoComparison={() => toggleParetoComparison()}
        paretoAggregation={paretoAggregation}
        onToggleParetoAggregation={() =>
          setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
        }
        chartTitles={chartTitles}
        onChartTitleChange={handleChartTitleChange}
        onBoxplotFactorChange={setBoxplotFactor}
        onParetoFactorChange={setParetoFactor}
        onDrillDown={handleDrillDown}
        onPointClick={onPointClick}
        onSpecClick={() => setShowSpecEditor(true)}
        onManageFactors={onManageFactors}
        embedStatsTab={embedStatsTab}
      />
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div id="dashboard-export-container" className="h-full">
        <MobileDashboard
          outcome={effectiveOutcome}
          factors={effectiveFactors}
          stats={stats}
          specs={outcomeSpecs}
          boxplotFactor={boxplotFactor}
          paretoFactor={paretoFactor}
          filteredData={filteredData}
          anovaResult={anovaResult}
          filters={filters}
          columnAliases={columnAliases}
          onSetBoxplotFactor={setBoxplotFactor}
          onSetParetoFactor={setParetoFactor}
          onPointClick={onPointClick}
          onDrillDown={handleDrillDown}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
          filterChipData={filterChipData}
          onUpdateFilterValues={handleUpdateFilterValues}
          onHideParetoPanel={() => setShowParetoPanel(false)}
          onUploadPareto={onManageFactors}
          paretoAggregation={paretoAggregation}
          onToggleParetoAggregation={() =>
            setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
          }
          defectResult={defectResult}
          defectMapping={defectMapping}
          isDefectMode={isDefectMode}
          onPinFinding={onPinFinding}
          onAddChartObservation={onAddChartObservation}
          findings={_allFindings}
          onEditFinding={onEditFinding}
          onDeleteFinding={onDeleteFinding}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div
      id="dashboard-export-container"
      className="flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-surface relative"
    >
      {/* Accessible live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveRegionText}
      </div>

      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-surface flex-shrink-0">
        {/* Process Health Bar — replaces FilterBreadcrumb + Toolbar */}
        <ProcessHealthBar
          stats={stats}
          specs={outcomeSpecs}
          cpkTarget={
            resolveCpkTarget(outcome ?? '', {
              measureSpecs,
              projectCpkTarget: cpkTarget,
            }).value
          }
          cpkTargetSource={
            resolveCpkTarget(outcome ?? '', {
              measureSpecs,
              projectCpkTarget: cpkTarget,
            }).source
          }
          onCpkTargetCommit={outcome ? n => setMeasureSpec(outcome, { cpkTarget: n }) : undefined}
          columnLabel={outcome ? (columnAliases[outcome] ?? outcome) : undefined}
          sampleCount={lensedSampleCount}
          dateRange={dataDateRange}
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          onUpdateFilterValues={handleUpdateFilterValues}
          onRemoveFilter={handleRemoveFilter}
          // ER-4: the context-line clear-all is the ONE coherent clear (it also
          // clears the scope store + transient highlight, not just the filters —
          // fixing the pre-existing one-sided clear).
          onClearAll={handleCoherentClear}
          onPinFinding={onPinFinding}
          subgroupSlot={
            displayOptions.standardIChartMetric === 'capability' ? (
              <SubgroupConfigPopover
                config={subgroupConfig}
                onConfigChange={setSubgroupConfig}
                availableColumns={(() => {
                  const fromMap = subgroupAxisColumns(processContext?.processMap);
                  return fromMap.length > 0 ? fromMap : factors;
                })()}
                columnAliases={columnAliases}
              />
            ) : undefined
          }
          availableStageColumns={availableStageColumns}
          stageColumn={stageColumn}
          setStageColumn={setStageColumn}
          stageOrderMode={stageOrderMode}
          onStageOrderModeChange={setStageOrderMode}
          measureLabel={outcome ? (columnAliases[outcome] ?? outcome) : undefined}
          onEditFraming={onManageFactors}
          onExportCSV={onExportCSV}
          onExportVrs={onExportVrs}
          onSetSpecs={() => setShowSpecEditor(true)}
          onCpkClick={!isCapabilityMode ? handleCpkClick : undefined}
          centeringOpportunity={centeringOpportunity}
          specSuggestion={specSuggestion}
          activeProjection={activeProjection}
          onAcceptSpecSuggestion={(lsl, usl) => {
            setSpecs({ ...specs, lsl, usl });
            setShowSpecEditor(true);
          }}
          isCapabilityMode={isCapabilityMode}
          capabilityStats={capabilityStats}
        />

        {/* ER-4: the brush pill — appears on a non-empty I-Chart brush with the
            y-band condition + honest n/x̄ in-vs-out. ✚ Capture opens the existing
            brush-capture draft (now scopeId-linked under a condition); view-as-
            condition applies the band. SUBSUMES the auto-CaptureCard-on-brush. */}
        {brushPill && !captureDraft && (
          <div className="mx-4 mb-2">
            <ConditionPillBase
              summary={brushPill.summary}
              nIn={brushPill.nIn}
              meanIn={brushPill.meanIn}
              meanOut={brushPill.meanOut}
              gestureLabel="brushed: "
              onCapture={openBrushCaptureDraft}
              onViewAsCondition={() => handleApplyCondition([brushPill.leaf])}
              onDismiss={clearSelection}
            />
          </div>
        )}
        {/* ER-4: the group pill — appears on a boxplot/Pareto group click (transient
            highlight). Same one pill pattern; view-as-condition applies the eq leaf. */}
        {conditionLoop.groupPill && !captureDraft && (
          <div className="mx-4 mb-2">
            <ConditionPillBase
              summary={conditionLoop.groupPill.summary}
              nIn={conditionLoop.groupPill.nIn}
              meanIn={conditionLoop.groupPill.meanIn}
              meanOut={conditionLoop.groupPill.meanOut}
              onCapture={() =>
                openCategoryCaptureDraft(
                  'boxplot',
                  transientHighlight!.column,
                  String(transientHighlight!.value)
                )
              }
              onViewAsCondition={() => handleApplyCondition([conditionLoop.groupPill!.leaf])}
              onDismiss={() => setTransientHighlight(null)}
            />
          </div>
        )}

        {captureDraft && (
          <CaptureCard
            draft={captureDraft}
            onDraftChange={patch =>
              setCaptureDraft(current => (current ? { ...current, ...patch } : current))
            }
            onCapture={() =>
              captureDraft.entryKind === 'point'
                ? saveCategoryCaptureDraft()
                : saveCaptureDraft('capture')
            }
            onFactorOnly={
              captureDraft.proposedFactorName !== undefined
                ? () => saveCaptureDraft('factor-only')
                : undefined
            }
            onCancel={() => {
              clearSelection();
              setCaptureDraft(null);
            }}
          />
        )}

        {/* ER-4 scope bar: the conditional "Viewing condition" row under the context
            line. × = the ONE coherent clear (filters + scope store + transient
            highlight); Take it to Analyze → mints the PSS (range-capable) then
            opens the Wall. ABSORBS the retired capture-afterglow toast. */}
        {conditionLoop.hasCondition && (
          <ScopeBarBase
            conditionLabel={conditionLoop.scopeBarLabel}
            nIn={conditionLoop.scopeBarNIn}
            nTotal={conditionLoop.scopeBarNTotal}
            onClear={handleCoherentClear}
            onTakeToAnalyze={() => conditionLoop.takeToAnalyze(onOpenWall)}
          />
        )}
      </div>

      {/* DEFERRED(lv1-pwa-mount): Mount <ScopeChrome> when PWA gains a Process tab
          with a process-steps source. Until then, partial mount (Y/factor/categorical,
          no step chip) ships dead UI and scope mutations have no visual consumer.
          See docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md
          §PWA-Mount-Deferral (decision 2026-05-29). */}

      {/* Dashboard View */}
      <DashboardLayoutBase
        outcome={effectiveOutcome}
        factors={effectiveFactors}
        factorStrip={factorStripNode}
        columnAliases={columnAliases}
        filters={filters}
        showFilterContext={displayOptions.showFilterContext !== false}
        showViolin={displayOptions.showViolin ?? false}
        boxplotSortBy={displayOptions.boxplotSortBy ?? 'name'}
        boxplotSortDirection={displayOptions.boxplotSortDirection ?? 'asc'}
        onDisplayOptionChange={(key, value) =>
          setDisplayOptions({ ...displayOptions, [key]: value })
        }
        availableOutcomes={availableOutcomes}
        setOutcome={setOutcome}
        stageColumn={stageColumn}
        stagedStats={stagedStats}
        controlStats={stats}
        ichartLoading={!stats || isComputing}
        chartTitles={chartTitles}
        onChartTitleChange={handleChartTitleChange}
        boxplotFactor={boxplotFactor}
        setBoxplotFactor={setBoxplotFactor}
        paretoFactor={paretoFactor}
        setParetoFactor={setParetoFactor}
        showParetoPanel={false}
        focusedChart={focusedChart}
        setFocusedChart={setFocusedChart}
        filterChipData={filterChipData}
        annotations={{
          contextMenu,
          handleContextMenu,
          closeContextMenu,
          boxplotHighlights,
          paretoHighlights,
          setHighlight,
          hasAnnotations,
          clearAnnotations,
        }}
        chartFindings={chartFindings}
        onAddChartObservation={onAddChartObservation}
        copyFeedback={copyFeedback}
        onCopyChart={handleCopyChart}
        onDownloadPng={handleDownloadPng}
        onDownloadSvg={handleDownloadSvg}
        ichartInsight={ichartInsight}
        boxplotInsight={boxplotInsight}
        paretoInsight={paretoInsight}
        statsInsight={statsInsight}
        onInsightAction={(factor, value) => {
          if (value) {
            handleDrillDown(factor, value);
          } else {
            // Switch factor view (e.g., boxplot drill suggestion)
            setBoxplotFactor(factor);
            setParetoFactor(factor);
          }
        }}
        onInsightCapture={!isDefectMode ? () => openEngineSignalCaptureDraft() : undefined}
        // Embed mode highlight/click
        ichartHighlightClass={getHighlightClass('ichart')}
        onIChartCardClick={() => handleChartWrapperClick('ichart')}
        boxplotHighlightClass={getHighlightClass('boxplot')}
        onBoxplotCardClick={() => handleChartWrapperClick('boxplot')}
        paretoHighlightClass={getHighlightClass('pareto')}
        onParetoCardClick={() => handleChartWrapperClick('pareto')}
        onPIPanelClick={() => handleChartWrapperClick('stats')}
        piPanelHighlightClass={getHighlightClass('stats')}
        ichartObservationCount={chartFindings?.ichart?.length}
        boxplotObservationCount={chartFindings?.boxplot?.length}
        paretoObservationCount={chartFindings?.pareto?.length}
        // PWA-specific: VARISCOUT branding in I-Chart title
        ichartTitleSlot={
          <div className="flex items-center gap-2">
            <Activity className="text-blue-400 self-start mt-1" />
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white leading-none">
                <EditableChartTitle
                  defaultTitle={`I-Chart: ${effectiveOutcome}`}
                  value={chartTitles.ichart || ''}
                  onChange={title => setChartTitles({ ...chartTitles, ichart: title })}
                />
              </h2>
              <span className="text-xs font-bold text-blue-400 opacity-80 tracking-widest mt-1">
                VARISCOUT
              </span>
            </div>
          </div>
        }
        ichartHeaderExtra={
          // CapabilityMetricToggle STAYS here (chart identity — ER-10 territory).
          // Factors(N) twin added here (interim home until ER-2; mirrors Azure twin).
          // The SubgroupConfigPopover relocated to the context-line `subgroupSlot`
          // (ER-1 Task 2).
          <div className="flex items-center gap-2">
            <CapabilityMetricToggle
              metric={displayOptions.standardIChartMetric ?? 'measurement'}
              onMetricChange={m =>
                setDisplayOptions({ ...displayOptions, standardIChartMetric: m })
              }
              disabled={specs.usl === undefined && specs.lsl === undefined}
            />
            {onManageFactors && (
              <button
                onClick={onManageFactors}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-content-secondary hover:text-content bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded-lg transition-colors"
                title="Manage analysis factors"
                aria-label="Manage factors"
                data-testid="btn-manage-factors"
              >
                <Settings2 size={14} />
                <span>Factors ({effectiveFactors.length})</span>
              </button>
            )}
          </div>
        }
        // Render slots
        renderIChartContent={
          <ErrorBoundary componentName="I-Chart">
            <IChart
              onPointClick={onPointClick}
              onPointCapture={openIChartPointCaptureDraft}
              onSpecClick={() => setShowSpecEditor(true)}
              showBranding={false}
              ichartFindings={chartFindings?.ichart}
              onBrushFindingClick={finding => onOpenFinding?.(finding.id)}
              onCreateObservation={
                onAddChartObservation
                  ? (ax: number, ay: number) =>
                      onAddChartObservation('ichart', undefined, undefined, ax, ay)
                  : undefined
              }
              onEditFinding={onEditFinding}
              onDeleteFinding={onDeleteFinding}
              dataOverride={isDefectMode && defectResult ? effectiveData : undefined}
              outcomeOverride={isDefectMode && defectResult ? effectiveOutcome : undefined}
              // ER-4 highlight tier: the I-Chart keeps the FULL lensed series + the
              // member Set (applied condition, or the transient highlight when none
              // is applied). Limits/stats stay full-series — statistical honesty.
              conditionMemberIndices={ichartMemberIndices}
            />
          </ErrorBoundary>
        }
        renderBoxplotContent={
          <ErrorBoundary componentName="Boxplot">
            {boxplotFactor ? (
              <Boxplot
                factor={boxplotFactor}
                // ER-4 (D6): the click sets a transient highlight + shows the pill
                // (commit is explicit, via the pill). The legacy click→drill retires.
                onGroupClick={handleGroupClick}
                transientHighlightLevel={
                  transientHighlight && transientHighlight.column === boxplotFactor
                    ? String(transientHighlight.value)
                    : undefined
                }
                showBranding={false}
                highlightedCategories={boxplotHighlights}
                onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                onCaptureCategory={(factor, key) =>
                  openCategoryCaptureDraft('boxplot', factor, key)
                }
                findings={chartFindings?.boxplot}
                onEditFinding={onEditFinding}
                onDeleteFinding={onDeleteFinding}
                isComputing={isComputing}
                dataOverride={filterTierDataOverride}
                outcomeOverride={isDefectMode && defectResult ? effectiveOutcome : undefined}
              />
            ) : (
              subgroupEmptyState
            )}
          </ErrorBoundary>
        }
        renderParetoContent={
          <ErrorBoundary componentName="Pareto Chart">
            {paretoFactor && (
              <ParetoChart
                factor={paretoFactor}
                // ER-4 (D6): neutral group click → transient highlight + the pill.
                onGroupClick={handleGroupClick}
                showComparison={showParetoComparison}
                onToggleComparison={() => toggleParetoComparison()}
                onHide={() => setShowParetoPanel(false)}
                onUploadPareto={onManageFactors}
                availableFactors={effectiveFactors}
                aggregation={paretoAggregation}
                onToggleAggregation={() =>
                  setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
                }
                showBranding={false}
                highlightedCategories={paretoHighlights}
                onContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                onCaptureCategory={(factor, key) => openCategoryCaptureDraft('pareto', factor, key)}
                findings={chartFindings?.pareto}
                onEditFinding={onEditFinding}
                onDeleteFinding={onDeleteFinding}
                isComputing={isComputing}
                dataOverride={filterTierDataOverride}
                outcomeOverride={
                  isDefectMode && defectResult
                    ? (defectParetoOutcome ?? effectiveOutcome)
                    : undefined
                }
                onFactorSwitch={isDefectMode ? setParetoFactor : undefined}
              />
            )}
          </ErrorBoundary>
        }
        /* Stats panel removed from grid — key stats now in ProcessHealthBar toolbar.
           Stats sidebar (Azure) or Stats toggle provides detailed view when needed. */
        verificationCardTitle={
          histogramData.length > 0 && stats && !(isDefectMode && defectSummaryProps) ? (
            <SegmentedControl
              options={analysisLensTabs.map(tab => ({ value: tab.id, label: tab.label }))}
              value={activeAnalysisLensTab}
              onChange={tabId => setAnalysisLensTab(tabId as AnalysisLensTab)}
              aria-label={t('verify.tabs.label')}
              testId="verify-tab"
            />
          ) : undefined
        }
        renderVerificationCard={
          isDefectMode && defectSummaryProps ? (
            <DefectSummary {...defectSummaryProps} />
          ) : histogramData.length > 0 && stats ? (
            <VerificationCard tabs={analysisLensTabs} activeTab={activeAnalysisLensTab} />
          ) : undefined
        }
        verificationCardFocusTarget={
          activeAnalysisLensTab === 'distribution' ? 'histogram' : 'probability-plot'
        }
        renderFocusedView={
          focusedChart === 'histogram' || focusedChart === 'probability-plot' ? (
            <FocusedViewOverlay onPrev={handlePrevChart} onNext={handleNextChart}>
              <DashboardChartCard
                id={`${focusedChart}-focused`}
                testId={`chart-${focusedChart}-focused`}
                chartName={focusedChart}
                onMaximize={() => setFocusedChart(null)}
                copyFeedback={copyFeedback}
                onCopyChart={handleCopyChart}
                onDownloadPng={handleDownloadPng}
                onDownloadSvg={handleDownloadSvg}
                title={
                  <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    {focusedChart === 'histogram' ? 'Histogram' : 'Probability Plot'}
                  </h3>
                }
              >
                {focusedChart === 'histogram' && histogramData.length > 0 && stats ? (
                  <CapabilityHistogram
                    data={histogramData}
                    specs={effectiveSpecs}
                    mean={stats.mean}
                  />
                ) : focusedChart === 'probability-plot' && histogramData.length > 0 && stats ? (
                  <ProbabilityPlot
                    series={probabilitySeries}
                    onPointCapture={openProbabilityCaptureDraft}
                  />
                ) : null}
              </DashboardChartCard>
            </FocusedViewOverlay>
          ) : focusedChart ? (
            <FocusedChartView
              focusedChart={focusedChart as 'ichart' | 'boxplot' | 'pareto'}
              outcome={effectiveOutcome}
              availableOutcomes={availableOutcomes}
              boxplotFactor={boxplotFactor}
              paretoFactor={paretoFactor}
              factors={effectiveFactors}
              filters={filters}
              showParetoComparison={showParetoComparison}
              anovaResult={anovaResult}
              boxplotData={boxplotData}
              stats={stats}
              ichartLoading={!stats || isComputing}
              stagedStats={stagedStats}
              stageColumn={stageColumn}
              onSetOutcome={setOutcome}
              onSetBoxplotFactor={setBoxplotFactor}
              onSetParetoFactor={setParetoFactor}
              onDrillDown={handleDrillDown}
              onToggleParetoComparison={() => toggleParetoComparison()}
              onHideParetoPanel={() => setShowParetoPanel(false)}
              onManageFactors={onManageFactors}
              onPointClick={onPointClick}
              onSpecClick={() => setShowSpecEditor(true)}
              onNextChart={handleNextChart}
              onPrevChart={handlePrevChart}
              onExitFocus={() => setFocusedChart(null)}
              chartTitles={chartTitles}
              onChartTitleChange={handleChartTitleChange}
              ichartFindings={chartFindings?.ichart}
              onCreateObservation={
                onAddChartObservation
                  ? (ax: number, ay: number) =>
                      onAddChartObservation('ichart', undefined, undefined, ax, ay)
                  : undefined
              }
              onEditFinding={onEditFinding}
              onDeleteFinding={onDeleteFinding}
              paretoAggregation={paretoAggregation}
              onToggleParetoAggregation={() =>
                setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
              }
              filterChipData={filterChipData}
              columnAliases={columnAliases}
              showFilterContext={displayOptions.showFilterContext !== false}
              boxplotHighlights={boxplotHighlights}
              onBoxplotContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
              boxplotFindings={chartFindings?.boxplot}
              onBoxplotEditFinding={onEditFinding}
              onBoxplotDeleteFinding={onDeleteFinding}
              paretoHighlights={paretoHighlights}
              onParetoContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
              paretoFindings={chartFindings?.pareto}
              onParetoEditFinding={onEditFinding}
              onParetoDeleteFinding={onDeleteFinding}
              copyFeedback={copyFeedback}
              onCopyChart={handleCopyChart}
              onDownloadPng={handleDownloadPng}
              onDownloadSvg={handleDownloadSvg}
            />
          ) : undefined
        }
        renderSpecEditor={
          showSpecEditor ? (
            <SpecEditor
              specs={outcome ? (measureSpecs[outcome] ?? specs) : specs}
              onSave={handleSaveSpecs}
              onClose={() => setShowSpecEditor(false)}
              style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}
            />
          ) : undefined
        }
      />
      {/* ER-3: Model drawer — Explore door. Mounted in the relative root so it
          is screen-space (never viewBox-cropped). No onCaptureModel (Explore
          capture deferred). No onModelStats (DOI feed is Analyze-only). */}
      <ModelDrawerBase
        open={modelDrawerOpen}
        onClose={() => setModelDrawerOpen(false)}
        rows={effectiveData}
        outcome={effectiveOutcome}
        outcomeLabel={
          effectiveOutcome ? (columnAliases[effectiveOutcome] ?? effectiveOutcome) : undefined
        }
        candidateFactors={candidateFactorsForDrawer}
        scopeLabel={modelDrawerScopeLabel}
      />
    </div>
  );
};

export default Dashboard;
