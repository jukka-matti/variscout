// FRAME workspace — visual Process Map, deterministic mode inference, gap detection.
// See docs/07-decisions/adr-070-frame-workspace.md

export type {
  TributaryRole,
  ProcessMapNode,
  ProcessMapTributary,
  ProcessMapHunch,
  ProcessMapLayout,
  ProcessMap,
  ColumnKind,
  ModeInferenceSpecs,
  ModeInferenceInput,
  InferredMode,
  ModeInferenceRuleId,
  ModeInferenceResult,
  GapKind,
  GapSeverity,
  Gap,
  GapDetectorInput,
} from './types';

export { inferMode } from './modeInference';
export { detectGaps } from './gapDetector';
export { subgroupAxisColumns } from './subgroupAxes';
export { createEmptyMap } from './factories';
