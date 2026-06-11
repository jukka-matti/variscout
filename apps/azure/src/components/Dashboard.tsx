import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import { useProbabilityPlotData } from '@variscout/hooks';
import MobileChartCarousel from './MobileChartCarousel';
import PerformanceDashboard from './PerformanceDashboard';
import SpecEditor from './settings/SpecEditor';
import FocusedChartView from './views/FocusedChartView';
import {
  useProjectStore,
  useViewStore,
  useAnalysisScopeStore,
  useAnalyzeStore,
} from '@variscout/stores';
import {
  useFilteredData,
  useAnalysisStats,
  useLensedSampleCount,
  useDataDateRange,
  useStagedAnalysis,
  useDefectTransform,
  useDefectSummary,
  buildChangepointDerivedColumn,
  buildEngineSignalCaptureDraft,
  applyDerivedFactorToFilters,
  resolveDerivedFactorName,
  type CaptureDraft,
} from '@variscout/hooks';
import { resolveMode } from '@variscout/core/strategy';
import { resolveCpkTarget } from '@variscout/core/capability';
import { subgroupAxisColumns } from '@variscout/core/frame';
import type { ResolvedMode } from '@variscout/core/strategy';
import { useDashboardCharts } from '../hooks';
import type { UseFilterNavigationReturn } from '../hooks';
import { useStatsWorker } from '../workers/useStatsWorker';
import {
  ErrorBoundary,
  ProcessHealthBar,
  CaptureCard,
  VerificationCard,
  SegmentedControl,
  NarrativeBar,
  SelectionPanel,
  CreateFactorModal,
  DashboardLayoutBase,
  DashboardChartCard,
  FactorStripBase,
  FocusedViewOverlay,
  CapabilityMetricToggle,
  SubgroupConfigPopover,
  DefectSummary,
  InflectionSidePanelView,
  ScopeChrome,
  ModelDrawerBase,
  useInflectionBinningState,
  useIsMobile,
  useGlossary,
  BREAKPOINTS,
  type WorkspaceProjectScopeLabels,
} from '@variscout/ui';
import {
  getColumnNames,
  getEtaSquared,
  getNelsonRule2Sequences,
  getNelsonRule3Sequences,
  DEFAULT_PROCESS_HUB_ID,
  excludeYDerivedFactors,
} from '@variscout/core';
import { getScopedFindings, formatFindingFilters } from '@variscout/core/findings';
import type { Finding } from '@variscout/core';
import type { BinnedFactorBinding } from '@variscout/core/binning';
import type { AzureFindingsCallbacks, FilterChipData } from '@variscout/ui';
import { InflectionOverlay } from '@variscout/charts';
import {
  useAnnotations,
  useFilterHandlers,
  useCreateFactorModal,
  useDashboardInsights,
  useProcessProjection,
  useJourneyPhase,
  useCapabilityIChartData,
  useTranslation,
  useFactorStripModel,
  matchActiveScopeId,
} from '@variscout/hooks';
import type { AIContext } from '@variscout/core';
import type { ViewState } from '@variscout/hooks';
import { Activity, BarChart3, Gauge, ArrowLeft, Settings2 } from 'lucide-react';
import { usePanelsStore } from '../features/panels/panelsStore';

type DashboardTab = 'analysis' | 'performance';

/** Mode-dispatched tab configuration (ADR-047 pattern). */
interface ModeTab {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ size: number }>;
  activeColor: string;
}

const modeTabs: Record<ResolvedMode, ModeTab[]> = {
  standard: [{ id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' }],
  capability: [{ id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' }],
  performance: [
    { id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' },
    { id: 'performance', label: 'Performance', icon: Gauge, activeColor: 'bg-blue-600' },
  ],
  defect: [{ id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' }],
};

/** Default tab when switching to a mode (undefined = keep current). */
const modeDefaultTab: Record<ResolvedMode, DashboardTab | undefined> = {
  standard: undefined,
  capability: undefined,
  performance: undefined,
  defect: undefined,
};

interface DashboardPerformanceProps {
  drillFromPerformance?: string | null;
  onBackToPerformance?: () => void;
  onDrillToMeasure?: (measureId: string) => void;
}

interface DashboardAIProps {
  fetchChartInsight?: (userPrompt: string) => Promise<string>;
  aiContext?: AIContext | null;
  aiEnabled?: boolean;
  narrative?: string | null;
  narrativeLoading?: boolean;
  narrativeCached?: boolean;
  narrativeError?: string | null;
  onNarrativeAsk?: () => void;
  onNarrativeRetry?: () => void;
  onAskCoScoutFromCategory?: (focusContext: {
    chartType: 'boxplot' | 'pareto';
    category: { name: string; mean?: number; etaSquaredPct?: number };
  }) => void;
}

interface DashboardProps {
  // Core
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
  filterNav?: UseFilterNavigationReturn;
  onManageFactors?: () => void;
  onPinFinding?: (noteText?: string) => void;
  onShareChart?: (chartType: string) => void;
  /** Export CSV handler (context-line Export menu — Azure CSV-only, no .vrs). */
  onExportCSV?: () => void;
  findingsCallbacks?: AzureFindingsCallbacks;
  findings?: Finding[];
  /** Factor Intelligence: callback when user clicks "Investigate" on a significant factor */
  onInvestigateFactor?: (effect: import('@variscout/core/stats').FactorMainEffect) => void;
  /** External factor switch request (from question click) — sets boxplot + pareto factor */
  requestedFactor?: { factor: string; seq: number } | null;
  // Persistence
  initialViewState?: ViewState;
  onViewStateChange?: (partial: Partial<ViewState>) => void;
  // Domain groups
  performance?: DashboardPerformanceProps;
  ai?: DashboardAIProps;
  /** Projected Cpk map from improvement workspace (finding ID -> projected Cpk) */
  projectedCpkMap?: Record<string, number>;
  workspaceProjectScope?: {
    title: string;
    labels: WorkspaceProjectScopeLabels;
  } | null;
  onOpenWall?: () => void;
  /**
   * G1 Task 4: derived categorical columns from the active ImprovementProject.
   * Keys: derived column names (e.g. `Order_Date.day-of-week`, `Reactor_temp_bin`).
   * When provided, these columns are included in the Boxplot/Probability factor
   * pickers and used for data-extraction fall-through.
   * Backward compat: absent or empty → identical to today.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
  /**
   * LV1-E Task 7: Process steps from the active ImprovementProject, mapped to
   * the shape ScopeChrome expects. Absent or empty → ScopeChrome renders the
   * step chip with no options (graceful no-op; step scope selection is
   * deferred until the parent threads the full IP context here).
   */
  workspaceProjectProcessSteps?: ReadonlyArray<{ stepId: string; label: string }>;
  /**
   * G1 Task 7: existing inflection-binning bindings from the Workspace Project.
   * When provided alongside `onBindingsChange`, the Probability lens shows the
   * inflection-binning workflow (Detect → propose → commit → manage). Without
   * a writer the workflow is suppressed (read-only consumers).
   */
  binnedFactorBindings?: BinnedFactorBinding[];
  /**
   * G1 Task 7: synchronous patch handler for `binnedFactorBindings`. MUST update
   * upstream React state in the same tick (i.e. plain `setState`). Async
   * persistence (Dexie / Blob sync) is the caller's concern — wrap it so the
   * domain store updates immediately and the async write fires in the
   * background, otherwise the inflection state machine races with itself.
   */
  onBindingsChange?: (next: BinnedFactorBinding[]) => void;
  /**
   * ER-2: active scope project id (Workspace Project id, or DEFAULT_PROCESS_HUB_ID).
   * The factor strip uses it to refresh an existing ProblemStatementScope's
   * what-if number — must match the id scopes are stored under (the same value
   * AnalyzeWorkspace receives). Absent → falls back to DEFAULT_PROCESS_HUB_ID.
   */
  scopeProjectId?: string;
}

const Dashboard = ({
  onPointClick,
  highlightedPointIndex,
  filterNav: externalFilterNav,
  initialViewState,
  onViewStateChange,
  onManageFactors,
  onPinFinding,
  onShareChart,
  onExportCSV,
  findingsCallbacks,
  findings: allFindings,
  onInvestigateFactor,
  requestedFactor,
  performance = {},
  ai = {},
  projectedCpkMap: externalProjectedCpkMap,
  onOpenWall,
  categoricalValuesByColumn,
  workspaceProjectProcessSteps = [],
  binnedFactorBindings,
  onBindingsChange,
  scopeProjectId = DEFAULT_PROCESS_HUB_ID,
}: DashboardProps) => {
  const { drillFromPerformance, onBackToPerformance, onDrillToMeasure } = performance;
  const {
    fetchChartInsight,
    aiContext,
    aiEnabled,
    narrative,
    narrativeLoading,
    narrativeCached,
    narrativeError,
    onNarrativeAsk,
    onNarrativeRetry,
    onAskCoScoutFromCategory,
  } = ai;
  const { onAddChartObservation, chartFindings, onEditFinding, onDeleteFinding } =
    findingsCallbacks ?? {};
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const processContext = useProjectStore(s => s.processContext);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const rawData = useProjectStore(s => s.rawData);
  const setRawData = useProjectStore(s => s.setRawData);
  const setFactors = useProjectStore(s => s.setFactors);
  const specs = useProjectStore(s => s.specs);
  const setSpecs = useProjectStore(s => s.setSpecs);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const filters = useProjectStore(s => s.filters);
  const setFilters = useProjectStore(s => s.setFilters);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const stageColumn = useProjectStore(s => s.stageColumn);
  const stageOrderMode = useProjectStore(s => s.stageOrderMode);
  const setStageColumn = useProjectStore(s => s.setStageColumn);
  const setStageOrderMode = useProjectStore(s => s.setStageOrderMode);
  const paretoAggregation = useProjectStore(s => s.paretoAggregation);
  const setParetoAggregation = useProjectStore(s => s.setParetoAggregation);
  const chartTitles = useProjectStore(s => s.chartTitles);
  const timeColumn = useProjectStore(s => s.timeColumn);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const setDisplayOptions = useProjectStore(s => s.setDisplayOptions);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const setSubgroupConfig = useProjectStore(s => s.setSubgroupConfig);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const selectedPoints = useViewStore(s => s.selectedPoints);
  const clearSelection = useViewStore(s => s.clearTransientSelections);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const { filteredData, filteredIndexMap } = useFilteredData();
  const lensedSampleCount = useLensedSampleCount();
  const dataDateRange = useDataDateRange();
  // Pass the worker so computeStats runs off the main thread; the I-Chart card's
  // skeleton gate covers the async round-trip (no blank window on tab return).
  const workerApi = useStatsWorker();
  const { stats, isComputing } = useAnalysisStats(workerApi);
  const { stagedStats } = useStagedAnalysis();
  const { getTerm } = useGlossary();
  const { t } = useTranslation();
  const isPhone = useIsMobile(BREAKPOINTS.phone);

  type AzureAnalysisLensTab = 'probability' | 'distribution';
  const [analysisLensTab, setAnalysisLensTab] = useState<AzureAnalysisLensTab>('probability');
  const [captureDraft, setCaptureDraft] = useState<CaptureDraft | null>(null);
  const [showCaptureAfterglow, setShowCaptureAfterglow] = useState(false);
  // ER-3: Model drawer open state (Explore door).
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);

  // Defect mode: transform filtered data into aggregated defect rates
  const isDefectMode = resolveMode(analysisMode) === 'defect';
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
  // ProcessHealthBar Cpk chip + the mobile carousel read `stats` from
  // useAnalysisStats, which keys its spec resolution on `outcome` (the global
  // one); their other spec-scoped props here (cpkTarget, columnLabel) also key
  // on `outcome`. Match that source so the Cpk chip never hides while stats.cpk
  // is defined (the histogram, in contrast, follows effectiveOutcome).
  const outcomeSpecs = outcome ? (measureSpecs[outcome] ?? specs) : specs;

  // In defect mode + value aggregation, use cost/duration column for Pareto value mode
  const defectParetoOutcome = (() => {
    if (!isDefectMode || !defectResult || paretoAggregation !== 'value') return undefined;
    if (defectResult.costColumn) return defectResult.costColumn;
    if (defectResult.durationColumn) return defectResult.durationColumn;
    return undefined;
  })();

  // Compute DefectSummary props from transformed data
  const defectSummaryProps = useDefectSummary(isDefectMode ? defectResult : null, defectMapping);

  const [activeTab, setActiveTabRaw] = useState<DashboardTab>(
    initialViewState?.activeTab ?? 'analysis'
  );
  const [showSpecEditor, setShowSpecEditor] = useState(false);

  // Wrap setActiveTab to report changes for persistence
  const setActiveTab = useCallback(
    (tab: DashboardTab) => {
      setActiveTabRaw(tab);
      onViewStateChange?.({ activeTab: tab });
    },
    [onViewStateChange]
  );

  // Resolved analysis mode (ADR-047)
  const resolvedMode = resolveMode(analysisMode, {
    standardIChartMetric: displayOptions.standardIChartMetric,
  });

  // Initialize focused chart from persisted view state (one-time on mount)
  const [hasRestoredFocusedChart, setHasRestoredFocusedChart] = useState(false);

  // Auto-switch to analysis tab when drilling from performance mode
  useEffect(() => {
    if (drillFromPerformance) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to external navigation event (performance drill-down)
      setActiveTab('analysis');
    }
  }, [drillFromPerformance, setActiveTab]);

  // Auto-switch tab when analysis mode changes
  useEffect(() => {
    const defaultTab = modeDefaultTab[resolvedMode];
    if (defaultTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to external analysis mode change
      setActiveTab(defaultTab);
    }
  }, [resolvedMode, setActiveTab]);

  // Chart state and logic from the hook
  const {
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    showParetoPanel,
    setShowParetoPanel,
    showParetoComparison,
    setShowParetoComparison,
    copyFeedback,
    handleCopyChart,
    handleDownloadPng,
    handleDownloadSvg,
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
    allFactors,
    filterStack,
    clearFilters,
    updateFilterValues,
    removeFilter,
    handleDrillDown,
    handleChartTitleChange,
  } = useDashboardCharts({
    externalFilterNav,
    initialBoxplotFactor: initialViewState?.boxplotFactor,
    initialParetoFactor: initialViewState?.paretoFactor,
    onViewStateChange,
    categoricalValuesByColumn,
  });

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

  // Restore persisted focused chart (one-time after hook initializes)
  useEffect(() => {
    if (!hasRestoredFocusedChart && initialViewState?.focusedChart) {
      const chart = initialViewState.focusedChart;
      // FocusedChart only covers standard charts
      if (chart === 'ichart' || chart === 'boxplot' || chart === 'pareto') {
        setFocusedChart(chart);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restoration from persisted view state
      setHasRestoredFocusedChart(true);
    } else if (!hasRestoredFocusedChart) {
      setHasRestoredFocusedChart(true);
    }
  }, [hasRestoredFocusedChart, initialViewState?.focusedChart, setFocusedChart]);

  // Report focused chart changes for persistence
  useEffect(() => {
    if (hasRestoredFocusedChart) {
      onViewStateChange?.({ focusedChart });
    }
  }, [focusedChart, hasRestoredFocusedChart, onViewStateChange]);

  // F1 Task 5: Apply pendingExploreIntent set by the Process tab's
  // ExploreExitButton when the user clicks "→ Explore". The Edit-mode exit
  // calls `panelsStore.showExplore(intent)` (Task 6 wires the real call);
  // here we consume the intent on mount and apply it to focused chart +
  // boxplot factor, then clear it so a remount doesn't re-apply.
  //
  // Intent priority: this runs AFTER the persisted-viewState restore above
  // (source order), so if both fire on the same mount, intent wins — the
  // restore sets focusedChart from initialViewState first, then this effect
  // overwrites with the intent's focusedChart and additionally sets the
  // boxplot factor when present. Tests cover the override case.
  //
  // Dep on pendingExploreIntent only (not viewState / boxplotFactor) — the
  // intent is single-use (cleared after one apply), so refiring on factor
  // changes would be a bug.
  const pendingExploreIntent = usePanelsStore(s => s.pendingExploreIntent);
  const clearPendingExploreIntent = usePanelsStore(s => s.clearPendingExploreIntent);
  useEffect(() => {
    if (!pendingExploreIntent) return;
    setFocusedChart(pendingExploreIntent.focusedChart);
    if (pendingExploreIntent.boxplotFactor) {
      setBoxplotFactor(pendingExploreIntent.boxplotFactor);
      // LV1-B: mirror boxplotFactor into the linked-views scope store so
      // downstream consumers (LV1-E scope chrome, LV1-G canvas viz) can
      // subscribe. The local setState above retires when LV1-E ships.
      useAnalysisScopeStore.getState().setBoxplotFactor(pendingExploreIntent.boxplotFactor);
    }
    clearPendingExploreIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- single-use intent: only fire when intent transitions to non-null
  }, [pendingExploreIntent]);

  // LV1-E Task 7: Reverse-mirror effects — scope store → existing local state.
  //
  // When ScopeChrome mutates the analysisScopeStore (e.g. user picks a new Y
  // column or boxplot factor), these effects propagate the change back into the
  // existing chart-wiring layer so charts re-render with the new selection.
  //
  // Guard pattern: `if (scopeVal !== localVal) setLocal(scopeVal)` prevents
  // infinite loops. Each dep array contains ONLY the scope-store value — never
  // the local var — so the effect fires once on store change, not on every
  // local re-render.
  const scopeY = useAnalysisScopeStore(s => s.yColumn);
  const scopeBoxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);

  useEffect(() => {
    if (scopeY && scopeY !== outcome) setOutcome(scopeY);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reverse-mirror: dep on store value only, not local var
  }, [scopeY]);

  useEffect(() => {
    if (scopeBoxplotFactor && scopeBoxplotFactor !== boxplotFactor) {
      setBoxplotFactor(scopeBoxplotFactor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reverse-mirror: dep on store value only, not local var
  }, [scopeBoxplotFactor]);

  // TODO(lv1-e-step-mirror): wire stepId mirror when a local stepId state exists.
  // analysisScopeStore.setStepId is available, but Dashboard has no local stepId
  // to mirror into as of LV1-E. Add once the chart layer consumes stepId.

  // Process projection intelligence (Phase 2-4)
  const journeyPhase = useJourneyPhase(!!rawData?.length, allFindings ?? []);
  const projectedCpkMap = externalProjectedCpkMap ?? {};

  const scopedFindings = useMemo(
    () => (allFindings ? getScopedFindings(allFindings) : undefined),
    [allFindings]
  );
  const benchmarkData = useMemo(() => {
    const bm = allFindings?.find(f => f.role === 'benchmark' && f.benchmarkStats);
    if (!bm?.benchmarkStats) return null;
    return {
      stats: bm.benchmarkStats,
      label: formatFindingFilters(bm.context, columnAliases),
    };
  }, [allFindings, columnAliases]);
  const improvementData = useMemo(() => {
    const entries = Object.values(projectedCpkMap);
    if (entries.length === 0) return { cpk: null, label: '' };
    const bestCpk = Math.max(...entries);
    return { cpk: bestCpk, label: `${entries.length} scoped` };
  }, [projectedCpkMap]);
  const { centeringOpportunity, specSuggestion, activeProjection } = useProcessProjection({
    rawData: rawData ?? [],
    filteredData: filteredData ?? [],
    outcome,
    specs,
    stats,
    filterStack,
    scopedFindings,
    benchmark: benchmarkData,
    journeyPhase,
    improvementProjectedCpk: improvementData.cpk,
    improvementLabel: improvementData.label,
  });

  // Annotations (right-click context menu for highlights, no mode toggle)
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

  // Histogram data for standalone chart cards (grid mode)
  const histogramData = useMemo(() => {
    if (!effectiveOutcome || !effectiveData || effectiveData.length === 0) return [];
    return effectiveData
      .map((d: Record<string, unknown>) => Number(d[effectiveOutcome]))
      .filter((v: number) => !isNaN(v));
  }, [effectiveData, effectiveOutcome]);

  // Probability plot series — linked to boxplot factor for multi-series grouping
  // G1 Task 4: pass categoricalValuesByColumn so derived factors (e.g. Reactor_temp_bin)
  // are resolved even though raw filteredData rows don't carry those keys.
  const probabilitySeries = useProbabilityPlotData({
    values: histogramData,
    factorColumn: boxplotFactor,
    rows: filteredData,
    categoricalValuesByColumn,
  });

  // ── G1 Task 7: inflection-binning workflow ────────────────────────────────
  // Lift the state machine to Dashboard so the InflectionOverlay (rendered on
  // the ProbabilityPlot via its `overlay` slot) and the InflectionSidePanelView
  // (sibling to the VerificationCard) share the same `state.cuts` instance.
  // Two hooks would mean two diverging state machines — not what we want.
  //
  // Suppressed in defect mode: defect rates are aggregated bins already, and
  // the inflection workflow assumes raw measurement values.
  //
  // Suppressed when no writer is supplied (e.g., consumers without an active
  // IP); in that case the panel + overlay are inert — the chart renders
  // unchanged. Backward compatible.
  const inflectionEnabled =
    !!onBindingsChange && !!effectiveOutcome && !isDefectMode && histogramData.length > 0;

  // Sorted histogram values (memoized) — passed to the hook + reused if we
  // ever want to share with downstream consumers. Stable identity matters
  // since the hook depends on `sortedValues` for `applyCutMutation`.
  const sortedHistogramValues = useMemo(
    () => [...histogramData].sort((a, b) => a - b),
    [histogramData]
  );

  const noopPatchBindings = useCallback((_next: BinnedFactorBinding[]) => {
    // No-op when the workflow is suppressed; the hook still runs to keep
    // hook order stable across renders, but its actions are inert.
    void _next;
  }, []);

  const binningController = useInflectionBinningState({
    sourceColumn: effectiveOutcome ?? '',
    values: histogramData,
    sortedValues: sortedHistogramValues,
    existingBindings: binnedFactorBindings ?? [],
    patchBindings: onBindingsChange ?? noopPatchBindings,
  });

  // sourceColumn change without unmount: the hook computes initial state once
  // on mount. When the analyst switches the outcome (Y column) without
  // remounting Dashboard, we must reset the state machine so it picks up the
  // bindings + values for the new column.
  useEffect(() => {
    if (!inflectionEnabled) return;
    binningController.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on column change only; controller identity is stable per render
  }, [effectiveOutcome, inflectionEnabled]);

  // Compute the cuts the overlay should render + the variant. In committed
  // state the cuts are solid (binding is persisted); in proposing state they
  // are ghosted (preview only). In idle state no overlay is rendered.
  const { overlayCuts, overlayVariant } = useMemo<{
    overlayCuts: number[];
    overlayVariant: 'solid' | 'ghost';
  }>(() => {
    const s = binningController.state;
    if (s.kind === 'committed') return { overlayCuts: s.binding.cuts, overlayVariant: 'solid' };
    if (s.kind === 'proposing') return { overlayCuts: s.cuts, overlayVariant: 'ghost' };
    return { overlayCuts: [], overlayVariant: 'ghost' };
  }, [binningController.state]);

  // Overlay render-prop forwarded to both ProbabilityPlot call sites. Null
  // when the workflow is suppressed OR there are no cuts to draw — keeps the
  // baseline chart untouched.
  const probabilityOverlay = useMemo(
    () =>
      inflectionEnabled && overlayCuts.length > 0
        ? ({ xScale, yRange }: { xScale: (v: number) => number; yRange: [number, number] }) => (
            <InflectionOverlay
              cuts={overlayCuts}
              xScale={xScale}
              yRange={yRange}
              variant={overlayVariant}
            />
          )
        : undefined,
    [inflectionEnabled, overlayCuts, overlayVariant]
  );

  // ── Verify card tabs ──────────────────────────────────────────────────────
  // Probability content combines the chart + (when enabled) the
  // InflectionSidePanelView as a horizontal sibling. Side panel placement:
  // right-of-chart on desktop, hidden on phone (carousel layout already runs).
  const probabilityContent = inflectionEnabled ? (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
      <div className="min-w-0 flex-1">
        <ProbabilityPlot series={probabilitySeries} overlay={probabilityOverlay} />
      </div>
      <div className="lg:w-72 lg:flex-shrink-0">
        <InflectionSidePanelView
          sourceColumn={effectiveOutcome ?? ''}
          controller={binningController}
        />
      </div>
    </div>
  ) : (
    <ProbabilityPlot series={probabilitySeries} overlay={probabilityOverlay} />
  );

  // Verify card tabs (Probability / Capability|Distribution)
  const hasSpecs = !!(effectiveSpecs.usl !== undefined || effectiveSpecs.lsl !== undefined);
  const azureAnalysisLensTabs: {
    id: AzureAnalysisLensTab;
    label: string;
    content: React.ReactNode;
  }[] = [
    {
      id: 'probability',
      label: t('verify.tab.probability'),
      content: probabilityContent,
    },
    {
      id: 'distribution',
      label: hasSpecs ? t('verify.tab.capability') : t('verify.tab.distribution'),
      content: (
        <CapabilityHistogram data={histogramData} specs={effectiveSpecs} mean={stats?.mean ?? 0} />
      ),
    },
  ];
  const activeAzureAnalysisLensTab = azureAnalysisLensTabs.some(tab => tab.id === analysisLensTab)
    ? analysisLensTab
    : (azureAnalysisLensTabs[0]?.id ?? 'probability');

  // Keyboard: clear selection on Escape (complement to hook's focused-mode ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPoints.size > 0) {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPoints, clearSelection]);

  // Shared filter handler callbacks
  const { handleClearAllFilters, handleRemoveFilter, handleUpdateFilterValues } = useFilterHandlers(
    {
      clearFilters,
      removeFilter,
      updateFilterValues,
    }
  );

  const saveEngineSignalCaptureDraft = useCallback(
    (captureMode: 'capture' | 'factor-only') => {
      if (
        !captureDraft ||
        captureDraft.entryKind !== 'engine-signal' ||
        !captureDraft.proposedFactorName ||
        captureDraft.source.chart !== 'ichart'
      ) {
        return;
      }
      const factorName = resolveDerivedFactorName(
        captureDraft.proposedFactorName,
        getColumnNames(rawData)
      );
      const rawChangepointIndex =
        filteredIndexMap.get(captureDraft.source.anchorX) ?? captureDraft.source.anchorX;
      setRawData(buildChangepointDerivedColumn(rawData, rawChangepointIndex, factorName));
      if (!factors.includes(factorName)) {
        setFactors([...factors, factorName]);
      }
      setBoxplotFactor(factorName);
      setParetoFactor(factorName);

      if (captureMode === 'capture') {
        const finding = onAddChartObservation?.(
          'ichart',
          undefined,
          captureDraft.note,
          captureDraft.source.anchorX,
          captureDraft.source.anchorY,
          {
            captureMode,
            activeFilters: applyDerivedFactorToFilters(captureDraft.activeFilters, factorName),
            evidenceType: captureDraft.evidenceType,
          }
        );
        if (finding) setShowCaptureAfterglow(true);
      }
      setCaptureDraft(null);
    },
    [
      captureDraft,
      factors,
      filteredIndexMap,
      onAddChartObservation,
      rawData,
      setBoxplotFactor,
      setFactors,
      setParetoFactor,
      setRawData,
    ]
  );

  const openEngineSignalCaptureDraft = useCallback(() => {
    if (isDefectMode) return;
    if (!effectiveOutcome || !stats) return;
    const values = filteredData
      .map(row => Number(row[effectiveOutcome]))
      .filter(value => Number.isFinite(value));
    const rule2Sequences = getNelsonRule2Sequences(values, stats.mean);
    const rule3Sequences = getNelsonRule3Sequences(values);
    const signal = rule2Sequences[0]
      ? { index: rule2Sequences[0].startIndex, label: 'Process shift detected' }
      : rule3Sequences[0]
        ? { index: rule3Sequences[0].startIndex, label: 'Trend detected' }
        : null;
    if (!signal) return;

    setCaptureDraft(
      buildEngineSignalCaptureDraft({
        rows: filteredData,
        outcome: effectiveOutcome,
        signalLabel: signal.label,
        changepointIndex: signal.index,
        activeFilters: filters,
        specs,
        existingColumnNames: getColumnNames(rawData),
      })
    );
  }, [effectiveOutcome, filteredData, filters, isDefectMode, rawData, specs, stats]);

  // Create Factor modal state and handlers
  const {
    showCreateFactorModal,
    handleOpenCreateFactorModal,
    handleCloseCreateFactorModal,
    handleCreateFactor,
  } = useCreateFactorModal({
    rawData,
    selectedPoints,
    filters,
    setRawData,
    setFilters,
    clearSelection,
    onFactorCreated: name => {
      setBoxplotFactor(name);
      setParetoFactor(name);
    },
  });

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
    aiEnabled: aiEnabled ?? false,
    aiContext,
    fetchChartInsight,
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
  // bindings: Azure threads the live ImprovementProject's binnedFactorBindings,
  // so D11 excludes Y-derived bins by binding too (not just the name convention).
  const stripModel = useFactorStripModel({
    rows: effectiveData,
    outcome: effectiveOutcome,
    allFactors,
    selectedFactors: effectiveFactors,
    specs: effectiveSpecs,
    bindings: binnedFactorBindings,
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
  // Azure threads the live binnedFactorBindings so D11 excludes Y-derived bins.
  const candidateFactorsForDrawer = useMemo(
    () =>
      effectiveOutcome
        ? excludeYDerivedFactors(allFactors, effectiveOutcome, binnedFactorBindings)
        : [],
    [allFactors, effectiveOutcome, binnedFactorBindings]
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
  // is analysisScopeStore.categoricalFilters; scopeProjectId is the Workspace
  // Project id threaded as a prop (matches AnalyzeWorkspace's scope keying).
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

  if (!outcome) return null;

  return (
    <div
      id="dashboard-export-container"
      className="flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-surface relative"
    >
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-surface flex-shrink-0">
        {/* Process Health Bar — replaces FilterBreadcrumb + Toolbar */}
        {!isPhone && (
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
            onClearAll={handleClearAllFilters}
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
        )}

        {/* Selection Panel (desktop only — multi-point selection is a desktop feature) */}
        {!isPhone && selectedPoints.size > 0 && (
          <SelectionPanel
            selectedIndices={selectedPoints}
            data={filteredData}
            outcome={outcome}
            columnAliases={columnAliases}
            factors={factors}
            timeColumn={timeColumn}
            onClearSelection={clearSelection}
            onCreateFactor={handleOpenCreateFactorModal}
          />
        )}

        {captureDraft && (
          <CaptureCard
            draft={captureDraft}
            onDraftChange={patch =>
              setCaptureDraft(current => (current ? { ...current, ...patch } : current))
            }
            onCapture={() => saveEngineSignalCaptureDraft('capture')}
            onFactorOnly={() => saveEngineSignalCaptureDraft('factor-only')}
            onCancel={() => setCaptureDraft(null)}
          />
        )}
        {showCaptureAfterglow && onOpenWall ? (
          <div
            role="status"
            className="mx-4 mb-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950"
          >
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                setShowCaptureAfterglow(false);
                onOpenWall();
              }}
            >
              Take it to Analyze -&gt;
            </button>
            <button
              type="button"
              aria-label="Dismiss Analyze afterglow"
              className="ml-3 text-blue-700"
              onClick={() => setShowCaptureAfterglow(false)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {/* Tab Navigation */}
        <div
          className="flex-none flex items-center gap-2 px-4 pt-4 pb-2"
          role="tablist"
          aria-label="Dashboard tabs"
        >
          {modeTabs[resolvedMode].map(({ id, label, icon: Icon, activeColor }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? `${activeColor} text-white`
                  : 'bg-surface-secondary text-content-secondary hover:text-content hover:bg-surface-tertiary'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Factor Modal */}
      <CreateFactorModal
        isOpen={showCreateFactorModal}
        onClose={handleCloseCreateFactorModal}
        selectedCount={selectedPoints.size}
        existingFactors={getColumnNames(rawData)}
        onCreateFactor={handleCreateFactor}
      />

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary componentName="Performance Dashboard">
            <PerformanceDashboard onDrillToMeasure={onDrillToMeasure} />
          </ErrorBoundary>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Back to Performance banner */}
          {drillFromPerformance && onBackToPerformance && (
            <div className="flex items-center justify-between px-4 py-2 bg-blue-600/20 border-b border-blue-600/30">
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Activity size={14} />
                <span>
                  Viewing: <span className="font-medium text-content">{drillFromPerformance}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  onBackToPerformance?.();
                  setActiveTab('performance');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-300 hover:text-content hover:bg-blue-600/30 rounded transition-colors"
              >
                <ArrowLeft size={12} />
                Back to Performance
              </button>
            </div>
          )}

          {/* LV1-E Task 7: ScopeChrome — IP-scoped Y / factor / step / filter chrome.
              Desktop-only: mobile carousel is compact and doesn't have room for
              the full chip row. ScopeChrome reads + writes analysisScopeStore
              natively; reverse-mirror effects above propagate writes back into
              the existing chart-wiring layer. */}
          {!isPhone && (
            <ScopeChrome
              availableOutcomes={availableOutcomes.map(col => ({
                columnName: col,
                label: columnAliases[col] ?? col,
              }))}
              availableFactors={effectiveFactors.map(col => ({
                columnName: col,
                label: columnAliases[col] ?? col,
              }))}
              availableSteps={workspaceProjectProcessSteps}
              categoricalValuesByColumn={
                // Filter out nulls: ScopeChrome expects (string | number)[], not (string | null)[]
                Object.fromEntries(
                  Object.entries(categoricalValuesByColumn ?? {}).map(([col, vals]) => [
                    col,
                    vals.filter((v): v is string => v !== null),
                  ])
                )
              }
              onNavigateToProcess={() => usePanelsStore.getState().showFrame()}
            />
          )}

          {isPhone ? (
            <MobileChartCarousel
              factorState={{
                boxplotFactor,
                paretoFactor,
                factors,
                onSetBoxplotFactor: setBoxplotFactor,
                onSetParetoFactor: setParetoFactor,
              }}
              filterContext={{
                filters,
                columnAliases,
                filterChipData,
                onUpdateFilterValues: handleUpdateFilterValues,
                onRemoveFilter: handleRemoveFilter,
                onClearAllFilters: handleClearAllFilters,
              }}
              paretoOptions={{
                paretoAggregation,
                onToggleParetoAggregation: () =>
                  setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count'),
                showParetoComparison,
                onToggleParetoComparison: () => setShowParetoComparison(!showParetoComparison),
              }}
              highlights={{
                boxplotHighlights,
                paretoHighlights,
                onSetHighlight: setHighlight,
              }}
              onDrillDown={handleDrillDown}
              stats={stats}
              specs={outcomeSpecs}
              filteredData={filteredData}
              outcome={outcome}
              onSaveSpecs={
                outcome ? (next: typeof specs) => setMeasureSpec(outcome, next) : setSpecs
              }
              showCpk={displayOptions.showCpk !== false}
              anovaResult={anovaResult}
              onPinFinding={onPinFinding}
              boxplotData={boxplotData}
              findingsCallbacks={findingsCallbacks}
              onOpenWall={onOpenWall}
              onAskCoScout={onAskCoScoutFromCategory}
              onInvestigateFactor={onInvestigateFactor}
              categoricalValuesByColumn={categoricalValuesByColumn}
            />
          ) : (
            <div className="flex flex-1 min-h-0">
              <DashboardLayoutBase
                outcome={outcome}
                factors={factors}
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
                controlStats={
                  isCapabilityMode && capabilityIChartData?.cpkStats
                    ? capabilityIChartData.cpkStats
                    : stats
                }
                ichartLoading={!stats || isComputing}
                getTermUcl={getTerm('ucl')}
                getTermMean={getTerm('mean')}
                getTermLcl={getTerm('lcl')}
                chartTitles={chartTitles}
                onChartTitleChange={handleChartTitleChange}
                boxplotFactor={boxplotFactor}
                setBoxplotFactor={setBoxplotFactor}
                paretoFactor={paretoFactor}
                setParetoFactor={setParetoFactor}
                showParetoPanel={showParetoPanel}
                focusedChart={focusedChart}
                setFocusedChart={setFocusedChart}
                filterChipData={filterChipData}
                annotations={{
                  contextMenu: isPhone
                    ? {
                        isOpen: false,
                        position: { x: 0, y: 0 },
                        categoryKey: '',
                        chartType: 'boxplot',
                      }
                    : contextMenu,
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
                onShareChart={onShareChart}
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
                // Azure-specific: Manage Factors button in I-Chart header
                ichartHeaderExtra={
                  // CapabilityMetricToggle + the Factors(N) twin STAY here
                  // (chart identity + the ER-2 interim Factors home). The
                  // SubgroupConfigPopover relocated to the context-line
                  // `subgroupSlot` (ER-1 Task 2).
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
                // ER-2: boxplotFactorWrapper retired — the factor strip absorbs
                // factor selection (the dropdown it wrapped is gone). The strip
                // node itself is wired in Task 4 (apps).
                // Render slots
                renderIChartContent={
                  <ErrorBoundary componentName="I-Chart">
                    <IChart
                      onPointClick={onPointClick}
                      highlightedPointIndex={highlightedPointIndex}
                      onSpecClick={() => setShowSpecEditor(true)}
                      ichartFindings={chartFindings?.ichart}
                      onCreateObservation={(anchorX, anchorY) =>
                        onAddChartObservation?.('ichart', undefined, undefined, anchorX, anchorY)
                      }
                      onEditFinding={onEditFinding}
                      onDeleteFinding={onDeleteFinding}
                      dataOverride={isDefectMode && defectResult ? effectiveData : undefined}
                      outcomeOverride={
                        isDefectMode && defectResult ? (effectiveOutcome ?? undefined) : undefined
                      }
                    />
                  </ErrorBoundary>
                }
                renderBoxplotContent={
                  <ErrorBoundary componentName="Boxplot">
                    {boxplotFactor && (
                      <Boxplot
                        factor={boxplotFactor}
                        onDrillDown={handleDrillDown}
                        highlightedCategories={boxplotHighlights}
                        onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                        findings={chartFindings?.boxplot}
                        onEditFinding={onEditFinding}
                        onDeleteFinding={onDeleteFinding}
                        isComputing={isComputing}
                        dataOverride={isDefectMode && defectResult ? effectiveData : undefined}
                        outcomeOverride={
                          isDefectMode && defectResult ? (effectiveOutcome ?? undefined) : undefined
                        }
                        categoricalValuesByColumn={categoricalValuesByColumn}
                      />
                    )}
                  </ErrorBoundary>
                }
                renderParetoContent={
                  <ErrorBoundary componentName="Pareto Chart">
                    {paretoFactor && (
                      <ParetoChart
                        factor={paretoFactor}
                        onDrillDown={handleDrillDown}
                        showComparison={showParetoComparison}
                        onToggleComparison={() => setShowParetoComparison(!showParetoComparison)}
                        onHide={() => setShowParetoPanel(false)}
                        onUploadPareto={onManageFactors}
                        availableFactors={effectiveFactors}
                        aggregation={paretoAggregation}
                        onToggleAggregation={() =>
                          setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
                        }
                        highlightedCategories={paretoHighlights}
                        onContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                        findings={chartFindings?.pareto}
                        onEditFinding={onEditFinding}
                        onDeleteFinding={onDeleteFinding}
                        isComputing={isComputing}
                        dataOverride={isDefectMode && defectResult ? effectiveData : undefined}
                        outcomeOverride={
                          isDefectMode && defectResult
                            ? (defectParetoOutcome ?? effectiveOutcome ?? undefined)
                            : undefined
                        }
                        onFactorSwitch={isDefectMode ? setParetoFactor : undefined}
                      />
                    )}
                  </ErrorBoundary>
                }
                /* Stats panel removed from grid — key stats now in ProcessHealthBar toolbar.
                   Stats sidebar (left) provides detailed view when toggled. */
                verificationCardTitle={
                  histogramData.length > 0 && stats && !(isDefectMode && defectSummaryProps) ? (
                    <SegmentedControl
                      options={azureAnalysisLensTabs.map(tab => ({
                        value: tab.id,
                        label: tab.label,
                      }))}
                      value={activeAzureAnalysisLensTab}
                      onChange={tabId => setAnalysisLensTab(tabId as AzureAnalysisLensTab)}
                      aria-label={t('verify.tabs.label')}
                      testId="verify-tab"
                    />
                  ) : undefined
                }
                renderVerificationCard={
                  isDefectMode && defectSummaryProps ? (
                    <DefectSummary {...defectSummaryProps} />
                  ) : histogramData.length > 0 && stats ? (
                    <VerificationCard
                      tabs={azureAnalysisLensTabs}
                      activeTab={activeAzureAnalysisLensTab}
                    />
                  ) : undefined
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
                        ) : focusedChart === 'probability-plot' &&
                          histogramData.length > 0 &&
                          stats ? (
                          // G1 Task 7: forward the same overlay render-prop so
                          // focused mode shows the inflection cuts. Side panel
                          // is suppressed in focused mode by design — focused
                          // view is read-only chart-only.
                          <ProbabilityPlot
                            series={probabilitySeries}
                            overlay={probabilityOverlay}
                          />
                        ) : null}
                      </DashboardChartCard>
                    </FocusedViewOverlay>
                  ) : focusedChart ? (
                    <FocusedChartView
                      focusedChart={focusedChart as 'ichart' | 'boxplot' | 'pareto'}
                      onPrev={handlePrevChart}
                      onNext={handleNextChart}
                      onExit={() => setFocusedChart(null)}
                      displayOptions={displayOptions}
                      columnAliases={columnAliases}
                      filterChipData={filterChipData}
                      copyFeedback={copyFeedback}
                      onCopyChart={handleCopyChart}
                      onDownloadPng={handleDownloadPng}
                      onDownloadSvg={handleDownloadSvg}
                      outcome={outcome}
                      availableOutcomes={availableOutcomes}
                      stageColumn={stageColumn}
                      availableStageColumns={availableStageColumns}
                      stageOrderMode={stageOrderMode}
                      stagedStats={stagedStats}
                      stats={stats}
                      ichartLoading={!stats || isComputing}
                      ichartChartTitle={chartTitles.ichart || ''}
                      onSetOutcome={setOutcome}
                      onSetStageColumn={setStageColumn}
                      onSetStageOrderMode={setStageOrderMode}
                      onSpecClick={() => setShowSpecEditor(true)}
                      onIChartTitleChange={title => handleChartTitleChange('ichart', title)}
                      onPointClick={onPointClick}
                      highlightedPointIndex={highlightedPointIndex}
                      ichartFindings={chartFindings?.ichart}
                      onCreateIChartObservation={(anchorX: number, anchorY: number) =>
                        onAddChartObservation?.('ichart', undefined, undefined, anchorX, anchorY)
                      }
                      onEditFinding={onEditFinding}
                      onDeleteFinding={onDeleteFinding}
                      boxplotFactor={boxplotFactor}
                      factors={factors}
                      filters={filters}
                      anovaResult={anovaResult}
                      boxplotData={boxplotData}
                      boxplotChartTitle={chartTitles.boxplot || ''}
                      onSetBoxplotFactor={setBoxplotFactor}
                      onDrillDown={handleDrillDown}
                      onBoxplotTitleChange={title => handleChartTitleChange('boxplot', title)}
                      boxplotHighlightedCategories={boxplotHighlights}
                      onBoxplotContextMenu={(key, event) =>
                        handleContextMenu('boxplot', key, event)
                      }
                      boxplotFindings={chartFindings?.boxplot}
                      paretoFactor={paretoFactor}
                      showParetoComparison={showParetoComparison}
                      paretoAggregation={paretoAggregation}
                      paretoChartTitle={chartTitles.pareto || ''}
                      onSetParetoFactor={setParetoFactor}
                      onToggleComparison={() => setShowParetoComparison(!showParetoComparison)}
                      onToggleAggregation={() =>
                        setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
                      }
                      onParetoTitleChange={title => handleChartTitleChange('pareto', title)}
                      onHidePareto={() => setShowParetoPanel(false)}
                      onUploadPareto={onManageFactors}
                      paretoHighlightedCategories={paretoHighlights}
                      onParetoContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                      paretoFindings={chartFindings?.pareto}
                      categoricalValuesByColumn={categoricalValuesByColumn}
                    />
                  ) : undefined
                }
                renderSpecEditor={
                  showSpecEditor && outcome ? (
                    <SpecEditor
                      specs={measureSpecs[outcome] ?? {}}
                      onSave={next => setMeasureSpec(outcome, next)}
                      onClose={() => setShowSpecEditor(false)}
                      style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}
                    />
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      )}

      {/* AI Narrative Bar */}
      {(narrative || narrativeLoading || narrativeError) && (
        <NarrativeBar
          narrative={narrative ?? null}
          isLoading={narrativeLoading ?? false}
          isCached={narrativeCached ?? false}
          error={narrativeError ?? null}
          onAsk={onNarrativeAsk}
          onRetry={onNarrativeRetry}
        />
      )}
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
