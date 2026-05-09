import { describe, expect, it } from 'vitest';
import { createHypothesis } from '../factories';
import type { Hypothesis, HypothesisStatus } from '../types';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

describe('HypothesisStatus', () => {
  it('uses the canonical five response-path states', () => {
    const statuses = [
      'proposed',
      'evidenced',
      'confirmed',
      'refuted',
      'needs-disconfirmation',
    ] as const satisfies readonly HypothesisStatus[];

    const exact: Equal<HypothesisStatus, (typeof statuses)[number]> = true;
    expect(exact).toBe(true);
    expect(statuses).toEqual([
      'proposed',
      'evidenced',
      'confirmed',
      'refuted',
      'needs-disconfirmation',
    ]);
  });
});

describe('Hypothesis', () => {
  it('supports the canonical minimal entity shape and theme tags', () => {
    const hypothesis: Hypothesis = {
      id: 'hypothesis-1',
      name: 'Nozzle wear on night shift',
      synthesis: 'Worn nozzles overheat during long night runs',
      questionIds: ['question-1'],
      findingIds: ['finding-1'],
      investigationId: 'investigation-1',
      status: 'evidenced',
      themeTags: ['equipment', 'night-shift'],
      selectedForImprovement: true,
      nextMove: 'Run disconfirmation check',
      counterFindingIds: ['finding-2'],
      checkQuestionIds: ['question-2'],
      condition: undefined,
      tributaryIds: ['tributary-1'],
      signalCardIds: ['signal-card-1'],
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };

    expect(hypothesis.status).toBe('evidenced');
    expect(hypothesis.themeTags).toEqual(['equipment', 'night-shift']);
  });
});

describe('createHypothesis', () => {
  it('creates a new hypothesis with proposed status by default', () => {
    const hypothesis = createHypothesis(
      'Nozzle wear on night shift',
      'Worn nozzles overheat during long night runs',
      ['question-1', 'question-2'],
      ['finding-1'],
      'investigation-1'
    );

    expect(hypothesis.id).toBeTruthy();
    expect(hypothesis.name).toBe('Nozzle wear on night shift');
    expect(hypothesis.synthesis).toBe('Worn nozzles overheat during long night runs');
    expect(hypothesis.questionIds).toEqual(['question-1', 'question-2']);
    expect(hypothesis.findingIds).toEqual(['finding-1']);
    expect(hypothesis.investigationId).toBe('investigation-1');
    expect(hypothesis.status).toBe('proposed');
    expect(hypothesis.createdAt).toBeTruthy();
    expect(hypothesis.updatedAt).toBeTruthy();
  });

  it('defaults connected IDs to empty arrays', () => {
    const hypothesis = createHypothesis('Test', '');

    expect(hypothesis.questionIds).toEqual([]);
    expect(hypothesis.findingIds).toEqual([]);
  });
});
