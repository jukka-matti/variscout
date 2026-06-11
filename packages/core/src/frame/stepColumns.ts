/**
 * Resolve per-step column assignments from a Process Map.
 *
 * Centralises the "which columns belong to step X?" derivation that was
 * previously duplicated as a private helper inside AuthorL3View. Any Canvas
 * or non-Canvas consumer that needs this breakdown should import from here
 * rather than re-derive.
 *
 * Per ADR-074 amendment + ADR-081: Canvas surfaces embed owner-surface
 * computation; they must not re-derive logic that belongs in @variscout/core.
 */

import type { ProcessMap } from './types';

export interface StepColumnAssignments {
  /** Columns explicitly assigned to this step via `map.assignments[col] === stepId`. */
  assigned: string[];
  /** The step's `name` if present; null if step not found. */
  stepName: string | null;
  /**
   * The step's `ctqColumn` if present AND not already in `assigned`.
   * Returns null when the CTQ is already covered by an explicit assignment.
   */
  ctqColumn: string | null;
  /**
   * Columns linked to this step via `tributaries.stepId === stepId`
   * that are NOT already in `assigned`.
   */
  tributaryColumns: string[];
}

export interface StepFactorDecoration {
  stepId: string;
  stepName: string;
}

/**
 * Derive the column assignments for a single process step.
 *
 * @param map         The ProcessMap built in the FRAME workspace.
 * @param focalStepId The step whose columns to resolve.
 * @returns           Resolved assignments; all arrays are empty / nulls when
 *                    the step is not found or the map has no assignments.
 */
export function getStepColumnAssignments(
  map: ProcessMap,
  focalStepId: string
): StepColumnAssignments {
  const assigned = Object.entries(map.assignments ?? {})
    .filter(([, stepId]) => stepId === focalStepId)
    .map(([column]) => column);

  const assignedSet = new Set(assigned);
  const step = map.nodes.find(node => node.id === focalStepId);
  const ctqColumn =
    step?.ctqColumn !== undefined && !assignedSet.has(step.ctqColumn) ? step.ctqColumn : null;
  const tributaryColumns = map.tributaries
    .filter(tributary => tributary.stepId === focalStepId && !assignedSet.has(tributary.column))
    .map(tributary => tributary.column);

  return {
    assigned,
    stepName: step?.name ?? null,
    ctqColumn,
    tributaryColumns,
  };
}

export function buildStepFactorDecorations(
  map: ProcessMap | null | undefined
): Map<string, StepFactorDecoration> {
  const decorations = new Map<string, StepFactorDecoration>();
  if (!map) return decorations;

  const stepNameById = new Map(map.nodes.map(node => [node.id, node.name]));
  const add = (column: string, stepId: string) => {
    const stepName = stepNameById.get(stepId);
    if (!stepName || decorations.has(column)) return;
    decorations.set(column, { stepId, stepName });
  };

  for (const [column, stepId] of Object.entries(map.assignments ?? {})) add(column, stepId);
  for (const tributary of map.tributaries) add(tributary.column, tributary.stepId);

  return decorations;
}

export function processStageColumnCandidates(map: ProcessMap | null | undefined): string[] {
  return Array.from(buildStepFactorDecorations(map).keys());
}
