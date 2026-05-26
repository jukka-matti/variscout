import type { ProcessHub } from '../processHub';
import type { ImprovementProject } from '../improvementProject';

/**
 * Hub mutations for ImprovementProject entities (PR-RPS-5).
 *
 * `IMPROVEMENT_PROJECT_UPDATE` deep-merges the patch into the existing entity:
 *   - objects shallow-merge one level: `metadata`, `goal`, `signoff`, and the
 *     four `sections` are independently shallow-merged when supplied.
 *   - nested object `metadata.financialImpact` also shallow-merges if both
 *     sides are present.
 *   - all arrays REPLACE wholesale: callers pass the full new value for
 *     `metadata.members[]`, `goal.outcomeGoals[]`, `goal.factorControls[]`,
 *     `goal.mechanismGoals[]`, and all FK arrays inside `sections.*`.
 *   - `id`, `createdAt`, `hubId` are immutable (excluded from patch typing).
 *   - `updatedAt` is set to `Date.now()` by the persistence handler, not by the caller.
 *   - `deletedAt` is managed exclusively by `IMPROVEMENT_PROJECT_ARCHIVE`; supplying it
 *     via UPDATE would create an unsupervised soft-delete path.
 *   - for `sections`: the four section keys shallow-merge independently when supplied
 *     (if patch.sections is present, missing sub-section keys are preserved from existing;
 *     only supplied sub-section keys are shallow-merged).
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
      patch: Partial<
        Omit<
          ImprovementProject,
          'id' | 'createdAt' | 'hubId' | 'updatedAt' | 'deletedAt' | 'sections'
        >
      > & {
        sections?: Partial<ImprovementProject['sections']>;
      };
    }
  | {
      kind: 'IMPROVEMENT_PROJECT_ARCHIVE';
      projectId: ImprovementProject['id'];
    };
