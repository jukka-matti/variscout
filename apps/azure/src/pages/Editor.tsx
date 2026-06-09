import React, { useMemo, useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { lazyWithRetry } from '../lib/chunkReload';
import type { SampleDataset } from '@variscout/data';
import { useStorage } from '../services/storage';
import type { StorageLocation } from '../services/storage';
import { useProjectLoader } from '../hooks/useProjectLoader';
import { useProjectOverview } from '../hooks/useProjectOverview';
import {
  useProjectStore,
  useAnalyzeStore,
  usePreferencesStore,
  useCanvasViewportStore,
  useViewStore,
  useProjectMembershipStore,
  useImprovementProjectStore,
  useAnalysisScopeStore,
  buildDocumentSnapshot,
  documentSnapshotFingerprint,
} from '@variscout/stores';
import {
  useFilteredData,
  useAnalysisStats,
  useStagedAnalysis,
  useProjectActions,
  useCurrentDocumentFingerprint,
  filterCategoricalValuesByColumn,
  useReingestAutoLink,
} from '@variscout/hooks';
import { azurePersistenceAdapter, setDefaultLocation } from '../lib/persistenceAdapter';
import { useStatsWorker } from '../workers/useStatsWorker';
import { useDataIngestion } from '../hooks/useDataIngestion';
import { useFilterNavigation } from '../hooks';
import { AppHeader } from '../components/AppHeader';
import PasteScreen from '../components/data/PasteScreen';
import ManualEntry from '../components/data/ManualEntry';
import {
  VerificationPrompt,
  BrainstormModal,
  SurveyNotebookBase,
  ColumnMapping,
  type ColumnMappingConfirmPayload,
  StageFiveModal,
  MatchSummaryCard,
  ActiveIPLaunchpadCard,
  ActiveIPScopeRibbon,
  ImproveTabRoot,
  PendingInvitesBanner,
  CreateProjectModal,
  GoalBanner,
  DurabilityNudge,
  deriveActiveIPCanvasFocus,
  deriveActiveIPScopeLabels,
  type ColumnShape,
} from '@variscout/ui';
import { useStageFiveOpener } from '../features/hubCreation/useStageFiveOpener';
import {
  useControlViolations,
  detectEntryScenario,
  useCapabilityIChartData,
  useTranslation,
  useHMWPrompts,
} from '@variscout/hooks';
import {
  DEFAULT_PROCESS_HUB_ID,
  downloadCSV,
  computeBestSubsets,
  evaluateSurvey,
  extractHubName,
  isControlEligible,
  normalizeProcessHubId,
  computeTimeDecompositionColumns,
  computeBinnedFactorColumn,
} from '@variscout/core';
import { isAIAvailable } from '../services/aiService';
import { usePhotoComments } from '../hooks/usePhotoComments';
import { getCurrentUser, type CurrentUser } from '../auth/getCurrentUser';
import { useDataMerge } from '../hooks/useDataMerge';
import type {
  ExclusionReason,
  DefectMapping,
  Finding,
  IdeaDirection,
  ProcessHub,
  DisconfirmationAttempt,
  HypothesisStatus,
  CoScoutSurface,
  ProjectRole,
} from '@variscout/core';
import { resolveCpkTarget } from '@variscout/core/capability';
import { createProjectActionItem, type BrainstormIdea } from '@variscout/core/findings';
import { generateDeterministicId } from '@variscout/core/identity';
import { createNewIP, type ImprovementProject } from '@variscout/core/improvementProject';
import { reduceActionItems, type ActionItemAction } from '@variscout/core/actions';
import { canAccess } from '@variscout/core/projectMembership';
import type { BinnedFactorBinding } from '@variscout/core/binning';
import { Check, X } from 'lucide-react';
import { type FilePickerResult } from '../components/FileBrowseButton';
import { useIsMobile, BREAKPOINTS, MobileTabBar, type MobileTab } from '@variscout/ui';
import { useAIOrchestration, useActionProposals, useAnalyzeIndexing } from '../features/ai';
import { useAnalyzeOrchestration } from '../features/analyze';
import { useCanvasViewportLifecycle } from '../features/analyze/useCanvasViewportLifecycle';
import { useAnalyzeFeatureStore } from '../features/analyze/analyzeStore';
import { useImprovementOrchestration } from '../features/improvement';
import { useLocale } from '../context/LocaleContext';
import { usePanelsStore } from '../features/panels/panelsStore';
import { usePanelsPersistence } from '../features/panels/usePanelsPersistence';
import { useEditorDataFlow } from '../hooks/useEditorDataFlow';
import { useActiveIPContext, useClearScopeOnIPSwitch } from '@variscout/hooks';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTeamsShare } from '../hooks/useTeamsShare';
import { useShareFinding } from '../hooks/useShareFinding';
import { useFindingsOrchestration } from '../features/findings';
import { useFindingsStore } from '../features/findings/findingsStore';
import { buildChartSharePayload } from '../services/shareContent';
import { isKnowledgeBaseAvailable } from '../services/searchService';
import { buildSubPageId } from '../services/deepLinks';
import { azureHubRepository } from '../persistence';
import type { MeasurementPlan, MeasurementPlanStatus } from '@variscout/core/measurementPlan';
import type { ReingestPendingMatch } from '@variscout/core/autoLink';
import { useToast } from '../context/ToastContext';
import { ControlEntryRow } from './Editor.control';
import { EditorEmptyState } from '../components/editor/EditorEmptyState';
import { EditorDashboardView } from '../components/editor/EditorDashboardView';
import { CoScoutSection } from '../components/editor/CoScoutSection';
import { useUnsavedHubsStore } from '../features/hubs/unsavedHubsStore';
import {
  activateHubProject,
  bindProcessHubId,
  ensureHubProject,
  landFreshEntryOnProcess,
} from '../lib/landing';
// WorkspaceTabs merged into AppHeader (ADR-055 header redesign)
import { AnalyzeWorkspace } from '../components/editor/AnalyzeWorkspace';
import FrameView from '../components/editor/FrameView';
import ImprovementProjectPanel from '../components/charter/ImprovementProjectPanel';
import ControlPanel from '../components/control/ControlPanel';
import { SaveConflictDialog } from '../components/SaveConflictDialog';
import { requestPersistentStorageOnce } from '../services/storageDurability';
import { EditorMobileSheet } from '../components/editor/EditorMobileSheet';
import ProjectDashboard from '../components/ProjectDashboard';
import ProjectsTabView from '../components/ProjectsTabView';
import ProcessHubControlRegion from '../components/ProcessHubControlRegion';
import { useAIStore } from '../features/ai/aiStore';

const WhatIfPage = lazyWithRetry(() => import('../components/WhatIfPage'));
const ReportView = lazyWithRetry(() => import('../components/views/ReportView'));

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

function defaultSaveName(filename: string | null): string {
  return cleanProjectName(filename) || cleanProjectName(null);
}

const DEFAULT_INVITE_BLOCKING_TITLES = new Set([
  'untitled project',
  'untitled hub',
  'untitled',
  'new analysis',
]);

function isDefaultInviteTitle(title: string | null | undefined): boolean {
  const normalized = (title ?? '').trim().toLowerCase();
  return normalized.length === 0 || DEFAULT_INVITE_BLOCKING_TITLES.has(normalized);
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
    pendingConflict,
    dismissConflict,
    reloadProjectFromCloud,
  } = useStorage();
  const { locale } = useLocale();
  const { showToast } = useToast();

  // ── Zustand store selectors (replaces useDataStateCtx) ────────────────────
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const wallViewMode = useCanvasViewportStore(s => s.viewMode);
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
  const currentProjectId = useProjectStore(s => s.projectId);
  const currentProjectName = useProjectStore(s => s.projectName);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });
  const defectMapping = useProjectStore(s => s.defectMapping);
  const processContext = useProjectStore(s => s.processContext) ?? undefined;

  // Investigation store (domain — findings/hypotheses/categories). IM-1: the
  // Question entity is retired; suspected causes live as hypotheses.
  const persistedFindings = useAnalyzeStore(s => s.findings);
  const hypotheses = useAnalyzeStore(s => s.hypotheses);
  const categories = useAnalyzeStore(s => s.categories);
  // Idea write callbacks (keyed by hypothesisId, IM-1 F2) for the AI + improvement flows.
  const addIdea = useAnalyzeStore(s => s.addIdea);
  const updateIdea = useAnalyzeStore(s => s.updateIdea);
  const selectIdea = useAnalyzeStore(s => s.selectIdea);
  const deleteIdea = useAnalyzeStore(s => s.deleteIdea);

  // Measurement plans — loaded from IndexedDB for all hypotheses in the active investigation.
  // Re-loads when the hypothesis list changes OR when planLoadNonce bumps. Post-CS-11 the
  // nonce is bumped from the analyst's MANUAL plan writes (onSetPlanStatus + onLinkFinding)
  // so the Wall reflects the advanced plan status without a hypothesis-list change. The
  // re-ingest cascade no longer writes plans, so it no longer drives the nonce.
  const [wallMeasurementPlans, setWallMeasurementPlans] = useState<MeasurementPlan[]>([]);
  const [planLoadNonce, setPlanLoadNonce] = useState(0);
  const hypothesisIds = useMemo(() => hypotheses.map(h => h.id), [hypotheses]);
  // Key on joined string to avoid re-firing on array reference changes (Fix 5 — plan-load deps)
  const hypothesisIdsKey = hypothesisIds.join('|');
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const all = await Promise.all(
        hypothesisIds.map(id => azureHubRepository.measurementPlans.listByHypothesis(id))
      );
      if (!cancelled) setWallMeasurementPlans(all.flat());
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hypothesisIdsKey, planLoadNonce]);

  // PR-CS-11: re-ingest confirm prompt. On re-ingest the cascade matches
  // newly-available columns to MeasurementPlans and SURFACES pending-match
  // descriptors (it writes NOTHING). "Hints navigate, chips apply." — the Wall
  // chip is the single apply surface; the analyst's manual writes (onSetPlanStatus
  // / onLinkFinding below) fire the plan-load nonce so wallMeasurementPlans reloads
  // and the Wall reflects the advanced status. Dismiss is session-only.
  const [pendingMatches, setPendingMatches] = useState<ReingestPendingMatch[]>([]);
  const [dismissedMatchIds, setDismissedMatchIds] = useState<Set<string>>(() => new Set());
  // Latest dismissed-id set, read inside onPendingMatches without re-subscribing the hook.
  const dismissedMatchIdsRef = useRef(dismissedMatchIds);
  dismissedMatchIdsRef.current = dismissedMatchIds;
  useReingestAutoLink(azureHubRepository, {
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

  // Preferences store (annotation-per-user)
  const aiEnabled = usePreferencesStore(s => s.aiEnabled);
  const knowledgeSearchFolder = usePreferencesStore(s => s.knowledgeSearchFolder) ?? undefined;

  // Derived hooks (replaces computed state from useDataState)
  const { filteredData, filteredIndexMap } = useFilteredData();
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
  const setSelectedMeasure = useProjectStore(s => s.setSelectedMeasure);
  const setColumnAliases = useProjectStore(s => s.setColumnAliases);
  const setAnalysisMode = useProjectStore(s => s.setAnalysisMode);
  const setDefectMapping = useProjectStore(s => s.setDefectMapping);
  const setFilters = useProjectStore(s => s.setFilters);
  const setViewState = useProjectStore(s => s.setViewState);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const setCategories = useAnalyzeStore(s => s.setCategories);

  // Investigation store setters (via loadAnalyzeState for bulk updates)
  const setPersistedFindings = useCallback((findings: Finding[]) => {
    useAnalyzeStore.getState().loadAnalyzeState({ findings });
  }, []);

  const ingestion = useDataIngestion({
    onTimeColumnDetected: prompt => {
      dataFlowRef.current?.setTimeExtractionPrompt(prompt);
      if (prompt.hasTimeComponent) {
        dataFlowRef.current?.setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
      }
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
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('explore');
  const [isMobileSurveyOpen, setIsMobileSurveyOpen] = useState(false);
  const [catalogHubs, setCatalogHubs] = useState<ProcessHub[]>([]); // backing storage only — read via processHubs
  const unsavedHubs = useUnsavedHubsStore(s => s.hubs);
  // Word-style durability (FSJ-3a, spec §3): in-memory hubs join the storage
  // catalog for resolution (activeHub, document snapshots, hub pickers). An id
  // collision prefers the unsaved copy — it carries the session's edits.
  const processHubs = useMemo(() => {
    const unsavedIds = new Set(unsavedHubs.map(h => h.id));
    return [...catalogHubs.filter(h => !unsavedIds.has(h.id)), ...unsavedHubs];
  }, [catalogHubs, unsavedHubs]);
  // Create-Project modal (Home CTA — PR-CCJ-E1 T4). Wedge V1 lightweight
  // flow replaces the legacy `showCharter()` ceremony; modal owns Title +
  // optional Issue Statement, Editor owns IP creation + navigation.
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  // Reset mobile tab when data is cleared
  useEffect(() => {
    if (rawData.length === 0) setMobileActiveTab('explore');
  }, [rawData.length]);

  useEffect(() => {
    listProcessHubs()
      .then(setCatalogHubs)
      .catch(() => setCatalogHubs([]));
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
  const controlTargetId = usePanelsStore(s => s.controlTargetId);
  const selectedProjectId = usePanelsStore(s => s.selectedProjectId);
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
        ps.showAnalyze();
      } else if (tab === 'improve') {
        ps.showImprovement();
      } else if (tab === 'explore') {
        ps.showExplore();
      }
    },
    [isPhone]
  );

  // Current user (for comment author attribution and per-user active-IP scope)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  // Project membership store (annotation-per-user — per-user localStorage key).
  // currentUser loads async; fall back to '' until resolved (getPendingInvites returns []).
  const membershipUserId = currentUser?.email ?? '';
  const pendingInvites = useProjectMembershipStore(s => s.getPendingInvites(membershipUserId));
  const membershipAcceptInvite = useProjectMembershipStore(s => s.acceptInvite);
  const membershipRevokeInvite = useProjectMembershipStore(s => s.revokeInvite);
  const rehydrateInvites = useProjectMembershipStore(s => s.rehydrateInvites);
  const acceptInvite = (id: string) => membershipAcceptInvite(membershipUserId, id);
  const revokeInvite = (id: string) => membershipRevokeInvite(membershipUserId, id);
  useEffect(() => {
    if (membershipUserId) rehydrateInvites(membershipUserId);
  }, [membershipUserId, rehydrateInvites]);

  // Data flow hook
  const activeHub = processHubs.find(h => h.id === processContext?.processHubId);
  const currentFingerprint = useCurrentDocumentFingerprint(activeHub);
  const [savedDocumentName, setSavedDocumentName] = useState<string | null>(() => {
    const state = useProjectStore.getState();
    return state.projectId && state.projectName ? state.projectName : null;
  });
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(() => {
    const state = useProjectStore.getState();
    return state.projectId && state.projectName ? currentFingerprint : null;
  });
  const computeCurrentFingerprint = useCallback(
    () => documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub })),
    [activeHub]
  );

  // Persistence actions (local IndexedDB via adapter)
  const projectActions = useProjectActions(azurePersistenceAdapter, {
    getActiveHub: () => activeHub,
  });

  // Wrap saveProject with cloud sync
  const saveProject = useCallback(
    async (name: string) => {
      const trimmedName = name.trim() || defaultSaveName(dataFilename);
      setDefaultLocation('personal');
      useProjectStore.setState({ projectName: trimmedName });
      await projectActions.saveProject(trimmedName);
      // Trigger cloud sync with current store state snapshot
      const state = buildDocumentSnapshot({ activeHub });
      return saveToCloud(state, trimmedName, 'personal');
    },
    [activeHub, dataFilename, projectActions, saveToCloud]
  );

  const loadProject = useCallback(
    async (id: string) => {
      await projectActions.loadProject(id);
      const loadedName = useProjectStore.getState().projectName;
      if (loadedName) {
        setSavedDocumentName(loadedName);
        setSavedFingerprint(computeCurrentFingerprint());
      }
    },
    [computeCurrentFingerprint, projectActions]
  );
  const renameProject = useCallback(
    async (oldName: string, newName: string) => {
      await projectActions.renameProject(oldName, newName);
    },
    [projectActions]
  );
  const activeIPContext = useActiveIPContext(activeHub, { userId: currentUser?.email });
  const clearScope = useAnalysisScopeStore(s => s.clearScope);
  useClearScopeOnIPSwitch(activeIPContext.activeIP?.id ?? null, clearScope);
  const canEditCanvas = useMemo(() => {
    const userId = currentUser?.email;
    if (!userId) return false; // Pre-auth (user still loading) — gate is closed.
    const members = activeIPContext.activeIP?.metadata.members ?? [];
    // Wedge V1: no back-compat fallback. An empty members[] has no Lead, so canAccess
    // returns false and the gate stays closed (per feedback_wedge_v1_no_migration_no_backcompat).
    return canAccess(userId, members, 'edit');
  }, [activeIPContext.activeIP, currentUser?.email]);
  const projectRole = useMemo<ProjectRole | undefined>(() => {
    const userId = currentUser?.email;
    if (!userId) return undefined;
    return activeIPContext.activeIP?.metadata.members?.find(member => member.userId === userId)
      ?.role;
  }, [activeIPContext.activeIP, currentUser?.email]);
  const selectedOrActiveProjectId = activeIPContext.activeIP?.id ?? selectedProjectId;
  const activeIPScopeLabels = useMemo(
    () =>
      activeIPContext.activeIP
        ? deriveActiveIPScopeLabels(
            activeIPContext.activeIP,
            activeHub,
            activeIPContext.activeState?.setAt
          )
        : null,
    [activeHub, activeIPContext.activeIP, activeIPContext.activeState?.setAt]
  );
  const activeIPScope =
    activeIPContext.activeIP && activeIPScopeLabels
      ? {
          title: activeIPContext.activeIP.metadata.title,
          labels: activeIPScopeLabels,
        }
      : null;
  // PO-5: the lineage section is retired — active-IP surfaces show the whole
  // document (empty-set-means-unfiltered is now the permanent semantics). The
  // Wall, Findings, and Report no longer filter by a lineage membership set.

  // Wall measurement-plan callbacks — mirrors PWA App.tsx wallPlanningProps pattern
  //
  // recordDisconfirmationRef — latest-ref pattern for `hypothesesState.recordDisconfirmation`.
  // `wallPlanningProps` is defined before `hypothesesState` in the render body (TDZ concern),
  // so we capture the callback through a ref that is kept current each render.
  // The ref is assigned after `hypothesesState` is declared below (~line 1180).

  const recordDisconfirmationRef = useRef<(hubId: string, attempt: DisconfirmationAttempt) => void>(
    () => {
      console.warn('[wall] recordDisconfirmation called before hypothesesState was ready');
    }
  );

  const setHubStatusRef = useRef<(hubId: string, status: HypothesisStatus) => void>(() => {
    console.warn('[wall] setHubStatus called before hypothesesState was ready');
  });

  const wallActiveIPMembers = useMemo(
    () => activeIPContext.activeIP?.metadata.members ?? [],
    [activeIPContext.activeIP]
  );
  const wallPlanningProps = useMemo(
    () => ({
      plans: wallMeasurementPlans,
      members: wallActiveIPMembers,
      currentUserId: currentUser?.email ?? null,
      onAddPlan: (plan: Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt'>) => {
        const stamped: MeasurementPlan = {
          ...plan,
          id: generateDeterministicId(),
          createdAt: Date.now(),
          deletedAt: null,
        };
        // Optimistic add — roll back on dispatch failure (Fix 6)
        setWallMeasurementPlans(prev => [...prev, stamped]);
        azureHubRepository
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
          azureHubRepository
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
      onRecordDisconfirmation: (
        hypothesisId: string,
        input: { description: string; verdict: 'pending' | 'survived' | 'refuted' }
      ) => {
        // App stamps the deterministic id + timestamp + attemptedBy.
        const attempt: DisconfirmationAttempt = {
          id: generateDeterministicId(),
          attemptedAt: new Date().toISOString(),
          attemptedBy: {
            displayName: currentUser?.name ?? 'Local browser',
            upn: currentUser?.email,
          },
          description: input.description,
          verdict: input.verdict,
          linkedFindingIds: [],
        };
        // Route through the HOOK (via the ref below) so the local hook state —
        // which is the source of truth for WallCanvas / MobileCardList — is
        // updated immediately. The `onHubsChange` callback then syncs the domain
        // store (useAnalyzeStore.resetHubs) as a side-effect, keeping both in
        // step. Bypassing the hook (calling store.recordDisconfirmation directly)
        // leaves hook state stale: WallCanvas passes the hook's hubs to
        // deriveHypothesisStatus, so the `needs-disconfirmation → confirmed`
        // gate never fires live in-session (IM-4a adversarial review blocker).
        // recordDisconfirmationRef holds the latest stable callback from
        // useHypotheses; the ref is populated after hypothesesState is resolved
        // (see the assignment below).
        recordDisconfirmationRef.current(hypothesisId, attempt);
        void azureHubRepository
          .dispatch({ kind: 'HYPOTHESIS_RECORD_DISCONFIRMATION', hypothesisId, attempt })
          .catch((err: unknown) => {
            console.error('[wall] Failed to record disconfirmation:', err);
          });
      },
      onSetStatus: (hubId: string, status: HypothesisStatus) => {
        // Route through the hook (via ref) so local hook state syncs immediately.
        // onHubsChange then propagates to the domain store via resetHubs.
        setHubStatusRef.current(hubId, status);
      },
      onGoLook: (hypothesisId: string) => {
        useCanvasViewportStore.getState().setViewMode('wall');
        useViewStore.getState().setFocusedWallEntity(hypothesisId);
      },
      // PR-CS-11 — the re-ingest confirm prompt's APPLY surface (Wall chip).
      pendingMatchByPlanId,
      onSetPlanStatus: (planId: string, status: MeasurementPlanStatus) => {
        // Optimistic local update so the chip reflects the new status immediately.
        setWallMeasurementPlans(prev => {
          const snapshot = prev;
          const next = prev.map(p => (p.id === planId ? { ...p, status } : p));
          azureHubRepository
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
    }),
    [
      wallMeasurementPlans,
      wallActiveIPMembers,
      currentUser?.email,
      currentUser?.name,
      pendingMatchByPlanId,
      clearPendingMatchesForPlan,
    ]
  );

  // Action item dispatch — wired to useImprovementProjectStore via upsertProject
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);
  const activeIP = activeIPContext.activeIP ?? null;
  const applyAction = (action: ActionItemAction) => {
    if (!activeIP) return;
    const currentActions = activeIP.metadata.actions ?? [];
    const nextActions = reduceActionItems(currentActions, action);
    upsertProject({ ...activeIP, metadata: { ...activeIP.metadata, actions: nextActions } });
  };

  // G1 Task 7 — inflection-binning patch handler. Synchronous: writes through
  // upsertProject (Zustand setState) so the activeIP slice updates in the same
  // tick the inflection state machine expects. Downstream async persistence
  // (IDB / cloud blob) is the store's concern and fires in the background.
  // No-op when there is no active IP (the Dashboard already suppresses the
  // workflow in that case via the absence of onBindingsChange).
  const handleBinningBindingsChange = useCallback(
    (next: BinnedFactorBinding[]) => {
      if (!activeIP) return;
      upsertProject({ ...activeIP, binnedFactorBindings: next });
    },
    [activeIP, upsertProject]
  );

  // Control + Handoff inputs for ProjectsTabView → IPDetailPage
  const _azureLiveControlRecords = (activeHub?.controlRecords ?? []).filter(
    r => r.deletedAt === null
  );
  const _azureLiveControlHandoffs = (activeHub?.controlHandoffs ?? []).filter(
    h => h.deletedAt === null
  );
  const projectsControlRecord = _azureLiveControlRecords.find(
    r => r.improvementProjectId === selectedOrActiveProjectId
  );
  const projectsControlHandoff = _azureLiveControlHandoffs.find(
    h => h.projectId === (projectsControlRecord?.projectId ?? '')
  );
  const projectsClosureInputs = projectsControlHandoff
    ? {
        controlPlanDocumented: false,
        // Re-pointed from the deleted handoff.signoff to the handoff lifecycle
        // (IM-7 §11 #6): "operational" is the fully-handed-off milestone.
        trainingDelivered: projectsControlHandoff.status === 'operational',
        cadenceAssigned: Boolean(projectsControlRecord?.cadence),
        processOwnerAcknowledged: projectsControlHandoff.status !== 'pending',
        trainingRef: projectsControlHandoff.referenceUri,
        cadenceOwner: projectsControlRecord?.owner?.displayName,
      }
    : undefined;

  // PR-PO-2: the Control region re-homes to the Project tab's Control stage.
  // The Project tab is single-project, so we pass the active project + its
  // scoped control record/handoff. The region's cadence buckets degrade
  // gracefully to the single-project case (facts, not the analyzeStatus label).
  const projectsControlRegionSlot = activeIPContext.activeIP ? (
    <ProcessHubControlRegion
      projects={[activeIPContext.activeIP]}
      records={_azureLiveControlRecords}
      handoffs={_azureLiveControlHandoffs}
      onOpenProject={id => usePanelsStore.getState().showProjects(id)}
      onSetupControl={() =>
        usePanelsStore.getState().showControl(projectsControlRecord?.projectId ?? undefined)
      }
      onLogReview={() =>
        usePanelsStore.getState().showControl(projectsControlRecord?.projectId ?? undefined)
      }
    />
  ) : null;

  // FSJ-3a: shared landing deps — the paste path joins as the third caller in FSJ-3b.
  const makeLandingDeps = useCallback(
    () => ({
      activeHub: activeHub ?? null,
      registerHub: useUnsavedHubsStore.getState().upsertHub,
      setProcessHubId: bindProcessHubId,
      showFrame: usePanelsStore.getState().showFrame,
    }),
    [activeHub]
  );

  // FSJ-10: fresh paste now always provisions and routes to b0. The analyzed
  // callback remains for non-primary hatch/re-ingest compatibility only.
  const handleFreshPasteLanded = useCallback(() => {
    void (async () => {
      const user = currentUser ?? (await getCurrentUser().catch(() => null));
      if (!user) return;
      landFreshEntryOnProcess('Untitled project', { ...makeLandingDeps(), user });
    })();
  }, [currentUser, makeLandingDeps]);

  const handleFreshPasteAnalyzed = useCallback(() => {
    void (async () => {
      const user = currentUser ?? (await getCurrentUser().catch(() => null));
      if (!user) return;
      const deps = makeLandingDeps();
      const hub = ensureHubProject(deps.activeHub, 'Untitled project', user);
      if (hub !== deps.activeHub) {
        deps.registerHub(hub);
        deps.setProcessHubId(hub.id);
      }
      activateHubProject(hub, user.email);
      // no route — the wizard owns the screen (spec §3 provision-only)
    })();
  }, [currentUser, makeLandingDeps]);

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
    onFreshPasteLanded: handleFreshPasteLanded,
    onFreshPasteAnalyzed: handleFreshPasteAnalyzed,
  });

  const hasB0ModeProposal =
    dataFlow.defectDetection != null || dataFlow.wideFormatDetection != null;
  const hasAcceptedB0ModeFraming =
    (analysisMode === 'defect' && defectMapping != null) ||
    (analysisMode === 'performance' && (measureColumns?.length ?? 0) > 0);

  const handleAcceptDefectDetection = useCallback(
    (mapping: DefectMapping) => {
      setDefectMapping(mapping);
      setAnalysisMode('defect');
      dataFlow.dismissDefectDetection();
    },
    [dataFlow, setAnalysisMode, setDefectMapping]
  );

  const handleAcceptWideFormatDetection = useCallback(
    (columns: string[], label: string) => {
      setMeasureColumns(columns);
      setMeasureLabel(label);
      setSelectedMeasure(null);
      setAnalysisMode('performance');
      dataFlow.dismissWideFormatDetection();
    },
    [dataFlow, setAnalysisMode, setMeasureColumns, setMeasureLabel, setSelectedMeasure]
  );

  // Start paste mode immediately when opened via "Add framing" CTA so the
  // analyst lands directly on PasteScreen rather than EditorEmptyState.
  useEffect(() => {
    if (!startPasteOnMount) return;
    usePanelsStore.getState().showExplore();
    dataFlow.startPaste();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile "More" sheet action handler
  const handleMobileMore = useCallback(
    (action: string) => {
      setMobileActiveTab('explore');
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
        defectMapping,
        processContext,
        findings: persistedFindings,
        branches: hypotheses,
      }),
    [
      rawData,
      outcome,
      factors,
      timeColumn,
      specs,
      defectMapping,
      processContext,
      persistedFindings,
      hypotheses,
    ]
  );

  // Ref to allow ingestion callbacks to reach dataFlow setters
  const dataFlowRef = React.useRef(dataFlow);
  dataFlowRef.current = dataFlow;

  // Load sample passed from portfolio "Try a Sample" (effect below, after hypothesesState)
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
      ps.showAnalyze();
      useFindingsStore.getState().setHighlightedFindingId(targetId);
    } else if (target === 'findings' && targetId) {
      ps.showAnalyze();
      useFindingsStore.getState().setStatusFilter(targetId);
    } else if (target === 'question' && targetId) {
      ps.showAnalyze();
      useAnalyzeFeatureStore.getState().expandToHypothesis(targetId);
    } else if (target === 'improvement' || target === 'actions') {
      ps.showImprovement();
    } else if (target === 'report') {
      ps.showReport();
    } else if (target === 'coscout') {
      ps.showExplore();
      ps.setCoScoutOpen(true);
    } else {
      ps.showExplore();
    }
  }, []);

  const handleDashboardAddData = useCallback(() => {
    usePanelsStore.getState().showExplore();
    dataFlow.startAppendPaste();
  }, [dataFlow]);

  const handleDashboardResumeAnalysis = useCallback(() => {
    usePanelsStore.getState().showExplore();
  }, []);

  /**
   * Mode B entry: "New Hub" from the dashboard starts the paste → framing flow.
   * Navigates to the analysis view so PasteScreen is visible, then opens paste.
   */
  const handleNewHub = useCallback(() => {
    usePanelsStore.getState().showExplore();
    dataFlow.startPaste();
  }, [dataFlow]);

  // Stage 5 modal — opens after Mode B Stage 3 confirm and via on-demand button.
  const stageFive = useStageFiveOpener();

  // FSJ-10: handleHubCreated retired. Fresh-paste provisioning now routes through
  // the landing path; bindProcessHubId/activateHubProject remain wired via
  // makeLandingDeps so callbacks read the live hub state.

  // FSJ-3a landing (spec §1/§3): fresh sample entry lands on the Process tab
  // with an ensured + activated Untitled pair, named for the sample. The canvas
  // self-routes b0 (no map) vs L2 (seeded map — The Bottleneck) downstream.
  const handleLoadSampleWithLanding = useCallback(
    async (sample: SampleDataset) => {
      if (!dataFlow.handleLoadSample(sample)) return;
      const user = currentUser ?? (await getCurrentUser().catch(() => null));
      if (!user) return; // pre-auth edge: keep today's no-project behavior
      landFreshEntryOnProcess(sample.name, {
        ...makeLandingDeps(),
        initialStepTimings: sample.config.stepTimings,
        user,
      });
    },
    [dataFlow, currentUser, makeLandingDeps]
  );

  // Stable ref so the one-shot initialSample effect can call the latest version
  // without becoming a dependency (mirrors the dataFlowRef pattern above).
  const handleLoadSampleWithLandingRef = useRef(handleLoadSampleWithLanding);
  handleLoadSampleWithLandingRef.current = handleLoadSampleWithLanding;

  // FSJ-3a landing (spec §1/§3): manual data entry lands on the Process tab.
  // Skipped on append (re-ingestion, not first-session — spec §7).
  const handleManualAnalyzeWithLanding = useCallback(
    (...args: Parameters<typeof handleManualDataAnalyze>) => {
      handleManualDataAnalyze(...args);
      if (dataFlow.appendMode) return; // append = re-ingestion, not first-session
      void (async () => {
        const user = currentUser ?? (await getCurrentUser().catch(() => null));
        if (!user) return;
        landFreshEntryOnProcess('Untitled project', { ...makeLandingDeps(), user });
      })();
    },
    [handleManualDataAnalyze, dataFlow.appendMode, currentUser, makeLandingDeps]
  );

  // Share handlers
  const { shareFinding, canMentionInChannel } = useShareFinding({ projectName, baseUrl });
  const [showDurabilityNudge, setShowDurabilityNudge] = useState(false);
  const [durabilityNudgeDismissed, setDurabilityNudgeDismissed] = useState(false);
  const handleOwnFindingCaptured = useCallback(() => {
    setShowDurabilityNudge(current => current || !durabilityNudgeDismissed);
  }, [durabilityNudgeDismissed]);

  // Compute projected metric value from selected improvement ideas (IM-1: ideas
  // live on hypothesis hubs).
  const projectedFromIdeas = useMemo(() => {
    if (!processContext?.targetMetric || processContext?.targetValue === undefined)
      return undefined;
    if (!stats) return undefined;
    let totalMeanShift = 0;
    let totalSigmaReduction = 0;
    for (const h of hypotheses) {
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
  }, [hypotheses, processContext, stats]);

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
    processContext,
    currentValue: stats?.cpk ?? stats?.mean,
    projectedValue: projectedFromIdeas,
    factorRoles: processContext?.factorRoles,
    aiAvailable: aiEnabled && isAIAvailable(),
    onOwnFindingCaptured: handleOwnFindingCaptured,
  });

  // IM-1 (ADR-085): the Question entity is retired, so the post-observation
  // question-link prompt is gone. Chart observations create a Finding directly;
  // the analyst promotes findings to hypothesis hubs on the Wall.
  const findingsCallbacksWithPrompt = findingsCallbacks;

  // IM-1: the propose-hypothesis-from-finding CTA + its `wallViewMode` read are
  // removed here — their render target was the retired QuestionLinkPrompt
  // (wallActive / onProposeHypothesis). Promoting a finding to a Hypothesis hub
  // on the Wall is owned by the unified Wall re-layout in IM-4/IM-5.

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
        usePanelsStore.getState().showAnalyze();
        setHighlightedFindingId(initialFindingId);
      }
    }
    if (initialChart) {
      handleViewStateChange({
        focusedChart: initialChart as 'ichart' | 'boxplot' | 'pareto' | null,
      });
    }
    if (initialQuestionId) {
      // IM-1: deep links carry a focused-node id; the Question entity is retired,
      // so we route to Analyze and focus the matching hypothesis hub (if any).
      if (!hypotheses.some(h => h.id === initialQuestionId)) {
        showToast({
          type: 'warning',
          message: 'The linked item was not found',
          dismissAfter: 5000,
        });
      } else {
        usePanelsStore.getState().showAnalyze();
        useAnalyzeFeatureStore.getState().expandToHypothesis(initialQuestionId);
      }
    }
    if (initialMode === 'analyze') {
      usePanelsStore.getState().showAnalyze();
    } else if (initialMode === 'improvement') {
      usePanelsStore.getState().showImprovement();
    } else if (initialMode === 'report') {
      usePanelsStore.getState().showReport();
    }

    if (hasDeepLink) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      // Deep-linked: stay in analysis view (or investigation/improvement set above)
      if (!initialMode) usePanelsStore.getState().showExplore();
    } else if (projectId) {
      // Project loaded with data, no deep link: honor persisted view or default to dashboard
      const persistedView = viewState?.activeView;
      if (persistedView && persistedView !== 'dashboard') {
        // Restore persisted workspace (analysis/analyze/improvement)
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

  // Overview dashboard data: userId + other projects list
  const { overviewProjects, lastViewedAt, handleUpdateLastViewed } = useProjectOverview({
    listProjects,
    currentProjectName: currentProjectName ?? undefined,
    currentProjectLocation,
  });

  // Photo comments
  const { handleAddPhoto, handleAddCommentWithAuthor } = usePhotoComments({
    findingsState,
    analysisId: currentProjectName || 'default',
    author: currentUser?.name,
  });

  // Idea write callbacks (keyed by hypothesisId, IM-1 F2) shared by the AI +
  // improvement flows.
  const ideaActions = useMemo(
    () => ({ addIdea, updateIdea, selectIdea, removeIdea: deleteIdea }),
    [addIdea, updateIdea, selectIdea, deleteIdea]
  );

  // Investigation workflow (IM-1: hypothesis-driven, Question entity retired)
  // IM-4b: handleProjectIdea + ideaImpacts (improvement-idea projection, keyed by
  // hypothesisId) are now consumed — they feed the ImprovementIdeasSection that
  // mounts on the hypothesis card via the WallCanvas production seam (the IM-1
  // Question-driven FindingsLog ideas surface they originally targeted was
  // dismantled; the replacement is the Wall hypothesis card).
  const {
    handleSaveIdeaProjection,
    clearProjectionTarget,
    handleSetFindingStatus,
    hypothesesState,
    handleProjectIdea,
    ideaImpacts,
  } = useAnalyzeOrchestration({
    findingsState,
    processContext,
    stats,
  });
  // Keep the latest-ref current so wallPlanningProps.onRecordDisconfirmation
  // routes through the hook rather than the store (see declaration above).
  // The hub comment/task/idea collab callbacks are built inside AnalyzeWorkspace,
  // where `hypothesesState`, `ideaImpacts`, and `handleProjectIdea` are reactively
  // in scope (Editor's wallPlanningProps memo is TDZ-bound before the hook).
  recordDisconfirmationRef.current = hypothesesState.recordDisconfirmation;
  setHubStatusRef.current = hypothesesState.setHubStatus;

  const projectionTarget = useAnalyzeFeatureStore(s => s.projectionTarget);

  // Load sample passed from portfolio "Try a Sample"
  useEffect(() => {
    if (initialSample && !initialSampleConsumedRef.current) {
      initialSampleConsumedRef.current = true;
      void handleLoadSampleWithLandingRef.current(initialSample);
      // Inject hypotheses for showcase/demo datasets (not in DataContext)
      const hubs = initialSample.config.investigation?.hypotheses;
      if (hubs && hubs.length > 0) {
        hypothesesState.resetHubs(hubs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  // Investigation indexing for Foundry IQ (ADR-060 Pillar 2)
  // Active only when Team plan + KB preview enabled + project is open
  const { onFindingsChange: indexFindings, onScopesChange: indexScopes } = useAnalyzeIndexing({
    projectId: projectId ?? undefined,
    enabled: isKnowledgeBaseAvailable(),
  });
  const scopes = useAnalyzeStore(s => s.scopes);

  const canvasViewportHubId =
    processContext?.processHubId ?? activeHub?.id ?? DEFAULT_PROCESS_HUB_ID;
  useCanvasViewportLifecycle(canvasViewportHubId);

  // Trigger indexing side-effects whenever findings or scopes change
  useEffect(() => {
    indexFindings(findingsState.findings);
  }, [findingsState.findings, indexFindings]);

  useEffect(() => {
    indexScopes(scopes);
  }, [scopes, indexScopes]);

  // Improvement workspace
  const {
    handleConvertIdeasToActions,
    aggregatedActions,
    hasVerification: improvHasVerification,
    improvementHypotheses,
    selectedIdeaIds,
    projectedCpkMap: improvementProjectedCpkMap,
  } = useImprovementOrchestration({
    hypotheses,
    ideaActions,
    findingsState,
    processContext,
    setProcessContext,
    rawData,
    outcome,
    specs,
    stagedStats,
  });
  // PO-5: scopedFindings/scopedFindingsState removed — active-IP surfaces show
  // the whole document (the lineage findingIds filter is retired). AnalyzeWorkspace
  // receives findingsState directly.

  // PR-CS-6 Edge 1: COPY a finding-level action into the active project's action
  // tracker (`IP.metadata.actions`) via the existing ACTION_ITEM_ADD dispatch.
  // The source finding action is stamped with `parentImprovementProjectId` so the
  // promote affordance hides afterward (re-promotion guard). Report keeps reading
  // `finding.actions`, so there is NO double-count — the tracker is a separate
  // collection. Only available when an active IP exists.
  const handlePromoteFindingAction = useCallback(
    (findingId: string, actionId: string) => {
      if (!activeIP) return;
      const source = findingsState.findings
        .find(f => f.id === findingId)
        ?.actions?.find(a => a.id === actionId);
      if (!source || source.parentImprovementProjectId) return;
      const projectAction = createProjectActionItem({
        text: source.text,
        parentImprovementProjectId: activeIP.id,
      });
      // Carry the origin breadcrumb (dueAt / assignee / stepId) onto the tracker copy.
      const enriched = {
        ...projectAction,
        ...(source.dueAt != null ? { dueAt: source.dueAt } : {}),
        ...(source.assignedTo != null ? { assignedTo: source.assignedTo } : {}),
        ...(source.stepId != null ? { stepId: source.stepId } : {}),
      };
      applyAction({ kind: 'ACTION_ITEM_ADD', hubId: activeIP.hubId, actionItem: enriched });
      // Stamp the source so the promote button disappears (re-promotion guard).
      findingsState.promoteAction(findingId, actionId, activeIP.id);
    },
    [activeIP, applyAction, findingsState]
  );

  const activeIPAnalyzeFactorRequest = useMemo(
    () =>
      activeIPContext.isIPScoped && activeIPScopeLabels?.factorLabels[0]
        ? {
            factor: activeIPScopeLabels.factorLabels[0],
            seq: activeIPContext.activeState?.setAt ?? 0,
          }
        : null,
    [
      activeIPContext.activeState?.setAt,
      activeIPContext.isIPScoped,
      activeIPScopeLabels?.factorLabels,
    ]
  );

  // G1 Task 4: derived categorical columns for the active IP's time-decomposition
  // and binned-factor bindings. Mirrors the CanvasWorkspace.tsx computation so
  // the Analyze-tab factor pickers include derived columns (e.g. `Reactor_temp_bin`,
  // `Order_Date.day-of-week`) and the data pipelines can group by them.
  // Absent or empty when no active IP has bindings configured → backward compat.
  //
  // ALIGNMENT: This map is rawData-aligned — `categoricalValuesByColumn[col][i]`
  // is the derived value for `rawData[i]`. It must be projected onto the filtered
  // subset (`filteredCategoricalValuesByColumn` below) before being passed to any
  // hook that operates on `filteredData` (Boxplot / Probability / ANOVA / stats).
  const categoricalValuesByColumn = useMemo<Record<string, (string | null)[]>>(() => {
    const activeIP = activeIPContext.activeIP;
    if (!activeIP) return {};
    const merged: Record<string, (string | null)[]> = {};
    for (const binding of activeIP.timeDecompositionBindings ?? []) {
      const cols = computeTimeDecompositionColumns([...rawData], binding);
      for (const [key, vals] of Object.entries(cols)) {
        merged[key] = vals;
      }
    }
    for (const binding of activeIP.binnedFactorBindings ?? []) {
      const vals = computeBinnedFactorColumn([...rawData], binding);
      merged[`${binding.sourceColumn}_bin`] = vals;
    }
    return merged;
  }, [activeIPContext.activeIP, rawData]);

  // G1 Task 4 follow-up: project the rawData-aligned channel onto the filtered
  // subset via filteredIndexMap. After projection `result[col][j]` is the
  // derived value for `filteredData[j]`. Downstream consumers (Dashboard, Boxplot,
  // Probability Plot, ANOVA, stats-summary table) operate on filteredData, so
  // they receive THIS filtered-aligned map — not the raw one. Without active
  // filters, filteredIndexMap is the identity over the dataset, so projection
  // is content-equivalent (a fresh array allocation per row count, but values
  // match raw exactly). The Canvas/EditMode surface keeps using the raw map
  // because palette chips and bin editors work in rawData space.
  const filteredCategoricalValuesByColumn = useMemo<Record<string, (string | null)[]>>(
    () => filterCategoricalValuesByColumn(categoricalValuesByColumn, filteredIndexMap),
    [categoricalValuesByColumn, filteredIndexMap]
  );

  useEffect(() => {
    if (activeView !== 'frame' || !activeHub) return;
    if (activeIPContext.activeIP) {
      const hubId = normalizeProcessHubId(activeHub.id);
      const focus = deriveActiveIPCanvasFocus(activeIPContext.activeIP, activeHub);
      useCanvasViewportStore.getState().setLevel(hubId, focus.level, focus.focalStepId);
    }
  }, [activeHub, activeIPContext.activeIP, activeView]);
  const isAnalyzeWallCanvasFirst = activeView === 'analyze' && wallViewMode === 'wall';

  // Verification prompt: show when new data is uploaded while findings are improving
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  // Brainstorm modal state. IM-1: brainstorm targets a hypothesis hub.
  const [brainstormQuestionId, setBrainstormQuestionId] = useState<string | null>(null);
  const brainstormQuestion = improvementHypotheses.find(q => q.id === brainstormQuestionId);
  const hmwPrompts = useHMWPrompts(
    brainstormQuestion?.text ?? '',
    processContext?.problemStatement
  );
  // Local brainstorm ideas array — passed to BrainstormModal as props
  const [brainstormIdeas, setBrainstormIdeas] = useState<BrainstormIdea[]>([]);

  // Control violations for chart annotations (must be called unconditionally for hook order)
  const controlViolations = useControlViolations(filteredData, outcome, specs);

  // Show verification prompt when new data is uploaded while findings are improving
  const hasImprovingFindings = findingsState.findings.some(f => f.status === 'improving');
  useEffect(() => {
    if (hasImprovingFindings && stagedStats && !improvHasVerification) {
      setShowVerificationPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagedStats]); // Only trigger on stagedStats change (new data upload)

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
  const coscoutSurface = useMemo<CoScoutSurface>(() => {
    switch (activeView) {
      case 'frame':
        return 'process';
      case 'explore':
        return 'explore';
      case 'report':
        return 'report';
      case 'analyze':
      default:
        return 'analyze';
    }
  }, [activeView]);
  const activeAnalysisScope = useMemo(
    () =>
      scopes
        .filter(
          scope =>
            scope.deletedAt === null &&
            scope.projectId === selectedOrActiveProjectId &&
            (!outcome || scope.outcome === outcome)
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)[0],
    [outcome, scopes, selectedOrActiveProjectId]
  );
  const aiOrch = useAIOrchestration({
    enabled: aiEnabled,
    stats: stats ?? undefined,
    filteredData,
    rawData,
    outcome,
    specs,
    findings: findingsState.findings,
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
    locale,
    knowledgeSearchFolder,
    coscoutSurface,
    projectRole,
    analysisScope: activeAnalysisScope,
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
    ideaActions,
    filters,
    stats,
    filteredDataLength: filteredData.length,
  });

  const sharedCoScoutSection = (
    <CoScoutSection
      aiOrch={aiOrch}
      findingsState={findingsState}
      actionProposalsState={actionProposalsState}
      handleSearchKnowledge={handleSearchKnowledge}
      handleAddCommentWithAuthor={handleAddCommentWithAuthor}
    />
  );

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

  /**
   * Word-style hub writes (FSJ-3a, spec §3): an unsaved hub's mutations stay
   * in-memory (the first explicit save flushes them); a persisted hub keeps
   * today's immediate saveProcessHub, with catalogHubs updated in step so
   * FrameView outcomeSpecs never go stale; unsaved hubs stay fresh through
   * the processHubs merge memo instead.
   */
  const commitHubChange = useCallback(
    async (hub: ProcessHub) => {
      const unsaved = useUnsavedHubsStore.getState();
      if (unsaved.isUnsaved(hub.id)) {
        unsaved.upsertHub(hub);
        return;
      }
      setCatalogHubs(prev => prev.map(h => (h.id === hub.id ? hub : h)));
      await saveProcessHub(hub);
    },
    [saveProcessHub]
  );

  // Handle ColumnMapping confirm — adopts new Hub-shaped payload (slice-2 contract).
  // Wire categories, brief, and investigation state; persist outcomes + primaryScopeDimensions
  // to the active Hub via commitHubChange so the Process tab can read the
  // framed Hub state from this point forward.
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
        // IM-1 (F5): AnalysisBrief no longer seeds Question entities.
      }

      // Persist outcomes + primaryScopeDimensions to the active Hub.
      // The Hub is identified by processContext.processHubId; save is async
      // (fire-and-forget here; the Process tab reads the persisted state).
      if (
        (outcomes.length > 0 || primaryScopeDimensions.length > 0) &&
        processContext?.processHubId
      ) {
        const currentHub = processHubs.find(h => h.id === processContext.processHubId);
        if (currentHub) {
          void commitHubChange({
            ...currentHub,
            outcomes,
            primaryScopeDimensions,
            updatedAt: Date.now(),
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
      processHubs,
      commitHubChange,
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
  const saveAndRecordBaseline = useCallback(
    async (name: string) => {
      const targetName = name.trim();
      if (!targetName) return;

      setSaveStatus('saving');
      try {
        const result = await saveProject(targetName);
        if (result?.status === 'conflict') {
          // PO-8b: the cloud document was NOT saved — the reload-or-branch
          // dialog owns resolution. Keep the dirty baseline (no false "saved").
          setSaveStatus('idle');
          return;
        }
        const savedName = useProjectStore.getState().projectName || targetName;
        setSavedDocumentName(savedName);
        setSavedFingerprint(computeCurrentFingerprint());
        // FSJ-3a (spec §3): the first explicit save flushes the in-memory hub to
        // the catalog so activeHub survives reload (the document snapshot already
        // carried it — buildDocumentSnapshot reads the activeHub closure). The hub
        // catalog write is NOT under withDocumentSaveLock/ETag by design (it is a
        // separate, fire-and-forget-cloud surface — azure CLAUDE.md); do not wrap.
        const unsaved = useUnsavedHubsStore.getState();
        if (activeHub && unsaved.isUnsaved(activeHub.id)) {
          await saveProcessHub(activeHub);
          unsaved.removeHub(activeHub.id);
          setCatalogHubs(prev => [...prev.filter(h => h.id !== activeHub.id), activeHub]);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
    [activeHub, computeCurrentFingerprint, saveProcessHub, saveProject]
  );

  const handleSave = useCallback(async () => {
    const name = savedDocumentName || defaultSaveName(dataFilename);
    await saveAndRecordBaseline(name);
  }, [dataFilename, saveAndRecordBaseline, savedDocumentName]);

  const handleSaveAs = useCallback(async () => {
    const suggestedName = savedDocumentName || currentProjectName || defaultSaveName(dataFilename);
    const promptedName = window.prompt('Save As', suggestedName);
    const newName = promptedName?.trim();
    if (!newName) return;
    void requestPersistentStorageOnce(); // PO-8b: durable-by-default on a real save gesture
    await saveAndRecordBaseline(newName);
  }, [currentProjectName, dataFilename, saveAndRecordBaseline, savedDocumentName]);

  // ── PO-8b conflict resolution (the reload-or-branch dialog) ──────────────
  // Deferral latch: "Not now" suspends AUTOSAVE retries (each would re-412 and
  // re-open the dialog every 2s); a MANUAL save re-opens it via a fresh 412.
  const [conflictDeferred, setConflictDeferred] = useState(false);

  const handleConflictBranch = useCallback(async () => {
    const conflictedName = pendingConflict?.name;
    if (!conflictedName) return;
    dismissConflict();
    setConflictDeferred(false);
    void requestPersistentStorageOnce(); // real save gesture — same as handleSaveAs
    // Branch = the shipped "(conflict copy)" naming, now user-chosen: a full
    // save under the copy name; the Editor adopts the copy as its active
    // document (copy identity → its own ETag → no conflict from the original
    // document's stale ETag on the next save).
    await saveAndRecordBaseline(`${conflictedName} (conflict copy)`);
  }, [dismissConflict, pendingConflict, saveAndRecordBaseline]);

  const handleConflictReload = useCallback(async () => {
    const conflictedName = pendingConflict?.name;
    const conflictedLocation = pendingConflict?.location ?? 'personal';
    if (!conflictedName) return;
    dismissConflict();
    setConflictDeferred(false);
    const remote = await reloadProjectFromCloud(conflictedName, conflictedLocation);
    if (!remote) return; // storage surfaced the error notification; local copy unchanged
    try {
      await projectActions.loadProject(conflictedName);
      setSavedDocumentName(conflictedName);
      setSavedFingerprint(computeCurrentFingerprint());
    } catch {
      // PO-8a strict-assert seam: a corrupt fetched copy refuses to hydrate.
      // The in-memory document is unchanged; the user can retry or branch.
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [
    computeCurrentFingerprint,
    dismissConflict,
    pendingConflict,
    projectActions,
    reloadProjectFromCloud,
  ]);

  const handleConflictDismiss = useCallback(() => {
    dismissConflict();
    setConflictDeferred(true);
  }, [dismissConflict]);

  const hasActiveSavedAzureDocument = Boolean(currentProjectId && savedDocumentName);
  const hasDocumentContent = rawData.length > 0;
  const isDocumentDirty =
    hasDocumentContent &&
    (!hasActiveSavedAzureDocument || !savedFingerprint || currentFingerprint !== savedFingerprint);
  const activeHubIsUnsaved = activeHub ? unsavedHubs.some(hub => hub.id === activeHub.id) : false;
  const activeIPTitleForInvite =
    activeIP?.metadata.title ?? activeHub?.improvementProject?.metadata.title ?? null;
  const inviteDisabledReason =
    activeIP &&
    (!hasActiveSavedAzureDocument ||
      activeHubIsUnsaved ||
      isDefaultInviteTitle(activeIPTitleForInvite))
      ? 'Save and rename this project before inviting others.'
      : undefined;

  useEffect(() => {
    if (!isDocumentDirty && !activeHubIsUnsaved) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeHubIsUnsaved, isDocumentDirty]);

  /*
   * Autosave follows R6d document truth: a canonical DocumentSnapshot fingerprint
   * compared with the saved baseline. projectStore.hasUnsavedChanges remains
   * internal store state, not Azure document truth.
   */
  useAutoSave(
    handleSave,
    [currentFingerprint],
    hasActiveSavedAzureDocument && isDocumentDirty && !pendingConflict && !conflictDeferred
  );

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
        onAnalyze={handleManualAnalyzeWithLanding}
        onCancel={dataFlow.handleManualEntryCancel}
        appendMode={dataFlow.appendMode}
        existingConfig={dataFlow.appendMode ? dataFlow.existingConfig : undefined}
        existingRowCount={dataFlow.appendMode ? rawData.length : undefined}
      />
    );
  }

  if (dataFlow.isMapping) {
    /*
     * FSJ-10: ColumnMapping is the permanent Fix data / multi-outcome hatch, not
     * the primary paste path. Fresh-paste provisioning has already routed to b0;
     * hatch confirms may persist hub metadata but never rewrite active Y/X.
     */
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
        initialOutcomes={dataFlow.isMappingReEdit ? activeHub?.outcomes : undefined}
        initialPrimaryScopeDimensions={
          dataFlow.isMappingReEdit ? activeHub?.primaryScopeDimensions : undefined
        }
        datasetName={dataFilename || 'Pasted Data'}
        onConfirm={handleMappingConfirmWithCategories}
        onCancel={dataFlow.handleMappingCancel}
        dataQualityReport={dataQualityReport}
        maxFactors={6}
        mode={dataFlow.isMappingReEdit ? 'edit' : 'setup'}
        initialCategories={categories}
        timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
        hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
        onTimeExtractionChange={config =>
          dataFlow.setTimeExtractionConfig(prev => ({ ...prev, ...config }))
        }
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
                  questionText: projectionTarget.hypothesisText,
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
        activeView={
          activeView === 'charter' || activeView === 'sustainment' ? undefined : activeView
        }
        openQuestionCount={
          hypotheses.filter(h => h.status !== 'evidence-survived-test' && h.status !== 'refuted')
            .length
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
        onSaveAs={rawData.length > 0 ? handleSaveAs : undefined}
        activeIPTitle={activeIPContext.activeIP?.metadata.title ?? null}
        onOpenActiveIP={
          activeIPContext.activeIP
            ? () => usePanelsStore.getState().showProjects(activeIPContext.activeIP!.id)
            : undefined
        }
        onExitActiveIP={() => {
          activeIPContext.clearActiveIP();
          if (activeView === 'projects') usePanelsStore.getState().showProjects();
        }}
      />

      {showDurabilityNudge ? (
        <DurabilityNudge
          verb="Save"
          onDismiss={() => {
            setShowDurabilityNudge(false);
            setDurabilityNudgeDismissed(true);
          }}
        />
      ) : null}

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

      {/* PR-PO-2: ControlEntryRow re-hosted OUT of the work-item strip (which
          Task 3 deletes). Gated by the Control-readiness predicate over the
          active project — facts, not the analyzeStatus label. The active-IP
          cascade gives the project; no project active → not shown. */}
      {activeIPContext.activeIP &&
        isControlEligible(
          activeIPContext.activeIP,
          activeHub?.controlRecords ?? [],
          activeHub?.controlHandoffs ?? []
        ) && (
          <div className="mx-2 mb-2">
            <ControlEntryRow
              projectId={projectId}
              hubId={processContext?.processHubId ?? DEFAULT_PROCESS_HUB_ID}
            />
          </div>
        )}

      {/* Pending invitations banner — layout chrome above tab content */}
      <PendingInvitesBanner
        invites={pendingInvites}
        onAccept={acceptInvite}
        onDecline={revokeInvite}
        resolveProjectName={id =>
          activeHub?.improvementProject?.id === id
            ? activeHub.improvementProject.metadata.title
            : undefined
        }
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
        {activeView === 'sustainment' ? (
          <ControlPanel
            activeHub={activeHub}
            targetId={controlTargetId ?? undefined}
            onBack={() => usePanelsStore.getState().showFrame()}
          />
        ) : rawData.length === 0 ? (
          <EditorEmptyState
            dataFlow={dataFlow}
            loadError={loadError}
            onSharePointFileImport={handleSharePointFileImport}
            onLoadSample={handleLoadSampleWithLanding}
          />
        ) : outcome || hasB0ModeProposal || hasAcceptedB0ModeFraming ? (
          <>
            {/* Canvas framing toolbar — '+New investigation' on-demand entry
                (Mode A.1 reopen path, spec §5.5). Visible whenever data + outcome are
                set (i.e. the analyst is on the canvas, not in a mapping modal). */}
            {!isAnalyzeWallCanvasFirst ? (
              <div
                className="flex items-center gap-2 px-4 py-1.5 bg-surface-secondary border-b border-edge"
                data-testid="framing-toolbar"
              >
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={stageFive.openOnDemand}
                  data-testid="canvas-new-analyze"
                  className="text-xs px-2 py-1 rounded border border-edge text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                >
                  + New analyze
                </button>
              </div>
            ) : null}

            {/* Workspace content (ADR-055) — tabs are in AppHeader */}
            {activeView === 'dashboard' ? (
              <div className="flex-1 overflow-y-auto space-y-4">
                {activeHub ? (
                  <div className="p-4 sm:p-6">
                    <ActiveIPLaunchpadCard
                      projects={
                        activeHub.improvementProject &&
                        activeHub.improvementProject.deletedAt === null
                          ? [activeHub.improvementProject]
                          : []
                      }
                      activeProjectId={activeIPContext.activeIP?.id ?? null}
                      onSelectIP={projectId => {
                        activeIPContext.setActiveIP(projectId);
                        usePanelsStore.getState().showProjects(projectId);
                      }}
                      onExitIP={() => activeIPContext.clearActiveIP()}
                      onStartNewIP={() => setIsCreateProjectModalOpen(true)}
                    />
                  </div>
                ) : null}
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
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {activeIPScope ? (
                    <ActiveIPScopeRibbon
                      title={activeIPScope.title}
                      labels={activeIPScope.labels}
                      surface="Process"
                    />
                  ) : null}
                  {/* FSJ-3b (spec §3): goal ceremony opt-in — relocated off the retired
                    Stage-1 HubGoalForm; the empty start-prompt is the framing surface's
                    entry point. Populated banner renders when a goal already exists.
                    Word-style commit: unsaved hubs stay in-memory until an explicit Save. */}
                  {activeHub ? (
                    <GoalBanner
                      goal={activeHub.processGoal ?? ''}
                      startPrompt="Set a process goal…"
                      onChange={next => {
                        void commitHubChange({
                          ...activeHub,
                          name: extractHubName(next) || activeHub.name || 'Untitled hub',
                          processGoal: next,
                          updatedAt: Date.now(),
                        });
                      }}
                    />
                  ) : null}
                  <FrameView
                    canEditCanvas={canEditCanvas}
                    activeIP={activeIPContext.activeIP}
                    outcomeSpecs={(activeHub?.outcomes ?? []).filter(o => o.deletedAt === null)}
                    reingestPendingMatches={pendingMatches}
                    onFixData={dataFlow.openFactorManager}
                    onRenameColumn={dataFlow.handleColumnRename}
                    quietTimeExtraction={dataFlow.quietTimeExtraction}
                    onDismissQuietTimeExtraction={dataFlow.dismissQuietTimeExtraction}
                    onUndoQuietTimeExtraction={dataFlow.undoQuietTimeExtraction}
                    defectDetection={dataFlow.defectDetection}
                    onAcceptDefectDetection={handleAcceptDefectDetection}
                    onDismissDefectDetection={dataFlow.dismissDefectDetection}
                    wideFormatDetection={dataFlow.wideFormatDetection}
                    onAcceptWideFormatDetection={handleAcceptWideFormatDetection}
                    onDismissWideFormatDetection={dataFlow.dismissWideFormatDetection}
                  />
                </div>
                {sharedCoScoutSection}
              </div>
            ) : activeView === 'charter' ? (
              <ImprovementProjectPanel
                activeHub={activeHub}
                onBack={() => usePanelsStore.getState().showFrame()}
                onOpenWall={() => {
                  useCanvasViewportStore.getState().setViewMode('wall');
                  usePanelsStore.getState().showAnalyze();
                }}
              />
            ) : activeView === 'analyze' ? (
              <AnalyzeWorkspace
                activeIPScope={activeIPScope}
                scopeProjectId={activeIPContext.activeIP?.id ?? 'general-unassigned'}
                findingsState={findingsState}
                handleRestoreFinding={handleRestoreFinding}
                handleSetFindingStatus={handleSetFindingStatus}
                handleNavigateToChart={handleNavigateToChart}
                handleShareFinding={handleShareFinding}
                onPromoteFindingAction={activeIP ? handlePromoteFindingAction : undefined}
                drillPath={drillPath}
                handleAddCommentWithAuthor={handleAddCommentWithAuthor}
                handleAddPhoto={handleAddPhoto}
                userId={currentUser?.email ?? null}
                members={wallActiveIPMembers}
                aiOrch={aiOrch}
                actionProposalsState={actionProposalsState}
                handleSearchKnowledge={handleSearchKnowledge}
                columnAliases={columnAliases}
                viewMode={
                  viewState?.findingsViewMode === 'tree'
                    ? 'board'
                    : (viewState?.findingsViewMode as 'list' | 'board' | undefined)
                }
                onViewModeChange={(mode: 'list' | 'board') =>
                  handleViewStateChange({ findingsViewMode: mode })
                }
                hypothesesState={hypothesesState}
                planningProps={wallPlanningProps}
                ideaImpacts={ideaImpacts}
                onProjectIdea={handleProjectIdea}
              />
            ) : activeView === 'projects' ? (
              <ProjectsTabView
                activeHub={activeHub ?? undefined}
                selectedProjectId={selectedOrActiveProjectId}
                onSelectProject={id => {
                  if (id === '') {
                    activeIPContext.clearActiveIP();
                    usePanelsStore.getState().showProjects();
                    return;
                  }
                  activeIPContext.setActiveIP(id);
                  usePanelsStore.getState().showProjects(id);
                }}
                onJumpOut={target => {
                  const p = usePanelsStore.getState();
                  if (target === 'analyze') p.showAnalyze();
                  else if (target === 'explore') p.showExplore();
                  else if (target === 'process') p.showFrame();
                  else if (target === 'improve-workbench') p.showImprovement();
                  else if (target === 'report') p.showReport();
                }}
                approachInputs={{
                  hypotheses,
                  ideas: hypotheses.flatMap(h => h.ideas ?? []),
                  actions: persistedFindings.flatMap(f => f.actions ?? []),
                }}
                onOpenCauseWorkbench={_cause => {
                  // V1: jump to Improve tab (legacy PDCA workbench).
                  // Plan 2 will add IP-context scoping so the workbench filters
                  // to this cause's hypothesis automatically.
                  usePanelsStore.getState().showImprovement();
                }}
                controlRecord={projectsControlRecord}
                controlHandoff={projectsControlHandoff}
                closureInputs={projectsClosureInputs}
                controlRegionSlot={projectsControlRegionSlot}
                onOpenLegacyControl={() =>
                  usePanelsStore
                    .getState()
                    .showControl(projectsControlRecord?.projectId ?? undefined)
                }
                onNudgeProcessOwner={() => {
                  // Plan 3 will emit EngagementEvent webhook here.
                  console.info('[handoff] Nudge process owner — Plan 3 will wire EngagementEvent');
                }}
                onProjectPatch={(projectId, patch) => {
                  void azureHubRepository
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
                onStartNewProject={() => usePanelsStore.getState().showCharter()}
                currentUserId={currentUser?.email ?? undefined}
                inviteDisabledReason={inviteDisabledReason}
              />
            ) : activeView === 'improvement' ? (
              <ImproveTabRoot
                activeIP={activeIP}
                actions={activeIP?.metadata.actions ?? []}
                currentUserId={currentUser?.email}
                onGoHome={() => usePanelsStore.getState().showDashboard()}
                onActionAdd={({ text, parentImprovementProjectId }) =>
                  applyAction({
                    kind: 'ACTION_ITEM_ADD',
                    hubId: activeIP?.hubId ?? '',
                    actionItem: createProjectActionItem({
                      text,
                      parentImprovementProjectId: parentImprovementProjectId ?? null,
                    }),
                  })
                }
                onActionUpdate={(actionItemId, patch) =>
                  applyAction({ kind: 'ACTION_ITEM_UPDATE', actionItemId, patch })
                }
                onActionRemove={actionItemId =>
                  applyAction({ kind: 'ACTION_ITEM_REMOVE', actionItemId, removedAt: Date.now() })
                }
              />
            ) : activeView === 'report' ? (
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <Suspense fallback={null}>
                    <ReportView
                      onClose={() => usePanelsStore.getState().showExplore()}
                      aiEnabled={aiEnabled && isAIAvailable()}
                      narrative={aiOrch.narration.narrative}
                      activeIPScope={activeIPScope}
                      activeIPTitle={activeIPContext.activeIP?.metadata.title ?? null}
                      activeHub={activeHub}
                      activeIP={activeIPContext.activeIP}
                      onOpenActiveIP={
                        activeIPContext.activeIP
                          ? () =>
                              usePanelsStore.getState().showProjects(activeIPContext.activeIP!.id)
                          : undefined
                      }
                      onExitActiveIP={() => {
                        activeIPContext.clearActiveIP();
                      }}
                    />
                  </Suspense>
                </div>
                {sharedCoScoutSection}
              </div>
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
                handleAddCommentWithAuthor={handleAddCommentWithAuthor}
                aiOrch={aiOrch}
                actionProposalsState={actionProposalsState}
                handleSearchKnowledge={handleSearchKnowledge}
                handleShareChart={handleShareChart}
                controlViolations={controlViolations}
                excludedRowIndices={excludedRowIndices}
                excludedReasons={excludedReasons}
                projectedCpkMap={improvementProjectedCpkMap}
                activeIPFactorRequest={activeIPAnalyzeFactorRequest}
                activeIPScope={activeIPScope}
                categoricalValuesByColumn={filteredCategoricalValuesByColumn}
                binnedFactorBindings={activeIP?.binnedFactorBindings ?? undefined}
                onBindingsChange={activeIP ? handleBinningBindingsChange : undefined}
                onOpenWall={() => {
                  useCanvasViewportStore.getState().setViewMode('wall');
                  usePanelsStore.getState().showAnalyze();
                }}
              />
            )}
          </>
        ) : (
          /* rawData present but no outcome yet — treat same as isMapping (FSJ-3b:
             ColumnMapping-only setup; Stage-1 retired, mode='setup' always). */
          /* onStackConfigChange deliberately absent: the no-outcome fallback predates stack suggestions; revisit if this path survives FSJ-10 */
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
            mode="setup"
            initialCategories={categories}
            timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
            hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
            onTimeExtractionChange={config =>
              dataFlow.setTimeExtractionConfig(prev => ({ ...prev, ...config }))
            }
            suggestedStack={dataFlow.suggestedStack}
            rowLimit={250000}
          />
        )}
      </div>

      {/* PO-8b: explicit reload-or-branch conflict resolution (replaces the silent auto-fork) */}
      <SaveConflictDialog
        isOpen={Boolean(pendingConflict)}
        documentName={pendingConflict?.name ?? ''}
        onReload={handleConflictReload}
        onBranch={handleConflictBranch}
        onDismiss={handleConflictDismiss}
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
          onClose={() => setMobileActiveTab('explore')}
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
              <SurveyNotebookBase compact={true} evaluation={surveyEvaluation} />
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
              // IM-1: brainstormQuestionId is a hypothesis hub id; ideas re-home there.
              addIdea(brainstormQuestionId, idea.text);
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
          if (brief.issueStatement || brief.target) {
            const updatedContext = { ...(processContext ?? {}) };
            if (brief.issueStatement) updatedContext.issueStatement = brief.issueStatement;
            if (brief.target) {
              updatedContext.targetMetric = brief.target
                .metric as import('@variscout/core').TargetMetric;
              updatedContext.targetValue = brief.target.value;
              updatedContext.targetDirection = brief.target.direction;
            }
            setProcessContext(updatedContext);
            // IM-1 (F5): AnalysisBrief no longer seeds Question entities.
          }
          // PO-6: persist the Stage-5 draft as a proposed Hypothesis hub.
          if (brief.hypothesisDraft) {
            hypothesesState.createHub(brief.hypothesisDraft, '');
          }
          stageFive.close();
        }}
        onSkip={stageFive.close}
        onClose={stageFive.close}
      />

      {/* Create-Project modal — lightweight Home CTA path (PR-CCJ-E1 T4).
          Wedge V1 single-SKU: on Save, names/frames the Untitled pair if one already
          exists (IM-0a 1:1), or mints a fresh IP via the core factory — then sets
          it active and routes to the Process tab (`showFrame`). The legacy
          `showCharter()` ceremony (5-entry-point variant) is deferred to Task #44
          cross-tab presentation. Modal guards on activeHub + currentUser?.email —
          neither is meaningful otherwise. */}
      {isCreateProjectModalOpen && activeHub && currentUser?.email ? (
        <CreateProjectModal
          onSave={({ title, issueStatement }) => {
            const existing = activeHub.improvementProject;
            if (existing && existing.deletedAt === null) {
              // IM-0a 1:1 guard (FSJ-3a): the Untitled pair already exists — this
              // ceremony names/frames it; it never mints a second project per hub.
              const updated: ImprovementProject = {
                ...existing,
                metadata: { ...existing.metadata, title },
                ...(issueStatement ? { issueStatement } : {}),
                updatedAt: Date.now(),
              };
              upsertProject(updated);
              void commitHubChange({
                ...activeHub,
                improvementProject: updated,
                updatedAt: Date.now(),
              }).catch(() => {
                // Non-blocking — storage failure is logged by the storage service
              });
              activeIPContext.setActiveIP(updated.id);
            } else {
              const newIP = createNewIP({
                hubId: activeHub.id,
                title,
                issueStatement,
                currentUserId: currentUser.email,
                currentUserDisplayName: currentUser.name,
              });
              upsertProject(newIP);
              // FSJ-3a: embed on the hub row — useActiveIPContext derives activeIP
              // from hub.improvementProject (liveProjects), so a store-only upsert
              // leaves the Process tab gated (pre-existing gap, fixed here).
              void commitHubChange({
                ...activeHub,
                improvementProject: newIP,
                updatedAt: Date.now(),
              }).catch(() => {
                // Non-blocking — storage failure is logged by the storage service
              });
              activeIPContext.setActiveIP(newIP.id);
            }
            setIsCreateProjectModalOpen(false);
            usePanelsStore.getState().showFrame();
          }}
          onClose={() => setIsCreateProjectModalOpen(false)}
        />
      ) : null}

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
