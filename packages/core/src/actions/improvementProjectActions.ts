import type { ProcessHub } from '../processHub';
import type { ImprovementProject } from '../improvementProject';

/**
 * Hub mutations for ImprovementProject entities (PR-RPS-5).
 *
 * `IMPROVEMENT_PROJECT_UPDATE` deep-merges the patch into the existing entity:
 *   - objects shallow-merge one level: `metadata`, `goal`, `signoff`, and the
 *     four `sections` are independently shallow-merged when supplied.
 *   - nested objects inside `metadata` (`financialImpact`) and `goal` (`outcomeGoal`)
 *     also shallow-merge if both sides are present.
 *   - all arrays REPLACE wholesale: callers pass the full new value for
 *     `metadata.team[]`, `goal.factorControls[]`, `goal.mechanismGoals[]`, and
 *     all FK arrays inside `sections.*`.
 *   - `id`, `createdAt`, `hubId` are immutable (excluded from patch typing).
 *   - `updatedAt` is set to `Date.now()` by the persistence handler, not by the caller.
 *
 * Persistence handlers (apps/pwa, apps/azure) implement this contract identically.
 */
export type ImprovementProjectAction =
  | {
      kind: 'IMPROVEMENT_PROJECT_CREATE';
      hubId: ProcessHub['id'];
      project: ImprovementProject;
    }
  | {
      kind: 'IMPROVEMENT_PROJECT_UPDATE';
      projectId: ImprovementProject['id'];
      patch: Partial<Omit<ImprovementProject, 'id' | 'createdAt' | 'hubId'>>;
    }
  | {
      kind: 'IMPROVEMENT_PROJECT_ARCHIVE';
      projectId: ImprovementProject['id'];
    };
