import React, { Suspense, useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { downloadCSV } from './lib/export';
import { lazyWithRetry } from './lib/chunkReload';
import {
  landOnProcess,
  landVrsOnProcess,
  landManualOnProcess,
  landPasteOnProcess,
  provisionPasteProject,
} from './lib/landing';
import { useFilterNavigation } from './hooks/useFilterNavigation';
import {
  type ColumnMappingConfirmPayload,
  FindingsWindow,
  openFindingsPopout,
  updateFindingsPopout,
  MobileTabBar,
  type MobileTab,
  useIsMobile,
  BREAKPOINTS,
  JournalTabView,
  GoalBanner,
  OutcomePin,
  StageFiveModal,
  MatchSummaryCard,
  deriveWorkspaceProjectCanvasFocus,
  deriveWorkspaceProjectScopeLabels,
  DurabilityNudge,
  type ColumnShape,
  type ChartObservationCaptureOptions,
} from '@variscout/ui';
import { useStageFiveOpener } from './hooks/useStageFiveOpener';
import { SessionProvider, useSession } from './store/sessionStore';
import { pwaHubRepository } from './persistence';
import { generateDeterministicId } from '@variscout/core/identity';
import type { MeasurementPlan, MeasurementPlanStatus } from '@variscout/core/measurementPlan';
import type { ReingestPendingMatch } from '@variscout/core/autoLink';
import { Beaker, Settings, Download, Table2, RotateCcw, FileText } from 'lucide-react';
import {
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
  useReingestAutoLink,
  matchActiveScopeIdByLeaves,
} from '@variscout/hooks';
import type { FindingsActionMessage } from '@variscout/hooks';
import {
  useProjectStore,
  useAnalyzeStore,
  usePreferencesStore,
  useCanvasViewportStore,
  useViewStore,
  useProjectMembershipStore,
  useAnalysisScopeStore,
  useImprovementProjectStore,
  buildDocumentSnapshotVrs,
  type DocumentSnapshotVrsFile,
} from '@variscout/stores';
import { createProjectActionItem } from '@variscout/core/findings';
import { reduceActionItems, type ActionItemAction } from '@variscout/core/actions';
import AppHeader, { type PhaseId } from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import { useDataIngestion } from './hooks/useDataIngestion';
import { useEmbedMessaging } from './hooks/useEmbedMessaging';
import { SAMPLES, type SampleDataset } from '@variscout/data';
import {
  DEFAULT_PROCESS_HUB_ID,
  normalizeProcessHubId,
  type ExclusionReason,
  type ImprovementIdea,
  type DisconfirmationAttempt,
  type HypothesisStatus,
  toNumericValue,
  extractHubName,
  parseMentions,
  findDuplicateFinding,
  findDuplicateBySource,
  applyFilters,
} from '@variscout/core';
import { resolveMode } from '@variscout/core/strategy';
import { resolveCpkTarget } from '@variscout/core/capability';
import { computeCenteringOpportunity } from '@variscout/core/variation';
import { usePasteImportFlow } from './hooks/usePasteImportFlow';
import { EvidenceMapPopout } from './components/EvidenceMapPopout';
import { useAppPanels } from './hooks/useAppPanels';
import { useFindingsStore, groupFindingsByChart } from './features/findings/findingsStore';
import { useProjectionStore } from './features/projection/projectionStore';
import { useAnalyzeOrchestration } from './features/analyze/useAnalyzeOrchestration';
import { useCanvasViewportLifecycle } from './features/analyze/useCanvasViewportLifecycle';
import { useStatsWorker } from './workers/useStatsWorker';
import { deriveWorkspaceViewModel, useWorkspaceProjectContext } from '@variscout/hooks';
import { AppViewSwitch } from './components/AppViewSwitch';

// Lazy-loaded heavy components for code splitting
const dashboardImport = () => import('./components/Dashboard');
void dashboardImport(); // Prefetch so sample→Dashboard transition is instant
const pasteScreenImport = () => import('./components/data/PasteScreen');
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
const WhatIfPage = lazyWithRetry(() => import('./components/WhatIfPage'));
const SettingsPanel = lazyWithRetry(() => import('./components/settings/SettingsPanel'));
const DataTableModal = lazyWithRetry(() => import('./components/data/DataTableModal'));
const FindingsPanel = lazyWithRetry(() => import('./components/FindingsPanel'));
const ProcessIntelligencePanel = lazyWithRetry(
  () => import('./components/ProcessIntelligencePanel')
);

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
  // ── Session (current Hub) ───────────────────────────────────────────────
  // PWA durability is export-only: startup never hydrates an IndexedDB
  // documentSnapshot. Analysts restore work explicitly from .vrs on Home.
  const { hub: sessionHub, setHub: setSessionHub } = useSession();
  const workspaceProjectContext = useWorkspaceProjectContext(sessionHub);
  const scopeYColumn = useAnalysisScopeStore(s => s.yColumn);
  const scopeBoxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const scopeStepId = useAnalysisScopeStore(s => s.stepId);
  const scopeCategoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const scopeConditionLeaves = useAnalysisScopeStore(s => s.conditionLeaves);
  const workspaceAnalysisScope = useMemo(
    () => ({
      yColumn: scopeYColumn,
      boxplotFactor: scopeBoxplotFactor,
      stepId: scopeStepId,
      categoricalFilters: scopeCategoricalFilters,
      conditionLeaves: scopeConditionLeaves,
    }),
    [scopeBoxplotFactor, scopeCategoricalFilters, scopeConditionLeaves, scopeStepId, scopeYColumn]
  );
  const workspaceViewModel = useMemo(
    () =>
      deriveWorkspaceViewModel({
        hub: sessionHub,
        project: workspaceProjectContext.workspaceProject ?? sessionHub?.improvementProject,
        analysisScope: workspaceAnalysisScope,
      }),
    [workspaceProjectContext.workspaceProject, sessionHub, workspaceAnalysisScope]
  );
  const workspaceProjectTitle = workspaceViewModel?.project.title ?? null;
  const wallViewMode = useCanvasViewportStore(s => s.viewMode);

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
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });
  const processContext = useProjectStore(s => s.processContext);
  const defectMapping = useProjectStore(s => s.defectMapping);

  // Investigation store (domain — hypotheses). IM-1: Question entity retired.
  const hypotheses = useAnalyzeStore(s => s.hypotheses);

  // Measurement plans — loaded from IndexedDB for all current hypotheses.
  // Re-loads whenever the hypothesis list changes (new hub added or removed) OR when
  // planLoadNonce bumps. Post-CS-11 the nonce is bumped from the analyst's MANUAL
  // plan writes (onSetPlanStatus + onLinkFinding) so the Wall reflects the advanced
  // plan status without a hypothesis-list change; the re-ingest cascade no longer
  // writes plans, so it no longer drives the nonce.
  // Passed into WallCanvas planningProps so plan chips stay in sync with
  // the underlying store without requiring a separate Zustand layer.
  const [wallMeasurementPlans, setWallMeasurementPlans] = useState<MeasurementPlan[]>([]);
  const [planLoadNonce, setPlanLoadNonce] = useState(0);
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
  }, [hypothesisIdsKey, planLoadNonce]);

  // PR-CS-11: re-ingest confirm prompt (shared engine with Azure; idempotent). On
  // re-ingest the cascade matches newly-available columns to MeasurementPlans and
  // SURFACES pending-match descriptors (it writes NOTHING). "Hints navigate, chips
  // apply." — the Wall chip is the single apply surface; the analyst's manual writes
  // (onSetPlanStatus / onLinkFinding below) fire the plan-load nonce. Dismiss is
  // session-only.
  const [pendingMatches, setPendingMatches] = useState<ReingestPendingMatch[]>([]);
  const [dismissedMatchIds, setDismissedMatchIds] = useState<Set<string>>(() => new Set());
  // Latest dismissed-id set, read inside onPendingMatches without re-subscribing the hook.
  const dismissedMatchIdsRef = useRef(dismissedMatchIds);
  dismissedMatchIdsRef.current = dismissedMatchIds;
  useReingestAutoLink(pwaHubRepository, {
    onPendingMatches: (matches: ReingestPendingMatch[]) => {
      const dismissed = dismissedMatchIdsRef.current;
      setPendingMatches(prev => {
        const byId = new Map(prev.map(m => [m.id, m]));
        for (const m of matches) {
          if (!dismissed.has(m.id)) byId.set(m.id, m);
        }
        return Array.from(byId.values());
      });
    },
  });

  // Group the live (non-dismissed) pending matches by planId for the Wall chips.
  const pendingMatchByPlanId = useMemo(() => {
    const map: Record<string, { id: string; column: string }> = {};
    for (const m of pendingMatches) {
      if (dismissedMatchIds.has(m.id)) continue;
      map[m.planId] = { id: m.id, column: m.column };
    }
    return map;
  }, [pendingMatches, dismissedMatchIds]);

  // Drop every pending match whose plan id matches (a status/link action handles it).
  const clearPendingMatchesForPlan = useCallback((planId: string) => {
    setPendingMatches(prev => prev.filter(m => m.planId !== planId));
  }, []);

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
  const setDefectMapping = useProjectStore(s => s.setDefectMapping);
  const setMeasureColumns = useProjectStore(s => s.setMeasureColumns);
  const setMeasureLabel = useProjectStore(s => s.setMeasureLabel);
  const setSelectedMeasure = useProjectStore(s => s.setSelectedMeasure);
  // IM-1: addIdea (keyed by hypothesisId) is not read here — the PWA ideas surface
  // was the Question-driven FindingsLog/ImprovementIdeasSection path that IM-1
  // dismantled; its hypothesisId-keyed replacement (ImprovementIdeasSection in
  // @variscout/ui) is not yet mounted in AnalyzeView. Wiring it lands in IM-4/IM-5.
  // The `scopes` slice is persisted by PwaHubRepository reading the store directly,
  // so no local read is needed here either.

  // Data ingestion must be declared before importFlow since importFlow uses its callbacks.
  // The onWideFormatDetected/onTimeColumnDetected callbacks use importFlow setters,
  // but those are stable React state setters so forward-referencing is safe.
  const ingestion = useDataIngestion({
    onWideFormatDetected: result => {
      importFlowRef.current?.handleWideFormatDetected(result);
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
    // FSJ-2 walk: read LIVE store state, not render-scope values. The landing
    // branch calls applyTimeExtraction synchronously right after setRawData(...),
    // within the same event tick — render-scope `rawData` is still the pre-paste
    // array there, so applyTimeExtraction's `rawData.length === 0` guard would
    // early-return and the quiet-tier auto-extraction would silently no-op.
    // getState() returns the just-written rows. (The wizard path fired on a later
    // tick, so its behavior is unchanged — this is strictly more correct there too.)
    getRawData: () => useProjectStore.getState().rawData,
    getOutcome: () => useProjectStore.getState().outcome,
    getFactors: () => useProjectStore.getState().factors,
  });

  // FSJ-2: showFrame is declared on `panels` which is created below (after importFlow,
  // because panels depends on importFlow). A ref lets onFreshPasteLanded read the
  // stable, always-current showFrame without forward-referencing a const across a
  // temporal dead zone. Pattern mirrors importFlowRef above.
  // Safe: onFreshPasteLanded cannot fire until user interaction, which cannot happen
  // before the first render completes — by then showFrameRef.current is populated.
  // The ?.() at the call site is a TypeScript guard for the initial null type, not a
  // live null-deref risk. Do NOT "simplify" to a direct panels.showFrame reference.
  const showFrameRef = React.useRef<(() => void) | null>(null);

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
    clearSelection,
    applyTimeExtraction: ingestion.applyTimeExtraction,
    // FSJ-2: measurement-shaped paste landed without the mapping vestibule — ensure
    // the Untitled project + route (spec §1/§3). Inline arrow so
    // the closure re-captures sessionHub each render (FSJ-1 stale-closure lesson).
    // showFrame is read via showFrameRef because panels is declared below (panels
    // depends on importFlow — see useAppPanels call).
    onFreshPasteLanded: () =>
      landPasteOnProcess({
        sessionHub,
        setSessionHub,
        showFrame: () => showFrameRef.current?.(),
        isEmbedMode,
      }),
    // FSJ-2 (spec §3): wizard-path paste (defect/wide/low-confidence) still gets
    // an Untitled project so the no-Y floor is reachable — provision WITHOUT
    // routing (the wizard keeps today's landing until P2). Inline arrow so the
    // closure re-captures sessionHub each render (FSJ-1 stale-closure lesson).
    onFreshPasteAnalyzed: () => provisionPasteProject({ sessionHub, setSessionHub }),
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
  // FSJ-2: keep showFrameRef in sync so onFreshPasteLanded always reaches the
  // current showFrame even though panels is declared after importFlow.
  showFrameRef.current = panels.showFrame;

  // PO-6 §4.4: useAnalyzeStore.findings is the single findings source (the bare
  // useFindings() React-state mirror retired — quick-analysis pins now round-trip .vrs).
  const findings = useAnalyzeStore(s => s.findings);
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const setHighlightedFindingId = useFindingsStore(s => s.setHighlightedFindingId);

  const resolved = resolveMode(analysisMode ?? 'standard');

  // PI Panel: journal entries (session-only; clears on refresh — PWA has no persistence)
  const journalEntries = useJournalEntries({
    findings,
  });

  // IM-1: openQuestionCount removed — the PI Panel Questions tab + its count
  // badge were the consumer, and both were retired with the Question entity.
  // The PWA PI Panel now surfaces stats + journal only.

  const canvasViewportHubId =
    processContext?.processHubId ??
    sessionHub?.id ??
    (rawData.length > 0 ? DEFAULT_PROCESS_HUB_ID : null);
  useCanvasViewportLifecycle(canvasViewportHubId);

  // Investigation orchestration (IM-1: hypothesis-driven, Question entity retired)
  const investigation = useAnalyzeOrchestration({
    findingsState: {
      findings,
      setFindingStatus: useAnalyzeStore.getState().setFindingStatus,
      // wrapper: addFindingAction has optional assignee/dueDate/ideaId params (slice wants (id, text) => void)
      addAction: (id, text) => {
        useAnalyzeStore.getState().addFindingAction(id, text);
      },
    },
    processContext: undefined,
    stats,
  });

  // Stage 5 modal — opens after Mode B Stage 3 confirm and via on-demand button.
  const stageFive = useStageFiveOpener();

  // Mobile tab bar (phone only, <640px)
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('explore');

  // Reset mobile tab and workspace when data is cleared
  useEffect(() => {
    if (rawData.length === 0) {
      setMobileActiveTab('explore');
      panels.showExplore();
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
        // Use handleLoadSample so ?sample= deep-links also land on Process tab
        // and get an attached Untitled project (spec §1). The embed guard
        // inside landOnProcess keeps ?embed=true&sample=… on the chart surface.
        landOnProcess(sample, {
          loadSample: ingestion.loadSample,
          sessionHub,
          setSessionHub,
          showFrame: panels.showFrame,
          // read the URL param, not the state — setState above hasn't re-rendered this closure
          isEmbedMode: embedParam === 'true',
        });
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

  const [hasOwnCaptureSinceExport, setHasOwnCaptureSinceExport] = useState(false);
  const [showDurabilityNudge, setShowDurabilityNudge] = useState(false);
  const [durabilityNudgeDismissed, setDurabilityNudgeDismissed] = useState(false);

  const markOwnFindingCaptured = useCallback(() => {
    setHasOwnCaptureSinceExport(true);
    setShowDurabilityNudge(current => current || !durabilityNudgeDismissed);
  }, [durabilityNudgeDismissed]);

  // .vrs export — the single source of truth (ER-1 retired VrsExportButton). Shared
  // by the Process-tab framing toolbar button + the Explore context-line Export menu.
  const handleExportVrs = useCallback(() => {
    if (!sessionHub) return;
    const json = buildDocumentSnapshotVrs({
      activeHub: sessionHub,
      metadata: {
        exportSource: 'pwa',
        appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
      },
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (sessionHub.processGoal ?? 'hub').slice(0, 32).replace(/[^a-z0-9-]+/gi, '-');
    a.download = `${safeName}.vrs`;
    a.click();
    URL.revokeObjectURL(url);
    setHasOwnCaptureSinceExport(false);
  }, [sessionHub]);

  useEffect(() => {
    if (!hasOwnCaptureSinceExport) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasOwnCaptureSinceExport]);

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId]);

  // ER-4: resolve the active condition's ProblemStatementScope id for a capture.
  // Mint-or-match (range-capable) when a condition is applied; undefined otherwise.
  // The scope key MUST mirror the value AnalyzeView stores scopes under
  // (String(canvasViewportHubId), the same key threaded to the Dashboard's
  // scopeProjectId) — re-deriving it from sessionHub would miss (randomUUID).
  const resolveActiveScopeIdForCapture = useCallback((): string | undefined => {
    const leaves = useAnalysisScopeStore.getState().conditionLeaves;
    if (leaves.length === 0 || !outcome) return undefined;
    const scopeProjectId =
      canvasViewportHubId != null ? String(canvasViewportHubId) : DEFAULT_PROCESS_HUB_ID;
    const matched = matchActiveScopeIdByLeaves({
      leaves,
      outcome,
      scopeProjectId,
      scopes: useAnalyzeStore.getState().scopes,
    });
    if (matched) return matched;
    return useAnalyzeStore.getState().syncScopeFromCondition(scopeProjectId, outcome, [...leaves]);
  }, [outcome, canvasViewportHubId]);

  // Findings: pin current filter state (one-click with duplicate detection)
  const handlePinFinding = useCallback(() => {
    const existing = findDuplicateFinding(findings, filters);
    if (existing) {
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(existing.id);
      return;
    }
    const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
    // ER-4: a pin made INSIDE an applied condition links to that scope.
    const scopeId = resolveActiveScopeIdForCapture();
    const newFinding = useAnalyzeStore.getState().addFinding('', context, undefined, scopeId);
    markOwnFindingCaptured();
    panels.setIsFindingsPanelOpen(true);
    setHighlightedFindingId(newFinding.id);
  }, [
    filters,
    drillPath,
    filteredData,
    outcome,
    specs,
    findings,
    panels,
    markOwnFindingCaptured,
    resolveActiveScopeIdForCapture,
  ]);

  // Chart observation: create a Finding with source metadata
  const handleAddChartObservation = useCallback(
    (
      chartType: 'boxplot' | 'pareto' | 'ichart' | 'probability',
      categoryKey?: string,
      noteText?: string,
      anchorX?: number,
      anchorY?: number,
      captureOptions?: ChartObservationCaptureOptions
    ) => {
      const source = buildFindingSource(chartType, categoryKey, anchorX, anchorY);
      if (source.chart === 'ichart' && captureOptions?.brushedRange) {
        source.brushedRange = captureOptions.brushedRange;
      }
      if (source.chart === 'probability' && captureOptions?.anchorYMax !== undefined) {
        source.anchorYMax = captureOptions.anchorYMax;
      }
      const existing = findDuplicateBySource(findings, source);
      if (existing) {
        panels.setIsFindingsPanelOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      // ER-0 Task 6: when a capture supplies its own condition (brush /
      // probability / category / engine-signal drafts), the persisted stats
      // MUST be computed over THAT condition's rows — not the dashboard's
      // unconditioned `filteredData` (that mismatch is the "dialog n=404 →
      // saved card n=1600" bug). Read rawData FRESH from the store, not the
      // render-scope closure: brush/probability/engine-signal captures call
      // setRawData (adding a derived column the condition filter references) in
      // the SAME tick, so the closed-over rawData/filteredData are stale.
      // getState() reads the just-written rows (Zustand setState is sync — see
      // the FSJ-2 precedent near useDataIngestion above). Context-menu captures
      // (no captureOptions) keep today's filteredData and stay self-consistent.
      // Per-measure spec resolution (conditionSpecs) applies to BOTH branches —
      // context-menu captures get it too; deliberate, consistent with Tasks 4/5.
      const conditionFilters = captureOptions?.activeFilters;
      const conditionRows = conditionFilters
        ? applyFilters(useProjectStore.getState().rawData, conditionFilters)
        : filteredData;
      const conditionSpecs = useProjectStore.getState().measureSpecs[outcome!] ?? specs;
      const context = buildFindingContext(
        conditionFilters ?? filters,
        conditionRows,
        outcome!,
        conditionSpecs,
        drillPath
      );
      // ER-4: a capture made INSIDE an applied condition links to that condition's
      // ProblemStatementScope — mint-or-match the scope id (range-capable) and pass
      // it to addFinding. A capture without a condition stays unlinked (undefined).
      const scopeId = resolveActiveScopeIdForCapture();
      const newFinding = useAnalyzeStore
        .getState()
        .addFinding(
          noteText ?? '',
          context,
          source,
          scopeId,
          undefined,
          captureOptions?.evidenceType
        );
      markOwnFindingCaptured();
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(newFinding.id);
      // IM-1 (ADR-085): the post-observation question-link prompt is retired
      // (Question entity gone); analysts promote findings to hubs on the Wall.
      return newFinding;
    },
    [
      filters,
      drillPath,
      filteredData,
      outcome,
      specs,
      findings,
      panels,
      markOwnFindingCaptured,
      resolveActiveScopeIdForCapture,
    ]
  );

  const handleOpenFinding = useCallback(
    (id: string) => {
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(id);
    },
    [panels]
  );

  // Chart findings grouped by chart type for inline annotation display
  const chartFindings = useMemo(() => groupFindingsByChart(findings), [findings]);

  // Findings: restore filter state AND time lens.
  // Single owner — the parallel useFindingsOrchestration hook was deleted (dead code,
  // never called from PWA). App.tsx is the canonical restore handler for the PWA.
  const handleRestoreFinding = useCallback(
    (id: string) => {
      const finding = findings.find(f => f.id === id);
      if (!finding) return;
      // Restore time lens first so chart data is scoped correctly when filters apply.
      if (finding.source?.timeLens) {
        usePreferencesStore.getState().setTimeLens(finding.source.timeLens);
      }
      setFilters(finding.context.activeFilters);
    },
    [findings, setFilters]
  );

  // Findings popout: open in separate window
  const popupRef = React.useRef<Window | null>(null);
  const handleOpenFindingsPopout = useCallback(() => {
    popupRef.current = openFindingsPopout(findings, columnAliases, drillPath);
  }, [findings, columnAliases, drillPath]);

  // Mode B: when ColumnMapping confirms, fold the Stage 3 Hub-shaped payload
  // (outcomes, primaryScopeDimensions) into the session Hub. Goal narrative is
  // now opt-in via GoalBanner (FSJ-2, spec §3) — the Stage 1 gate is gone.
  // Preserve any pre-existing sessionHub fields (Mode A.1 restore path).
  const handleMappingConfirmToHub = useCallback(
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

      const base = sessionHub;
      if (!base) {
        if (import.meta.env.DEV) {
          throw new Error('Expected an active session Hub before confirming column mapping.');
        }
        return;
      }

      setSessionHub({
        ...base,
        // Wire outcomes + primaryScopeDimensions into the Hub (resolves slice-1 TODO).
        outcomes: payload.outcomes,
        primaryScopeDimensions: payload.primaryScopeDimensions,
        updatedAt: Date.now(),
      });

      // Stage 5 (spec §5.5): open the floating investigation-context modal before
      // the canvas paints so the analyst can capture issue / questions upfront.
      stageFive.openModeB();
    },
    [importFlow, sessionHub, setSessionHub, stageFive]
  );

  // First-session landing (spec §1, §3): fresh sample entry lands on the
  // Process tab with an attached Untitled project.
  // Thin wrapper — business logic lives in landOnProcess for testability.
  const handleLoadSample = useCallback(
    (sample: SampleDataset) => {
      landOnProcess(sample, {
        loadSample: ingestion.loadSample,
        sessionHub,
        setSessionHub,
        showFrame: panels.showFrame,
        isEmbedMode,
      });
    },
    [ingestion.loadSample, sessionHub, setSessionHub, panels.showFrame, isEmbedMode]
  );

  // .vrs import: reconstruct the envelope's own project and land on Process
  // (spec §1 applicability). reconstruct-not-create: the envelope's project is
  // the wrapper — only a project-less hub gets an Untitled wrap. v1 envelope
  // only (wedge no-back-compat). Embed mode ensures the Workspace Project but
  // skips navigation (spec §1 applicability).
  // Thin wrapper — business logic lives in landVrsOnProcess for testability.
  // ISP: LandHubOnProcessDeps no longer includes sessionHub; the reconstructed
  // hub from the snapshot is the authoritative source (sessionHub unused there).
  const handleImportVrs = useCallback(
    (imported: DocumentSnapshotVrsFile) => {
      landVrsOnProcess(imported, {
        setSessionHub,
        showFrame: panels.showFrame,
        isEmbedMode,
      });
    },
    [setSessionHub, panels.showFrame, isEmbedMode]
  );

  // Manual-entry landing: write data into the project store then land on the
  // Process tab with an attached 'Untitled project'.
  // Thin wrapper — business logic lives in landManualOnProcess for testability.
  const handleManualAnalyze = useCallback(
    (...args: Parameters<typeof importFlow.handleManualDataAnalyze>) => {
      landManualOnProcess(args[0], args[1], {
        manualAnalyze: importFlow.handleManualDataAnalyze,
        sessionHub,
        setSessionHub,
        showFrame: panels.showFrame,
        isEmbedMode,
      });
    },
    [importFlow.handleManualDataAnalyze, sessionHub, setSessionHub, panels.showFrame, isEmbedMode]
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

  // IM-1: the propose-hypothesis-from-finding CTA (createHubFromFinding) + its
  // `wallViewMode` read are removed here — their render target was the retired
  // QuestionLinkPrompt (wallActive / onProposeHypothesis). AnalyzeView reads
  // wallViewMode from the store itself for its own toggle. Promoting a finding to
  // a Hypothesis hub on the Wall is owned by the unified Wall re-layout in IM-4/IM-5.

  // Findings popout: sync data when findings/drillPath change
  useEffect(() => {
    if (!popupRef.current || popupRef.current.closed) return;
    updateFindingsPopout(findings, columnAliases, drillPath);
  }, [findings, columnAliases, drillPath]);

  // Findings popout: listen for actions from popout window via BroadcastChannel
  const { lastMessage: findingsPopoutMessage } = usePopoutChannel<FindingsActionMessage>({
    windowId: 'main',
  });

  useEffect(() => {
    if (!findingsPopoutMessage || findingsPopoutMessage.type !== 'findings-action') return;
    const action = (findingsPopoutMessage as FindingsActionMessage).payload;
    switch (action.action) {
      case 'edit':
        if (action.text !== undefined)
          useAnalyzeStore.getState().editFinding(action.id, action.text);
        break;
      case 'delete':
        useAnalyzeStore.getState().deleteFinding(action.id);
        break;
      case 'set-status':
        if (action.status) useAnalyzeStore.getState().setFindingStatus(action.id, action.status);
        break;
      case 'set-tag':
        useAnalyzeStore.getState().setFindingTag(action.id, action.tag ?? null);
        break;
      case 'set-evidence-type':
        if (action.evidenceType)
          useAnalyzeStore.getState().editFindingEvidenceType(action.id, action.evidenceType);
        break;
      case 'add-comment':
        if (action.text !== undefined)
          useAnalyzeStore.getState().addFindingComment(action.id, action.text);
        break;
      case 'edit-comment':
        if (action.commentId && action.text !== undefined)
          useAnalyzeStore.getState().editFindingComment(action.id, action.commentId, action.text);
        break;
      case 'delete-comment':
        if (action.commentId)
          useAnalyzeStore.getState().deleteFindingComment(action.id, action.commentId);
        break;
    }
  }, [findingsPopoutMessage]);

  const isOnline = useOnlineStatus();
  const selectedOrActiveProjectId = workspaceViewModel?.project.id ?? panels.selectedProjectId;
  const workspaceProjectScopeLabels = useMemo(
    () =>
      workspaceProjectContext.workspaceProject
        ? deriveWorkspaceProjectScopeLabels(
            workspaceProjectContext.workspaceProject,
            sessionHub,
            workspaceProjectContext.activeState?.setAt
          )
        : null,
    [
      workspaceProjectContext.workspaceProject,
      workspaceProjectContext.activeState?.setAt,
      sessionHub,
    ]
  );
  const workspaceProjectScope =
    workspaceProjectContext.workspaceProject && workspaceProjectScopeLabels
      ? {
          title: workspaceProjectTitle ?? 'Workspace',
          labels: workspaceProjectScopeLabels,
        }
      : null;
  // PO-5: the lineage section is retired — Workspace Project surfaces show the whole
  // document (empty-set-means-unfiltered is now the permanent semantics). The
  // scopedFindings/scopedFindingsState memos are gone; AnalyzeView reads findings
  // from useAnalyzeStore directly (PO-6 §4.4 unification).

  // PR-CS-6 Edge 1: COPY a finding-level action into the Workspace Project's action
  // tracker (`IP.metadata.actions`) via ACTION_ITEM_ADD, then stamp the source so
  // the promote button hides (re-promotion guard). COPY — Report keeps reading
  // `finding.actions`; the tracker is a separate collection (no double-count).
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);
  const handlePromoteFindingAction = useCallback(
    (findingId: string, actionId: string) => {
      const workspaceProject = workspaceProjectContext.workspaceProject;
      if (!workspaceProject) return;
      const source = findings.find(f => f.id === findingId)?.actions?.find(a => a.id === actionId);
      if (!source || source.parentImprovementProjectId) return;
      const projectAction = createProjectActionItem({
        text: source.text,
        parentImprovementProjectId: workspaceProject.id,
      });
      const enriched = {
        ...projectAction,
        ...(source.dueAt != null ? { dueAt: source.dueAt } : {}),
        ...(source.assignedTo != null ? { assignedTo: source.assignedTo } : {}),
        ...(source.stepId != null ? { stepId: source.stepId } : {}),
      };
      const action: ActionItemAction = {
        kind: 'ACTION_ITEM_ADD',
        hubId: workspaceProject.hubId,
        actionItem: enriched,
      };
      const nextActions = reduceActionItems(workspaceProject.metadata.actions ?? [], action);
      upsertProject({
        ...workspaceProject,
        metadata: { ...workspaceProject.metadata, actions: nextActions },
      });
      useAnalyzeStore.getState().promoteFindingAction(findingId, actionId, workspaceProject.id);
    },
    [workspaceProjectContext.workspaceProject, findings, upsertProject]
  );

  // ── Measurement plan callbacks for WallCanvas planningProps ─────────────
  // PWA uses 'analyst@local' as the single-user identity (no auth).
  const PWA_WALL_USER_ID = 'analyst@local';
  const wallWorkspaceProjectMembers = useMemo(
    () => workspaceProjectContext.workspaceProject?.metadata.members ?? [],
    [workspaceProjectContext.workspaceProject]
  );
  const wallPlanningProps = useMemo(
    () => ({
      plans: wallMeasurementPlans,
      members: wallWorkspaceProjectMembers,
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
        // PR-CS-11 — an analyst plan-write: bump the plan-load nonce (so the Wall
        // re-reads, incl. when the link arrives via the re-ingest prompt) + clear
        // the plan's pending match (linking is the resolution the prompt offered).
        setPlanLoadNonce(n => n + 1);
        clearPendingMatchesForPlan(planId);
      },
      onEditPlan: (planId: string) => {
        console.warn(`[wall] Plan edit UI deferred to V2 — planId: ${planId}`);
      },
      // Disconfirmation parity with Azure: the PWA Wall (AnalyzeView) reads hubs from
      // useAnalyzeStore, so the recorded attempt MUST land in that store for the
      // needs-disconfirmation → confirmed gate to fire live in-session. The app stamps
      // the deterministic id + timestamp + attemptedBy (the inline form supplies only
      // description + verdict).
      onRecordDisconfirmation: (
        hypothesisId: string,
        input: { description: string; verdict: 'pending' | 'survived' | 'refuted' }
      ) => {
        const attempt: DisconfirmationAttempt = {
          id: generateDeterministicId(),
          attemptedAt: new Date().toISOString(),
          attemptedBy: { displayName: 'Local browser', upn: PWA_WALL_USER_ID },
          description: input.description,
          verdict: input.verdict,
          linkedFindingIds: [],
        };
        useAnalyzeStore.getState().recordDisconfirmation(hypothesisId, attempt);
      },
      onSetStatus: (id: string, status: HypothesisStatus) =>
        useAnalyzeStore.getState().setHubStatus(id, status),
      onGoLook: (hypothesisId: string) => {
        useCanvasViewportStore.getState().setViewMode('wall');
        useViewStore.getState().setFocusedWallEntity(hypothesisId);
      },
      // PR-CS-11 — the re-ingest confirm prompt's APPLY surface (Wall chip). Plans
      // persist via pwaHubRepository.dispatch (the established plan-write path);
      // status display reads from wallMeasurementPlans, so we update it optimistically.
      pendingMatchByPlanId,
      onSetPlanStatus: (planId: string, status: MeasurementPlanStatus) => {
        setWallMeasurementPlans(prev => {
          const snapshot = prev;
          const next = prev.map(p => (p.id === planId ? { ...p, status } : p));
          pwaHubRepository
            .dispatch({ kind: 'MEASUREMENT_PLAN_UPDATE', planId, patch: { status } })
            .catch((err: unknown) => {
              setWallMeasurementPlans(snapshot);
              console.error('[wall] Failed to update measurement plan status:', err);
            });
          return next;
        });
        // Relocated nonce: an analyst plan-write fires the Wall plan-load refresh.
        setPlanLoadNonce(n => n + 1);
        // The status action handles the prompt — clear that plan's pending match.
        clearPendingMatchesForPlan(planId);
      },
      onDismissPendingMatch: (id: string) => {
        // Session-only dismiss: remember the id so re-fires don't resurface it.
        setDismissedMatchIds(prev => new Set(prev).add(id));
        setPendingMatches(prev => prev.filter(m => m.id !== id));
      },
      // IM-4b Task 1 — hub comment thread. The PWA Wall (AnalyzeView) reads hubs
      // from useAnalyzeStore, so comment/task/idea writes route through the store
      // (its source of truth). parseMentions resolves @-tags against members.
      onAddHubComment: (hubId: string, text: string) => {
        const mentionedUserIds = parseMentions(text, wallWorkspaceProjectMembers);
        void useAnalyzeStore
          .getState()
          .addHubComment(hubId, text, PWA_WALL_USER_ID, mentionedUserIds);
      },
      onEditHubComment: (hubId: string, commentId: string, text: string) =>
        useAnalyzeStore.getState().editHubComment(hubId, commentId, text),
      onDeleteHubComment: (hubId: string, commentId: string) =>
        useAnalyzeStore.getState().deleteHubComment(hubId, commentId),
      showCommentAuthors: wallWorkspaceProjectMembers.length > 0,
      // IM-4b Task 3 — ActionItem tasks
      onAddHypothesisAction: (hypothesisId: string, text: string) => {
        useAnalyzeStore.getState().addHypothesisAction(hypothesisId, text);
      },
      onCompleteHypothesisAction: (hypothesisId: string, actionId: string) =>
        useAnalyzeStore.getState().completeHypothesisAction(hypothesisId, actionId),
      // IM-4b Task 6 — improvement ideas
      ideaImpacts: investigation.ideaImpacts,
      onProjectIdea: (hypothesisId: string, ideaId: string) =>
        investigation.handleProjectIdea(hypothesisId, ideaId),
      onAddIdea: (hypothesisId: string, text: string) => {
        useAnalyzeStore.getState().addIdea(hypothesisId, text);
      },
      onUpdateIdea: (
        hypothesisId: string,
        ideaId: string,
        updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
      ) => useAnalyzeStore.getState().updateIdea(hypothesisId, ideaId, updates),
      onRemoveIdea: (hypothesisId: string, ideaId: string) =>
        useAnalyzeStore.getState().deleteIdea(hypothesisId, ideaId),
      onSelectIdea: (hypothesisId: string, ideaId: string, selected: boolean) =>
        useAnalyzeStore.getState().selectIdea(hypothesisId, ideaId, selected),
    }),

    [
      wallMeasurementPlans,
      wallWorkspaceProjectMembers,
      PWA_WALL_USER_ID,
      investigation,
      pendingMatchByPlanId,
      clearPendingMatchesForPlan,
    ]
  );

  const workspaceProjectAnalyzeFactorRequest = useMemo(
    () =>
      workspaceProjectContext.isWorkspaceProjectScoped &&
      workspaceProjectScopeLabels?.factorLabels[0]
        ? {
            factor: workspaceProjectScopeLabels.factorLabels[0],
            seq: workspaceProjectContext.activeState?.setAt ?? 0,
          }
        : null,
    [
      workspaceProjectContext.activeState?.setAt,
      workspaceProjectContext.isWorkspaceProjectScoped,
      workspaceProjectScopeLabels?.factorLabels,
    ]
  );

  useEffect(() => {
    if (panels.activeView !== 'frame' || !sessionHub) return;
    if (workspaceProjectContext.workspaceProject) {
      const hubId = normalizeProcessHubId(sessionHub.id);
      const focus = deriveWorkspaceProjectCanvasFocus(
        workspaceProjectContext.workspaceProject,
        sessionHub
      );
      useCanvasViewportStore.getState().setLevel(hubId, focus.level, focus.focalStepId);
    }
  }, [workspaceProjectContext.workspaceProject, panels.activeView, sessionHub]);

  // Control + Handoff inputs for ProjectsTabView → IPDetailPage
  const _liveControlRecords = (sessionHub?.controlRecords ?? []).filter(r => r.deletedAt === null);
  const _liveControlReviews = (sessionHub?.controlReviews ?? []).filter(r => r.deletedAt === null);
  const _liveControlHandoffs = (sessionHub?.controlHandoffs ?? []).filter(
    h => h.deletedAt === null
  );
  const projectsControlRecord = _liveControlRecords.find(
    r => r.improvementProjectId === selectedOrActiveProjectId
  );
  const projectsControlHandoff = _liveControlHandoffs.find(
    h => h.projectId === (projectsControlRecord?.projectId ?? '')
  );
  const projectsClosureInputs = projectsControlRecord
    ? {
        handoffRecorded: Boolean(projectsControlHandoff),
        handoffSummary: projectsControlHandoff
          ? `${projectsControlHandoff.systemName} · ${projectsControlHandoff.operationalOwner.displayName}`
          : undefined,
        ladderWalked:
          projectsControlRecord.ladderStep >= Math.max(projectsControlRecord.ladder.length - 1, 0),
        ladderSummary: `Step ${projectsControlRecord.ladderStep + 1} of ${projectsControlRecord.ladder.length}`,
        sustainmentConfirmed: projectsControlRecord.status === 'confirmed-sustained',
      }
    : undefined;
  const isAnalyzeWallCanvasFirst = panels.activeView === 'analyze' && wallViewMode === 'wall';

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
          workspaceProjectTitle={workspaceProjectTitle}
          onOpenWorkspaceProject={
            workspaceProjectContext.workspaceProject
              ? () => panels.showProjects(workspaceProjectContext.workspaceProject!.id)
              : undefined
          }
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

      {/* Goal ceremony home (FSJ-2, spec §3): opt-in on the Process tab —
          relocated off the paste path. Populated banner renders everywhere
          (unchanged); the empty start-prompt only on the framing surface. */}
      {sessionHub && (sessionHub.processGoal || panels.activeView === 'frame') ? (
        <GoalBanner
          goal={sessionHub.processGoal ?? ''}
          startPrompt="Set a process goal…"
          onChange={next => {
            setSessionHub({
              ...sessionHub,
              // Name-derivation parity with the retired wizard fold: a narrative-
              // derived name wins over a default; explicit naming is P3 ceremony.
              name: extractHubName(next) || sessionHub.name || 'Untitled hub',
              processGoal: next,
              updatedAt: Date.now(),
            });
          }}
        />
      ) : null}

      {/* Canvas framing toolbar — visible when data is loaded and we are on the
          analysis canvas (not in a framing modal). Shows OutcomePin, .vrs
          export, and Edit-framing re-entry. */}
      {rawData.length > 0 &&
        // ER-1: the framing toolbar is canvas chrome for the Process tab only —
        // Explore's chrome is the context line (ProcessHealthBar).
        panels.activeView === 'frame' &&
        // First-session spec §1: embeds are exempt from the journey spine chrome.
        !isEmbedMode &&
        !isAnalyzeWallCanvasFirst &&
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
              + New analyze
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded border border-edge text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              onClick={handleExportVrs}
            >
              Export .vrs
            </button>
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
      {showDurabilityNudge ? (
        <DurabilityNudge
          verb="Export"
          onDismiss={() => {
            setShowDurabilityNudge(false);
            setDurabilityNudgeDismissed(true);
          }}
        />
      ) : null}

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
                renderJournalTab={() => <JournalTabView entries={journalEntries} />}
              />
            </Suspense>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Suspense fallback={<LazyFallback />}>
            <AppViewSwitch
              analysisMode={analysisMode}
              canvasViewportHubId={canvasViewportHubId}
              chartFindings={chartFindings}
              columnAliases={columnAliases}
              controlHandoff={projectsControlHandoff}
              controlRecord={projectsControlRecord}
              dataFilename={dataFilename}
              dataQualityReport={dataQualityReport}
              defectSummaryProps={defectSummaryProps}
              drillPath={drillPath}
              embedFocusChart={embedFocusChart}
              embedStatsTab={embedStatsTab}
              factors={factors}
              filteredData={filteredData}
              findings={findings}
              filterNav={filterNav}
              handleAddChartObservation={handleAddChartObservation}
              handleExport={handleExport}
              handleExportCSV={handleExportCSV}
              handleExportVrs={handleExportVrs}
              handleImportVrs={handleImportVrs}
              handleLoadSample={handleLoadSample}
              handleManualAnalyze={handleManualAnalyze}
              handleMappingConfirmToHub={handleMappingConfirmToHub}
              handleOpenFinding={handleOpenFinding}
              handlePinFinding={handlePinFinding}
              handlePromoteFindingAction={handlePromoteFindingAction}
              handleRestoreFinding={handleRestoreFinding}
              highlightedChart={highlightedChart}
              highlightedPointIndex={panels.highlightedChartPoint}
              highlightIntensity={highlightIntensity}
              hypotheses={hypotheses}
              importFlow={importFlow}
              ingestion={ingestion}
              investigation={investigation}
              isEmbedMode={isEmbedMode}
              lensedSampleCount={lensedSampleCount}
              notifyChartClicked={notifyChartClicked}
              outcome={outcome}
              panels={panels}
              paretoMode={paretoMode}
              pendingMatches={pendingMatches}
              _liveControlReviews={_liveControlReviews}
              projectsClosureInputs={projectsClosureInputs}
              rawData={rawData}
              timeColumn={importFlow.timeExtractionPrompt?.timeColumn}
              resolved={resolved}
              revokeInvite={revokeInvite}
              acceptInvite={acceptInvite}
              pendingInvites={pendingInvites}
              selectedOrActiveProjectId={selectedOrActiveProjectId}
              separateParetoFilename={separateParetoFilename}
              sessionHub={sessionHub}
              setAnalysisMode={setAnalysisMode}
              setDefectMapping={setDefectMapping}
              setMeasureColumns={setMeasureColumns}
              setMeasureLabel={setMeasureLabel}
              setSelectedMeasure={setSelectedMeasure}
              specs={specs}
              stats={stats}
              wallPlanningProps={wallPlanningProps}
              workspaceProjectAnalyzeFactorRequest={workspaceProjectAnalyzeFactorRequest}
              workspaceProjectContext={workspaceProjectContext}
              workspaceProjectScope={workspaceProjectScope}
              workspaceProjectTitle={workspaceProjectTitle}
              workspaceViewModel={workspaceViewModel}
              _liveControlHandoffs={_liveControlHandoffs}
              _liveControlRecords={_liveControlRecords}
            />
          </Suspense>
        </div>

        {/* Findings Panel (inline desktop, or mobile when findings tab active) */}
        {/* Hidden when in analyze workspace — the workspace IS the findings view */}
        <Suspense fallback={null}>
          {panels.activeView !== 'analyze' &&
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
                findings={findings}
                onEditFinding={useAnalyzeStore.getState().editFinding}
                onDeleteFinding={useAnalyzeStore.getState().deleteFinding}
                onRestoreFinding={handleRestoreFinding}
                onSetFindingStatus={investigation.handleSetFindingStatus}
                onSetFindingTag={useAnalyzeStore.getState().setFindingTag}
                onSetFindingEvidenceType={useAnalyzeStore.getState().editFindingEvidenceType}
                onAddComment={(id, text) => {
                  // wrapper: the attachment param (Azure-only) is intentionally dropped in PWA
                  useAnalyzeStore.getState().addFindingComment(id, text);
                }}
                onEditComment={useAnalyzeStore.getState().editFindingComment}
                onDeleteComment={useAnalyzeStore.getState().deleteFindingComment}
                columnAliases={columnAliases}
                drillPath={drillPath}
                activeFindingId={highlightedFindingId}
                onPopout={handleOpenFindingsPopout}
                maxStatuses={3}
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
      {!isEmbedMode && !isAnalyzeWallCanvasFirst && (
        <AppFooter filteredCount={filteredData.length} totalCount={rawData.length} />
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

      {/* Stage 5 modal — investigation context capture.
          Opens after Mode B Stage 3 confirm (openModeB) and via on-demand button
          on the canvas chrome (openOnDemand). Does NOT log brief contents to console
          or any analytics — contents are PII (process issue / questions). */}
      <StageFiveModal
        open={stageFive.open}
        mode={stageFive.mode}
        onOpenInvestigation={brief => {
          // IM-1 (F5, ADR-085): AnalysisBrief no longer seeds Question entities —
          // the Question entity is retired. Brief capture is informational only;
          // the analyst forms hypothesis hubs on the Wall.
          // PO-6: persist the Stage-5 draft as a proposed Hypothesis hub (analyst renames
          // on the card — same convention as handleWriteHypothesis / propose-hypothesis).
          if (brief.hypothesisDraft) {
            useAnalyzeStore.getState().createHub(brief.hypothesisDraft, '');
          }
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
          findingsCount={findings.length}
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
