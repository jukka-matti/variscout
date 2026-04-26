import type { JourneyPhase } from './ai/types';
import type { EvidenceLatestSignal, EvidenceSnapshot } from './evidenceSources';
import type { FindingStatus, QuestionStatus } from './findings/types';
import type { HubReviewSignal } from './processReviewSignal';
import type { SurveyStatus } from './survey/types';
import type { SustainmentMetadataProjection } from './sustainment';

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

export interface ProcessHub {
  id: string;
  name: string;
  description?: string;
  processOwner?: ProcessParticipantRef;
  createdAt: string;
  updatedAt?: string;
}

export const DEFAULT_PROCESS_HUB: ProcessHub = {
  id: DEFAULT_PROCESS_HUB_ID,
  name: DEFAULT_PROCESS_HUB_NAME,
  createdAt: '1970-01-01T00:00:00.000Z',
};

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
   * Lightweight projection of the active SustainmentRecord for this investigation,
   * surfaced on the hub for cadence rendering without re-querying the records list.
   * The cycle between processHub.ts and sustainment.ts is broken by `import type`,
   * which is erased at compile time and produces no runtime dependency.
   */
  sustainment?: SustainmentMetadataProjection;
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
  options: { evidenceSnapshots?: EvidenceSnapshot[] } = {}
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
        reviewSignal: reviewSignalSource?.metadata?.reviewSignal,
        evidenceSnapshots,
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

export function buildReviewItem<TInvestigation extends ProcessHubInvestigation>(
  investigation: TInvestigation,
  reasons: ProcessHubAttentionReason[],
  readinessReasons: ProcessHubReadinessReason[] = []
): ProcessHubReviewItem<TInvestigation> {
  const signal = investigation.metadata?.reviewSignal;

  return {
    investigation,
    reasons,
    changeSignalCount: signal?.changeSignals.total ?? 0,
    cpkGap: cpkGap(signal),
    topFocusVariationPct: signal?.topFocus?.variationPct,
    overdueActionCount: investigation.metadata?.actionCounts?.overdue ?? 0,
    nextMove: investigation.metadata?.nextMove,
    readinessReasons,
  };
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
  rollup: ProcessHubRollup<TInvestigation>
): ProcessHubCadenceSummary<TInvestigation> {
  const review = buildProcessHubReview(rollup);
  const latestEvidenceSignals = evidenceSignals(rollup);

  const snapshot: ProcessHubCadenceSnapshot = {
    active: rollup.activeInvestigationCount,
    readiness: review.readinessQueue.length,
    verification: review.verificationQueue.length,
    overdueActions: rollup.overdueActionCount,
    sustainment: review.sustainmentQueue.length,
    latestSignals: review.whereToFocus.length,
    nextMoves: review.nextMoveQueue.length,
  };
  if (latestEvidenceSignals.length > 0) {
    snapshot.latestEvidenceSignals = latestEvidenceSignals.length;
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
    sustainment: cadenceQueue(review.sustainmentQueue),
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

export function buildProcessHubContext<TInvestigation extends ProcessHubInvestigation>(
  rollup: ProcessHubRollup<TInvestigation>
): ProcessHubContextContract {
  const review = buildProcessHubReview(rollup);
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
    sustainment: {
      candidates: review.sustainmentQueue.length,
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
