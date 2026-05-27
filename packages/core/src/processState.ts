import type { EvidenceLatestSignal } from './evidenceSources';
import type {
  AnalyzeDepth,
  ProcessHub,
  ProcessHubCadenceSummary,
  ProcessHubAnalyze,
  ProcessHubRollup,
} from './processHub';

export type ProcessStateLens = 'outcome' | 'flow' | 'conversion' | 'measurement' | 'sustainment';

export type ProcessStateSeverity = 'red' | 'amber' | 'neutral' | 'green';

export type ProcessStateResponsePath =
  | 'monitor'
  | 'quick-action'
  | 'focused-analyze'
  | 'chartered-project'
  | 'measurement-system-work'
  | 'control-review';

export type ProcessStateSource =
  | 'review-signal'
  | 'evidence-snapshot'
  | 'readiness'
  | 'verification'
  | 'action'
  | 'control'
  | 'active-work';

export interface ProcessStateMetric {
  cpk?: number;
  cpkTarget?: number;
  cpkGap?: number;
  outOfSpecPercentage?: number;
  changeSignalCount?: number;
  variationPct?: number;
}

export interface ProcessStateItem {
  id: string;
  lens: ProcessStateLens;
  severity: ProcessStateSeverity;
  responsePath: ProcessStateResponsePath;
  source: ProcessStateSource;
  label: string;
  detail?: string;
  metric?: ProcessStateMetric;
  sourceId?: string;
  count?: number;
  analyzeIds?: string[];
}

export interface CurrentProcessState {
  hub: Pick<ProcessHub, 'id' | 'name' | 'description' | 'processOwner'>;
  assessedAt: string;
  overallSeverity: ProcessStateSeverity;
  items: ProcessStateItem[];
  lensCounts: Record<ProcessStateLens, number>;
  responsePathCounts: Partial<Record<ProcessStateResponsePath, number>>;
}

const LENSES: ProcessStateLens[] = ['outcome', 'flow', 'conversion', 'measurement', 'sustainment'];

const DEPTH_RESPONSE_PATHS: Record<AnalyzeDepth, ProcessStateResponsePath> = {
  quick: 'quick-action',
  focused: 'focused-analyze',
  chartered: 'chartered-project',
};

const DEPTH_LABELS: Record<AnalyzeDepth, string> = {
  quick: 'Quick action queue',
  focused: 'Focused analyze queue',
  chartered: 'Chartered project queue',
};

const SEVERITY_RANK: Record<ProcessStateSeverity, number> = {
  red: 0,
  amber: 1,
  neutral: 2,
  green: 3,
};

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function capabilityGap(cpk?: number, cpkTarget?: number): number | undefined {
  if (cpk === undefined || cpkTarget === undefined) return undefined;
  const gap = cpkTarget - cpk;
  return gap > 0 ? roundMetric(gap) : undefined;
}

function capabilitySeverity(gap: number | undefined): ProcessStateSeverity {
  if (gap === undefined) return 'green';
  return gap >= 0.5 ? 'red' : 'amber';
}

function evidenceSeverity(severity: EvidenceLatestSignal['severity']): ProcessStateSeverity {
  return severity === 'red' || severity === 'amber' || severity === 'green' ? severity : 'neutral';
}

function overallSeverity(items: ProcessStateItem[]): ProcessStateSeverity {
  if (items.length === 0) return 'neutral';
  return [...items].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0]
    .severity;
}

function buildLensCounts(items: ProcessStateItem[]): Record<ProcessStateLens, number> {
  const counts = Object.fromEntries(LENSES.map(lens => [lens, 0])) as Record<
    ProcessStateLens,
    number
  >;
  for (const item of items) {
    counts[item.lens] += 1;
  }
  return counts;
}

function buildResponsePathCounts(
  items: ProcessStateItem[]
): Partial<Record<ProcessStateResponsePath, number>> {
  const counts: Partial<Record<ProcessStateResponsePath, number>> = {};
  for (const item of items) {
    counts[item.responsePath] = (counts[item.responsePath] ?? 0) + 1;
  }
  return counts;
}

function itemSort(a: ProcessStateItem, b: ProcessStateItem): number {
  return (
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    a.lens.localeCompare(b.lens) ||
    a.id.localeCompare(b.id)
  );
}

function queueAnalyzeIds<TAnalyze extends ProcessHubAnalyze>(
  items: { analyze: TAnalyze }[]
): string[] {
  return items.map(item => item.analyze.id);
}

export function buildCurrentProcessState<TAnalyze extends ProcessHubAnalyze>(
  rollup: ProcessHubRollup<TAnalyze>,
  cadence: ProcessHubCadenceSummary<TAnalyze>,
  now: Date = new Date()
): CurrentProcessState {
  const items: ProcessStateItem[] = [];
  const capability = rollup.reviewSignal?.capability;
  const gap = capabilityGap(capability?.cpk, capability?.cpkTarget);

  if (capability?.cpk !== undefined && capability.cpkTarget !== undefined) {
    items.push({
      id: gap === undefined ? 'capability-ok' : 'capability-gap',
      lens: 'outcome',
      severity: capabilitySeverity(gap),
      responsePath: gap === undefined ? 'monitor' : 'focused-analyze',
      source: 'review-signal',
      label: gap === undefined ? 'Capability at target' : 'Capability below target',
      metric: {
        cpk: capability.cpk,
        cpkTarget: capability.cpkTarget,
        cpkGap: gap,
        outOfSpecPercentage: capability.outOfSpecPercentage,
      },
    });
  }

  const changeSignalCount = rollup.reviewSignal?.changeSignals.total ?? 0;
  if (changeSignalCount > 0) {
    items.push({
      id: 'change-signals',
      lens: 'conversion',
      severity: changeSignalCount >= 3 ? 'red' : 'amber',
      responsePath: 'focused-analyze',
      source: 'review-signal',
      label: 'Change signals detected',
      count: changeSignalCount,
      metric: { changeSignalCount },
    });
  }

  const topFocus = rollup.reviewSignal?.topFocus;
  if (topFocus?.variationPct !== undefined && topFocus.variationPct > 0) {
    items.push({
      id: 'top-focus',
      lens: 'conversion',
      severity: topFocus.variationPct >= 50 ? 'red' : 'amber',
      responsePath: 'focused-analyze',
      source: 'review-signal',
      label: 'Variation concentration',
      detail:
        topFocus.value === undefined ? topFocus.factor : `${topFocus.factor} / ${topFocus.value}`,
      metric: { variationPct: roundMetric(topFocus.variationPct) },
    });
  }

  for (const signal of cadence.latestEvidenceSignals.items) {
    const severity = evidenceSeverity(signal.severity);
    items.push({
      id: `evidence:${signal.id}`,
      lens: 'measurement',
      severity,
      responsePath:
        severity === 'green' || severity === 'neutral' ? 'monitor' : 'measurement-system-work',
      source: 'evidence-snapshot',
      sourceId: signal.id,
      label: signal.label,
      count: signal.value,
      detail: signal.capturedAt,
    });
  }

  if (cadence.readiness.totalCount > 0) {
    items.push({
      id: 'readiness',
      lens: 'measurement',
      severity: 'amber',
      responsePath: 'measurement-system-work',
      source: 'readiness',
      label: 'Readiness gaps',
      count: cadence.readiness.totalCount,
      analyzeIds: queueAnalyzeIds(cadence.readiness.items),
    });
  }

  if (cadence.verification.totalCount > 0) {
    items.push({
      id: 'verification',
      lens: 'conversion',
      severity: 'amber',
      responsePath: 'quick-action',
      source: 'verification',
      label: 'Verification waiting',
      count: cadence.verification.totalCount,
      analyzeIds: queueAnalyzeIds(cadence.verification.items),
    });
  }

  if (cadence.actions.totalCount > 0) {
    items.push({
      id: 'overdue-actions',
      lens: 'conversion',
      severity: cadence.snapshot.overdueActions > 1 ? 'red' : 'amber',
      responsePath: 'quick-action',
      source: 'action',
      label: 'Overdue actions',
      count: cadence.snapshot.overdueActions,
      analyzeIds: queueAnalyzeIds(cadence.actions.items),
    });
  }

  for (const depth of Object.keys(cadence.activeWork) as AnalyzeDepth[]) {
    const queue = cadence.activeWork[depth];
    if (queue.totalCount === 0) continue;
    items.push({
      id: `active:${depth}`,
      lens: 'conversion',
      severity: 'neutral',
      responsePath: DEPTH_RESPONSE_PATHS[depth],
      source: 'active-work',
      label: DEPTH_LABELS[depth],
      count: queue.totalCount,
      analyzeIds: queueAnalyzeIds(queue.items),
    });
  }

  const controlReviewItems = cadence.control.items;
  if (controlReviewItems.length > 0) {
    items.push({
      // 'sustainment' id + lens preserved — matches ProcessStateLens preserve-set
      // entry (hard rule). Item label uses post-rename 'Control review due'.
      id: 'sustainment',
      lens: 'sustainment',
      severity: 'amber',
      responsePath: 'control-review',
      source: 'control',
      label: 'Control review due',
      count: controlReviewItems.length,
      analyzeIds: controlReviewItems.map(item => item.analyze.id),
    });
  }

  const sortedItems = items.sort(itemSort);

  return {
    hub: {
      id: rollup.hub.id,
      name: rollup.hub.name,
      description: rollup.hub.description,
      processOwner: rollup.hub.processOwner,
    },
    assessedAt: now.toISOString(),
    overallSeverity: overallSeverity(sortedItems),
    items: sortedItems,
    lensCounts: buildLensCounts(sortedItems),
    responsePathCounts: buildResponsePathCounts(sortedItems),
  };
}
