/**
 * IM-3 auto-link engine (core-pure) — re-ingest → match needed columns to plans →
 * link + progress + flag. PLANS ONLY (LOCKED #1). REPLACE flags, never deletes.
 *
 * Per-app reactive hooks (Azure + PWA) execute the actions this module returns.
 */
export { matchColumnsToPlans, columnsReferencedByPlan } from './matcher';
export type { PlanColumnMatch } from './matcher';
export { computeReingestAutoLink } from './engine';
export type {
  AutoLinkMinters,
  ComputeReingestAutoLinkArgs,
  ComputeReingestAutoLinkResult,
} from './engine';
export { computeMissingColumnFlags } from './reEvaluate';
export type { MissingColumnFlags } from './reEvaluate';
export { mintAutoLinkFindingId } from './mintFindingId';
