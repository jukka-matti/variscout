import type { OutcomeSpec, ProcessHub } from '../processHub';

export type OutcomeAction =
  | { kind: 'OUTCOME_ADD'; hubId: ProcessHub['id']; outcome: OutcomeSpec }
  | { kind: 'OUTCOME_UPDATE'; outcomeId: OutcomeSpec['id']; patch: Partial<OutcomeSpec> }
  | { kind: 'OUTCOME_ARCHIVE'; outcomeId: OutcomeSpec['id'] };
