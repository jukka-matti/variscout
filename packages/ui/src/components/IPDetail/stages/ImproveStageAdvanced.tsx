import React, { useState } from 'react';
import type { IdeaDirection, ImprovementIdea } from '@variscout/core';
import type { BrainstormIdea } from '@variscout/core/findings';
import type { AnalysisMode } from '@variscout/core';
import { ImprovementContextPanel } from '../../ImprovementPlan/ImprovementContextPanel';
import type { CauseSummary } from '../../ImprovementPlan/ImprovementContextPanel';
import { BrainstormModal } from '../../ImprovementPlan/BrainstormModal';
import { IdeaGroupCard } from '../../ImprovementPlan/IdeaGroupCard';
import { PrioritizationMatrix } from '../../ImprovementPlan/PrioritizationMatrix';
import type {
  MatrixIdea,
  MatrixDimension,
  MatrixPreset,
} from '../../ImprovementPlan/PrioritizationMatrix';
import { WhatIfExplorer } from '../../WhatIfExplorer/WhatIfExplorer';
import type { WhatIfProcessStats } from '../../WhatIfExplorer/types';

export interface IdeaGroupEntry {
  question: {
    id: string;
    text: string;
    causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
    factor?: string;
  };
  evidence?: { rSquaredAdj?: number; etaSquared?: number };
  ideas: ImprovementIdea[];
  linkedFindingName?: string;
  brainstormIdeas?: BrainstormIdea[];
  hmwPrompts?: Record<IdeaDirection, string>;
  parkedIdeas?: Array<{ id: string; text: string; direction?: IdeaDirection }>;
}

export interface ImproveStageAdvancedProps {
  projectId: string;

  // Context panel
  causes: CauseSummary[];
  problemStatement?: string;
  synthesis?: string;
  targetCpk?: number;
  currentCpk?: number;

  // Ideas region
  ideaGroups: IdeaGroupEntry[];
  onIdeaGroupCardToggleSelect?: (questionId: string, ideaId: string, selected: boolean) => void;
  onIdeaGroupCardAddIdea?: (questionId: string, text: string) => void;
  onIdeaGroupCardOpenWhatIf?: (questionId: string, ideaId: string) => void;
  onOpenBrainstorm?: (questionId: string) => void;

  // Brainstorm modal — called when a brainstorm trigger fires for a specific cause
  onBrainstormAddIdea?: (direction: IdeaDirection, text: string) => void;
  onBrainstormEditIdea?: (ideaId: string, text: string) => void;
  onBrainstormRemoveIdea?: (ideaId: string) => void;
  onBrainstormDone?: (selectedIds: string[]) => void;

  // Prioritization matrix
  matrixIdeas: MatrixIdea[];
  matrixXAxis: MatrixDimension;
  matrixYAxis: MatrixDimension;
  matrixColorBy: MatrixDimension;
  onMatrixToggleSelect: (ideaId: string) => void;
  onMatrixAxisChange: (axis: 'x' | 'y' | 'color', value: MatrixDimension) => void;
  matrixPresets?: MatrixPreset[];
  matrixActivePreset?: string;
  onMatrixPresetChange?: (presetId: string) => void;

  // What-If explorer
  whatIfMode: AnalysisMode;
  whatIfCurrentStats: WhatIfProcessStats;
}

const DEFAULT_HMW_PROMPTS: Record<IdeaDirection, string> = {
  prevent: 'How might we prevent this?',
  detect: 'How might we detect this earlier?',
  simplify: 'How might we simplify this?',
  eliminate: 'How might we eliminate this?',
};

export function ImproveStageAdvanced({
  causes,
  problemStatement,
  synthesis,
  targetCpk,
  currentCpk,
  ideaGroups,
  onIdeaGroupCardToggleSelect,
  onIdeaGroupCardAddIdea,
  onIdeaGroupCardOpenWhatIf,
  onOpenBrainstorm,
  onBrainstormAddIdea,
  onBrainstormEditIdea,
  onBrainstormRemoveIdea,
  onBrainstormDone,
  matrixIdeas,
  matrixXAxis,
  matrixYAxis,
  matrixColorBy,
  onMatrixToggleSelect,
  onMatrixAxisChange,
  matrixPresets,
  matrixActivePreset,
  onMatrixPresetChange,
  whatIfMode,
  whatIfCurrentStats,
}: ImproveStageAdvancedProps) {
  const [brainstormOpenForQuestion, setBrainstormOpenForQuestion] = useState<string | null>(null);

  const activeBrainstormGroup = ideaGroups.find(g => g.question.id === brainstormOpenForQuestion);

  function handleOpenBrainstorm(questionId: string) {
    setBrainstormOpenForQuestion(questionId);
    onOpenBrainstorm?.(questionId);
  }

  function handleBrainstormClose() {
    setBrainstormOpenForQuestion(null);
  }

  function handleBrainstormDone(selectedIds: string[]) {
    setBrainstormOpenForQuestion(null);
    onBrainstormDone?.(selectedIds);
  }

  return (
    <section aria-label="Improve stage advanced" className="grid grid-cols-12 gap-4">
      <aside aria-label="Context" className="col-span-3 flex flex-col gap-3">
        <ImprovementContextPanel
          causes={causes}
          problemStatement={problemStatement}
          synthesis={synthesis}
          targetCpk={targetCpk}
          currentCpk={currentCpk}
        />
      </aside>

      <div aria-label="Ideas" className="col-span-6 flex flex-col gap-3">
        {ideaGroups.map(group => (
          <IdeaGroupCard
            key={group.question.id}
            question={group.question}
            evidence={group.evidence}
            ideas={group.ideas}
            linkedFindingName={group.linkedFindingName}
            parkedIdeas={group.parkedIdeas}
            onToggleSelect={onIdeaGroupCardToggleSelect}
            onAddIdea={onIdeaGroupCardAddIdea}
            onOpenWhatIf={onIdeaGroupCardOpenWhatIf}
            onOpenBrainstorm={handleOpenBrainstorm}
          />
        ))}

        {activeBrainstormGroup && (
          <BrainstormModal
            isOpen={true}
            causeName={activeBrainstormGroup.question.factor ?? activeBrainstormGroup.question.text}
            evidence={activeBrainstormGroup.evidence}
            hmwPrompts={activeBrainstormGroup.hmwPrompts ?? DEFAULT_HMW_PROMPTS}
            ideas={activeBrainstormGroup.brainstormIdeas ?? []}
            onAddIdea={onBrainstormAddIdea ?? (() => {})}
            onEditIdea={onBrainstormEditIdea ?? (() => {})}
            onRemoveIdea={onBrainstormRemoveIdea ?? (() => {})}
            onClose={handleBrainstormClose}
            onDone={handleBrainstormDone}
          />
        )}
      </div>

      <aside aria-label="Prioritization" className="col-span-3 flex flex-col gap-3">
        <PrioritizationMatrix
          ideas={matrixIdeas}
          xAxis={matrixXAxis}
          yAxis={matrixYAxis}
          colorBy={matrixColorBy}
          onToggleSelect={onMatrixToggleSelect}
          onAxisChange={onMatrixAxisChange}
          presets={matrixPresets}
          activePreset={matrixActivePreset}
          onPresetChange={onMatrixPresetChange}
        />

        <section aria-label="What-If">
          <WhatIfExplorer mode={whatIfMode} currentStats={whatIfCurrentStats} />
        </section>
      </aside>
    </section>
  );
}
