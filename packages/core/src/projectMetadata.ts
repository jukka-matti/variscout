/**
 * Project Metadata Builder
 *
 * Lightweight metadata structure that summarizes project health
 * (phase, finding counts, question counts, action progress)
 * for the Portfolio view. Pure function — no React, no storage.
 */

import type { Finding, FindingStatus, Question, QuestionStatus } from './findings';
import type { JourneyPhase } from './ai/types';

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
  existingLastViewedAt?: Record<string, number>
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
  };
}
