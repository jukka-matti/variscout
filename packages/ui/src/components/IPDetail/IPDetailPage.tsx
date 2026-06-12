import React, { useMemo, useState } from 'react';
import { usePreferencesStore } from '@variscout/stores';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import IPDetailHeader from './IPDetailHeader';
import IPDetailStageTabs, { type StageName } from './IPDetailStageTabs';
import IPDetailModeToggle, { type IPDetailMode } from './IPDetailModeToggle';
import IPDetailTeamRail from './IPDetailTeamRail';
import { deriveStageState, type StageStateInputs } from './stageState';
import CharterOverview from './stages/CharterOverview';
import CharterSections from './stages/CharterSections';
import ApproachOverview from './stages/ApproachOverview';
import ApproachSections from './stages/ApproachSections';
import ControlOverview, { type ControlClosureInputs } from './stages/ControlOverview';
import ControlSections from './stages/ControlSections';
import type { CauseProjectionInputs, CauseRow } from './stages/causeProjection';
import type { ImprovementProjectFormProps } from '../ImprovementProject/ImprovementProjectForm';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { ControlRecord, ControlHandoff, ProcessHub } from '@variscout/core';
import type { ProjectOverviewSignals } from './projectOverviewSignals';

export interface IPDetailPageProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  /** Optional stage-state inputs (derived from linked ControlRecord + ControlHandoff at the caller). */
  stageStateInputs?: StageStateInputs;
  /** Current user's id — retained only for local author/provenance display. */
  currentUserId?: string;
  /** Active hub gives the rail access to Process Owner signoff context. */
  activeHub?: ProcessHub;
  /** Optional day counter passed to header. */
  dayCounter?: number;
  /** Jump-out handler — called from per-stage "Continue in" buttons. */
  onJumpOut?: (target: 'analyze' | 'explore' | 'process' | 'improve-workbench' | 'report') => void;
  /** Props for Charter Sections (Sections-mode form). */
  charterFormProps?: ImprovementProjectFormProps;
  /** Cause projection inputs for the Approach stage. */
  approachInputs?: CauseProjectionInputs;
  /** Project dossier signal counts derived by the app wrapper from already-loaded data. */
  overviewSignals?: ProjectOverviewSignals;
  /** Called when user clicks "Open in Improve workbench" on a cause. */
  onOpenCauseWorkbench?: (cause: CauseRow) => void;
  /** Linked ControlRecord. Present when status === 'closed' or beyond. */
  controlRecord?: ControlRecord;
  /** Linked ControlHandoff. Present when handoff stage is active or beyond. */
  controlHandoff?: ControlHandoff;
  /** Closure checklist inputs for ControlOverview (folded in from former Handoff stage). */
  closureInputs?: ControlClosureInputs;
  /** Per-cause in-control rows for Control Overview. */
  sustainmentPerCauseRows?: Array<{ factor: string; inControl: boolean; observation?: string }>;
  /** "Open legacy Control panel" handler. */
  onOpenLegacyControl?: () => void;
  /**
   * App-provided Control region (PR-PO-2). Rendered in the Control ("sustainment")
   * stage alongside — never replacing — ControlOverview / ControlSections.
   * Architecture: IPDetailPage lives in @variscout/ui and must not import from
   * apps, so the Azure app passes its `ProcessHubControlRegion` through this slot.
   */
  controlRegionSlot?: React.ReactNode;
  /** "Nudge owner" handler (Plan 3 wires actual notification). */
  onNudgeProcessOwner?: () => void;
  /** Activity/signoff inputs for the team rail. */
  ideas?: readonly ImprovementIdea[];
  actions?: readonly ActionItem[];
  now?: number;
  onRequestSignoff?: () => void;
  onNudgeSignoff?: () => void;
  onApproveSignoff?: () => void;
}

function defaultActiveStage(stages: ReturnType<typeof deriveStageState>): StageName {
  if (stages.sustainment === 'current') return 'sustainment';
  if (stages.approach === 'current') return 'approach';
  return 'charter';
}

const IPDetailPage: React.FC<IPDetailPageProps> = ({
  ip,
  onBackToList,
  stageStateInputs,
  currentUserId,
  activeHub,
  dayCounter,
  onJumpOut,
  charterFormProps,
  approachInputs,
  overviewSignals,
  onOpenCauseWorkbench,
  controlRecord,
  controlHandoff,
  closureInputs,
  sustainmentPerCauseRows,
  onOpenLegacyControl,
  controlRegionSlot,
  onNudgeProcessOwner: _onNudgeProcessOwner,
  ideas,
  actions,
  now,
  onRequestSignoff,
  onNudgeSignoff,
  onApproveSignoff,
}) => {
  const stages = useMemo(() => deriveStageState(ip, stageStateInputs), [ip, stageStateInputs]);
  const [activeStage, setActiveStage] = useState<StageName>(() => defaultActiveStage(stages));
  const [mode, setMode] = useState<IPDetailMode>('overview');
  const isTabletRailExpanded = usePreferencesStore(s => s.isIPTeamRailExpanded);
  const setTabletRailExpanded = usePreferencesStore(s => s.setIPTeamRailExpanded);

  const railProps = {
    ip,
    activeHub,
    ideas,
    actions,
    controlRecord,
    controlHandoff,
    now,
    onRequestSignoff,
    onNudgeSignoff,
    onApproveSignoff,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <IPDetailHeader ip={ip} onBackToList={onBackToList} dayCounter={dayCounter} />

      <div className="flex items-center justify-between border-b border-edge bg-surface px-6 py-2">
        <IPDetailStageTabs stages={stages} active={activeStage} onStageChange={setActiveStage} />
        <IPDetailModeToggle mode={mode} onModeChange={setMode} />
      </div>

      <div className="flex flex-1 min-h-0 overflow-auto">
        <main className="flex-1 p-6" data-testid={`stage-body-${activeStage}`}>
          {activeStage === 'charter' && mode === 'overview' && (
            <CharterOverview
              ip={ip}
              onOpenInvestigation={() => onJumpOut?.('analyze')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
              overviewSignals={overviewSignals}
              currentUserId={currentUserId}
            />
          )}
          {activeStage === 'charter' && mode === 'sections' && (
            <CharterSections {...(charterFormProps ?? {})} />
          )}
          {activeStage === 'approach' && mode === 'overview' && approachInputs && (
            <ApproachOverview
              ip={ip}
              causeInputs={approachInputs}
              onOpenWorkbench={cause => onOpenCauseWorkbench?.(cause)}
              onOpenWall={() => onJumpOut?.('analyze')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
              onOpenProcess={() => onJumpOut?.('process')}
              overviewSignals={overviewSignals}
            />
          )}
          {activeStage === 'approach' && mode === 'sections' && approachInputs && (
            <ApproachSections
              ip={ip}
              causeInputs={approachInputs}
              onOpenWorkbench={cause => onOpenCauseWorkbench?.(cause)}
            />
          )}
          {activeStage === 'approach' && !approachInputs && (
            <p className="text-sm text-content-secondary">
              Approach stage needs hypothesis + idea + action inputs (wired in PR-PT-4.4).
            </p>
          )}
          {activeStage === 'sustainment' && mode === 'overview' && controlRecord && (
            <ControlOverview
              record={controlRecord}
              onStartHandoff={() => setActiveStage('sustainment')}
              onOpenProcess={() => onJumpOut?.('process')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
              perCauseRows={sustainmentPerCauseRows}
              closureInputs={closureInputs}
              overviewSignals={overviewSignals}
              onNudgeOwner={_onNudgeProcessOwner}
              onOpenReport={() => onJumpOut?.('report')}
            />
          )}
          {activeStage === 'sustainment' && mode === 'sections' && controlRecord && (
            <ControlSections
              record={controlRecord}
              onOpenLegacy={() => onOpenLegacyControl?.()}
              controlHandoff={controlHandoff}
            />
          )}
          {activeStage === 'sustainment' && !controlRecord && (
            <p className="text-sm text-content-secondary">
              No Control record linked yet. Close the IP (Approach stage) to auto-create one per
              ADR-080.
            </p>
          )}
          {/* PR-PO-2: app-provided Control region (cadence-board buckets). Renders
              alongside the overview/sections content above, never replacing it. */}
          {activeStage === 'sustainment' && controlRegionSlot && (
            <div className="mt-6" data-testid="control-region-slot">
              {controlRegionSlot}
            </div>
          )}
        </main>
        <div
          className="hidden border-l border-edge bg-slate-50 md:block lg:hidden"
          data-testid="ip-detail-activity-rail-tablet"
        >
          <button
            type="button"
            className="flex h-full w-8 items-start justify-center border-r border-edge py-3 text-content-secondary hover:text-content"
            aria-label={isTabletRailExpanded ? 'Collapse activity rail' : 'Expand activity rail'}
            aria-expanded={isTabletRailExpanded}
            onClick={() => setTabletRailExpanded(!isTabletRailExpanded)}
          >
            {isTabletRailExpanded ? '›' : '‹'}
          </button>
          {isTabletRailExpanded ? (
            <div aria-hidden="false">
              <IPDetailTeamRail
                {...railProps}
                className="w-[280px] flex-shrink-0 bg-slate-50 p-4 text-xs"
              />
            </div>
          ) : null}
        </div>
        <IPDetailTeamRail {...railProps} />
      </div>
    </div>
  );
};

export default IPDetailPage;
