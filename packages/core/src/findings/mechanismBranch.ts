import type { Finding, Hypothesis, HypothesisStatus } from './types';
import { collectReferencedColumns } from './hypothesisCondition';
import type { ProcessMap, ProcessMapTributary } from '../frame/types';
import { buildBranchSignalWarnings } from '../signalCards';
import type { BranchSignalWarning, SignalCard } from '../signalCards';

export type { BranchSignalWarning } from '../signalCards';

export interface MechanismBranchProcessContext {
  tributaries: Array<Pick<ProcessMapTributary, 'id' | 'column' | 'label'>>;
}

export interface MechanismBranchClueView {
  id: string;
  text: string;
  status: Finding['status'];
  validationStatus?: Finding['validationStatus'];
}

export interface MechanismBranchActionStateView {
  value: 'not-tested' | 'needs-check' | 'evidence-backed' | 'ready-to-act' | 'closed';
  label: string;
}

export interface MechanismBranchViewModel {
  id: string;
  hubId: string;
  suspectedMechanism: string;
  synthesis: string;
  status: HypothesisStatus;
  branchStatus: HypothesisStatus;
  readiness: MechanismBranchActionStateView;
  nextMove?: string;
  supportingClues: MechanismBranchClueView[];
  counterClues: MechanismBranchClueView[];
  notTestedClues: MechanismBranchClueView[];
  processContext?: MechanismBranchProcessContext;
  signalWarnings?: BranchSignalWarning[];
}

export interface MechanismBranchProjectionOptions {
  findings: Finding[];
  processContext?: {
    processMap?: ProcessMap;
  };
  signalCards?: SignalCard[];
}

const READINESS_LABELS: Record<MechanismBranchActionStateView['value'], string> = {
  'not-tested': 'Not tested',
  'needs-check': 'Needs check',
  'evidence-backed': 'Evidence backed',
  'ready-to-act': 'Ready to act',
  closed: 'Closed',
};

function toClueView(finding: Finding): MechanismBranchClueView {
  return {
    id: finding.id,
    text: finding.text,
    status: finding.status,
    validationStatus: finding.validationStatus,
  };
}

function deriveBranchStatus(hub: Hypothesis): HypothesisStatus {
  return hub.status;
}

function deriveReadiness(
  hub: Hypothesis,
  supportingClues: MechanismBranchClueView[],
  counterClues: MechanismBranchClueView[]
): MechanismBranchActionStateView {
  if (hub.status === 'refuted') return { value: 'closed', label: READINESS_LABELS.closed };
  if (hub.status === 'evidence-survived-test') {
    return { value: 'ready-to-act', label: READINESS_LABELS['ready-to-act'] };
  }
  if (supportingClues.length > 0 && counterClues.length === 0) {
    return { value: 'evidence-backed', label: READINESS_LABELS['evidence-backed'] };
  }
  if (supportingClues.length > 0 || counterClues.length > 0) {
    return { value: 'needs-check', label: READINESS_LABELS['needs-check'] };
  }
  return { value: 'not-tested', label: READINESS_LABELS['not-tested'] };
}

/**
 * Columns this branch is "about" — derived from the hub's disconfirmable
 * `condition` (ADR-085: factor identity comes from the condition tree), falling
 * back to the columns of its linked findings' `activeFilters` snapshots.
 */
function deriveBranchColumns(hub: Hypothesis, findings: Finding[]): Set<string> {
  if (hub.condition) {
    return collectReferencedColumns(hub.condition);
  }
  const columns = new Set<string>();
  const linkedIds = new Set(hub.findingIds);
  for (const finding of findings) {
    if (!linkedIds.has(finding.id)) continue;
    for (const column of Object.keys(finding.context.activeFilters)) {
      columns.add(column);
    }
  }
  return columns;
}

function projectProcessContext(
  hub: Hypothesis,
  branchColumns: Set<string>,
  processMap: ProcessMap | undefined
): MechanismBranchProcessContext | undefined {
  if (!processMap) return undefined;

  const explicitTributaryIds = new Set(hub.tributaryIds ?? []);
  const tributaries = processMap.tributaries
    .filter(
      tributary => explicitTributaryIds.has(tributary.id) || branchColumns.has(tributary.column)
    )
    .map(tributary => ({
      id: tributary.id,
      column: tributary.column,
      label: tributary.label,
    }));

  return tributaries.length > 0 ? { tributaries } : undefined;
}

export function projectMechanismBranch(
  hub: Hypothesis,
  options: MechanismBranchProjectionOptions
): MechanismBranchViewModel {
  const findingById = new Map(options.findings.map(finding => [finding.id, finding]));
  const explicitCounterIds = new Set(hub.counterFindingIds ?? []);
  const orderedFindingIds = [
    ...hub.findingIds,
    ...(hub.counterFindingIds ?? []).filter(id => !hub.findingIds.includes(id)),
  ];

  const supportingClues: MechanismBranchClueView[] = [];
  const counterClues: MechanismBranchClueView[] = [];
  const notTestedClues: MechanismBranchClueView[] = [];

  for (const findingId of orderedFindingIds) {
    const finding = findingById.get(findingId);
    if (!finding) continue;
    const clue = toClueView(finding);
    if (explicitCounterIds.has(finding.id) || finding.validationStatus === 'contradicts') {
      counterClues.push(clue);
    } else if (finding.validationStatus === 'inconclusive') {
      notTestedClues.push(clue);
    } else {
      supportingClues.push(clue);
    }
  }

  const branchColumns = deriveBranchColumns(hub, options.findings);

  return {
    id: hub.id,
    hubId: hub.id,
    suspectedMechanism: hub.name,
    synthesis: hub.synthesis,
    status: hub.status,
    branchStatus: deriveBranchStatus(hub),
    readiness: deriveReadiness(hub, supportingClues, counterClues),
    nextMove: hub.nextMove,
    supportingClues,
    counterClues,
    notTestedClues,
    processContext: projectProcessContext(hub, branchColumns, options.processContext?.processMap),
    signalWarnings: buildBranchSignalWarnings(hub.signalCardIds, options.signalCards),
  };
}

export function projectMechanismBranches(
  hubs: Hypothesis[],
  options: MechanismBranchProjectionOptions
): MechanismBranchViewModel[] {
  return hubs.map(hub => projectMechanismBranch(hub, options));
}
