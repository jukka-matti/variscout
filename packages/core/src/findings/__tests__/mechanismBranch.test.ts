import { describe, expect, it } from 'vitest';
import type { Finding, Question, SuspectedCause } from '../types';
import type { ProcessMap } from '../../frame/types';
import { projectMechanismBranch, projectMechanismBranches } from '../mechanismBranch';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-support',
    text: 'Does night shift change fill variation?',
    factor: 'SHIFT',
    status: 'answered',
    linkedFindingIds: [],
    createdAt: 1745625600000,
    updatedAt: 1745625600000,
    investigationId: 'inv-test-001',
    deletedAt: null,
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-support',
    text: 'Night shift has wider spread.',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'analyzed',
    comments: [],
    statusChangedAt: 1714000000000,
    validationStatus: 'supports',
    ...overrides,
  };
}

function makeHub(overrides: Partial<SuspectedCause> = {}): SuspectedCause {
  return {
    id: 'hub-1',
    name: 'Nozzle heat drift on night shift',
    synthesis: 'Heat accumulates during long overnight runs.',
    questionIds: ['q-support', 'q-open'],
    findingIds: ['f-support', 'f-counter'],
    status: 'suspected',
    createdAt: 1745625600000,
    updatedAt: 1745625600000,
    investigationId: 'inv-test-001',
    deletedAt: null,
    ...overrides,
  };
}

const processMap: ProcessMap = {
  version: 1,
  nodes: [{ id: 'step-fill', name: 'Fill', order: 0 }],
  tributaries: [{ id: 'trib-shift', stepId: 'step-fill', column: 'SHIFT', label: 'Shift' }],
  ctsColumn: 'FILL_WEIGHT',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
};

describe('projectMechanismBranch', () => {
  it('projects a SuspectedCause hub into a branch with linked clues, checks, next move, and process context', () => {
    const branch = projectMechanismBranch(
      makeHub({
        tributaryIds: ['trib-shift'],
        nextMove: 'Check nozzle temperature after the night run.',
      }),
      {
        questions: [
          makeQuestion(),
          makeQuestion({
            id: 'q-open',
            text: 'Check whether nozzle temperature rises after four hours.',
            status: 'open',
          }),
        ],
        findings: [
          makeFinding(),
          makeFinding({
            id: 'f-counter',
            text: 'Day shift also shows one wide-spread run.',
            validationStatus: 'contradicts',
          }),
        ],
        processContext: { processMap },
      }
    );

    expect(branch.id).toBe('hub-1');
    expect(branch.suspectedMechanism).toBe('Nozzle heat drift on night shift');
    expect(branch.supportingClues.map(clue => clue.id)).toEqual(['f-support']);
    expect(branch.counterClues.map(clue => clue.id)).toEqual(['f-counter']);
    expect(branch.openChecks.map(check => check.id)).toEqual(['q-open']);
    expect(branch.nextMove).toBe('Check nozzle temperature after the night run.');
    expect(branch.processContext?.tributaries).toEqual([
      { id: 'trib-shift', column: 'SHIFT', label: 'Shift' },
    ]);
  });

  it('projects explicit counter-clue and check references even outside primary links', () => {
    const branch = projectMechanismBranch(
      makeHub({
        findingIds: ['f-support'],
        counterFindingIds: ['f-explicit-counter'],
        questionIds: ['q-support'],
        checkQuestionIds: ['q-explicit-check'],
      }),
      {
        questions: [
          makeQuestion(),
          makeQuestion({
            id: 'q-explicit-check',
            text: 'Confirm whether the new nozzle tip is installed.',
            status: 'answered',
          }),
        ],
        findings: [
          makeFinding(),
          makeFinding({
            id: 'f-explicit-counter',
            text: 'Maintenance log says nozzle was replaced before this run.',
            validationStatus: undefined,
          }),
        ],
      }
    );

    expect(branch.supportingClues.map(clue => clue.id)).toEqual(['f-support']);
    expect(branch.counterClues.map(clue => clue.id)).toEqual(['f-explicit-counter']);
    expect(branch.openChecks.map(check => check.id)).toEqual(['q-explicit-check']);
    expect(branch.linkedQuestions.map(question => question.id)).toEqual([
      'q-support',
      'q-explicit-check',
    ]);
  });

  it('derives deterministic readiness labels from status, evidence, and missing checks', () => {
    expect(
      projectMechanismBranch(makeHub({ findingIds: [], questionIds: [] }), {
        questions: [],
        findings: [],
      }).readiness
    ).toEqual({ value: 'not-tested', label: 'Not tested' });

    expect(
      projectMechanismBranch(makeHub(), {
        questions: [makeQuestion({ id: 'q-open', status: 'open' })],
        findings: [makeFinding()],
      }).readiness
    ).toEqual({ value: 'needs-check', label: 'Needs check' });

    expect(
      projectMechanismBranch(makeHub({ questionIds: ['q-support'], findingIds: ['f-support'] }), {
        questions: [makeQuestion()],
        findings: [makeFinding()],
      }).readiness
    ).toEqual({ value: 'evidence-backed', label: 'Evidence backed' });

    expect(
      projectMechanismBranch(makeHub({ status: 'confirmed' }), {
        questions: [],
        findings: [],
      }).readiness
    ).toEqual({ value: 'ready-to-act', label: 'Ready to act' });

    expect(
      projectMechanismBranch(makeHub({ status: 'not-confirmed' }), {
        questions: [],
        findings: [],
      }).readiness
    ).toEqual({ value: 'closed', label: 'Closed' });
  });

  it('preserves legacy hubs with no branch-facing fields', () => {
    const legacyBranch = projectMechanismBranch(
      makeHub({ findingIds: [], questionIds: [], synthesis: '', nextMove: undefined }),
      { questions: [], findings: [] }
    );

    expect(legacyBranch.nextMove).toBeUndefined();
    expect(legacyBranch.supportingClues).toEqual([]);
    expect(legacyBranch.counterClues).toEqual([]);
    expect(legacyBranch.openChecks).toEqual([]);
    expect(legacyBranch.processContext).toBeUndefined();
  });
});

describe('projectMechanismBranches', () => {
  it('projects branches in input order', () => {
    const branches = projectMechanismBranches(
      [makeHub({ id: 'first' }), makeHub({ id: 'second', name: 'Second branch' })],
      { questions: [], findings: [] }
    );

    expect(branches.map(branch => branch.id)).toEqual(['first', 'second']);
    expect(branches[1].suspectedMechanism).toBe('Second branch');
  });
});
