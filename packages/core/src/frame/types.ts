/**
 * FRAME workspace — data model for the river-styled SIPOC Process Map.
 *
 * See:
 *   docs/07-decisions/adr-070-frame-workspace.md
 *   docs/superpowers/specs/2026-04-18-frame-process-map-design.md
 *
 * The Process Map is the pre-investigation bookend to the delivered Evidence
 * Map (ADR-066). It captures the process structure the user is investigating,
 * seeds mode inference, and surfaces data gaps as a measurement plan.
 */

import type { SpecRule } from '../types';

/** Role classification for a tributary (a little x feeding a process step). */
export type TributaryRole =
  | 'machine'
  | 'shift'
  | 'lot'
  | 'batch'
  | 'operator'
  | 'supplier'
  | 'environment'
  | 'material'
  | 'time'
  | 'other';

/** One process step on the SIPOC spine. Ordered left→right by `order`. */
export interface ProcessMapNode {
  id: string;
  /** Display name of the step (e.g. "Mix", "Fill", "Seal"). */
  name: string;
  /** 0-based left→right order. Monotonic. */
  order: number;
  /** Optional column measured at this step (a CTQ — Critical-to-Quality). */
  ctqColumn?: string;
  /**
   * Per-step capability scope. When set, enables the production-line-glance
   * dashboard to compute Cp/Cpk for this step using `ctqColumn` and looking
   * up specs from `specRules` by the row's context tuple.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
   */
  capabilityScope?: {
    /** Sparse SpecRule list. Most-specific match wins. */
    specRules: SpecRule[];
  };
}

/** A tributary — an x (factor) branching into a process step. */
export interface ProcessMapTributary {
  id: string;
  /** The step this tributary feeds into. */
  stepId: string;
  /** Source column in the dataset (the "x"). */
  column: string;
  /** Friendly label (defaults to column name if omitted). */
  label?: string;
  /** Role classification (informational; used for UX affordances, not math). */
  role?: TributaryRole;
  /**
   * Input-attached context dimensions. Columns in the dataset that describe
   * properties of THIS tributary's input (e.g., `['steel_supplier']` on a
   * Steel tributary, `['paint_class']` on a Paint tributary). Engine treats
   * these uniformly with hub-level context columns at SpecRule lookup time;
   * declaration here is UX metadata so filter chips group sensibly.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
   */
  contextColumns?: string[];
}

/** A pre-data hunch pinned to a step or tributary, lifted later to a SuspectedCause. */
export interface ProcessMapHunch {
  id: string;
  /** Human-readable hunch (e.g. "Nozzle wear on night shift"). */
  text: string;
  /** Pin to a specific tributary when the hunch is about one x. */
  tributaryId?: string;
  /** Pin to a specific step when the hunch is about the step itself. */
  stepId?: string;
}

/** Optional render hints; never affects logic. V2 may introduce auto-layout. */
export interface ProcessMapLayout {
  /** Canvas pixel width hint (for persistence across reloads). */
  width?: number;
  /** Canvas pixel height hint. */
  height?: number;
}

/**
 * The user's Process Map for the current investigation.
 *
 * Persisted as `ProcessContext.processMap`. Null by default; populated as the
 * user builds the map in the FRAME workspace. All consumers must handle
 * `undefined` gracefully (a mapless project is valid — older projects and
 * users who skip FRAME).
 */
export interface ProcessMap {
  /** Schema version. Incremented on breaking changes; V2+ may introduce within-step subgroups. */
  version: 1;
  /** Process steps on the SIPOC spine, in `order`. */
  nodes: ProcessMapNode[];
  /** Tributaries (xs) branching into each step. */
  tributaries: ProcessMapTributary[];
  /** The customer-felt outcome column — maps to the ocean at the right. */
  ctsColumn?: string;
  /**
   * Tributary IDs the user has nominated as the rational-subgroup axis.
   * Consumers (e.g. SubgroupConfigPopover) resolve these to column names via `tributaries`.
   */
  subgroupAxes?: string[];
  /** Pre-data hunches. Drafted here; promoted to SuspectedCause hubs in Investigation. */
  hunches?: ProcessMapHunch[];
  /** Optional layout hints. */
  layout?: ProcessMapLayout;
  /** ISO 8601 created-at timestamp. */
  createdAt: string;
  /** ISO 8601 updated-at timestamp. */
  updatedAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Mode inference — deterministic successor to keyword-heuristic mode guessing.
// ────────────────────────────────────────────────────────────────────────────

/** Column type tags matching what the existing detector emits. */
export type ColumnKind = 'numeric' | 'categorical' | 'date' | 'text';

/** Minimal spec limits needed for capability-mode eligibility. */
export interface ModeInferenceSpecs {
  lsl?: number;
  usl?: number;
  target?: number;
}

/** Input bundle for `inferMode()`. All fields optional to allow partial states. */
export interface ModeInferenceInput {
  /** The map the user has built in FRAME (if any). Drives capability eligibility. */
  processMap?: ProcessMap;
  /** All column names present in the dataset. */
  columns?: string[];
  /** Type tags per column (from `detectColumns`). */
  columnKinds?: Record<string, ColumnKind>;
  /** Declared outcome column, if any. */
  outcomeColumn?: string;
  /** Spec limits for the outcome, if set. */
  specs?: ModeInferenceSpecs;
  /** Yamazumi column mapping, if yamazumi was previously detected. */
  yamazumiMapping?: {
    activityTypeColumn?: string;
    cycleTimeColumn?: string;
    stepColumn?: string;
  };
  /** Defect column mapping, if defect was previously detected. */
  defectMapping?: {
    defectTypeColumn?: string;
    countColumn?: string;
    resultColumn?: string;
    dataShape?: 'event-log' | 'pre-aggregated' | 'pass-fail';
  };
  /** Channel columns detected by the wide-form detector (for Performance mode). */
  performanceChannels?: string[];
}

/** Resolved mode — matches `analysisStrategy.ts` `ResolvedMode` (kept in sync by design). */
export type InferredMode = 'standard' | 'capability' | 'yamazumi' | 'performance' | 'defect';

/** Rule identifiers. Stable strings safe to expose in telemetry / tests. */
export type ModeInferenceRuleId =
  | 'yamazumi.tripletPresent'
  | 'defect.typeAndCount'
  | 'defect.passFail'
  | 'performance.threeOrMoreChannels'
  | 'capability.outcomeSpecsAndSubgroups'
  | 'standard.fallback';

/** Result from `inferMode()`. */
export interface ModeInferenceResult {
  mode: InferredMode;
  /** Human-readable one-line explanation suitable for UI surfacing. */
  reason: string;
  /** Rule IDs that fired (in priority order; first wins). */
  rulesSatisfied: ModeInferenceRuleId[];
}

// ────────────────────────────────────────────────────────────────────────────
// Gap detection — what the map wants vs what the data has.
// ────────────────────────────────────────────────────────────────────────────

export type GapKind =
  | 'missing-cts'
  | 'missing-ctq-at-step'
  | 'missing-spec-limits'
  | 'missing-subgroup-axis'
  | 'missing-time-axis'
  | 'step-without-tributaries';

export type GapSeverity = 'required' | 'recommended';

export interface Gap {
  kind: GapKind;
  severity: GapSeverity;
  /** Short UI-facing message, e.g. "No CTQ set on step 2 (Fill)". */
  message: string;
  /** Which step this gap refers to, when applicable. */
  stepId?: string;
}

export interface GapDetectorInput {
  processMap?: ProcessMap;
  /** All column names present in the dataset. */
  columns?: string[];
  /** Type tags per column. */
  columnKinds?: Record<string, ColumnKind>;
  /** Declared outcome column, if any. Surrogate for CTS when the map ctsColumn is absent. */
  outcomeColumn?: string;
  /** Declared time column, if any (used for I-chart ordering). */
  timeColumn?: string;
  /** Spec limits on the outcome/CTS. */
  specs?: ModeInferenceSpecs;
}
