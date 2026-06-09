import type { SampleDataset } from '../types';
import { createNormalGenerator, clamp } from '../utils';
import type { Finding, Hypothesis, AnalyzeCategory } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

const IDS = {
  F_STEP3_AVERAGE: 'f-bottleneck-step3-average',
  F_STEP2_VARIATION: 'f-bottleneck-step2-variation',
  F_STEP2_AFTERNOON: 'f-bottleneck-step2-afternoon',
  HUB_STEP2_STANDARD_WORK: 'hub-bottleneck-step2-standard-work',
  HUB_STEP3_CAPACITY: 'hub-bottleneck-step3-capacity',
  CAT_FLOW: 'cat-bottleneck-flow',
  CAT_WORKFORCE: 'cat-bottleneck-workforce',
} as const;

const BASE = new Date('2026-06-08T08:00:00Z');
const epoch = (hoursOffset: number) => BASE.getTime() + hoursOffset * 3_600_000;
const iso = (hoursOffset: number) => new Date(epoch(hoursOffset)).toISOString();

// Bottleneck: Process Step Analysis (ESTIEM Training Case)
// Story: Step 3 was blamed, but Step 2 has 3x the variation
const generateBottleneckData = () => {
  const normal = createNormalGenerator(1201);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const shifts = ['Morning', 'Afternoon'];
  const data: Record<string, unknown>[] = [];
  const baseTime = Date.UTC(2026, 5, 8, 6, 0, 0);
  const stepSequence: Record<number, number> = {};
  let id = 1;

  for (let step = 1; step <= 5; step++) {
    stepSequence[step] = 0;
    for (const shift of shifts) {
      for (const day of days) {
        for (let rep = 0; rep < 3; rep++) {
          // Step 2 has 3x the variation (std=10 vs std=2-3 for others)
          const mean = step === 2 ? 40 : step === 3 ? 45 : step === 1 ? 32 : step === 4 ? 34 : 30;
          const std = step === 2 ? 10 : 2;
          const cycleTime = Math.round(normal(mean, std));
          const clippedCycleTime = clamp(cycleTime, 15, 60);
          const sequence = stepSequence[step]++;
          const completionIntervalMinutes = step === 2 ? 20 : step === 3 ? 9 : 8;
          const end = new Date(baseTime + sequence * completionIntervalMinutes * 60_000);
          const start = new Date(end.getTime() - clippedCycleTime * 1_000);
          data.push({
            Observation: id++,
            Step: `Step ${step}`,
            Cycle_Time_sec: clippedCycleTime,
            Shift: shift,
            Day: day,
            [`Step_${step}_Start`]: start.toISOString(),
            [`Step_${step}_End`]: end.toISOString(),
          });
        }
      }
    }
  }
  return data;
};

function buildFindings(): Finding[] {
  return [
    {
      id: IDS.F_STEP3_AVERAGE,
      deletedAt: null,
      text: 'Step 3 has the highest average cycle time at about 45 sec, but the points are tightly clustered and predictable.',
      createdAt: epoch(1),
      context: {
        activeFilters: { Step: ['Step 3'] },
        cumulativeScope: null,
        stats: { mean: 45, samples: 30 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      comments: [
        {
          id: 'c-bottleneck-step3-1',
          text: 'This explains why Step 3 was blamed from averages alone. It is slow, but not erratic.',
          createdAt: epoch(2),
          parentId: IDS.F_STEP3_AVERAGE,
          parentKind: 'finding' as const,
          deletedAt: null,
        },
      ],
      statusChangedAt: epoch(2),
      source: { chart: 'boxplot', category: 'Step 3', timeLens: DEFAULT_TIME_LENS },
      validationStatus: 'inconclusive',
    },
    {
      id: IDS.F_STEP2_VARIATION,
      deletedAt: null,
      text: 'Step 2 has the widest spread. Its range is roughly three times Step 3, which makes downstream flow harder to predict.',
      createdAt: epoch(3),
      context: {
        activeFilters: { Step: ['Step 2'] },
        cumulativeScope: null,
        stats: { mean: 40, samples: 30 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-bottleneck-step2-1',
          text: 'The boxplot changes the story: Step 2 variation is the stronger contribution to missed flow than Step 3 average time.',
          createdAt: epoch(4),
          parentId: IDS.F_STEP2_VARIATION,
          parentKind: 'finding' as const,
          deletedAt: null,
        },
        {
          id: 'c-bottleneck-step2-2',
          text: 'Check standard work and setup handoff before approving any Step 3 equipment spend.',
          createdAt: epoch(5),
          parentId: IDS.F_STEP2_VARIATION,
          parentKind: 'finding' as const,
          deletedAt: null,
        },
      ],
      statusChangedAt: epoch(5),
      source: { chart: 'boxplot', category: 'Step 2', timeLens: DEFAULT_TIME_LENS },
      validationStatus: 'supports',
    },
    {
      id: IDS.F_STEP2_AFTERNOON,
      deletedAt: null,
      text: 'Step 2 afternoon observations show the most unstable completions, suggesting a handoff or staffing mechanism to verify.',
      createdAt: epoch(6),
      context: {
        activeFilters: { Step: ['Step 2'], Shift: ['Afternoon'] },
        cumulativeScope: null,
        stats: { mean: 41, samples: 15 },
      },
      evidenceType: 'data',
      status: 'investigating',
      comments: [
        {
          id: 'c-bottleneck-afternoon-1',
          text: 'Ask the team whether afternoon changeovers or material staging differ from the morning routine.',
          createdAt: epoch(7),
          parentId: IDS.F_STEP2_AFTERNOON,
          parentKind: 'finding' as const,
          deletedAt: null,
        },
      ],
      statusChangedAt: epoch(7),
      validationStatus: 'supports',
    },
  ];
}

function buildHypotheses(): Hypothesis[] {
  return [
    {
      id: IDS.HUB_STEP2_STANDARD_WORK,
      deletedAt: null,
      name: 'Step 2 standard-work drift',
      synthesis:
        'Step 2 has lower average time than Step 3, but much wider variation. The likely mechanism is inconsistent setup or handoff discipline, especially in afternoon runs.',
      findingIds: [IDS.F_STEP2_VARIATION, IDS.F_STEP2_AFTERNOON],
      evidence: {
        mode: 'standard',
        contribution: {
          value: 0.34,
          label: 'η²',
          description: 'Step-to-step spread explains the main flow difference',
        },
      },
      selectedForImprovement: true,
      status: 'proposed',
      condition: { kind: 'leaf', column: 'Step', op: 'eq', value: 'Step 2' },
      createdAt: epoch(8),
      updatedAt: epoch(8),
    },
    {
      id: IDS.HUB_STEP3_CAPACITY,
      deletedAt: null,
      name: 'Step 3 equipment capacity',
      synthesis:
        'Step 3 is consistently slow, but current data does not support it as the first improvement target because the variation is low.',
      findingIds: [IDS.F_STEP3_AVERAGE],
      evidence: {
        mode: 'standard',
        contribution: {
          value: 0.08,
          label: 'η²',
          description: 'Slow average, limited variation contribution',
        },
      },
      selectedForImprovement: false,
      status: 'proposed',
      condition: { kind: 'leaf', column: 'Step', op: 'eq', value: 'Step 3' },
      createdAt: epoch(8),
      updatedAt: epoch(8),
    },
  ];
}

function buildCategories(): AnalyzeCategory[] {
  return [
    {
      id: IDS.CAT_FLOW,
      createdAt: epoch(0),
      deletedAt: null,
      name: 'Flow',
      factorNames: ['Step'],
      color: '#3b82f6',
      inferredFrom: 'Step',
    },
    {
      id: IDS.CAT_WORKFORCE,
      createdAt: epoch(0),
      deletedAt: null,
      name: 'Workforce',
      factorNames: ['Shift', 'Day'],
      color: '#a855f7',
      inferredFrom: 'Shift',
    },
  ];
}

export const bottleneck: SampleDataset = {
  name: 'Case: The Bottleneck',
  description: 'Process step analysis - which step is really the bottleneck?',
  icon: 'factory',
  urlKey: 'bottleneck',
  category: 'cases',
  featured: true,
  data: generateBottleneckData(),
  config: {
    outcome: 'Cycle_Time_sec',
    factors: ['Step', 'Shift'],
    specs: { target: 40 },
    processMap: {
      version: 1,
      ctsColumn: 'Cycle_Time_sec',
      nodes: [
        { id: 'step-1', name: 'Step 1', order: 0, ctqColumn: 'Cycle_Time_sec' },
        { id: 'step-2', name: 'Step 2', order: 1, ctqColumn: 'Cycle_Time_sec' },
        {
          id: 'step-3',
          name: 'Step 3',
          order: 2,
          ctqColumn: 'Cycle_Time_sec',
          capabilityScope: {
            specRules: [{ specs: { lsl: 42, usl: 46, cpkTarget: 1.33 } }],
          },
        },
        { id: 'step-4', name: 'Step 4', order: 3, ctqColumn: 'Cycle_Time_sec' },
        { id: 'step-5', name: 'Step 5', order: 4, ctqColumn: 'Cycle_Time_sec' },
      ],
      tributaries: [{ id: 'trib-shift', stepId: 'step-2', column: 'Shift', role: 'shift' }],
      subgroupAxes: [],
      hunches: [
        {
          id: 'h-step2',
          text: 'Step 2 is the constraint — widest spread',
          tributaryId: 'trib-shift',
        },
      ],
      createdAt: '2026-06-06T00:00:00.000Z',
      updatedAt: '2026-06-06T00:00:00.000Z',
    },
    stepTimings: [
      { kind: 'paired', stepId: 'step-1', startColumn: 'Step_1_Start', endColumn: 'Step_1_End' },
      { kind: 'paired', stepId: 'step-2', startColumn: 'Step_2_Start', endColumn: 'Step_2_End' },
      { kind: 'paired', stepId: 'step-3', startColumn: 'Step_3_Start', endColumn: 'Step_3_End' },
      { kind: 'paired', stepId: 'step-4', startColumn: 'Step_4_Start', endColumn: 'Step_4_End' },
      { kind: 'paired', stepId: 'step-5', startColumn: 'Step_5_Start', endColumn: 'Step_5_End' },
    ],
    investigation: {
      findings: buildFindings(),
      hypotheses: buildHypotheses(),
      categories: buildCategories(),
    },
    improvementProject: {
      issueStatement:
        'Management wants to upgrade Step 3, but the data shows Step 2 variation is the more urgent flow constraint to investigate.',
      metadata: {
        businessCase:
          'Avoid a premature Step 3 capital spend by stabilizing Step 2 variation first.',
      },
      goal: {
        outcomeGoals: [
          {
            outcomeSpecId: 'cycle-time-sec',
            baseline: 40,
            target: 34,
            deadline: '2026-06-26',
            stepId: 'step-2',
          },
        ],
        factorControls: [
          {
            factor: 'Step',
            targetCondition: 'Step 2 afternoon cycle-time range reduced before Step 3 spend review',
            linkedHypothesisId: IDS.HUB_STEP2_STANDARD_WORK,
            stepId: 'step-2',
          },
        ],
        mechanismGoals: [
          {
            description:
              'Verify whether Step 2 afternoon variation comes from setup handoff or standard-work drift.',
            linkedFindingIds: [IDS.F_STEP2_VARIATION, IDS.F_STEP2_AFTERNOON],
          },
        ],
      },
      sections: {
        background: {
          snapshotText:
            'Step 3 is slow on average, but Step 2 has the wider cycle-time spread and creates less predictable flow.',
          manualNarrative:
            'The demo should lead the analyst from averages to variation before choosing an improvement target.',
        },
        approach: {
          narrative:
            'Start with a Step 2 gemba check, trial standard-work reinforcement, and compare the next 30 observations before revisiting Step 3 investment.',
        },
      },
      actions: [
        {
          id: 'act-bottleneck-gemba-step2',
          text: 'Observe Step 2 afternoon handoff and record setup differences',
          stepId: 'step-2',
          status: 'in-progress',
          assignedTo: { displayName: 'Line lead' },
          dueAt: '2026-06-12',
          doneAt: null,
          doneBy: null,
          createdBy: { displayName: 'VariScout demo' },
          createdAt: epoch(9),
        },
        {
          id: 'act-bottleneck-standard-work',
          text: 'Trial Step 2 standard-work checklist for one production day',
          stepId: 'step-2',
          status: 'open',
          assignedTo: { displayName: 'CI specialist' },
          dueAt: '2026-06-17',
          doneAt: null,
          doneBy: null,
          createdBy: { displayName: 'VariScout demo' },
          createdAt: epoch(10),
        },
        {
          id: 'act-bottleneck-hold-step3-spend',
          text: 'Pause Step 3 equipment request until Step 2 variation trial is reviewed',
          stepId: 'step-3',
          status: 'done',
          assignedTo: null,
          dueAt: null,
          doneAt: iso(11),
          doneBy: { displayName: 'Sponsor' },
          createdBy: { displayName: 'VariScout demo' },
          createdAt: epoch(10),
        },
      ],
    },
  },
};
