import type { JourneyPhase } from './ai/types';
import type { EvidenceSnapshot } from './evidenceSources';
import type { FindingStatus } from './findings/types';
import type { ProcessMap } from './frame/types';
import type { EntityBase } from './identity';
import type { HubReviewSignal } from './processReviewSignal';
import type { SurveyStatus } from './survey/types';
import type { SpecLimits } from './types';
import type { ControlHandoff, ControlMetadataProjection, ControlRecord } from './control';

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

export type AnalyzeDepth = 'quick' | 'focused' | 'chartered';

export type AnalyzeStatus =
  | 'issue-captured'
  | 'framing'
  | 'scouting'
  | 'investigating'
  | 'ready-to-improve'
  | 'improving'
  | 'verifying'
  | 'resolved'
  | 'controlled';

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

export interface ProcessHubAnalyzeMetadata {
  processHubId?: string;
  analyzeDepth?: AnalyzeDepth;
  analyzeStatus?: AnalyzeStatus;
  findingCounts?: Partial<Record<FindingStatus, number>>;
  actionCounts?: { total: number; completed: number; overdue: number };
  processDescription?: string;
  customerRequirementSummary?: string;
  processMapSummary?: ProcessHubProcessMapSummary;
  surveyReadiness?: ProcessHubSurveyReadinessSummary;
  currentUnderstandingSummary?: string;
  problemConditionSummary?: string;
  nextMove?: string;
  reviewSignal?: HubReviewSignal;
  /**
   * Lightweight projection of the active ControlRecord for this Analyze entry,
   * surfaced on the hub for cadence rendering without re-querying the records list.
   * The cycle between processHub.ts and control.ts is broken by `import type`,
   * which is erased at compile time and produces no runtime dependency.
   *
   * Field name `sustainment` preserved — matches persisted ProjectMetadata
   * schema; cloud blobs already key this projection by `sustainment`.
   */
  sustainment?: ControlMetadataProjection;
  /**
   * Per-node measurement-column mappings. Drives per-(node × context-tuple)
   * capability computation. See `AnalyzeNodeMapping` above.
   */
  nodeMappings?: AnalyzeNodeMapping[];
  /**
   * ISO 8601 timestamp set when the analyst dismisses the B0 migration banner
   * for this Analyze entry. Dismissed entries remain B0; the banner
   * counts only un-dismissed unmapped entries.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
   * section "B0 migration UX".
   */
  migrationDeclinedAt?: string;
}

export interface ProcessHubAnalyze extends EntityBase {
  name: string;
  /** Unix ms timestamp of the last modification. Renamed from the legacy `modified: string` field. */
  updatedAt: number;
  metadata?: ProcessHubAnalyzeMetadata;
}

export interface ProcessHubRollup<TAnalyze extends ProcessHubAnalyze = ProcessHubAnalyze> {
  hub: ProcessHub;
  analyzes: TAnalyze[];
  activeAnalyzeCount: number;
  statusCounts: Partial<Record<AnalyzeStatus, number>>;
  depthCounts: Partial<Record<AnalyzeDepth, number>>;
  overdueActionCount: number;
  /** Unix ms timestamp of the most recently modified Analyze entry, or null if none. */
  latestActivity: number | null;
  currentUnderstandingSummary?: string;
  problemConditionSummary?: string;
  nextMove?: string;
  reviewSignal?: HubReviewSignal;
  evidenceSnapshots: EvidenceSnapshot[];
  controlRecords: ControlRecord[];
  controlHandoffs: ControlHandoff[];
}

export interface ProcessHubProcessMapSummary {
  stepCount: number;
  tributaryCount: number;
  ctsColumn?: string;
  subgroupAxisCount: number;
  hunchCount: number;
}

export interface ProcessHubSurveyReadinessSummary {
  possibilityStatus: SurveyStatus;
  powerStatus: SurveyStatus;
  trustStatus: SurveyStatus;
  recommendationCount: number;
  topRecommendations: string[];
}

const ACTIVE_STATUSES = new Set<AnalyzeStatus>([
  'issue-captured',
  'framing',
  'scouting',
  'investigating',
  'ready-to-improve',
  'improving',
  'verifying',
]);

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

export function analyzeStatusFromJourneyPhase(phase: JourneyPhase): AnalyzeStatus {
  switch (phase) {
    case 'frame':
      return 'framing';
    case 'scout':
      return 'scouting';
    case 'analyze':
      return 'investigating';
    case 'improve':
      return 'improving';
  }
}

function newestAnalyze<TAnalyze extends ProcessHubAnalyze>(
  analyzes: TAnalyze[]
): TAnalyze | undefined {
  return [...analyzes].sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

function synthesizeOrphanHub(hubId: string): ProcessHub {
  return { id: hubId, name: 'Unknown hub', createdAt: 0, deletedAt: null };
}

export function buildProcessHubRollups<TAnalyze extends ProcessHubAnalyze>(
  hubs: ProcessHub[],
  analyzes: TAnalyze[],
  options: {
    evidenceSnapshots?: EvidenceSnapshot[];
    controlRecords?: ControlRecord[];
    controlHandoffs?: ControlHandoff[];
  } = {}
): ProcessHubRollup<TAnalyze>[] {
  const hubMap = new Map<string, ProcessHub>();
  hubMap.set(DEFAULT_PROCESS_HUB_ID, DEFAULT_PROCESS_HUB);
  for (const hub of hubs) {
    hubMap.set(normalizeProcessHubId(hub.id), hub);
  }

  for (const analyze of analyzes) {
    const hubId = normalizeProcessHubId(analyze.metadata?.processHubId);
    if (!hubMap.has(hubId)) {
      hubMap.set(hubId, synthesizeOrphanHub(hubId));
    }
  }
  for (const snapshot of options.evidenceSnapshots ?? []) {
    const hubId = normalizeProcessHubId(snapshot.hubId);
    if (!hubMap.has(hubId)) {
      hubMap.set(hubId, synthesizeOrphanHub(hubId));
    }
  }

  const grouped = new Map<string, TAnalyze[]>();
  for (const analyze of analyzes) {
    const hubId = normalizeProcessHubId(analyze.metadata?.processHubId);
    grouped.set(hubId, [...(grouped.get(hubId) ?? []), analyze]);
  }

  const groupedControl = new Map<string, ControlRecord[]>();
  for (const record of options.controlRecords ?? []) {
    const hubId = normalizeProcessHubId(record.hubId);
    groupedControl.set(hubId, [...(groupedControl.get(hubId) ?? []), record]);
  }

  const groupedHandoffs = new Map<string, ControlHandoff[]>();
  for (const handoff of options.controlHandoffs ?? []) {
    const hubId = normalizeProcessHubId(handoff.hubId);
    groupedHandoffs.set(hubId, [...(groupedHandoffs.get(hubId) ?? []), handoff]);
  }

  return Array.from(hubMap.values())
    .map(hub => {
      const hubAnalyzes = [...(grouped.get(hub.id) ?? [])].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      const statusCounts: Partial<Record<AnalyzeStatus, number>> = {};
      const depthCounts: Partial<Record<AnalyzeDepth, number>> = {};
      let overdueActionCount = 0;
      let activeAnalyzeCount = 0;

      for (const analyze of hubAnalyzes) {
        const status = analyze.metadata?.analyzeStatus ?? 'scouting';
        statusCounts[status] = (statusCounts[status] ?? 0) + 1;
        if (ACTIVE_STATUSES.has(status)) activeAnalyzeCount++;

        const depth = analyze.metadata?.analyzeDepth;
        if (depth) depthCounts[depth] = (depthCounts[depth] ?? 0) + 1;

        overdueActionCount += analyze.metadata?.actionCounts?.overdue ?? 0;
      }

      const latest = newestAnalyze(hubAnalyzes);
      const summarySource = hubAnalyzes.find(
        analyze =>
          analyze.metadata?.currentUnderstandingSummary ||
          analyze.metadata?.problemConditionSummary ||
          analyze.metadata?.nextMove
      );
      const reviewSignalSource = hubAnalyzes.find(analyze => analyze.metadata?.reviewSignal);
      const evidenceSnapshots = (options.evidenceSnapshots ?? [])
        .filter(snapshot => normalizeProcessHubId(snapshot.hubId) === hub.id)
        .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
      const controlRecords = groupedControl.get(hub.id) ?? [];
      const controlHandoffs = groupedHandoffs.get(hub.id) ?? [];

      return {
        hub,
        analyzes: hubAnalyzes,
        activeAnalyzeCount,
        statusCounts,
        depthCounts,
        overdueActionCount,
        latestActivity: latest?.updatedAt ?? null,
        currentUnderstandingSummary: summarySource?.metadata?.currentUnderstandingSummary,
        problemConditionSummary: summarySource?.metadata?.problemConditionSummary,
        nextMove: summarySource?.metadata?.nextMove,
        // Hub-level reviewSignal (analyst-set) wins over Analyze-entry-derived.
        // Today only `capability.cpkTarget` is set on the hub directly; the
        // Analyze-entry-derived signal still provides the rest of the fields
        // when no hub-level signal exists.
        reviewSignal: hub.reviewSignal ?? reviewSignalSource?.metadata?.reviewSignal,
        evidenceSnapshots,
        controlRecords,
        controlHandoffs,
      };
    })
    .filter(
      rollup =>
        rollup.analyzes.length > 0 ||
        rollup.evidenceSnapshots.length > 0 ||
        rollup.hub.id !== DEFAULT_PROCESS_HUB_ID
    )
    .sort((a, b) => {
      const aTime = a.latestActivity ?? 0;
      const bTime = b.latestActivity ?? 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.hub.name.localeCompare(b.hub.name);
    });
}
