import type {
  Finding,
  MechanismBranchReadiness,
  MechanismBranchStatus,
  Question,
  SuspectedCause,
} from './types';
import type { ProcessMap, ProcessMapTributary } from '../frame/types';

export interface MechanismBranchProcessContext {
  tributaries: Array<Pick<ProcessMapTributary, 'id' | 'column' | 'label'>>;
}

export interface MechanismBranchQuestionView {
  id: string;
  text: string;
  status: Question['status'];
  factor?: string;
  level?: string;
}

export interface MechanismBranchClueView {
  id: string;
  text: string;
  status: Finding['status'];
  validationStatus?: Finding['validationStatus'];
}

export interface MechanismBranchReadinessView {
  value: MechanismBranchReadiness;
  label: string;
}

export interface MechanismBranchViewModel {
  id: string;
  hubId: string;
  suspectedMechanism: string;
  synthesis: string;
  status: SuspectedCause['status'];
  branchStatus: MechanismBranchStatus;
  readiness: MechanismBranchReadinessView;
  nextMove?: string;
  supportingClues: MechanismBranchClueView[];
  counterClues: MechanismBranchClueView[];
  notTestedClues: MechanismBranchClueView[];
  openChecks: MechanismBranchQuestionView[];
  linkedQuestions: MechanismBranchQuestionView[];
  processContext?: MechanismBranchProcessContext;
}

export interface MechanismBranchProjectionOptions {
  questions: Question[];
  findings: Finding[];
  processContext?: {
    processMap?: ProcessMap;
  };
}

const READINESS_LABELS: Record<MechanismBranchReadiness, string> = {
  'not-tested': 'Not tested',
  'needs-check': 'Needs check',
  'evidence-backed': 'Evidence backed',
  'ready-to-act': 'Ready to act',
  closed: 'Closed',
};

function toQuestionView(question: Question): MechanismBranchQuestionView {
  return {
    id: question.id,
    text: question.text,
    status: question.status,
    factor: question.factor,
    level: question.level,
  };
}

function toClueView(finding: Finding): MechanismBranchClueView {
  return {
    id: finding.id,
    text: finding.text,
    status: finding.status,
    validationStatus: finding.validationStatus,
  };
}

function deriveBranchStatus(hub: SuspectedCause): MechanismBranchStatus {
  if (hub.branchStatus) return hub.branchStatus;
  if (hub.status === 'confirmed') return 'confirmed';
  if (hub.status === 'not-confirmed') return 'not-confirmed';
  return 'active';
}

function deriveReadiness(
  hub: SuspectedCause,
  supportingClues: MechanismBranchClueView[],
  counterClues: MechanismBranchClueView[],
  openChecks: MechanismBranchQuestionView[]
): MechanismBranchReadinessView {
  if (hub.branchReadiness) {
    return { value: hub.branchReadiness, label: READINESS_LABELS[hub.branchReadiness] };
  }
  if (hub.status === 'not-confirmed') return { value: 'closed', label: READINESS_LABELS.closed };
  if (hub.status === 'confirmed') {
    return { value: 'ready-to-act', label: READINESS_LABELS['ready-to-act'] };
  }
  if (supportingClues.length > 0 && openChecks.length === 0 && counterClues.length === 0) {
    return { value: 'evidence-backed', label: READINESS_LABELS['evidence-backed'] };
  }
  if (supportingClues.length > 0 || counterClues.length > 0 || openChecks.length > 0) {
    return { value: 'needs-check', label: READINESS_LABELS['needs-check'] };
  }
  return { value: 'not-tested', label: READINESS_LABELS['not-tested'] };
}

function projectProcessContext(
  hub: SuspectedCause,
  linkedQuestions: Question[],
  processMap: ProcessMap | undefined
): MechanismBranchProcessContext | undefined {
  if (!processMap) return undefined;

  const explicitTributaryIds = new Set(hub.tributaryIds ?? []);
  const linkedFactors = new Set(linkedQuestions.map(question => question.factor).filter(Boolean));
  const tributaries = processMap.tributaries
    .filter(
      tributary => explicitTributaryIds.has(tributary.id) || linkedFactors.has(tributary.column)
    )
    .map(tributary => ({
      id: tributary.id,
      column: tributary.column,
      label: tributary.label,
    }));

  return tributaries.length > 0 ? { tributaries } : undefined;
}

export function projectMechanismBranch(
  hub: SuspectedCause,
  options: MechanismBranchProjectionOptions
): MechanismBranchViewModel {
  const questionById = new Map(options.questions.map(question => [question.id, question]));
  const findingById = new Map(options.findings.map(finding => [finding.id, finding]));
  const explicitCounterIds = new Set(hub.counterFindingIds ?? []);
  const explicitCheckIds = new Set(hub.checkQuestionIds ?? []);
  const orderedQuestionIds = [
    ...hub.questionIds,
    ...(hub.checkQuestionIds ?? []).filter(id => !hub.questionIds.includes(id)),
  ];
  const orderedFindingIds = [
    ...hub.findingIds,
    ...(hub.counterFindingIds ?? []).filter(id => !hub.findingIds.includes(id)),
  ];

  const linkedQuestions = orderedQuestionIds
    .map(id => questionById.get(id))
    .filter((question): question is Question => Boolean(question));

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

  const openChecks = linkedQuestions
    .filter(
      question =>
        explicitCheckIds.has(question.id) ||
        question.status === 'open' ||
        question.status === 'investigating'
    )
    .map(toQuestionView);

  return {
    id: hub.id,
    hubId: hub.id,
    suspectedMechanism: hub.name,
    synthesis: hub.synthesis,
    status: hub.status,
    branchStatus: deriveBranchStatus(hub),
    readiness: deriveReadiness(hub, supportingClues, counterClues, openChecks),
    nextMove: hub.nextMove,
    supportingClues,
    counterClues,
    notTestedClues,
    openChecks,
    linkedQuestions: linkedQuestions.map(toQuestionView),
    processContext: projectProcessContext(hub, linkedQuestions, options.processContext?.processMap),
  };
}

export function projectMechanismBranches(
  hubs: SuspectedCause[],
  options: MechanismBranchProjectionOptions
): MechanismBranchViewModel[] {
  return hubs.map(hub => projectMechanismBranch(hub, options));
}
