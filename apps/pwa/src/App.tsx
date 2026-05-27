import React, { Suspense, useCallback, useState, useEffect, useMemo } from 'react';
import { downloadCSV } from './lib/export';
import { lazyWithRetry } from './lib/chunkReload';
import { useFilterNavigation } from './hooks/useFilterNavigation';
import {
  ColumnMapping,
  type ColumnMappingConfirmPayload,
  FindingsWindow,
  openFindingsPopout,
  updateFindingsPopout,
  YamazumiDetectedModal,
  PerformanceDetectedModal,
  CapabilitySuggestionModal,
  DefectDetectedModal,
  MobileTabBar,
  type MobileTab,
  useIsMobile,
  BREAKPOINTS,
  QuestionsTabView,
  JournalTabView,
  QuestionLinkPrompt,
  GoalBanner,
  HubGoalForm,
  OutcomePin,
  StageFiveModal,
  MatchSummaryCard,
  ActiveIPLaunchpadCard,
  ActiveIPScopeRibbon,
  deriveActiveIPCanvasFocus,
  deriveActiveIPLineageIds,
  deriveActiveIPScopeLabels,
  PendingInvitesBanner,
  type ColumnShape,
} from '@variscout/ui';
import { useStageFiveOpener } from './hooks/useStageFiveOpener';
import { SaveToBrowserButton } from './components/SaveToBrowserButton';
import { VrsExportButton } from './components/VrsExportButton';
import { SessionProvider, useSession } from './store/sessionStore';
import { getOptInFlag, pwaHubRepository } from './persistence';
import { generateDeterministicId } from '@variscout/core/identity';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import { Beaker, Settings, Download, Table2, RotateCcw, FileText } from 'lucide-react';
import {
  useFindings,
  useQuestions,
  useDrillPath,
  buildFindingContext,
  buildFindingSource,
  useJournalEntries,
  useFilteredData,
  useAnalysisStats,
  useLensedSampleCount,
  usePopoutChannel,
  useDefectTransform,
  useDefectSummary,
} from '@variscout/hooks';
import type { FindingsActionMessage } from '@variscout/hooks';
import {
  useProjectStore,
  useAnalyzeStore,
  usePreferencesStore,
  useCanvasViewportStore,
  useViewStore,
  useProjectMembershipStore,
} from '@variscout/stores';
import AppHeader, { type PhaseId } from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import { useDataIngestion } from './hooks/useDataIngestion';
import { useEmbedMessaging } from './hooks/useEmbedMessaging';
import { SAMPLES } from '@variscout/data';
import {
  DEFAULT_PROCESS_HUB_ID,
  normalizeProcessHubId,
  type ExclusionReason,
  type Question,
  toNumericValue,
  extractHubName,
} from '@variscout/core';
import { resolveMode, getStrategy } from '@variscout/core/strategy';
import { resolveCpkTarget } from '@variscout/core/capability';
import { computeCenteringOpportunity } from '@variscout/core/variation';
import { useQuestionGeneration } from '@variscout/hooks';
import { usePasteImportFlow } from './hooks/usePasteImportFlow';
import { EvidenceMapPopout } from './components/EvidenceMapPopout';
import { useAppPanels } from './hooks/useAppPanels';
import { usePanelsStore } from './features/panels/panelsStore';
import { useFindingsStore, groupFindingsByChart } from './features/findings/findingsStore';
import { useProjectionStore } from './features/projection/projectionStore';
import { useAnalyzeOrchestration } from './features/analyze/useAnalyzeOrchestration';
import { useCanvasViewportLifecycle } from './features/analyze/useCanvasViewportLifecycle';
import { useStatsWorker } from './workers/useStatsWorker';
import { useActiveIPContext } from './hooks/useActiveIPContext';

// Lazy-loaded heavy components for code splitting
const dashboardImport = () => import('./components/Dashboard');
const Dashboard = lazyWithRetry(dashboardImport);
void dashboardImport(); // Prefetch so sample→Dashboard transition is instant
const HomeScreen = lazyWithRetry(() => import('./components/HomeScreen'));
const pasteScreenImport = () => import('./components/data/PasteScreen');
const PasteScreen = lazyWithRetry(pasteScreenImport);
const schedulePrefetch = (fn: () => void): void => {
  if (typeof window === 'undefined') return;
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (ric) ric(fn);
  else window.setTimeout(fn, 1500);
};
schedulePrefetch(() => {
  void pasteScreenImport().catch(() => {});
});
const ManualEntry = lazyWithRetry(() => import('./components/data/ManualEntry'));
const WhatIfPage = lazyWithRetry(() => import('./components/WhatIfPage'));
const SettingsPanel = lazyWithRetry(() => import('./components/settings/SettingsPanel'));
const DataTableModal = lazyWithRetry(() => import('./components/data/DataTableModal'));
const FindingsPanel = lazyWithRetry(() => import('./components/FindingsPanel'));
const YamazumiDashboard = lazyWithRetry(() => import('./components/YamazumiDashboard'));
const ProcessIntelligencePanel = lazyWithRetry(
  () => import('./components/ProcessIntelligencePanel')
);
const FrameView = lazyWithRetry(() => import('./components/views/FrameView'));
const ImprovementProjectPanel = lazyWithRetry(() => import('./components/ImprovementProjectPanel'));
const SustainmentPanel = lazyWithRetry(() => import('./components/SustainmentPanel'));
const AnalyzeView = lazyWithRetry(() => import('./components/views/AnalyzeView'));
const ImprovementView = lazyWithRetry(() => import('./components/views/ImprovementView'));
const ProjectsTabView = lazyWithRetry(() => import('./components/ProjectsTabView'));
const ReportView = lazyWithRetry(() => import('./components/views/ReportView'));

const LazyFallback = () => (
  <div className="flex items-center justify-center h-dvh">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

function App() {
  // Popout window route: render standalone FindingsWindow
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'findings') {
    return <FindingsWindow />;
  }
  if (urlParams.get('view') === 'evidence-map') {
    return <EvidenceMapPopout />;
  }

  return (
    <SessionProvider>
      <AppMain />
    </SessionProvider>
  );
}

function AppMain() {
  // ── Session (current Hub + opt-in persistence hydration) ───────────────
  // Mode A.1 (D5): on mount, check the persistence opt-in flag. If set, load
  // the saved Hub-of-one from IndexedDB and seed the session. Otherwise the
  // app stays session-only (default PWA invariant).
  const { hub: sessionHub, setHub: setSessionHub, goalNarrative, setGoalNarrative } = useSession();
  const activeIPContext = useActiveIPContext(sessionHub);
  useEffect(() => {
    let cancelled = false;
    void getOptInFlag().then(async opted => {
      if (!opted || cancelled) return;
      // Load via repository pattern. pwaHubRepository.hubs.list() returns
      // [] or [hub]; no literal ID needed. getOptInFlag stays direct-call —
      // it's a meta-flag read, not a hub-domain mutation.
      const [loaded] = await pwaHubRepository.hubs.list();
      if (loaded && !cancelled) setSessionHub(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [setSessionHub]);

  // ── Zustand store selectors (replaces useDataStateCtx) ──────────────────
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const dataFilename = useProjectStore(s => s.dataFilename);
  const dataQualityReport = useProjectStore(s => s.dataQualityReport);
  const paretoMode = useProjectStore(s => s.paretoMode);
  const separateParetoFilename = useProjectStore(s => s.separateParetoFilename);
  const factors = useProjectStore(s => s.factors);
  const filters = useProjectStore(s => s.filters);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const yamazumiMapping = useProjectStore(s => s.yamazumiMapping);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });
  const processContext = useProjectStore(s => s.processContext);
  const defectMapping = useProjectStore(s => s.defectMapping);

  // Investigation store (domain — questions, hypotheses)
  const questions = useAnalyzeStore(s => s.questions);
  const hypotheses = useAnalyzeStore(s => s.hypotheses);
  const linkFindingToQuestion = useAnalyzeStore(s => s.linkFindingToQuestion);

  // Measurement plans — loaded from IndexedDB for all current hypotheses.
  // Re-loads whenever the hypothesis list changes (new hub added or removed).
  // Passed into WallCanvas planningProps so plan chips stay in sync with
  // the underlying store without requiring a separate Zustand layer.
  const [wallMeasurementPlans, setWallMeasurementPlans] = useState<MeasurementPlan[]>([]);
  const hypothesisIds = useMemo(() => hypotheses.map(h => h.id), [hypotheses]);
  // Key on joined string to avoid re-firing on array reference changes (Fix 5 — plan-load deps)
  const hypothesisIdsKey = hypothesisIds.join('|');
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const all = await Promise.all(
        hypothesisIds.map(id => pwaHubRepository.measurementPlans.listByHypothesis(id))
      );
      if (!cancelled) setWallMeasurementPlans(all.flat());
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hypothesisIdsKey]);

  // Preferences store — question-link prompt opt-out flag
  const skipQuestionLinkPrompt = usePreferencesStore(s => s.skipQuestionLinkPrompt);
  const setSkipQuestionLinkPrompt = usePreferencesStore(s => s.setSkipQuestionLinkPrompt);

  // Project membership store — pending invitations for the Home view banner.
  // PWA is single-user; use 'analyst@local' as the stable per-user key.
  const PWA_MEMBERSHIP_USER_ID = 'analyst@local';
  const pendingInvites = useProjectMembershipStore(s =>
    s.getPendingInvites(PWA_MEMBERSHIP_USER_ID)
  );
  const membershipAcceptInvite = useProjectMembershipStore(s => s.acceptInvite);
  const membershipRevokeInvite = useProjectMembershipStore(s => s.revokeInvite);
  const rehydrateInvites = useProjectMembershipStore(s => s.rehydrateInvites);
  const acceptInvite = (id: string) => membershipAcceptInvite(PWA_MEMBERSHIP_USER_ID, id);
  const revokeInvite = (id: string) => membershipRevokeInvite(PWA_MEMBERSHIP_USER_ID, id);
  useEffect(() => {
    rehydrateInvites(PWA_MEMBERSHIP_USER_ID);
  }, [rehydrateInvites]);

  // Derived hooks (replaces computed state from useDataState)
  const { filteredData } = useFilteredData();
  const lensedSampleCount = useLensedSampleCount();
  const workerApi = useStatsWorker();
  const { stats } = useAnalysisStats(workerApi);

  // Defect mode: compute defect summary for report view
  const isDefectMode = resolveMode(analysisMode) === 'defect';
  const defectResult = useDefectTransform(filteredData, defectMapping, analysisMode);
  const defectSummaryProps = useDefectSummary(isDefectMode ? defectResult : null, defectMapping);

  // ── Zustand store setters (replaces useDataActions) ─────────────────────
  const setRawData = useProjectStore(s => s.setRawData);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const setSpecs = useProjectStore(s => s.setSpecs);
  const setDataFilename = useProjectStore(s => s.setDataFilename);
  const setDataQualityReport = useProjectStore(s => s.setDataQualityReport);
  const setFilters = useProjectStore(s => s.setFilters);
  const setColumnAliases = useProjectStore(s => s.setColumnAliases);
  const clearSelection = useViewStore(s => s.clearSelection);
  const setAnalysisMode = useProjectStore(s => s.setAnalysisMode);
  const setYamazumiMapping = useProjectStore(s => s.setYamazumiMapping);
  const setDisplayOptions = useProjectStore(s => s.setDisplayOptions);
  const setSubgroupConfig = useProjectStore(s => s.setSubgroupConfig);
  const setCpkTarget = useProjectStore(s => s.setCpkTarget);
  const setDefectMapping = useProjectStore(s => s.setDefectMapping);
  const setQuestions = useCallback((qs: Question[]) => {
    useAnalyzeStore.getState().loadAnalyzeState({ questions: qs });
  }, []);

  // Data ingestion must be declared before importFlow since importFlow uses its callbacks.
  // The onWideFormatDetected/onTimeColumnDetected callbacks use importFlow setters,
  // but those are stable React state setters so forward-referencing is safe.
  const ingestion = useDataIngestion({
    onWideFormatDetected: result => {
      importFlowRef.current?.handleWideFormatDetected(result);
    },
    onYamazumiDetected: result => {
      importFlowRef.current?.handleYamazumiDetected(result);
    },
    onDefectDetected: result => {
      importFlowRef.current?.handleDefectDetected(result);
    },
    onTimeColumnDetected: prompt => {
      importFlowRef.current?.setTimeExtractionPrompt(prompt);
      if (prompt.hasTimeComponent) {
        importFlowRef.current?.setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
      }
    },
    getRawData: () => rawData,
    getOutcome: () => outcome,
    getFactors: () => factors,
  });

  const importFlow = usePasteImportFlow({
    rawData,
    outcome,
    factors,
    columnAliases,
    dataFilename,
    dataQualityReport,
    activeHub: sessionHub ?? undefined,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    clearData: ingestion.clearData,
    clearSelection,
    applyTimeExtraction: ingestion.applyTimeExtraction,
  });

  // Ref to allow ingestion callbacks to reach importFlow setters
  const importFlowRef = React.useRef(importFlow);
  importFlowRef.current = importFlow;

  // Panel visibility and UI chrome
  const panels = useAppPanels({
    clearData: ingestion.clearData,
    wideFormatDetection: importFlow.wideFormatDetection,
    dismissWideFormat: importFlow.handleDismissWideFormat,
  });

  // Findings state — useFindings is the CRUD engine, findingsStore holds UI-only state
  const findingsState = useFindings();
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const setHighlightedFindingId = useFindingsStore(s => s.setHighlightedFindingId);

  // Questions + orchestration
  const questionsState = useQuestions({
    initialQuestions: questions,
    onQuestionsChange: setQuestions,
  });

  // Question-driven investigation (ADR-053)
  const resolved = resolveMode(analysisMode ?? 'standard');
  const {
    questions: factorIntelQuestions,
    handleQuestionClick,
    factorRequest,
  } = useQuestionGeneration({
    filteredData: filteredData ?? [],
    outcome,
    factors,
    questionsState,
    mode: resolved,
  });

  // PI Panel: journal entries (session-only; clears on refresh — PWA has no persistence)
  const journalEntries = useJournalEntries({
    findings: findingsState.findings,
    questions: factorIntelQuestions,
  });

  // PI Panel: open question count for badge
  const openQuestionCount = useMemo(
    () =>
      factorIntelQuestions.filter(q => q.status === 'open' || q.status === 'investigating').length,
    [factorIntelQuestions]
  );

  const canvasViewportHubId =
    processContext?.processHubId ??
    sessionHub?.id ??
    (rawData.length > 0 ? DEFAULT_PROCESS_HUB_ID : null);
  useCanvasViewportLifecycle(canvasViewportHubId);

  const investigation = useAnalyzeOrchestration({
    questionsState,
    findingsState: {
      findings: findingsState.findings,
      linkQuestion: findingsState.linkQuestion,
      setFindingStatus: findingsState.setFindingStatus,
      addAction: findingsState.addAction,
    },
    processContext: undefined,
    stats,
  });

  // Stage 5 modal — opens after Mode B Stage 3 confirm and via on-demand button.
  const stageFive = useStageFiveOpener();

  const investigationQuestionsMap = investigation.questionsMap;

  // Mobile tab bar (phone only, <640px)
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('explore');

  // Reset mobile tab and workspace when data is cleared
  useEffect(() => {
    if (rawData.length === 0) {
      setMobileActiveTab('explore');
      panels.showExplore();
      // Mode B: reset Stage 1 narrative gate so the next paste flow re-asks.
      setGoalNarrative(null);
    }
  }, [rawData.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMobileTabChange = useCallback(
    (tab: MobileTab) => {
      setMobileActiveTab(tab);
      if (tab === 'findings') {
        panels.showAnalyze();
      } else if (tab === 'explore') {
        panels.showExplore();
      } else if (tab === 'improve') {
        panels.showImprovement();
      }
      // 'more' is handled by the bottom sheet overlay
    },
    [panels]
  );

  // Capability suggestion modal state
  const [showCapabilitySuggestion, setShowCapabilitySuggestion] = useState(false);
  const [capabilitySuggestionDismissed, setCapabilitySuggestionDismissed] = useState(false);

  // Question-link prompt state (shown after chart observation creates a Finding)
  const [questionLinkPromptOpen, setQuestionLinkPromptOpen] = useState(false);
  const [questionLinkFindingId, setQuestionLinkFindingId] = useState<string>('');

  // Embed mode state
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  const [embedFocusChart, setEmbedFocusChart] = useState<
    'ichart' | 'boxplot' | 'pareto' | 'stats' | null
  >(null);
  const [embedStatsTab, setEmbedStatsTab] = useState<'summary' | 'data' | 'whatif' | null>(null);

  // Embed messaging
  const { highlightedChart, highlightIntensity, notifyChartClicked } =
    useEmbedMessaging(isEmbedMode);

  // Filter navigation
  const filterNav = useFilterNavigation({
    enableHistory: true,
    enableUrlSync: true,
  });

  // Drill path for findings panel footer
  const { drillPath } = useDrillPath(rawData, filterNav.filterStack, outcome, specs);

  // Handle URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sampleKey = params.get('sample');
    const embedParam = params.get('embed');
    const chartParam = params.get('chart');
    const tabParam = params.get('tab');
    const viewParam = params.get('view');

    if (viewParam === 'whatif') {
      panels.setIsWhatIfPageOpen(true);
    }

    if (embedParam === 'true') {
      setIsEmbedMode(true);
    }

    if (chartParam && ['ichart', 'boxplot', 'pareto', 'stats'].includes(chartParam)) {
      setEmbedFocusChart(chartParam as 'ichart' | 'boxplot' | 'pareto' | 'stats');
    }

    if (tabParam && ['summary', 'data', 'whatif'].includes(tabParam)) {
      setEmbedStatsTab(tabParam as 'summary' | 'data' | 'whatif');
    }

    if (sampleKey && rawData.length === 0) {
      const sample = SAMPLES.find(s => s.urlKey === sampleKey);
      if (sample) {
        ingestion.loadSample(sample);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute excluded row data for DataTableModal
  const excludedRowIndices = useMemo(() => {
    if (!dataQualityReport) return undefined;
    return new Set(dataQualityReport.excludedRows.map(r => r.index));
  }, [dataQualityReport]);

  const excludedReasons = useMemo(() => {
    if (!dataQualityReport) return undefined;
    const map = new Map<number, ExclusionReason[]>();
    dataQualityReport.excludedRows.forEach(row => {
      map.set(row.index, row.reasons);
    });
    return map;
  }, [dataQualityReport]);

  // Complement stats for Target Discovery in sidebar
  const isDrilling = Object.keys(filters).length > 0;
  const complementInsight = useMemo(() => {
    if (!isDrilling || !outcome || !filteredData || filteredData.length >= rawData.length)
      return null;
    const filteredSet = new Set(filteredData);
    const compRows = rawData.filter(r => !filteredSet.has(r));
    const values = compRows
      .map(r => toNumericValue(r[outcome]))
      .filter((v): v is number => v !== undefined);
    if (values.length < 2) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev, count: values.length };
  }, [isDrilling, outcome, filteredData, rawData]);

  const centeringOpp = useMemo(() => (stats ? computeCenteringOpportunity(stats) : null), [stats]);

  // Sync complement + drilling state to projection store (sidebar reads from store)
  useEffect(() => {
    useProjectionStore.setState({
      complement: complementInsight,
      isDrilling,
      centeringOpportunity: centeringOpp,
    });
  }, [complementInsight, isDrilling, centeringOpp]);

  // Capability suggestion: show when specs are set and no other detection modal is showing
  useEffect(() => {
    if (
      rawData.length > 0 &&
      (specs?.usl !== undefined || specs?.lsl !== undefined) &&
      (factors.length > 0 || rawData.length >= 10) &&
      !capabilitySuggestionDismissed &&
      !showCapabilitySuggestion &&
      !importFlow.yamazumiDetection &&
      !importFlow.wideFormatDetection &&
      !importFlow.defectDetection
    ) {
      setShowCapabilitySuggestion(true);
    }
  }, [
    rawData.length,
    specs,
    factors.length,
    capabilitySuggestionDismissed,
    showCapabilitySuggestion,
    importFlow.yamazumiDetection,
    importFlow.wideFormatDetection,
    importFlow.defectDetection,
  ]);

  const handleExport = useCallback(async () => {
    const node = document.getElementById('dashboard-export-container');
    if (!node) return;

    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: document.documentElement.dataset.theme === 'dark' ? '#0f172a' : '#f8fafc',
      });
      const link = document.createElement('a');
      link.download = `variscout-analysis-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const filename = `variscout-data-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filteredData, outcome, specs, { filename });
  }, [filteredData, outcome, specs]);

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId]);

  // Findings: pin current filter state (one-click with duplicate detection)
  const handlePinFinding = useCallback(() => {
    const existing = findingsState.findDuplicate(filters);
    if (existing) {
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(existing.id);
      return;
    }
    const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
    const newFinding = findingsState.addFinding('', context);
    panels.setIsFindingsPanelOpen(true);
    setHighlightedFindingId(newFinding.id);
  }, [filters, drillPath, filteredData, outcome, specs, findingsState, panels]);

  // Chart observation: create a Finding with source metadata
  const handleAddChartObservation = useCallback(
    (
      chartType: 'boxplot' | 'pareto' | 'ichart',
      categoryKey?: string,
      _noteText?: string,
      anchorX?: number,
      anchorY?: number
    ) => {
      const source = buildFindingSource(chartType, categoryKey, anchorX, anchorY);
      const existing = findingsState.findDuplicateSource(source);
      if (existing) {
        panels.setIsFindingsPanelOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding('', context, source);
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(newFinding.id);
      // Show question-link prompt unless user opted out
      if (!skipQuestionLinkPrompt) {
        setQuestionLinkFindingId(newFinding.id);
        setQuestionLinkPromptOpen(true);
      }
    },
    [
      filters,
      drillPath,
      filteredData,
      outcome,
      specs,
      findingsState,
      panels,
      skipQuestionLinkPrompt,
    ]
  );

  // Chart findings grouped by chart type for inline annotation display
  const chartFindings = useMemo(
    () => groupFindingsByChart(findingsState.findings),
    [findingsState.findings]
  );

  // Findings: restore filter state AND time lens.
  // Single owner — the parallel useFindingsOrchestration hook was deleted (dead code,
  // never called from PWA). App.tsx is the canonical restore handler for the PWA.
  const handleRestoreFinding = useCallback(
    (id: string) => {
      const finding = findingsState.findings.find(f => f.id === id);
      if (!finding) return;
      // Restore time lens first so chart data is scoped correctly when filters apply.
      if (finding.source?.timeLens) {
        usePreferencesStore.getState().setTimeLens(finding.source.timeLens);
      }
      setFilters(finding.context.activeFilters);
    },
    [findingsState.findings, setFilters]
  );

  // Findings popout: open in separate window
  const popupRef = React.useRef<Window | null>(null);
  const handleOpenFindingsPopout = useCallback(() => {
    popupRef.current = openFindingsPopout(findingsState.findings, columnAliases, drillPath);
  }, [findingsState.findings, columnAliases, drillPath]);

  // Question-link prompt handlers — stable callbacks so QuestionLinkPrompt never
  // re-renders due to inline arrow functions changing identity each render.
  // NOTE: QuestionLinkPrompt already calls onClose() after onLink() and after
  // onSkip()/onSkipForever(), so these handlers must NOT also close the prompt.
  const handleQuestionLink = useCallback(
    (questionId: string) => {
      linkFindingToQuestion(questionLinkFindingId, questionId);
    },
    [questionLinkFindingId, linkFindingToQuestion]
  );

  const handleQuestionSkipForever = useCallback(() => {
    setSkipQuestionLinkPrompt(true);
  }, [setSkipQuestionLinkPrompt]);

  const handleQuestionPromptClose = useCallback(() => {
    setQuestionLinkPromptOpen(false);
  }, []);

  // Mode B: when ColumnMapping confirms, fold the Stage 1 narrative + Stage 3
  // Hub-shaped payload (outcomes, primaryScopeDimensions) into the session Hub
  // so the GoalBanner picks it up immediately. Preserve any pre-existing
  // sessionHub fields (Mode A.1 restore path) by spreading first.
  const handleMappingConfirmWithGoal = useCallback(
    (payload: ColumnMappingConfirmPayload) => {
      // Delegate legacy investigation flow (importFlow still takes the 3-arg form).
      // Derive single-outcome and factors from the Hub-shaped payload.
      const firstOutcome = payload.outcomes[0]?.columnName ?? '';
      const legacyFactors = payload.primaryScopeDimensions;
      const firstSpec = payload.outcomes[0];
      const legacySpecs =
        firstSpec &&
        (firstSpec.target !== undefined ||
          firstSpec.lsl !== undefined ||
          firstSpec.usl !== undefined)
          ? {
              ...(firstSpec.target !== undefined ? { target: firstSpec.target } : {}),
              ...(firstSpec.lsl !== undefined ? { lsl: firstSpec.lsl } : {}),
              ...(firstSpec.usl !== undefined ? { usl: firstSpec.usl } : {}),
            }
          : undefined;
      importFlow.handleMappingConfirm(firstOutcome, legacyFactors, legacySpecs);

      const base = sessionHub ?? {
        id: crypto.randomUUID(),
        name: '',
        createdAt: Date.now(),
        deletedAt: null as null,
      };

      const goalNarrativeForHub = goalNarrative && goalNarrative.trim() ? goalNarrative : undefined;

      setSessionHub({
        ...base,
        ...(goalNarrativeForHub
          ? {
              name: extractHubName(goalNarrativeForHub) || base.name || 'Untitled hub',
              processGoal: goalNarrativeForHub,
            }
          : {}),
        // Wire outcomes + primaryScopeDimensions into the Hub (resolves slice-1 TODO).
        outcomes: payload.outcomes,
        primaryScopeDimensions: payload.primaryScopeDimensions,
        updatedAt: Date.now(),
      });

      // Stage 5 (spec §5.5): open the floating investigation-context modal before
      // the canvas paints so the analyst can capture issue / questions upfront.
      stageFive.openModeB();
    },
    [importFlow, goalNarrative, sessionHub, setSessionHub, stageFive]
  );

  // .vrs import: restore Hub + raw data, skip framing flow, go straight to canvas.
  // Wired to HomeScreen's onImportVrs prop so trainers / returning analysts can
  // reload a packaged scenario without re-pasting data.
  const handleImportVrs = useCallback(
    (imported: import('@variscout/core').VrsFile) => {
      const { hub, rawData: vrsData } = imported;
      setSessionHub(hub);
      // Seed the project store directly — bypasses the paste/mapping flow.
      if (vrsData && vrsData.length > 0) {
        setRawData(vrsData as import('@variscout/core').DataRow[]);
        const firstOutcome = hub.outcomes?.[0]?.columnName;
        if (firstOutcome) setOutcome(firstOutcome);
        const dims = hub.primaryScopeDimensions ?? [];
        if (dims.length > 0) setFactors(dims);
      }
    },
    [setSessionHub, setRawData, setOutcome, setFactors]
  );

  // Phase tab navigation handler (used by AppHeader inline tabs).
  // PhaseId values follow wedge V1 vocabulary (2026-05-27): explore (EDA) / analyze.
  const handlePhaseChange = useCallback(
    (phase: PhaseId) => {
      if (phase === 'home') panels.showHome();
      else if (phase === 'process') panels.showFrame();
      else if (phase === 'explore') panels.showExplore();
      else if (phase === 'analyze') panels.showAnalyze();
      else if (phase === 'improvement') panels.showImprovement();
      else if (phase === 'project') panels.showProjects();
      else panels.showReport();
    },
    [panels]
  );

  // Reverse of handlePhaseChange — maps panelsStore.activeView to the wedge-V1 PhaseId vocabulary.
  const activeViewToPhase = useCallback((view: typeof panels.activeView): PhaseId | undefined => {
    switch (view) {
      case 'home':
        return 'home';
      case 'projects':
        return 'project';
      case 'frame':
        return 'process';
      case 'explore':
        return 'explore';
      case 'analyze':
        return 'analyze';
      case 'improvement':
        return 'improvement';
      case 'report':
        return 'report';
      case 'charter':
      case 'sustainment':
        return undefined; // out-of-phase views — no tab highlighted
      default:
        return undefined;
    }
  }, []);

  // Wall-variant propose-hypothesis CTA
  const wallViewMode = useCanvasViewportStore(s => s.viewMode);
  const createHubFromFinding = useAnalyzeStore(s => s.createHubFromFinding);
  const handleProposeHypothesisFromFinding = useCallback(
    (findingId: string) => {
      createHubFromFinding(findingId);
    },
    [createHubFromFinding]
  );

  // Findings popout: sync data when findings/drillPath change
  useEffect(() => {
    if (!popupRef.current || popupRef.current.closed) return;
    updateFindingsPopout(findingsState.findings, columnAliases, drillPath);
  }, [findingsState.findings, columnAliases, drillPath]);

  // Findings popout: listen for actions from popout window via BroadcastChannel
  const { lastMessage: findingsPopoutMessage } = usePopoutChannel<FindingsActionMessage>({
    windowId: 'main',
  });

  useEffect(() => {
    if (!findingsPopoutMessage || findingsPopoutMessage.type !== 'findings-action') return;
    const action = (findingsPopoutMessage as FindingsActionMessage).payload;
    switch (action.action) {
      case 'edit':
        if (action.text !== undefined) findingsState.editFinding(action.id, action.text);
        break;
      case 'delete':
        findingsState.deleteFinding(action.id);
        break;
      case 'set-status':
        if (action.status) findingsState.setFindingStatus(action.id, action.status);
        break;
      case 'set-tag':
        findingsState.setFindingTag(action.id, action.tag ?? null);
        break;
      case 'add-comment':
        if (action.text !== undefined) findingsState.addFindingComment(action.id, action.text);
        break;
      case 'edit-comment':
        if (action.commentId && action.text !== undefined)
          findingsState.editFindingComment(action.id, action.commentId, action.text);
        break;
      case 'delete-comment':
        if (action.commentId) findingsState.deleteFindingComment(action.id, action.commentId);
        break;
    }
  }, [findingsPopoutMessage, findingsState]);

  const isOnline = useOnlineStatus();
  const selectedOrActiveProjectId = activeIPContext.activeIP?.id ?? panels.selectedProjectId;
  const activeIPScopeLabels = useMemo(
    () =>
      activeIPContext.activeIP
        ? deriveActiveIPScopeLabels(
            activeIPContext.activeIP,
            sessionHub,
            activeIPContext.activeState?.setAt
          )
        : null,
    [activeIPContext.activeIP, activeIPContext.activeState?.setAt, sessionHub]
  );
  const activeIPScope =
    activeIPContext.activeIP && activeIPScopeLabels
      ? {
          title: activeIPContext.activeIP.metadata.title,
          labels: activeIPScopeLabels,
        }
      : null;
  const activeIPLineage = useMemo(
    () => (activeIPContext.activeIP ? deriveActiveIPLineageIds(activeIPContext.activeIP) : null),
    [activeIPContext.activeIP]
  );
  const activeIPLineageFindingIds = useMemo(
    () => new Set(activeIPLineage?.findingIds ?? []),
    [activeIPLineage]
  );
  const activeIPLineageHypothesisIds = useMemo(
    () => new Set(activeIPLineage?.hypothesisIds ?? []),
    [activeIPLineage]
  );
  const scopedFindings = useMemo(
    () =>
      activeIPContext.isIPScoped
        ? findingsState.findings.filter(finding => activeIPLineageFindingIds.has(finding.id))
        : findingsState.findings,
    [activeIPContext.isIPScoped, activeIPLineageFindingIds, findingsState.findings]
  );
  const scopedHypotheses = useMemo(
    () =>
      activeIPContext.isIPScoped
        ? hypotheses.filter(hypothesis => activeIPLineageHypothesisIds.has(hypothesis.id))
        : hypotheses,
    [activeIPContext.isIPScoped, activeIPLineageHypothesisIds, hypotheses]
  );
  const scopedQuestionIds = useMemo(() => {
    if (!activeIPContext.isIPScoped) return null;
    const ids = new Set<string>();
    for (const hypothesis of scopedHypotheses) {
      for (const id of hypothesis.questionIds) ids.add(id);
    }
    for (const finding of scopedFindings) {
      if (finding.questionId) ids.add(finding.questionId);
    }
    return ids;
  }, [activeIPContext.isIPScoped, scopedFindings, scopedHypotheses]);
  const scopedQuestions = useMemo(
    () =>
      scopedQuestionIds
        ? questions.filter(question => scopedQuestionIds.has(question.id))
        : questions,
    [questions, scopedQuestionIds]
  );
  const scopedQuestionsState = useMemo(
    () => (scopedQuestionIds ? { ...questionsState, questions: scopedQuestions } : questionsState),
    [questionsState, scopedQuestionIds, scopedQuestions]
  );
  const scopedFindingsState = useMemo(
    () =>
      activeIPContext.isIPScoped ? { ...findingsState, findings: scopedFindings } : findingsState,
    [activeIPContext.isIPScoped, findingsState, scopedFindings]
  );
  // ── Measurement plan callbacks for WallCanvas planningProps ─────────────
  // PWA uses 'analyst@local' as the single-user identity (no auth).
  const PWA_WALL_USER_ID = 'analyst@local';
  const wallActiveIPMembers = useMemo(
    () => activeIPContext.activeIP?.metadata.members ?? [],
    [activeIPContext.activeIP]
  );
  const wallPlanningProps = useMemo(
    () => ({
      plans: wallMeasurementPlans,
      members: wallActiveIPMembers,
      currentUserId: PWA_WALL_USER_ID,
      onAddPlan: (plan: Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt'>) => {
        const stamped: MeasurementPlan = {
          ...plan,
          id: generateDeterministicId(),
          createdAt: Date.now(),
          deletedAt: null,
        };
        // Optimistic add — roll back on dispatch failure (Fix 6)
        setWallMeasurementPlans(prev => [...prev, stamped]);
        pwaHubRepository
          .dispatch({ kind: 'MEASUREMENT_PLAN_ADD', plan: stamped })
          .catch((err: unknown) => {
            setWallMeasurementPlans(prev => prev.filter(p => p.id !== stamped.id));
            console.error('[wall] Failed to add measurement plan:', err);
          });
      },
      onLinkFinding: (planId: string, findingId: string) => {
        // Capture state before optimistic update so we can roll back on failure (Fix 6)
        setWallMeasurementPlans(prev => {
          const snapshot = prev;
          const next = prev.map(p => {
            if (p.id !== planId) return p;
            const existing = p.linkedFindingIds ?? [];
            // Dedup — prevents fast double-tap phantom rows (Fix 4)
            const updated = existing.includes(findingId) ? existing : [...existing, findingId];
            return { ...p, linkedFindingIds: updated };
          });
          pwaHubRepository
            .dispatch({ kind: 'MEASUREMENT_PLAN_LINK_FINDING', planId, findingId })
            .catch((err: unknown) => {
              setWallMeasurementPlans(snapshot);
              console.error('[wall] Failed to link finding to plan:', err);
            });
          return next;
        });
      },
      onEditPlan: (planId: string) => {
        console.warn(`[wall] Plan edit UI deferred to V2 — planId: ${planId}`);
      },
    }),

    [wallMeasurementPlans, wallActiveIPMembers]
  );

  const activeIPAnalyzeFactorRequest = useMemo(
    () =>
      activeIPContext.isIPScoped && activeIPScopeLabels?.factorLabels[0]
        ? {
            factor: activeIPScopeLabels.factorLabels[0],
            seq: activeIPContext.activeState?.setAt ?? 0,
          }
        : factorRequest,
    [
      activeIPContext.activeState?.setAt,
      activeIPContext.isIPScoped,
      activeIPScopeLabels?.factorLabels,
      factorRequest,
    ]
  );

  useEffect(() => {
    if (panels.activeView !== 'frame' || !sessionHub) return;
    if (activeIPContext.activeIP) {
      const hubId = normalizeProcessHubId(sessionHub.id);
      const focus = deriveActiveIPCanvasFocus(activeIPContext.activeIP, sessionHub);
      useCanvasViewportStore.getState().setLevel(hubId, focus.level, focus.focalStepId);
    }
  }, [activeIPContext.activeIP, panels.activeView, sessionHub]);

  // Sustainment + Handoff inputs for ProjectsTabView → IPDetailPage
  const _liveSustainmentRecords = (sessionHub?.sustainmentRecords ?? []).filter(
    r => r.deletedAt === null
  );
  const _liveControlHandoffs = (sessionHub?.controlHandoffs ?? []).filter(
    h => h.deletedAt === null
  );
  const projectsSustainmentRecord = _liveSustainmentRecords.find(
    r => r.improvementProjectId === selectedOrActiveProjectId
  );
  const projectsControlHandoff = _liveControlHandoffs.find(
    h => h.investigationId === (projectsSustainmentRecord?.investigationId ?? '')
  );
  const projectsClosureInputs = projectsControlHandoff
    ? {
        controlPlanDocumented: false,
        trainingDelivered: Boolean(projectsControlHandoff.signoff?.approvedBy),
        cadenceAssigned: Boolean(projectsSustainmentRecord?.cadence),
        processOwnerAcknowledged: projectsControlHandoff.status !== 'pending',
        trainingRef: projectsControlHandoff.referenceUri,
        cadenceOwner: projectsSustainmentRecord?.owner?.displayName,
      }
    : undefined;

  // Full-page What-If Simulator
  if (panels.isWhatIfPageOpen) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <WhatIfPage
          onBack={() => {
            panels.setIsWhatIfPageOpen(false);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div
      className={`flex flex-col h-dvh bg-surface text-content font-sans selection:bg-blue-500/30${isPhone && rawData.length > 0 ? ' pb-[50px]' : ''}`}
    >
      {/* Offline status banner */}
      {!isOnline && (
        <div
          className="bg-amber-600 text-white text-center text-sm py-1.5 px-4 font-medium"
          role="alert"
        >
          You are offline. Analysis continues to work.
        </div>
      )}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Hide header in embed mode */}
      {!isEmbedMode && (
        <AppHeader
          hasData={rawData.length > 0}
          dataFilename={dataFilename}
          rowCount={rawData.length}
          isFindingsPanelOpen={panels.isFindingsPanelOpen}
          onNewAnalysis={panels.handleResetRequest}
          onToggleFindingsPanel={panels.handleToggleFindingsPanel}
          onOpenDataTable={() => {
            panels.setHighlightRowIndex(null);
            panels.setIsDataTableOpen(true);
          }}
          onExportCSV={handleExportCSV}
          onExportImage={handleExport}
          onOpenSettings={() => panels.setIsSettingsOpen(true)}
          onReset={panels.handleResetRequest}
          onOpenSpecEditor={() => panels.setOpenSpecEditorRequested(true)}
          onOpenWhatIf={rawData.length > 0 ? () => panels.setIsWhatIfPageOpen(true) : undefined}
          isWhatIfOpen={panels.isWhatIfPageOpen}
          isPISidebarOpen={panels.isPISidebarOpen}
          onTogglePISidebar={rawData.length > 0 ? panels.handleTogglePISidebar : undefined}
          activeIPTitle={activeIPContext.activeIP?.metadata.title ?? null}
          onOpenActiveIP={
            activeIPContext.activeIP
              ? () => panels.showProjects(activeIPContext.activeIP!.id)
              : undefined
          }
          onExitActiveIP={() => {
            activeIPContext.clearActiveIP();
            if (panels.activeView === 'projects') panels.showProjects();
          }}
          hideFindings={panels.activeView === 'analyze'}
          activePhase={
            rawData.length > 0 &&
            !importFlow.isPasteMode &&
            !importFlow.isManualEntry &&
            !importFlow.isMapping &&
            panels.activeView !== 'charter' &&
            panels.activeView !== 'sustainment'
              ? activeViewToPhase(panels.activeView)
              : undefined
          }
          onPhaseChange={handlePhaseChange}
        />
      )}

      {/* Reset confirmation modal */}
      {panels.showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-2">Reset Analysis?</h3>
            <p className="text-xs text-content-secondary mb-4">
              All data will be cleared. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => panels.setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={panels.handleResetConfirm}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal banner — surfaces the Hub processGoal when restored from
          opt-in persistence (Mode A.1) or set via the framing layer flow.
          onChange lets the analyst edit the goal inline; updates sessionHub. */}
      {sessionHub?.processGoal ? (
        <GoalBanner
          goal={sessionHub.processGoal}
          onChange={next => {
            setSessionHub({
              ...sessionHub,
              processGoal: next,
              updatedAt: Date.now(),
            });
          }}
        />
      ) : null}

      {/* Canvas framing toolbar — visible when data is loaded and we are on the
          analysis canvas (not in a framing modal). Shows OutcomePin, Save-to-browser,
          .vrs export, and Edit-framing re-entry. */}
      {rawData.length > 0 &&
        !importFlow.isPasteMode &&
        !importFlow.isManualEntry &&
        !importFlow.isMapping &&
        sessionHub && (
          <div
            className="flex items-center gap-2 px-4 py-1.5 bg-surface-secondary border-b border-edge flex-wrap"
            data-testid="framing-toolbar"
          >
            {/* OutcomePin per outcome — one pin per outcome in sessionHub.outcomes.
                Falls back to mean=0/sigma=0 when analysis stats are not yet ready. */}
            {sessionHub.outcomes &&
              sessionHub.outcomes.length > 0 &&
              sessionHub.outcomes.map(outcomeEntry => (
                <OutcomePin
                  key={outcomeEntry.columnName}
                  outcome={outcomeEntry}
                  stats={{
                    mean: stats?.mean ?? 0,
                    sigma: stats?.stdDev ?? 0,
                    n: filteredData?.length ?? rawData.length,
                  }}
                  onAddSpecs={_col => importFlow.openFactorManager()}
                />
              ))}
            <div className="flex-1" />
            <button
              type="button"
              onClick={stageFive.openOnDemand}
              data-testid="canvas-new-analyze"
              className="text-xs px-2 py-1 rounded border border-edge text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
            >
              + New investigation
            </button>
            <SaveToBrowserButton currentHub={sessionHub} />
            <VrsExportButton currentHub={sessionHub} currentData={rawData} />
            <button
              type="button"
              className="text-xs px-2 py-1 rounded border border-edge text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              onClick={importFlow.openFactorManager}
              data-testid="edit-framing-button"
            >
              Edit framing
            </button>
          </div>
        )}

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-hidden relative flex">
        {/* Stats Sidebar (left) */}
        {panels.isPISidebarOpen && rawData.length > 0 && outcome && (
          <div className="hidden lg:flex flex-col w-80 flex-shrink-0 border-r border-edge bg-surface-secondary overflow-y-auto">
            <Suspense fallback={null}>
              <ProcessIntelligencePanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
                cpkTarget={cpkTarget}
                renderQuestionsTab={() => (
                  <QuestionsTabView
                    questions={factorIntelQuestions}
                    findings={findingsState.findings}
                    currentUnderstanding={processContext?.currentUnderstanding}
                    onQuestionClick={handleQuestionClick}
                    evidenceLabel={getStrategy(resolved).questionStrategy.evidenceLabel}
                  />
                )}
                renderJournalTab={() => <JournalTabView entries={journalEntries} />}
                openQuestionCount={openQuestionCount}
              />
            </Suspense>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Suspense fallback={<LazyFallback />}>
            {importFlow.isPasteMode ? (
              <PasteScreen
                onAnalyze={importFlow.handlePasteAnalyze}
                onCancel={importFlow.handlePasteCancel}
                error={importFlow.pasteError}
              />
            ) : importFlow.isManualEntry ? (
              <ManualEntry
                onAnalyze={importFlow.handleManualDataAnalyze}
                onCancel={importFlow.handleManualEntryCancel}
              />
            ) : rawData.length === 0 ? (
              <HomeScreen
                onLoadSample={ingestion.loadSample}
                onOpenPaste={importFlow.handleOpenPaste}
                onOpenManualEntry={importFlow.handleOpenManualEntry}
                onImportVrs={handleImportVrs}
                resolveProjectName={id =>
                  (sessionHub?.improvementProjects ?? []).find(p => p.id === id)?.metadata.title
                }
              />
            ) : panels.activeView === 'home' ? (
              <div className="h-full overflow-auto p-4 sm:p-6">
                <PendingInvitesBanner
                  invites={pendingInvites}
                  onAccept={acceptInvite}
                  onDecline={revokeInvite}
                  resolveProjectName={id =>
                    (sessionHub?.improvementProjects ?? []).find(p => p.id === id)?.metadata.title
                  }
                />
                <ActiveIPLaunchpadCard
                  projects={(sessionHub?.improvementProjects ?? []).filter(
                    project => project.deletedAt === null
                  )}
                  activeProjectId={activeIPContext.activeIP?.id ?? null}
                  onSelectIP={projectId => {
                    activeIPContext.setActiveIP(projectId);
                    panels.showProjects(projectId);
                  }}
                  onExitIP={() => activeIPContext.clearActiveIP()}
                  onStartNewIP={panels.showCharter}
                />
              </div>
            ) : importFlow.isMapping && goalNarrative === null ? (
              // Mode B Stage 1: ask for the process goal narrative before
              // showing ColumnMapping. The sentinel pattern (null = unasked,
              // '' = skipped, string = provided) lets us gate exactly once
              // per import. ColumnMapping internals are unchanged in slice 1.
              <div className="max-w-2xl mx-auto p-6 w-full">
                <HubGoalForm
                  onConfirm={narrative => setGoalNarrative(narrative)}
                  onSkip={() => setGoalNarrative('')}
                />
              </div>
            ) : importFlow.isMapping ? (
              <ColumnMapping
                columnAnalysis={importFlow.mappingColumnAnalysis}
                availableColumns={Object.keys(rawData[0])}
                previewRows={rawData.slice(0, 5)}
                totalRows={rawData.length}
                columnAliases={columnAliases}
                onColumnRename={importFlow.handleColumnRename}
                initialOutcome={outcome}
                initialFactors={factors}
                initialOutcomes={
                  importFlow.isMappingReEdit ? (sessionHub?.outcomes ?? undefined) : undefined
                }
                initialPrimaryScopeDimensions={
                  importFlow.isMappingReEdit
                    ? (sessionHub?.primaryScopeDimensions ?? undefined)
                    : undefined
                }
                datasetName={dataFilename || undefined}
                onConfirm={handleMappingConfirmWithGoal}
                onCancel={importFlow.handleMappingCancel}
                dataQualityReport={dataQualityReport}
                onViewExcludedRows={panels.openDataTableExcluded}
                onViewAllData={panels.openDataTableAll}
                paretoMode={paretoMode}
                separateParetoFilename={separateParetoFilename}
                onParetoFileUpload={ingestion.handleParetoFileUpload}
                onClearParetoFile={ingestion.clearParetoFile}
                timeColumn={importFlow.timeExtractionPrompt?.timeColumn}
                hasTimeComponent={importFlow.timeExtractionPrompt?.hasTimeComponent}
                onTimeExtractionChange={importFlow.setTimeExtractionConfig}
                mode={importFlow.isMappingReEdit ? 'edit' : 'setup'}
                suggestedStack={importFlow.suggestedStack}
                onStackConfigChange={importFlow.handleStackConfigChange}
                rowLimit={50000}
                hideSpecs={analysisMode === 'defect'}
              />
            ) : panels.activeView === 'frame' ? (
              <div className="flex min-h-0 flex-1 flex-col">
                {activeIPScope ? (
                  <ActiveIPScopeRibbon
                    title={activeIPScope.title}
                    labels={activeIPScope.labels}
                    surface="Process"
                  />
                ) : null}
                <FrameView />
              </div>
            ) : panels.activeView === 'charter' ? (
              <ImprovementProjectPanel
                activeHub={sessionHub ?? undefined}
                onBack={panels.showFrame}
                onOpenWall={() => {
                  useCanvasViewportStore.getState().setViewMode('wall');
                  panels.showAnalyze();
                }}
              />
            ) : panels.activeView === 'sustainment' ? (
              <SustainmentPanel
                activeHub={sessionHub ?? undefined}
                targetId={panels.sustainmentTargetId ?? undefined}
                onBack={panels.showFrame}
              />
            ) : panels.activeView === 'analyze' ? (
              <AnalyzeView
                activeIPScope={activeIPScope}
                activeIPLineage={activeIPLineage}
                canvasViewportHubId={normalizeProcessHubId(canvasViewportHubId)}
                filteredData={filteredData ?? []}
                outcome={outcome}
                factors={factors}
                findingsState={scopedFindingsState}
                handleRestoreFinding={handleRestoreFinding}
                handleSetFindingStatus={investigation.handleSetFindingStatus}
                drillPath={drillPath}
                questionsState={scopedQuestionsState}
                handleCreateQuestion={investigation.handleCreateQuestion}
                factorIntelQuestions={factorIntelQuestions}
                handleQuestionClick={handleQuestionClick}
                columnAliases={columnAliases}
                resolvedMode={resolved}
                questionsMap={investigation.questionsMap}
                ideaImpacts={investigation.ideaImpacts}
                planningProps={wallPlanningProps}
              />
            ) : panels.activeView === 'projects' ? (
              <ProjectsTabView
                activeHub={sessionHub ?? undefined}
                selectedProjectId={selectedOrActiveProjectId}
                onSelectProject={id => {
                  if (id === '') {
                    activeIPContext.clearActiveIP();
                    panels.showProjects();
                    return;
                  }
                  activeIPContext.setActiveIP(id);
                  panels.showProjects(id);
                }}
                onJumpOut={target => {
                  if (target === 'analyze') panels.showAnalyze();
                  else if (target === 'explore') panels.showExplore();
                  else if (target === 'process') panels.showFrame();
                  else if (target === 'improve-workbench') panels.showImprovement();
                  else if (target === 'report') panels.showReport();
                }}
                approachInputs={{
                  hypotheses,
                  ideas: questions.flatMap(q => q.ideas ?? []),
                  actions: findingsState.findings.flatMap(f => f.actions ?? []),
                }}
                onOpenCauseWorkbench={_cause => {
                  // V1: jump to Improve tab (legacy PDCA workbench).
                  // Plan 2 will add IP-context scoping so the workbench filters
                  // to this cause's hypothesis automatically.
                  panels.showImprovement();
                }}
                sustainmentRecord={projectsSustainmentRecord}
                controlHandoff={projectsControlHandoff}
                closureInputs={projectsClosureInputs}
                onOpenLegacySustainment={() =>
                  usePanelsStore
                    .getState()
                    .showSustainment(projectsSustainmentRecord?.investigationId ?? undefined)
                }
                onNudgeProcessOwner={() => {
                  // Plan 3 will emit EngagementEvent webhook here.
                  console.info('[handoff] Nudge process owner — Plan 3 will wire EngagementEvent');
                }}
                onProjectPatch={(projectId, patch) => {
                  void pwaHubRepository
                    .dispatch({ kind: 'IMPROVEMENT_PROJECT_UPDATE', projectId, patch })
                    .catch(error => {
                      console.error(
                        '[projects] Failed to persist Improvement Project patch',
                        error
                      );
                    });
                }}
                onNudgeSignoff={projectId => {
                  console.info(
                    `[projects] Nudge signoff for ${projectId} — EngagementEvent webhook boundary`
                  );
                }}
                onStartNewProject={panels.showCharter}
              />
            ) : panels.activeView === 'improvement' ? (
              <ImprovementView
                activeIPScope={activeIPScope}
                activeIP={activeIPContext.activeIP ?? null}
                onGoHome={panels.showHome}
              />
            ) : panels.activeView === 'report' ? (
              <ReportView
                onClose={panels.showExplore}
                stats={stats}
                specs={specs}
                findings={findingsState.findings}
                questions={questionsState.questions}
                columnAliases={columnAliases}
                dataFilename={dataFilename}
                sampleCount={lensedSampleCount}
                analysisMode={analysisMode}
                filteredData={filteredData}
                outcome={outcome}
                hub={sessionHub}
                activeIP={activeIPContext.activeIP}
                hypotheses={hypotheses}
                sustainmentRecords={_liveSustainmentRecords}
                controlHandoffs={_liveControlHandoffs}
                activeIPScope={activeIPScope}
                activeIPTitle={activeIPContext.activeIP?.metadata.title ?? null}
                onOpenActiveIP={
                  activeIPContext.activeIP
                    ? () => panels.showProjects(activeIPContext.activeIP!.id)
                    : undefined
                }
                onExitActiveIP={() => {
                  activeIPContext.clearActiveIP();
                }}
                defectSummary={
                  defectSummaryProps
                    ? {
                        ...defectSummaryProps,
                        sampleCount: lensedSampleCount,
                      }
                    : null
                }
              />
            ) : resolveMode(analysisMode) === 'yamazumi' && yamazumiMapping ? (
              <Suspense fallback={null}>
                <YamazumiDashboard
                  mapping={yamazumiMapping}
                  onBarClick={key =>
                    filterNav.applyFilter({
                      type: 'filter',
                      source: 'pareto',
                      factor: yamazumiMapping.stepColumn,
                      values: [key],
                    })
                  }
                  onTaktTimeChange={taktTime =>
                    setYamazumiMapping({ ...yamazumiMapping, taktTime })
                  }
                />
              </Suspense>
            ) : (
              <Dashboard
                onPointClick={panels.openDataTableAtRow}
                hideStatsInGrid={panels.isPISidebarOpen}
                onExportCSV={handleExportCSV}
                onExportImage={handleExport}
                highlightedChart={highlightedChart}
                highlightIntensity={highlightIntensity}
                onChartClick={isEmbedMode ? notifyChartClicked : undefined}
                embedFocusChart={embedFocusChart}
                embedStatsTab={embedStatsTab}
                onManageFactors={importFlow.openFactorManager}
                openSpecEditorRequested={panels.openSpecEditorRequested}
                onSpecEditorOpened={() => panels.setOpenSpecEditorRequested(false)}
                highlightedPointIndex={panels.highlightedChartPoint}
                filterNav={filterNav}
                onPinFinding={handlePinFinding}
                requestedFactor={activeIPAnalyzeFactorRequest}
                activeIPScope={activeIPScope}
                findingsCallbacks={{
                  onAddChartObservation: handleAddChartObservation,
                  chartFindings,
                  onEditFinding: findingsState.editFinding,
                  onDeleteFinding: findingsState.deleteFinding,
                }}
                findings={findingsState.findings}
              />
            )}
          </Suspense>
        </div>

        {/* Findings Panel (inline desktop, or mobile when findings tab active) */}
        {/* Hidden when in investigation workspace — the workspace IS the findings view */}
        <Suspense fallback={null}>
          {panels.activeView !== 'investigation' &&
            (panels.isDesktop || (isPhone && mobileActiveTab === 'findings')) &&
            outcome && (
              <FindingsPanel
                isOpen={panels.isDesktop ? panels.isFindingsPanelOpen : true}
                onClose={() => {
                  if (isPhone) {
                    setMobileActiveTab('explore');
                  }
                  panels.handleCloseFindingsPanel();
                  setHighlightedFindingId(null);
                }}
                findings={findingsState.findings}
                onEditFinding={findingsState.editFinding}
                onDeleteFinding={findingsState.deleteFinding}
                onRestoreFinding={handleRestoreFinding}
                onSetFindingStatus={investigation.handleSetFindingStatus}
                onSetFindingTag={findingsState.setFindingTag}
                onAddComment={(id, text) => findingsState.addFindingComment(id, text)}
                onEditComment={findingsState.editFindingComment}
                onDeleteComment={findingsState.deleteFindingComment}
                columnAliases={columnAliases}
                drillPath={drillPath}
                activeFindingId={highlightedFindingId}
                onPopout={handleOpenFindingsPopout}
                maxStatuses={3}
                onCreateQuestion={investigation.handleCreateQuestion}
                questionsMap={investigationQuestionsMap}
                questions={factorIntelQuestions}
                evidenceLabel={getStrategy(resolved).questionStrategy.evidenceLabel}
                onQuestionClick={handleQuestionClick}
              />
            )}
        </Suspense>
      </main>

      {/* Settings Panel (slide-in from right) */}
      <Suspense fallback={null}>
        <SettingsPanel
          isOpen={panels.isSettingsOpen}
          onClose={() => panels.setIsSettingsOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DataTableModal
          isOpen={panels.isDataTableOpen}
          onClose={panels.handleCloseDataTable}
          highlightRowIndex={panels.highlightRowIndex ?? undefined}
          showExcludedOnly={panels.showExcludedOnly}
          excludedRowIndices={excludedRowIndices}
          excludedReasons={excludedReasons}
        />
      </Suspense>

      {/* Hide footer in embed mode */}
      {!isEmbedMode && (
        <AppFooter filteredCount={filteredData.length} totalCount={rawData.length} />
      )}

      {/* Wide Format Detection — Performance Mode */}
      {importFlow.wideFormatDetection && (
        <PerformanceDetectedModal
          detection={importFlow.wideFormatDetection}
          onEnable={(_columns, _label) => {
            setAnalysisMode('performance');
            importFlow.handleDismissWideFormat();
          }}
          onDecline={importFlow.handleDismissWideFormat}
        />
      )}

      {/* Yamazumi Detection Modal */}
      {importFlow.yamazumiDetection && (
        <YamazumiDetectedModal
          detection={importFlow.yamazumiDetection}
          onEnable={taktTime => {
            const m = importFlow.yamazumiDetection!.suggestedMapping;
            setAnalysisMode('yamazumi');
            setYamazumiMapping({
              activityTypeColumn: m.activityTypeColumn!,
              cycleTimeColumn: m.cycleTimeColumn!,
              stepColumn: m.stepColumn!,
              activityColumn: m.activityColumn,
              reasonColumn: m.reasonColumn,
              productColumn: m.productColumn,
              waitTimeColumn: m.waitTimeColumn,
              taktTime,
            });
            importFlow.handleDismissYamazumi();
          }}
          onDecline={() => importFlow.handleDismissYamazumi()}
        />
      )}

      {/* Defect Detection Modal */}
      {importFlow.defectDetection && (
        <DefectDetectedModal
          detection={importFlow.defectDetection}
          columnNames={rawData.length > 0 ? Object.keys(rawData[0]) : []}
          onEnable={mapping => {
            setAnalysisMode('defect');
            setDefectMapping(mapping);
            importFlow.handleDismissDefect();
          }}
          onDismiss={importFlow.handleDismissDefect}
        />
      )}

      {/* Match Summary Card — Mode A.2 paste into existing complete Hub.
          Rendered inline (not over a backdrop) per spec. */}
      {importFlow.matchSummary &&
        (() => {
          const hubCols: readonly string[] = sessionHub?.outcomes?.map(o => o.columnName) ?? [];
          const newCols = importFlow.matchSummary.newColumns;
          const columnShape: ColumnShape = {
            matched: newCols.filter(c => hubCols.includes(c)),
            added: newCols.filter(c => !hubCols.includes(c)),
            missing: (hubCols as string[]).filter(c => !newCols.includes(c)),
          };
          return (
            <div className="fixed bottom-4 right-4 z-40 w-full max-w-2xl px-4">
              <MatchSummaryCard
                classification={importFlow.matchSummary.classification}
                columnShape={columnShape}
                onChoose={importFlow.acceptMatchSummary}
                onCancel={importFlow.cancelMatchSummary}
              />
            </div>
          );
        })()}

      {/* Capability Suggestion Modal */}
      {showCapabilitySuggestion && (
        <CapabilitySuggestionModal
          onStartCapability={config => {
            setDisplayOptions({ ...displayOptions, standardIChartMetric: 'capability' });
            setSubgroupConfig(config);
            setShowCapabilitySuggestion(false);
            setCapabilitySuggestionDismissed(true);
          }}
          onStartStandard={() => {
            setShowCapabilitySuggestion(false);
            setCapabilitySuggestionDismissed(true);
          }}
          factorColumns={factors}
          dataFilename={dataFilename}
          outcome={outcome}
          rowCount={rawData.length}
          specs={specs}
          stats={stats}
          cpkTarget={cpkTarget}
          onSpecsChange={setSpecs}
          onCpkTargetChange={setCpkTarget}
        />
      )}

      {/* Question-Link Prompt — shown after chart observation creates a Finding */}
      <QuestionLinkPrompt
        isOpen={questionLinkPromptOpen}
        findingId={questionLinkFindingId}
        questions={factorIntelQuestions}
        onLink={handleQuestionLink}
        onSkip={handleQuestionPromptClose}
        onSkipForever={handleQuestionSkipForever}
        onClose={handleQuestionPromptClose}
        wallActive={wallViewMode === 'wall'}
        onProposeHypothesis={handleProposeHypothesisFromFinding}
      />

      {/* Stage 5 modal — investigation context capture.
          Opens after Mode B Stage 3 confirm (openModeB) and via on-demand button
          on the canvas chrome (openOnDemand). Does NOT log brief contents to console
          or any analytics — contents are PII (process issue / questions). */}
      <StageFiveModal
        open={stageFive.open}
        mode={stageFive.mode}
        onOpenInvestigation={brief => {
          // Persist issueStatement + questions from the brief into the investigation.
          // PWA has no AnalysisBrief field on processContext (session-only store);
          // we wire questions via questionsState.addQuestion (the domain store setter).
          // issueStatement is logged as a first question with a sentinel prefix so it
          // is visible in the Questions panel — a dedicated issueStatement field on
          // the domain store is deferred to a later slice.
          if (brief.issueStatement) {
            questionsState.addQuestion(brief.issueStatement);
          }
          if (brief.questions) {
            for (const q of brief.questions) {
              questionsState.addQuestion(q.text, q.factor, q.level);
            }
          }
          // TODO slice 4: persist brief.hypothesisDraft to investigation as a draft Hypothesis entity.
          // TODO (slice 4): wire brief.target into processContext once PWA gains a
          // processContext or equivalent improvement-target store field.
          stageFive.close();
        }}
        onSkip={stageFive.close}
        onClose={stageFive.close}
      />

      {/* Mobile Tab Bar (phone only) */}
      {isPhone && rawData.length > 0 && (
        <MobileTabBar
          activeTab={mobileActiveTab}
          onTabChange={handleMobileTabChange}
          findingsCount={findingsState.findings.length}
          showImproveTab={true}
        />
      )}

      {/* More bottom sheet (phone only) */}
      {mobileActiveTab === 'more' && isPhone && rawData.length > 0 && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileActiveTab('explore')}
          />
          <div className="fixed bottom-[50px] left-0 right-0 bg-surface-primary border-t border-edge rounded-t-2xl z-50 animate-slide-up safe-area-bottom">
            <div className="py-2">
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('explore');
                  panels.showReport();
                }}
              >
                <FileText size={18} className="text-content-secondary" />
                Report
              </button>
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('explore');
                  panels.setIsWhatIfPageOpen(true);
                }}
              >
                <Beaker size={18} className="text-content-secondary" />
                What-If Simulator
              </button>
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('explore');
                  panels.setIsSettingsOpen(true);
                }}
              >
                <Settings size={18} className="text-content-secondary" />
                Settings
              </button>
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('explore');
                  handleExportCSV();
                }}
              >
                <Download size={18} className="text-content-secondary" />
                Export CSV
              </button>
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('explore');
                  panels.setHighlightRowIndex(null);
                  panels.setIsDataTableOpen(true);
                }}
              >
                <Table2 size={18} className="text-content-secondary" />
                Data Table
              </button>
              <div className="border-t border-edge my-1" />
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-red-400 hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('explore');
                  panels.handleResetRequest();
                }}
              >
                <RotateCcw size={18} />
                New Analysis
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
