import type { Finding, Hypothesis } from '../findings/types';
import { groupHypothesesByStatus } from '../findings/helpers';
import {
  humanizeAutoMintedReportLabel,
  humanizeReportFindingLabel,
  isAutoMintedReportLabel,
} from './reportHumanizer';
import { deriveIPReportMiniChartType, type IPReportMiniChartType } from '../findings/miniChart';
import type { ImprovementProject } from '../improvementProject';
import type { ControlHandoff, ControlRecord } from '../control';

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
  controlRecords?: readonly ControlRecord[];
  controlHandoffs?: readonly ControlHandoff[];
}

export interface IPReportScope {
  hypotheses: Hypothesis[];
  findings: Finding[];
  controlRecord?: ControlRecord;
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

/** Findings enter the Report via their hypothesis linkage + goal mechanism links (PO-5). */
function reportFindingIds(ip: ImprovementProject, hypotheses: readonly Hypothesis[]): Set<string> {
  const ids = new Set<string>();
  for (const goal of ip.goal.mechanismGoals ?? []) {
    for (const id of goal.linkedFindingIds ?? []) ids.add(id);
  }
  for (const hypothesis of hypotheses) {
    for (const id of hypothesis.findingIds) ids.add(id);
    for (const id of hypothesis.counterFindingIds ?? []) ids.add(id);
  }
  return ids;
}

function selectControlRecord(
  ip: ImprovementProject,
  records: readonly ControlRecord[] | undefined
): ControlRecord | undefined {
  const live = (records ?? []).filter(record => record.deletedAt === null);
  return (
    live.find(record => record.id === ip.sections.outcomeReference.sustainmentRecordId) ??
    live.find(record => record.improvementProjectId === ip.id) ??
    live.find(record => record.projectId === ip.metadata.projectId)
  );
}

function selectControlHandoff(
  ip: ImprovementProject,
  handoffs: readonly ControlHandoff[] | undefined,
  controlRecord?: ControlRecord
): ControlHandoff | undefined {
  const live = (handoffs ?? []).filter(handoff => handoff.deletedAt === null);
  return (
    live.find(handoff => handoff.id === ip.sections.outcomeReference.controlHandoffId) ??
    live.find(handoff => handoff.id === controlRecord?.controlHandoffId) ??
    live.find(handoff => handoff.projectId === ip.metadata.projectId)
  );
}

export function selectIPReportScope(input: IPReportScopeInput): IPReportScope {
  // PO-5: the Report composes from analyst-owned status (CS-10), not lineage
  // membership. Under Project⟷Hub 1:1 (IM-0a) the document boundary IS the
  // project boundary — every live hypothesis has a Report destination
  // (narrative / tested-and-excluded / open questions per its status).
  const hypotheses = [...input.hypotheses];
  const findingIds = reportFindingIds(input.ip, hypotheses);
  const findings = input.findings.filter(finding => findingIds.has(finding.id));
  const controlRecord = selectControlRecord(input.ip, input.controlRecords);
  const controlHandoff = selectControlHandoff(input.ip, input.controlHandoffs, controlRecord);

  return { hypotheses, findings, controlRecord, controlHandoff };
}

function selectedIdeaText(hypothesis: Hypothesis): string | undefined {
  return hypothesis.ideas?.find(idea => idea.selected)?.text ?? hypothesis.ideas?.[0]?.text;
}

/** Actions across the findings linked to a hypothesis (ADR-085: cause ↔ findings). */
function actionsForCause(
  findings: readonly Finding[],
  findingIds: readonly string[]
): NonNullable<Finding['actions']> {
  const findingIdSet = new Set(findingIds);
  return findings
    .filter(finding => findingIdSet.has(finding.id))
    .flatMap(finding => finding.actions ?? []);
}

function actionProgressLabel(actions: NonNullable<Finding['actions']>): string {
  if (actions.length === 0) return 'No actions recorded';
  const done = actions.filter(
    action => action.status === 'done' || action.completedAt != null
  ).length;
  return `${done} of ${actions.length} actions done`;
}

function verificationLabel(record?: ControlRecord): string {
  if (!record) return 'Verification pending';
  if (record.status === 'confirmed-sustained') return 'Control confirmed sustained';
  if (record.status === 'drifted') return 'Control drift detected';
  return 'Control verifying';
}

function reportCauseTitle(hypothesis: Hypothesis, findings: readonly Finding[]): string {
  if (!isAutoMintedReportLabel(hypothesis.name)) return hypothesis.name;
  const linked = findings.find(finding => hypothesis.findingIds.includes(finding.id));
  return linked
    ? humanizeReportFindingLabel(linked)
    : humanizeAutoMintedReportLabel(hypothesis.name);
}

export function deriveIPCauseRows(input: {
  ip: ImprovementProject;
  hypotheses: readonly Hypothesis[];
  findings: readonly Finding[];
  controlRecord?: ControlRecord;
}): IPCauseRow[] {
  // PO-5: cause rows key on analyst-owned status — evidence that survived
  // testing plus evidenced mechanisms. Refuted → tested-and-excluded;
  // proposed/needs-disconfirmation → open questions (deriveIPReportNarrative).
  const groups = groupHypothesesByStatus(input.hypotheses);
  const causeHypotheses = [...groups['evidence-survived-test'], ...groups['evidenced']];
  return causeHypotheses.map(hypothesis => {
    const causeFindings = input.findings.filter(finding =>
      hypothesis.findingIds.includes(finding.id)
    );
    const actions = actionsForCause(input.findings, hypothesis.findingIds);
    return {
      hypothesisId: hypothesis.id,
      title: reportCauseTitle(hypothesis, causeFindings),
      synthesis: hypothesis.synthesis,
      selectedIdea: selectedIdeaText(hypothesis),
      actionProgressLabel: actionProgressLabel(actions),
      verificationLabel: verificationLabel(input.controlRecord),
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
  controlRecord?: ControlRecord;
  controlHandoff?: ControlHandoff;
}): IPReportOverviewSection[] {
  const causeRows = deriveIPCauseRows(input);
  const groups = groupHypothesesByStatus(input.hypotheses);
  const refuted = groups['refuted'];
  const openQuestions = [...groups['proposed'], ...groups['needs-disconfirmation']];
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
        verificationLabel(input.controlRecord),
        ...(input.controlRecord?.nextCheckSuggestedAt
          ? [`Next suggested re-check: ${input.controlRecord.nextCheckSuggestedAt}`]
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
      items: [
        ...inProgress.map(row => `${row.title}: ${row.actionProgressLabel}`),
        ...openQuestions.map(hypothesis => `Open question: ${hypothesis.name}`),
        ...(inProgress.length === 0 && openQuestions.length === 0
          ? ['Continue planned re-checks and watch for new Survey hints.']
          : []),
      ],
    },
  ];
}
