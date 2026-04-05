import React, { useMemo, useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import type { SampleDataset } from '@variscout/data';
import { useStorage } from '../services/storage';
import type { StorageLocation } from '../services/storage';
import { useProjectLoader } from '../hooks/useProjectLoader';
import { useProjectOverview } from '../hooks/useProjectOverview';
import { useProjectStore, useInvestigationStore, useSessionStore } from '@variscout/stores';
import {
  useFilteredData,
  useAnalysisStats,
  useStagedAnalysis,
  useProjectActions,
} from '@variscout/hooks';
import { azurePersistenceAdapter, setDefaultLocation } from '../lib/persistenceAdapter';
import { useStatsWorker } from '../workers/useStatsWorker';
import { useDataIngestion } from '../hooks/useDataIngestion';
import { useFilterNavigation } from '../hooks';
import { AppHeader } from '../components/AppHeader';
import PasteScreen from '../components/data/PasteScreen';
import ManualEntry from '../components/data/ManualEntry';
import {
  ColumnMapping,
  ImprovementWorkspaceBase,
  ImprovementContextPanel,
  WhatIfPageBase,
  PrioritizationMatrix,
  TrackView,
  VerificationPrompt,
  BrainstormModal,
  DEFAULT_PRESETS,
  type AnalysisBrief,
  type MatrixDimension,
} from '@variscout/ui';
import {
  useControlViolations,
  useQuestions,
  useJourneyPhase,
  detectEntryScenario,
  useCapabilityIChartData,
  useTranslation,
  useHMWPrompts,
} from '@variscout/hooks';
import { hasTeamFeatures, downloadCSV } from '@variscout/core';
import { isAIAvailable } from '../services/aiService';
import { usePhotoComments } from '../hooks/usePhotoComments';
import { getCurrentUser, type CurrentUser } from '../auth/getCurrentUser';
import { useDataMerge } from '../hooks/useDataMerge';
import type {
  ExclusionReason,
  Finding,
  Question,
  InvestigationCategory,
  IdeaDirection,
} from '@variscout/core';
import type { BrainstormIdea } from '@variscout/core/findings';
import { Check } from 'lucide-react';
import { type FilePickerResult } from '../components/FileBrowseButton';
import { useIsMobile, BREAKPOINTS, MobileTabBar, type MobileTab } from '@variscout/ui';
import { useAIOrchestration, useActionProposals, useInvestigationIndexing } from '../features/ai';
import { useInvestigationOrchestration } from '../features/investigation';
import { useInvestigationFeatureStore } from '../features/investigation/investigationStore';
import { useImprovementOrchestration } from '../features/improvement';
import { useLocale } from '../context/LocaleContext';
import { usePanelsStore } from '../features/panels/panelsStore';
import { usePanelsPersistence } from '../features/panels/usePanelsPersistence';
import { useEditorDataFlow } from '../hooks/useEditorDataFlow';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTeamsShare } from '../hooks/useTeamsShare';
import { useShareFinding } from '../hooks/useShareFinding';
import { useFindingsOrchestration } from '../features/findings';
import { useFindingsStore } from '../features/findings/findingsStore';
import { buildChartSharePayload } from '../services/shareContent';
import { isKnowledgeBaseAvailable } from '../services/searchService';
import { buildSubPageId } from '../services/deepLinks';
import { useToast } from '../context/ToastContext';
import { EditorEmptyState } from '../components/editor/EditorEmptyState';
import { EditorDashboardView } from '../components/editor/EditorDashboardView';
// WorkspaceTabs merged into AppHeader (ADR-055 header redesign)
import { InvestigationWorkspace } from '../components/editor/InvestigationWorkspace';
import { EditorModals } from '../components/editor/EditorModals';
import { EditorMobileSheet } from '../components/editor/EditorMobileSheet';
import ProjectDashboard from '../components/ProjectDashboard';
import { useAIStore } from '../features/ai/aiStore';

const WhatIfPage = lazy(() => import('../components/WhatIfPage'));
const ReportView = lazy(() => import('../components/views/ReportView'));

/** Derive a clean project name from a data filename */
function cleanProjectName(filename: string | null): string {
  if (!filename || filename === 'Pasted Data') {
    const d = new Date();
    return `Analysis ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return filename
    .replace(/\.(csv|xlsx?|json|tsv)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface EditorProps {
  projectId: string | null;
  onBack: () => void;
  /** Open the Settings panel (managed by App.tsx) */
  onOpenSettings?: () => void;
  /** Deep link: auto-open findings panel and highlight this finding */
  initialFindingId?: string;
  /** Deep link: auto-focus this chart type */
  initialChart?: string;
  /** Deep link: auto-select this question in investigation view */
  initialQuestionId?: string;
  /** Deep link: auto-open a specific mode (e.g. 'improvement', 'report') */
  initialMode?: string;
  /** Sample dataset to load immediately (from portfolio "Try a Sample") */
  initialSample?: SampleDataset | null;
}

export const Editor: React.FC<EditorProps> = ({
  projectId,
  onBack,
  onOpenSettings,
  initialFindingId,
  initialChart,
  initialQuestionId,
  initialMode,
  initialSample,
}) => {
  const { syncStatus, listProjects, saveProject: saveToCloud } = useStorage();
  const { locale } = useLocale();
  const { showToast } = useToast();

  // ── Zustand store selectors (replaces useDataStateCtx) ────────────────────
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const specs = useProjectStore(s => s.specs);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const measureColumns = useProjectStore(s => s.measureColumns);
  const measureLabel = useProjectStore(s => s.measureLabel);
  const dataFilename = useProjectStore(s => s.dataFilename);
  const dataQualityReport = useProjectStore(s => s.dataQualityReport);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const filters = useProjectStore(s => s.filters);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const viewState = useProjectStore(s => s.viewState);
  const currentProjectName = useProjectStore(s => s.projectName);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const processContext = useProjectStore(s => s.processContext) ?? undefined;

  // Investigation store (domain — findings/questions/categories)
  const persistedFindings = useInvestigationStore(s => s.findings);
  const persistedQuestions = useInvestigationStore(s => s.questions);
  const categories = useInvestigationStore(s => s.categories);

  // Session store
  const aiEnabled = useSessionStore(s => s.aiEnabled);
  const knowledgeSearchFolder = useSessionStore(s => s.knowledgeSearchFolder) ?? undefined;

  // Derived hooks (replaces computed state from useDataState)
  const { filteredData } = useFilteredData();
  const workerApi = useStatsWorker();
  const { stats } = useAnalysisStats(workerApi);
  const { stagedStats } = useStagedAnalysis();

  // Azure-specific: project location is always 'personal' (ADR-059)
  const currentProjectLocation: StorageLocation = 'personal';

  // ── Zustand store setters (replaces useDataActions) ────────────────────────
  const setRawData = useProjectStore(s => s.setRawData);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const setSpecs = useProjectStore(s => s.setSpecs);
  const setDataFilename = useProjectStore(s => s.setDataFilename);
  const setDataQualityReport = useProjectStore(s => s.setDataQualityReport);
  const setMeasureColumns = useProjectStore(s => s.setMeasureColumns);
  const setMeasureLabel = useProjectStore(s => s.setMeasureLabel);
  const setColumnAliases = useProjectStore(s => s.setColumnAliases);
  const setAnalysisMode = useProjectStore(s => s.setAnalysisMode);
  const setYamazumiMapping = useProjectStore(s => s.setYamazumiMapping);
  const setFilters = useProjectStore(s => s.setFilters);
  const setDisplayOptions = useProjectStore(s => s.setDisplayOptions);
  const setViewState = useProjectStore(s => s.setViewState);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const setSubgroupConfig = useProjectStore(s => s.setSubgroupConfig);
  const setCpkTarget = useProjectStore(s => s.setCpkTarget);
  const setCategories = useInvestigationStore(s => s.setCategories);

  // Investigation store setters (via loadInvestigationState for bulk updates)
  const setPersistedFindings = useCallback((findings: Finding[]) => {
    useInvestigationStore.getState().loadInvestigationState({ findings });
  }, []);
  const setPersistedQuestions = useCallback((questions: Question[]) => {
    useInvestigationStore.getState().loadInvestigationState({ questions });
  }, []);

  // Persistence actions (local IndexedDB via adapter)
  const projectActions = useProjectActions(azurePersistenceAdapter);

  // Wrap saveProject with cloud sync
  const saveProject = useCallback(
    async (name: string) => {
      setDefaultLocation('personal');
      const project = await projectActions.saveProject(name);
      // Trigger cloud sync with current store state snapshot
      const state = useProjectStore.getState();
      await saveToCloud(state, name, 'personal');
      return project;
    },
    [projectActions, saveToCloud]
  );

  const loadProject = projectActions.loadProject;
  const renameProject = useCallback(
    async (oldName: string, newName: string) => {
      await projectActions.renameProject(oldName, newName);
    },
    [projectActions]
  );

  const ingestion = useDataIngestion({
    onTimeColumnDetected: prompt => {
      dataFlowRef.current?.setTimeExtractionPrompt(prompt);
      if (prompt.hasTimeComponent) {
        dataFlowRef.current?.setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
      }
    },
    onYamazumiDetected: result => {
      dataFlowRef.current?.handleYamazumiDetectedFromIngestion(result);
    },
    getRawData: () => rawData,
    getOutcome: () => outcome,
    getFactors: () => factors,
  });
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  useTranslation();

  // Mobile tab bar state (phone only)
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('analysis');

  // Reset mobile tab when data is cleared
  useEffect(() => {
    if (rawData.length === 0) setMobileActiveTab('analysis');
  }, [rawData.length]);

  // Report view state changes for persistence (merge partial updates)
  // Use ref for viewState to avoid circular dep: handleViewStateChange → viewState → usePanelsPersistence → handleViewStateChange
  const viewStateRef = useRef(viewState);
  viewStateRef.current = viewState;
  const handleViewStateChange = useCallback(
    (partial: Partial<import('@variscout/hooks').ViewState>) => {
      const prev = viewStateRef.current ?? {};
      // Skip update if all values in the partial are already current (break render loop)
      const hasChange = Object.entries(partial).some(
        ([k, v]) => prev[k as keyof typeof prev] !== v
      );
      if (hasChange) {
        setViewState({ ...prev, ...partial });
      }
    },
    [setViewState]
  );

  // Panel visibility and chart/table sync (Zustand store)
  const activeView = usePanelsStore(s => s.activeView);
  const isCoScoutOpen = usePanelsStore(s => s.isCoScoutOpen);
  const isWhatIfOpen = usePanelsStore(s => s.isWhatIfOpen);
  const isPISidebarOpen = usePanelsStore(s => s.isPISidebarOpen);

  // Initialize from persisted ViewState (once, on mount)
  const viewStateInitRef = useRef(false);
  useEffect(() => {
    if (viewStateInitRef.current) return;
    viewStateInitRef.current = true;
    usePanelsStore.getState().initFromViewState(viewState);
  }, [viewState]);

  // Bridge hook: persists Zustand panel state to DataContext (IndexedDB/OneDrive)
  usePanelsPersistence(handleViewStateChange);

  // Consume pendingChartFocus from panelsStore (set by navigate_to tool handler)
  const pendingChartFocus = usePanelsStore(s => s.pendingChartFocus);
  useEffect(() => {
    if (!pendingChartFocus) return;
    handleViewStateChange({
      focusedChart: pendingChartFocus as 'ichart' | 'boxplot' | 'pareto' | null,
    });
    usePanelsStore.getState().setPendingChartFocus(null);
  }, [pendingChartFocus, handleViewStateChange]);

  // Focus return refs for mobile overlays (F-19)
  const findingsTriggerRef = useRef<Element | null>(null);
  const coScoutTriggerRef = useRef<Element | null>(null);

  // Restore focus when mobile CoScout overlay closes
  useEffect(() => {
    if (!isPhone || isCoScoutOpen) return;
    if (coScoutTriggerRef.current instanceof HTMLElement) {
      coScoutTriggerRef.current.focus();
      coScoutTriggerRef.current = null;
    }
  }, [isPhone, isCoScoutOpen]);

  // Mobile tab bar navigation handler
  const handleMobileTabChange = useCallback(
    (tab: MobileTab) => {
      setMobileActiveTab(tab);
      const ps = usePanelsStore.getState();
      if (tab === 'findings') {
        if (isPhone) findingsTriggerRef.current = document.activeElement;
        ps.showInvestigation();
      } else if (tab === 'improve') {
        ps.showImprovement();
      } else if (tab === 'analysis') {
        ps.showAnalysis();
      }
    },
    [isPhone]
  );

  // Data flow hook
  const dataFlow = useEditorDataFlow({
    rawData,
    outcome,
    factors,
    specs,
    columnAliases,
    dataFilename,
    analysisMode,
    measureColumns,
    measureLabel,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    setAnalysisMode,
    setMeasureColumns,
    setMeasureLabel,
    loadProject,
    handleFileUpload: ingestion.handleFileUpload,
    processFile: ingestion.processFile,
    loadSample: ingestion.loadSample,
    applyTimeExtraction: ingestion.applyTimeExtraction,
  });

  // Mobile "More" sheet action handler
  const handleMobileMore = useCallback(
    (action: string) => {
      setMobileActiveTab('analysis');
      const ps = usePanelsStore.getState();
      switch (action) {
        case 'report':
          ps.showReport();
          break;
        case 'whatif':
          ps.setWhatIfOpen(true);
          break;
        case 'datatable':
          ps.openDataTable();
          break;
        case 'addpaste':
          dataFlow.startAppendPaste();
          break;
        case 'addfile':
          dataFlow.startAppendFileUpload();
          break;
        case 'addmanual':
          dataFlow.handleAddMoreData();
          break;
        case 'editdata':
          ps.openDataTable();
          break;
        case 'csv':
          if (outcome) downloadCSV(filteredData, outcome, specs);
          break;
      }
    },
    [dataFlow, filteredData, outcome, specs]
  );

  // Ref to allow ingestion callbacks to reach dataFlow setters
  const dataFlowRef = React.useRef(dataFlow);
  dataFlowRef.current = dataFlow;

  // Load sample passed from portfolio "Try a Sample" (effect below, after suspectedCausesState)
  const initialSampleConsumedRef = useRef(false);

  // Manual data analyze with append-mode merge
  const { handleManualDataAnalyze } = useDataMerge({
    appendMode: dataFlow.appendMode,
    existingConfig: dataFlow.existingConfig,
    rawData,
    setRawData,
    setDataFilename,
    setOutcome,
    setFactors,
    setSpecs,
    setDataQualityReport,
    setMeasureColumns,
    setMeasureLabel,
    setAnalysisMode,
    onDone: () => dataFlow.manualEntryDone(),
  });

  // Capability suggestion modal state
  const [showCapabilitySuggestion, setShowCapabilitySuggestion] = useState(false);
  const [capabilitySuggestionDismissed, setCapabilitySuggestionDismissed] = useState(false);

  // Load project data when opening an existing project
  const loadError = useProjectLoader({
    projectId,
    hasData: rawData.length > 0,
    isLoadingProject: dataFlow.isLoadingProject,
    startProjectLoad: dataFlow.startProjectLoad,
    projectLoaded: dataFlow.projectLoaded,
    loadProject,
    onBack,
  });

  // Filter navigation
  const filterNav = useFilterNavigation({
    enableHistory: false,
    enableUrlSync: false,
  });

  // Teams share integration
  const { share, setDeepLink } = useTeamsShare();
  const baseUrl = window.location.origin + window.location.pathname;
  const projectName = currentProjectName || 'New Analysis';

  // Dashboard → workspace navigation handler (ADR-055)
  const handleDashboardNavigate = useCallback((target: string, targetId?: string) => {
    const ps = usePanelsStore.getState();
    if (target === 'finding' && targetId) {
      ps.showInvestigation();
      useFindingsStore.getState().setHighlightedFindingId(targetId);
    } else if (target === 'findings' && targetId) {
      ps.showInvestigation();
      useFindingsStore.getState().setStatusFilter(targetId);
    } else if (target === 'question' && targetId) {
      ps.showInvestigation();
      useInvestigationFeatureStore.getState().expandToQuestion(targetId);
    } else if (target === 'improvement' || target === 'actions') {
      ps.showImprovement();
    } else if (target === 'report') {
      ps.showReport();
    } else if (target === 'coscout') {
      ps.showAnalysis();
      ps.setCoScoutOpen(true);
    } else {
      ps.showAnalysis();
    }
  }, []);

  const handleDashboardAddData = useCallback(() => {
    usePanelsStore.getState().showAnalysis();
    dataFlow.startAppendPaste();
  }, [dataFlow]);

  const handleDashboardResumeAnalysis = useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);

  // Share handlers
  const { shareFinding, canMentionInChannel } = useShareFinding({ projectName, baseUrl });

  // Compute projected metric value from selected improvement ideas
  const projectedFromIdeas = useMemo(() => {
    if (!processContext?.targetMetric || processContext?.targetValue === undefined)
      return undefined;
    if (!stats) return undefined;
    let totalMeanShift = 0;
    let totalSigmaReduction = 0;
    for (const h of persistedQuestions ?? []) {
      for (const idea of h.ideas ?? []) {
        if (idea.selected && idea.projection) {
          totalMeanShift += idea.projection.meanDelta;
          totalSigmaReduction += idea.projection.sigmaDelta;
        }
      }
    }
    if (totalMeanShift === 0 && totalSigmaReduction === 0) return undefined;
    const metric = processContext.targetMetric;
    if (metric === 'mean') return stats.mean + totalMeanShift;
    if (metric === 'sigma') return stats.stdDev + totalSigmaReduction;
    return undefined;
  }, [persistedQuestions, processContext, stats]);

  // Question auto-link refs: updated after questionsState is created (below),
  // read lazily inside useFindingsOrchestration callbacks via internal refs
  const focusedQuestionIdRef = React.useRef<string | null>(null);
  const linkFindingRef = React.useRef<((hId: string, fId: string) => void) | undefined>(undefined);

  // Findings orchestration
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const setHighlightedFindingId = useFindingsStore(s => s.setHighlightedFindingId);

  const {
    findingsState,
    handlePinFinding,
    handleRestoreFinding,
    findingsCallbacks,
    handleNavigateToChart,
    handleShareFinding,
    drillPath,
  } = useFindingsOrchestration({
    persistedFindings,
    setPersistedFindings,
    filters,
    filteredData,
    outcome,
    specs,
    rawData,
    columnAliases,
    filterNav,
    setFilters,
    shareFinding,
    canMentionInChannel,
    onViewStateChange: handleViewStateChange,
    questions: persistedQuestions,
    processContext,
    currentValue: stats?.cpk ?? stats?.mean,
    projectedValue: projectedFromIdeas,
    factorRoles: processContext?.factorRoles,
    aiAvailable: aiEnabled && isAIAvailable(),
    focusedQuestionId: focusedQuestionIdRef.current,
    linkFinding: linkFindingRef.current,
  });

  // Deep link: auto-open findings panel and highlight target finding (one-shot)
  // Also set activeView to 'dashboard' on project load unless deep-linked
  const deepLinkConsumedRef = React.useRef(false);
  useEffect(() => {
    if (deepLinkConsumedRef.current || !rawData.length || !outcome) return;

    const hasDeepLink =
      !!initialFindingId || !!initialChart || !!initialQuestionId || !!initialMode;

    if (initialFindingId) {
      if (!findingsState.findings.some(f => f.id === initialFindingId)) {
        showToast({
          type: 'warning',
          message: 'The linked finding was not found',
          dismissAfter: 5000,
        });
      } else {
        usePanelsStore.getState().showInvestigation();
        setHighlightedFindingId(initialFindingId);
      }
    }
    if (initialChart) {
      handleViewStateChange({
        focusedChart: initialChart as 'ichart' | 'boxplot' | 'pareto' | null,
      });
    }
    if (initialQuestionId) {
      if (!questionsState.questions.some(h => h.id === initialQuestionId)) {
        showToast({
          type: 'warning',
          message: 'The linked question was not found',
          dismissAfter: 5000,
        });
      } else {
        usePanelsStore.getState().showInvestigation();
        useInvestigationFeatureStore.getState().expandToQuestion(initialQuestionId);
      }
    }
    if (initialMode === 'investigation') {
      usePanelsStore.getState().showInvestigation();
    } else if (initialMode === 'improvement') {
      usePanelsStore.getState().showImprovement();
    } else if (initialMode === 'report') {
      usePanelsStore.getState().showReport();
    }

    if (hasDeepLink) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      // Deep-linked: stay in analysis view (or investigation/improvement set above)
      if (!initialMode) usePanelsStore.getState().showAnalysis();
    } else if (projectId) {
      // Project loaded with data, no deep link: honor persisted view or default to dashboard
      const persistedView = viewState?.activeView;
      if (persistedView && persistedView !== 'dashboard') {
        // Restore persisted workspace (analysis/investigation/improvement)
        usePanelsStore.getState().initFromViewState(viewState ?? undefined);
      } else {
        usePanelsStore.getState().showDashboard();
      }
    }
    deepLinkConsumedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData.length, outcome, initialFindingId, initialChart, initialQuestionId, initialMode]);

  // Update Teams deep link context when project/view changes
  useEffect(() => {
    if (!projectName || projectName === 'New Analysis') return;
    const chart = viewState?.focusedChart;
    setDeepLink(buildSubPageId(projectName, chart ? { chart } : {}), projectName);
  }, [projectName, viewState?.focusedChart, setDeepLink]);

  const handleShareChart = useCallback(
    (chartType: string) => {
      const payload = buildChartSharePayload(chartType, projectName, baseUrl);
      share(payload);
    },
    [projectName, baseUrl, share]
  );

  // TODO: Phase 3 — deepLinkUrl and handleShareTeams move to ProjectNameMenu

  // Current user (for comment author attribution)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  // Overview dashboard data: userId + other projects list
  const { overviewProjects, lastViewedAt, handleUpdateLastViewed } = useProjectOverview({
    listProjects,
    currentProjectName: currentProjectName ?? undefined,
    currentProjectLocation,
  });

  // Photo comments
  const { handleAddPhoto, handleCaptureFromTeams, isTeamsCamera, handleAddCommentWithAuthor } =
    usePhotoComments({
      findingsState,
      analysisId: currentProjectName || 'default',
      author: currentUser?.name,
    });

  // Question CRUD
  const questionsState = useQuestions({
    initialQuestions: persistedQuestions,
    onQuestionsChange: setPersistedQuestions,
    findings: findingsState.findings,
  });

  // Update question auto-link refs (consumed by useFindingsOrchestration callbacks)
  focusedQuestionIdRef.current = questionsState.focusedQuestionId;
  linkFindingRef.current = questionsState.linkFinding;

  // Investigation workflow
  const {
    handleCreateQuestion,
    handleProjectIdea,
    handleSaveIdeaProjection,
    clearProjectionTarget,
    handleSetFindingStatus,
    suspectedCausesState,
    questionsMap,
    ideaImpacts,
  } = useInvestigationOrchestration({
    questionsState,
    findingsState,
    processContext,
    stats,
  });
  const projectionTarget = useInvestigationFeatureStore(s => s.projectionTarget);

  // Load sample passed from portfolio "Try a Sample"
  useEffect(() => {
    if (initialSample && !initialSampleConsumedRef.current) {
      initialSampleConsumedRef.current = true;
      dataFlowRef.current.handleLoadSample(initialSample);
      // Inject suspected causes for showcase/demo datasets (not in DataContext)
      const hubs = initialSample.config.investigation?.suspectedCauses;
      if (hubs && hubs.length > 0) {
        suspectedCausesState.resetHubs(hubs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  // Investigation indexing for Foundry IQ (ADR-060 Pillar 2)
  // Active only when Team plan + KB preview enabled + project is open
  const { onFindingsChange: indexFindings, onQuestionsChange: indexQuestions } =
    useInvestigationIndexing({
      projectId: projectId ?? undefined,
      enabled: isKnowledgeBaseAvailable(),
    });

  // Trigger indexing side-effects whenever findings or questions change
  useEffect(() => {
    indexFindings(findingsState.findings);
  }, [findingsState.findings, indexFindings]);

  useEffect(() => {
    indexQuestions(questionsState.questions);
  }, [questionsState.questions, indexQuestions]);

  // Improvement workspace
  const {
    handleConvertIdeasToActions,
    handleOpenImprovementPopout,
    handleSynthesisChange,
    causeColors,
    causeLabels,
    causeSummaries,
    matrixIdeas,
    aggregatedActions,
    selectedIdeasForRecap,
    projectionReferenceContext,
    verificationData: improvVerificationData,
    hasVerification: improvHasVerification,
    currentOutcome: improvCurrentOutcome,
    outcomeNotes: improvOutcomeNotes,
    handleOutcomeChange: improvHandleOutcomeChange,
    handleOutcomeNotesChange: improvHandleOutcomeNotesChange,
    improvementQuestions,
    improvementLinkedFindings,
    selectedIdeaIds,
    projectedCpkMap: improvementProjectedCpkMap,
    convertedIdeaIds,
  } = useImprovementOrchestration({
    questionsState,
    findingsState,
    persistedQuestions: persistedQuestions,
    processContext,
    setProcessContext,
    rawData,
    outcome,
    specs,
    stagedStats,
  });
  const activeImprovementView = usePanelsStore(s => s.activeImprovementView);
  const highlightedIdeaId = usePanelsStore(s => s.highlightedIdeaId);

  // Verification prompt: show when new data is uploaded while findings are improving
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  // Matrix axis state (local — not persisted)
  const [matrixXAxis, setMatrixXAxis] = useState<MatrixDimension>('benefit');
  const [matrixYAxis, setMatrixYAxis] = useState<MatrixDimension>('timeframe');
  const [matrixColorBy, setMatrixColorBy] = useState<MatrixDimension>('cost');
  const [matrixPreset, setMatrixPreset] = useState<string>('benefit-time');

  // Brainstorm modal state
  const [brainstormQuestionId, setBrainstormQuestionId] = useState<string | null>(null);
  const brainstormQuestion = improvementQuestions.find(q => q.id === brainstormQuestionId);
  const hmwPrompts = useHMWPrompts(
    brainstormQuestion?.text ?? '',
    processContext?.problemStatement
  );
  // Local brainstorm ideas array — passed to BrainstormModal as props
  const [brainstormIdeas, setBrainstormIdeas] = useState<BrainstormIdea[]>([]);

  // Control violations for chart annotations (must be called unconditionally for hook order)
  const controlViolations = useControlViolations(filteredData, outcome, specs);

  // Capability suggestion: show when specs are set
  useEffect(() => {
    if (
      rawData.length > 0 &&
      (specs?.usl !== undefined || specs?.lsl !== undefined) &&
      (factors.length > 0 || rawData.length >= 10) &&
      !capabilitySuggestionDismissed &&
      !showCapabilitySuggestion &&
      !dataFlow.yamazumiDetection
    ) {
      setShowCapabilitySuggestion(true);
    }
  }, [
    rawData.length,
    factors.length,
    specs,
    capabilitySuggestionDismissed,
    showCapabilitySuggestion,
    dataFlow.yamazumiDetection,
  ]);

  // Show verification prompt when new data is uploaded while findings are improving
  const hasImprovingFindings = findingsState.findings.some(f => f.status === 'improving');
  useEffect(() => {
    if (hasImprovingFindings && stagedStats && !improvHasVerification) {
      setShowVerificationPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagedStats]); // Only trigger on stagedStats change (new data upload)

  // Journey phase detection
  const journeyPhase = useJourneyPhase(!!filteredData.length, findingsState.findings);
  const entryScenario = useMemo(() => detectEntryScenario(processContext), [processContext]);

  // Subgroup capability data for AI context
  const isCapabilityMode = displayOptions.standardIChartMetric === 'capability';
  const capabilityIChartData = useCapabilityIChartData({
    filteredData,
    outcome: outcome ?? '',
    specs: specs ?? {},
    subgroupConfig: subgroupConfig ?? { method: 'fixed-size', size: 5 },
    cpkTarget,
    enabled: isCapabilityMode,
  });
  const aiCapabilityData = useMemo(() => {
    if (!isCapabilityMode || !capabilityIChartData.cpkStats) return undefined;
    return {
      subgroupResults: capabilityIChartData.subgroupResults,
      cpkStats: capabilityIChartData.cpkStats
        ? {
            mean: capabilityIChartData.cpkStats.mean,
            ucl: capabilityIChartData.cpkStats.ucl,
            lcl: capabilityIChartData.cpkStats.lcl,
          }
        : null,
      cpStats: capabilityIChartData.cpStats ? { mean: capabilityIChartData.cpStats.mean } : null,
      config: subgroupConfig ?? { method: 'fixed-size' as const, size: 5 },
      cpkTarget,
    };
  }, [isCapabilityMode, capabilityIChartData, subgroupConfig, cpkTarget]);

  // AI orchestration
  const aiOrch = useAIOrchestration({
    enabled: aiEnabled,
    stats: stats ?? undefined,
    filteredData,
    rawData,
    outcome,
    specs,
    findings: findingsState.findings,
    questions: questionsState.questions,
    factors,
    filters,
    filterStack: filterNav.filterStack,
    processContext,
    highlightedFindingId,
    viewState,
    columnAliases,
    categories,
    stagedStats,
    drillPath,
    persistedQuestions,
    locale,
    knowledgeSearchFolder,
    journeyPhase,
    entryScenario,
    capabilityData: aiCapabilityData,
    analysisMode,
    onOpenCoScout: () => {
      if (isPhone) coScoutTriggerRef.current = document.activeElement;
      usePanelsStore.getState().setCoScoutOpen(true);
    },
    onOpenFindings: () => {
      if (isPhone) findingsTriggerRef.current = document.activeElement;
      usePanelsStore.getState().setFindingsOpen(true);
    },
  });

  // On-demand knowledge search handler
  const handleSearchKnowledge = useCallback(() => {
    const lastUserMsg = [...aiOrch.coscout.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg?.content) aiOrch.knowledgeSearch.search(lastUserMsg.content);
  }, [aiOrch.coscout.messages, aiOrch.knowledgeSearch]);

  // Action proposal state management
  const actionProposalsState = useActionProposals({
    messages: aiOrch.coscout.messages,
    filterNav,
    findingsState,
    questionsState,
    filters,
    stats,
    filteredDataLength: filteredData.length,
  });

  // Auto-send pending dashboard question to CoScout when panel opens
  useEffect(() => {
    if (!isCoScoutOpen) return;
    const pendingQ = useAIStore.getState().pendingDashboardQuestion;
    if (pendingQ) {
      useAIStore.getState().setPendingDashboardQuestion(null);
      // Send the question via CoScout's send function
      aiOrch.coscout.send(pendingQ);
    }
  }, [isCoScoutOpen, aiOrch.coscout]);

  // Pass categories and brief from ColumnMapping into DataContext
  const handleMappingConfirmWithCategories = useCallback(
    (
      newOutcome: string,
      newFactors: string[],
      newSpecs?: { target?: number; lsl?: number; usl?: number },
      newCategories?: InvestigationCategory[],
      brief?: AnalysisBrief
    ) => {
      if (newCategories) setCategories(newCategories);
      if (brief) {
        const updatedContext = { ...processContext };
        if (brief.issueStatement) updatedContext.issueStatement = brief.issueStatement;
        if (brief.target) {
          updatedContext.targetMetric = brief.target.metric;
          updatedContext.targetValue = brief.target.value;
          updatedContext.targetDirection = brief.target.direction;
        }
        setProcessContext(updatedContext);
        if (brief.questions) {
          for (const h of brief.questions) {
            questionsState.addQuestion(h.text, h.factor, h.level);
          }
        }
      }
      dataFlow.handleMappingConfirm(newOutcome, newFactors, newSpecs);
    },
    [dataFlow, setCategories, processContext, setProcessContext, questionsState]
  );

  // Compute excluded row data for DataTableModal
  const excludedRowIndices = useMemo(() => {
    if (!dataQualityReport?.excludedRows) return undefined;
    return new Set(dataQualityReport.excludedRows.map(r => r.index));
  }, [dataQualityReport]);

  const excludedReasons = useMemo(() => {
    if (!dataQualityReport?.excludedRows) return undefined;
    const map = new Map<number, ExclusionReason[]>();
    dataQualityReport.excludedRows.forEach(row => map.set(row.index, row.reasons));
    return map;
  }, [dataQualityReport]);

  // Save
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const handleSave = useCallback(async () => {
    const name = currentProjectName || cleanProjectName(dataFilename);
    setSaveStatus('saving');
    try {
      await saveProject(name);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [currentProjectName, dataFilename, saveProject]);

  const handleRenameProject = useCallback(() => {
    const newName = window.prompt('Rename project', currentProjectName || '');
    if (newName && newName !== currentProjectName && currentProjectName) {
      renameProject(currentProjectName, newName).then(() => handleSave());
    }
  }, [currentProjectName, renameProject, handleSave]);

  const handleExportCSV = useCallback(() => {
    if (outcome && filteredData.length > 0) {
      downloadCSV(filteredData, outcome, specs);
    }
  }, [filteredData, outcome, specs]);

  // Auto-save on key state changes (Phase 3)
  useAutoSave(
    handleSave,
    [persistedFindings, persistedQuestions, processContext, specs, displayOptions],
    rawData.length > 0 && !!projectId
  );

  // SharePoint file picker and save-as removed per ADR-059
  const handleSharePointFileImport = useCallback((_items: FilePickerResult[]) => {
    // No-op: SharePoint file import removed per ADR-059
  }, []);

  // ── Mode routing (full-screen takeover views) ────────────────────────────

  if (dataFlow.isPasteMode) {
    const isAppendPaste = dataFlow.appendMode && rawData.length > 0 && !!outcome;
    return (
      <PasteScreen
        onAnalyze={isAppendPaste ? dataFlow.handleAppendPaste : dataFlow.handlePasteAnalyze}
        onCancel={dataFlow.handlePasteCancel}
        error={dataFlow.pasteError}
        title={isAppendPaste ? 'Paste Additional Data' : undefined}
        submitLabel={isAppendPaste ? 'Add Data' : undefined}
      />
    );
  }

  if (dataFlow.isManualEntry) {
    return (
      <ManualEntry
        onAnalyze={handleManualDataAnalyze}
        onCancel={dataFlow.handleManualEntryCancel}
        appendMode={dataFlow.appendMode}
        existingConfig={dataFlow.appendMode ? dataFlow.existingConfig : undefined}
        existingRowCount={dataFlow.appendMode ? rawData.length : undefined}
      />
    );
  }

  if (dataFlow.isMapping) {
    return (
      <ColumnMapping
        columnAnalysis={dataFlow.mappingColumnAnalysis}
        availableColumns={Object.keys(rawData[0] || {})}
        previewRows={rawData.slice(0, 5)}
        totalRows={rawData.length}
        columnAliases={columnAliases}
        onColumnRename={dataFlow.handleColumnRename}
        initialOutcome={outcome}
        initialFactors={factors}
        datasetName={dataFilename || 'Pasted Data'}
        onConfirm={handleMappingConfirmWithCategories}
        onCancel={dataFlow.handleMappingCancel}
        dataQualityReport={dataQualityReport}
        maxFactors={6}
        mode={dataFlow.isMappingReEdit ? 'edit' : 'setup'}
        initialCategories={categories}
        timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
        hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
        onTimeExtractionChange={dataFlow.setTimeExtractionConfig}
        showBrief={true}
        initialIssueStatement={processContext?.issueStatement}
        suggestedStack={dataFlow.suggestedStack}
        onStackConfigChange={dataFlow.handleStackConfigChange}
        rowLimit={250000}
      />
    );
  }

  if (isWhatIfOpen) {
    return (
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <span className="text-content-secondary text-sm">Loading...</span>
          </div>
        }
      >
        <WhatIfPage
          onBack={() => {
            clearProjectionTarget();
            usePanelsStore.getState().setWhatIfOpen(false);
          }}
          filterCount={filterNav.filterStack.length}
          filterStack={filterNav.filterStack}
          projectionContext={
            projectionTarget
              ? {
                  ideaText: projectionTarget.ideaText,
                  questionText: projectionTarget.questionText,
                }
              : undefined
          }
          onSaveProjection={projectionTarget ? handleSaveIdeaProjection : undefined}
        />
      </Suspense>
    );
  }

  // ── Main editor layout ───────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-screen ${isPhone && rawData.length > 0 ? 'pb-[62px]' : ''}`}>
      <AppHeader
        mode="project"
        projectName={currentProjectName || (projectId ? `Analysis ${projectId}` : 'New Analysis')}
        rowCount={rawData.length}
        syncStatus={syncStatus}
        saveStatus={saveStatus}
        hasData={rawData.length > 0}
        activeView={activeView}
        openQuestionCount={
          questionsState.questions.filter(h => h.questionSource && h.status === 'open').length
        }
        selectedIdeaCount={selectedIdeaIds.size}
        isPISidebarOpen={isPISidebarOpen}
        onTogglePISidebar={() => usePanelsStore.getState().togglePISidebar()}
        isCoScoutOpen={isCoScoutOpen}
        onToggleCoScout={() => usePanelsStore.getState().toggleCoScout()}
        onAddPasteData={() => dataFlow.startAppendPaste()}
        onAddFileData={() => dataFlow.startAppendFileUpload()}
        onAddManualData={dataFlow.handleAddMoreData}
        onConvertToActions={() => {
          handleConvertIdeasToActions();
          usePanelsStore.getState().setActiveImprovementView('track');
        }}
        hasSelectedIdeas={selectedIdeaIds.size > 0}
        onNavigateToPortfolio={onBack}
        onOpenSettings={onOpenSettings}
        canNavigateBack={overviewProjects.length > 0}
        onRenameProject={currentProjectName ? handleRenameProject : undefined}
        onExportCSV={rawData.length > 0 ? handleExportCSV : undefined}
      />

      {/* Hidden file input for append-mode file upload */}
      <input
        ref={dataFlow.appendFileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={dataFlow.handleAppendFile}
        className="hidden"
      />

      {/* Feedback toast for append operations */}
      {dataFlow.appendFeedback && (
        <div className="flex items-center gap-2 mx-2 mb-2 px-3 py-2 bg-green-900/40 border border-green-700/50 rounded-lg text-sm text-green-300 animate-in fade-in duration-300">
          <Check size={14} className="text-green-400 shrink-0" />
          {dataFlow.appendFeedback}
        </div>
      )}

      {/* Main Content -- inert when phone overlay is open (F-18 focus trap) */}
      <div
        ref={el => {
          if (!el) return;
          if (isPhone && isCoScoutOpen) {
            el.setAttribute('inert', '');
          } else {
            el.removeAttribute('inert');
          }
        }}
        className="flex-1 flex flex-col min-h-0 bg-surface rounded-xl border border-edge overflow-hidden"
      >
        {rawData.length === 0 ? (
          <EditorEmptyState
            dataFlow={dataFlow}
            loadError={loadError}
            onSharePointFileImport={handleSharePointFileImport}
          />
        ) : outcome ? (
          <>
            {/* Workspace content (ADR-055) — tabs are in AppHeader */}
            {activeView === 'dashboard' ? (
              <div className="flex-1 overflow-y-auto">
                <ProjectDashboard
                  projectName={currentProjectName ?? 'Untitled'}
                  onNavigate={handleDashboardNavigate}
                  onAddData={handleDashboardAddData}
                  onResumeAnalysis={handleDashboardResumeAnalysis}
                  lastViewedAt={lastViewedAt}
                  projects={overviewProjects}
                  onViewPortfolio={onBack}
                  onUpdateLastViewed={handleUpdateLastViewed}
                />
              </div>
            ) : activeView === 'investigation' ? (
              <InvestigationWorkspace
                findingsState={findingsState}
                handleRestoreFinding={handleRestoreFinding}
                handleSetFindingStatus={handleSetFindingStatus}
                handleNavigateToChart={handleNavigateToChart}
                handleShareFinding={handleShareFinding}
                drillPath={drillPath}
                questionsState={questionsState}
                handleCreateQuestion={handleCreateQuestion}
                handleProjectIdea={handleProjectIdea}
                handleAddCommentWithAuthor={handleAddCommentWithAuthor}
                handleAddPhoto={hasTeamFeatures() ? handleAddPhoto : undefined}
                handleCaptureFromTeams={
                  hasTeamFeatures() && isTeamsCamera ? handleCaptureFromTeams : undefined
                }
                isTeamsCamera={isTeamsCamera}
                aiOrch={aiOrch}
                columnAliases={columnAliases}
                viewMode={viewState?.findingsViewMode}
                onViewModeChange={(mode: 'list' | 'board' | 'tree') =>
                  handleViewStateChange({ findingsViewMode: mode })
                }
                suspectedCausesState={suspectedCausesState}
                questionsMap={questionsMap}
                ideaImpacts={ideaImpacts}
              />
            ) : activeView === 'improvement' ? (
              <ImprovementWorkspaceBase
                synthesis={processContext?.synthesis}
                onSynthesisChange={handleSynthesisChange}
                questions={improvementQuestions}
                linkedFindings={improvementLinkedFindings}
                onToggleSelect={(hId, iId, sel) => questionsState.selectIdea(hId, iId, sel)}
                onUpdateTimeframe={(hId, iId, timeframe) =>
                  questionsState.updateIdea(hId, iId, { timeframe })
                }
                onUpdateDirection={(hId, iId, dir) =>
                  questionsState.updateIdea(hId, iId, { direction: dir })
                }
                onUpdateCost={(hId, iId, cost) => questionsState.updateIdea(hId, iId, { cost })}
                onOpenRisk={() => {}}
                onRemoveIdea={questionsState.removeIdea}
                onOpenWhatIf={(questionId, ideaId) => handleProjectIdea(questionId, ideaId, true)}
                onAddIdea={(hId, text) => questionsState.addIdea(hId, text)}
                onAskCoScout={aiOrch.handleAskCoScoutFromIdeas}
                onConvertToActions={() => {
                  handleConvertIdeasToActions();
                  usePanelsStore.getState().setActiveImprovementView('track');
                }}
                onBack={() => usePanelsStore.getState().showAnalysis()}
                onPopout={handleOpenImprovementPopout}
                selectedIdeaIds={selectedIdeaIds}
                convertedIdeaIds={convertedIdeaIds}
                targetCpk={processContext?.targetValue}
                activeView={activeImprovementView}
                showLeftPanel={true}
                renderLeftPanel={() => {
                  if (projectionTarget) {
                    return (
                      <WhatIfPageBase
                        filteredData={filteredData}
                        rawData={rawData}
                        outcome={outcome}
                        specs={specs}
                        filterCount={0}
                        onBack={() => clearProjectionTarget()}
                        cpkTarget={cpkTarget}
                        activeFactor={viewState?.boxplotFactor}
                        projectionContext={{
                          ideaText: projectionTarget.ideaText,
                          questionText: projectionTarget.questionText,
                        }}
                        onSaveProjection={handleSaveIdeaProjection}
                        referenceContext={projectionReferenceContext}
                      />
                    );
                  }
                  return (
                    <ImprovementContextPanel
                      problemStatement={processContext?.problemStatement}
                      targetCpk={processContext?.targetValue}
                      currentCpk={stats?.cpk}
                      causes={causeSummaries}
                      synthesis={processContext?.synthesis}
                    />
                  );
                }}
                renderMatrix={() => (
                  <div className="p-4">
                    <PrioritizationMatrix
                      ideas={matrixIdeas}
                      xAxis={matrixXAxis}
                      yAxis={matrixYAxis}
                      colorBy={matrixColorBy}
                      causeColors={causeColors}
                      causeLabels={causeLabels}
                      presets={DEFAULT_PRESETS}
                      activePreset={matrixPreset}
                      onPresetChange={setMatrixPreset}
                      onAxisChange={(axis, value) => {
                        if (axis === 'x') setMatrixXAxis(value);
                        else if (axis === 'y') setMatrixYAxis(value);
                        else setMatrixColorBy(value);
                      }}
                      onToggleSelect={ideaId => {
                        const question = improvementQuestions.find(q =>
                          q.ideas?.some((i: { id: string }) => i.id === ideaId)
                        );
                        if (question) {
                          questionsState.selectIdea(
                            question.id,
                            ideaId,
                            !selectedIdeaIds.has(ideaId)
                          );
                        }
                      }}
                      highlightedIdeaId={highlightedIdeaId ?? undefined}
                      onIdeaClick={ideaId => {
                        const card = document.querySelector(`[data-testid="idea-row-${ideaId}"]`);
                        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        usePanelsStore.getState().setHighlightedIdeaId(ideaId);
                        setTimeout(
                          () => usePanelsStore.getState().setHighlightedIdeaId(null),
                          2000
                        );
                      }}
                      onGhostDotClick={ideaId => {
                        const question = improvementQuestions.find(q =>
                          q.ideas?.some((i: { id: string }) => i.id === ideaId)
                        );
                        if (question) {
                          handleProjectIdea(question.id, ideaId, true);
                        }
                      }}
                    />
                  </div>
                )}
                onIdeaHover={ideaId => usePanelsStore.getState().setHighlightedIdeaId(ideaId)}
                highlightedIdeaId={highlightedIdeaId}
                onOpenBrainstorm={questionId => {
                  setBrainstormQuestionId(questionId);
                  setBrainstormIdeas([]);
                }}
                renderTrackView={() => (
                  <TrackView
                    selectedIdeas={selectedIdeasForRecap}
                    onEditSelection={() =>
                      usePanelsStore.getState().setActiveImprovementView('plan')
                    }
                    onBackToPlan={() => usePanelsStore.getState().setActiveImprovementView('plan')}
                    actions={aggregatedActions}
                    onToggleComplete={(actionId, findingId) => {
                      findingsState.toggleActionComplete(findingId, actionId);
                    }}
                    verification={improvVerificationData}
                    hasVerification={improvHasVerification}
                    selectedOutcome={
                      improvCurrentOutcome
                        ? improvCurrentOutcome.effective === 'yes'
                          ? 'effective'
                          : improvCurrentOutcome.effective === 'partial'
                            ? 'partial'
                            : 'not-effective'
                        : undefined
                    }
                    outcomeNotes={improvOutcomeNotes}
                    onOutcomeChange={improvHandleOutcomeChange}
                    onOutcomeNotesChange={improvHandleOutcomeNotesChange}
                  />
                )}
              />
            ) : activeView === 'report' ? (
              <Suspense fallback={null}>
                <ReportView
                  onClose={() => usePanelsStore.getState().showAnalysis()}
                  aiEnabled={aiEnabled && isAIAvailable()}
                  narrative={aiOrch.narration.narrative}
                />
              </Suspense>
            ) : (
              <EditorDashboardView
                dataFlow={dataFlow}
                filterNav={filterNav}
                viewState={viewState ?? undefined}
                onViewStateChange={handleViewStateChange}
                projectId={projectId ?? undefined}
                findingsState={findingsState}
                findingsCallbacks={findingsCallbacks}
                handlePinFinding={handlePinFinding}
                handleSetFindingStatus={handleSetFindingStatus}
                questionsState={questionsState}
                handleAddCommentWithAuthor={handleAddCommentWithAuthor}
                aiOrch={aiOrch}
                actionProposalsState={actionProposalsState}
                handleSearchKnowledge={handleSearchKnowledge}
                handleShareChart={handleShareChart}
                controlViolations={controlViolations}
                excludedRowIndices={excludedRowIndices}
                excludedReasons={excludedReasons}
                projectedCpkMap={improvementProjectedCpkMap}
              />
            )}
          </>
        ) : (
          <ColumnMapping
            columnAnalysis={dataFlow.mappingColumnAnalysis}
            availableColumns={Object.keys(rawData[0] || {})}
            previewRows={rawData.slice(0, 5)}
            totalRows={rawData.length}
            columnAliases={columnAliases}
            onColumnRename={dataFlow.handleColumnRename}
            initialOutcome={outcome}
            initialFactors={factors}
            datasetName={dataFilename || 'Data'}
            onConfirm={handleMappingConfirmWithCategories}
            onCancel={dataFlow.handleMappingCancel}
            dataQualityReport={dataQualityReport}
            maxFactors={6}
            initialCategories={categories}
            timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
            hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
            onTimeExtractionChange={dataFlow.setTimeExtractionConfig}
            showBrief={true}
            initialIssueStatement={processContext?.issueStatement}
            suggestedStack={dataFlow.suggestedStack}
            rowLimit={250000}
          />
        )}
      </div>

      {/* Detection modals */}
      <EditorModals
        yamazumiDetection={dataFlow.yamazumiDetection}
        onEnableYamazumi={taktTime => {
          const m = dataFlow.yamazumiDetection!.suggestedMapping;
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
          dataFlow.dismissYamazumiDetection();
        }}
        onDeclineYamazumi={() => dataFlow.dismissYamazumiDetection()}
        showCapabilitySuggestion={showCapabilitySuggestion}
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

      {/* Mobile Tab Bar (phone only, when data loaded) */}
      {isPhone && rawData.length > 0 && (
        <MobileTabBar
          activeTab={mobileActiveTab}
          onTabChange={handleMobileTabChange}
          findingsCount={findingsState.findings.length}
          showImproveTab={factors.length > 0}
        />
      )}

      {/* More bottom sheet (phone only) */}
      {mobileActiveTab === 'more' && isPhone && (
        <EditorMobileSheet
          onAction={handleMobileMore}
          onClose={() => setMobileActiveTab('analysis')}
        />
      )}

      {/* Verification prompt: shown when data uploaded while findings are improving */}
      {showVerificationPrompt && (
        <VerificationPrompt
          improvingActionCount={aggregatedActions.filter(a => !a.completedAt).length}
          onConfirmVerification={() => setShowVerificationPrompt(false)}
          onDismiss={() => setShowVerificationPrompt(false)}
        />
      )}

      {/* Brainstorm modal: hoisted to top-level so it survives view navigation */}
      <BrainstormModal
        isOpen={brainstormQuestionId !== null}
        causeName={brainstormQuestion?.text ?? ''}
        hmwPrompts={hmwPrompts}
        ideas={brainstormIdeas}
        onAddIdea={(direction: IdeaDirection, text: string) => {
          const id = `brainstorm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          setBrainstormIdeas(prev => [
            ...prev,
            { id, text, direction, aiGenerated: false, voteCount: 0 },
          ]);
        }}
        onEditIdea={(ideaId: string, text: string) => {
          setBrainstormIdeas(prev => prev.map(i => (i.id === ideaId ? { ...i, text } : i)));
        }}
        onRemoveIdea={(ideaId: string) => {
          setBrainstormIdeas(prev => prev.filter(i => i.id !== ideaId));
        }}
        onClose={() => setBrainstormQuestionId(null)}
        onDone={(selectedIds: string[]) => {
          if (brainstormQuestionId) {
            const selected = brainstormIdeas.filter(i => selectedIds.includes(i.id));
            for (const idea of selected) {
              questionsState.addIdea(brainstormQuestionId, idea.text);
            }
          }
          setBrainstormQuestionId(null);
          setBrainstormIdeas([]);
        }}
      />
    </div>
  );
};
