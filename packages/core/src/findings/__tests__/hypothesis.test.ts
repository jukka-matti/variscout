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
      'evidence-survived-test',
      'refuted',
      'needs-disconfirmation',
    ] as const satisfies readonly HypothesisStatus[];

    const exact: Equal<HypothesisStatus, (typeof statuses)[number]> = true;
    expect(exact).toBe(true);
    expect(statuses).toEqual([
      'proposed',
      'evidenced',
      'evidence-survived-test',
      'refuted',
      'needs-disconfirmation',
    ]);
  });
});

describe('Hypothesis', () => {
  it('supports the canonical minimal entity shape and theme tags (ADR-085: no questionIds)', () => {
    const hypothesis: Hypothesis = {
      id: 'hypothesis-1',
      name: 'Nozzle wear on night shift',
      synthesis: 'Worn nozzles overheat during long night runs',
      findingIds: ['finding-1'],
      investigationId: 'investigation-1',
      status: 'evidenced',
      themeTags: ['equipment', 'night-shift'],
      selectedForImprovement: true,
      nextMove: 'Run disconfirmation check',
      counterFindingIds: ['finding-2'],
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

  it('accepts optional ideas array (ADR-085: ideas re-homed from retired Question entity)', () => {
    const hypothesis: Hypothesis = {
      id: 'h-ideas',
      name: 'Nozzle heat drift',
      synthesis: 'Thermal drift during night runs',
      findingIds: ['f-1'],
      investigationId: 'investigation-1',
      status: 'evidence-survived-test',
      ideas: [
        {
          id: 'idea-1',
          text: 'Retune nozzle temperature set-point',
          createdAt: 1714000000000,
          deletedAt: null,
        },
      ],
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };

    expect(hypothesis.ideas).toHaveLength(1);
    expect(hypothesis.ideas![0].text).toBe('Retune nozzle temperature set-point');
  });
});

describe('createHypothesis', () => {
  it('creates a new hypothesis with proposed status by default', () => {
    const hypothesis = createHypothesis(
      'Nozzle wear on night shift',
      'Worn nozzles overheat during long night runs',
      ['finding-1'],
      'investigation-1'
    );

    expect(hypothesis.id).toBeTruthy();
    expect(hypothesis.name).toBe('Nozzle wear on night shift');
    expect(hypothesis.synthesis).toBe('Worn nozzles overheat during long night runs');
    expect(hypothesis.findingIds).toEqual(['finding-1']);
    expect(hypothesis.investigationId).toBe('investigation-1');
    expect(hypothesis.status).toBe('proposed');
    expect(hypothesis.createdAt).toBeTruthy();
    expect(hypothesis.updatedAt).toBeTruthy();
  });

  it('defaults findingIds to empty array', () => {
    const hypothesis = createHypothesis('Test', '');

    expect(hypothesis.findingIds).toEqual([]);
  });
});

describe('Hypothesis — measurementPlanIds field', () => {
  it('accepts optional measurementPlanIds parallel to findingIds', () => {
    const planId: string = 'mp-1';
    const hyp: Hypothesis = {
      id: 'h-1',
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
      name: 'Test',
      synthesis: '',
      findingIds: ['f-1'],
      measurementPlanIds: [planId],
      status: 'proposed',
      investigationId: 'inv-1',
    };
    expect(hyp.measurementPlanIds).toEqual(['mp-1']);
  });

  it('omits measurementPlanIds without TypeScript error', () => {
    const hyp: Hypothesis = {
      id: 'h-2',
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
      name: 'Test',
      synthesis: '',
      findingIds: [],
      status: 'proposed',
      investigationId: 'inv-1',
    };
    expect(hyp.measurementPlanIds).toBeUndefined();
  });
});
