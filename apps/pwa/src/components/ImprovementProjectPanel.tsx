import React from 'react';
import { ImprovementProjectForm } from '@variscout/ui';
import { useImprovementProjectPanelModel } from '@variscout/hooks';
import type { ProcessHub } from '@variscout/core';
import type {
  ImprovementProjectFactorControl,
  ImprovementProjectMechanismGoal,
} from '@variscout/core/improvementProject';
import { pwaHubRepository } from '../persistence';

interface ImprovementProjectPanelProps {
  activeHub?: ProcessHub;
  onBack: () => void;
  onOpenWall?: () => void;
}

const buttonClassName =
  'rounded-md border border-edge bg-surface px-3 py-2 text-left text-sm font-medium text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';

const ImprovementProjectPanel: React.FC<ImprovementProjectPanelProps> = ({
  activeHub,
  onBack,
  onOpenWall,
}) => {
  const {
    projects,
    selectedProject,
    outcomes,
    hypotheses,
    findings,
    error,
    heading,
    selectProject,
    updateSelectedProject,
    handleLineageNavigate,
  } = useImprovementProjectPanelModel({
    activeHub,
    repository: pwaHubRepository,
    onOpenWall,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-surface-primary p-4 text-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Project</h2>
          <p className="text-sm text-content-secondary">{heading}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Back to FRAME
        </button>
      </div>

      {!activeHub ? (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Create or select a Process Hub before opening a Project.
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm">
          {error}
        </p>
      ) : projects.length > 1 && !selectedProject ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-content">Choose a Project</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {projects.map(project => (
              <button
                key={project.id}
                type="button"
                className={buttonClassName}
                onClick={() => selectProject(project)}
              >
                {project.metadata.title}
              </button>
            ))}
          </div>
        </div>
      ) : selectedProject ? (
        <ImprovementProjectForm
          metadataProps={{
            ...selectedProject.metadata,
            onTitleChange: title => updateSelectedProject({ metadata: { title } }),
            onMembersChange: members => updateSelectedProject({ metadata: { members } }),
            onBusinessCaseChange: businessCase =>
              updateSelectedProject({ metadata: { businessCase } }),
            onFinancialImpactChange: financialImpact =>
              updateSelectedProject({ metadata: { financialImpact } }),
            onProjectIdChange: projectId => updateSelectedProject({ metadata: { projectId } }),
          }}
          goalProps={{
            // Legacy first-outcome edit shape — GoalSection edits one outcome at a time;
            // multi-outcome editor is later phases (Spec 2 §3.2.2 / PR-CCJ-C1).
            outcomeGoal: selectedProject.goal.outcomeGoals[0],
            freeText: selectedProject.goal.freeText,
            factorControls: selectedProject.goal.factorControls,
            mechanismGoals: selectedProject.goal.mechanismGoals,
            outcomeOptions: outcomes.map(outcome => ({
              id: outcome.id,
              label: outcome.columnName,
              target: outcome.target,
            })),
            onOutcomeGoalChange: outcomeGoalPatch => {
              const existing = selectedProject.goal.outcomeGoals[0] ?? {
                outcomeSpecId: '',
                target: 0,
              };
              // Rebuild the list, replacing the first outcome.
              const merged = { ...existing, ...outcomeGoalPatch };
              const nextGoals = [merged, ...selectedProject.goal.outcomeGoals.slice(1)];
              updateSelectedProject({ goal: { outcomeGoals: nextGoals } });
            },
            onFreeTextChange: freeText => updateSelectedProject({ goal: { freeText } }),
            onFactorControlsChange: factorControls =>
              updateSelectedProject({
                goal: { factorControls: factorControls as ImprovementProjectFactorControl[] },
              }),
            onMechanismGoalsChange: mechanismGoals =>
              updateSelectedProject({
                goal: { mechanismGoals: mechanismGoals as ImprovementProjectMechanismGoal[] },
              }),
          }}
          backgroundProps={{
            manualNarrative: selectedProject.sections.background.manualNarrative,
            onManualNarrativeChange: manualNarrative =>
              updateSelectedProject({ sections: { background: { manualNarrative } } }),
          }}
          lineageProps={{
            hypotheses,
            findings,
            onNavigate: handleLineageNavigate,
          }}
          approachProps={{
            narrative: selectedProject.sections.approach.narrative,
            onNarrativeChange: narrative =>
              updateSelectedProject({ sections: { approach: { narrative } } }),
          }}
        />
      ) : (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Creating Project draft...
        </p>
      )}
    </div>
  );
};

export default ImprovementProjectPanel;
