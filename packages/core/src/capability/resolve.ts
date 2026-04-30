import type { SpecLimits } from '../types';

/**
 * Inputs to the Cpk-target cascade. Surfaces pass whatever levels they have
 * access to; missing levels are skipped.
 */
export interface CapabilityTargetContext {
  /** Per-column spec map, typically `projectStore.measureSpecs`. */
  measureSpecs?: Record<string, SpecLimits>;
  /** Hub-level default, typically `processHub.reviewSignal.capability.cpkTarget`. */
  hubCpkTarget?: number;
  /** Investigation-level default, typically `projectStore.cpkTarget`. */
  projectCpkTarget?: number | undefined;
}

/** Last-resort default — aligns with the literature "capable" line. */
export const DEFAULT_CPK_TARGET = 1.33;

/**
 * Resolve the effective Cpk target for a given column via cascade:
 *
 *   per-column spec → hub default → investigation default → 1.33
 *
 * Surfaces call this with the column they are grading and whatever cascade
 * inputs they have access to. Levels can be omitted when not in scope (e.g.
 * an investigation surface without a hub passes only `measureSpecs` +
 * `projectCpkTarget`).
 */
export function resolveCpkTarget(column: string, ctx: CapabilityTargetContext): number {
  const fromSpec = ctx.measureSpecs?.[column]?.cpkTarget;
  if (fromSpec !== undefined && Number.isFinite(fromSpec)) return fromSpec;
  if (ctx.hubCpkTarget !== undefined && Number.isFinite(ctx.hubCpkTarget)) return ctx.hubCpkTarget;
  if (ctx.projectCpkTarget !== undefined && Number.isFinite(ctx.projectCpkTarget))
    return ctx.projectCpkTarget;
  return DEFAULT_CPK_TARGET;
}
