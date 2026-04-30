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
 * Which cascade level produced the resolved target. Surfaces use this to
 * render a small provenance caption next to the displayed target so users
 * can see why two columns at the same Cpk got different colors.
 */
export type CpkTargetSource = 'spec' | 'hub' | 'investigation' | 'default';

/**
 * Result of `resolveCpkTarget`. Always carries both the numeric target and
 * the cascade level it came from.
 */
export interface ResolvedCpkTarget {
  value: number;
  source: CpkTargetSource;
}

/**
 * Resolve the effective Cpk target for a given column via cascade:
 *
 *   per-column spec → hub default → investigation default → 1.33
 *
 * Surfaces call this with the column they are grading and whatever cascade
 * inputs they have access to. Levels can be omitted when not in scope (e.g.
 * an investigation surface without a hub passes only `measureSpecs` +
 * `projectCpkTarget`).
 *
 * Returns `{ value, source }`. Destructure the value when you only need the
 * number; pass `source` through `sourceLabelFor` for the provenance caption.
 */
export function resolveCpkTarget(column: string, ctx: CapabilityTargetContext): ResolvedCpkTarget {
  const fromSpec = ctx.measureSpecs?.[column]?.cpkTarget;
  if (fromSpec !== undefined && Number.isFinite(fromSpec)) {
    return { value: fromSpec, source: 'spec' };
  }
  if (ctx.hubCpkTarget !== undefined && Number.isFinite(ctx.hubCpkTarget)) {
    return { value: ctx.hubCpkTarget, source: 'hub' };
  }
  if (ctx.projectCpkTarget !== undefined && Number.isFinite(ctx.projectCpkTarget)) {
    return { value: ctx.projectCpkTarget, source: 'investigation' };
  }
  return { value: DEFAULT_CPK_TARGET, source: 'default' };
}

/**
 * Human-readable label for a Cpk-target cascade source. Rendered as a small
 * caption (e.g. "per-spec") next to the target value in chrome surfaces.
 *
 * Intentionally returns literal English strings; defer to the i18n catalog
 * in a future sweep when other capability strings are localized together.
 */
export function sourceLabelFor(source: CpkTargetSource): string {
  switch (source) {
    case 'spec':
      return 'per-spec';
    case 'hub':
      return 'hub default';
    case 'investigation':
      return 'investigation default';
    case 'default':
      return 'default';
  }
}
