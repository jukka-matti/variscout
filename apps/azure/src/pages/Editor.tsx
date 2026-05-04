import React, { useMemo, useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { lazyWithRetry } from '../lib/chunkReload';
import type { SampleDataset } from '@variscout/data';
import { useStorage } from '../services/storage';
import type { StorageLocation } from '../services/storage';
import { useProjectLoader } from '../hooks/useProjectLoader';
import { useProjectOverview } from '../hooks/useProjectOverview';
import {
  useProjectStore,
  useInvestigationStore,
  useSessionStore,
  useWallLayoutStore,
} from '@variscout/stores';
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
  ImprovementWorkspaceBase,
  ImprovementContextPanel,
  WhatIfExplorerPage,
  PrioritizationMatrix,
  TrackView,
  VerificationPrompt,
  BrainstormModal,
  QuestionLinkPrompt,
  SurveyNotebookBase,
  DEFAULT_PRESETS,
  type ColumnMappingConfirmPayload,
  type MatrixDimension,
  StageFiveModal,
  MatchSummaryCard,
  type ColumnShape,
} from '@variscout/ui';
import { useStageFiveOpener } from '../features/hubCreation/useStageFiveOpener';
import {
  useControlViolations,
  useQuestions,
  useJourneyPhase,
  detectEntryScenario,
  useCapabilityIChartData,
  useTranslation,
  useHMWPrompts,
} from '@variscout/hooks';
import {
  DEFAULT_PROCESS_HUB_ID,
  hasTeamFeatures,
  downloadCSV,
  computeBestSubsets,
  evaluateSurvey,
  getColumnNames,
} from '@variscout/core';
import { isAIAvailable } from '../services/aiService';
import { usePhotoComments } from '../hooks/usePhotoComments';
import { getCurrentUser, type CurrentUser } from '../auth/getCurrentUser';
import { useDataMerge } from '../hooks/useDataMerge';
import type {
  ExclusionReason,
  Finding,
  Question,
  IdeaDirection,
  InvestigationDepth,
  InvestigationStatus,
  ProcessContext,
  ProcessHub,
} from '@variscout/core';
import type { SurveyRecommendation } from '@variscout/core/survey';
import { resolveCpkTarget } from '@variscout/core/capability';
import type { BrainstormIdea } from '@variscout/core/findings';
import { Check, X } from 'lucide-react';
import { type FilePickerResult } from '../components/FileBrowseButton';
import { useIsMobile, BREAKPOINTS, MobileTabBar, type MobileTab } from '@variscout/ui';
import { useAIOrchestration, useActionProposals, useInvestigationIndexing } from '../features/ai';
import { useInvestigationOrchestration } from '../features/investigation';
import { useWallLayoutLifecycle } from '../features/investigation/useWallLayoutLifecycle';
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
import { SustainmentEntryRow } from './Editor.sustainment';
import { EditorEmptyState } from '../components/editor/EditorEmptyState';
import { EditorDashboardView } from '../components/editor/EditorDashboardView';
import { HubCreationFlow } from '../features/hubCreation';
// WorkspaceTabs merged into AppHeader (ADR-055 header redesign)
import { InvestigationWorkspace } from '../components/editor/InvestigationWorkspace';
import FrameView from '../components/editor/FrameView';
import { EditorModals } from '../components/editor/EditorModals';
import { EditorMobileSheet } from '../components/editor/EditorMobileSheet';
import ProjectDashboard from '../components/ProjectDashboard';
import { useAIStore } from '../features/ai/aiStore';

const WhatIfPage = lazyWithRetry(() => import('../components/WhatIfPage'));
const ReportView = lazyWithRetry(() => import('../components/views/ReportView'));

const INVESTIGATION_DEPTHS: InvestigationDepth[] = ['quick', 'focused', 'chartered'];
const INVESTIGATION_STATUSES: InvestigationStatus[] = [
  'issue-captured',
  'framing',
  'scouting',
  'investigating',
  'ready-to-improve',
  'improving',
  'verifying',
  'resolved',
  'controlled',
];

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

function participantFromText(value: string): { displayName: string } | undefined {
  const trimmed = value.trim();
  return trimmed ? { displayName: trimmed } : undefined;
}

function formatStatusLabel(value: string): string {
  return value.replace(/-/g, ' ');
}

interface InvestigationMetadataPanelProps {
  projectId: string | null;
  processContext: ProcessContext | undefined;
  processHubs: ProcessHub[];
  onChange: (context: ProcessContext) => void;
}

const InvestigationMetadataPanel: React.FC<InvestigationMetadataPanelProps> = ({
  projectId,
  processContext,
  processHubs,
  onChange,
}) => {
  const context = processContext ?? {};
  const update = (patch: Partial<ProcessContext>) => onChange({ ...context, ...patch });

  return (
    <div className="mx-2 mb-2 rounded-lg border border-edge bg-surface-secondary/70 p-3">
      <div className="grid gap-3 lg:grid-cols-6">
        <label className="text-xs text-content-secondary">
          <span className="mb-1 block">Process Hub</span>
          <select
            value={context.processHubId ?? DEFAULT_PROCESS_HUB_ID}
            onChange={event => update({ processHubId: event.target.value })}
            className="w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
          >
            {processHubs.map(hub => (
              <option key={hub.id} value={hub.id}>
                {hub.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-content-secondary">
          <span className="mb-1 block">Depth</span>
          <select
            value={context.investigationDepth ?? 'quick'}
            onChange={event =>
              update({ investigationDepth: event.target.value as InvestigationDepth })
            }
            className="w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
          >
            {INVESTIGATION_DEPTHS.map(depth => (
              <option key={depth} value={depth}>
                {depth}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-content-secondary">
          <span className="mb-1 block">Status</span>
          <select
            value={context.investigationStatus ?? 'scouting'}
            onChange={event =>
              update({ investigationStatus: event.target.value as InvestigationStatus })
            }
            className="w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
          >
            {INVESTIGATION_STATUSES.map(status => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-content-secondary">
          <span className="mb-1 block">Owner</span>
          <input
            value={context.investigationOwner?.displayName ?? ''}
            onChange={event =>
              update({ investigationOwner: participantFromText(event.target.value) })
            }
            className="w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
          />
        </label>
        <label className="text-xs text-content-secondary">
          <span className="mb-1 block">Sponsor</span>
          <input
            value={context.sponsor?.displayName ?? ''}
            onChange={event => update({ sponsor: participantFromText(event.target.value) })}
            className="w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
          />
        </label>
        <label className="text-xs text-content-secondary">
          <span className="mb-1 block">Contributors</span>
          <input
            value={context.contributors?.map(c => c.displayName).join(', ') ?? ''}
            onChange={event =>
              update({
                contributors: event.target.value
                  .split(',')
                  .map(name => name.trim())
                  .filter(Boolean)
                  .map(displayName => ({ displayName })),
              })
            }
            className="w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs text-content-secondary">
        <span className="mb-1 block">Next Move</span>
        <input
          value={context.nextMove ?? ''}
          onChange={event => update({ nextMove: event.target.value })}
          className="w-full rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-content"
        />
      </label>
      {(context.investigationStatus === 'resolved' ||
        context.investigationStatus === 'controlled') && (
        <SustainmentEntryRow
          investigationId={projectId}
          hubId={context.processHubId ?? DEFAULT_PROCESS_HUB_ID}
        />
      )}
    </div>
  );
};

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
  /** Process Hub to assign when starting a new investigation from the hub home */
  initialProcessHubId?: string;
  /**
   * When true, open PasteScreen immediately on mount (used by "Add framing" CTA
   * to route directly to the paste flow rather than stopping at EditorEmptyState).
   */
  startPasteOnMount?: boolean;
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
  initialProcessHubId,
  startPasteOnMount,
}) => {
  const {
    syncStatus,
    listProjects,
    listProcessHubs,
    saveProject: saveToCloud,
    saveProcessHub,
  } = useStorage();
  const { locale } = useLocale();
  const { showToast } = useToast();

  // ── Zustand store selectors (replaces useDataStateCtx) ────────────────────
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const timeColumn = useProjectStore(s => s.timeColumn);
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
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });
  const yamazumiMapping = useProjectStore(s => s.yamazumiMapping);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const processContext = useProjectStore(s => s.processContext) ?? undefined;

  // Investigation store (domain — findings/questions/categories)
  const persistedFindings = useInvestigationStore(s => s.findings);
  const persistedQuestions = useInvestigationStore(s => s.questions);
  const suspectedCauses = useInvestigationStore(s => s.suspectedCauses);
  const categories = useInvestigationStore(s => s.categories);
  const linkFindingToQuestion = useInvestigationStore(s => s.linkFindingToQuestion);

  // Session store
  const aiEnabled = useSessionStore(s => s.aiEnabled);
  const knowledgeSearchFolder = useSessionStore(s => s.knowledgeSearchFolder) ?? undefined;
  const skipQuestionLinkPrompt = useSessionStore(s => s.skipQuestionLinkPrompt);
  const setSkipQuestionLinkPrompt = useSessionStore(s => s.setSkipQuestionLinkPrompt);

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
  const setDefectMapping = useProjectStore(s => s.setDefectMapping);
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
    onDefectDetected: result => {
      dataFlowRef.current?.handleDefectDetectedFromIngestion(result);
    },
    getRawData: () => rawData,
    getOutcome: () => outcome,
    getFactors: () => factors,
  });
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  useTranslation();

  // Mobile tab bar state (phone only)
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('analysis');
  const [isMobileSurveyOpen, setIsMobileSurveyOpen] = useState(false);
  const [processHubs, setProcessHubs] = useState<ProcessHub[]>([]);

  // Reset mobile tab when data is cleared
  useEffect(() => {
    if (rawData.length === 0) setMobileActiveTab('analysis');
  }, [rawData.length]);

  useEffect(() => {
    listProcessHubs()
      .then(setProcessHubs)
      .catch(() => setProcessHubs([]));
  }, [listProcessHubs]);

  useEffect(() => {
    if (!initialProcessHubId || projectId || processContext?.processHubId) return;
    setProcessContext({ ...(processContext ?? {}), processHubId: initialProcessHubId });
  }, [initialProcessHubId, processContext, projectId, setProcessContext]);

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
  const activeHub = processHubs.find(h => h.id === processContext?.processHubId);

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
    activeHub,
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

  // Start paste mode immediately when opened via "Add framing" CTA so the
  // analyst lands directly on PasteScreen rather than EditorEmptyState.
  useEffect(() => {
    if (!startPasteOnMount) return;
    usePanelsStore.getState().showAnalysis();
    dataFlow.startPaste();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        case 'survey':
          setIsMobileSurveyOpen(true);
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

  const surveyEvaluation = useMemo(
    () =>
      evaluateSurvey({
        data: rawData,
        outcomeColumn: outcome,
        factorColumns: factors,
        timeColumn,
        specs,
        yamazumiMapping,
        defectMapping,
        processContext,
        questions: persistedQuestions,
        findings: persistedFindings,
        branches: suspectedCauses,
      }),
    [
      rawData,
      outcome,
      factors,
      timeColumn,
      specs,
      yamazumiMapping,
      defectMapping,
      processContext,
      persistedQuestions,
      persistedFindings,
      suspectedCauses,
    ]
  );

  const handleAcceptSurveyRecommendation = useCallback(
    (recommendation: SurveyRecommendation) => {
      setProcessContext({
        ...(processContext ?? {}),
        nextMove: recommendation.actionText,
      });
    },
    [processContext, setProcessContext]
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

  /**
   * Mode B entry: "New Hub" from the dashboard starts the paste → framing flow.
   * Navigates to the analysis view so PasteScreen is visible, then opens paste.
   */
  const handleNewHub = useCallback(() => {
    usePanelsStore.getState().showAnalysis();
    dataFlow.startPaste();
  }, [dataFlow]);

  // Stage 5 modal — opens after Mode B Stage 3 confirm and via on-demand button.
  const stageFive = useStageFiveOpener();

  /**
   * Called by HubCreationFlow once Stage 1 creates a hub. Adds the new hub to
   * the local list and sets it as the active hub in processContext so the
   * ColumnMapping confirm (Stage 3) can persist outcomes to it.
   */
  const handleHubCreated = useCallback(
    (hub: ProcessHub) => {
      setProcessHubs(prev => [...prev, hub]);
      setProcessContext({ ...(processContext ?? {}), processHubId: hub.id });
    },
    [processContext, setProcessContext]
  );

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

  // Question-link prompt state (shown after chart observation creates a Finding)
  const [questionLinkPromptOpen, setQuestionLinkPromptOpen] = useState(false);
  const [questionLinkFindingId, setQuestionLinkFindingId] = useState<string>('');

  // Intercept chart observation to show prompt if user has not opted out
  const wrappedOnAddChartObservation = useCallback(
    (
      chartType: 'boxplot' | 'pareto' | 'ichart',
      categoryKey?: string,
      noteText?: string,
      anchorX?: number,
      anchorY?: number
    ) => {
      const result = findingsCallbacks.onAddChartObservation?.(
        chartType,
        categoryKey,
        noteText,
        anchorX,
        anchorY
      );
      if (result && !skipQuestionLinkPrompt) {
        setQuestionLinkFindingId(result.id);
        setQuestionLinkPromptOpen(true);
      }
      return result;
    },
    [findingsCallbacks, skipQuestionLinkPrompt]
  );

  // Stable wrapped findingsCallbacks with intercepted onAddChartObservation
  const findingsCallbacksWithPrompt = useMemo(
    () => ({ ...findingsCallbacks, onAddChartObservation: wrappedOnAddChartObservation }),
    [findingsCallbacks, wrappedOnAddChartObservation]
  );

  // Question-link prompt handlers
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

  // Wall-variant propose-hypothesis CTA — creates a new SuspectedCause hub seeded
  // from the finding and links the finding as the first piece of evidence.
  const wallViewMode = useWallLayoutStore(s => s.viewMode);
  const createHubFromFinding = useInvestigationStore(s => s.createHubFromFinding);
  const handleProposeHypothesisFromFinding = useCallback(
    (findingId: string) => {
      createHubFromFinding(findingId);
    },
    [createHubFromFinding]
  );

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

  // Wall layout persistence — rehydrate on project open, debounce-persist on change.
  useWallLayoutLifecycle(projectId);

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
      !dataFlow.yamazumiDetection &&
      !dataFlow.defectDetection
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
    dataFlow.defectDetection,
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

  // Best subsets for AI context (interaction effects)
  const bestSubsetsForAI = useMemo(
    () =>
      outcome && factors.length > 0 && filteredData.length >= 5
        ? computeBestSubsets(filteredData, outcome, factors)
        : null,
    [filteredData, outcome, factors]
  );

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
    bestSubsetsResult: bestSubsetsForAI ?? undefined,
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

  // Handle ColumnMapping confirm — adopts new Hub-shaped payload (slice-2 contract).
  // Wire categories, brief, and investigation state; persist outcomes + primaryScopeDimensions
  // to the active Hub via saveProcessHub (Task H will surface this on ProcessHubView — for
  // Task A we wire the data path so it's available from this point forward).
  const handleMappingConfirmWithCategories = useCallback(
    (payload: ColumnMappingConfirmPayload) => {
      const { categories: newCategories, brief, outcomes, primaryScopeDimensions } = payload;

      // Derive legacy 3-arg shape for dataFlow (investigation store compat).
      const newOutcome = outcomes[0]?.columnName ?? '';
      const newFactors = primaryScopeDimensions;
      const firstSpec = outcomes[0];
      const newSpecs =
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

      if (newCategories) setCategories(newCategories);

      if (brief) {
        const updatedContext = { ...processContext };
        if (brief.issueStatement) updatedContext.issueStatement = brief.issueStatement;
        if (brief.target) {
          updatedContext.targetMetric = brief.target
            .metric as import('@variscout/core').TargetMetric;
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

      // Persist outcomes + primaryScopeDimensions to the active Hub.
      // The Hub is identified by processContext.processHubId; save is async
      // (fire-and-forget here — ProcessHubView Task H surfaces the persisted state).
      if (
        (outcomes.length > 0 || primaryScopeDimensions.length > 0) &&
        processContext?.processHubId
      ) {
        const currentHub = processHubs.find(h => h.id === processContext.processHubId);
        if (currentHub) {
          saveProcessHub({
            ...currentHub,
            outcomes,
            primaryScopeDimensions,
            updatedAt: new Date().toISOString(),
          }).catch(() => {
            // Non-blocking — storage failure is logged by the storage service
          });
        }
      }

      // Delegate to investigation flow (legacy 3-arg form for importFlow compat).
      dataFlow.handleMappingConfirm(newOutcome, newFactors, newSpecs);

      // Stage 5 (spec §5.5): open the floating investigation-context modal before
      // the canvas paints so the analyst can capture issue / questions upfront.
      stageFive.openModeB();
    },
    [
      dataFlow,
      setCategories,
      processContext,
      setProcessContext,
      questionsState,
      processHubs,
      saveProcessHub,
      stageFive,
    ]
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
    /*
     * Mode B (new investigation, not a re-edit): gate ColumnMapping behind
     * Stage 1 (HubGoalForm) via HubCreationFlow. On re-edit or when a hub
     * already exists the HubCreationFlow skips Stage 1 and renders
     * ColumnMapping directly — same net behaviour as before.
     */
    return (
      <HubCreationFlow
        columnAnalysis={dataFlow.mappingColumnAnalysis}
        availableColumns={Object.keys(rawData[0] || {})}
        previewRows={rawData.slice(0, 5)}
        totalRows={rawData.length}
        columnAliases={columnAliases}
        onColumnRename={dataFlow.handleColumnRename}
        initialOutcome={outcome}
        initialFactors={factors}
        initialOutcomes={activeHub?.outcomes}
        initialPrimaryScopeDimensions={activeHub?.primaryScopeDimensions}
        datasetName={dataFilename || 'Pasted Data'}
        onConfirm={handleMappingConfirmWithCategories}
        onCancel={dataFlow.handleMappingCancel}
        dataQualityReport={dataQualityReport}
        maxFactors={6}
        isMappingReEdit={dataFlow.isMappingReEdit}
        initialCategories={categories}
        timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
        hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
        onTimeExtractionChange={config =>
          dataFlow.setTimeExtractionConfig(prev => ({ ...prev, ...config }))
        }
        suggestedStack={dataFlow.suggestedStack}
        onStackConfigChange={dataFlow.handleStackConfigChange}
        rowLimit={250000}
        processHubId={processContext?.processHubId}
        onHubCreated={handleHubCreated}
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

      <InvestigationMetadataPanel
        projectId={projectId}
        processContext={processContext}
        processHubs={processHubs}
        onChange={setProcessContext}
      />

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
            {/* Canvas framing toolbar — '+New investigation' on-demand entry
                (Mode A.1 reopen path, spec §5.5). Visible whenever data + outcome are
                set (i.e. the analyst is on the canvas, not in a mapping modal). */}
            <div
              className="flex items-center gap-2 px-4 py-1.5 bg-surface-secondary border-b border-edge"
              data-testid="framing-toolbar"
            >
              <div className="flex-1" />
              <button
                type="button"
                onClick={stageFive.openOnDemand}
                data-testid="canvas-new-investigation"
                className="text-xs px-2 py-1 rounded border border-edge text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              >
                + New investigation
              </button>
            </div>

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
                  onNewHub={handleNewHub}
                />
              </div>
            ) : activeView === 'frame' ? (
              <FrameView />
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
                actionProposalsState={actionProposalsState}
                handleSearchKnowledge={handleSearchKnowledge}
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
                      <WhatIfExplorerPage
                        filteredData={filteredData}
                        rawData={rawData}
                        outcome={outcome}
                        specs={specs}
                        filterCount={0}
                        onBack={() => clearProjectionTarget()}
                        cpkTarget={cpkTarget}
                        activeFactor={viewState?.boxplotFactor}
                        mode={analysisMode ?? 'standard'}
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
                      currentUnderstanding={processContext?.currentUnderstanding}
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
                findingsCallbacks={findingsCallbacksWithPrompt}
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
          /* rawData present but no outcome yet — treat same as isMapping (Mode B gate) */
          <HubCreationFlow
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
            isMappingReEdit={false}
            initialCategories={categories}
            timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
            hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
            onTimeExtractionChange={config =>
              dataFlow.setTimeExtractionConfig(prev => ({ ...prev, ...config }))
            }
            suggestedStack={dataFlow.suggestedStack}
            rowLimit={250000}
            processHubId={processContext?.processHubId}
            onHubCreated={handleHubCreated}
            initialOutcomes={processHubs.find(h => h.id === processContext?.processHubId)?.outcomes}
            initialPrimaryScopeDimensions={
              processHubs.find(h => h.id === processContext?.processHubId)?.primaryScopeDimensions
            }
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
        defectDetection={dataFlow.defectDetection}
        columnNames={getColumnNames(rawData)}
        onEnableDefect={mapping => {
          setAnalysisMode('defect');
          setDefectMapping(mapping);
          dataFlow.dismissDefectDetection();
        }}
        onDeclineDefect={() => dataFlow.dismissDefectDetection()}
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

      {isMobileSurveyOpen && isPhone && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileSurveyOpen(false)}
          />
          <div className="fixed bottom-[50px] left-0 right-0 z-50 max-h-[80vh] rounded-t-2xl border-t border-edge bg-surface-primary safe-area-bottom">
            <div className="flex items-center justify-between border-b border-edge px-4 py-3">
              <div className="text-sm font-semibold text-content">Survey</div>
              <button
                type="button"
                aria-label="Close Survey"
                onClick={() => setIsMobileSurveyOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-content-secondary hover:bg-surface-tertiary hover:text-content"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(80vh-52px)] overflow-auto">
              <SurveyNotebookBase
                compact={true}
                evaluation={surveyEvaluation}
                onAcceptRecommendation={handleAcceptSurveyRecommendation}
              />
            </div>
          </div>
        </>
      )}

      {/* Verification prompt: shown when data uploaded while findings are improving */}
      {showVerificationPrompt && (
        <VerificationPrompt
          improvingActionCount={aggregatedActions.filter(a => !a.completedAt).length}
          onConfirmVerification={() => setShowVerificationPrompt(false)}
          onDismiss={() => setShowVerificationPrompt(false)}
        />
      )}

      {/* Question-Link Prompt — shown after chart observation creates a Finding */}
      <QuestionLinkPrompt
        isOpen={questionLinkPromptOpen}
        findingId={questionLinkFindingId}
        questions={persistedQuestions}
        onLink={handleQuestionLink}
        onSkip={handleQuestionPromptClose}
        onSkipForever={handleQuestionSkipForever}
        onClose={handleQuestionPromptClose}
        wallActive={wallViewMode === 'wall'}
        onProposeHypothesis={handleProposeHypothesisFromFinding}
      />

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

      {/* Stage 5 modal — investigation context capture.
          Opens after Mode B Stage 3 confirm (openModeB) and via on-demand button
          on the canvas chrome (openOnDemand). Brief contents are NOT logged to
          App Insights or any telemetry — they are customer PII (ADR-059). */}
      <StageFiveModal
        open={stageFive.open}
        mode={stageFive.mode}
        onOpenInvestigation={brief => {
          // Wire issueStatement into processContext (same path as brief.issueStatement
          // in handleMappingConfirmWithCategories — the existing setter accepts this).
          // NOTE: brief contents must NOT be logged to App Insights (PII).
          if (brief.issueStatement || brief.target || brief.questions) {
            const updatedContext = { ...(processContext ?? {}) };
            if (brief.issueStatement) updatedContext.issueStatement = brief.issueStatement;
            if (brief.target) {
              updatedContext.targetMetric = brief.target
                .metric as import('@variscout/core').TargetMetric;
              updatedContext.targetValue = brief.target.value;
              updatedContext.targetDirection = brief.target.direction;
            }
            setProcessContext(updatedContext);
            if (brief.questions) {
              for (const q of brief.questions) {
                questionsState.addQuestion(q.text, q.factor, q.level);
              }
            }
          }
          stageFive.close();
        }}
        onSkip={stageFive.close}
        onClose={stageFive.close}
      />

      {/* Match Summary Card — Mode A.2 paste into existing complete Hub (D9).
          Rendered inline (not over a backdrop) per spec. */}
      {dataFlow.matchSummary &&
        (() => {
          const hubCols: readonly string[] = activeHub?.outcomes?.map(o => o.columnName) ?? [];
          const newCols = dataFlow.matchSummary.newColumns;
          const columnShape: ColumnShape = {
            matched: newCols.filter(c => hubCols.includes(c)),
            added: newCols.filter(c => !hubCols.includes(c)),
            missing: (hubCols as string[]).filter(c => !newCols.includes(c)),
          };
          return (
            <div className="fixed bottom-4 right-4 z-40 w-full max-w-2xl px-4">
              <MatchSummaryCard
                classification={dataFlow.matchSummary.classification}
                columnShape={columnShape}
                onChoose={dataFlow.acceptMatchSummary}
                onCancel={dataFlow.cancelMatchSummary}
              />
            </div>
          );
        })()}
    </div>
  );
};
