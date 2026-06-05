import type { ProcessMap } from './frame/types';
import type { EntityBase } from './identity';
import type { HubReviewSignal } from './processReviewSignal';
import type { SpecLimits } from './types';
import type { ControlRecord } from './control';

export { isCharterReady, isControlReady } from './responsePathReadiness';
export type { WorkflowReadinessSignals } from './responsePathReadiness';

/**
 * Opaque brand type for ProcessHub identifiers.
 * Use `asProcessHubId()` to construct from a plain string, or
 * `normalizeProcessHubId()` which returns a validated `ProcessHubId`.
 */
export type ProcessHubId = string & { readonly __brand: 'ProcessHubId' };

/**
 * Construct a `ProcessHubId` from a plain string.
 * Throws on empty/blank input (loud failure per feedback_strict_assert_over_silent_migration)
 * rather than silently falling back — callers that want the fallback behaviour
 * should use `normalizeProcessHubId()` instead.
 */
export function asProcessHubId(value: string): ProcessHubId {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(
      `asProcessHubId: value must be a non-empty string, got: ${JSON.stringify(value)}`
    );
  }
  return trimmed as ProcessHubId;
}

/** Type-guard: true if `value` is a non-empty string (runtime brand check). */
export function isProcessHubId(value: unknown): value is ProcessHubId {
  return typeof value === 'string' && value.trim().length > 0;
}

export const DEFAULT_PROCESS_HUB_ID: ProcessHubId = 'general-unassigned' as ProcessHubId;
export const DEFAULT_PROCESS_HUB_NAME = 'General / Unassigned';

export interface ProcessParticipantRef {
  userId?: string;
  upn?: string;
  displayName: string;
}

export type CharacteristicType = 'nominalIsBest' | 'smallerIsBetter' | 'largerIsBetter';

export interface OutcomeSpec extends EntityBase {
  /** Typed FK back to the owning hub. Enables cascade rules to find outcomes by hub. */
  hubId: ProcessHub['id'];
  /** Column name from the dataset that quantifies delivery on the goal. */
  columnName: string;
  /** Characteristic type — drives spec input UI (nominal disables nothing; smaller-is-better disables LSL; larger-is-better disables USL). */
  characteristicType: CharacteristicType;
  /** Target value. Customer-driven; UI may suggest dataset mean for nominal-is-best as a starting point. */
  target?: number;
  /** Lower spec limit. Customer-driven (no σ-based suggestions). N/A for smaller-is-better. */
  lsl?: number;
  /** Upper spec limit. Customer-driven (no σ-based suggestions). N/A for larger-is-better. */
  usl?: number;
  /** Cpk target. Defaults to 1.33 (literature standard). */
  cpkTarget?: number;
}

export interface ProcessHub extends EntityBase {
  name: string;
  description?: string;
  processOwner?: ProcessParticipantRef;
  /** Optional last-modified timestamp (Unix ms). Present when the hub has been updated after creation. */
  updatedAt?: number;
  /**
   * Hub-level canonical Process Map. Analyze entries within this hub inherit
   * structure (nodes, tributaries, capability scopes) by version-pinning to
   * `canonicalMapVersion`. Absent for hubs that haven't promoted a canonical
   * map yet.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
   */
  canonicalProcessMap?: ProcessMap;
  /**
   * Version identifier for `canonicalProcessMap`. ISO 8601 timestamp by
   * default; semver allowed if the team adopts it. Analyze entries pin this
   * value at creation; pulling latest re-pins.
   */
  canonicalMapVersion?: string;
  /**
   * Hub-level context dimensions (e.g., `['product', 'shift']`). Combined
   * with tributary-attached `contextColumns` at lookup time; engine treats
   * both uniformly. Declaration location is UX metadata.
   */
  contextColumns?: string[];
  /** Process goal narrative (Hub-level, durable). One paragraph; 1–5 sentences typical. */
  processGoal?: string;
  /** Outcome columns and their specs. Multiple outcomes supported per Hub. */
  outcomes?: OutcomeSpec[];
  /** Discrete columns the analyst slices analysis by most often. Marked dimensions get prominent picker access. */
  primaryScopeDimensions?: string[];
  /**
   * Hub-level review signal — analyst-set defaults that cascade to every
   * Analyze entry linked to this hub. Currently the only field set by UI is
   * `capability.cpkTarget` (Hub Capability tab header editor). Other fields
   * remain reserved for future explicit hub-level signals; the rollup-derived
   * read-only signal still fills them when this is undefined.
   *
   * See `docs/05-technical/architecture/capability-target-cascade.md`.
   */
  reviewSignal?: HubReviewSignal;
  /**
   * The single Improvement Project owned by this hub (1:1 invariant per
   * decision-log 2026-05-18 / IM-0a). In-memory hydrated from the dedicated
   * `improvementProjects` Dexie table on read. Mutations flow through
   * `IMPROVEMENT_PROJECT_*` HubAction kinds (PR-RPS-5).
   *
   * Inline `import()` type avoids a top-level cycle (improvementProject/types.ts
   * imports ProcessHub).
   */
  improvementProject?: import('./improvementProject').ImprovementProject;
  /**
   * Control entities owned by this hub. In-memory hydrated lists, loaded
   * by HubRepository reads from normalized tables. Mutations flow through
   * `SUSTAINMENT_*` / `CONTROL_HANDOFF_*` HubAction kinds; persistence must
   * decompose these out of hub rows before writing.
   */
  controlRecords?: ControlRecord[];
  controlReviews?: import('./control').ControlReview[];
  controlHandoffs?: import('./control').ControlHandoff[];
}

export const DEFAULT_PROCESS_HUB: ProcessHub = {
  id: DEFAULT_PROCESS_HUB_ID,
  name: DEFAULT_PROCESS_HUB_NAME,
  createdAt: 0,
  deletedAt: null,
};

/**
 * Maps one canonical-map node onto a column in this Analyze entry's data.
 * `nodeMappings.length === 1` is the B2 shape (Analyze entry IS one step's
 * deep-dive). Length > 1 is the B1 shape (Analyze entry covers multiple
 * steps). Absent/empty is the B0 shape (unmapped Analyze entry, falls back
 * to global analyze-level specs).
 *
 * `specsOverride`, when set, is a flagged local fork — UI shows divergence
 * from canonical for the analyst.
 *
 * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 */
export interface AnalyzeNodeMapping {
  /** ID of the canonical-map node this mapping addresses. */
  nodeId: string;
  /** Column in this Analyze entry's data carrying the per-step measurement. */
  measurementColumn: string;
  /** Optional flagged local spec override (forks from canonical). */
  specsOverride?: SpecLimits;
}

/**
 * Typed per-step capability carrier — the CS-P2 contract (PO-4).
 * Replaces the dissolved per-step analyze projection in the per-step
 * capability path. Members are sourced from `ProcessContext` via the project
 * document (the `ProjectMetadata` projection); raw rows travel separately as
 * `rowsByAnalyze` maps (dead-in-prod today — CS-P2 wires the editor's live
 * `rawData` through the existing `rowsByAnalyze` input seam).
 */
export interface ProcessStepCapabilityMemberMetadata {
  /** Durable process context that owns this step's project (1:1). */
  processHubId?: string;
  /** Per-node measurement-column mappings — FULL shape incl. `specsOverride`. */
  nodeMappings?: AnalyzeNodeMapping[];
  /** ISO 8601 marker for dismissed B0 migration prompts. */
  migrationDeclinedAt?: string;
}

export interface ProcessStepCapabilityMember {
  /** The ImprovementProject id under Project⟷Hub 1:1. */
  id: string;
  name: string;
  metadata?: ProcessStepCapabilityMemberMetadata;
}

export interface ProcessStepCapabilitySource {
  hub: ProcessHub;
  members: readonly ProcessStepCapabilityMember[];
}

/**
 * Canvas-wide scope filter applied to the active Analyze entry. Populated when
 * the user clicks a Pareto bar (or adds a chip explicitly). Drives downstream
 * chart filtering across the canvas surface. Absent → no scope filter.
 *
 * Per spec §10 (three composable canvas filter states) and ADR-073 (no
 * statistical roll-up across heterogeneous units — scope filter creates
 * per-(node × context-tuple × scope) buckets, never aggregates across).
 */
export interface ScopeFilter {
  /** Column name being filtered (typically a primary scope dimension). */
  factor: string;
  /** Selected category values (single-select default; multi-select via shift-click). */
  values: ReadonlyArray<string | number>;
}

export function normalizeProcessHubId(processHubId?: string | null): ProcessHubId {
  const trimmed = processHubId?.trim();
  return trimmed && trimmed.length > 0 ? asProcessHubId(trimmed) : DEFAULT_PROCESS_HUB_ID;
}

/**
 * Returns `true` when a ProcessHub contains the minimum framing-layer fields
 * required for canvas first paint (Mode A.1 reopen path).
 *
 * Required:
 * - `processGoal` — non-empty string (the goal narrative was stated)
 * - `outcomes` — at least one OutcomeSpec with a non-empty `columnName`
 *
 * `primaryScopeDimensions` is intentionally NOT required: the analyst may have
 * skipped the sub-step (empty array is valid, absent is valid — both mean
 * "no explicit scope dimensions chosen").
 */
export function isProcessHubComplete(hub: ProcessHub): boolean {
  const hasGoal = typeof hub.processGoal === 'string' && hub.processGoal.trim().length > 0;
  const hasOutcome =
    Array.isArray(hub.outcomes) &&
    hub.outcomes.length > 0 &&
    hub.outcomes.every(o => typeof o.columnName === 'string' && o.columnName.trim().length > 0);
  return hasGoal && hasOutcome;
}
