import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ActionItem, Finding, Hypothesis } from '@variscout/core/findings';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

export interface ProjectOverviewSignals {
  hypotheses: {
    total: number;
    supported?: number;
    contradicted?: number;
    untested?: number;
    partial?: number;
  };
  findings: {
    total: number;
    observed?: number;
    investigating?: number;
    analyzed?: number;
    improving?: number;
    resolved?: number;
  };
  measurementPlans: {
    total: number;
    planned?: number;
    inProgress?: number;
    complete?: number;
    skipped?: number;
  };
  actions: {
    total: number;
    open?: number;
    inProgress?: number;
    done?: number;
  };
  team: {
    total: number;
    lead?: number;
    member?: number;
    sponsor?: number;
  };
}

export interface ProjectOverviewSignalInputs {
  ip: ImprovementProject;
  hypotheses?: readonly Hypothesis[];
  findings?: readonly Finding[];
  measurementPlans?: readonly MeasurementPlan[];
  actions?: readonly ActionItem[];
}

function countWhere<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  return items.reduce((sum, item) => sum + (predicate(item) ? 1 : 0), 0);
}

function countHypotheses(hypotheses: readonly Hypothesis[]): ProjectOverviewSignals['hypotheses'] {
  return {
    total: hypotheses.length,
    supported: countWhere(hypotheses, h => h.status === 'evidence-survived-test'),
    contradicted: countWhere(hypotheses, h => h.status === 'refuted'),
    untested: countWhere(hypotheses, h => h.status === 'proposed'),
    partial: countWhere(
      hypotheses,
      h => h.status === 'evidenced' || h.status === 'needs-disconfirmation'
    ),
  };
}

function countFindings(findings: readonly Finding[]): ProjectOverviewSignals['findings'] {
  return {
    total: findings.length,
    observed: countWhere(findings, f => f.status === 'observed'),
    investigating: countWhere(findings, f => f.status === 'investigating'),
    analyzed: countWhere(findings, f => f.status === 'analyzed'),
    improving: countWhere(findings, f => f.status === 'improving'),
    resolved: countWhere(findings, f => f.status === 'resolved'),
  };
}

function countMeasurementPlans(
  measurementPlans: readonly MeasurementPlan[]
): ProjectOverviewSignals['measurementPlans'] {
  return {
    total: measurementPlans.length,
    planned: countWhere(measurementPlans, p => p.status === 'planned'),
    inProgress: countWhere(measurementPlans, p => p.status === 'in-progress'),
    complete: countWhere(measurementPlans, p => p.status === 'complete'),
    skipped: countWhere(measurementPlans, p => p.status === 'skipped'),
  };
}

function countActions(actions: readonly ActionItem[]): ProjectOverviewSignals['actions'] {
  return {
    total: actions.length,
    open: countWhere(actions, a => (a.status ?? 'open') === 'open'),
    inProgress: countWhere(actions, a => a.status === 'in-progress'),
    done: countWhere(actions, a => a.status === 'done'),
  };
}

function countTeam(ip: ImprovementProject): ProjectOverviewSignals['team'] {
  const members = ip.metadata.members ?? [];
  return {
    total: members.length,
    lead: countWhere(members, m => m.role === 'lead'),
    member: countWhere(members, m => m.role === 'member'),
    sponsor: countWhere(members, m => m.role === 'sponsor'),
  };
}

export function deriveProjectOverviewSignals({
  ip,
  hypotheses = [],
  findings = [],
  measurementPlans = [],
  actions = [],
}: ProjectOverviewSignalInputs): ProjectOverviewSignals {
  return {
    hypotheses: countHypotheses(hypotheses),
    findings: countFindings(findings),
    measurementPlans: countMeasurementPlans(measurementPlans),
    actions: countActions(actions),
    team: countTeam(ip),
  };
}
