/**
 * Findings domain — re-exports from modular subfiles.
 *
 * Split from monolithic findings.ts (828 LOC) into:
 *   types.ts      — All type definitions, interfaces, constants
 *   factories.ts  — Object creation functions (createFinding, createQuestion, etc.)
 *   helpers.ts    — Status helpers, filter comparison, duplicate detection
 *   migration.ts  — Schema migration functions
 */
export * from './types';
export * from './factories';
export * from './helpers';
export * from './migration';
export { QUESTION_STATUS_COLORS } from './questionStatus';
export { buildProblemStatement } from './problemStatement';
export type { ProblemStatementInput } from './problemStatement';
export { assignCauseColors } from './causeColors';
export { generateHMWPrompts } from './hmwPrompts';
export type { BrainstormIdea } from './hmwPrompts';
export type {
  ComparisonOp,
  ConditionLeaf,
  ConditionAndOr,
  ConditionNot,
  ConditionBranch,
  HypothesisCondition,
  FindingSourceColumnHints,
} from './hypothesisCondition';
export {
  collectReferencedColumns,
  conditionHasMissingColumn,
  deriveConditionFromFindingSource,
} from './hypothesisCondition';
export type { AndCheckResult } from './hypothesisConditionEvaluator';
export { evaluateCondition, runAndCheck } from './hypothesisConditionEvaluator';
export type { GatePath } from './gateNodeOps';
export { getAt, updateAt, insertHubAsAndChild, removeAt } from './gateNodeOps';
// Note: DataRow is the canonical foundational type from `../types` — not re-exported
// from this sub-path to avoid a duplicate identifier at the root barrel. The evaluator
// accepts `Record<string, unknown>`-compatible rows; consumers get the canonical DataRow
// via `@variscout/core` root or `@variscout/core/types` directly.
