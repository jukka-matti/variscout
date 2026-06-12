import React, { Suspense } from 'react';
import { lazyWithRetry } from '../../lib/chunkReload';
import { isAIAvailable } from '../../services/aiService';
import { extractHubName, type ProcessHub } from '@variscout/core';
import { generateDeterministicId } from '@variscout/core/identity';
import { createProjectActionItem } from '@variscout/core/findings';
import { useCanvasViewportStore } from '@variscout/stores';
import {
  ColumnMapping,
  GoalBanner,
  ImproveTabRoot,
  WorkspaceProjectLaunchpadCard,
} from '@variscout/ui';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { azureHubRepository } from '../../persistence';
import { EditorEmptyState } from './EditorEmptyState';
import { EditorDashboardView } from './EditorDashboardView';
import { AnalyzeWorkspace } from './AnalyzeWorkspace';
import FrameView from './FrameView';
import ImprovementProjectPanel from '../charter/ImprovementProjectPanel';
import ControlPanel from '../control/ControlPanel';
import ProjectDashboard from '../ProjectDashboard';
import ProjectsTabView from '../ProjectsTabView';
const ReportView = lazyWithRetry(() => import('../views/ReportView'));
type OutcomeSpec = NonNullable<ProcessHub['outcomes']>[number];

function buildTrackedOutcomeSpec(hubId: ProcessHub['id'], columnName: string): OutcomeSpec {
  return {
    id: generateDeterministicId(),
    hubId,
    columnName,
    characteristicType: 'nominalIsBest',
    cpkTarget: 1.33,
    createdAt: Date.now(),
    deletedAt: null,
  };
}

// The switch receives the shell's already-derived view contract. W6 keeps the
// orchestration hooks in Editor.tsx to avoid hook-order regressions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorViewSwitchProps = Record<string, any>;

export function EditorViewSwitch(props: EditorViewSwitchProps): React.ReactElement {
  const {
    activeView,
    activeHub,
    applyAction,
    categories,
    columnAliases,
    controlTargetId,
    currentUser,
    dataFilename,
    dataFlow,
    specs,
    timeColumn,
    dataQualityReport,
    factors,
    handleLoadSampleWithLanding,
    handleMappingConfirmWithCategories,
    handleSharePointFileImport,
    hasAcceptedB0ModeFraming,
    hasB0ModeProposal,
    isAnalyzeWallCanvasFirst,
    loadError,
    outcome,
    rawData,
    stageFive,
    workspaceProject,
  } = props;

  return (
    <>
      {activeView === 'sustainment' ? (
        <ControlPanel
          activeHub={activeHub}
          targetId={controlTargetId ?? undefined}
          rawData={rawData}
          timeColumn={timeColumn}
          specs={specs}
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
                (Mode A.1 reopen path, spec §5.5). ER-1: this is Process-tab canvas
                chrome only — Explore's chrome is the context line (ProcessHealthBar). */}
          {activeView === 'frame' && !isAnalyzeWallCanvasFirst ? (
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
          {activeView === 'home' ? (
            <EditorHomeView props={props} />
          ) : activeView === 'frame' ? (
            <EditorFrameView props={props} />
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
            <EditorAnalyzeView props={props} />
          ) : activeView === 'projects' ? (
            <EditorProjectsView props={props} />
          ) : activeView === 'improvement' ? (
            <ImproveTabRoot
              workspaceProject={workspaceProject}
              actions={workspaceProject?.metadata.actions ?? []}
              currentUserId={currentUser?.email}
              onGoHome={() => usePanelsStore.getState().showHome()}
              onActionAdd={({ text, parentImprovementProjectId }) =>
                applyAction({
                  kind: 'ACTION_ITEM_ADD',
                  hubId: workspaceProject?.hubId ?? '',
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
            <EditorReportView props={props} />
          ) : activeView === 'explore' ? (
            <EditorExploreView props={props} />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-content-secondary">
              Unknown workspace view.
            </div>
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
            dataFlow.setTimeExtractionConfig((prev: unknown) => ({
              ...(prev as object),
              ...config,
            }))
          }
          suggestedStack={dataFlow.suggestedStack}
          rowLimit={250000}
        />
      )}
    </>
  );
}

function EditorHomeView({ props }: { props: EditorViewSwitchProps }): React.ReactElement {
  const {
    activeHub,
    currentProjectName,
    handleDashboardAddData,
    handleDashboardNavigate,
    handleDashboardResumeAnalysis,
    handleNewHub,
    handleUpdateLastViewed,
    lastViewedAt,
    setIsCreateProjectModalOpen,
    workspaceViewModel,
  } = props;
  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      {activeHub ? (
        <div className="p-4 sm:p-6">
          <WorkspaceProjectLaunchpadCard
            projects={
              workspaceViewModel && activeHub.improvementProject?.deletedAt === null
                ? [activeHub.improvementProject]
                : []
            }
            controlRecords={activeHub.controlRecords}
            onStartNewWorkspace={() => setIsCreateProjectModalOpen(true)}
          />
        </div>
      ) : null}
      <ProjectDashboard
        projectName={currentProjectName ?? 'Untitled'}
        onNavigate={handleDashboardNavigate}
        onAddData={handleDashboardAddData}
        onResumeAnalysis={handleDashboardResumeAnalysis}
        lastViewedAt={lastViewedAt}
        onUpdateLastViewed={handleUpdateLastViewed}
        onNewHub={handleNewHub}
      />
    </div>
  );
}

function EditorFrameView({ props }: { props: EditorViewSwitchProps }): React.ReactElement {
  const {
    activeHub,
    canEditCanvas,
    commitHubChange,
    dataFlow,
    handleAcceptDefectDetection,
    handleAcceptWideFormatDetection,
    pendingMatches,
    sharedCoScoutSection,
    workspaceProjectContext,
  } = props;
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
          workspaceProject={workspaceProjectContext.workspaceProject}
          outcomeSpecs={(activeHub?.outcomes ?? []).filter(
            (o: { deletedAt: number | null }) => o.deletedAt === null
          )}
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
  );
}

function EditorAnalyzeView({ props }: { props: EditorViewSwitchProps }): React.ReactElement {
  const {
    columnAliases,
    currentUser,
    drillPath,
    findingsState,
    handleAddCommentWithAuthor,
    handleAddPhoto,
    handleAnalyzeCoScoutObjectChange,
    handleNavigateToChart,
    handleProjectIdea,
    handlePromoteFindingAction,
    handleRestoreFinding,
    handleSetFindingStatus,
    handleShareFinding,
    handleViewStateChange,
    hypothesesState,
    ideaImpacts,
    sharedCoScoutSection,
    viewState,
    wallPlanningProps,
    wallWorkspaceProjectContributors,
    workspaceProject,
    workspaceProjectContext,
    workspaceProjectScope,
  } = props;
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <AnalyzeWorkspace
        workspaceProjectScope={workspaceProjectScope}
        scopeProjectId={workspaceProjectContext.workspaceProject?.id ?? 'general-unassigned'}
        findingsState={findingsState}
        handleRestoreFinding={handleRestoreFinding}
        handleSetFindingStatus={handleSetFindingStatus}
        handleNavigateToChart={handleNavigateToChart}
        handleShareFinding={handleShareFinding}
        onPromoteFindingAction={workspaceProject ? handlePromoteFindingAction : undefined}
        drillPath={drillPath}
        handleAddCommentWithAuthor={handleAddCommentWithAuthor}
        handleAddPhoto={handleAddPhoto}
        userId={currentUser?.email ?? null}
        members={wallWorkspaceProjectContributors}
        onCoScoutObjectChange={handleAnalyzeCoScoutObjectChange}
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
      {sharedCoScoutSection}
    </div>
  );
}

function EditorProjectsView({ props }: { props: EditorViewSwitchProps }): React.ReactElement {
  const {
    activeHub,
    currentUser,
    hypotheses,
    persistedFindings,
    projectsClosureInputs,
    projectsControlHandoff,
    projectsControlRecord,
    projectsControlRegionSlot,
    selectedOrActiveProjectId,
    workspaceProjectContext,
  } = props;
  return (
    <ProjectsTabView
      activeHub={activeHub ?? undefined}
      selectedProjectId={selectedOrActiveProjectId}
      onSelectProject={id => {
        if (id === '') {
          usePanelsStore.getState().showProjects();
          return;
        }
        workspaceProjectContext.setWorkspaceProject(id);
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
        ideas: hypotheses.flatMap((h: { ideas?: unknown[] }) => h.ideas ?? []),
        actions: persistedFindings.flatMap((f: { actions?: unknown[] }) => f.actions ?? []),
      }}
      onOpenCauseWorkbench={_cause => {
        // V1: jump to Improve tab (legacy PDCA workbench).
        // Plan 2 will add Workspace Project scoping so the workbench filters
        // to this cause's hypothesis automatically.
        usePanelsStore.getState().showImprovement();
      }}
      controlRecord={projectsControlRecord}
      controlHandoff={projectsControlHandoff}
      closureInputs={projectsClosureInputs}
      controlRegionSlot={projectsControlRegionSlot}
      onOpenLegacyControl={() =>
        usePanelsStore.getState().showControl(projectsControlRecord?.projectId ?? undefined)
      }
      onNudgeProcessOwner={() => {
        // Plan 3 will emit EngagementEvent webhook here.
        console.info('[handoff] Nudge process owner — Plan 3 will wire EngagementEvent');
      }}
      onProjectPatch={(projectId, patch) => {
        void azureHubRepository
          .dispatch({ kind: 'IMPROVEMENT_PROJECT_UPDATE', projectId, patch })
          .catch(error => {
            console.error('[projects] Failed to persist Improvement Project patch', error);
          });
      }}
      onNudgeSignoff={projectId => {
        console.info(
          `[projects] Nudge signoff for ${projectId} — EngagementEvent webhook boundary`
        );
      }}
      onStartNewProject={() => usePanelsStore.getState().showCharter()}
      currentUserId={currentUser?.email ?? undefined}
    />
  );
}

function EditorReportView({ props }: { props: EditorViewSwitchProps }): React.ReactElement {
  const {
    activeHub,
    aiEnabled,
    aiOrch,
    sharedCoScoutSection,
    workspaceProjectContext,
    workspaceProjectScope,
    workspaceProjectTitle,
  } = props;
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <Suspense fallback={null}>
          <ReportView
            onClose={() => usePanelsStore.getState().showExplore()}
            aiEnabled={aiEnabled && isAIAvailable()}
            narrative={aiOrch.narration.narrative}
            workspaceProjectScope={workspaceProjectScope}
            workspaceProjectTitle={workspaceProjectTitle}
            activeHub={activeHub}
            workspaceProject={workspaceProjectContext.workspaceProject}
            onOpenWorkspaceProject={
              workspaceProjectContext.workspaceProject
                ? () =>
                    usePanelsStore
                      .getState()
                      .showProjects(workspaceProjectContext.workspaceProject!.id)
                : undefined
            }
          />
        </Suspense>
      </div>
      {sharedCoScoutSection}
    </div>
  );
}

function EditorExploreView({ props }: { props: EditorViewSwitchProps }): React.ReactElement {
  const {
    activeHub,
    aiOrch,
    commitHubChange,
    controlViolations,
    dataFlow,
    excludedReasons,
    excludedRowIndices,
    filteredCategoricalValuesByColumn,
    filterNav,
    findingsCallbacksWithPrompt,
    findingsState,
    handleBinningBindingsChange,
    handleExportCSV,
    handlePinFinding,
    handleSetFindingStatus,
    handleShareChart,
    handleViewStateChange,
    improvementProjectedCpkMap,
    projectId,
    sharedCoScoutSection,
    viewState,
    workspaceProject,
    workspaceProjectAnalyzeFactorRequest,
    workspaceProjectScope,
  } = props;
  const handleTrackOutcome = (columnName: string) => {
    if (!activeHub || typeof commitHubChange !== 'function') return;
    const trimmedColumn = columnName.trim();
    if (!trimmedColumn) return;
    const liveOutcomes = (activeHub.outcomes ?? []).filter(
      (entry: OutcomeSpec) => entry.deletedAt === null
    );
    if (liveOutcomes.some((entry: OutcomeSpec) => entry.columnName === trimmedColumn)) return;
    void commitHubChange({
      ...activeHub,
      outcomes: [
        ...(activeHub.outcomes ?? []),
        buildTrackedOutcomeSpec(activeHub.id, trimmedColumn),
      ],
    });
  };
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
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
        aiOrch={aiOrch}
        handleShareChart={handleShareChart}
        onExportCSV={handleExportCSV}
        controlViolations={controlViolations}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
        projectedCpkMap={improvementProjectedCpkMap}
        workspaceProjectFactorRequest={workspaceProjectAnalyzeFactorRequest}
        workspaceProjectScope={workspaceProjectScope}
        categoricalValuesByColumn={filteredCategoricalValuesByColumn}
        binnedFactorBindings={workspaceProject?.binnedFactorBindings ?? undefined}
        onBindingsChange={workspaceProject ? handleBinningBindingsChange : undefined}
        scopeProjectId={workspaceProject?.id ?? 'general-unassigned'}
        trackedOutcomeSpecs={activeHub?.outcomes}
        onTrackOutcome={handleTrackOutcome}
        onOpenWall={() => {
          useCanvasViewportStore.getState().setViewMode('wall');
          usePanelsStore.getState().showAnalyze();
        }}
      />
      {sharedCoScoutSection}
    </div>
  );
}
