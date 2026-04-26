import type { SurveyStatus } from './survey/types';

export type SignalTrustGrade = 'strong' | 'usable' | 'weak' | 'unknown';
export type SignalPowerStatus = 'adequate' | 'limited' | 'not-studied' | 'unknown';
export type SignalSourceArchetype =
  | 'measurement'
  | 'process-clock'
  | 'categorical-factor'
  | 'human-judgment'
  | 'system-log'
  | 'procedural'
  | 'unknown';
export type MeasurementStudyStatus = 'passed' | 'needed' | 'failed' | 'not-required' | 'unknown';
export type SignalRole = 'outcome' | 'factor' | 'time-batch' | 'guardrail' | 'derived';

export interface SignalCard {
  id: string;
  signalName: string;
  aliases?: string[];
  role: SignalRole;
  archetype: SignalSourceArchetype;
  trustGrade: SignalTrustGrade;
  powerStatus: SignalPowerStatus;
  studyStatus: MeasurementStudyStatus;
  operationalDefinition?: string;
  source?: string;
  updatedAt?: string;
}

export interface SignalMeasurementNextMove {
  id: string;
  signalCardId: string;
  signalName: string;
  kind: 'define-operationally' | 'improve-trust' | 'run-study';
  title: string;
  detail: string;
}

function normalizeSignalName(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

export function matchSignalCard(
  cards: SignalCard[] | undefined,
  signalName: string | null | undefined,
  role?: SignalRole
): SignalCard | undefined {
  const normalized = signalName ? normalizeSignalName(signalName) : '';
  if (!normalized) return undefined;

  return (cards ?? []).find(card => {
    if (role && card.role !== role) return false;
    const names = [card.signalName, ...(card.aliases ?? [])].map(normalizeSignalName);
    return names.includes(normalized);
  });
}

export function signalTrustLabel(card: SignalCard | undefined): string {
  if (!card) return 'Advisory';
  const labels: Record<SignalTrustGrade, string> = {
    strong: 'Strong',
    usable: 'Usable',
    weak: 'Weak',
    unknown: 'Unknown',
  };
  return labels[card.trustGrade];
}

export function signalTrustStatus(card: SignalCard | undefined): SurveyStatus {
  if (!card) return 'can-do-with-caution';
  if (card.trustGrade === 'strong' && card.powerStatus === 'adequate') return 'can-do-now';
  if (card.trustGrade === 'weak' || card.powerStatus === 'not-studied') return 'ask-for-next';
  return 'can-do-with-caution';
}

export function signalWeakLink(card: SignalCard | undefined, fallback: string): string {
  if (!card) return fallback;
  if (card.operationalDefinition) return card.operationalDefinition;
  if (card.trustGrade === 'weak') return 'Signal trust is weak; confirm source and definition.';
  if (card.studyStatus === 'needed') return 'Measurement study is needed before strong claims.';
  return 'Signal Card exists, but operational detail is incomplete.';
}

export function buildSignalMeasurementNextMoves(cards: SignalCard[]): SignalMeasurementNextMove[] {
  const moves: SignalMeasurementNextMove[] = [];

  for (const card of cards) {
    if (!card.operationalDefinition) {
      moves.push({
        id: `signal:${card.id}:define-operationally`,
        signalCardId: card.id,
        signalName: card.signalName,
        kind: 'define-operationally',
        title: `Define ${card.signalName}`,
        detail: 'Add an operational definition before treating this signal as stable evidence.',
      });
      continue;
    }
    if (card.trustGrade === 'weak' || card.trustGrade === 'unknown') {
      moves.push({
        id: `signal:${card.id}:improve-trust`,
        signalCardId: card.id,
        signalName: card.signalName,
        kind: 'improve-trust',
        title: `Improve trust for ${card.signalName}`,
        detail: 'Confirm source, collection logic, and known failure modes for this signal.',
      });
      continue;
    }
    if (card.studyStatus === 'needed' || card.studyStatus === 'failed') {
      moves.push({
        id: `signal:${card.id}:run-study`,
        signalCardId: card.id,
        signalName: card.signalName,
        kind: 'run-study',
        title: `Run a measurement study for ${card.signalName}`,
        detail: 'Complete the required measurement check before using this as strong evidence.',
      });
    }
  }

  return moves;
}

export interface BranchSignalWarning {
  signalCardId: string;
  signalName: string;
  severity: 'weak' | 'unknown' | 'undefined';
  message: string;
}

export function buildBranchSignalWarnings(
  signalCardIds: string[] | undefined,
  cards: SignalCard[] | undefined
): BranchSignalWarning[] {
  if (!signalCardIds?.length) return [];
  const byId = new Map((cards ?? []).map(card => [card.id, card]));

  const warnings: BranchSignalWarning[] = [];
  for (const id of signalCardIds) {
    const card = byId.get(id);
    if (!card) {
      warnings.push({
        signalCardId: id,
        signalName: id,
        severity: 'undefined',
        message: 'Branch references a Signal Card that is not defined.',
      });
      continue;
    }
    if (card.trustGrade === 'weak') {
      warnings.push({
        signalCardId: card.id,
        signalName: card.signalName,
        severity: 'weak',
        message: `Signal "${card.signalName}" has weak trust for this branch.`,
      });
      continue;
    }
    if (card.trustGrade === 'unknown') {
      warnings.push({
        signalCardId: card.id,
        signalName: card.signalName,
        severity: 'unknown',
        message: `Signal "${card.signalName}" has unknown trust for this branch.`,
      });
    }
  }
  return warnings;
}
