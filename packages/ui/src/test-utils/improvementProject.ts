import { createNewIP } from '@variscout/core/improvementProject';
import type { CreateNewIPInput, ImprovementProject } from '@variscout/core/improvementProject';
import type { FormulaBinding, StepTimingBinding, TimeDecompositionBinding } from '@variscout/core';
import type { BinnedFactorBinding } from '@variscout/core/binning';

/**
 * Optional overrides accepted by `createTestIP`.
 *
 * Bridges the `createNewIP` factory (which knows about hub / title / member
 * fields) with the Canvas-Edit-mode root fields persisted onto the IP by
 * PR-CCJ-E1 T5 (`stepTimings`, `formulaBindings`, `timeDecompositionBindings`).
 * The Canvas fields are layered ON TOP of the factory output so tests can hand
 * a single, fully-shaped IP to `CanvasWorkspace` via the `workspaceProject` prop.
 *
 * IM-0b (ADR-087): `processSteps` is NOT a settable override — it is a
 * read-only projection of the canonical `ProcessMap` (`deriveProcessSteps`).
 * Seed steps via `processContext.processMap.nodes` (the CanvasWorkspace
 * `processContext` prop), not via the IP.
 */
export interface CreateTestIPOverrides extends Partial<CreateNewIPInput> {
  /** Pre-populated `IP.stepTimings`. Defaults to omitted. `stepId` references a
   *  canonical `ProcessMap` node id (ADR-087). */
  stepTimings?: StepTimingBinding[];
  /** Pre-populated `IP.formulaBindings`. Defaults to omitted. */
  formulaBindings?: FormulaBinding[];
  /** Pre-populated `IP.timeDecompositionBindings`. Defaults to omitted. */
  timeDecompositionBindings?: TimeDecompositionBinding[];
  /** Pre-populated `IP.binnedFactorBindings`. Defaults to omitted. */
  binnedFactorBindings?: BinnedFactorBinding[];
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
  const {
    stepTimings,
    formulaBindings,
    timeDecompositionBindings,
    binnedFactorBindings,
    ...factoryInput
  } = overrides;

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
    ...(stepTimings !== undefined && { stepTimings }),
    ...(formulaBindings !== undefined && { formulaBindings }),
    ...(timeDecompositionBindings !== undefined && { timeDecompositionBindings }),
    ...(binnedFactorBindings !== undefined && { binnedFactorBindings }),
  };
}
