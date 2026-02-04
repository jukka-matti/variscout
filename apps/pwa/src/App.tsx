import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { useData } from './context/DataContext';
import { downloadCSV } from './lib/export';
import SettingsPanel from './components/SettingsPanel';
import SavedProjectsModal from './components/SavedProjectsModal';
import DataTableModal from './components/DataTableModal';
import DataPanel from './components/DataPanel';
import FunnelPanel from './components/FunnelPanel';
import FunnelWindow, { openFunnelPopout } from './components/FunnelWindow';
import { ColumnMapping } from '@variscout/ui';
import Dashboard from './components/Dashboard';
import HomeScreen from './components/HomeScreen';
import ManualEntry from './components/ManualEntry';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import { useDataIngestion } from './hooks/useDataIngestion';
import { useEmbedMessaging } from './hooks/useEmbedMessaging';
import { useAutoSave } from './hooks/useAutoSave';
import { SAMPLES } from './data/sampleData';
import {
  validateData,
  getNelsonRule2ViolationPoints,
  calculateStats,
  type ExclusionReason,
} from '@variscout/core';
import { PerformanceDetectedModal } from '@variscout/ui';
import type { WideFormatDetection } from '@variscout/core';

type AnalysisView = 'dashboard' | 'regression' | 'gagerr' | 'performance';

// Breakpoint for desktop panel (vs modal on mobile)
const DESKTOP_BREAKPOINT = 1024;

function App() {
  const {
    rawData,
    filteredData,
    outcome,
    specs,
    currentProjectName,
    hasUnsavedChanges,
    dataFilename,
    dataQualityReport,
    paretoMode,
    separateParetoFilename,
    saveProject,
    exportProject,
    importProject,
    setRawData,
    setOutcome,
    setFactors,
    setFilters,
    setSpecs,
    setMeasureColumns,
    setMeasureLabel,
    setPerformanceMode,
    setDataFilename,
    setDataQualityReport,
    factors,
    columnAliases,
  } = useData();

  // State for performance mode auto-detection
  const [wideFormatDetection, setWideFormatDetection] = useState<WideFormatDetection | null>(null);
  const [isPerformanceSetupOpen, setIsPerformanceSetupOpen] = useState(false);
  // State for manual data entry view
  const [isManualEntry, setIsManualEntry] = useState(false);
  // State for drill navigation from Performance Mode to standard I-Chart
  const [drillFromPerformance, setDrillFromPerformance] = useState<string | null>(null);
  // Callback for wide format detection
  const handleWideFormatDetected = useCallback((result: WideFormatDetection) => {
    setWideFormatDetection(result);
  }, []);

  const {
    handleFileUpload: ingestFile,
    handleParetoFileUpload,
    clearParetoFile,
    loadSample,
    clearData,
  } = useDataIngestion({
    onWideFormatDetected: handleWideFormatDetected,
  });
  const [isMapping, setIsMapping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [isFunnelPanelOpen, setIsFunnelPanelOpen] = useState(false);
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveInputName, setSaveInputName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [activeView, setActiveView] = useState<AnalysisView>('dashboard');
  // Trigger for opening spec editor from MobileMenu
  const [openSpecEditorRequested, setOpenSpecEditorRequested] = useState(false);
  // Track if desktop for panel vs modal
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  );
  // Highlighted point from table row click (for bi-directional sync)
  const [highlightedChartPoint, setHighlightedChartPoint] = useState<number | null>(null);

  // Embed mode - hides header/footer for iframe embedding
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  // Funnel popout mode - renders only the FunnelWindow component
  const [isFunnelPopoutMode, setIsFunnelPopoutMode] = useState(false);
  // Embed focus chart - when set, Dashboard shows only this chart
  const [embedFocusChart, setEmbedFocusChart] = useState<
    'ichart' | 'boxplot' | 'pareto' | 'stats' | null
  >(null);
  // Embed stats tab - when set, auto-selects this tab in StatsPanel
  const [embedStatsTab, setEmbedStatsTab] = useState<'summary' | 'histogram' | 'normality' | null>(
    null
  );

  // Embed messaging - handles postMessage communication with parent window
  const { highlightedChart, highlightIntensity, notifyChartClicked } =
    useEmbedMessaging(isEmbedMode);

  // Auto-save hook - saves project after 2s debounce when changes detected
  const { isSaving: isAutoSaving } = useAutoSave(
    hasUnsavedChanges,
    currentProjectName,
    saveProject,
    {
      delay: 2000,
      enabled: true,
    }
  );

  // Combined saving state (manual or auto)
  const isSavingAny = isSaving || isAutoSaving;

  // Track desktop/mobile for panel behavior
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Handle URL parameters on mount (?sample=xxx&embed=true&chart=ichart&tab=histogram&view=funnel)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sampleKey = params.get('sample');
    const embedParam = params.get('embed');
    const chartParam = params.get('chart');
    const tabParam = params.get('tab');
    const viewParam = params.get('view');

    // Set funnel popout mode if specified
    if (viewParam === 'funnel') {
      setIsFunnelPopoutMode(true);
      return; // Don't process other params in funnel mode
    }

    // Set embed mode if specified
    if (embedParam === 'true') {
      setIsEmbedMode(true);
    }

    // Set focus chart if specified (only valid in embed mode)
    if (chartParam && ['ichart', 'boxplot', 'pareto', 'stats'].includes(chartParam)) {
      setEmbedFocusChart(chartParam as 'ichart' | 'boxplot' | 'pareto' | 'stats');
    }

    // Set stats tab if specified (for stats chart embed)
    if (tabParam && ['summary', 'histogram', 'normality'].includes(tabParam)) {
      setEmbedStatsTab(tabParam as 'summary' | 'histogram' | 'normality');
    }

    // Auto-load sample if specified
    if (sampleKey && rawData.length === 0) {
      const sample = SAMPLES.find(s => s.urlKey === sampleKey);
      if (sample) {
        loadSample(sample);
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

  // Compute control violations for DataPanel annotations
  const controlViolations = useMemo(() => {
    if (!outcome || filteredData.length === 0) return undefined;

    const map = new Map<number, string[]>();

    // Calculate stats for violation detection
    const values = filteredData
      .map(row => {
        const val = row[outcome];
        return typeof val === 'number' ? val : parseFloat(String(val));
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) return undefined;

    const stats = calculateStats(values);

    // Check each row for violations
    filteredData.forEach((row, index) => {
      const val = row[outcome];
      const numValue = typeof val === 'number' ? val : parseFloat(String(val));
      if (isNaN(numValue)) return;

      const violations: string[] = [];

      // Check control limit violations
      if (numValue > stats.ucl) {
        violations.push('Special Cause: Above UCL');
      } else if (numValue < stats.lcl) {
        violations.push('Special Cause: Below LCL');
      }

      // Check spec limit violations
      if (specs.usl !== undefined && numValue > specs.usl) {
        violations.push('Above USL');
      }
      if (specs.lsl !== undefined && numValue < specs.lsl) {
        violations.push('Below LSL');
      }

      if (violations.length > 0) {
        map.set(index, violations);
      }
    });

    // Check Nelson Rule 2 violations
    const nelsonViolations = getNelsonRule2ViolationPoints(values, stats.mean);
    nelsonViolations.forEach(index => {
      const existing = map.get(index) || [];
      if (!existing.some(v => v.includes('Nelson Rule 2'))) {
        existing.push('Special Cause: Nelson Rule 2 (9 consecutive points on same side of mean)');
        map.set(index, existing);
      }
    });

    return map;
  }, [filteredData, outcome, specs]);

  const handleExport = useCallback(async () => {
    const node = document.getElementById('dashboard-export-container');
    if (!node) return;

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: '#0f172a',
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
    const filename = currentProjectName
      ? `${currentProjectName.replace(/[^a-z0-9]/gi, '_')}.csv`
      : `variscout-data-${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(filteredData, outcome, specs, { filename });
  }, [filteredData, outcome, specs, currentProjectName]);

  const handleSaveToBrowser = useCallback(async () => {
    if (currentProjectName) {
      // Quick save with existing name
      setIsSaving(true);
      try {
        await saveProject(currentProjectName);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Show input for new project name
      setShowSaveInput(true);
      setSaveInputName(`Analysis ${new Date().toLocaleDateString()}`);
    }
  }, [currentProjectName, saveProject]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Escape: close any open modal
      if (e.key === 'Escape') {
        if (wideFormatDetection) setWideFormatDetection(null);
        else if (showSaveInput) setShowSaveInput(false);
        else if (showResetConfirm) setShowResetConfirm(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isProjectsOpen) setIsProjectsOpen(false);
        else if (isDataTableOpen) setIsDataTableOpen(false);
        return;
      }

      // Only trigger shortcuts when not in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // ⌘/Ctrl+S: Save project
      if (isMod && e.key === 's') {
        e.preventDefault();
        if (rawData.length > 0 && !isMapping) {
          handleSaveToBrowser();
        }
      }

      // ⌘/Ctrl+O: Open saved projects
      if (isMod && e.key === 'o') {
        e.preventDefault();
        setIsProjectsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    wideFormatDetection,
    showSaveInput,
    showResetConfirm,
    isSettingsOpen,
    isProjectsOpen,
    isDataTableOpen,
    rawData.length,
    isMapping,
    handleSaveToBrowser,
  ]);

  const handleSaveWithName = useCallback(async () => {
    if (!saveInputName.trim()) return;
    setIsSaving(true);
    try {
      await saveProject(saveInputName.trim());
      setShowSaveInput(false);
      setSaveInputName('');
    } finally {
      setIsSaving(false);
    }
  }, [saveInputName, saveProject]);

  const handleDownloadFile = useCallback(() => {
    const filename = currentProjectName || `variscout-${new Date().toISOString().split('T')[0]}`;
    exportProject(filename);
  }, [currentProjectName, exportProject]);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith('.vrs')) {
        try {
          await importProject(file);
        } catch (err) {
          console.error('Import failed', err);
          alert("Failed to import file. Make sure it's a valid .vrs file.");
        }
      }
      e.target.value = '';
    },
    [importProject]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const success = await ingestFile(e);
    if (success) {
      setIsMapping(true);
    }
    e.target.value = '';
  };

  const handleMappingConfirm = (newOutcome: string, newFactors: string[]) => {
    setOutcome(newOutcome);
    setFactors(newFactors);
    setIsMapping(false);
  };

  const handleMappingCancel = () => {
    clearData();
    setIsMapping(false);
  };

  // Open data table with a specific row highlighted (from chart point click)
  const openDataTableAtRow = useCallback(
    (index: number) => {
      setHighlightRowIndex(index);
      if (isDesktop) {
        setIsDataPanelOpen(true);
      } else {
        setIsDataTableOpen(true);
      }
    },
    [isDesktop]
  );

  // Handle row click from data panel (bi-directional sync)
  const handleDataPanelRowClick = useCallback((index: number) => {
    setHighlightedChartPoint(index);
    // Clear highlight after animation
    setTimeout(() => setHighlightedChartPoint(null), 2000);
  }, []);

  // Toggle data panel
  const handleToggleDataPanel = useCallback(() => {
    if (isDesktop) {
      setIsDataPanelOpen(prev => !prev);
    } else {
      setIsDataTableOpen(true);
    }
  }, [isDesktop]);

  // Toggle funnel panel
  const handleToggleFunnelPanel = useCallback(() => {
    setIsFunnelPanelOpen(prev => !prev);
  }, []);

  // Close funnel panel
  const handleCloseFunnelPanel = useCallback(() => {
    setIsFunnelPanelOpen(false);
  }, []);

  // Navigate to Regression Panel from funnel (for interaction analysis)
  const handleFunnelNavigateToRegression = useCallback(() => {
    setIsFunnelPanelOpen(false);
    setActiveView('regression');
  }, []);

  // Accumulator for funnel filters (applied one at a time, then batch-set on close)
  const pendingFunnelFiltersRef = React.useRef<Record<string, (string | number)[]>>({});

  // Apply a single filter from funnel panel
  // TODO: Integrate with FilterNavigation context to show breadcrumbs
  // Currently sets filters directly to DataContext which filters data but doesn't show breadcrumbs
  const handleApplyFunnelFilter = useCallback(
    (factor: string, value: string | number) => {
      // Accumulate filters in ref (VariationFunnel calls this multiple times before closing)
      pendingFunnelFiltersRef.current = {
        ...pendingFunnelFiltersRef.current,
        [factor]: [value],
      };
      // Apply immediately so user sees filtered data
      setFilters({
        ...pendingFunnelFiltersRef.current,
      });
    },
    [setFilters]
  );

  // Reset pending filters when funnel panel opens
  useEffect(() => {
    if (isFunnelPanelOpen) {
      pendingFunnelFiltersRef.current = {};
    }
  }, [isFunnelPanelOpen]);

  // Open funnel in popout window
  const handleOpenFunnelPopout = useCallback(() => {
    if (outcome) {
      openFunnelPopout(rawData, factors, outcome, columnAliases);
      setIsFunnelPanelOpen(false);
    }
  }, [rawData, factors, outcome, columnAliases]);

  // Listen for messages from funnel popout window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'FUNNEL_APPLY_FILTERS') {
        setFilters(event.data.filters);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setFilters]);

  // Close data table and clear highlight
  const handleCloseDataTable = useCallback(() => {
    setIsDataTableOpen(false);
    setHighlightRowIndex(null);
    setShowExcludedOnly(false);
  }, []);

  // Close data panel
  const handleCloseDataPanel = useCallback(() => {
    setIsDataPanelOpen(false);
    setHighlightRowIndex(null);
  }, []);

  // Open data table showing only excluded rows (from validation banner)
  const openDataTableExcluded = useCallback(() => {
    setShowExcludedOnly(true);
    setHighlightRowIndex(null);
    setIsDataTableOpen(true);
  }, []);

  // Open data table showing all rows (from validation banner)
  const openDataTableAll = useCallback(() => {
    setShowExcludedOnly(false);
    setHighlightRowIndex(null);
    setIsDataTableOpen(true);
  }, []);

  // Reset confirmation handlers
  const handleResetRequest = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    clearData();
    setShowResetConfirm(false);
  }, [clearData]);

  // Handle view change from settings
  const handleViewChange = useCallback((view: AnalysisView) => {
    setActiveView(view);
  }, []);

  // Handle enabling performance mode from detection modal
  const handleEnablePerformanceMode = useCallback(
    (columns: string[], label: string) => {
      setMeasureColumns(columns);
      setMeasureLabel(label);
      setPerformanceMode(true);
      setWideFormatDetection(null);
      setActiveView('performance');
    },
    [setMeasureColumns, setMeasureLabel, setPerformanceMode]
  );

  // Handle declining performance mode from detection modal
  const handleDeclinePerformanceMode = useCallback(() => {
    setWideFormatDetection(null);
  }, []);

  // Handle opening performance setup from settings
  const handleConfigurePerformance = useCallback(() => {
    setActiveView('performance');
  }, []);

  // Handle drilling from Performance Mode to standard I-Chart for a specific measure
  const handleDrillToMeasure = useCallback(
    (measureId: string) => {
      setDrillFromPerformance(measureId);
      setOutcome(measureId);
      setActiveView('dashboard');
    },
    [setOutcome]
  );

  // Handle returning to Performance Mode from drilled I-Chart
  const handleBackToPerformance = useCallback(() => {
    setDrillFromPerformance(null);
    setActiveView('performance');
  }, []);

  // Handle manual data entry completion
  const handleManualDataAnalyze = useCallback(
    (
      data: any[],
      config: {
        outcome: string;
        factors: string[];
        specs?: { usl?: number; lsl?: number };
        isPerformanceMode?: boolean;
        measureColumns?: string[];
        measureLabel?: string;
      }
    ) => {
      // Set raw data
      setRawData(data);
      setDataFilename('Manual Entry');

      // Set outcome and factors
      setOutcome(config.outcome);
      setFactors(config.factors);

      // Set specs if provided
      if (config.specs) {
        setSpecs(config.specs);
      }

      // Run validation
      const report = validateData(data, config.outcome);
      setDataQualityReport(report);

      // Handle performance mode
      if (config.isPerformanceMode && config.measureColumns && config.measureColumns.length >= 3) {
        setMeasureColumns(config.measureColumns);
        setMeasureLabel(config.measureLabel || 'Channel');
        setPerformanceMode(true);
        setActiveView('performance');
      } else {
        setMeasureColumns([]);
        setPerformanceMode(false);
        setActiveView('dashboard');
      }

      // Exit manual entry view
      setIsManualEntry(false);
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setSpecs,
      setDataQualityReport,
      setMeasureColumns,
      setMeasureLabel,
      setPerformanceMode,
    ]
  );

  // Handle canceling manual entry
  const handleManualEntryCancel = useCallback(() => {
    setIsManualEntry(false);
  }, []);

  // Handle opening manual entry from home screen
  const handleOpenManualEntry = useCallback(() => {
    setIsManualEntry(true);
  }, []);

  // Render only FunnelWindow in popout mode
  if (isFunnelPopoutMode) {
    return <FunnelWindow />;
  }

  return (
    <div className="flex flex-col h-screen bg-surface text-content font-sans selection:bg-blue-500/30">
      {/* Hide header in embed mode */}
      {!isEmbedMode && (
        <AppHeader
          currentProjectName={currentProjectName}
          hasUnsavedChanges={hasUnsavedChanges}
          hasData={rawData.length > 0}
          dataFilename={dataFilename}
          rowCount={rawData.length}
          isSaving={isSavingAny}
          isDataPanelOpen={isDataPanelOpen}
          isFunnelPanelOpen={isFunnelPanelOpen}
          onSaveToBrowser={handleSaveToBrowser}
          onOpenProjects={() => setIsProjectsOpen(true)}
          onNewAnalysis={handleResetRequest}
          onToggleDataPanel={handleToggleDataPanel}
          onToggleFunnelPanel={handleToggleFunnelPanel}
          onOpenDataTable={() => {
            setHighlightRowIndex(null);
            setIsDataTableOpen(true);
          }}
          onDownloadFile={handleDownloadFile}
          onExportCSV={handleExportCSV}
          onExportImage={handleExport}
          onEnterPresentationMode={() => setIsPresentationMode(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onReset={handleResetRequest}
          onOpenSpecEditor={() => setOpenSpecEditorRequested(true)}
        />
      )}

      {/* Save name input modal */}
      {showSaveInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-3">Save Project</h3>
            <input
              type="text"
              value={saveInputName}
              onChange={e => setSaveInputName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveWithName();
                if (e.key === 'Escape') setShowSaveInput(false);
              }}
              placeholder="Project name"
              className="w-full px-3 py-2 bg-surface border border-edge-secondary rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveInput(false)}
                className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWithName}
                disabled={!saveInputName.trim() || isSaving}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-2">Reset Analysis?</h3>
            <p className="text-xs text-content-secondary mb-4">
              {currentProjectName ? (
                <>
                  All unsaved changes to{' '}
                  <strong className="text-content">{currentProjectName}</strong> will be lost.
                </>
              ) : (
                <>All data will be cleared. This cannot be undone.</>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex">
        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isManualEntry ? (
            <ManualEntry onAnalyze={handleManualDataAnalyze} onCancel={handleManualEntryCancel} />
          ) : rawData.length === 0 ? (
            <HomeScreen
              onFileUpload={handleFileUpload}
              onImportFile={handleImportFile}
              onOpenProjects={() => setIsProjectsOpen(true)}
              onLoadSample={loadSample}
              onOpenManualEntry={handleOpenManualEntry}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          ) : isMapping ? (
            <ColumnMapping
              availableColumns={Object.keys(rawData[0])}
              initialOutcome={outcome}
              initialFactors={factors}
              datasetName={dataFilename || undefined}
              onConfirm={handleMappingConfirm}
              onCancel={handleMappingCancel}
              dataQualityReport={dataQualityReport}
              onViewExcludedRows={openDataTableExcluded}
              onViewAllData={openDataTableAll}
              paretoMode={paretoMode}
              separateParetoFilename={separateParetoFilename}
              onParetoFileUpload={handleParetoFileUpload}
              onClearParetoFile={clearParetoFile}
            />
          ) : (
            <Dashboard
              onPointClick={openDataTableAtRow}
              isPresentationMode={isPresentationMode}
              onExitPresentation={() => setIsPresentationMode(false)}
              highlightedChart={highlightedChart}
              highlightIntensity={highlightIntensity}
              onChartClick={isEmbedMode ? notifyChartClicked : undefined}
              embedFocusChart={embedFocusChart}
              embedStatsTab={embedStatsTab}
              onOpenColumnMapping={() => setIsMapping(true)}
              openSpecEditorRequested={openSpecEditorRequested}
              onSpecEditorOpened={() => setOpenSpecEditorRequested(false)}
              activeView={activeView}
              highlightedPointIndex={highlightedChartPoint}
              drillFromPerformance={drillFromPerformance}
              onBackToPerformance={handleBackToPerformance}
              onDrillToMeasure={handleDrillToMeasure}
            />
          )}
        </div>

        {/* Data Panel (desktop only, when open) */}
        {isDesktop && rawData.length > 0 && !isMapping && (
          <DataPanel
            isOpen={isDataPanelOpen}
            onClose={handleCloseDataPanel}
            highlightRowIndex={highlightRowIndex}
            onRowClick={handleDataPanelRowClick}
            excludedRowIndices={excludedRowIndices}
            excludedReasons={excludedReasons}
            controlViolations={controlViolations}
          />
        )}
      </main>

      {/* Settings Panel (slide-in from right) */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenProjects={() => {
          setIsSettingsOpen(false);
          setIsProjectsOpen(true);
        }}
        onNewAnalysis={() => {
          setIsSettingsOpen(false);
          handleResetRequest();
        }}
        onSaveProject={handleSaveToBrowser}
        onConfigurePerformance={handleConfigurePerformance}
        isSaving={isSavingAny}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Funnel Panel (slide-in from right) */}
      {outcome && (
        <FunnelPanel
          isOpen={isFunnelPanelOpen}
          onClose={handleCloseFunnelPanel}
          data={rawData}
          factors={factors}
          outcome={outcome}
          columnAliases={columnAliases}
          specs={specs}
          onApplyFilter={handleApplyFunnelFilter}
          onOpenPopout={handleOpenFunnelPopout}
          onNavigateToRegression={handleFunnelNavigateToRegression}
        />
      )}

      <SavedProjectsModal isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} />
      <DataTableModal
        isOpen={isDataTableOpen}
        onClose={handleCloseDataTable}
        highlightRowIndex={highlightRowIndex ?? undefined}
        showExcludedOnly={showExcludedOnly}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
      />

      {/* Hide footer in embed mode */}
      {!isEmbedMode && (
        <AppFooter filteredCount={filteredData.length} totalCount={rawData.length} />
      )}

      {/* Performance Mode Detection Modal */}
      {wideFormatDetection && (
        <PerformanceDetectedModal
          detection={wideFormatDetection}
          onEnable={handleEnablePerformanceMode}
          onDecline={handleDeclinePerformanceMode}
        />
      )}
    </div>
  );
}

export default App;
