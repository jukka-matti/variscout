import { useMemo } from 'react';
import type { CausalLink, Finding, Hypothesis } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import { selectHypothesisTributaries } from '@variscout/stores';

export type CanvasOverlayId = 'investigations' | 'hypotheses' | 'hypothesis-hubs' | 'findings';

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
  'hypothesis-hubs': {
    id: 'hypothesis-hubs',
    label: 'Hypothesis hubs',
    enabled: true,
    description: 'Promoted suspected causes rendered as step markers.',
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

export type CanvasAnalyzeFocus =
  | { kind: 'finding'; id: string }
  | { kind: 'suspected-cause'; id: string }
  | { kind: 'causal-link'; id: string };

export interface CanvasOverlayFindingItem {
  id: string;
  text: string;
  status: Finding['status'];
  focus: CanvasAnalyzeFocus;
}

export interface CanvasOverlayHypothesisItem {
  id: string;
  name: string;
  status: Hypothesis['status'];
  focus: CanvasAnalyzeFocus;
}

export interface CanvasOverlayCausalLinkItem {
  id: string;
  fromStepId: string;
  toStepId: string;
  label: string;
  focus: CanvasAnalyzeFocus;
}

export interface CanvasStepAnalyzeOverlay {
  stepId: string;
  findings: CanvasOverlayFindingItem[];
  hypotheses: CanvasOverlayHypothesisItem[];
  causalLinks: CanvasOverlayCausalLinkItem[];
  investigationCounts: {
    open: number;
    supported: number;
    refuted: number;
  };
}

export interface CanvasAnalyzeOverlayModel {
  byStep: Record<string, CanvasStepAnalyzeOverlay>;
  arrows: CanvasOverlayCausalLinkItem[];
  unresolved: {
    findings: string[];
    hypotheses: string[];
    causalLinks: string[];
  };
}

export interface BuildCanvasInvestigationOverlaysArgs {
  map: ProcessMap;
  findings?: readonly Finding[];
  hypotheses?: readonly Hypothesis[];
  causalLinks?: readonly CausalLink[];
}

export type UseCanvasAnalyzeOverlaysArgs = BuildCanvasInvestigationOverlaysArgs;

function emptyStepOverlay(stepId: string): CanvasStepAnalyzeOverlay {
  return {
    stepId,
    findings: [],
    hypotheses: [],
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
  byStep: Record<string, CanvasStepAnalyzeOverlay>
): string[] {
  return steps.filter(stepId => Boolean(byStep[stepId]));
}

function addUnique<T extends { id: string }>(items: T[], item: T): void {
  if (!items.some(existing => existing.id === item.id)) items.push(item);
}

function hubStepIds({
  hub,
  findings,
  map,
  columnMap,
}: {
  hub: Hypothesis;
  findings: readonly Finding[];
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
  for (const findingId of hub.findingIds) {
    const finding = findings.find(f => f.id === findingId);
    if (!finding) continue;
    for (const column of Object.keys(finding.context?.activeFilters ?? {})) columns.add(column);
  }
  return stepsForColumns(columns, columnMap);
}

function isPromotedHub(hub: Hypothesis): boolean {
  return hub.status !== 'refuted';
}

function hubOwnsLink(hub: Hypothesis, link: CausalLink): boolean {
  if (link.hypothesisId && link.hypothesisId === hub.id) return true;
  return link.findingIds.some(id => hub.findingIds.includes(id));
}

export function buildCanvasAnalyzeOverlays({
  map,
  findings = [],
  hypotheses = [],
  causalLinks = [],
}: BuildCanvasInvestigationOverlaysArgs): CanvasAnalyzeOverlayModel {
  const columnMap = stepColumnMap(map);
  const byStep: Record<string, CanvasStepAnalyzeOverlay> = {};
  for (const node of map.nodes) byStep[node.id] = emptyStepOverlay(node.id);

  const unresolved = {
    findings: [] as string[],
    hypotheses: [] as string[],
    causalLinks: [] as string[],
  };

  const hubSteps = new Map<string, string[]>();
  for (const hub of hypotheses) {
    const steps = validStepIds(hubStepIds({ hub, findings, map, columnMap }), byStep);
    hubSteps.set(hub.id, steps);
    if (steps.length === 0) unresolved.hypotheses.push(hub.id);
  }

  for (const finding of findings) {
    // PRIMARY: column-derived step mapping (chart-captured findings), falling
    // back to linked-hub steps. PR-CS-5 Part 2: this stays the primary key so
    // existing/chart-captured findings still appear on their column-derived step.
    let steps = validStepIds(
      stepsForColumns(Object.keys(finding.context?.activeFilters ?? {}), columnMap),
      byStep
    );
    if (steps.length === 0) {
      const linkedHubSteps = hypotheses
        .filter(hub => hub.findingIds.includes(finding.id))
        .flatMap(hub => hubSteps.get(hub.id) ?? []);
      steps = validStepIds(uniqueStepIds(linkedHubSteps), byStep);
    }
    // UNION: step-captured findings (PR-CS-5 Part 2) ALSO surface on their
    // origin step, on top of any column-derived steps (deduped below via
    // addUnique). originStepId is never the sole key — that would regress the
    // column-derivation that is the whole point of this overlay.
    if (finding.originStepId && byStep[finding.originStepId]) {
      steps = uniqueStepIds([...steps, finding.originStepId]);
    }
    if (steps.length === 0) {
      unresolved.findings.push(finding.id);
      continue;
    }
    const item: CanvasOverlayFindingItem = {
      id: finding.id,
      text: finding.text,
      status: finding.status,
      focus: { kind: 'finding', id: finding.id },
    };
    for (const stepId of steps) {
      const step = byStep[stepId];
      if (!step) continue;
      addUnique(step.findings, item);
    }
  }

  for (const hub of hypotheses) {
    const steps = validStepIds(hubSteps.get(hub.id) ?? [], byStep);
    if (steps.length === 0) continue;
    const item: CanvasOverlayHypothesisItem = {
      id: hub.id,
      name: hub.name,
      status: hub.status,
      focus: {
        kind: 'suspected-cause',
        id: hub.id,
      },
    };
    for (const stepId of steps) {
      const step = byStep[stepId];
      if (!step) continue;
      if (isPromotedHub(hub)) addUnique(step.hypotheses, item);
      if (hub.status === 'refuted') step.investigationCounts.refuted += 1;
      else if (hub.status === 'evidence-survived-test') step.investigationCounts.supported += 1;
      else step.investigationCounts.open += 1;
    }
  }

  const promotedHubs = hypotheses.filter(isPromotedHub);
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
      focus: { kind: 'causal-link', id: link.id },
    };
    arrows.push(item);
    addUnique(byStep[fromStepId].causalLinks, item);
    addUnique(byStep[toStepId].causalLinks, item);
  }

  return { byStep, arrows, unresolved };
}

export interface UseCanvasAnalyzeOverlaysResult {
  overlays: CanvasAnalyzeOverlayModel;
}

export function useCanvasAnalyzeOverlays(
  args: UseCanvasAnalyzeOverlaysArgs
): UseCanvasAnalyzeOverlaysResult {
  const overlays = useMemo(
    () => buildCanvasAnalyzeOverlays(args),
    [args.map, args.findings, args.hypotheses, args.causalLinks]
  );
  return { overlays };
}
