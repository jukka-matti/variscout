import type { JourneyPhase } from './ai/types';
import type { EvidenceLatestSignal, EvidenceSnapshot } from './evidenceSources';
import type { FindingStatus, QuestionStatus } from './findings/types';
import type { ProcessMap } from './frame/types';
import type { EntityBase } from './identity';
import { buildReviewItem } from './processHubReview';
import { buildCurrentProcessState } from './processState';
import type {
  ProcessStateItem,
  ProcessStateLens,
  ProcessStateResponsePath,
  ProcessStateSeverity,
} from './processState';
import type { HubReviewSignal } from './processReviewSignal';
import type { ProcessStateNote } from './processStateNote';
import type { SurveyStatus } from './survey/types';
import type { TimelineWindow } from './timeline';
import type { SpecLimits } from './types';
import {
  isControlDue,
  isControlOverdue,
  selectControlBuckets,
  selectControlReviews,
  type ControlHandoff,
  type ControlMetadataProjection,
  type ControlRecord,
  type ControlVerdict,
} from './control';

export { buildReviewItem } from './processHubReview';
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
  questionCounts?: Partial<Record<QuestionStatus, number>>;
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
   * Team notes attached to current-state items. Persisted per-Analyze-entry
   * via the existing Blob-Storage round-trip on project metadata.
   * Re-rendered by Dashboard on mount via the rollup.
   */
  stateNotes?: ProcessStateNote[];
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
   * Pinned version of the hub's canonicalProcessMap at Analyze-entry
   * creation. Used by `pull-latest` to detect drift. Absent for legacy
   * entries or hubs without canonical maps.
   */
  canonicalMapVersion?: string;
  /**
   * Per-node measurement-column mappings. Drives per-(node × context-tuple)
   * capability computation. See `AnalyzeNodeMapping` above.
   */
  nodeMappings?: AnalyzeNodeMapping[];
  /**
   * Optional timeline window applied to this Analyze entry's data when
   * computing findings/charts. Co-located with nodeMappings per Decision #1
   * (see docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md).
   * Absent → callers should use the mode's default window (typically `cumulative`).
   */
  timelineWindow?: TimelineWindow;
  /**
   * ISO 8601 timestamp set when the analyst dismisses the B0 migration banner
   * for this Analyze entry. Dismissed entries remain B0; the banner
   * counts only un-dismissed unmapped entries.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
   * section "B0 migration UX".
   */
  migrationDeclinedAt?: string;
  /**
   * Per-Analyze-entry scope filter — set by Pareto bar click or chip add.
   * See spec §10 + ADR-073. Composable with `timelineWindow`. Absent → no scope filter.
   */
  scopeFilter?: ScopeFilter;
  /**
   * Per-Analyze-entry Pareto group-by column. Default = first primary scope dimension
   * from the Hub config. Absent → caller picks default at render time.
   */
  paretoGroupBy?: string;
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

export type ProcessHubAttentionReason =
  | 'change-signals'
  | 'capability-gap'
  | 'top-focus'
  | 'verification'
  | 'overdue-actions'
  | 'next-move'
  | 'control'
  | 'control-due';

export type ProcessHubReadinessReason =
  | 'missing-metadata'
  | 'missing-process-hub'
  | 'missing-process-context'
  | 'missing-customer-requirement'
  | 'survey-gap'
  | 'verification-gap'
  | 'control-candidate';

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

export interface ProcessHubReviewItem<TAnalyze extends ProcessHubAnalyze = ProcessHubAnalyze> {
  analyze: TAnalyze;
  reasons: ProcessHubAttentionReason[];
  changeSignalCount: number;
  cpkGap?: number;
  topFocusVariationPct?: number;
  overdueActionCount: number;
  nextMove?: string;
  readinessReasons: ProcessHubReadinessReason[];
}

export interface ProcessHubReview<TAnalyze extends ProcessHubAnalyze = ProcessHubAnalyze> {
  hub: ProcessHub;
  activeAnalyzeCount: number;
  /** Unix ms timestamp of the most recently modified Analyze entry, or null if none. */
  latestActivity: number | null;
  depthQueues: Record<AnalyzeDepth, ProcessHubReviewItem<TAnalyze>[]>;
  whereToFocus: ProcessHubReviewItem<TAnalyze>[];
  verificationQueue: ProcessHubReviewItem<TAnalyze>[];
  overdueActionQueue: ProcessHubReviewItem<TAnalyze>[];
  nextMoveQueue: ProcessHubReviewItem<TAnalyze>[];
  controlQueue: ProcessHubReviewItem<TAnalyze>[];
  readinessQueue: ProcessHubReviewItem<TAnalyze>[];
}

export interface ProcessHubCadenceSnapshot {
  active: number;
  readiness: number;
  verification: number;
  overdueActions: number;
  control: number;
  /** Count of records reviewed within the last `recentReviewWindowDays` (default 14). Undefined when 0. */
  controlReviewed?: number;
  latestSignals: number;
  latestEvidenceSignals?: number;
  nextMoves: number;
}

export interface ProcessHubCadenceQueue<TAnalyze extends ProcessHubAnalyze = ProcessHubAnalyze> {
  totalCount: number;
  hiddenCount: number;
  items: ProcessHubReviewItem<TAnalyze>[];
}

export interface ProcessHubCadenceSummary<TAnalyze extends ProcessHubAnalyze = ProcessHubAnalyze> {
  hub: ProcessHub;
  activeAnalyzeCount: number;
  /** Unix ms timestamp of the most recently modified Analyze entry, or null if none. */
  latestActivity: number | null;
  snapshot: ProcessHubCadenceSnapshot;
  latestSignals: ProcessHubCadenceQueue<TAnalyze>;
  latestEvidenceSignals: {
    totalCount: number;
    hiddenCount: number;
    items: EvidenceLatestSignal[];
  };
  readiness: ProcessHubCadenceQueue<TAnalyze>;
  verification: ProcessHubCadenceQueue<TAnalyze>;
  actions: ProcessHubCadenceQueue<TAnalyze>;
  control: ProcessHubCadenceQueue<TAnalyze>;
  nextMoves: ProcessHubCadenceQueue<TAnalyze>;
  activeWork: Record<AnalyzeDepth, ProcessHubCadenceQueue<TAnalyze>>;
}

export interface ProcessHubContextAnalyze {
  id: string;
  name: string;
  /** Unix ms timestamp of the last modification. */
  updatedAt: number;
  status: AnalyzeStatus;
  depth?: AnalyzeDepth;
  currentUnderstandingSummary?: string;
  problemConditionSummary?: string;
  nextMove?: string;
}

export interface ProcessHubMetricContext {
  name: string;
  sourceAnalyzeId: string;
  rowCount: number;
  latestTimeValue?: string | number | boolean;
  cpk?: number;
  cpkTarget?: number;
}

export interface ProcessHubVariationConcentration {
  factor: string;
  value?: string | number | boolean;
  variationPct: number;
  sourceAnalyzeId: string;
}

export interface ProcessHubContextContract {
  schemaVersion: 1;
  hub: Pick<ProcessHub, 'id' | 'name' | 'description' | 'processOwner'>;
  process: {
    description?: string;
    customerRequirement?: string;
    map?: ProcessHubProcessMapSummary;
  };
  analyzes: ProcessHubContextAnalyze[];
  metrics: ProcessHubMetricContext[];
  variationConcentrations: ProcessHubVariationConcentration[];
  evidenceSignals: EvidenceLatestSignal[];
  questions: {
    open: number;
    answered: number;
    ruledOut: number;
    evidenceGaps: number;
  };
  findings: {
    total: number;
    confirmed: number;
  };
  actions: {
    total: number;
    completed: number;
    overdue: number;
  };
  verification: {
    waiting: number;
  };
  control: {
    candidates: number;
    due: number;
    overdue: number;
    verdicts: Partial<Record<ControlVerdict, number>>;
  };
  currentState: {
    overallSeverity: ProcessStateSeverity;
    itemCount: number;
    lensCounts: Record<ProcessStateLens, number>;
    responsePathCounts: Partial<Record<ProcessStateResponsePath, number>>;
    topItems: Array<
      Pick<
        ProcessStateItem,
        'id' | 'lens' | 'severity' | 'responsePath' | 'source' | 'label' | 'count' | 'metric'
      >
    >;
  };
  readinessReasons: ProcessHubReadinessReason[];
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

const INVESTIGATION_DEPTHS: AnalyzeDepth[] = ['quick', 'focused', 'chartered'];

const CADENCE_QUEUE_LIMIT = 4;

const SUSTAINMENT_STATUSES = new Set<AnalyzeStatus>(['resolved', 'controlled']);

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

function modifiedTime(analyze: ProcessHubAnalyze): number {
  return Number.isFinite(analyze.updatedAt) ? analyze.updatedAt : 0;
}

function cpkGap(signal?: HubReviewSignal): number | undefined {
  const cpk = signal?.capability?.cpk;
  const target = signal?.capability?.cpkTarget;
  if (cpk === undefined || target === undefined) return undefined;
  const gap = target - cpk;
  return gap > 0 ? Math.round(gap * 100) / 100 : undefined;
}

function compareFocusItems<TAnalyze extends ProcessHubAnalyze>(
  a: ProcessHubReviewItem<TAnalyze>,
  b: ProcessHubReviewItem<TAnalyze>
): number {
  return (
    b.changeSignalCount - a.changeSignalCount ||
    (b.cpkGap ?? 0) - (a.cpkGap ?? 0) ||
    (b.topFocusVariationPct ?? 0) - (a.topFocusVariationPct ?? 0) ||
    modifiedTime(b.analyze) - modifiedTime(a.analyze)
  );
}

function compareNewest<TAnalyze extends ProcessHubAnalyze>(
  a: ProcessHubReviewItem<TAnalyze>,
  b: ProcessHubReviewItem<TAnalyze>
): number {
  return modifiedTime(b.analyze) - modifiedTime(a.analyze);
}

function compareOverdue<TAnalyze extends ProcessHubAnalyze>(
  a: ProcessHubReviewItem<TAnalyze>,
  b: ProcessHubReviewItem<TAnalyze>
): number {
  return b.overdueActionCount - a.overdueActionCount || compareNewest(a, b);
}

function focusReasons(signal: HubReviewSignal): ProcessHubAttentionReason[] {
  const reasons: ProcessHubAttentionReason[] = [];
  if (signal.changeSignals.total > 0) reasons.push('change-signals');
  if (cpkGap(signal) !== undefined) reasons.push('capability-gap');
  if (signal.topFocus?.variationPct !== undefined && signal.topFocus.variationPct > 0) {
    reasons.push('top-focus');
  }
  return reasons;
}

function hasSurveyGap(summary?: ProcessHubSurveyReadinessSummary): boolean {
  if (!summary) return false;
  return (
    summary.recommendationCount > 0 ||
    summary.possibilityStatus !== 'can-do-now' ||
    summary.powerStatus !== 'can-do-now' ||
    summary.trustStatus !== 'can-do-now'
  );
}

function readinessReasons<TAnalyze extends ProcessHubAnalyze>(
  analyze: TAnalyze
): ProcessHubReadinessReason[] {
  const reasons: ProcessHubReadinessReason[] = [];
  const metadata = analyze.metadata;
  const status = metadata?.analyzeStatus ?? 'scouting';

  if (!metadata) reasons.push('missing-metadata');
  if (normalizeProcessHubId(metadata?.processHubId) === DEFAULT_PROCESS_HUB_ID) {
    reasons.push('missing-process-hub');
  }
  if (!metadata?.processDescription) reasons.push('missing-process-context');
  if (!metadata?.customerRequirementSummary && !metadata?.processMapSummary?.ctsColumn) {
    reasons.push('missing-customer-requirement');
  }
  if (hasSurveyGap(metadata?.surveyReadiness)) reasons.push('survey-gap');
  if (status === 'verifying') reasons.push('verification-gap');
  if (SUSTAINMENT_STATUSES.has(status)) reasons.push('control-candidate');

  return reasons;
}

const READINESS_REASON_ORDER: ProcessHubReadinessReason[] = [
  'missing-metadata',
  'missing-process-hub',
  'missing-process-context',
  'missing-customer-requirement',
  'survey-gap',
  'verification-gap',
  'control-candidate',
];

function uniqueReadinessReasons(reasons: ProcessHubReadinessReason[]): ProcessHubReadinessReason[] {
  return READINESS_REASON_ORDER.filter(reason => reasons.includes(reason));
}

export function buildProcessHubReview<TAnalyze extends ProcessHubAnalyze>(
  rollup: ProcessHubRollup<TAnalyze>
): ProcessHubReview<TAnalyze> {
  const depthQueues: Record<AnalyzeDepth, ProcessHubReviewItem<TAnalyze>[]> = {
    quick: [],
    focused: [],
    chartered: [],
  };

  for (const analyze of rollup.analyzes) {
    const status = analyze.metadata?.analyzeStatus ?? 'scouting';
    if (!ACTIVE_STATUSES.has(status)) continue;

    const depth = analyze.metadata?.analyzeDepth ?? 'quick';
    depthQueues[depth].push(buildReviewItem(analyze, []));
  }

  for (const depth of INVESTIGATION_DEPTHS) {
    depthQueues[depth].sort(compareNewest);
  }

  const whereToFocus = rollup.analyzes
    .filter(analyze => analyze.metadata?.reviewSignal)
    .map(analyze => buildReviewItem(analyze, focusReasons(analyze.metadata!.reviewSignal!)))
    .sort(compareFocusItems);

  const verificationQueue = rollup.analyzes
    .filter(analyze => analyze.metadata?.analyzeStatus === 'verifying')
    .map(analyze => buildReviewItem(analyze, ['verification']))
    .sort(compareNewest);

  const overdueActionQueue = rollup.analyzes
    .filter(analyze => (analyze.metadata?.actionCounts?.overdue ?? 0) > 0)
    .map(analyze => buildReviewItem(analyze, ['overdue-actions']))
    .sort(compareOverdue);

  const nextMoveQueue = rollup.analyzes
    .filter(
      analyze =>
        ACTIVE_STATUSES.has(analyze.metadata?.analyzeStatus ?? 'scouting') &&
        analyze.metadata?.nextMove
    )
    .map(analyze => buildReviewItem(analyze, ['next-move']))
    .sort(compareNewest);

  const controlQueue = rollup.analyzes
    .filter(analyze => SUSTAINMENT_STATUSES.has(analyze.metadata?.analyzeStatus ?? 'scouting'))
    .map(analyze => buildReviewItem(analyze, ['control']))
    .sort(compareNewest);

  const readinessQueue = rollup.analyzes
    .map(analyze => ({
      analyze,
      reasons: readinessReasons(analyze),
    }))
    .filter(item => item.reasons.length > 0)
    .map(item => buildReviewItem(item.analyze, [], item.reasons))
    .sort(compareNewest);

  return {
    hub: rollup.hub,
    activeAnalyzeCount: rollup.activeAnalyzeCount,
    latestActivity: rollup.latestActivity,
    depthQueues,
    whereToFocus,
    verificationQueue,
    overdueActionQueue,
    nextMoveQueue,
    controlQueue,
    readinessQueue,
  };
}

function cadenceQueue<TAnalyze extends ProcessHubAnalyze>(
  items: ProcessHubReviewItem<TAnalyze>[]
): ProcessHubCadenceQueue<TAnalyze> {
  return {
    totalCount: items.length,
    hiddenCount: Math.max(0, items.length - CADENCE_QUEUE_LIMIT),
    items: items.slice(0, CADENCE_QUEUE_LIMIT),
  };
}

const EVIDENCE_SEVERITY_RANK: Record<EvidenceLatestSignal['severity'], number> = {
  red: 0,
  amber: 1,
  green: 2,
  neutral: 3,
};

function evidenceSignals(rollup: ProcessHubRollup): EvidenceLatestSignal[] {
  return rollup.evidenceSnapshots
    .flatMap(snapshot => snapshot.latestSignals ?? [])
    .sort((a, b) => {
      const severityDelta = EVIDENCE_SEVERITY_RANK[a.severity] - EVIDENCE_SEVERITY_RANK[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
    });
}

function evidenceSignalQueue(signals: EvidenceLatestSignal[]) {
  return {
    totalCount: signals.length,
    hiddenCount: Math.max(0, signals.length - CADENCE_QUEUE_LIMIT),
    items: signals.slice(0, CADENCE_QUEUE_LIMIT),
  };
}

export function buildProcessHubCadence<TAnalyze extends ProcessHubAnalyze>(
  rollup: ProcessHubRollup<TAnalyze>,
  now: Date = new Date()
): ProcessHubCadenceSummary<TAnalyze> {
  const review = buildProcessHubReview(rollup);
  const latestEvidenceSignals = evidenceSignals(rollup);

  const controlReviews = selectControlReviews(
    rollup.analyzes,
    rollup.controlRecords,
    rollup.controlHandoffs,
    now
  );
  const controlItems = [...controlReviews];
  const controlBuckets = selectControlBuckets(
    rollup.analyzes,
    rollup.controlRecords,
    rollup.controlHandoffs,
    now
  );

  const snapshot: ProcessHubCadenceSnapshot = {
    active: rollup.activeAnalyzeCount,
    readiness: review.readinessQueue.length,
    verification: review.verificationQueue.length,
    overdueActions: rollup.overdueActionCount,
    control: controlItems.length,
    latestSignals: review.whereToFocus.length,
    nextMoves: review.nextMoveQueue.length,
  };
  if (latestEvidenceSignals.length > 0) {
    snapshot.latestEvidenceSignals = latestEvidenceSignals.length;
  }
  if (controlBuckets.recentlyReviewed.length > 0) {
    snapshot.controlReviewed = controlBuckets.recentlyReviewed.length;
  }

  return {
    hub: rollup.hub,
    activeAnalyzeCount: rollup.activeAnalyzeCount,
    latestActivity: rollup.latestActivity,
    snapshot,
    latestSignals: cadenceQueue(review.whereToFocus),
    latestEvidenceSignals: evidenceSignalQueue(latestEvidenceSignals),
    readiness: cadenceQueue(review.readinessQueue),
    verification: cadenceQueue(review.verificationQueue),
    actions: cadenceQueue(review.overdueActionQueue),
    control: cadenceQueue(controlItems),
    nextMoves: cadenceQueue(review.nextMoveQueue),
    activeWork: {
      quick: cadenceQueue(review.depthQueues.quick),
      focused: cadenceQueue(review.depthQueues.focused),
      chartered: cadenceQueue(review.depthQueues.chartered),
    },
  };
}

function countValues(counts: Partial<Record<string, number>> | undefined): number {
  let total = 0;
  for (const count of Object.values(counts ?? {})) {
    total += count ?? 0;
  }
  return total;
}

function firstDefined<T>(values: T[]): T | undefined {
  return values.find(value => value !== undefined && value !== null);
}

function buildControlSummary(
  records: ControlRecord[],
  now: Date,
  candidates: number
): ProcessHubContextContract['control'] {
  const liveRecords = records.filter(record => record.deletedAt === null);
  const due = liveRecords.filter(record => isControlDue(record, now)).length;
  const overdue = liveRecords.filter(record => isControlOverdue(record, now, 0)).length;
  const verdicts: Partial<Record<ControlVerdict, number>> = {};
  for (const record of liveRecords) {
    if (record.latestVerdict) {
      verdicts[record.latestVerdict] = (verdicts[record.latestVerdict] ?? 0) + 1;
    }
  }
  return { candidates, due, overdue, verdicts };
}

export function buildProcessHubContext<TAnalyze extends ProcessHubAnalyze>(
  rollup: ProcessHubRollup<TAnalyze>,
  now: Date = new Date()
): ProcessHubContextContract {
  const review = buildProcessHubReview(rollup);
  const cadence = buildProcessHubCadence(rollup, now);
  const currentState = buildCurrentProcessState(rollup, cadence, now);
  const analyzes = rollup.analyzes;

  const processDescription = firstDefined(
    analyzes.map(analyze => analyze.metadata?.processDescription)
  );
  const customerRequirement = firstDefined(
    analyzes.map(analyze => analyze.metadata?.customerRequirementSummary)
  );
  const processMap = firstDefined(analyzes.map(analyze => analyze.metadata?.processMapSummary));

  let totalActions = 0;
  let completedActions = 0;
  let overdueActions = 0;
  let openQuestions = 0;
  let answeredQuestions = 0;
  let ruledOutQuestions = 0;
  let totalFindings = 0;
  let confirmedFindings = 0;

  const metrics: ProcessHubMetricContext[] = [];
  const variationConcentrations: ProcessHubVariationConcentration[] = [];
  const latestEvidenceSignals = evidenceSignals(rollup);
  const processDescriptionForContract = processDescription ?? rollup.hub.description;
  const customerRequirementForContract = customerRequirement ?? processMap?.ctsColumn;

  for (const analyze of analyzes) {
    const metadata = analyze.metadata;
    totalActions += metadata?.actionCounts?.total ?? 0;
    completedActions += metadata?.actionCounts?.completed ?? 0;
    overdueActions += metadata?.actionCounts?.overdue ?? 0;

    openQuestions += metadata?.questionCounts?.open ?? 0;
    answeredQuestions += metadata?.questionCounts?.answered ?? 0;
    ruledOutQuestions += metadata?.questionCounts?.['ruled-out'] ?? 0;

    totalFindings += countValues(metadata?.findingCounts);
    confirmedFindings +=
      (metadata?.findingCounts?.analyzed ?? 0) +
      (metadata?.findingCounts?.improving ?? 0) +
      (metadata?.findingCounts?.resolved ?? 0);

    const signal = metadata?.reviewSignal;
    if (signal?.outcome) {
      metrics.push({
        name: signal.outcome,
        sourceAnalyzeId: analyze.id,
        rowCount: signal.rowCount,
        latestTimeValue: signal.latestTimeValue,
        cpk: signal.capability?.cpk,
        cpkTarget: signal.capability?.cpkTarget,
      });
    }

    if (signal?.topFocus) {
      variationConcentrations.push({
        factor: signal.topFocus.factor,
        value: signal.topFocus.value,
        variationPct: signal.topFocus.variationPct,
        sourceAnalyzeId: analyze.id,
      });
    }
  }

  return {
    schemaVersion: 1,
    hub: {
      id: rollup.hub.id,
      name: rollup.hub.name,
      description: rollup.hub.description,
      processOwner: rollup.hub.processOwner,
    },
    process: {
      description: processDescriptionForContract,
      customerRequirement,
      map: processMap,
    },
    analyzes: analyzes.map(analyze => ({
      id: analyze.id,
      name: analyze.name,
      updatedAt: analyze.updatedAt,
      status: analyze.metadata?.analyzeStatus ?? 'scouting',
      depth: analyze.metadata?.analyzeDepth,
      currentUnderstandingSummary: analyze.metadata?.currentUnderstandingSummary,
      problemConditionSummary: analyze.metadata?.problemConditionSummary,
      nextMove: analyze.metadata?.nextMove,
    })),
    metrics,
    variationConcentrations,
    evidenceSignals: latestEvidenceSignals,
    questions: {
      open: openQuestions,
      answered: answeredQuestions,
      ruledOut: ruledOutQuestions,
      evidenceGaps: openQuestions,
    },
    findings: {
      total: totalFindings,
      confirmed: confirmedFindings,
    },
    actions: {
      total: totalActions,
      completed: completedActions,
      overdue: overdueActions,
    },
    verification: {
      waiting: review.verificationQueue.length,
    },
    control: buildControlSummary(rollup.controlRecords, now, review.controlQueue.length),
    currentState: {
      overallSeverity: currentState.overallSeverity,
      itemCount: currentState.items.length,
      lensCounts: currentState.lensCounts,
      responsePathCounts: currentState.responsePathCounts,
      topItems: currentState.items.slice(0, 5).map(item => ({
        id: item.id,
        lens: item.lens,
        severity: item.severity,
        responsePath: item.responsePath,
        source: item.source,
        label: item.label,
        count: item.count,
        metric: item.metric,
      })),
    },
    readinessReasons: uniqueReadinessReasons(
      review.readinessQueue
        .flatMap(item => item.readinessReasons)
        .filter(reason => reason !== 'missing-process-context' || !processDescriptionForContract)
        .filter(
          reason => reason !== 'missing-customer-requirement' || !customerRequirementForContract
        )
    ),
  };
}
