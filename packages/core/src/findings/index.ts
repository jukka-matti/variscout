/**
 * Findings domain — re-exports from modular subfiles.
 *
 * Split from monolithic findings.ts (828 LOC) into:
 *   types.ts      — All type definitions, interfaces, constants
 *   factories.ts  — Object creation functions (createFinding, createQuestion, etc.)
 *   helpers.ts    — Status helpers, filter comparison, duplicate detection
 */
export * from './types';
export * from './factories';
export * from './helpers';
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
export type { CategoricalFilterInput } from './hypothesisCondition';
export {
  collectReferencedColumns,
  collectStepColumns,
  conditionHasMissingColumn,
  conditionReferencesStep,
  deriveConditionFromFindingSource,
  buildConditionFromCategoricalFilters,
  activeFiltersToCondition,
  categoricalFiltersToActiveFilters,
  formatConditionLeaves,
  predicateSetKey,
  predicateSetsEqual,
} from './hypothesisCondition';
export type { AndCheckResult } from './hypothesisConditionEvaluator';
export { evaluateCondition, runAndCheck } from './hypothesisConditionEvaluator';
export type { GatePath } from './gateNodeOps';
export { getAt, updateAt, insertHubAsAndChild, removeAt } from './gateNodeOps';
export type {
  MechanismBranchClueView,
  MechanismBranchProcessContext,
  MechanismBranchProjectionOptions,
  MechanismBranchActionStateView,
  MechanismBranchViewModel,
  BranchSignalWarning,
} from './mechanismBranch';
export { projectMechanismBranch, projectMechanismBranches } from './mechanismBranch';
// Note: DataRow is the canonical foundational type from `../types` — not re-exported
// from this sub-path to avoid a duplicate identifier at the root barrel. The evaluator
// accepts `Record<string, unknown>`-compatible rows; consumers get the canonical DataRow
// via `@variscout/core` root or `@variscout/core/types` directly.
export { computeFindingWindowDrift } from './drift';
export type { DriftResult } from './drift';
// WindowContext is already re-exported via `export * from './types'` above.
export { evidenceTypesForHypothesis, hasUnresolvedDisconfirmation } from './hypothesisEvidence';
export {
  deriveIPReportMiniChartType,
  deriveMiniChartConfig,
  type IPReportMiniChartType,
  type MiniChartConfig,
  type MiniChartKind,
  type MiniChartPlaceholderReason,
  type ColumnTypeMap,
} from './miniChart';
export type { ChartSelection } from './chartSelection';
