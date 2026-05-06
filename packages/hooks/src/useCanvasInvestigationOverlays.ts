import { useMemo } from 'react';
import type { CausalLink, Finding, Question, SuspectedCause } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import { selectHypothesisTributaries } from '@variscout/stores';

export type CanvasOverlayId = 'investigations' | 'hypotheses' | 'suspected-causes' | 'findings';

export interface CanvasOverlayDefinition {
  id: CanvasOverlayId;
  label: string;
  enabled: boolean;
  description: string;
}

export const CANVAS_OVERLAY_REGISTRY: Record<CanvasOverlayId, CanvasOverlayDefinition> = {
  investigations: {
    id: 'investigations',
    label: 'Investigations',
    enabled: true,
    description: 'Question and investigation activity projected onto process steps.',
  },
  hypotheses: {
    id: 'hypotheses',
    label: 'Hypotheses',
    enabled: true,
    description: 'Draft causal links rendered as faint step-to-step arrows.',
  },
  'suspected-causes': {
    id: 'suspected-causes',
    label: 'Suspected causes',
    enabled: true,
    description: 'Promoted mechanism branches rendered as step markers.',
  },
  findings: {
    id: 'findings',
    label: 'Findings',
    enabled: true,
    description: 'Recent finding pins anchored to process steps.',
  },
};

export function enabledCanvasOverlays(): CanvasOverlayDefinition[] {
  return Object.values(CANVAS_OVERLAY_REGISTRY).filter(overlay => overlay.enabled);
}

export function coerceCanvasOverlays(values: readonly unknown[]): CanvasOverlayId[] {
  const out: CanvasOverlayId[] = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const overlay = CANVAS_OVERLAY_REGISTRY[value as CanvasOverlayId];
    if (overlay?.enabled && !out.includes(overlay.id)) out.push(overlay.id);
  }
  return out;
}

export type CanvasInvestigationFocus =
  | { kind: 'question'; id: string; questionId: string }
  | { kind: 'finding'; id: string; questionId?: string }
  | { kind: 'suspected-cause'; id: string; questionId?: string }
  | { kind: 'causal-link'; id: string; questionId?: string };

export interface CanvasOverlayQuestionItem {
  id: string;
  text: string;
  status: Question['status'];
  factor?: string;
  focus: CanvasInvestigationFocus;
}

export interface CanvasOverlayFindingItem {
  id: string;
  text: string;
  status: Finding['status'];
  questionId?: string;
  focus: CanvasInvestigationFocus;
}

export interface CanvasOverlaySuspectedCauseItem {
  id: string;
  name: string;
  status: SuspectedCause['status'];
  questionId?: string;
  focus: CanvasInvestigationFocus;
}

export interface CanvasOverlayCausalLinkItem {
  id: string;
  fromStepId: string;
  toStepId: string;
  label: string;
  questionId?: string;
  focus: CanvasInvestigationFocus;
}

export interface CanvasStepInvestigationOverlay {
  stepId: string;
  questions: CanvasOverlayQuestionItem[];
  findings: CanvasOverlayFindingItem[];
  suspectedCauses: CanvasOverlaySuspectedCauseItem[];
  causalLinks: CanvasOverlayCausalLinkItem[];
  investigationCounts: {
    open: number;
    supported: number;
    refuted: number;
  };
}

export interface CanvasInvestigationOverlayModel {
  byStep: Record<string, CanvasStepInvestigationOverlay>;
  arrows: CanvasOverlayCausalLinkItem[];
  unresolved: {
    questions: string[];
    findings: string[];
    suspectedCauses: string[];
    causalLinks: string[];
  };
}

export interface BuildCanvasInvestigationOverlaysArgs {
  map: ProcessMap;
  questions?: readonly Question[];
  findings?: readonly Finding[];
  suspectedCauses?: readonly SuspectedCause[];
  causalLinks?: readonly CausalLink[];
}

export type UseCanvasInvestigationOverlaysArgs = BuildCanvasInvestigationOverlaysArgs;

function emptyStepOverlay(stepId: string): CanvasStepInvestigationOverlay {
  return {
    stepId,
    questions: [],
    findings: [],
    suspectedCauses: [],
    causalLinks: [],
    investigationCounts: { open: 0, supported: 0, refuted: 0 },
  };
}

function stepColumnMap(map: ProcessMap): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const add = (column: string, stepId: string): void => {
    const set = out.get(column) ?? new Set<string>();
    set.add(stepId);
    out.set(column, set);
  };
  for (const [column, stepId] of Object.entries(map.assignments ?? {})) add(column, stepId);
  for (const tributary of map.tributaries) add(tributary.column, tributary.stepId);
  for (const node of map.nodes) {
    if (node.ctqColumn) add(node.ctqColumn, node.id);
  }
  return out;
}

function uniqueStepIds(ids: Iterable<string>): string[] {
  return Array.from(new Set(ids)).sort();
}

function stepsForColumns(columns: Iterable<string>, columnMap: Map<string, Set<string>>): string[] {
  const out: string[] = [];
  for (const column of columns) {
    const steps = columnMap.get(column);
    if (!steps) continue;
    out.push(...steps);
  }
  return uniqueStepIds(out);
}

function validStepIds(
  steps: readonly string[],
  byStep: Record<string, CanvasStepInvestigationOverlay>
): string[] {
  return steps.filter(stepId => Boolean(byStep[stepId]));
}

function addUnique<T extends { id: string }>(items: T[], item: T): void {
  if (!items.some(existing => existing.id === item.id)) items.push(item);
}

function primaryQuestionId(ids: readonly string[]): string | undefined {
  return ids.length > 0 ? ids[0] : undefined;
}

function hubStepIds({
  hub,
  findings,
  questions,
  map,
  columnMap,
}: {
  hub: SuspectedCause;
  findings: readonly Finding[];
  questions: readonly Question[];
  map: ProcessMap;
  columnMap: Map<string, Set<string>>;
}): string[] {
  if (hub.tributaryIds && hub.tributaryIds.length > 0) {
    const ids = new Set(hub.tributaryIds);
    return uniqueStepIds(map.tributaries.filter(t => ids.has(t.id)).map(t => t.stepId));
  }

  const tributaries = selectHypothesisTributaries(hub, [...findings], map);
  if (tributaries.length > 0) return uniqueStepIds(tributaries.map(t => t.stepId));

  const columns = new Set<string>();
  for (const questionId of hub.questionIds) {
    const question = questions.find(q => q.id === questionId);
    if (question?.factor) columns.add(question.factor);
  }
  for (const findingId of hub.findingIds) {
    const finding = findings.find(f => f.id === findingId);
    if (!finding) continue;
    for (const column of Object.keys(finding.context?.activeFilters ?? {})) columns.add(column);
    const question = finding.questionId ? questions.find(q => q.id === finding.questionId) : null;
    if (question?.factor) columns.add(question.factor);
  }
  return stepsForColumns(columns, columnMap);
}

function isPromotedHub(hub: SuspectedCause): boolean {
  return hub.status === 'suspected' || hub.status === 'confirmed';
}

function hubOwnsLink(hub: SuspectedCause, link: CausalLink): boolean {
  if (link.suspectedCauseId && link.suspectedCauseId === hub.id) return true;
  return (
    link.questionIds.some(id => hub.questionIds.includes(id)) ||
    link.findingIds.some(id => hub.findingIds.includes(id))
  );
}

export function buildCanvasInvestigationOverlays({
  map,
  questions = [],
  findings = [],
  suspectedCauses = [],
  causalLinks = [],
}: BuildCanvasInvestigationOverlaysArgs): CanvasInvestigationOverlayModel {
  const columnMap = stepColumnMap(map);
  const byStep: Record<string, CanvasStepInvestigationOverlay> = {};
  for (const node of map.nodes) byStep[node.id] = emptyStepOverlay(node.id);

  const unresolved = {
    questions: [] as string[],
    findings: [] as string[],
    suspectedCauses: [] as string[],
    causalLinks: [] as string[],
  };

  const hubSteps = new Map<string, string[]>();
  for (const hub of suspectedCauses) {
    const steps = validStepIds(hubStepIds({ hub, findings, questions, map, columnMap }), byStep);
    hubSteps.set(hub.id, steps);
    if (steps.length === 0) unresolved.suspectedCauses.push(hub.id);
  }

  for (const question of questions) {
    const steps = question.factor
      ? validStepIds(stepsForColumns([question.factor], columnMap), byStep)
      : [];
    if (steps.length === 0) {
      unresolved.questions.push(question.id);
      continue;
    }
    const item: CanvasOverlayQuestionItem = {
      id: question.id,
      text: question.text,
      status: question.status,
      factor: question.factor,
      focus: { kind: 'question', id: question.id, questionId: question.id },
    };
    for (const stepId of steps) {
      const step = byStep[stepId];
      if (!step) continue;
      addUnique(step.questions, item);
      if (question.status === 'ruled-out') step.investigationCounts.refuted += 1;
      else if (question.status === 'answered') step.investigationCounts.supported += 1;
      else step.investigationCounts.open += 1;
    }
  }

  for (const finding of findings) {
    let steps = validStepIds(
      stepsForColumns(Object.keys(finding.context?.activeFilters ?? {}), columnMap),
      byStep
    );
    const linkedQuestion = finding.questionId
      ? questions.find(question => question.id === finding.questionId)
      : undefined;
    if (steps.length === 0 && linkedQuestion?.factor) {
      steps = validStepIds(stepsForColumns([linkedQuestion.factor], columnMap), byStep);
    }
    if (steps.length === 0) {
      const linkedHubSteps = suspectedCauses
        .filter(hub => hub.findingIds.includes(finding.id))
        .flatMap(hub => hubSteps.get(hub.id) ?? []);
      steps = validStepIds(uniqueStepIds(linkedHubSteps), byStep);
    }
    if (steps.length === 0) {
      unresolved.findings.push(finding.id);
      continue;
    }
    const item: CanvasOverlayFindingItem = {
      id: finding.id,
      text: finding.text,
      status: finding.status,
      questionId: finding.questionId,
      focus: { kind: 'finding', id: finding.id, questionId: finding.questionId },
    };
    for (const stepId of steps) {
      const step = byStep[stepId];
      if (!step) continue;
      addUnique(step.findings, item);
    }
  }

  for (const hub of suspectedCauses) {
    const steps = validStepIds(hubSteps.get(hub.id) ?? [], byStep);
    if (steps.length === 0) continue;
    const item: CanvasOverlaySuspectedCauseItem = {
      id: hub.id,
      name: hub.name,
      status: hub.status,
      questionId: primaryQuestionId(hub.questionIds),
      focus: {
        kind: 'suspected-cause',
        id: hub.id,
        questionId: primaryQuestionId(hub.questionIds),
      },
    };
    for (const stepId of steps) {
      const step = byStep[stepId];
      if (!step) continue;
      if (isPromotedHub(hub)) addUnique(step.suspectedCauses, item);
      if (hub.status === 'not-confirmed') step.investigationCounts.refuted += 1;
      else if (hub.status === 'confirmed') step.investigationCounts.supported += 1;
      else step.investigationCounts.open += 1;
    }
  }

  const promotedHubs = suspectedCauses.filter(isPromotedHub);
  const arrows: CanvasOverlayCausalLinkItem[] = [];
  for (const link of causalLinks) {
    if (promotedHubs.some(hub => hubOwnsLink(hub, link))) continue;
    const fromSteps = validStepIds(stepsForColumns([link.fromFactor], columnMap), byStep);
    const toSteps = validStepIds(stepsForColumns([link.toFactor], columnMap), byStep);
    const fromStepId = fromSteps[0];
    const toStepId = toSteps[0];
    if (!fromStepId || !toStepId || fromStepId === toStepId) {
      unresolved.causalLinks.push(link.id);
      continue;
    }
    const item: CanvasOverlayCausalLinkItem = {
      id: link.id,
      fromStepId,
      toStepId,
      label: link.whyStatement,
      questionId: primaryQuestionId(link.questionIds),
      focus: { kind: 'causal-link', id: link.id, questionId: primaryQuestionId(link.questionIds) },
    };
    arrows.push(item);
    addUnique(byStep[fromStepId].causalLinks, item);
    addUnique(byStep[toStepId].causalLinks, item);
  }

  return { byStep, arrows, unresolved };
}

export interface UseCanvasInvestigationOverlaysResult {
  overlays: CanvasInvestigationOverlayModel;
}

export function useCanvasInvestigationOverlays(
  args: UseCanvasInvestigationOverlaysArgs
): UseCanvasInvestigationOverlaysResult {
  const overlays = useMemo(
    () => buildCanvasInvestigationOverlays(args),
    [args.map, args.questions, args.findings, args.suspectedCauses, args.causalLinks]
  );
  return { overlays };
}
