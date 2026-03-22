import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useStorage, classifySyncError } from '../services/storage';
import { useData } from '../context/DataContext';
import { useDataIngestion } from '../hooks/useDataIngestion';
import { useFilterNavigation } from '../hooks';
import Dashboard from '../components/Dashboard';
import { EditorToolbar } from '../components/EditorToolbar';
import DataPanel from '../components/data/DataPanel';
import DataTableModal from '../components/data/DataTableModal';
import FindingsPanel from '../components/FindingsPanel';
import ManualEntry from '../components/data/ManualEntry';
import PasteScreen from '../components/data/PasteScreen';
import WhatIfPage from '../components/WhatIfPage';
import {
  ColumnMapping,
  CoScoutPanelBase,
  AIOnboardingTooltip,
  ImprovementWorkspaceBase,
  YamazumiDetectedModal,
  CapabilitySuggestionModal,
  type AnalysisBrief,
} from '@variscout/ui';
import {
  useControlViolations,
  useHypotheses,
  useJourneyPhase,
  detectEntryScenario,
  useCapabilityIChartData,
  useTranslation,
} from '@variscout/hooks';
import { hasTeamFeatures, downloadCSV } from '@variscout/core';
import { isAIAvailable } from '../services/aiService';
import { usePhotoComments } from '../hooks/usePhotoComments';
import { getCurrentUser, type CurrentUser } from '../auth/getCurrentUser';
import { useDataMerge } from '../hooks/useDataMerge';
import type { ExclusionReason } from '@variscout/core';
import { SAMPLES } from '@variscout/data';
import {
  Upload,
  FileText,
  PenLine,
  ClipboardPaste,
  Database,
  RefreshCw,
  Check,
  X,
  Pencil,
  Download,
  Beaker,
  Table2,
  Plus,
  Maximize2,
} from 'lucide-react';
import { FileBrowseButton, type FilePickerResult } from '../components/FileBrowseButton';
import { downloadFileFromGraph } from '../services/storage';
import { useFilePicker } from '../hooks/useFilePicker';
import { useIsMobile, BREAKPOINTS, MobileTabBar, type MobileTab } from '@variscout/ui';
import { useEditorAI } from '../hooks/useEditorAI';
import { useEditorInvestigation } from '../hooks/useEditorInvestigation';
import { useEditorImprovement } from '../hooks/useEditorImprovement';
import { useActionProposals } from '../hooks/useActionProposals';
import { useLocale } from '../context/LocaleContext';
import { useEditorPanels } from '../hooks/useEditorPanels';
import { useEditorDataFlow } from '../hooks/useEditorDataFlow';
import { useTeamsShare } from '../hooks/useTeamsShare';
import { useShareFinding } from '../hooks/useShareFinding';
import { useFindingsOrchestration } from '../hooks/useFindingsOrchestration';
import { buildChartSharePayload, buildReportSharePayload } from '../services/shareContent';
import { buildSubPageId, buildCurrentViewLink } from '../services/deepLinks';
import { useToast } from '../context/ToastContext';
import { setBeforeUnloadHandler } from '../teams';

type LoadErrorCode = 'not-found' | 'forbidden' | 'plan-mismatch' | 'offline' | 'auth' | 'unknown';

interface LoadError {
  code: LoadErrorCode;
  message: string;
  action?: { label: string; onClick: () => void };
}

const ERROR_MESSAGES: Record<LoadErrorCode, string> = {
  'not-found':
    'Project not found. It may have been deleted or moved. Ask the person who shared this link.',
  forbidden:
    "This project is in a Teams channel you don't have access to. Ask a channel member to add you.",
  'plan-mismatch': 'This project requires a Team plan to access. Contact your admin.',
  offline:
    "You're offline and this project isn't cached locally. Connect to the internet to load it.",
  auth: 'Your session has expired.',
  unknown: 'Failed to load project. Please try again.',
};

const COSCOUT_RESIZE_CONFIG = {
  storageKey: 'variscout-azure-coscout-panel-width',
  min: 320,
  max: 600,
  defaultWidth: 384,
};

interface EditorProps {
  projectId: string | null;
  onBack: () => void;
  /** Deep link: auto-open findings panel and highlight this finding */
  initialFindingId?: string;
  /** Deep link: auto-focus this chart type */
  initialChart?: string;
}

export const Editor: React.FC<EditorProps> = ({
  projectId,
  onBack,
  initialFindingId,
  initialChart,
}) => {
  const { syncStatus } = useStorage();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const {
    rawData,
    filteredData,
    currentProjectName,
    hasUnsavedChanges,
    outcome,
    factors,
    specs,
    columnAliases,
    isPerformanceMode,
    measureColumns,
    measureLabel,
    dataFilename,
    dataQualityReport,
    setOutcome,
    setRawData,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    setColumnAliases,
    setAnalysisMode,
    setYamazumiMapping,
    filters,
    setFilters,
    displayOptions,
    setDisplayOptions,
    viewState,
    setViewState,
    findings: persistedFindings,
    setFindings: setPersistedFindings,
    hypotheses: persistedHypotheses,
    setHypotheses: setPersistedHypotheses,
    currentProjectLocation,
    saveProject,
    loadProject,
    stats,
    stagedStats,
    processContext,
    setProcessContext,
    aiEnabled,
    categories,
    setCategories,
    knowledgeSearchFolder,
    subgroupConfig,
    setSubgroupConfig,
    cpkTarget,
  } = useData();

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
  const { t } = useTranslation();

  // Mobile tab bar state (phone only)
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('analysis');

  // Reset mobile tab when data is cleared
  useEffect(() => {
    if (rawData.length === 0) {
      setMobileActiveTab('analysis');
    }
  }, [rawData.length]);

  // Report view state changes for persistence (merge partial updates)
  const handleViewStateChange = useCallback(
    (partial: Partial<import('@variscout/hooks').ViewState>) => {
      setViewState({ ...(viewState ?? {}), ...partial });
    },
    [viewState, setViewState]
  );

  // Panel visibility and chart/table sync
  const panels = useEditorPanels({
    displayOptions,
    setDisplayOptions,
    viewState,
    onViewStateChange: handleViewStateChange,
  });

  // Focus return refs for mobile overlays (F-19)
  const findingsTriggerRef = useRef<Element | null>(null);
  const coScoutTriggerRef = useRef<Element | null>(null);

  // Restore focus when mobile findings overlay closes
  useEffect(() => {
    if (!isPhone || panels.isFindingsOpen) return;
    if (findingsTriggerRef.current instanceof HTMLElement) {
      findingsTriggerRef.current.focus();
      findingsTriggerRef.current = null;
    }
  }, [isPhone, panels.isFindingsOpen]);

  // Restore focus when mobile CoScout overlay closes
  useEffect(() => {
    if (!isPhone || panels.isCoScoutOpen) return;
    if (coScoutTriggerRef.current instanceof HTMLElement) {
      coScoutTriggerRef.current.focus();
      coScoutTriggerRef.current = null;
    }
  }, [isPhone, panels.isCoScoutOpen]);

  // Phone: data panel opens DataTableModal instead of inline panel
  const handleDataPanelToggle = useCallback(() => {
    if (isPhone) {
      panels.setIsDataTableOpen(true);
    } else {
      panels.setIsDataPanelOpen(prev => !prev);
    }
  }, [isPhone, panels]);

  // Mobile tab bar navigation handler
  const handleMobileTabChange = useCallback(
    (tab: MobileTab) => {
      setMobileActiveTab(tab);
      if (tab === 'findings') {
        if (isPhone) findingsTriggerRef.current = document.activeElement;
        panels.setIsFindingsOpen(true);
      } else if (tab === 'improve') {
        panels.setIsImprovementOpen(true);
      } else if (tab === 'analysis') {
        panels.setIsFindingsOpen(false);
        panels.setIsImprovementOpen(false);
      }
      // 'more' is handled by the More bottom sheet
    },
    [isPhone, panels]
  );

  // Manual data merge (for append mode)
  const dataFlow = useEditorDataFlow({
    rawData,
    outcome,
    factors,
    specs,
    columnAliases,
    dataFilename,
    isPerformanceMode,
    measureColumns,
    measureLabel,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    setPerformanceMode,
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
      switch (action) {
        case 'report':
          panels.setIsReportOpen(true);
          break;
        case 'whatif':
          panels.setIsWhatIfOpen(true);
          break;
        case 'presentation':
          panels.setIsPresentationMode(true);
          break;
        case 'datatable':
          panels.setIsDataTableOpen(true);
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
          panels.setIsDataTableOpen(true);
          break;
        case 'csv':
          if (outcome) downloadCSV(filteredData, outcome, specs);
          break;
      }
    },
    [panels, dataFlow, filteredData, outcome, specs]
  );

  // Ref to allow ingestion callbacks to reach dataFlow setters
  const dataFlowRef = React.useRef(dataFlow);
  dataFlowRef.current = dataFlow;

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
    setPerformanceMode,
    onDone: () => {
      dataFlow.manualEntryDone();
    },
  });

  // Capability suggestion modal state
  const [showCapabilitySuggestion, setShowCapabilitySuggestion] = useState(false);
  const [capabilitySuggestionDismissed, setCapabilitySuggestionDismissed] = useState(false);

  // Load project data when opening an existing project
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  useEffect(() => {
    if (projectId && rawData.length === 0 && !dataFlow.isLoadingProject) {
      dataFlow.startProjectLoad();
      setLoadError(null);
      loadProject(projectId)
        .catch(error => {
          const classified = classifySyncError(error);
          const code: LoadErrorCode =
            classified.category === 'not_found'
              ? 'not-found'
              : classified.category === 'forbidden'
                ? 'forbidden'
                : classified.category === 'auth'
                  ? 'auth'
                  : !navigator.onLine
                    ? 'offline'
                    : 'unknown';

          setLoadError({
            code,
            message: ERROR_MESSAGES[code],
            action:
              code === 'auth'
                ? {
                    label: 'Sign in',
                    onClick: () => {
                      window.location.href = '/.auth/login/aad';
                    },
                  }
                : code !== 'unknown'
                  ? { label: 'Go to Dashboard', onClick: onBack }
                  : undefined,
          });
        })
        .finally(() => dataFlow.projectLoaded());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // intentionally exclude rawData/dataFlow to avoid re-triggering

  // Filter navigation
  const filterNav = useFilterNavigation({
    enableHistory: false,
    enableUrlSync: false,
  });

  // Teams share integration
  const { share, setDeepLink, isTeams } = useTeamsShare();
  const baseUrl = window.location.origin + window.location.pathname;
  const projectName = currentProjectName || 'New Analysis';

  // Share handlers
  const { shareFinding, canMentionInChannel } = useShareFinding({ projectName, baseUrl });

  // Compute projected metric value from selected improvement ideas (for BriefHeader progress bar)
  const projectedFromIdeas = useMemo(() => {
    if (!processContext?.targetMetric || processContext?.targetValue === undefined)
      return undefined;
    if (!stats) return undefined;
    let totalMeanShift = 0;
    let totalSigmaReduction = 0;
    for (const h of persistedHypotheses ?? []) {
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
    return undefined; // cpk would need recalculation
  }, [persistedHypotheses, processContext, stats]);

  // Findings orchestration (extracted from Editor — pin, restore, chart observation, popout, etc.)
  const {
    findingsState,
    highlightedFindingId,
    setHighlightedFindingId,
    handlePinFinding,
    handleRestoreFinding,
    findingsCallbacks,
    handleOpenFindingsPopout,
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
    setIsFindingsOpen: panels.setIsFindingsOpen,
    shareFinding,
    canMentionInChannel,
    onViewStateChange: handleViewStateChange,
    hypotheses: persistedHypotheses,
    processContext,
    currentValue: stats?.cpk ?? stats?.mean,
    projectedValue: projectedFromIdeas,
    factorRoles: processContext?.factorRoles,
    aiAvailable: aiEnabled && isAIAvailable(),
  });

  // Deep link: auto-open findings panel and highlight target finding (one-shot)
  const deepLinkConsumedRef = React.useRef(false);
  useEffect(() => {
    if (deepLinkConsumedRef.current || !rawData.length || !outcome) return;
    if (initialFindingId) {
      panels.setIsFindingsOpen(true);
      setHighlightedFindingId(initialFindingId);
    }
    if (initialChart) {
      handleViewStateChange({
        focusedChart: initialChart as 'ichart' | 'boxplot' | 'pareto' | null,
      });
    }
    // Clear deep link params from URL to avoid re-triggering on refresh
    if (initialFindingId || initialChart) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    deepLinkConsumedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData.length, outcome, initialFindingId, initialChart]);

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

  // Deep link URL for the current editor view (used by ShareDropdown)
  const deepLinkUrl = useMemo(() => {
    if (!projectName) return '';
    return buildCurrentViewLink(baseUrl, projectName, {
      focusedChart: viewState?.focusedChart ?? undefined,
      findingId: highlightedFindingId ?? undefined,
      mode: panels.isReportOpen ? 'report' : undefined,
    });
  }, [baseUrl, projectName, viewState?.focusedChart, highlightedFindingId, panels.isReportOpen]);

  // Share via Teams native dialog with toast feedback
  const handleShareTeams = useCallback(() => {
    const payload = buildReportSharePayload(
      processContext?.description || projectName,
      projectName,
      baseUrl,
      outcome ? stats?.cpk : undefined
    );
    share(payload).then(success => {
      if (success) {
        showToast({ type: 'success', message: 'Shared in Teams', dismissAfter: 3000 });
      } else {
        showToast({ type: 'error', message: "Couldn't share. Try again.", dismissAfter: 5000 });
      }
    });
  }, [share, projectName, processContext?.description, outcome, stats?.cpk, baseUrl, showToast]);

  // Share state for EditorToolbar's ShareDropdown
  const shareState = useMemo(
    () => ({
      deepLinkUrl,
      isInTeams: isTeams,
      showPublishReport: panels.isReportOpen && hasTeamFeatures(),
      onShareTeams: handleShareTeams,
      onPublishReport: () => {
        /* P3 — wired later */
      },
      onToast: showToast,
    }),
    [deepLinkUrl, isTeams, panels.isReportOpen, handleShareTeams, showToast]
  );

  // Current user (for comment author attribution)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  // Photo comments (Team plan only — wires photo processing + upload)
  const { handleAddPhoto, handleCaptureFromTeams, isTeamsCamera, handleAddCommentWithAuthor } =
    usePhotoComments({
      findingsState,
      analysisId: currentProjectName || 'default',
      author: currentUser?.name,
      location: currentProjectLocation,
    });

  // Hypothesis CRUD (causal theories linked to findings)
  const hypothesesState = useHypotheses({
    initialHypotheses: persistedHypotheses,
    onHypothesesChange: setPersistedHypotheses,
    findings: findingsState.findings,
  });

  // Investigation workflow: hypotheses map, idea impacts, projection, status transitions
  const {
    hypothesesMap,
    handleCreateHypothesis,
    ideaImpacts,
    projectionTarget,
    handleProjectIdea,
    handleSaveIdeaProjection,
    clearProjectionTarget,
    handleSetFindingStatus,
  } = useEditorInvestigation({
    hypothesesState,
    findingsState,
    processContext,
    stats,
    panels,
  });

  // Improvement workspace: data prep, popout sync, idea-to-action conversion
  const {
    improvementHypotheses,
    improvementLinkedFindings,
    selectedIdeaIds,
    projectedCpkMap,
    convertedIdeaIds,
    handleConvertIdeasToActions,
    handleOpenImprovementPopout,
    handleSynthesisChange,
  } = useEditorImprovement({
    hypothesesState,
    findingsState,
    persistedHypotheses,
    processContext,
    setProcessContext,
  });

  // Control violations for DataPanel annotations
  const controlViolations = useControlViolations(filteredData, outcome, specs);

  // Capability suggestion: show when specs are set and no other detection modal is showing
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

  // Journey phase detection for toolbar coaching strip
  const journeyPhase = useJourneyPhase(!!filteredData.length, findingsState.findings);
  const entryScenario = useMemo(() => detectEntryScenario(processContext), [processContext]);

  // Subgroup capability data for AI context (when capability mode active)
  const capabilityIChartData = useCapabilityIChartData({
    filteredData,
    outcome: outcome ?? '',
    specs: specs ?? {},
    subgroupConfig: subgroupConfig ?? { method: 'fixed-size', size: 5 },
    cpkTarget,
  });
  const isCapabilityMode = displayOptions.standardIChartMetric === 'capability';
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

  // AI orchestration (context, narration, CoScout, knowledge search)
  const {
    aiContext,
    narration,
    coscout,
    knowledgeSearch,
    suggestedQuestions,
    fetchChartInsight: fetchChartInsightFromAI,
    handleNarrativeAsk,
    handleAskCoScoutFromIdeas,
    handleAskCoScoutFromFinding,
    handleAskCoScoutFromCategory,
  } = useEditorAI({
    enabled: aiEnabled,
    stats: stats ?? undefined,
    filteredData,
    rawData,
    outcome,
    specs,
    findings: findingsState.findings,
    hypotheses: hypothesesState.hypotheses,
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
    persistedHypotheses,
    locale,
    knowledgeSearchFolder,
    journeyPhase,
    entryScenario,
    capabilityData: aiCapabilityData,
    onOpenCoScout: () => {
      if (isPhone) coScoutTriggerRef.current = document.activeElement;
      panels.setIsCoScoutOpen(true);
    },
    onOpenFindings: () => {
      if (isPhone) findingsTriggerRef.current = document.activeElement;
      panels.setIsFindingsOpen(true);
    },
  });

  // ADR-026: On-demand knowledge search handler
  const handleSearchKnowledge = useCallback(() => {
    const lastUserMsg = [...coscout.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg?.content) {
      knowledgeSearch.search(lastUserMsg.content);
    }
  }, [coscout.messages, knowledgeSearch]);

  // ADR-029: Action proposal state management
  const { actionProposals, handleExecuteAction, handleDismissAction } = useActionProposals({
    messages: coscout.messages,
    filterNav,
    findingsState,
    hypothesesState,
    filters,
    stats,
    filteredDataLength: filteredData.length,
  });

  // Pass categories and brief from ColumnMapping into DataContext
  const handleMappingConfirmWithCategories = useCallback(
    (
      newOutcome: string,
      newFactors: string[],
      newSpecs?: { target?: number; lsl?: number; usl?: number },
      newCategories?: import('@variscout/core').InvestigationCategory[],
      brief?: AnalysisBrief
    ) => {
      if (newCategories) {
        setCategories(newCategories);
      }
      // Apply brief data to ProcessContext and create hypotheses
      if (brief) {
        const updatedContext = { ...processContext };
        if (brief.problemStatement) {
          updatedContext.problemStatement = brief.problemStatement;
        }
        if (brief.target) {
          updatedContext.targetMetric = brief.target.metric;
          updatedContext.targetValue = brief.target.value;
          updatedContext.targetDirection = brief.target.direction;
        }
        setProcessContext(updatedContext);
        // Create hypotheses from brief
        if (brief.hypotheses) {
          for (const h of brief.hypotheses) {
            hypothesesState.addHypothesis(h.text, h.factor, h.level);
          }
        }
      }
      dataFlow.handleMappingConfirm(newOutcome, newFactors, newSpecs);
    },
    [dataFlow, setCategories, processContext, setProcessContext, hypothesesState]
  );

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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = useCallback(async () => {
    const name = currentProjectName || 'New Analysis';
    setSaveStatus('saving');
    try {
      await saveProject(name);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [currentProjectName, saveProject]);

  // Save As... to SharePoint folder (ADR-030)
  // Uses File Picker v8 Save As tray mode for native rename-before-save UX
  const handleSaveAsToSharePoint = useCallback(
    async (items: FilePickerResult[]) => {
      const folder = items[0];
      if (!folder) return;
      setSaveStatus('saving');
      try {
        // Save current project to the chosen location via normal save pipeline
        const name = currentProjectName || 'New Analysis';
        await saveProject(name);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
    [currentProjectName, saveProject]
  );

  const projectFileName = `${currentProjectName || 'New Analysis'}.vrs`;
  const saveAsPicker = useFilePicker({
    mode: 'folders',
    saveAs: { fileName: projectFileName },
    pickLabel: 'Save Here',
    onPick: handleSaveAsToSharePoint,
  });

  const handleSaveAs = useCallback(() => {
    saveAsPicker.open();
  }, [saveAsPicker]);

  // Handle file import from SharePoint File Picker (ADR-030)
  const handleSharePointFileImport = useCallback(
    async (items: FilePickerResult[]) => {
      const item = items[0];
      if (!item) return;
      try {
        const file = await downloadFileFromGraph(
          item['@sharePoint.endpoint'],
          item.parentReference.driveId,
          item.id
        );
        dataFlow.handleFile(file);
      } catch (err) {
        console.error('[Editor] SharePoint file import failed:', err);
      }
    },
    [dataFlow]
  );

  // Register Teams beforeUnload handler for data loss prevention.
  // When the user navigates away from the tab, auto-save if there are unsaved changes.
  useEffect(() => {
    setBeforeUnloadHandler(async () => {
      if (hasUnsavedChanges) {
        const name = currentProjectName || 'New Analysis';
        await saveProject(name);
      }
    });
  }, [hasUnsavedChanges, currentProjectName, saveProject]);

  // If in paste mode, show PasteScreen full screen
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

  // If in manual entry mode, show ManualEntry full screen
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

  // If in column mapping mode, show ColumnMapping full screen
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
        initialProblemStatement={processContext?.problemStatement}
      />
    );
  }

  // If What-If Simulator is open, show full-page view
  if (panels.isWhatIfOpen) {
    return (
      <WhatIfPage
        onBack={() => {
          clearProjectionTarget();
          panels.setIsWhatIfOpen(false);
        }}
        filterCount={filterNav.filterStack.length}
        filterStack={filterNav.filterStack}
        projectionContext={
          projectionTarget
            ? {
                ideaText: projectionTarget.ideaText,
                hypothesisText: projectionTarget.hypothesisText,
              }
            : undefined
        }
        onSaveProjection={projectionTarget ? handleSaveIdeaProjection : undefined}
      />
    );
  }

  // If Improvement Workspace is open, show full-page view
  if (panels.isImprovementOpen) {
    return (
      <ImprovementWorkspaceBase
        synthesis={processContext?.synthesis}
        onSynthesisChange={handleSynthesisChange}
        hypotheses={improvementHypotheses}
        linkedFindings={improvementLinkedFindings}
        onToggleSelect={(hId, iId, sel) => hypothesesState.selectIdea(hId, iId, sel)}
        onUpdateTimeframe={(hId, iId, timeframe) =>
          hypothesesState.updateIdea(hId, iId, { timeframe })
        }
        onUpdateDirection={(hId, iId, dir) =>
          hypothesesState.updateIdea(hId, iId, { direction: dir })
        }
        onUpdateCost={(hId, iId, cost) => hypothesesState.updateIdea(hId, iId, { cost })}
        onOpenRisk={(_hId, _iId) => {
          // Risk popover will be wired in a follow-up (Phase 10)
        }}
        onRemoveIdea={hypothesesState.removeIdea}
        onOpenWhatIf={handleProjectIdea}
        onAddIdea={(hId, text) => {
          hypothesesState.addIdea(hId, text);
        }}
        onAskCoScout={handleAskCoScoutFromIdeas}
        onConvertToActions={handleConvertIdeasToActions}
        onBack={() => panels.setIsImprovementOpen(false)}
        onPopout={handleOpenImprovementPopout}
        selectedIdeaIds={selectedIdeaIds}
        convertedIdeaIds={convertedIdeaIds}
        targetCpk={processContext?.targetValue}
      />
    );
  }

  return (
    <div
      className={`flex flex-col ${isPhone ? 'h-[calc(100vh-64px)]' : 'h-[calc(100vh-120px)]'} ${isPhone && rawData.length > 0 ? 'pb-[62px]' : ''}`}
    >
      <EditorToolbar
        onBack={onBack}
        projectName={currentProjectName || (projectId ? `Analysis ${projectId}` : 'New Analysis')}
        hasUnsavedChanges={hasUnsavedChanges}
        dataState={{
          hasData: rawData.length > 0,
          hasOutcome: !!outcome,
          hasFactors: factors.length > 0,
          filteredData,
          outcome,
          specs,
        }}
        syncState={{
          syncStatus,
          saveStatus,
          onSave: handleSave,
          onSaveAs: hasTeamFeatures() ? handleSaveAs : undefined,
        }}
        panelState={{
          isFindingsOpen: panels.isFindingsOpen,
          isDataPanelOpen: panels.isDataPanelOpen,
          isImprovementOpen: panels.isImprovementOpen,
          findingsCount: findingsState.findings.length,
          onToggleFindings: () => {
            if (isPhone && !panels.isFindingsOpen)
              findingsTriggerRef.current = document.activeElement;
            panels.setIsFindingsOpen(prev => !prev);
          },
          onToggleDataPanel: handleDataPanelToggle,
        }}
        dataActions={{
          onAddPasteData: () => dataFlow.startAppendPaste(),
          onAddFileData: () => dataFlow.startAppendFileUpload(),
          onAddManualData: dataFlow.handleAddMoreData,
          onOpenDataTable: () => panels.setIsDataTableOpen(true),
          onOpenWhatIf: () => panels.setIsWhatIfOpen(true),
          onOpenImprovement: () => panels.setIsImprovementOpen(true),
          onOpenReport: () => panels.setIsReportOpen(true),
          onOpenPresentation: () => panels.setIsPresentationMode(true),
        }}
        showOverflowMenu={!isPhone}
        shareState={shareState}
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

      {/* Main Content — inert when phone overlay is open (F-18 focus trap) */}
      <div
        ref={el => {
          if (!el) return;
          if (isPhone && (panels.isFindingsOpen || panels.isCoScoutOpen)) {
            el.setAttribute('inert', '');
          } else {
            el.removeAttribute('inert');
          }
        }}
        className="flex-1 flex flex-col min-h-0 bg-surface rounded-xl border border-edge overflow-hidden"
      >
        {rawData.length === 0 ? (
          // Empty State - Upload Data + Sample Datasets
          <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto relative">
            {/* Loading overlay for project load or file parse */}
            {(dataFlow.isLoadingProject || dataFlow.isParsingFile) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={32} className="text-blue-400 animate-spin" />
                  <span className="text-sm text-content">
                    {dataFlow.isLoadingProject ? 'Loading project...' : 'Parsing file...'}
                  </span>
                </div>
              </div>
            )}
            <div className="max-w-lg w-full text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-surface-secondary rounded-full flex items-center justify-center">
                <FileText size={32} className="text-content-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-content mb-2">Start Your Analysis</h3>
              <p className="text-content-secondary mb-6">
                Upload your data, paste from Excel, enter manually, or try a sample dataset.
              </p>

              <input
                ref={dataFlow.fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={dataFlow.handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {hasTeamFeatures() ? (
                  <>
                    <FileBrowseButton
                      mode="files"
                      filters={['.csv', '.xlsx', '.xls']}
                      onPick={handleSharePointFileImport}
                      onLocalFile={file => dataFlow.handleFile(file)}
                      label="Open from SharePoint"
                      localLabel="Browse this device"
                      showLocalFallback={true}
                      size="md"
                    />
                  </>
                ) : (
                  <button
                    onClick={dataFlow.triggerFileUpload}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Upload size={20} />
                    Upload File
                  </button>
                )}

                <button
                  onClick={() => dataFlow.startPaste()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors font-medium"
                >
                  <ClipboardPaste size={20} />
                  Paste Data
                </button>

                <button
                  onClick={() => dataFlow.startManualEntry()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors font-medium"
                >
                  <PenLine size={20} />
                  Manual Entry
                </button>
              </div>

              {loadError && (
                <div className="mx-4 mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
                  <p className="text-sm">{loadError.message}</p>
                  {loadError.action && (
                    <button
                      onClick={loadError.action.onClick}
                      className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
                    >
                      {loadError.action.label}
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-content-muted mb-6">Supports CSV, XLSX, and XLS files</p>

              {/* Sample Datasets */}
              <div className="text-left">
                <h4 className="text-sm font-medium text-content mb-3 flex items-center gap-2">
                  <Database size={14} />
                  Sample Datasets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLES.filter(s => s.featured || s.category === 'cases')
                    .slice(0, 8)
                    .map(sample => (
                      <button
                        key={sample.urlKey}
                        data-testid={`sample-${sample.urlKey}`}
                        onClick={() => dataFlow.handleLoadSample(sample)}
                        className="text-left p-3 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500/50 rounded-lg transition-all group"
                      >
                        <span className="text-sm font-medium text-content group-hover:text-blue-300 block truncate">
                          {sample.name}
                        </span>
                        <span className="text-xs text-content-muted line-clamp-1">
                          {sample.description}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : outcome ? (
          // Dashboard with charts, optional data panel, and optional findings
          <div className="flex-1 flex overflow-hidden">
            <Dashboard
              drillFromPerformance={dataFlow.drillFromPerformance}
              onBackToPerformance={dataFlow.handleBackToPerformance}
              onDrillToMeasure={dataFlow.handleDrillToMeasure}
              onPointClick={isPhone ? undefined : panels.handlePointClick}
              highlightedPointIndex={isPhone ? undefined : panels.highlightedChartPoint}
              filterNav={filterNav}
              initialViewState={viewState ?? undefined}
              onViewStateChange={handleViewStateChange}
              isReportOpen={panels.isReportOpen}
              onCloseReport={() => panels.setIsReportOpen(false)}
              isPresentationMode={panels.isPresentationMode}
              onExitPresentation={() => panels.setIsPresentationMode(false)}
              onManageFactors={dataFlow.openFactorManager}
              onPinFinding={handlePinFinding}
              onShareChart={handleShareChart}
              findingsCallbacks={findingsCallbacks}
              fetchChartInsight={fetchChartInsightFromAI}
              aiContext={aiContext.context}
              aiEnabled={aiEnabled && isAIAvailable()}
              narrative={narration.narrative}
              narrativeLoading={narration.isLoading}
              narrativeCached={narration.isCached}
              narrativeError={narration.error}
              onNarrativeRetry={narration.refresh}
              onNarrativeAsk={handleNarrativeAsk}
              onAskCoScoutFromCategory={handleAskCoScoutFromCategory}
              findings={findingsState.findings}
            />
            {/* AI onboarding tooltip — first-time hint for NarrativeBar Ask button */}
            <AIOnboardingTooltip
              isAIAvailable={aiEnabled && isAIAvailable()}
              anchorSelector='[data-testid="narrative-ask-button"]'
            />
            {/* FindingsPanel: full-screen overlay on phone, inline sidebar on desktop */}
            {isPhone && panels.isFindingsOpen ? (
              <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up safe-area-bottom">
                <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
                  <h2 className="text-sm font-semibold text-content">Findings</h2>
                  <button
                    onClick={() => {
                      panels.setIsFindingsOpen(false);
                      setHighlightedFindingId(null);
                    }}
                    className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                    style={{ minWidth: 44, minHeight: 44 }}
                    aria-label="Close findings"
                  >
                    <X size={20} />
                  </button>
                </div>
                <FindingsPanel
                  isOpen={true}
                  onClose={() => {
                    panels.setIsFindingsOpen(false);
                    setHighlightedFindingId(null);
                  }}
                  findings={findingsState.findings}
                  onEditFinding={findingsState.editFinding}
                  onDeleteFinding={findingsState.deleteFinding}
                  onRestoreFinding={handleRestoreFinding}
                  onSetFindingStatus={handleSetFindingStatus}
                  onSetFindingTag={findingsState.setFindingTag}
                  onAddComment={handleAddCommentWithAuthor}
                  onEditComment={findingsState.editFindingComment}
                  onDeleteComment={findingsState.deleteFindingComment}
                  onAddPhoto={hasTeamFeatures() ? handleAddPhoto : undefined}
                  onCaptureFromTeams={
                    hasTeamFeatures() && isTeamsCamera ? handleCaptureFromTeams : undefined
                  }
                  onCreateHypothesis={handleCreateHypothesis}
                  hypothesesMap={hypothesesMap}
                  hypotheses={hypothesesState.hypotheses}
                  onSelectHypothesis={h => {
                    if (h.factor && h.level) {
                      setFilters({ [h.factor]: [h.level] });
                    }
                  }}
                  onAddSubHypothesis={(parentId, text, factor, vType) =>
                    hypothesesState.addSubHypothesis(parentId, text, factor, undefined, vType)
                  }
                  factors={factors}
                  getChildrenSummary={hypothesesState.getChildrenSummary}
                  onSetValidationTask={hypothesesState.setValidationTask}
                  onCompleteTask={hypothesesState.completeTask}
                  onSetManualStatus={hypothesesState.setManualStatus}
                  onAddAction={findingsState.addAction}
                  onCompleteAction={findingsState.completeAction}
                  onDeleteAction={findingsState.deleteAction}
                  onSetOutcome={findingsState.setOutcome}
                  ideaImpacts={ideaImpacts}
                  onAddIdea={hypothesesState.addIdea}
                  onUpdateIdea={hypothesesState.updateIdea}
                  onRemoveIdea={hypothesesState.removeIdea}
                  onSelectIdea={hypothesesState.selectIdea}
                  onProjectIdea={handleProjectIdea}
                  onSetCauseRole={hypothesesState.setCauseRole}
                  onAskCoScout={handleAskCoScoutFromIdeas}
                  onAskCoScoutAboutFinding={handleAskCoScoutFromFinding}
                  showAuthors={true}
                  columnAliases={columnAliases}
                  drillPath={drillPath}
                  activeFindingId={highlightedFindingId}
                  onShareFinding={handleShareFinding}
                  onSetFindingAssignee={findingsState.setFindingAssignee}
                  onNavigateToChart={handleNavigateToChart}
                  viewMode={viewState?.findingsViewMode}
                  onViewModeChange={mode => handleViewStateChange({ findingsViewMode: mode })}
                  coScoutMessages={coscout.messages}
                  coScoutOnSend={coscout.send}
                  coScoutIsLoading={coscout.isLoading}
                  coScoutIsStreaming={coscout.isStreaming}
                  coScoutOnStopStreaming={coscout.stopStreaming}
                  coScoutError={coscout.error}
                  coScoutOnRetry={coscout.retry}
                  investigationPhase={aiContext.context?.investigation?.phase}
                  coScoutSuggestedQuestions={suggestedQuestions}
                  projectedCpkMap={projectedCpkMap}
                  synthesis={processContext?.synthesis}
                  linkedFindings={improvementLinkedFindings}
                />
              </div>
            ) : (
              <FindingsPanel
                isOpen={panels.isFindingsOpen}
                onClose={() => {
                  panels.setIsFindingsOpen(false);
                  setHighlightedFindingId(null);
                }}
                findings={findingsState.findings}
                onEditFinding={findingsState.editFinding}
                onDeleteFinding={findingsState.deleteFinding}
                onRestoreFinding={handleRestoreFinding}
                onSetFindingStatus={handleSetFindingStatus}
                onSetFindingTag={findingsState.setFindingTag}
                onAddComment={handleAddCommentWithAuthor}
                onEditComment={findingsState.editFindingComment}
                onDeleteComment={findingsState.deleteFindingComment}
                onAddPhoto={hasTeamFeatures() ? handleAddPhoto : undefined}
                onCaptureFromTeams={
                  hasTeamFeatures() && isTeamsCamera ? handleCaptureFromTeams : undefined
                }
                onCreateHypothesis={handleCreateHypothesis}
                onSetValidationTask={hypothesesState.setValidationTask}
                onCompleteTask={hypothesesState.completeTask}
                onSetManualStatus={hypothesesState.setManualStatus}
                onAddAction={findingsState.addAction}
                onCompleteAction={findingsState.completeAction}
                onDeleteAction={findingsState.deleteAction}
                onSetOutcome={findingsState.setOutcome}
                ideaImpacts={ideaImpacts}
                onAddIdea={hypothesesState.addIdea}
                onUpdateIdea={hypothesesState.updateIdea}
                onRemoveIdea={hypothesesState.removeIdea}
                onSelectIdea={hypothesesState.selectIdea}
                onProjectIdea={handleProjectIdea}
                onSetCauseRole={hypothesesState.setCauseRole}
                onAskCoScout={handleAskCoScoutFromIdeas}
                onAskCoScoutAboutFinding={handleAskCoScoutFromFinding}
                showAuthors={true}
                columnAliases={columnAliases}
                drillPath={drillPath}
                activeFindingId={highlightedFindingId}
                onPopout={handleOpenFindingsPopout}
                onShareFinding={handleShareFinding}
                onSetFindingAssignee={findingsState.setFindingAssignee}
                onNavigateToChart={handleNavigateToChart}
                viewMode={viewState?.findingsViewMode}
                onViewModeChange={mode => handleViewStateChange({ findingsViewMode: mode })}
                coScoutMessages={coscout.messages}
                coScoutOnSend={coscout.send}
                coScoutIsLoading={coscout.isLoading}
                coScoutIsStreaming={coscout.isStreaming}
                coScoutOnStopStreaming={coscout.stopStreaming}
                coScoutError={coscout.error}
                coScoutOnRetry={coscout.retry}
                investigationPhase={aiContext.context?.investigation?.phase}
                coScoutSuggestedQuestions={suggestedQuestions}
                projectedCpkMap={projectedCpkMap}
                synthesis={processContext?.synthesis}
                linkedFindings={improvementLinkedFindings}
              />
            )}
            {/* CoScoutPanel: full-screen overlay on phone, inline sidebar on desktop */}
            {isPhone && panels.isCoScoutOpen ? (
              <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up safe-area-bottom">
                <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
                  <h2 className="text-sm font-semibold text-content">CoScout</h2>
                  <button
                    onClick={() => panels.setIsCoScoutOpen(false)}
                    className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                    style={{ minWidth: 44, minHeight: 44 }}
                    aria-label="Close CoScout"
                  >
                    <X size={20} />
                  </button>
                </div>
                <CoScoutPanelBase
                  isOpen={true}
                  onClose={() => panels.setIsCoScoutOpen(false)}
                  messages={coscout.messages}
                  onSend={coscout.send}
                  isLoading={coscout.isLoading}
                  isStreaming={coscout.isStreaming}
                  onStopStreaming={coscout.stopStreaming}
                  error={coscout.error}
                  onRetry={coscout.retry}
                  onClear={coscout.clear}
                  onCopyLastResponse={coscout.copyLastResponse}
                  resizeConfig={COSCOUT_RESIZE_CONFIG}
                  suggestedQuestions={suggestedQuestions}
                  onSuggestedQuestionClick={coscout.send}
                  knowledgeAvailable={knowledgeSearch.isAvailable}
                  knowledgeSearching={knowledgeSearch.isSearching}
                  knowledgeDocuments={knowledgeSearch.documents}
                  onSearchKnowledge={handleSearchKnowledge}
                  actionProposals={actionProposals}
                  onExecuteAction={handleExecuteAction}
                  onDismissAction={handleDismissAction}
                />
              </div>
            ) : (
              <CoScoutPanelBase
                isOpen={panels.isCoScoutOpen}
                onClose={() => panels.setIsCoScoutOpen(false)}
                messages={coscout.messages}
                onSend={coscout.send}
                isLoading={coscout.isLoading}
                isStreaming={coscout.isStreaming}
                onStopStreaming={coscout.stopStreaming}
                error={coscout.error}
                onRetry={coscout.retry}
                onClear={coscout.clear}
                onCopyLastResponse={coscout.copyLastResponse}
                resizeConfig={COSCOUT_RESIZE_CONFIG}
                suggestedQuestions={suggestedQuestions}
                onSuggestedQuestionClick={coscout.send}
                knowledgeAvailable={knowledgeSearch.isAvailable}
                knowledgeSearching={knowledgeSearch.isSearching}
                knowledgeDocuments={knowledgeSearch.documents}
                onSearchKnowledge={handleSearchKnowledge}
                actionProposals={actionProposals}
                onExecuteAction={handleExecuteAction}
                onDismissAction={handleDismissAction}
              />
            )}
            {/* DataPanel: hidden on phone (use DataTableModal instead) */}
            {!isPhone && (
              <DataPanel
                isOpen={panels.isDataPanelOpen}
                onClose={() => panels.setIsDataPanelOpen(false)}
                highlightRowIndex={panels.highlightRowIndex}
                onRowClick={panels.handleRowClick}
                controlViolations={controlViolations}
                onOpenEditor={() => panels.setIsDataTableOpen(true)}
              />
            )}
          </div>
        ) : (
          // Data loaded but no outcome selected -- column mapping fallback
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
            initialProblemStatement={processContext?.problemStatement}
          />
        )}
      </div>

      {/* Data Table Editor Modal */}
      <DataTableModal
        isOpen={panels.isDataTableOpen}
        onClose={() => panels.setIsDataTableOpen(false)}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
        controlViolations={controlViolations}
      />

      {/* Yamazumi Detection Modal */}
      {dataFlow.yamazumiDetection && (
        <YamazumiDetectedModal
          detection={dataFlow.yamazumiDetection}
          onEnable={taktTime => {
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
          onDecline={() => dataFlow.dismissYamazumiDetection()}
        />
      )}

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
        />
      )}

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
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileActiveTab('analysis')}
          />
          {/* Bottom sheet */}
          <div className="fixed bottom-[50px] left-0 right-0 bg-surface-primary border-t border-edge rounded-t-2xl z-50 animate-slide-up safe-area-bottom max-h-[60vh] overflow-y-auto">
            <div className="py-2">
              <button
                onClick={() => handleMobileMore('report')}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
              >
                <FileText size={18} />
                {t('report.scouting') || 'Scouting Report'}
              </button>
              <button
                onClick={() => handleMobileMore('whatif')}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
              >
                <Beaker size={18} />
                {t('panel.whatIf') || 'What-If'}
              </button>
              <button
                onClick={() => handleMobileMore('presentation')}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
              >
                <Maximize2 size={18} />
                {t('nav.presentationMode') || 'Presentation'}
              </button>
              <div className="border-t border-edge my-1" />
              <button
                onClick={() => handleMobileMore('addpaste')}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
              >
                <Plus size={18} />
                {t('toolbar.addMore') || 'Add More Data'}
              </button>
              <button
                onClick={() => handleMobileMore('editdata')}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
              >
                <Pencil size={18} />
                {t('data.editData') || 'Edit Data'}
              </button>
              <button
                onClick={() => handleMobileMore('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
              >
                <Download size={18} />
                {t('export.asCsv') || 'Export CSV'}
              </button>
              <button
                onClick={() => handleMobileMore('datatable')}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary"
              >
                <Table2 size={18} />
                {t('panel.dataTable') || 'Data Table'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
