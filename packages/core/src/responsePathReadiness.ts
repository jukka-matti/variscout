/**
 * Per-path workflow-readiness helpers for the canvas drill-down's response-path
 * CTAs. These are prerequisite checks, not tier or cadence checks: the five
 * response paths are tier-active in PWA + Azure, and the tier gating that
 * applies (signoff, audit, alerts, RACI) lives inside each surface, not here.
 *
 * Vision spec: docs/superpowers/specs/2026-05-03-variscout-vision-design.md §5.3
 */

export interface WorkflowReadinessSignals {
  /** Whether this hub has at least one improvement intervention recorded. */
  hasIntervention: boolean;
  /** Whether sustainment monitoring confirms gains held. */
  sustainmentConfirmed: boolean;
  /** Apps may force readiness (bypass all prerequisite gates) for seeded showcases. */
  isDemo?: boolean;
}

/**
 * Charter is the START of a project (DMAIC Define) — there is no workflow
 * prerequisite. A paid-tier user with a brand-new ProcessHub charters on day 1.
 */
export function isCharterReady(_signals: WorkflowReadinessSignals): boolean {
  return true;
}

export function isSustainmentReady(signals: WorkflowReadinessSignals): boolean {
  return signals.isDemo === true || signals.hasIntervention;
}

export function isHandoffReady(signals: WorkflowReadinessSignals): boolean {
  return signals.isDemo === true || signals.sustainmentConfirmed;
}
