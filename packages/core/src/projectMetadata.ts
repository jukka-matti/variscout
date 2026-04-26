/**
 * Project Metadata Builder
 *
 * Lightweight metadata structure that summarizes project health
 * (phase, finding counts, question counts, action progress)
 * for the Portfolio view. Pure function — no React, no storage.
 */

import type { Finding, FindingStatus, Question, QuestionStatus } from './findings';
import type { JourneyPhase, ProcessContext } from './ai/types';
import type { HubReviewSignal } from './processReviewSignal';
import {
  investigationStatusFromJourneyPhase,
  normalizeProcessHubId,
  type InvestigationDepth,
  type InvestigationStatus,
  type ProcessParticipantRef,
  type ProcessHubProcessMapSummary,
  type ProcessHubSurveyReadinessSummary,
} from './processHub';

export interface ProjectMetadata {
  /** High-level analysis journey phase */
  phase: JourneyPhase;
  /** Finding counts keyed by FindingStatus values */
  findingCounts: Partial<Record<FindingStatus, number>>;
  /** Question counts keyed by QuestionStatus values (root questions only) */
  questionCounts: Partial<Record<QuestionStatus, number>>;
  /** Action item progress across all findings */
  actionCounts: { total: number; completed: number; overdue: number };
  /** Number of tasks assigned to the requesting userId */
  assignedTaskCount: number;
  /** True if any task assigned to this userId is overdue */
  hasOverdueTasks: boolean;
  /**
   * Last-viewed timestamps keyed by userId (or 'local' for anonymous/PWA users).
   * Preserved from existing metadata — not modified by buildProjectMetadata.
   */
  lastViewedAt: Record<string, number>;
  /** Primary Process Hub for this investigation. Legacy projects default to General / Unassigned. */
  processHubId?: string;
  /** Lightweight depth marker for hub rollups. */
  investigationDepth?: InvestigationDepth;
  /** Investigation-level status for hub rollups. */
  investigationStatus?: InvestigationStatus;
  /** Process description snapshot for deterministic hub context assembly. */
  processDescription?: string;
  /** Customer requirement / CTS snapshot for deterministic hub context assembly. */
  customerRequirementSummary?: string;
  /** Process map shape snapshot for deterministic hub context assembly. */
  processMapSummary?: ProcessHubProcessMapSummary;
  /** Latest Survey readiness summary for hub cadence queues. */
  surveyReadiness?: ProcessHubSurveyReadinessSummary;
  /** Person accountable for the process/work-system health. */
  processOwner?: ProcessParticipantRef;
  /** Person driving the investigation day to day. */
  investigationOwner?: ProcessParticipantRef;
  /** Sponsor/accountable stakeholder for larger work. */
  sponsor?: ProcessParticipantRef;
  /** People contributing process knowledge, observations, checks, or actions. */
  contributors?: ProcessParticipantRef[];
  /** Compact Current Understanding shown on hub cards. */
  currentUnderstandingSummary?: string;
  /** Compact Problem Condition shown on hub cards. */
  problemConditionSummary?: string;
  /** Compact next move shown on hub cards. */
  nextMove?: string;
  /** Latest lightweight review signal shown on Process Hub cards. */
  reviewSignal?: HubReviewSignal;
}

/**
 * Detect the high-level journey phase from project state.
 * Mirrors useJourneyPhase logic without React.
 *
 * - frame: no data loaded yet
 * - scout: data loaded, exploring patterns (no findings yet)
 * - improve: at least one finding has corrective actions
 * - investigate: findings exist but no actions yet
 */
function detectPhase(hasData: boolean, findings: Finding[]): JourneyPhase {
  if (!hasData) return 'frame';
  const hasActions = findings.some(f => f.actions && f.actions.length > 0);
  if (hasActions) return 'improve';
  if (findings.length > 0) return 'investigate';
  return 'scout';
}

function summarizeProcessMap(
  processMap: ProcessContext['processMap'] | undefined
): ProcessHubProcessMapSummary | undefined {
  if (!processMap) return undefined;
  return {
    stepCount: processMap.nodes.length,
    tributaryCount: processMap.tributaries.length,
    ctsColumn: processMap.ctsColumn,
    subgroupAxisCount: processMap.subgroupAxes?.length ?? 0,
    hunchCount: processMap.hunches?.length ?? 0,
  };
}

/**
 * Build a ProjectMetadata snapshot from current project state.
 *
 * @param findings - All findings for the project
 * @param questions - All questions for the project
 * @param hasData - Whether the project has data loaded
 * @param userId - The requesting user's ID (UPN or 'local')
 * @param existingLastViewedAt - Existing lastViewedAt map to preserve
 */
export function buildProjectMetadata(
  findings: Finding[],
  questions: Question[],
  hasData: boolean,
  userId: string,
  existingLastViewedAt?: Record<string, number>,
  processContext?: ProcessContext | null,
  reviewSignal?: HubReviewSignal | null,
  surveyReadiness?: ProcessHubSurveyReadinessSummary | null
): ProjectMetadata {
  const now = Date.now();

  // --- Phase detection ---
  const phase = detectPhase(hasData, findings);

  // --- Finding counts by status ---
  const findingCounts: Partial<Record<FindingStatus, number>> = {};
  for (const finding of findings) {
    findingCounts[finding.status] = (findingCounts[finding.status] ?? 0) + 1;
  }

  // --- Question counts by status (root questions only) ---
  const questionCounts: Partial<Record<QuestionStatus, number>> = {};
  for (const question of questions) {
    if (question.parentId === undefined) {
      questionCounts[question.status] = (questionCounts[question.status] ?? 0) + 1;
    }
  }

  // --- Action counts across all findings ---
  let totalActions = 0;
  let completedActions = 0;
  let overdueActions = 0;

  for (const finding of findings) {
    if (!finding.actions) continue;
    for (const action of finding.actions) {
      totalActions++;
      if (action.completedAt !== undefined) {
        completedActions++;
      } else if (action.dueDate) {
        // dueDate is ISO date string (YYYY-MM-DD); compare to today
        const dueDateMs = new Date(action.dueDate).getTime();
        if (dueDateMs < now) {
          overdueActions++;
        }
      }
    }
  }

  // --- Assigned task count and overdue flag for this userId ---
  let assignedTaskCount = 0;
  let hasOverdueTasks = false;

  for (const finding of findings) {
    if (!finding.actions) continue;
    for (const action of finding.actions) {
      const isAssigned = action.assignee?.upn === userId || action.assignee?.userId === userId;
      if (!isAssigned) continue;
      assignedTaskCount++;
      if (action.completedAt === undefined && action.dueDate) {
        const dueDateMs = new Date(action.dueDate).getTime();
        if (dueDateMs < now) {
          hasOverdueTasks = true;
        }
      }
    }
  }

  // Note: Question validation tasks (validationTask field) do not carry an
  // assignee reference in the current data model, so they are not counted here.
  // When a questionAssignee field is added in a future iteration, this is
  // where per-user question task counting should be wired in.

  return {
    phase,
    findingCounts,
    questionCounts,
    actionCounts: { total: totalActions, completed: completedActions, overdue: overdueActions },
    assignedTaskCount,
    hasOverdueTasks,
    lastViewedAt: existingLastViewedAt ?? {},
    processHubId: normalizeProcessHubId(processContext?.processHubId),
    investigationDepth: processContext?.investigationDepth,
    investigationStatus:
      processContext?.investigationStatus ?? investigationStatusFromJourneyPhase(phase),
    processDescription: processContext?.description,
    customerRequirementSummary:
      processContext?.processMap?.ctsColumn ?? processContext?.measurement ?? undefined,
    processMapSummary: summarizeProcessMap(processContext?.processMap),
    surveyReadiness: surveyReadiness ?? undefined,
    processOwner: processContext?.processOwner,
    investigationOwner: processContext?.investigationOwner,
    sponsor: processContext?.sponsor,
    contributors: processContext?.contributors,
    currentUnderstandingSummary: processContext?.currentUnderstanding?.summary,
    problemConditionSummary:
      processContext?.problemCondition?.summary ??
      processContext?.currentUnderstanding?.problemCondition?.summary,
    nextMove: processContext?.nextMove,
    reviewSignal: reviewSignal ?? undefined,
  };
}
