import { describe, expect, it } from 'vitest';
import type { Finding, Hypothesis } from '../types';
import type { ProcessMap } from '../../frame/types';
import { projectMechanismBranch, projectMechanismBranches } from '../mechanismBranch';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-support',
    text: 'Night shift has wider spread.',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'analyzed',
    comments: [],
    statusChangedAt: 1714000000000,
    validationStatus: 'supports',
    ...overrides,
  };
}

function makeHub(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'hub-1',
    name: 'Nozzle heat drift on night shift',
    synthesis: 'Heat accumulates during long overnight runs.',
    findingIds: ['f-support', 'f-counter'],
    status: 'proposed',
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
  it('projects a Hypothesis hub into a branch with supporting clues, counter clues, next move, and process context', () => {
    const branch = projectMechanismBranch(
      makeHub({
        tributaryIds: ['trib-shift'],
        nextMove: 'Check nozzle temperature after the night run.',
      }),
      {
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
    expect(branch.nextMove).toBe('Check nozzle temperature after the night run.');
    expect(branch.processContext?.tributaries).toEqual([
      { id: 'trib-shift', column: 'SHIFT', label: 'Shift' },
    ]);
  });

  it('projects explicit counter-clue references even outside primary links', () => {
    const branch = projectMechanismBranch(
      makeHub({
        findingIds: ['f-support'],
        counterFindingIds: ['f-explicit-counter'],
      }),
      {
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
  });

  it('derives deterministic readiness labels from status and clue evidence', () => {
    expect(
      projectMechanismBranch(makeHub({ findingIds: [] }), {
        findings: [],
      }).readiness
    ).toEqual({ value: 'not-tested', label: 'Not tested' });

    expect(
      projectMechanismBranch(makeHub(), {
        findings: [makeFinding()],
      }).readiness
    ).toEqual({ value: 'evidence-backed', label: 'Evidence backed' });

    expect(
      projectMechanismBranch(makeHub({ status: 'confirmed' }), {
        findings: [],
      }).readiness
    ).toEqual({ value: 'ready-to-act', label: 'Ready to act' });

    expect(
      projectMechanismBranch(makeHub({ status: 'refuted' }), {
        findings: [],
      }).readiness
    ).toEqual({ value: 'closed', label: 'Closed' });
  });

  it('flags needs-check when there are both supporting and counter clues', () => {
    const branch = projectMechanismBranch(makeHub(), {
      findings: [makeFinding(), makeFinding({ id: 'f-counter', validationStatus: 'contradicts' })],
    });
    expect(branch.readiness).toEqual({ value: 'needs-check', label: 'Needs check' });
  });

  it('routes an inconclusive auto-link breadcrumb to not-tested, NOT supporting (honesty guard)', () => {
    // Mirrors what the re-ingest auto-link engine produces: a bare "data arrived"
    // Finding stamped validationStatus:'inconclusive'. It must NOT count as a
    // supporting clue (which would silently bump the hypothesis proposed→evidenced
    // on arrival alone). If the engine ever stops stamping 'inconclusive', this
    // breadcrumb falls into the `else` supporting bucket and this test fails.
    const autoLinkFinding = makeFinding({
      id: 'f-autolink',
      text: 'Needed factor "Shift" arrived for measurement plan on "Nozzle temperature".',
      status: 'observed',
      validationStatus: 'inconclusive',
    });
    const branch = projectMechanismBranch(
      makeHub({ findingIds: ['f-autolink'], status: 'proposed' }),
      {
        findings: [autoLinkFinding],
      }
    );

    expect(branch.notTestedClues.map(clue => clue.id)).toEqual(['f-autolink']);
    expect(branch.supportingClues).toEqual([]);
    expect(branch.counterClues).toEqual([]);
    // Readiness stays not-tested — no supporting/counter clue evidence was credited.
    expect(branch.readiness).toEqual({ value: 'not-tested', label: 'Not tested' });
  });

  it('preserves legacy hubs with no branch-facing fields', () => {
    const legacyBranch = projectMechanismBranch(
      makeHub({ findingIds: [], synthesis: '', nextMove: undefined }),
      { findings: [] }
    );

    expect(legacyBranch.nextMove).toBeUndefined();
    expect(legacyBranch.supportingClues).toEqual([]);
    expect(legacyBranch.counterClues).toEqual([]);
    expect(legacyBranch.processContext).toBeUndefined();
  });
});

describe('projectMechanismBranches', () => {
  it('projects branches in input order', () => {
    const branches = projectMechanismBranches(
      [makeHub({ id: 'first' }), makeHub({ id: 'second', name: 'Second branch' })],
      { findings: [] }
    );

    expect(branches.map(branch => branch.id)).toEqual(['first', 'second']);
    expect(branches[1].suspectedMechanism).toBe('Second branch');
  });
});
