import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  ImprovementProject,
  ImprovementProjectMetadata,
  ImprovementProjectStatus,
  ProcessStepEntry,
} from '../types';
import type { ProjectMember } from '../../projectMembership/types';
import type { StepTimingBinding, TimeDecompositionBinding } from '../../derived/types';
import type { FormulaBinding } from '../../derived/formula/types';

describe('ImprovementProject', () => {
  it('compiles with required title + multi-level Goal', () => {
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'draft',
      metadata: { title: 'Heads 5-8 lift' },
      goal: {
        outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
        factorControls: [
          {
            factor: 'NOZZLE.TEMP',
            targetCondition: 'in control 95±2°C',
            linkedHypothesisId: 'h-1',
          },
        ],
      },
      sections: {
        background: {},
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
      updatedAt: 0,
    };
    expect(ip.metadata.title).toBe('Heads 5-8 lift');
    expect(ip.goal.outcomeGoals.length).toBeGreaterThanOrEqual(1);
  });

  it('status union covers draft | active | closed', () => {
    const statuses: ImprovementProjectStatus[] = ['draft', 'active', 'closed'];
    expect(statuses).toHaveLength(3);
  });

  it('accepts members[] field on metadata (type-level compile check)', () => {
    const member: ProjectMember = {
      id: 'pm-1',
      createdAt: 2000,
      deletedAt: null,
      userId: 'u@org',
      displayName: 'Alice',
      role: 'lead',
      invitedAt: 2000,
    };
    const meta: ImprovementProjectMetadata = {
      title: 'Test',
      members: [member],
    };
    expect(meta.members).toHaveLength(1);
    expect(meta.members![0].role).toBe('lead');
  });

  it('accepts optional reflection narrative field', () => {
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'closed',
      metadata: { title: 'Heads 5-8 lift' },
      goal: {
        outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
      },
      sections: {
        background: {},
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
      updatedAt: 0,
      reflection:
        'The mid-shift thermal cycle drift was invisible until the SCOUT subgroup analysis. Future cadence will include a routine subgroup-by-hour check.',
    };
    expect(ip.reflection).toContain('SCOUT subgroup analysis');
  });

  it('supports step-bound outcomes via optional stepId (Spec 2 §3.3.1)', () => {
    // Mixed global + step-bound outcomes — symmetry with factors.
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'active',
      metadata: { title: 'Yield + react-step yield split' },
      goal: {
        outcomeGoals: [
          // Global outcome — whole-process Y (no stepId)
          { outcomeSpecId: 'Yield_pct', target: 95 },
          // Step-bound outcome — feeds L3 focal-step view of the React step
          { outcomeSpecId: 'React_yield_pct', target: 98, stepId: 'step-react' },
        ],
      },
      sections: {
        background: {},
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
      updatedAt: 0,
    };
    const globalOutcome = ip.goal.outcomeGoals.find(g => g.stepId === undefined);
    const stepBoundOutcome = ip.goal.outcomeGoals.find(g => g.stepId === 'step-react');
    expect(globalOutcome?.outcomeSpecId).toBe('Yield_pct');
    expect(stepBoundOutcome?.outcomeSpecId).toBe('React_yield_pct');
    expect(stepBoundOutcome?.stepId).toBe('step-react');
  });

  it('supports multi-outcome (batch processes — Spec 2 §3.2.2)', () => {
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      deletedAt: null,
      status: 'active',
      metadata: { title: 'Batch process — Yield + ScrapRate + GradeA' },
      goal: {
        outcomeGoals: [
          { outcomeSpecId: 'Yield_pct', target: 95 },
          { outcomeSpecId: 'ScrapRate_pct', target: 2 },
          { outcomeSpecId: 'GradeA_ratio', target: 0.85 },
        ],
      },
      sections: {
        background: {},
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
      updatedAt: 0,
    };
    expect(ip.goal.outcomeGoals).toHaveLength(3);
    // No "primary" hierarchy is enforced — order is the only quiet signal.
    expect(ip.goal.outcomeGoals[0].outcomeSpecId).toBe('Yield_pct');
  });

  // CCJ E1 task 1 — root-level Canvas-edit-mode state fields
  describe('Canvas Connection Journey E1 — flat root fields', () => {
    it('minimal IP without the 5 new fields still type-checks', () => {
      // Sanity: no regression — pre-E1 IPs (no E1 fields) remain valid.
      const ip: ImprovementProject = {
        id: 'ip-1',
        hubId: 'hub-1',
        createdAt: 0,
        deletedAt: null,
        status: 'draft',
        metadata: { title: 'Pre-E1 minimal IP' },
        goal: {
          outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }],
        },
        sections: {
          background: {},
          investigationLineage: {},
          approach: {},
          outcomeReference: {},
        },
        updatedAt: 0,
      };
      expect(ip.issueStatement).toBeUndefined();
      expect(ip.processSteps).toBeUndefined();
      expect(ip.stepTimings).toBeUndefined();
      expect(ip.formulaBindings).toBeUndefined();
      expect(ip.timeDecompositionBindings).toBeUndefined();
    });

    it('IP with all 5 new fields type-checks with correct shapes', () => {
      const stepA: ProcessStepEntry = { id: 'step-A', name: 'Mix', order: 0 };
      const stepB: ProcessStepEntry = { id: 'step-B', name: 'React', order: 1 };
      const stepC: ProcessStepEntry = { id: 'step-C', name: 'Pack', order: 2 };

      const timingPaired: StepTimingBinding = {
        kind: 'paired',
        stepId: 'step-A',
        startColumn: 'Mix_start',
        endColumn: 'Mix_end',
      };
      const timingDuration: StepTimingBinding = {
        kind: 'duration',
        stepId: 'step-B',
        durationColumn: 'React_duration_ms',
      };

      const formula: FormulaBinding = {
        id: 'fb-yield',
        name: 'Yield_pct',
        numerator: [{ kind: 'column', column: 'Good_count', sign: '+' }],
        denominator: [{ kind: 'column', column: 'Total_count', sign: '+' }],
        multiplier: 100,
        family: 'batchRatio',
      };

      const timeDecomp: TimeDecompositionBinding = {
        id: 'td-1',
        sourceColumn: 'Mix_start',
        dimensions: ['hour', 'dayOfWeek'],
        hourGranularityMinutes: 60,
      };

      const ip: ImprovementProject = {
        id: 'ip-1',
        hubId: 'hub-1',
        createdAt: 0,
        deletedAt: null,
        status: 'active',
        metadata: { title: 'E1 — full canvas state IP' },
        goal: { outcomeGoals: [{ outcomeSpecId: 'Yield_pct', target: 95 }] },
        sections: {
          background: {},
          investigationLineage: {},
          approach: {},
          outcomeReference: {},
        },
        updatedAt: 0,
        issueStatement: 'Mid-shift yield drops 4% during the 14:00 reactor cleanout window.',
        processSteps: [stepA, stepB, stepC],
        stepTimings: [timingPaired, timingDuration],
        formulaBindings: [formula],
        timeDecompositionBindings: [timeDecomp],
      };

      expect(typeof ip.issueStatement).toBe('string');
      expect(ip.processSteps).toHaveLength(3);
      expect(ip.stepTimings).toHaveLength(2);
      expect(ip.formulaBindings).toHaveLength(1);
      expect(ip.timeDecompositionBindings).toHaveLength(1);

      // Shape spot-checks (variant-narrowing on stepTimings)
      const t0 = ip.stepTimings![0];
      if (t0.kind === 'paired') {
        expect(t0.startColumn).toBe('Mix_start');
      }
      expect(ip.formulaBindings![0].family).toBe('batchRatio');
      expect(ip.timeDecompositionBindings![0].dimensions).toContain('hour');
    });

    it('processSteps is typed as ProcessStepEntry[] (array, not scalar)', () => {
      // Type-level assertion: the field is an array of ProcessStepEntry, not a single entry.
      expectTypeOf<ImprovementProject['processSteps']>().toEqualTypeOf<
        ProcessStepEntry[] | undefined
      >();
      // Element type:
      expectTypeOf<
        NonNullable<ImprovementProject['processSteps']>[number]
      >().toEqualTypeOf<ProcessStepEntry>();
    });

    it('all 5 new fields are optional on ImprovementProject', () => {
      // Partial<Pick<...>> over only the new fields must be assignable to itself —
      // proving each is optional (Pick on a required field would not allow {} alone).
      type E1Fields = Pick<
        ImprovementProject,
        | 'issueStatement'
        | 'processSteps'
        | 'stepTimings'
        | 'formulaBindings'
        | 'timeDecompositionBindings'
      >;
      const empty: E1Fields = {};
      expect(empty).toEqual({});

      // Each individual field is independently optional.
      const onlyIssue: E1Fields = { issueStatement: 'X' };
      const onlySteps: E1Fields = { processSteps: [{ id: 's', name: 'S', order: 0 }] };
      const onlyTimings: E1Fields = {
        stepTimings: [{ kind: 'duration', stepId: 's', durationColumn: 'c' }],
      };
      const onlyFormulas: E1Fields = {
        formulaBindings: [{ id: 'f', name: 'F', numerator: [], denominator: [], multiplier: 1 }],
      };
      const onlyTime: E1Fields = {
        timeDecompositionBindings: [{ id: 't', sourceColumn: 'c', dimensions: ['month'] }],
      };
      expect(onlyIssue.issueStatement).toBe('X');
      expect(onlySteps.processSteps).toHaveLength(1);
      expect(onlyTimings.stepTimings).toHaveLength(1);
      expect(onlyFormulas.formulaBindings).toHaveLength(1);
      expect(onlyTime.timeDecompositionBindings).toHaveLength(1);
    });

    it('ProcessStepEntry has stable shape { id, name, order }', () => {
      expectTypeOf<ProcessStepEntry>().toEqualTypeOf<{
        id: string;
        name: string;
        order: number;
      }>();
    });
  });
});
