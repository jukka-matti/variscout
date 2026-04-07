import type {
  AnalysisMode,
  BestSubsetResult,
  ChannelResult,
  FindingProjection,
  SpecLimits,
} from '@variscout/core';
import type { YamazumiBarData } from '@variscout/core/yamazumi';
import type { ModelScope } from '@variscout/hooks';
import type { WhatIfReference } from '@variscout/hooks';

// Re-exported here for convenience in UI components
export type { ModelScope } from '@variscout/hooks';
export type { WhatIfReference } from '@variscout/hooks';

// ============================================================================
// WhatIfExplorer Props
// ============================================================================

/** Baseline process statistics */
export interface WhatIfProcessStats {
  mean: number;
  stdDev: number;
  cpk?: number;
  n?: number;
}

/** Context about the improvement idea being projected */
export interface WhatIfProjectionContext {
  /** The idea text being projected */
  ideaText: string;
  /** The question this idea is linked to */
  questionText?: string;
  /** Factor this idea targets (from the question's linked factor) */
  linkedFactor?: string;
  /** Model-derived gap for the linked factor (in outcome units) */
  linkedFactorGap?: number;
}

/** Complement stats for overall impact calculation (when filtering a subset) */
export interface WhatIfComplementStats {
  mean: number;
  stdDev: number;
  count: number;
}

/** Props for the unified WhatIfExplorer component */
export interface WhatIfExplorerProps {
  // --- Always required ---
  /** Analysis mode determines which renderer to use */
  mode: AnalysisMode;
  /** Current process statistics (baseline for projection) */
  currentStats: WhatIfProcessStats;
  /** Specification limits (USL, LSL, target) */
  specs?: SpecLimits;
  /** Called when projection values change (live, as sliders move) */
  onProjectionChange?: (projection: FindingProjection) => void;
  /** Called when analyst clicks "Save to idea" */
  onSaveProjection?: (projection: FindingProjection) => void;

  // --- Idea context (from improvement workflow) ---
  /** Context about the idea being projected */
  projectionContext?: WhatIfProjectionContext;

  // --- Model-informed mode (standard/capability with regression) ---
  /** Best subsets regression model for the active scope */
  model?: BestSubsetResult;
  /** Available model scopes (global + filtered) */
  availableScopes?: ModelScope[];
  /** Called when analyst switches model scope */
  onScopeChange?: (scope: ModelScope) => void;

  // --- Reference markers ---
  /** Reference points for benchmarking (current, best, model optimum, etc.) */
  references?: WhatIfReference[];

  // --- Yamazumi mode ---
  /** Yamazumi activity data */
  activities?: YamazumiBarData[];
  /** Takt time target */
  taktTime?: number;
  /** Best performer reference for yamazumi */
  bestReference?: { name: string; time: number };

  // --- Performance mode ---
  /** Channel results for performance mode */
  channels?: ChannelResult[];
  /** Currently selected channel */
  selectedChannel?: string;

  // --- Basic fallback (no model) ---
  /** Presets for basic mean/sigma mode */
  presets?: SimulatorPreset[];
  /** Complement stats for overall impact calculation */
  complementStats?: WhatIfComplementStats;

  /** Optional CSS class */
  className?: string;
}

// ============================================================================
// Simulator Preset (shared across modes)
// ============================================================================

/** A pre-computed preset for the What-If sliders */
export interface SimulatorPreset {
  label: string;
  description: string;
  meanShift: number;
  variationReduction: number;
  icon?: 'target' | 'x-circle' | 'star';
}

// ============================================================================
// Internal Renderer Props
// ============================================================================

/** Props for the model-informed estimation renderer */
export interface ModelInformedEstimatorProps {
  currentStats: WhatIfProcessStats;
  specs?: SpecLimits;
  model: BestSubsetResult;
  projectionContext?: WhatIfProjectionContext;
  references?: WhatIfReference[];
  onProjectionChange?: (projection: FindingProjection) => void;
  onSaveProjection?: (projection: FindingProjection) => void;
  className?: string;
}

/** Props for the basic mean/sigma estimation renderer */
export interface BasicEstimatorProps {
  currentStats: WhatIfProcessStats;
  specs?: SpecLimits;
  presets?: SimulatorPreset[];
  complementStats?: WhatIfComplementStats;
  projectionContext?: WhatIfProjectionContext;
  references?: WhatIfReference[];
  onProjectionChange?: (projection: FindingProjection) => void;
  onSaveProjection?: (projection: FindingProjection) => void;
  className?: string;
}

/** Props for the yamazumi activity reducer renderer */
export interface ActivityReducerProps {
  activities: YamazumiBarData[];
  taktTime?: number;
  bestReference?: { name: string; time: number };
  projectionContext?: WhatIfProjectionContext;
  onProjectionChange?: (projection: FindingProjection) => void;
  onSaveProjection?: (projection: FindingProjection) => void;
  className?: string;
}

/** Props for the performance channel adjuster renderer */
export interface ChannelAdjusterProps {
  currentStats: WhatIfProcessStats;
  specs?: SpecLimits;
  channels: ChannelResult[];
  selectedChannel?: string;
  projectionContext?: WhatIfProjectionContext;
  references?: WhatIfReference[];
  onProjectionChange?: (projection: FindingProjection) => void;
  onSaveProjection?: (projection: FindingProjection) => void;
  className?: string;
}
