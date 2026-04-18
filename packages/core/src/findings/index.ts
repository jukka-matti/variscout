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
  ConditionBranch,
  HypothesisCondition,
  FindingSourceColumnHints,
} from './hypothesisCondition';
export { deriveConditionFromFindingSource } from './hypothesisCondition';
