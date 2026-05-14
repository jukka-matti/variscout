import React, { useMemo, useState } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import IPDetailHeader from './IPDetailHeader';
import IPDetailStageTabs, { type StageName } from './IPDetailStageTabs';
import IPDetailModeToggle, { type IPDetailMode } from './IPDetailModeToggle';
import IPDetailTeamRail from './IPDetailTeamRail';
import { deriveStageState, type StageStateInputs } from './stageState';
import CharterOverview from './stages/CharterOverview';
import CharterSections from './stages/CharterSections';
import type { ImprovementProjectFormProps } from '../ImprovementProject/ImprovementProjectForm';

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
          {activeStage !== 'charter' && (
            <p className="text-sm text-content-secondary">
              {mode === 'overview' ? 'Overview' : 'Sections'} content for{' '}
              <strong>{activeStage}</strong> ships in PR-PT-
              {activeStage === 'approach' ? '4' : '5'}.
            </p>
          )}
        </main>
        <IPDetailTeamRail ip={ip} />
      </div>
    </div>
  );
};

export default IPDetailPage;
