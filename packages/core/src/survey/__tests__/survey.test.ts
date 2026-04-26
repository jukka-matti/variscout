import { describe, expect, it } from 'vitest';
import { evaluateSurvey } from '../index';
import type { DataRow, Finding, ProcessMap, Question, SuspectedCause } from '../../index';

const data: DataRow[] = [
  { SampleTime: '2026-04-01T08:00:00Z', Fill_Weight: 10.1, Machine: 'M1', Shift: 'Day' },
  { SampleTime: '2026-04-01T09:00:00Z', Fill_Weight: 10.4, Machine: 'M1', Shift: 'Night' },
  { SampleTime: '2026-04-01T10:00:00Z', Fill_Weight: 9.8, Machine: 'M2', Shift: 'Day' },
  { SampleTime: '2026-04-01T11:00:00Z', Fill_Weight: 10.6, Machine: 'M2', Shift: 'Night' },
];

const dataWithoutTime: DataRow[] = data.map(({ SampleTime: _sampleTime, ...row }) => row);

const processMap = (overrides: Partial<ProcessMap> = {}): ProcessMap => ({
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

const question = (overrides: Partial<Question> = {}): Question => ({
  id: 'q-1',
  text: 'Does Machine M2 drive fill weight?',
  factor: 'Machine',
  status: 'answered',
  linkedFindingIds: ['f-1'],
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'f-1',
  text: 'Machine M2 has the highest fill-weight spread.',
  createdAt: 1760000000000,
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'analyzed',
  comments: [],
  statusChangedAt: 1760000000000,
  questionId: 'q-1',
  validationStatus: 'supports',
  ...overrides,
});

const branch = (overrides: Partial<SuspectedCause> = {}): SuspectedCause => ({
  id: 'hub-1',
  name: 'Nozzle wear on M2',
  synthesis: 'M2 behaves differently after warmup.',
  questionIds: ['q-1'],
  findingIds: ['f-1'],
  status: 'suspected',
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

describe('evaluateSurvey', () => {
  it('returns cannot-do-yet and next-data recommendations when no data is loaded', () => {
    const survey = evaluateSurvey({ data: [] });

    expect(survey.possibility.overallStatus).toBe('cannot-do-yet');
    expect(survey.possibility.items.every(item => item.status === 'cannot-do-yet')).toBe(true);
    expect(survey.recommendations.map(rec => rec.kind).slice(0, 2)).toEqual([
      'collect-data',
      'complete-mapping',
    ]);
  });

  it('unlocks Standard / Four Lenses possibility when outcome and factors are mapped', () => {
    const survey = evaluateSurvey({
      data,
      outcomeColumn: 'Fill_Weight',
      factorColumns: ['Machine', 'Shift'],
      timeColumn: 'SampleTime',
    });

    expect(survey.diagnostics.inferredMode.mode).toBe('standard');
    expect(survey.possibility.items.find(item => item.id === 'standard-four-lenses')).toMatchObject(
      {
        instrument: 'Standard / Four Lenses',
        status: 'can-do-now',
      }
    );
  });

  it('unlocks capability with caution when specs and outcome exist without subgroup/time context', () => {
    const survey = evaluateSurvey({
      data: dataWithoutTime,
      outcomeColumn: 'Fill_Weight',
      factorColumns: ['Machine'],
      specs: { lsl: 9.5, usl: 10.5 },
    });

    expect(survey.possibility.items.find(item => item.id === 'capability')).toMatchObject({
      status: 'can-do-with-caution',
    });
    expect(survey.recommendations.some(rec => rec.kind === 'add-time-batch-axis')).toBe(true);
  });

  it('promotes process-map gaps into Survey recommendations', () => {
    const survey = evaluateSurvey({
      data,
      outcomeColumn: 'Fill_Weight',
      factorColumns: ['Machine'],
      specs: { usl: 10.5 },
      processMap: processMap({
        nodes: [{ id: 'step-fill', name: 'Fill', order: 0 }],
        tributaries: [],
      }),
    });

    expect(
      survey.recommendations.some(
        rec =>
          rec.source === 'process-map-gap' &&
          rec.kind === 'collect-data' &&
          rec.id === 'gap:missing-ctq-at-step:step-fill'
      )
    ).toBe(true);
    expect(
      survey.recommendations.some(
        rec =>
          rec.source === 'process-map-gap' &&
          rec.kind === 'complete-mapping' &&
          rec.id === 'gap:step-without-tributaries:step-fill'
      )
    ).toBe(true);
  });

  it('recommends counter-check work for mechanism branches with open checks or no counter clues', () => {
    const survey = evaluateSurvey({
      data,
      outcomeColumn: 'Fill_Weight',
      factorColumns: ['Machine'],
      questions: [
        question(),
        question({
          id: 'q-counter',
          text: 'Does M2 still separate during Day shift only?',
          status: 'open',
          linkedFindingIds: [],
        }),
      ],
      findings: [finding()],
      branches: [branch({ checkQuestionIds: ['q-counter'] })],
    });

    expect(survey.recommendations.map(rec => rec.id)).toContain('branch:hub-1:add-counter-check');
    expect(survey.recommendations.map(rec => rec.id)).toContain(
      'branch:hub-1:complete-open-checks'
    );
  });

  it('returns recommendations in deterministic order', () => {
    const input = {
      data,
      outcomeColumn: 'Fill_Weight',
      factorColumns: ['Machine'],
      processMap: processMap({
        nodes: [{ id: 'step-fill', name: 'Fill', order: 0 }],
        tributaries: [],
      }),
      questions: [question({ status: 'open' })],
      findings: [finding()],
      branches: [branch()],
    };

    const first = evaluateSurvey(input);
    const second = evaluateSurvey(input);

    expect(first.recommendations.map(rec => rec.id)).toEqual(
      second.recommendations.map(rec => rec.id)
    );
  });
});
