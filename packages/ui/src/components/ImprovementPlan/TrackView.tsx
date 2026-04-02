import React from 'react';
import { PlanRecap } from './PlanRecap';
import type { SelectedIdea } from './PlanRecap';
import { ActionTrackerSection } from './ActionTrackerSection';
import type { TrackedAction } from './ActionTrackerSection';
import { VerificationSection } from './VerificationSection';
import type { VerificationData } from './VerificationSection';
import { OutcomeSection } from './OutcomeSection';
import type { OutcomeValue } from './OutcomeSection';

export interface TrackViewProps {
  // PlanRecap
  selectedIdeas: SelectedIdea[];
  onEditSelection?: () => void;
  onBackToPlan?: () => void;
  // Actions
  actions: TrackedAction[];
  onToggleComplete: (actionId: string, findingId: string) => void;
  onAssign?: (actionId: string, findingId: string) => void;
  onSetDueDate?: (actionId: string, findingId: string) => void;
  onAddAction?: () => void;
  // Verification
  verification?: VerificationData;
  onAddVerificationData?: () => void;
  onViewStagedCharts?: () => void;
  // Outcome
  hasVerification: boolean;
  selectedOutcome?: OutcomeValue;
  outcomeNotes?: string;
  onOutcomeChange?: (outcome: OutcomeValue) => void;
  onOutcomeNotesChange?: (notes: string) => void;
}

export const TrackView: React.FC<TrackViewProps> = ({
  selectedIdeas,
  onEditSelection,
  onBackToPlan,
  actions,
  onToggleComplete,
  onAssign,
  onSetDueDate,
  onAddAction,
  verification,
  onAddVerificationData,
  onViewStagedCharts,
  hasVerification,
  selectedOutcome,
  outcomeNotes,
  onOutcomeChange,
  onOutcomeNotesChange,
}) => {
  return (
    <div data-testid="track-view" className="flex flex-col gap-0 overflow-y-auto pb-20 px-4 pt-3">
      {/* Back link */}
      {onBackToPlan && (
        <div className="mb-4">
          <button
            data-testid="track-view-back-btn"
            onClick={onBackToPlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 hover:bg-blue-500/15 transition-colors"
          >
            ← Back to Plan &amp; Prioritize
          </button>
        </div>
      )}

      {/* Plan recap */}
      <PlanRecap selectedIdeas={selectedIdeas} onEditSelection={onEditSelection} />

      {/* Actions */}
      <ActionTrackerSection
        actions={actions}
        onToggleComplete={onToggleComplete}
        onAssign={onAssign}
        onSetDueDate={onSetDueDate}
        onAddAction={onAddAction}
      />

      {/* Verification */}
      <div className="mt-6">
        <VerificationSection
          verification={verification}
          onAddVerificationData={onAddVerificationData}
          onViewStagedCharts={onViewStagedCharts}
        />
      </div>

      {/* Outcome */}
      <div className="mt-4">
        <OutcomeSection
          hasVerification={hasVerification}
          selectedOutcome={selectedOutcome}
          notes={outcomeNotes}
          onOutcomeChange={onOutcomeChange}
          onNotesChange={onOutcomeNotesChange}
        />
      </div>
    </div>
  );
};
