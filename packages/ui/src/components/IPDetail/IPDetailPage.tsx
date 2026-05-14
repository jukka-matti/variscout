import React, { useMemo, useState } from 'react';
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
import SustainmentOverview from './stages/SustainmentOverview';
import SustainmentSections from './stages/SustainmentSections';
import HandoffOverview, { type HandoffChecklistInputs } from './stages/HandoffOverview';
import HandoffSections from './stages/HandoffSections';
import type { CauseProjectionInputs, CauseRow } from './stages/causeProjection';
import type { ImprovementProjectFormProps } from '../ImprovementProject/ImprovementProjectForm';
import type { SustainmentRecord, ControlHandoff } from '@variscout/core';

export interface IPDetailPageProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  /** Optional stage-state inputs (derived from linked SustainmentRecord + ControlHandoff at the caller). */
  stageStateInputs?: StageStateInputs;
  /** Optional invite handler (Plan 3 wires this). */
  onInviteClick?: () => void;
  /** Optional day counter passed to header. */
  dayCounter?: number;
  /** Jump-out handler — called from per-stage "Continue in" buttons. */
  onJumpOut?: (
    target: 'investigation' | 'analyze' | 'process' | 'improve-workbench' | 'report'
  ) => void;
  /** Props for Charter Sections (Sections-mode form). */
  charterFormProps?: ImprovementProjectFormProps;
  /** Cause projection inputs for the Approach stage. */
  approachInputs?: CauseProjectionInputs;
  /** Called when user clicks "Open in Improve workbench" on a cause. */
  onOpenCauseWorkbench?: (cause: CauseRow) => void;
  /** Linked SustainmentRecord. Present when status === 'closed' or beyond. */
  sustainmentRecord?: SustainmentRecord;
  /** Linked ControlHandoff. Present when handoff stage is active or beyond. */
  controlHandoff?: ControlHandoff;
  /** Inputs for Handoff checklist (derived from controlHandoff by caller). */
  handoffInputs?: HandoffChecklistInputs;
  /** Per-cause in-control rows for Sustainment Overview. */
  sustainmentPerCauseRows?: Array<{ factor: string; inControl: boolean; observation?: string }>;
  /** "Open legacy Sustainment panel" handler. */
  onOpenLegacySustainment?: () => void;
  /** "Open legacy Handoff panel" handler. */
  onOpenLegacyHandoff?: () => void;
  /** "Nudge owner" handler (Plan 3 wires actual notification). */
  onNudgeProcessOwner?: () => void;
}

function defaultActiveStage(stages: ReturnType<typeof deriveStageState>): StageName {
  if (stages.handoff === 'current') return 'handoff';
  if (stages.sustainment === 'current') return 'sustainment';
  if (stages.approach === 'current') return 'approach';
  return 'charter';
}

const IPDetailPage: React.FC<IPDetailPageProps> = ({
  ip,
  onBackToList,
  stageStateInputs,
  onInviteClick,
  dayCounter,
  onJumpOut,
  charterFormProps,
  approachInputs,
  onOpenCauseWorkbench,
  sustainmentRecord,
  controlHandoff,
  handoffInputs,
  sustainmentPerCauseRows,
  onOpenLegacySustainment,
  onOpenLegacyHandoff,
  onNudgeProcessOwner,
}) => {
  const stages = useMemo(() => deriveStageState(ip, stageStateInputs), [ip, stageStateInputs]);
  const [activeStage, setActiveStage] = useState<StageName>(() => defaultActiveStage(stages));
  const [mode, setMode] = useState<IPDetailMode>('overview');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <IPDetailHeader
        ip={ip}
        onBackToList={onBackToList}
        onInviteClick={onInviteClick}
        dayCounter={dayCounter}
      />

      <div className="flex items-center justify-between border-b border-edge bg-surface px-6 py-2">
        <IPDetailStageTabs stages={stages} active={activeStage} onStageChange={setActiveStage} />
        <IPDetailModeToggle mode={mode} onModeChange={setMode} />
      </div>

      <div className="flex flex-1 min-h-0 overflow-auto">
        <main className="flex-1 p-6" data-testid={`stage-body-${activeStage}`}>
          {activeStage === 'charter' && mode === 'overview' && (
            <CharterOverview
              ip={ip}
              onOpenInvestigation={() => onJumpOut?.('investigation')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
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
              onOpenWall={() => onJumpOut?.('investigation')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
              onOpenProcess={() => onJumpOut?.('process')}
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
          {activeStage === 'sustainment' && mode === 'overview' && sustainmentRecord && (
            <SustainmentOverview
              record={sustainmentRecord}
              onStartHandoff={() => setActiveStage('handoff')}
              onOpenProcess={() => onJumpOut?.('process')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
              perCauseRows={sustainmentPerCauseRows}
            />
          )}
          {activeStage === 'sustainment' && mode === 'sections' && sustainmentRecord && (
            <SustainmentSections
              record={sustainmentRecord}
              onOpenLegacy={() => onOpenLegacySustainment?.()}
            />
          )}
          {activeStage === 'sustainment' && !sustainmentRecord && (
            <p className="text-sm text-content-secondary">
              No Sustainment record linked yet. Close the IP (Approach stage) to auto-create one per
              ADR-080.
            </p>
          )}

          {activeStage === 'handoff' && mode === 'overview' && handoffInputs && (
            <HandoffOverview
              inputs={handoffInputs}
              onOpenReport={() => onJumpOut?.('report')}
              onExportPdf={() => {
                /* Plan 4 wires PDF export */
              }}
              onNudgeOwner={() => onNudgeProcessOwner?.()}
            />
          )}
          {activeStage === 'handoff' && mode === 'sections' && controlHandoff && (
            <HandoffSections
              handoff={controlHandoff}
              onOpenLegacy={() => onOpenLegacyHandoff?.()}
            />
          )}
          {activeStage === 'handoff' && (!handoffInputs || !controlHandoff) && (
            <p className="text-sm text-content-secondary">
              No Handoff record linked yet. Confirm Sustainment (4 consecutive on-target ticks) to
              start Handoff.
            </p>
          )}
        </main>
        <IPDetailTeamRail ip={ip} />
      </div>
    </div>
  );
};

export default IPDetailPage;
