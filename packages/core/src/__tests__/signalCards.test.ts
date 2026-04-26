import { describe, expect, it } from 'vitest';
import { evaluateSurvey } from '../survey';
import {
  buildSignalMeasurementNextMoves,
  matchSignalCard,
  projectMechanismBranch,
  type SignalCard,
} from '../index';
import type { Finding, Question, SuspectedCause } from '../findings';

const card = (overrides: Partial<SignalCard> = {}): SignalCard => ({
  id: 'sig-weight',
  signalName: 'Fill Weight',
  aliases: ['Fill_Weight'],
  role: 'outcome',
  archetype: 'measurement',
  trustGrade: 'strong',
  powerStatus: 'adequate',
  studyStatus: 'passed',
  operationalDefinition: 'Scale-recorded net fill weight after capping.',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

const question = (): Question => ({
  id: 'q-1',
  text: 'Does Machine affect fill weight?',
  factor: 'Machine',
  status: 'answered',
  linkedFindingIds: ['f-1'],
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
});

const finding = (): Finding => ({
  id: 'f-1',
  text: 'Machine B has lower fill weight.',
  createdAt: 1760000000000,
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'analyzed',
  comments: [],
  statusChangedAt: 1760000000000,
  questionId: 'q-1',
  validationStatus: 'supports',
});

const branch = (overrides: Partial<SuspectedCause> = {}): SuspectedCause => ({
  id: 'hub-1',
  name: 'Nozzle wear',
  synthesis: 'Machine B separates from the rest.',
  questionIds: ['q-1'],
  findingIds: ['f-1'],
  status: 'suspected',
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

describe('Signal Cards', () => {
  it('matches signal cards by normalized name or alias', () => {
    expect(matchSignalCard([card()], ' fill-weight ', 'outcome')?.id).toBe('sig-weight');
    expect(matchSignalCard([card()], 'Fill_Weight', 'outcome')?.id).toBe('sig-weight');
  });

  it('lets Survey Trust quote a matching Signal Card instead of the placeholder', () => {
    const survey = evaluateSurvey({
      data: [{ Fill_Weight: 10, Machine: 'A' }],
      outcomeColumn: 'Fill_Weight',
      factorColumns: ['Machine'],
      processContext: { signalCards: [card()] },
    });

    expect(survey.trust.items.find(item => item.id === 'outcome-signal')).toMatchObject({
      signalCardId: 'sig-weight',
      archetype: 'measurement',
      trustLabel: 'Strong',
      weakLink: 'Scale-recorded net fill weight after capping.',
      operationalDefinition: 'Scale-recorded net fill weight after capping.',
      trustGrade: 'strong',
      powerStatus: 'adequate',
      studyStatus: 'passed',
    });
  });

  it('creates measurement-check next moves for undefined, weak, or unstudied signals', () => {
    const moves = buildSignalMeasurementNextMoves([
      card({ id: 'missing-definition', operationalDefinition: undefined }),
      card({ id: 'weak', signalName: 'Torque', trustGrade: 'weak' }),
      card({ id: 'study-needed', signalName: 'Temperature', studyStatus: 'needed' }),
    ]);

    expect(moves.map(move => move.id)).toEqual([
      'signal:missing-definition:define-operationally',
      'signal:weak:improve-trust',
      'signal:study-needed:run-study',
    ]);
  });

  it('warns when a Mechanism Branch relies on weak or missing signal evidence', () => {
    const view = projectMechanismBranch(branch({ signalCardIds: ['sig-machine', 'missing'] }), {
      questions: [question()],
      findings: [finding()],
      signalCards: [
        card({ id: 'sig-machine', signalName: 'Machine', role: 'factor', trustGrade: 'weak' }),
      ],
    });

    expect(view.signalWarnings).toEqual([
      {
        signalCardId: 'sig-machine',
        signalName: 'Machine',
        severity: 'weak',
        message: 'Signal "Machine" has weak trust for this branch.',
      },
      {
        signalCardId: 'missing',
        signalName: 'missing',
        severity: 'undefined',
        message: 'Branch references a Signal Card that is not defined.',
      },
    ]);
  });
});
