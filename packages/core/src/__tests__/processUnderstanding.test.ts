import { describe, expect, it } from 'vitest';
import { buildCurrentUnderstanding, buildProblemCondition } from '../processUnderstanding';

describe('processUnderstanding', () => {
  describe('buildProblemCondition', () => {
    it('summarizes a target metric with current and target values', () => {
      const condition = buildProblemCondition({
        targetMetric: 'cpk',
        currentValue: 0.87,
        targetValue: 1.33,
      });

      expect(condition).toEqual({
        metric: 'cpk',
        currentValue: 0.87,
        targetValue: 1.33,
        targetDirection: 'maximize',
        status: 'below-target',
        summary: 'Cpk is 0.87 against target 1.33.',
      });
    });

    it('returns undefined when no metric is available', () => {
      expect(buildProblemCondition({ currentValue: 0.87, targetValue: 1.33 })).toBeUndefined();
    });
  });

  describe('buildCurrentUnderstanding', () => {
    it('builds a stable summary from the EDA vocabulary inputs', () => {
      const condition = buildProblemCondition({
        targetMetric: 'cpk',
        currentValue: 0.87,
        targetValue: 1.33,
      });

      const understanding = buildCurrentUnderstanding({
        issueStatement: 'Fill weight is too high on Line 3.',
        problemCondition: condition,
        scopedPattern: 'Night shift Line 3 runs 3g above the process average.',
        liveStatement: 'Draft: mean fill weight is high on Line 3 night shift.',
        approvedProblemStatement:
          'Mean fill weight is 3g above target on Line 3 night shift after changeover.',
        activeSuspectedMechanisms: [
          {
            name: 'Changeover setup',
            synthesis: 'The first hour after changeover shows the highest mean shift.',
            evidenceLabel: 'R2adj 34%',
          },
          {
            factor: 'Operator',
            synthesis: 'Operator effect is still being checked.',
          },
        ],
      });

      expect(understanding).toMatchObject({
        issueConcern: 'Fill weight is too high on Line 3.',
        problemCondition: condition,
        scopedPattern: 'Night shift Line 3 runs 3g above the process average.',
        liveProblemStatementDraft: 'Draft: mean fill weight is high on Line 3 night shift.',
        approvedProblemStatement:
          'Mean fill weight is 3g above target on Line 3 night shift after changeover.',
        activeSuspectedMechanisms: [
          {
            name: 'Changeover setup',
            synthesis: 'The first hour after changeover shows the highest mean shift.',
            evidenceLabel: 'R2adj 34%',
          },
          {
            name: 'Operator',
            synthesis: 'Operator effect is still being checked.',
          },
        ],
      });
      expect(understanding?.summary).toContain(
        'Issue / concern: Fill weight is too high on Line 3.'
      );
      expect(understanding?.summary).toContain('Problem condition: Cpk is 0.87');
      expect(understanding?.summary).toContain(
        'Approved problem statement: Mean fill weight is 3g above target'
      );
      expect(understanding?.summary).toContain(
        'Active suspected mechanisms: Changeover setup (R2adj 34%) - The first hour after changeover shows the highest mean shift.; Operator - Operator effect is still being checked.'
      );
    });

    it('returns undefined when all meaningful inputs are empty', () => {
      expect(
        buildCurrentUnderstanding({
          issueStatement: '   ',
          scopedPattern: '',
          activeSuspectedMechanisms: [{ name: ' ', synthesis: ' ' }],
        })
      ).toBeUndefined();
    });
  });
});
