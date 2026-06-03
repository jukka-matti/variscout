/**
 * IM-3 auto-link engine (core-pure) — re-ingest → match needed columns to plans →
 * emit pending-match descriptors. PLANS ONLY (LOCKED #1). REPLACE flags, never deletes.
 *
 * Per-app reactive hooks (Azure + PWA) surface the descriptors to the analyst and
 * execute confirmed writes (Tasks 2/5/6).
 */
export { matchColumnsToPlans, columnsReferencedByPlan } from './matcher';
export type { PlanColumnMatch } from './matcher';
export { computeReingestAutoLink } from './engine';
export type {
  ComputeReingestAutoLinkArgs,
  ComputeReingestAutoLinkResult,
  ReingestPendingMatch,
} from './engine';
export { computeMissingColumnFlags } from './reEvaluate';
export type { MissingColumnFlags } from './reEvaluate';
export { mintAutoLinkFindingId } from './mintFindingId';
