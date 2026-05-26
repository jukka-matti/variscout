import type { Finding, Hypothesis, Question } from '../findings/types';
import { deriveIPReportMiniChartType, type IPReportMiniChartType } from '../findings/miniChart';
import type { ImprovementProject } from '../improvementProject';
import type { ProcessHub } from '../processHub';
import type { ControlHandoff, SustainmentRecord } from '../sustainment';

export const D13_OVERVIEW_SECTION_TITLES = [
  'Executive summary',
  'Where we started',
  'What we aimed for',
  'What we found + what we did',
  'Did it work?',
  'What we standardized + learned',
  "What's next",
] as const;

export type IPReportOverviewSectionTitle = (typeof D13_OVERVIEW_SECTION_TITLES)[number];

export interface IPReportScopeInput {
  ip: ImprovementProject;
  hypotheses: readonly Hypothesis[];
  findings: readonly Finding[];
  questions: readonly Question[];
  sustainmentRecords?: readonly SustainmentRecord[];
  controlHandoffs?: readonly ControlHandoff[];
}

export interface IPReportScope {
  hypotheses: Hypothesis[];
  findings: Finding[];
  questions: Question[];
  sustainmentRecord?: SustainmentRecord;
  controlHandoff?: ControlHandoff;
}

export interface IPReportOverviewSection {
  title: IPReportOverviewSectionTitle;
  items: string[];
}

export interface IPCauseRow {
  hypothesisId: Hypothesis['id'];
  title: string;
  synthesis: string;
  selectedIdea?: string;
  actionProgressLabel: string;
  verificationLabel: string;
  findingCount: number;
  miniChartType: IPReportMiniChartType;
}

export interface HubPortfolioRow {
  id: ImprovementProject['id'];
  title: string;
  status: ImprovementProject['status'];
  dayCounter: number;
  lastActivityAt: number;
  cadenceLabel: string;
  driftLabel: string;
}

export interface HubCapabilitySummary {
  kind: 'single-spec' | 'distribution' | 'empty';
  label: string;
}

export interface HubPortfolioReport {
  rows: HubPortfolioRow[];
  capabilitySummary: HubCapabilitySummary;
  cadenceHealthLabel: string;
  driftSignalCount: number;
}

function unique<T>(values: Iterable<T>): T[] {
  return Array.from(new Set(values));
}

function liveProjects(projects: readonly ImprovementProject[] | undefined): ImprovementProject[] {
  return (projects ?? []).filter(project => project.deletedAt === null);
}

function linkedHypothesisIds(ip: ImprovementProject): Set<string> {
  const ids = new Set(ip.sections.investigationLineage.hypothesisIds ?? []);
  for (const control of ip.goal.factorControls ?? []) {
    if (control.linkedHypothesisId) ids.add(control.linkedHypothesisId);
  }
  return ids;
}

function linkedFindingIds(ip: ImprovementProject, hypotheses: readonly Hypothesis[]): Set<string> {
  const ids = new Set(ip.sections.investigationLineage.findingIds ?? []);
  for (const goal of ip.goal.mechanismGoals ?? []) {
    for (const id of goal.linkedFindingIds ?? []) ids.add(id);
  }
  for (const hypothesis of hypotheses) {
    for (const id of hypothesis.findingIds) ids.add(id);
    for (const id of hypothesis.counterFindingIds ?? []) ids.add(id);
  }
  return ids;
}

function selectSustainmentRecord(
  ip: ImprovementProject,
  records: readonly SustainmentRecord[] | undefined
): SustainmentRecord | undefined {
  const live = (records ?? []).filter(record => record.deletedAt === null);
  return (
    live.find(record => record.id === ip.sections.outcomeReference.sustainmentRecordId) ??
    live.find(record => record.improvementProjectId === ip.id) ??
    live.find(record => record.investigationId === ip.metadata.investigationId)
  );
}

function selectControlHandoff(
  ip: ImprovementProject,
  handoffs: readonly ControlHandoff[] | undefined,
  sustainmentRecord?: SustainmentRecord
): ControlHandoff | undefined {
  const live = (handoffs ?? []).filter(handoff => handoff.deletedAt === null);
  return (
    live.find(handoff => handoff.id === ip.sections.outcomeReference.controlHandoffId) ??
    live.find(handoff => handoff.id === sustainmentRecord?.controlHandoffId) ??
    live.find(handoff => handoff.investigationId === ip.metadata.investigationId)
  );
}

export function selectIPReportScope(input: IPReportScopeInput): IPReportScope {
  const hypothesisIds = linkedHypothesisIds(input.ip);
  const hypotheses = input.hypotheses.filter(hypothesis => hypothesisIds.has(hypothesis.id));
  const findingIds = linkedFindingIds(input.ip, hypotheses);
  const findings = input.findings.filter(finding => findingIds.has(finding.id));
  const questionIds = new Set<string>();
  for (const hypothesis of hypotheses) {
    for (const id of hypothesis.questionIds) questionIds.add(id);
  }
  for (const finding of findings) {
    if (finding.questionId) questionIds.add(finding.questionId);
  }
  const questions = input.questions.filter(question => questionIds.has(question.id));
  const sustainmentRecord = selectSustainmentRecord(input.ip, input.sustainmentRecords);
  const controlHandoff = selectControlHandoff(input.ip, input.controlHandoffs, sustainmentRecord);

  return { hypotheses, findings, questions, sustainmentRecord, controlHandoff };
}

function selectedIdeaText(question: Question): string | undefined {
  return question.ideas?.find(idea => idea.selected)?.text ?? question.ideas?.[0]?.text;
}

function actionsForCause(
  findings: readonly Finding[],
  questionIds: readonly string[]
): NonNullable<Finding['actions']> {
  const questionIdSet = new Set(questionIds);
  return findings
    .filter(finding => (finding.questionId ? questionIdSet.has(finding.questionId) : false))
    .flatMap(finding => finding.actions ?? []);
}

function actionProgressLabel(actions: NonNullable<Finding['actions']>): string {
  if (actions.length === 0) return 'No actions recorded';
  const done = actions.filter(
    action => action.status === 'done' || action.completedAt != null
  ).length;
  return `${done} of ${actions.length} actions done`;
}

function verificationLabel(record?: SustainmentRecord): string {
  if (!record) return 'Verification pending';
  const verdict = record.latestVerdict
    ? `Sustainment ${record.latestVerdict}`
    : 'Sustainment pending';
  return `${verdict} · ${record.consecutiveOnTargetTicks ?? 0} ticks`;
}

export function deriveIPCauseRows(input: {
  ip: ImprovementProject;
  hypotheses: readonly Hypothesis[];
  findings: readonly Finding[];
  questions: readonly Question[];
  sustainmentRecord?: SustainmentRecord;
}): IPCauseRow[] {
  const hypothesisIds = linkedHypothesisIds(input.ip);
  return input.hypotheses
    .filter(hypothesis => hypothesisIds.has(hypothesis.id))
    .map(hypothesis => {
      const causeQuestions = input.questions.filter(question =>
        hypothesis.questionIds.includes(question.id)
      );
      const causeFindings = input.findings.filter(finding =>
        hypothesis.findingIds.includes(finding.id)
      );
      const actions = actionsForCause(input.findings, hypothesis.questionIds);
      return {
        hypothesisId: hypothesis.id,
        title: hypothesis.name,
        synthesis: hypothesis.synthesis,
        selectedIdea: causeQuestions.map(selectedIdeaText).find(Boolean),
        actionProgressLabel: actionProgressLabel(actions),
        verificationLabel: verificationLabel(input.sustainmentRecord),
        findingCount: causeFindings.length,
        miniChartType: deriveIPReportMiniChartType({
          ip: input.ip,
          hypothesis,
          linkedFindings: causeFindings,
          // Legacy first-outcome access — multi-outcome report rendering is a later phase
          // (Spec 2 §3.2.2 / PR-CCJ-C1).
          outcome: input.ip.goal.outcomeGoals[0]?.outcomeSpecId ?? '',
        }),
      };
    });
}

function goalItems(ip: ImprovementProject): string[] {
  // Multi-outcome aware: one "Outcome target: X" line per outcome.
  const items = ip.goal.outcomeGoals.map(g => `Outcome target: ${g.target}`);
  for (const control of ip.goal.factorControls ?? []) {
    items.push(`${control.factor}: ${control.targetCondition}`);
  }
  for (const mechanism of ip.goal.mechanismGoals ?? []) {
    items.push(mechanism.description);
  }
  return items;
}

export function deriveIPReportNarrative(input: {
  ip: ImprovementProject;
  hypotheses: readonly Hypothesis[];
  findings: readonly Finding[];
  questions: readonly Question[];
  sustainmentRecord?: SustainmentRecord;
  controlHandoff?: ControlHandoff;
}): IPReportOverviewSection[] {
  const causeRows = deriveIPCauseRows(input);
  const refuted = input.hypotheses.filter(hypothesis => hypothesis.status === 'refuted');
  const inProgress = causeRows.filter(row => !row.actionProgressLabel.startsWith('1 of 1'));
  const learnedItems = [
    ...(input.controlHandoff
      ? [`Standardized in ${input.controlHandoff.systemName}: ${input.controlHandoff.description}`]
      : []),
    ...(input.ip.reflection ? [input.ip.reflection] : []),
    ...refuted.map(hypothesis => `Ruled out: ${hypothesis.name}`),
  ];

  return [
    {
      title: 'Executive summary',
      items: [`${input.ip.metadata.title} is ${input.ip.status}.`],
    },
    {
      title: 'Where we started',
      items: input.ip.sections.background.snapshotText
        ? [input.ip.sections.background.snapshotText]
        : ['Starting capability snapshot not recorded yet.'],
    },
    {
      title: 'What we aimed for',
      items: goalItems(input.ip),
    },
    {
      title: 'What we found + what we did',
      items: causeRows.map(row => {
        const idea = row.selectedIdea ? ` Tried: ${row.selectedIdea}.` : '';
        return `${row.title}: ${row.synthesis}${idea}`;
      }),
    },
    {
      title: 'Did it work?',
      items: [
        verificationLabel(input.sustainmentRecord),
        ...(input.sustainmentRecord?.nextReviewDue
          ? [`Next review: ${input.sustainmentRecord.nextReviewDue}`]
          : []),
      ],
    },
    {
      title: 'What we standardized + learned',
      items:
        learnedItems.length > 0
          ? learnedItems
          : ['No standard work or learning note recorded yet.'],
    },
    {
      title: "What's next",
      items:
        inProgress.length > 0
          ? inProgress.map(row => `${row.title}: ${row.actionProgressLabel}`)
          : ['Continue cadence review and watch for new Survey hints.'],
    },
  ];
}

function daysSince(start: number, now: number): number {
  return Math.max(0, Math.floor((now - start) / 86_400_000));
}

function lastActivity(ip: ImprovementProject, record?: SustainmentRecord): number {
  return Math.max(ip.updatedAt, record?.updatedAt ?? 0);
}

function cadenceLabel(record?: SustainmentRecord): string {
  if (!record) return 'No cadence';
  return record.nextReviewDue ? `${record.cadence} · due ${record.nextReviewDue}` : record.cadence;
}

function driftLabel(record?: SustainmentRecord): string {
  if (!record) return 'No sustainment record';
  if (record.status === 'drifted' || record.latestVerdict === 'drifting') return 'Drift detected';
  if (record.latestVerdict === 'holding') return 'Holding';
  return record.latestVerdict ?? record.status;
}

function capabilitySummary(
  hub: ProcessHub,
  projects: readonly ImprovementProject[]
): HubCapabilitySummary {
  if (projects.length === 0) return { kind: 'empty', label: 'No Improvement Projects yet' };
  // Flatten the outcome-spec lists across all projects, then dedupe.
  // Multi-outcome IPs contribute multiple spec ids; missing first entries are skipped.
  const outcomeSpecIds = unique(
    projects.flatMap(project => project.goal.outcomeGoals.map(g => g.outcomeSpecId))
  );
  if (outcomeSpecIds.length === 1) {
    const outcome = hub.outcomes?.find(candidate => candidate.id === outcomeSpecIds[0]);
    return { kind: 'single-spec', label: outcome?.columnName ?? outcomeSpecIds[0] };
  }
  return {
    kind: 'distribution',
    label: `${outcomeSpecIds.length} outcome specs · show distributions`,
  };
}

export function deriveHubPortfolioReport(input: {
  hub: ProcessHub;
  now?: number;
}): HubPortfolioReport {
  const now = input.now ?? Date.now();
  const projects = liveProjects(input.hub.improvementProjects);
  const records = (input.hub.sustainmentRecords ?? []).filter(record => record.deletedAt === null);
  const rows = projects
    .map(project => {
      const record = selectSustainmentRecord(project, records);
      return {
        id: project.id,
        title: project.metadata.title,
        status: project.status,
        dayCounter: daysSince(project.createdAt, now),
        lastActivityAt: lastActivity(project, record),
        cadenceLabel: cadenceLabel(record),
        driftLabel: driftLabel(record),
      };
    })
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  const withHoldingCadence = rows.filter(row => row.driftLabel === 'Holding').length;
  const cadenceHealthLabel =
    rows.length === 0 ? 'No cadence data' : `${withHoldingCadence} of ${rows.length} holding`;

  return {
    rows,
    capabilitySummary: capabilitySummary(input.hub, projects),
    cadenceHealthLabel,
    driftSignalCount: rows.filter(row => row.driftLabel === 'Drift detected').length,
  };
}
