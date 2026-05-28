import { createNewIP } from '@variscout/core/improvementProject';
import type {
  CreateNewIPInput,
  ImprovementProject,
  ProcessStepEntry,
} from '@variscout/core/improvementProject';
import type { FormulaBinding, StepTimingBinding, TimeDecompositionBinding } from '@variscout/core';

/**
 * Optional overrides accepted by `createTestIP`.
 *
 * Bridges the `createNewIP` factory (which knows about hub / title / member
 * fields) with the Canvas-Edit-mode root fields persisted onto the IP by
 * PR-CCJ-E1 T5 (`processSteps`, `stepTimings`, `formulaBindings`,
 * `timeDecompositionBindings`). The Canvas fields are layered ON TOP of the
 * factory output so tests can hand a single, fully-shaped IP to
 * `CanvasWorkspace` via the `activeIP` prop.
 */
export interface CreateTestIPOverrides extends Partial<CreateNewIPInput> {
  /** Pre-populated `IP.processSteps`. Defaults to omitted (undefined). */
  processSteps?: ProcessStepEntry[];
  /** Pre-populated `IP.stepTimings`. Defaults to omitted. */
  stepTimings?: StepTimingBinding[];
  /** Pre-populated `IP.formulaBindings`. Defaults to omitted. */
  formulaBindings?: FormulaBinding[];
  /** Pre-populated `IP.timeDecompositionBindings`. Defaults to omitted. */
  timeDecompositionBindings?: TimeDecompositionBinding[];
}

/**
 * Build a fully-shaped `ImprovementProject` for tests.
 *
 * Defaults mirror `createNewIP` (Lead member; `status: 'active'`; empty
 * sections) but use deterministic ids + timestamps so snapshot-style
 * assertions stay stable. Canvas-Edit-mode fields are left undefined unless
 * the caller passes them, matching the bootstrap shape an IP starts with.
 */
export function createTestIP(overrides: CreateTestIPOverrides = {}): ImprovementProject {
  const { processSteps, stepTimings, formulaBindings, timeDecompositionBindings, ...factoryInput } =
    overrides;

  const base = createNewIP({
    hubId: factoryInput.hubId ?? 'test-hub-1',
    title: factoryInput.title ?? 'Test IP',
    currentUserId: factoryInput.currentUserId ?? 'tester@example.com',
    currentUserDisplayName: factoryInput.currentUserDisplayName ?? 'Tester',
    now: factoryInput.now ?? (() => 1_700_000_000_000),
    id: factoryInput.id ?? 'test-ip-1',
    issueStatement: factoryInput.issueStatement,
    status: factoryInput.status,
  });

  return {
    ...base,
    ...(processSteps !== undefined && { processSteps }),
    ...(stepTimings !== undefined && { stepTimings }),
    ...(formulaBindings !== undefined && { formulaBindings }),
    ...(timeDecompositionBindings !== undefined && { timeDecompositionBindings }),
  };
}
