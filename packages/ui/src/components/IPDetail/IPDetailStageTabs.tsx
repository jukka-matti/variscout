import React from 'react';
import type { StageStateMap, StageState } from './stageState';

export type StageName = 'charter' | 'approach' | 'sustainment' | 'handoff';

interface IPDetailStageTabsProps {
  stages: StageStateMap;
  active: StageName;
  onStageChange: (stage: StageName) => void;
}

const ICON: Record<StageState, string> = {
  done: '✓',
  current: '',
  'not-started': '○',
  locked: '⏸',
};

const LABEL: Record<StageName, string> = {
  charter: 'Charter',
  approach: 'Approach',
  sustainment: 'Sustainment',
  handoff: 'Handoff',
};

const STAGE_ORDER: StageName[] = ['charter', 'approach', 'sustainment', 'handoff'];

function stageClass(state: StageState, isActive: boolean): string {
  if (isActive) return 'border-b-2 border-[var(--vs-accent)] text-[var(--vs-accent)] font-semibold';
  if (state === 'done') return 'text-content-secondary border-b-2 border-transparent';
  if (state === 'locked')
    return 'text-content-tertiary cursor-not-allowed border-b-2 border-transparent';
  return 'text-content-secondary border-b-2 border-transparent';
}

const IPDetailStageTabs: React.FC<IPDetailStageTabsProps> = ({ stages, active, onStageChange }) => {
  return (
    <div className="flex gap-0" role="tablist" aria-label="IP lifecycle stages">
      {STAGE_ORDER.map(stage => {
        const state = stages[stage];
        const isActive = active === stage;
        const isLocked = state === 'locked';
        const icon = ICON[state];

        return (
          <button
            key={stage}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={`stage-tab-${stage}`}
            disabled={isLocked}
            onClick={() => !isLocked && onStageChange(stage)}
            className={`px-4 py-2 text-sm transition-colors ${stageClass(state, isActive)}`}
          >
            {icon ? <span className="mr-1">{icon}</span> : null}
            {LABEL[stage]}
          </button>
        );
      })}
    </div>
  );
};

export default IPDetailStageTabs;
