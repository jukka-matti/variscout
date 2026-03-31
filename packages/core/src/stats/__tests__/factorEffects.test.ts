import { describe, it, expect } from 'vitest';
import { generateFollowUpQuestions } from '../factorEffects';
import type { MainEffectsResult, InteractionEffectsResult } from '../factorEffects';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMainEffects(overrides?: Partial<MainEffectsResult>): MainEffectsResult {
  return {
    factors: [
      {
        factor: 'Machine',
        levels: [
          { level: 'M1', mean: 105, n: 30, effect: 5, stdDev: 2 },
          { level: 'M2', mean: 95, n: 30, effect: -5, stdDev: 2 },
        ],
        etaSquared: 0.4,
        pValue: 0.001,
        isSignificant: true,
        bestLevel: 'M1',
        worstLevel: 'M2',
        effectRange: 10,
      },
      {
        factor: 'Shift',
        levels: [
          { level: 'Morning', mean: 102, n: 20, effect: 2, stdDev: 3 },
          { level: 'Night', mean: 98, n: 20, effect: -2, stdDev: 3 },
        ],
        etaSquared: 0.15,
        pValue: 0.01,
        isSignificant: true,
        bestLevel: 'Morning',
        worstLevel: 'Night',
        effectRange: 4,
      },
      {
        factor: 'Operator',
        levels: [
          { level: 'Alice', mean: 100.5, n: 20, effect: 0.5, stdDev: 4 },
          { level: 'Bob', mean: 99.5, n: 20, effect: -0.5, stdDev: 4 },
        ],
        etaSquared: 0.02,
        pValue: 0.3,
        isSignificant: false,
        bestLevel: 'Alice',
        worstLevel: 'Bob',
        effectRange: 1,
      },
    ],
    grandMean: 100,
    n: 60,
    significantCount: 2,
    ...overrides,
  };
}

function makeInteractions(overrides?: Partial<InteractionEffectsResult>): InteractionEffectsResult {
  return {
    interactions: [
      {
        factorA: 'Machine',
        factorB: 'Shift',
        levelsA: ['M1', 'M2'],
        levelsB: ['Morning', 'Night'],
        cellMeans: [
          { levelA: 'M1', levelB: 'Morning', mean: 108, n: 15 },
          { levelA: 'M1', levelB: 'Night', mean: 102, n: 15 },
          { levelA: 'M2', levelB: 'Morning', mean: 96, n: 15 },
          { levelA: 'M2', levelB: 'Night', mean: 94, n: 15 },
        ],
        rSquaredMainEffects: 0.55,
        rSquaredWithInteraction: 0.62,
        deltaRSquared: 0.07,
        pValue: 0.02,
        isSignificant: true,
      },
    ],
    significantCount: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests: generateFollowUpQuestions
// ---------------------------------------------------------------------------

describe('generateFollowUpQuestions', () => {
  it('generates level-specific follow-ups for significant main effects', () => {
    const mainEffects = makeMainEffects();
    const questions = generateFollowUpQuestions(mainEffects, null);

    // Machine (eta=0.4) and Shift (eta=0.15) are significant; Operator (eta=0.02) is not
    expect(questions.length).toBe(2);

    const machineQ = questions.find(q => q.factors[0] === 'Machine');
    expect(machineQ).toBeDefined();
    expect(machineQ!.text).toContain('M2'); // worst level
    expect(machineQ!.text).toContain('Machine');
    expect(machineQ!.type).toBe('main-effect');
    expect(machineQ!.source).toBe('factor-intel');

    const shiftQ = questions.find(q => q.factors[0] === 'Shift');
    expect(shiftQ).toBeDefined();
    expect(shiftQ!.text).toContain('Night'); // worst level
  });

  it('respects custom minEtaSquared threshold', () => {
    const mainEffects = makeMainEffects();

    // With threshold of 0.3, only Machine (0.4) passes
    const questions = generateFollowUpQuestions(mainEffects, null, {
      minEtaSquared: 0.3,
    });

    expect(questions.length).toBe(1);
    expect(questions[0].factors[0]).toBe('Machine');
  });

  it('generates interaction questions when >= 2 significant main effects', () => {
    const mainEffects = makeMainEffects(); // significantCount = 2
    const interactions = makeInteractions();

    const questions = generateFollowUpQuestions(mainEffects, interactions);

    const interactionQs = questions.filter(q => q.type === 'interaction');
    expect(interactionQs.length).toBe(1);
    expect(interactionQs[0].text).toContain('Machine');
    expect(interactionQs[0].text).toContain('Shift');
    expect(interactionQs[0].factors).toEqual(['Machine', 'Shift']);
  });

  it('gates interaction questions when < 2 significant main effects', () => {
    const mainEffects = makeMainEffects({
      significantCount: 1,
      factors: [
        {
          factor: 'Machine',
          levels: [
            { level: 'M1', mean: 105, n: 30, effect: 5, stdDev: 2 },
            { level: 'M2', mean: 95, n: 30, effect: -5, stdDev: 2 },
          ],
          etaSquared: 0.4,
          pValue: 0.001,
          isSignificant: true,
          bestLevel: 'M1',
          worstLevel: 'M2',
          effectRange: 10,
        },
      ],
    });
    const interactions = makeInteractions();

    const questions = generateFollowUpQuestions(mainEffects, interactions);

    // Should only have the main-effect question, no interactions
    const interactionQs = questions.filter(q => q.type === 'interaction');
    expect(interactionQs.length).toBe(0);
  });

  it('returns empty when no significant main effects', () => {
    const mainEffects = makeMainEffects({
      significantCount: 0,
      factors: [
        {
          factor: 'Operator',
          levels: [
            { level: 'Alice', mean: 100.5, n: 20, effect: 0.5, stdDev: 4 },
            { level: 'Bob', mean: 99.5, n: 20, effect: -0.5, stdDev: 4 },
          ],
          etaSquared: 0.02,
          pValue: 0.3,
          isSignificant: false,
          bestLevel: 'Alice',
          worstLevel: 'Bob',
          effectRange: 1,
        },
      ],
    });

    const questions = generateFollowUpQuestions(mainEffects, null);
    expect(questions.length).toBe(0);
  });

  it('handles null inputs gracefully', () => {
    expect(generateFollowUpQuestions(null, null)).toEqual([]);
    expect(generateFollowUpQuestions(null, makeInteractions())).toEqual([]);
  });

  it('skips non-significant interactions', () => {
    const mainEffects = makeMainEffects();
    const interactions = makeInteractions({
      interactions: [
        {
          factorA: 'Machine',
          factorB: 'Shift',
          levelsA: ['M1', 'M2'],
          levelsB: ['Morning', 'Night'],
          cellMeans: [],
          rSquaredMainEffects: 0.55,
          rSquaredWithInteraction: 0.56,
          deltaRSquared: 0.01,
          pValue: 0.4,
          isSignificant: false,
        },
      ],
      significantCount: 0,
    });

    const questions = generateFollowUpQuestions(mainEffects, interactions);
    const interactionQs = questions.filter(q => q.type === 'interaction');
    expect(interactionQs.length).toBe(0);
  });

  it('includes effect range in main-effect question text', () => {
    const mainEffects = makeMainEffects();
    const questions = generateFollowUpQuestions(mainEffects, null);

    const machineQ = questions.find(q => q.factors[0] === 'Machine');
    expect(machineQ!.text).toContain('10.00'); // effectRange formatted to 2 decimals
  });
});
