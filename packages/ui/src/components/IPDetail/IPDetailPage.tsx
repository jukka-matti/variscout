import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePreferencesStore } from '@variscout/stores';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProjectMember, ProjectRole } from '@variscout/core/projectMembership';
import { canAccess } from '@variscout/core/projectMembership';
import { generateDeterministicId } from '@variscout/core';
import { reduceProjectMembers, type MembershipAction } from '@variscout/core/actions';
import IPDetailHeader from './IPDetailHeader';
import IPDetailStageTabs, { type StageName } from './IPDetailStageTabs';
import NoAccessRedirect from './NoAccessRedirect';
import IPDetailModeToggle, { type IPDetailMode } from './IPDetailModeToggle';
import IPDetailTeamRail, { teamMemberKey, type RaciAssignment } from './IPDetailTeamRail';
import IPDetailInviteModal from './IPDetailInviteModal';
import { deriveStageState, type StageStateInputs } from './stageState';
import CharterOverview from './stages/CharterOverview';
import CharterSections from './stages/CharterSections';
import ApproachOverview from './stages/ApproachOverview';
import ApproachSections from './stages/ApproachSections';
import SustainmentOverview, { type SustainmentClosureInputs } from './stages/SustainmentOverview';
import SustainmentSections from './stages/SustainmentSections';
import type { CauseProjectionInputs, CauseRow } from './stages/causeProjection';
import type { ImprovementProjectFormProps } from '../ImprovementProject/ImprovementProjectForm';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { SustainmentRecord, ControlHandoff, ProcessHub } from '@variscout/core';

export interface IPDetailPageProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  /** Optional stage-state inputs (derived from linked SustainmentRecord + ControlHandoff at the caller). */
  stageStateInputs?: StageStateInputs;
  /** Optional invite handler (Plan 3 wires this). */
  onInviteClick?: () => void;
  /** Emits the full updated team roster when shared UI appends an invite. */
  onTeamChange?: (team: NonNullable<ImprovementProject['metadata']['team']>) => void;
  /** Current user's id — used by Charter team section for remove-button gating. */
  currentUserId?: string;
  /** Emits the updated wedge members[] roster after add/remove. Caller dispatches IMPROVEMENT_PROJECT_UPDATE. */
  onMembersChange?: (members: ProjectMember[]) => void;
  /** Active hub gives the rail access to Process Owner signoff context. */
  activeHub?: ProcessHub;
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
  /** Closure checklist inputs for SustainmentOverview (folded in from former Handoff stage). */
  closureInputs?: SustainmentClosureInputs;
  /** Per-cause in-control rows for Sustainment Overview. */
  sustainmentPerCauseRows?: Array<{ factor: string; inControl: boolean; observation?: string }>;
  /** "Open legacy Sustainment panel" handler. */
  onOpenLegacySustainment?: () => void;
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
  onInviteClick,
  onTeamChange,
  currentUserId,
  onMembersChange,
  activeHub,
  dayCounter,
  onJumpOut,
  charterFormProps,
  approachInputs,
  onOpenCauseWorkbench,
  sustainmentRecord,
  controlHandoff,
  closureInputs,
  sustainmentPerCauseRows,
  onOpenLegacySustainment,
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [mobileTeamOpen, setMobileTeamOpen] = useState(false);
  const [raciOverrides, setRaciOverrides] = useState<Record<string, RaciAssignment>>({});
  const isTabletRailExpanded = usePreferencesStore(s => s.isIPTeamRailExpanded);
  const setTabletRailExpanded = usePreferencesStore(s => s.setIPTeamRailExpanded);
  const team = ip.metadata.team ?? [];
  const members = ip.metadata.members ?? [];

  // ACL guard: only apply when we have an identified user AND an explicit members list.
  // If currentUserId is absent OR members[] is empty/absent → backward-compatible open access.
  const hasIdentity = currentUserId !== undefined && members.length > 0;
  const isExplicitlyExcluded = hasIdentity && !canAccess(currentUserId, members, 'view-report');
  const isSponsor =
    hasIdentity &&
    canAccess(currentUserId, members, 'view-report') &&
    !canAccess(currentUserId, members, 'edit-charter');

  const handleInviteClick = () => {
    onInviteClick?.();
    if (onTeamChange) setInviteOpen(true);
  };

  const handleMemberInvite = (data: { email: string; role: ProjectRole }) => {
    if (!onMembersChange) return;
    const inviteTime = Date.now();
    const newMember: ProjectMember = {
      id: generateDeterministicId(),
      createdAt: inviteTime,
      deletedAt: null,
      userId: data.email,
      displayName: data.email.split('@')[0],
      role: data.role,
      invitedAt: inviteTime,
    };
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_ADD',
      projectId: ip.id,
      member: newMember,
    };
    onMembersChange(reduceProjectMembers(members, action));
  };

  const handleMemberRemove = (memberId: string) => {
    if (!onMembersChange) return;
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_REMOVE',
      projectId: ip.id,
      memberId,
    };
    onMembersChange(reduceProjectMembers(members, action));
  };

  const railProps = {
    ip,
    raciOverrides,
    activeHub,
    ideas,
    actions,
    sustainmentRecord,
    controlHandoff,
    now,
    onRequestSignoff,
    onNudgeSignoff,
    onApproveSignoff,
  };

  // Non-member: show access denial instead of the project detail.
  if (isExplicitlyExcluded) {
    return <NoAccessRedirect projectTitle={ip.metadata.title ?? '(untitled)'} />;
  }

  // Sponsor: render the header only + a Report placeholder. Stage tabs are hidden per spec §4.
  if (isSponsor) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <IPDetailHeader
          ip={ip}
          onBackToList={onBackToList}
          onInviteClick={handleInviteClick}
          onOpenTeamWorkspace={() => setMobileTeamOpen(true)}
          dayCounter={dayCounter}
        />
        <div
          className="flex-1 p-8 text-content"
          data-testid="sponsor-report-panel"
          role="region"
          aria-label="Report"
        >
          <h2 className="text-xl font-semibold mb-2">Report</h2>
          <p className="text-sm text-content-secondary">
            As a Sponsor, you have read-only access to this project&apos;s Report. The full Report
            tab is available in the top navigation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <IPDetailHeader
        ip={ip}
        onBackToList={onBackToList}
        onInviteClick={handleInviteClick}
        onOpenTeamWorkspace={() => setMobileTeamOpen(true)}
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
              currentUserId={currentUserId}
              onInvite={onMembersChange ? handleMemberInvite : undefined}
              onMemberRemove={onMembersChange ? handleMemberRemove : undefined}
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
              onStartHandoff={() => setActiveStage('sustainment')}
              onOpenProcess={() => onJumpOut?.('process')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
              perCauseRows={sustainmentPerCauseRows}
              closureInputs={closureInputs}
              onNudgeOwner={_onNudgeProcessOwner}
              onOpenReport={() => onJumpOut?.('report')}
            />
          )}
          {activeStage === 'sustainment' && mode === 'sections' && sustainmentRecord && (
            <SustainmentSections
              record={sustainmentRecord}
              onOpenLegacy={() => onOpenLegacySustainment?.()}
              controlHandoff={controlHandoff}
            />
          )}
          {activeStage === 'sustainment' && !sustainmentRecord && (
            <p className="text-sm text-content-secondary">
              No Sustainment record linked yet. Close the IP (Approach stage) to auto-create one per
              ADR-080.
            </p>
          )}
        </main>
        <div
          className="hidden border-l border-edge bg-slate-50 md:block lg:hidden"
          data-testid="ip-detail-team-rail-tablet"
        >
          <button
            type="button"
            className="flex h-full w-8 items-start justify-center border-r border-edge py-3 text-content-secondary hover:text-content"
            aria-label={isTabletRailExpanded ? 'Collapse team rail' : 'Expand team rail'}
            aria-expanded={isTabletRailExpanded}
            onClick={() => setTabletRailExpanded(!isTabletRailExpanded)}
          >
            {isTabletRailExpanded ? (
              <ChevronRight size={16} aria-hidden="true" />
            ) : (
              <ChevronLeft size={16} aria-hidden="true" />
            )}
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
      {mobileTeamOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/30 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Team workspace"
        >
          <div className="max-h-[85vh] w-full overflow-auto rounded-t-lg bg-slate-50 shadow-xl">
            <div className="flex items-center justify-between border-b border-edge bg-surface px-4 py-3">
              <h2 className="text-sm font-semibold text-content">Team workspace</h2>
              <button
                type="button"
                className="text-xs text-content-secondary hover:text-content"
                onClick={() => setMobileTeamOpen(false)}
              >
                Close team workspace
              </button>
            </div>
            <IPDetailTeamRail {...railProps} className="block w-full bg-slate-50 p-4 text-xs" />
          </div>
        </div>
      ) : null}
      {inviteOpen && onTeamChange ? (
        <IPDetailInviteModal
          onClose={() => setInviteOpen(false)}
          onSubmit={member => {
            const { raci } = member;
            if (raci) setRaciOverrides(current => ({ ...current, [teamMemberKey(member)]: raci }));
            onTeamChange([...team, member]);
            setInviteOpen(false);
          }}
        />
      ) : null}
    </div>
  );
};

export default IPDetailPage;
