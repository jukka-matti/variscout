import React from 'react';
import { lazyWithRetry } from '../lib/chunkReload';
import { normalizeProcessHubId } from '@variscout/core';
import { useAnalyzeStore, useCanvasViewportStore } from '@variscout/stores';
import { ColumnMapping, WorkspaceProjectLaunchpadCard } from '@variscout/ui';
import { usePanelsStore } from '../features/panels/panelsStore';
const Dashboard = lazyWithRetry(() => import('./Dashboard'));
const HomeScreen = lazyWithRetry(() => import('./HomeScreen'));
const PasteScreen = lazyWithRetry(() => import('./data/PasteScreen'));
const ManualEntry = lazyWithRetry(() => import('./data/ManualEntry'));
const FrameView = lazyWithRetry(() => import('./views/FrameView'));
const ImprovementProjectPanel = lazyWithRetry(() => import('./ImprovementProjectPanel'));
const ControlPanel = lazyWithRetry(() => import('./ControlPanel'));
const AnalyzeView = lazyWithRetry(() => import('./views/AnalyzeView'));
const ImprovementView = lazyWithRetry(() => import('./views/ImprovementView'));
const ProjectsTabView = lazyWithRetry(() => import('./ProjectsTabView'));
const ReportView = lazyWithRetry(() => import('./views/ReportView'));

// The switch receives App.tsx's already-derived view contract. W6 keeps
// orchestration hooks in the shell while isolating render routing here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppViewSwitchProps = Record<string, any>;

export function AppViewSwitch(props: AppViewSwitchProps): React.ReactElement {
  const {
    analysisMode,
    columnAliases,
    dataFilename,
    dataQualityReport,
    factors,
    handleImportVrs,
    handleLoadSample,
    handleManualAnalyze,
    handleMappingConfirmToHub,
    importFlow,
    ingestion,
    outcome,
    panels,
    paretoMode,
    rawData,
    separateParetoFilename,
    sessionHub,
    specs,
    timeColumn,
    workspaceProjectContext,
    workspaceProjectScope,
  } = props;

  return (
    <>
      {importFlow.isPasteMode ? (
        <PasteScreen
          onAnalyze={importFlow.handlePasteAnalyze}
          onCancel={importFlow.handlePasteCancel}
          error={importFlow.pasteError}
        />
      ) : importFlow.isManualEntry ? (
        <ManualEntry
          onAnalyze={handleManualAnalyze}
          onCancel={importFlow.handleManualEntryCancel}
        />
      ) : rawData.length === 0 ? (
        <HomeScreen
          onLoadSample={handleLoadSample}
          onOpenPaste={importFlow.handleOpenPaste}
          onOpenManualEntry={importFlow.handleOpenManualEntry}
          onImportVrs={handleImportVrs}
        />
      ) : panels.activeView === 'home' ? (
        <AppWorkspaceHomeView props={props} />
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
          onConfirm={handleMappingConfirmToHub}
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
        <AppProcessView props={props} />
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
        <ControlPanel
          activeHub={sessionHub ?? undefined}
          targetId={panels.controlTargetId ?? undefined}
          rawData={rawData}
          timeColumn={timeColumn}
          specs={specs}
          onBack={panels.showFrame}
        />
      ) : panels.activeView === 'analyze' ? (
        <AppAnalyzeView props={props} />
      ) : panels.activeView === 'projects' ? (
        <AppProjectsView props={props} />
      ) : panels.activeView === 'improvement' ? (
        <ImprovementView
          workspaceProjectScope={workspaceProjectScope}
          workspaceProject={workspaceProjectContext.workspaceProject ?? null}
          onGoHome={panels.showHome}
        />
      ) : panels.activeView === 'report' ? (
        <AppReportView props={props} />
      ) : panels.activeView === 'explore' ? (
        <AppExploreView props={props} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-sm text-content-secondary">
          Unknown workspace view.
        </div>
      )}
    </>
  );
}

function AppWorkspaceHomeView({ props }: { props: AppViewSwitchProps }): React.ReactElement {
  const { panels, sessionHub, workspaceViewModel } = props;
  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <WorkspaceProjectLaunchpadCard
        projects={
          sessionHub?.improvementProject &&
          workspaceViewModel &&
          sessionHub.improvementProject.deletedAt === null
            ? [sessionHub.improvementProject]
            : []
        }
        controlRecords={sessionHub?.controlRecords}
        onStartNewWorkspace={panels.showCharter}
      />
    </div>
  );
}

function AppProcessView({ props }: { props: AppViewSwitchProps }): React.ReactElement {
  const {
    importFlow,
    pendingMatches,
    setAnalysisMode,
    setDefectMapping,
    setMeasureColumns,
    setMeasureLabel,
    setSelectedMeasure,
  } = props;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FrameView
        reingestPendingMatches={pendingMatches}
        onFixData={importFlow.openFactorManager}
        onRenameColumn={importFlow.handleColumnRename}
        quietTimeExtraction={importFlow.quietTimeExtraction}
        onDismissQuietTimeExtraction={importFlow.dismissQuietTimeExtraction}
        onUndoQuietTimeExtraction={importFlow.undoQuietTimeExtraction}
        defectDetection={importFlow.defectDetection}
        onAcceptDefectDetection={mapping => {
          setDefectMapping(mapping);
          setAnalysisMode('defect');
          importFlow.handleDismissDefect();
        }}
        onDismissDefectDetection={importFlow.handleDismissDefect}
        wideFormatDetection={importFlow.wideFormatDetection}
        onAcceptWideFormatDetection={(columns, label) => {
          setMeasureColumns(columns);
          setMeasureLabel(label);
          setSelectedMeasure(null);
          setAnalysisMode('performance');
          importFlow.handleDismissWideFormat();
        }}
        onDismissWideFormatDetection={importFlow.handleDismissWideFormat}
      />
    </div>
  );
}

function AppAnalyzeView({ props }: { props: AppViewSwitchProps }): React.ReactElement {
  const {
    canvasViewportHubId,
    columnAliases,
    drillPath,
    factors,
    filteredData,
    handlePromoteFindingAction,
    handleRestoreFinding,
    investigation,
    outcome,
    resolved,
    wallPlanningProps,
    workspaceProjectContext,
    workspaceProjectScope,
  } = props;
  return (
    <AnalyzeView
      workspaceProjectScope={workspaceProjectScope}
      canvasViewportHubId={normalizeProcessHubId(canvasViewportHubId)}
      filteredData={filteredData ?? []}
      outcome={outcome}
      factors={factors}
      handleRestoreFinding={handleRestoreFinding}
      handleSetFindingStatus={investigation.handleSetFindingStatus}
      onPromoteFindingAction={
        workspaceProjectContext.workspaceProject ? handlePromoteFindingAction : undefined
      }
      drillPath={drillPath}
      columnAliases={columnAliases}
      resolvedMode={resolved}
      planningProps={wallPlanningProps}
    />
  );
}

function AppProjectsView({ props }: { props: AppViewSwitchProps }): React.ReactElement {
  const {
    controlHandoff,
    controlRecord,
    findings,
    hypotheses,
    panels,
    projectsClosureInputs,
    selectedOrActiveProjectId,
    sessionHub,
    workspaceProjectContext,
  } = props;
  const projectsControlRecord = controlRecord;
  const projectsControlHandoff = controlHandoff;
  return (
    <ProjectsTabView
      activeHub={sessionHub ?? undefined}
      selectedProjectId={selectedOrActiveProjectId}
      onSelectProject={id => {
        if (id === '') {
          panels.showProjects();
          return;
        }
        workspaceProjectContext.setWorkspaceProject(id);
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
        ideas: hypotheses.flatMap((h: { ideas?: unknown[] }) => h.ideas ?? []),
        actions: findings.flatMap((f: { actions?: unknown[] }) => f.actions ?? []),
      }}
      onOpenCauseWorkbench={_cause => {
        // V1: jump to Improve tab (legacy PDCA workbench).
        // Plan 2 will add Workspace Project scoping so the workbench filters
        // to this cause's hypothesis automatically.
        panels.showImprovement();
      }}
      controlRecord={projectsControlRecord}
      controlHandoff={projectsControlHandoff}
      closureInputs={projectsClosureInputs}
      onOpenLegacyControl={() =>
        usePanelsStore.getState().showControl(projectsControlRecord?.projectId ?? undefined)
      }
      onNudgeProcessOwner={() => {
        // Plan 3 will emit EngagementEvent webhook here.
        console.info('[handoff] Nudge process owner — Plan 3 will wire EngagementEvent');
      }}
      onStartNewProject={panels.showCharter}
    />
  );
}

function AppReportView({ props }: { props: AppViewSwitchProps }): React.ReactElement {
  const {
    analysisMode,
    columnAliases,
    dataFilename,
    defectSummaryProps,
    filteredData,
    findings,
    hypotheses,
    lensedSampleCount,
    outcome,
    panels,
    sessionHub,
    specs,
    stats,
    workspaceProjectContext,
    workspaceProjectScope,
    workspaceProjectTitle,
    _liveControlHandoffs,
    _liveControlRecords,
    _liveControlReviews,
  } = props;
  return (
    <ReportView
      onClose={panels.showExplore}
      stats={stats}
      specs={specs}
      findings={findings}
      columnAliases={columnAliases}
      dataFilename={dataFilename}
      sampleCount={lensedSampleCount}
      analysisMode={analysisMode}
      filteredData={filteredData}
      outcome={outcome}
      hub={sessionHub}
      workspaceProject={workspaceProjectContext.workspaceProject}
      hypotheses={hypotheses}
      controlRecords={_liveControlRecords}
      controlReviews={_liveControlReviews}
      controlHandoffs={_liveControlHandoffs}
      workspaceProjectScope={workspaceProjectScope}
      workspaceProjectTitle={workspaceProjectTitle}
      onOpenWorkspaceProject={
        workspaceProjectContext.workspaceProject
          ? () => panels.showProjects(workspaceProjectContext.workspaceProject!.id)
          : undefined
      }
      defectSummary={
        defectSummaryProps
          ? {
              ...defectSummaryProps,
              sampleCount: lensedSampleCount,
            }
          : null
      }
    />
  );
}

function AppExploreView({ props }: { props: AppViewSwitchProps }): React.ReactElement {
  const {
    canvasViewportHubId,
    chartFindings,
    embedFocusChart,
    embedStatsTab,
    filterNav,
    findings,
    handleAddChartObservation,
    handleExport,
    handleExportCSV,
    handleExportVrs,
    handleOpenFinding,
    handlePinFinding,
    handleTrackOutcome,
    highlightedChart,
    highlightIntensity,
    importFlow,
    isEmbedMode,
    notifyChartClicked,
    panels,
    sessionHub,
    workspaceProjectAnalyzeFactorRequest,
    workspaceProjectScope,
  } = props;
  return (
    <Dashboard
      onPointClick={panels.openDataTableAtRow}
      hideStatsInGrid={panels.isPISidebarOpen}
      onExportCSV={handleExportCSV}
      onExportVrs={handleExportVrs}
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
      requestedFactor={workspaceProjectAnalyzeFactorRequest}
      workspaceProjectScope={workspaceProjectScope}
      scopeProjectId={canvasViewportHubId != null ? String(canvasViewportHubId) : undefined}
      trackedOutcomeSpecs={sessionHub?.outcomes}
      onTrackOutcome={handleTrackOutcome}
      onOpenWall={() => {
        useCanvasViewportStore.getState().setViewMode('wall');
        panels.showAnalyze();
      }}
      findingsCallbacks={{
        onAddChartObservation: handleAddChartObservation,
        chartFindings,
        onEditFinding: useAnalyzeStore.getState().editFinding,
        onDeleteFinding: useAnalyzeStore.getState().deleteFinding,
        onOpenFinding: handleOpenFinding,
      }}
      findings={findings}
    />
  );
}
