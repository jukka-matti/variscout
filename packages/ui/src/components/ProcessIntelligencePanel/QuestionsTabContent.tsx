import React from 'react';
import { useInvestigationStore, useProjectStore } from '@variscout/stores';
import { useAnalysisStats, useHubComputations, useImprovementProjections } from '@variscout/hooks';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { Question } from '@variscout/core/findings';
import { resolveCpkTarget } from '@variscout/core/capability';
import QuestionsTabView from './QuestionsTabView';

export interface QuestionsTabContentProps {
  /**
   * Pre-computed best subsets — from useQuestionGeneration in the caller.
   * Required for hub evidence/projection computations.
   */
  bestSubsets: BestSubsetsResult | null;
  /**
   * Per-question projected Cpk map — from useQuestionGeneration in the caller.
   * Keys are question IDs.
   */
  projectedCpkMap: Record<string, number>;
  /** Phase badge text (e.g. "INVESTIGATE") — from useJourneyPhase in the caller */
  phaseBadge?: string;
  /** Called when a question row is clicked */
  onQuestionClick?: (question: Question) => void;
  /** Called when a new question is added via the "Add question" button */
  onAddQuestion?: (text: string) => void;
  /** Called when a new observation is added */
  onAddObservation?: (text: string) => void;
  /** Called when an observation is linked to a question */
  onLinkObservation?: (findingId: string, questionId: string) => void;
  /**
   * Factor name to scroll-to and highlight — typically comes from an
   * Evidence Map node click via panelsStore.highlightedFactor in the app.
   * Passed as prop because panelsStore lives in the azure app, not @variscout/stores.
   */
  highlightedFactor?: string | null;
  /**
   * Called after the 2-second highlight animation fades.
   * Typically calls panelsStore.getState().setHighlightedFactor(null) in the app.
   */
  onClearHighlight?: () => void;
  /**
   * Navigate to the Investigation workspace.
   * Typically calls panelsStore.getState().showInvestigation() in the app.
   */
  onNavigateToInvestigation?: () => void;
}

/**
 * QuestionsTabContent — store-aware content for the "Questions" tab in the PI Panel.
 *
 * Reads from stores:
 * - questions, findings, suspectedCauses from useInvestigationStore
 * - processContext (issueStatement/currentUnderstanding), cpkTarget from useProjectStore
 * - currentCpk via useAnalysisStats()
 *
 * Computes hub evidences/projections via useHubComputations (shared hook from Task 1).
 * Computes improvement projections via useImprovementProjections (shared hook from Task 3).
 *
 * Accepts props that cannot come from stores:
 * - bestSubsets, projectedCpkMap — from caller's useQuestionGeneration
 * - phaseBadge — from caller's useJourneyPhase
 * - callbacks — app-specific navigation/actions
 * - highlightedFactor, onClearHighlight — from panelsStore in the app
 */
const QuestionsTabContent: React.FC<QuestionsTabContentProps> = ({
  bestSubsets,
  projectedCpkMap,
  phaseBadge,
  onQuestionClick,
  onAddQuestion,
  onAddObservation,
  onLinkObservation,
  highlightedFactor,
  onClearHighlight,
  onNavigateToInvestigation,
}) => {
  // Store reads
  const questions = useInvestigationStore(s => s.questions);
  const findings = useInvestigationStore(s => s.findings);
  const hubs = useInvestigationStore(s => s.suspectedCauses);
  const processContext = useProjectStore(s => s.processContext);
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const outcome = useProjectStore(s => s.outcome);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });

  // Extract issue statement from process context
  const issueStatement = processContext?.issueStatement;
  const currentUnderstanding = processContext?.currentUnderstanding;

  // Current process Cpk from stats hook
  const { stats } = useAnalysisStats();
  const currentCpk = stats?.cpk ?? undefined;

  // Hub evidence and projection computations (shared hook, Task 1)
  const { hubEvidences, hubProjections } = useHubComputations(bestSubsets, questions);

  // Improvement projections (shared hook, Task 3)
  const { suspectedCauses, combinedProjectedCpk } = useImprovementProjections(
    questions,
    projectedCpkMap
  );

  // Inline note action — calls store directly
  const handleAddNote = (findingId: string, text: string): void => {
    useInvestigationStore.getState().addFindingComment(findingId, text);
  };

  return (
    <QuestionsTabView
      questions={questions}
      findings={findings}
      issueStatement={issueStatement}
      currentUnderstanding={currentUnderstanding}
      currentCpk={currentCpk}
      targetCpk={cpkTarget}
      phaseBadge={phaseBadge}
      suspectedCauses={suspectedCauses}
      combinedProjectedCpk={combinedProjectedCpk}
      projectedCpkMap={projectedCpkMap}
      hubs={hubs.length > 0 ? hubs : undefined}
      hubEvidences={hubEvidences}
      hubProjections={hubProjections}
      onQuestionClick={onQuestionClick}
      onAddNote={handleAddNote}
      onAddQuestion={onAddQuestion}
      onAddObservation={onAddObservation}
      onLinkObservation={onLinkObservation}
      onNavigateToInvestigation={onNavigateToInvestigation}
      highlightedFactor={highlightedFactor}
      onClearHighlight={onClearHighlight}
    />
  );
};

export default QuestionsTabContent;
