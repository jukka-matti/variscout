import type { JourneyPhase } from './ai/types';
import type { EvidenceLatestSignal, EvidenceSnapshot } from './evidenceSources';
import type { FindingStatus, QuestionStatus } from './findings/types';
import type { ProcessMap } from './frame/types';
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
  isSustainmentDue,
  isSustainmentOverdue,
  selectControlHandoffCandidates,
  selectSustainmentBuckets,
  selectSustainmentReviews,
  type ControlHandoff,
  type SustainmentMetadataProjection,
  type SustainmentRecord,
  type SustainmentVerdict,
} from './sustainment';

export { buildReviewItem } from './processHubReview';

export const DEFAULT_PROCESS_HUB_ID = 'general-unassigned';
export const DEFAULT_PROCESS_HUB_NAME = 'General / Unassigned';

export type InvestigationDepth = 'quick' | 'focused' | 'chartered';

export type InvestigationStatus =
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

export interface OutcomeSpec {
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

export interface ProcessHub {
  id: string;
  name: string;
  description?: string;
  processOwner?: ProcessParticipantRef;
  createdAt: string;
  updatedAt?: string;
  /**
   * Hub-level canonical Process Map. Investigations within this hub inherit
   * structure (nodes, tributaries, capability scopes) by version-pinning to
   * `canonicalMapVersion`. Absent for hubs that haven't promoted a canonical
   * map yet.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
   */
  canonicalProcessMap?: ProcessMap;
  /**
   * Version identifier for `canonicalProcessMap`. ISO 8601 timestamp by
   * default; semver allowed if the team adopts it. Investigations pin this
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
   * investigation linked to this hub. Currently the only field set by UI is
   * `capability.cpkTarget` (Hub Capability tab header editor). Other fields
   * remain reserved for future explicit hub-level signals; the rollup-derived
   * read-only signal still fills them when this is undefined.
   *
   * See `docs/05-technical/architecture/capability-target-cascade.md`.
   */
  reviewSignal?: HubReviewSignal;
}

export const DEFAULT_PROCESS_HUB: ProcessHub = {
  id: DEFAULT_PROCESS_HUB_ID,
  name: DEFAULT_PROCESS_HUB_NAME,
  createdAt: '1970-01-01T00:00:00.000Z',
};

/**
 * Maps one canonical-map node onto a column in this investigation's data.
 * `nodeMappings.length === 1` is the B2 shape (investigation IS one step's
 * deep-dive). Length > 1 is the B1 shape (investigation covers multiple
 * steps). Absent/empty is the B0 shape (legacy investigation, falls back to
 * global investigation-level specs).
 *
 * `specsOverride`, when set, is a flagged local fork — UI shows divergence
 * from canonical for the analyst.
 *
 * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 */
export interface InvestigationNodeMapping {
  /** ID of the canonical-map node this mapping addresses. */
  nodeId: string;
  /** Column in this investigation's data carrying the per-step measurement. */
  measurementColumn: string;
  /** Optional flagged local spec override (forks from canonical). */
  specsOverride?: SpecLimits;
}

export interface ProcessHubInvestigationMetadata {
  processHubId?: string;
  investigationDepth?: InvestigationDepth;
  investigationStatus?: InvestigationStatus;
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
   * Team notes attached to current-state items. Persisted per-investigation
   * via the existing Blob-Storage round-trip on project metadata.
   * Re-rendered by Dashboard on mount via the rollup.
   */
  stateNotes?: ProcessStateNote[];
  /**
   * Lightweight projection of the active SustainmentRecord for this investigation,
   * surfaced on the hub for cadence rendering without re-querying the records list.
   * The cycle between processHub.ts and sustainment.ts is broken by `import type`,
   * which is erased at compile time and produces no runtime dependency.
   */
  sustainment?: SustainmentMetadataProjection;
  /**
   * Pinned version of the hub's canonicalProcessMap at investigation
   * creation. Used by `pull-latest` to detect drift. Absent for legacy
   * investigations or hubs without canonical maps.
   */
  canonicalMapVersion?: string;
  /**
   * Per-node measurement-column mappings. Drives per-(node × context-tuple)
   * capability computation. See `InvestigationNodeMapping` above.
   */
  nodeMappings?: InvestigationNodeMapping[];
  /**
   * Optional timeline window applied to this investigation's data when
   * computing findings/charts. Co-located with nodeMappings per Decision #1
   * (see docs/superpowers/plans/2026-04-29-multi-level-scout-v1-decisions.md).
   * Absent → callers should use the mode's default window (typically `cumulative`).
   */
  timelineWindow?: TimelineWindow;
  /**
   * ISO 8601 timestamp set when the analyst dismisses the B0 migration banner
   * for this investigation. Dismissed investigations remain B0; the banner
   * counts only un-dismissed unmapped investigations.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
   * section "B0 migration UX".
   */
  migrationDeclinedAt?: string;
}

export interface ProcessHubInvestigation {
  id: string;
  name: string;
  modified: string;
  metadata?: ProcessHubInvestigationMetadata;
}

export interface ProcessHubRollup<
  TInvestigation extends ProcessHubInvestigation = ProcessHubInvestigation,
> {
  hub: ProcessHub;
  investigations: TInvestigation[];
  activeInvestigationCount: number;
  statusCounts: Partial<Record<InvestigationStatus, number>>;
  depthCounts: Partial<Record<InvestigationDepth, number>>;
  overdueActionCount: number;
  latestActivity: string | null;
  currentUnderstandingSummary?: string;
  problemConditionSummary?: string;
  nextMove?: string;
  reviewSignal?: HubReviewSignal;
  evidenceSnapshots: EvidenceSnapshot[];
  sustainmentRecords: SustainmentRecord[];
  controlHandoffs: ControlHandoff[];
}

export type ProcessHubAttentionReason =
  | 'change-signals'
  | 'capability-gap'
  | 'top-focus'
  | 'verification'
  | 'overdue-actions'
  | 'next-move'
  | 'sustainment'
  | 'sustainment-due'
  | 'control-handoff-missing';

export type ProcessHubReadinessReason =
  | 'missing-metadata'
  | 'missing-process-hub'
  | 'missing-process-context'
  | 'missing-customer-requirement'
  | 'survey-gap'
  | 'verification-gap'
  | 'sustainment-candidate';

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

export interface ProcessHubReviewItem<
  TInvestigation extends ProcessHubInvestigation = ProcessHubInvestigation,
> {
  investigation: TInvestigation;
  reasons: ProcessHubAttentionReason[];
  changeSignalCount: number;
  cpkGap?: number;
  topFocusVariationPct?: number;
  overdueActionCount: number;
  nextMove?: string;
  readinessReasons: ProcessHubReadinessReason[];
}

export interface ProcessHubReview<
  TInvestigation extends ProcessHubInvestigation = ProcessHubInvestigation,
> {
  hub: ProcessHub;
  activeInvestigationCount: number;
  latestActivity: string | null;
  depthQueues: Record<InvestigationDepth, ProcessHubReviewItem<TInvestigation>[]>;
  whereToFocus: ProcessHubReviewItem<TInvestigation>[];
  verificationQueue: ProcessHubReviewItem<TInvestigation>[];
  overdueActionQueue: ProcessHubReviewItem<TInvestigation>[];
  nextMoveQueue: ProcessHubReviewItem<TInvestigation>[];
  sustainmentQueue: ProcessHubReviewItem<TInvestigation>[];
  readinessQueue: ProcessHubReviewItem<TInvestigation>[];
}

export interface ProcessHubCadenceSnapshot {
  active: number;
  readiness: number;
  verification: number;
  overdueActions: number;
  sustainment: number;
  /** Count of records reviewed within the last `recentReviewWindowDays` (default 14). Undefined when 0. */
  sustainmentReviewed?: number;
  latestSignals: number;
  latestEvidenceSignals?: number;
  nextMoves: number;
}

export interface ProcessHubCadenceQueue<
  TInvestigation extends ProcessHubInvestigation = ProcessHubInvestigation,
> {
  totalCount: number;
  hiddenCount: number;
  items: ProcessHubReviewItem<TInvestigation>[];
}

export interface ProcessHubCadenceSummary<
  TInvestigation extends ProcessHubInvestigation = ProcessHubInvestigation,
> {
  hub: ProcessHub;
  activeInvestigationCount: number;
  latestActivity: string | null;
  snapshot: ProcessHubCadenceSnapshot;
  latestSignals: ProcessHubCadenceQueue<TInvestigation>;
  latestEvidenceSignals: {
    totalCount: number;
    hiddenCount: number;
    items: EvidenceLatestSignal[];
  };
  readiness: ProcessHubCadenceQueue<TInvestigation>;
  verification: ProcessHubCadenceQueue<TInvestigation>;
  actions: ProcessHubCadenceQueue<TInvestigation>;
  sustainment: ProcessHubCadenceQueue<TInvestigation>;
  nextMoves: ProcessHubCadenceQueue<TInvestigation>;
  activeWork: Record<InvestigationDepth, ProcessHubCadenceQueue<TInvestigation>>;
}

export interface ProcessHubContextInvestigation {
  id: string;
  name: string;
  modified: string;
  status: InvestigationStatus;
  depth?: InvestigationDepth;
  currentUnderstandingSummary?: string;
  problemConditionSummary?: string;
  nextMove?: string;
}

export interface ProcessHubMetricContext {
  name: string;
  sourceInvestigationId: string;
  rowCount: number;
  latestTimeValue?: string | number | boolean;
  cpk?: number;
  cpkTarget?: number;
}

export interface ProcessHubVariationConcentration {
  factor: string;
  value?: string | number | boolean;
  variationPct: number;
  sourceInvestigationId: string;
}

export interface ProcessHubContextContract {
  schemaVersion: 1;
  hub: Pick<ProcessHub, 'id' | 'name' | 'description' | 'processOwner'>;
  process: {
    description?: string;
    customerRequirement?: string;
    map?: ProcessHubProcessMapSummary;
  };
  investigations: ProcessHubContextInvestigation[];
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
  sustainment: {
    candidates: number;
    due: number;
    overdue: number;
    verdicts: Partial<Record<SustainmentVerdict, number>>;
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

const ACTIVE_STATUSES = new Set<InvestigationStatus>([
  'issue-captured',
  'framing',
  'scouting',
  'investigating',
  'ready-to-improve',
  'improving',
  'verifying',
]);

const INVESTIGATION_DEPTHS: InvestigationDepth[] = ['quick', 'focused', 'chartered'];

const CADENCE_QUEUE_LIMIT = 4;

const SUSTAINMENT_STATUSES = new Set<InvestigationStatus>(['resolved', 'controlled']);

export function normalizeProcessHubId(processHubId?: string | null): string {
  const trimmed = processHubId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_PROCESS_HUB_ID;
}

export function investigationStatusFromJourneyPhase(phase: JourneyPhase): InvestigationStatus {
  switch (phase) {
    case 'frame':
      return 'framing';
    case 'scout':
      return 'scouting';
    case 'investigate':
      return 'investigating';
    case 'improve':
      return 'improving';
  }
}

function newestInvestigation<TInvestigation extends ProcessHubInvestigation>(
  investigations: TInvestigation[]
): TInvestigation | undefined {
  return [...investigations].sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
  )[0];
}

function synthesizeOrphanHub(hubId: string): ProcessHub {
  return { id: hubId, name: 'Unknown hub', createdAt: '1970-01-01T00:00:00.000Z' };
}

export function buildProcessHubRollups<TInvestigation extends ProcessHubInvestigation>(
  hubs: ProcessHub[],
  investigations: TInvestigation[],
  options: {
    evidenceSnapshots?: EvidenceSnapshot[];
    sustainmentRecords?: SustainmentRecord[];
    controlHandoffs?: ControlHandoff[];
  } = {}
): ProcessHubRollup<TInvestigation>[] {
  const hubMap = new Map<string, ProcessHub>();
  hubMap.set(DEFAULT_PROCESS_HUB_ID, DEFAULT_PROCESS_HUB);
  for (const hub of hubs) {
    hubMap.set(normalizeProcessHubId(hub.id), hub);
  }

  for (const investigation of investigations) {
    const hubId = normalizeProcessHubId(investigation.metadata?.processHubId);
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

  const grouped = new Map<string, TInvestigation[]>();
  for (const investigation of investigations) {
    const hubId = normalizeProcessHubId(investigation.metadata?.processHubId);
    grouped.set(hubId, [...(grouped.get(hubId) ?? []), investigation]);
  }

  const groupedSustainment = new Map<string, SustainmentRecord[]>();
  for (const record of options.sustainmentRecords ?? []) {
    const hubId = normalizeProcessHubId(record.hubId);
    groupedSustainment.set(hubId, [...(groupedSustainment.get(hubId) ?? []), record]);
  }

  const groupedHandoffs = new Map<string, ControlHandoff[]>();
  for (const handoff of options.controlHandoffs ?? []) {
    const hubId = normalizeProcessHubId(handoff.hubId);
    groupedHandoffs.set(hubId, [...(groupedHandoffs.get(hubId) ?? []), handoff]);
  }

  return Array.from(hubMap.values())
    .map(hub => {
      const hubInvestigations = [...(grouped.get(hub.id) ?? [])].sort(
        (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
      const statusCounts: Partial<Record<InvestigationStatus, number>> = {};
      const depthCounts: Partial<Record<InvestigationDepth, number>> = {};
      let overdueActionCount = 0;
      let activeInvestigationCount = 0;

      for (const investigation of hubInvestigations) {
        const status = investigation.metadata?.investigationStatus ?? 'scouting';
        statusCounts[status] = (statusCounts[status] ?? 0) + 1;
        if (ACTIVE_STATUSES.has(status)) activeInvestigationCount++;

        const depth = investigation.metadata?.investigationDepth;
        if (depth) depthCounts[depth] = (depthCounts[depth] ?? 0) + 1;

        overdueActionCount += investigation.metadata?.actionCounts?.overdue ?? 0;
      }

      const latest = newestInvestigation(hubInvestigations);
      const summarySource = hubInvestigations.find(
        investigation =>
          investigation.metadata?.currentUnderstandingSummary ||
          investigation.metadata?.problemConditionSummary ||
          investigation.metadata?.nextMove
      );
      const reviewSignalSource = hubInvestigations.find(
        investigation => investigation.metadata?.reviewSignal
      );
      const evidenceSnapshots = (options.evidenceSnapshots ?? [])
        .filter(snapshot => normalizeProcessHubId(snapshot.hubId) === hub.id)
        .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
      const sustainmentRecords = groupedSustainment.get(hub.id) ?? [];
      const controlHandoffs = groupedHandoffs.get(hub.id) ?? [];

      return {
        hub,
        investigations: hubInvestigations,
        activeInvestigationCount,
        statusCounts,
        depthCounts,
        overdueActionCount,
        latestActivity: latest?.modified ?? null,
        currentUnderstandingSummary: summarySource?.metadata?.currentUnderstandingSummary,
        problemConditionSummary: summarySource?.metadata?.problemConditionSummary,
        nextMove: summarySource?.metadata?.nextMove,
        // Hub-level reviewSignal (analyst-set) wins over investigation-derived.
        // Today only `capability.cpkTarget` is set on the hub directly; the
        // investigation-derived signal still provides the rest of the fields
        // when no hub-level signal exists.
        reviewSignal: hub.reviewSignal ?? reviewSignalSource?.metadata?.reviewSignal,
        evidenceSnapshots,
        sustainmentRecords,
        controlHandoffs,
      };
    })
    .filter(
      rollup =>
        rollup.investigations.length > 0 ||
        rollup.evidenceSnapshots.length > 0 ||
        rollup.hub.id !== DEFAULT_PROCESS_HUB_ID
    )
    .sort((a, b) => {
      const aTime = a.latestActivity ? new Date(a.latestActivity).getTime() : 0;
      const bTime = b.latestActivity ? new Date(b.latestActivity).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.hub.name.localeCompare(b.hub.name);
    });
}

function modifiedTime(investigation: ProcessHubInvestigation): number {
  const time = new Date(investigation.modified).getTime();
  return Number.isFinite(time) ? time : 0;
}

function cpkGap(signal?: HubReviewSignal): number | undefined {
  const cpk = signal?.capability?.cpk;
  const target = signal?.capability?.cpkTarget;
  if (cpk === undefined || target === undefined) return undefined;
  const gap = target - cpk;
  return gap > 0 ? Math.round(gap * 100) / 100 : undefined;
}

function compareFocusItems<TInvestigation extends ProcessHubInvestigation>(
  a: ProcessHubReviewItem<TInvestigation>,
  b: ProcessHubReviewItem<TInvestigation>
): number {
  return (
    b.changeSignalCount - a.changeSignalCount ||
    (b.cpkGap ?? 0) - (a.cpkGap ?? 0) ||
    (b.topFocusVariationPct ?? 0) - (a.topFocusVariationPct ?? 0) ||
    modifiedTime(b.investigation) - modifiedTime(a.investigation)
  );
}

function compareNewest<TInvestigation extends ProcessHubInvestigation>(
  a: ProcessHubReviewItem<TInvestigation>,
  b: ProcessHubReviewItem<TInvestigation>
): number {
  return modifiedTime(b.investigation) - modifiedTime(a.investigation);
}

function compareOverdue<TInvestigation extends ProcessHubInvestigation>(
  a: ProcessHubReviewItem<TInvestigation>,
  b: ProcessHubReviewItem<TInvestigation>
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

function readinessReasons<TInvestigation extends ProcessHubInvestigation>(
  investigation: TInvestigation
): ProcessHubReadinessReason[] {
  const reasons: ProcessHubReadinessReason[] = [];
  const metadata = investigation.metadata;
  const status = metadata?.investigationStatus ?? 'scouting';

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
  if (SUSTAINMENT_STATUSES.has(status)) reasons.push('sustainment-candidate');

  return reasons;
}

const READINESS_REASON_ORDER: ProcessHubReadinessReason[] = [
  'missing-metadata',
  'missing-process-hub',
  'missing-process-context',
  'missing-customer-requirement',
  'survey-gap',
  'verification-gap',
  'sustainment-candidate',
];

function uniqueReadinessReasons(reasons: ProcessHubReadinessReason[]): ProcessHubReadinessReason[] {
  return READINESS_REASON_ORDER.filter(reason => reasons.includes(reason));
}

export function buildProcessHubReview<TInvestigation extends ProcessHubInvestigation>(
  rollup: ProcessHubRollup<TInvestigation>
): ProcessHubReview<TInvestigation> {
  const depthQueues: Record<InvestigationDepth, ProcessHubReviewItem<TInvestigation>[]> = {
    quick: [],
    focused: [],
    chartered: [],
  };

  for (const investigation of rollup.investigations) {
    const status = investigation.metadata?.investigationStatus ?? 'scouting';
    if (!ACTIVE_STATUSES.has(status)) continue;

    const depth = investigation.metadata?.investigationDepth ?? 'quick';
    depthQueues[depth].push(buildReviewItem(investigation, []));
  }

  for (const depth of INVESTIGATION_DEPTHS) {
    depthQueues[depth].sort(compareNewest);
  }

  const whereToFocus = rollup.investigations
    .filter(investigation => investigation.metadata?.reviewSignal)
    .map(investigation =>
      buildReviewItem(investigation, focusReasons(investigation.metadata!.reviewSignal!))
    )
    .sort(compareFocusItems);

  const verificationQueue = rollup.investigations
    .filter(investigation => investigation.metadata?.investigationStatus === 'verifying')
    .map(investigation => buildReviewItem(investigation, ['verification']))
    .sort(compareNewest);

  const overdueActionQueue = rollup.investigations
    .filter(investigation => (investigation.metadata?.actionCounts?.overdue ?? 0) > 0)
    .map(investigation => buildReviewItem(investigation, ['overdue-actions']))
    .sort(compareOverdue);

  const nextMoveQueue = rollup.investigations
    .filter(
      investigation =>
        ACTIVE_STATUSES.has(investigation.metadata?.investigationStatus ?? 'scouting') &&
        investigation.metadata?.nextMove
    )
    .map(investigation => buildReviewItem(investigation, ['next-move']))
    .sort(compareNewest);

  const sustainmentQueue = rollup.investigations
    .filter(investigation =>
      SUSTAINMENT_STATUSES.has(investigation.metadata?.investigationStatus ?? 'scouting')
    )
    .map(investigation => buildReviewItem(investigation, ['sustainment']))
    .sort(compareNewest);

  const readinessQueue = rollup.investigations
    .map(investigation => ({
      investigation,
      reasons: readinessReasons(investigation),
    }))
    .filter(item => item.reasons.length > 0)
    .map(item => buildReviewItem(item.investigation, [], item.reasons))
    .sort(compareNewest);

  return {
    hub: rollup.hub,
    activeInvestigationCount: rollup.activeInvestigationCount,
    latestActivity: rollup.latestActivity,
    depthQueues,
    whereToFocus,
    verificationQueue,
    overdueActionQueue,
    nextMoveQueue,
    sustainmentQueue,
    readinessQueue,
  };
}

function cadenceQueue<TInvestigation extends ProcessHubInvestigation>(
  items: ProcessHubReviewItem<TInvestigation>[]
): ProcessHubCadenceQueue<TInvestigation> {
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

export function buildProcessHubCadence<TInvestigation extends ProcessHubInvestigation>(
  rollup: ProcessHubRollup<TInvestigation>,
  now: Date = new Date()
): ProcessHubCadenceSummary<TInvestigation> {
  const review = buildProcessHubReview(rollup);
  const latestEvidenceSignals = evidenceSignals(rollup);

  const sustainmentReviews = selectSustainmentReviews(
    rollup.investigations,
    rollup.sustainmentRecords,
    rollup.controlHandoffs,
    now
  );
  const handoffCandidates = selectControlHandoffCandidates(
    rollup.investigations,
    rollup.controlHandoffs
  );
  const sustainmentItems = [...sustainmentReviews, ...handoffCandidates];
  const sustainmentBuckets = selectSustainmentBuckets(
    rollup.investigations,
    rollup.sustainmentRecords,
    rollup.controlHandoffs,
    now
  );

  const snapshot: ProcessHubCadenceSnapshot = {
    active: rollup.activeInvestigationCount,
    readiness: review.readinessQueue.length,
    verification: review.verificationQueue.length,
    overdueActions: rollup.overdueActionCount,
    sustainment: sustainmentItems.length,
    latestSignals: review.whereToFocus.length,
    nextMoves: review.nextMoveQueue.length,
  };
  if (latestEvidenceSignals.length > 0) {
    snapshot.latestEvidenceSignals = latestEvidenceSignals.length;
  }
  if (sustainmentBuckets.recentlyReviewed.length > 0) {
    snapshot.sustainmentReviewed = sustainmentBuckets.recentlyReviewed.length;
  }

  return {
    hub: rollup.hub,
    activeInvestigationCount: rollup.activeInvestigationCount,
    latestActivity: rollup.latestActivity,
    snapshot,
    latestSignals: cadenceQueue(review.whereToFocus),
    latestEvidenceSignals: evidenceSignalQueue(latestEvidenceSignals),
    readiness: cadenceQueue(review.readinessQueue),
    verification: cadenceQueue(review.verificationQueue),
    actions: cadenceQueue(review.overdueActionQueue),
    sustainment: cadenceQueue(sustainmentItems),
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

function buildSustainmentSummary(
  records: SustainmentRecord[],
  now: Date,
  candidates: number
): ProcessHubContextContract['sustainment'] {
  const liveRecords = records.filter(record => !record.tombstoneAt);
  const due = liveRecords.filter(record => isSustainmentDue(record, now)).length;
  const overdue = liveRecords.filter(record => isSustainmentOverdue(record, now, 0)).length;
  const verdicts: Partial<Record<SustainmentVerdict, number>> = {};
  for (const record of liveRecords) {
    if (record.latestVerdict) {
      verdicts[record.latestVerdict] = (verdicts[record.latestVerdict] ?? 0) + 1;
    }
  }
  return { candidates, due, overdue, verdicts };
}

export function buildProcessHubContext<TInvestigation extends ProcessHubInvestigation>(
  rollup: ProcessHubRollup<TInvestigation>,
  now: Date = new Date()
): ProcessHubContextContract {
  const review = buildProcessHubReview(rollup);
  const cadence = buildProcessHubCadence(rollup, now);
  const currentState = buildCurrentProcessState(rollup, cadence, now);
  const investigations = rollup.investigations;

  const processDescription = firstDefined(
    investigations.map(investigation => investigation.metadata?.processDescription)
  );
  const customerRequirement = firstDefined(
    investigations.map(investigation => investigation.metadata?.customerRequirementSummary)
  );
  const processMap = firstDefined(
    investigations.map(investigation => investigation.metadata?.processMapSummary)
  );

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

  for (const investigation of investigations) {
    const metadata = investigation.metadata;
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
        sourceInvestigationId: investigation.id,
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
        sourceInvestigationId: investigation.id,
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
    investigations: investigations.map(investigation => ({
      id: investigation.id,
      name: investigation.name,
      modified: investigation.modified,
      status: investigation.metadata?.investigationStatus ?? 'scouting',
      depth: investigation.metadata?.investigationDepth,
      currentUnderstandingSummary: investigation.metadata?.currentUnderstandingSummary,
      problemConditionSummary: investigation.metadata?.problemConditionSummary,
      nextMove: investigation.metadata?.nextMove,
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
    sustainment: buildSustainmentSummary(
      rollup.sustainmentRecords,
      now,
      review.sustainmentQueue.length
    ),
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
