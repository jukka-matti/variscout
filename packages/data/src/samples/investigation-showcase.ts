import type { SampleDataset } from '../types';
import { seedRandom, generateNormal, round } from '../utils';
import type { Finding, Question, SuspectedCause, InvestigationCategory } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

// ============================================================================
// Stable IDs for cross-referencing between questions, findings, and hubs
// ============================================================================

const IDS = {
  // Questions
  Q_LINE: 'q-line-effect',
  Q_LINE_NOZZLE: 'q-line2-nozzle',
  Q_SHIFT: 'q-shift-effect',
  Q_SHIFT_FATIGUE: 'q-shift-fatigue',
  Q_BATCH: 'q-batch-effect',
  Q_OPERATOR: 'q-operator-effect',
  // Findings
  F_LINE2_HIGH: 'f-line2-high',
  F_NIGHT_SPREAD: 'f-night-spread',
  F_BATCHC_LOW: 'f-batchc-low',
  F_LINE2_NIGHT: 'f-line2-night',
  F_BENCHMARK: 'f-benchmark',
  // Hub
  HUB_NOZZLE: 'hub-line2-nozzle',
  // Categories
  CAT_EQUIPMENT: 'cat-equipment',
  CAT_OPERATIONS: 'cat-operations',
  // Ideas
  IDEA_REPLACE: 'idea-replace-nozzle',
  IDEA_SCHEDULE: 'idea-schedule-maintenance',
} as const;

// ============================================================================
// Timestamps (mid-investigation, spaced over ~3 days)
// ============================================================================

const BASE = new Date('2026-04-01T09:00:00Z');
const ts = (hoursOffset: number) => new Date(BASE.getTime() + hoursOffset * 3600000);
const iso = (hoursOffset: number) => ts(hoursOffset).toISOString();
const epoch = (hoursOffset: number) => ts(hoursOffset).getTime();

// ============================================================================
// Data Generation
// ============================================================================

/**
 * Generate ~216 fill weight observations across 3 lines × 3 shifts × 4 batches × 3 operators.
 *
 * Statistical structure:
 * - Line 2: mean shift +2g (502 vs 500 target), 2× variation (σ≈2.0 vs 1.0)
 * - Night shift: 1.5× variation across all lines
 * - Batch C: slight mean shift −0.5g (negligible)
 * - Operator: no significant effect
 */
function generateFillWeightData(): Record<string, unknown>[] {
  seedRandom(2026);
  const lines = ['Line 1', 'Line 2', 'Line 3'];
  const shifts = ['Morning', 'Afternoon', 'Night'];
  const batches = ['Batch A', 'Batch B', 'Batch C', 'Batch D'];
  const operators = ['Kim', 'Lee', 'Park'];
  const data: Record<string, unknown>[] = [];
  let obs = 1;

  for (const line of lines) {
    for (const shift of shifts) {
      for (const batch of batches) {
        for (const operator of operators) {
          // 2 replicates per combination
          for (let rep = 0; rep < 2; rep++) {
            // Base mean: 500g target
            let mean = 500;
            let sigma = 1.0;

            // Line effect: Line 2 has worn nozzle → mean shift + higher variation
            if (line === 'Line 2') {
              mean += 2.0;
              sigma *= 2.0;
            } else if (line === 'Line 3') {
              mean += 0.3; // slight positive bias
            }

            // Shift effect: Night has higher variation (fatigue/reduced oversight)
            if (shift === 'Night') {
              sigma *= 1.5;
            } else if (shift === 'Afternoon') {
              sigma *= 1.1; // slight increase
            }

            // Batch effect: Batch C slightly low (negligible)
            if (batch === 'Batch C') {
              mean -= 0.5;
            }

            // Operator effect: negligible (< 0.1g differences)
            // No systematic operator effect — just noise

            const weight = round(generateNormal(mean, sigma), 1);

            data.push({
              Observation: obs++,
              Fill_Weight_g: weight,
              Line: line,
              Shift: shift,
              Material_Batch: batch,
              Operator: operator,
            });
          }
        }
      }
    }
  }
  return data;
}

// ============================================================================
// Pre-populated Investigation State
// ============================================================================

function buildQuestions(): Question[] {
  return [
    // Q1: Line effect — ANSWERED (key driver)
    {
      id: IDS.Q_LINE,
      text: 'Does the filling line affect fill weight?',
      factor: 'Line',
      status: 'answered',
      linkedFindingIds: [IDS.F_LINE2_HIGH, IDS.F_LINE2_NIGHT],
      createdAt: iso(0),
      updatedAt: iso(24),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.25,
        rSquaredAdj: 0.23,
      },
      ideas: [
        {
          id: IDS.IDEA_REPLACE,
          text: 'Replace worn nozzle on Line 2 and calibrate to 500g target',
          timeframe: 'days',
          cost: { category: 'low' },
          direction: 'eliminate',
          selected: true,
          notes: 'Maintenance team estimates 4-hour downtime for replacement',
          createdAt: iso(26),
        },
        {
          id: IDS.IDEA_SCHEDULE,
          text: 'Add Line 2 nozzle to weekly preventive maintenance checklist',
          timeframe: 'days',
          cost: { category: 'none' },
          direction: 'prevent',
          selected: false,
          createdAt: iso(26),
        },
      ],
    },
    // Q2: Line 2 nozzle — sub-question, INVESTIGATING (gemba pending)
    {
      id: IDS.Q_LINE_NOZZLE,
      text: "Is Line 2's mean shift caused by nozzle wear?",
      factor: 'Line',
      level: 'Line 2',
      status: 'investigating',
      linkedFindingIds: [IDS.F_LINE2_HIGH],
      createdAt: iso(2),
      updatedAt: iso(48),
      parentId: IDS.Q_LINE,
      validationType: 'gemba',
      validationTask: 'Inspect Line 2 nozzle for wear marks and measure orifice diameter',
      taskCompleted: false,
      questionSource: 'analyst',
    },
    // Q3: Shift effect — INVESTIGATING
    {
      id: IDS.Q_SHIFT,
      text: 'Does shift affect fill weight variation?',
      factor: 'Shift',
      status: 'investigating',
      linkedFindingIds: [IDS.F_NIGHT_SPREAD],
      createdAt: iso(1),
      updatedAt: iso(36),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.08,
      },
    },
    // Q4: Shift fatigue sub-question — OPEN
    {
      id: IDS.Q_SHIFT_FATIGUE,
      text: 'Is night shift variation due to operator fatigue or reduced maintenance coverage?',
      factor: 'Shift',
      level: 'Night',
      status: 'open',
      linkedFindingIds: [],
      createdAt: iso(38),
      updatedAt: iso(38),
      parentId: IDS.Q_SHIFT,
      validationType: 'gemba',
      validationTask: 'Interview night shift operators about workload and break schedule',
      questionSource: 'analyst',
    },
    // Q5: Batch effect — RULED OUT
    {
      id: IDS.Q_BATCH,
      text: 'Does material batch affect fill weight?',
      factor: 'Material_Batch',
      status: 'ruled-out',
      linkedFindingIds: [IDS.F_BATCHC_LOW],
      createdAt: iso(1),
      updatedAt: iso(30),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.02,
      },
      manualNote:
        'η² = 2% — effect is statistically detectable but too small to be practically significant. Batch C mean is only 0.5g below target, well within spec.',
    },
    // Q6: Operator effect — RULED OUT
    {
      id: IDS.Q_OPERATOR,
      text: 'Does operator affect fill weight?',
      factor: 'Operator',
      status: 'ruled-out',
      linkedFindingIds: [],
      createdAt: iso(1),
      updatedAt: iso(24),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.005,
      },
      manualNote:
        'No significant operator effect (η² < 1%, p > 0.3). All operators perform equivalently.',
    },
  ];
}

function buildFindings(): Finding[] {
  return [
    // F1: Line 2 runs high — ANALYZED, key-driver
    {
      id: IDS.F_LINE2_HIGH,
      text: 'Line 2 runs consistently high — mean ~502g vs 500g target. Also shows wider spread than Lines 1 and 3.',
      createdAt: epoch(3),
      context: {
        activeFilters: { Line: ['Line 2'] },
        cumulativeScope: null,
        stats: { mean: 502.1, cpk: 0.49, samples: 72 },
      },
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-1',
          text: 'Boxplot clearly shows Line 2 higher and wider than others. This is the dominant factor.',
          createdAt: epoch(4),
        },
        {
          id: 'c-2',
          text: 'Pareto confirms Line 2 has the highest variation contribution. Best Subsets R²adj = 0.23 for Line alone.',
          createdAt: epoch(25),
        },
      ],
      statusChangedAt: epoch(25),
      source: { chart: 'boxplot', category: 'Line 2', timeLens: DEFAULT_TIME_LENS },
      questionId: IDS.Q_LINE,
      validationStatus: 'supports',
      projection: {
        baselineMean: 502.1,
        baselineSigma: 2.0,
        baselineCpk: 0.49,
        baselinePassRate: 92.3,
        projectedMean: 500.0,
        projectedSigma: 1.0,
        projectedCpk: 1.67,
        projectedPassRate: 99.99,
        meanDelta: -2.1,
        sigmaDelta: -1.0,
        targetContribution: 0.85,
        simulationParams: {
          meanAdjustment: -2.1,
          variationReduction: 50,
          presetUsed: 'match-best',
        },
        createdAt: iso(26),
      },
    },
    // F2: Night shift spread — INVESTIGATING
    {
      id: IDS.F_NIGHT_SPREAD,
      text: 'Night shift has wider spread across all lines. IQR is ~1.5× larger than Morning shift.',
      createdAt: epoch(6),
      context: {
        activeFilters: { Shift: ['Night'] },
        cumulativeScope: null,
        stats: { mean: 500.5, cpk: 0.72, samples: 72 },
      },
      status: 'investigating',
      comments: [
        {
          id: 'c-3',
          text: 'Filtering to Night only shows increased variation. Need to check if this is fatigue or maintenance related.',
          createdAt: epoch(7),
        },
      ],
      statusChangedAt: epoch(36),
      source: { chart: 'boxplot', category: 'Night', timeLens: DEFAULT_TIME_LENS },
      questionId: IDS.Q_SHIFT,
      validationStatus: 'supports',
    },
    // F3: Batch C slightly low — OBSERVED
    {
      id: IDS.F_BATCHC_LOW,
      text: 'Batch C fill weights slightly low but within spec. Mean ~499.5g.',
      createdAt: epoch(8),
      context: {
        activeFilters: { Material_Batch: ['Batch C'] },
        cumulativeScope: null,
        stats: { mean: 499.5, cpk: 1.1, samples: 54 },
      },
      status: 'observed',
      comments: [],
      statusChangedAt: epoch(8),
      source: { chart: 'boxplot', category: 'Batch C', timeLens: DEFAULT_TIME_LENS },
      questionId: IDS.Q_BATCH,
      validationStatus: 'inconclusive',
    },
    // F4: Line 2 + Night worst combination — INVESTIGATING
    {
      id: IDS.F_LINE2_NIGHT,
      text: 'Line 2 + Night shift combination shows worst Cpk (~0.35). This is the critical interaction.',
      createdAt: epoch(12),
      context: {
        activeFilters: { Line: ['Line 2'], Shift: ['Night'] },
        cumulativeScope: null,
        stats: { mean: 502.3, cpk: 0.35, samples: 24 },
      },
      status: 'investigating',
      comments: [
        {
          id: 'c-4',
          text: 'Interaction between worn nozzle (Line 2) and night shift fatigue creates the worst-case scenario.',
          createdAt: epoch(13),
        },
      ],
      statusChangedAt: epoch(36),
      questionId: IDS.Q_LINE,
      validationStatus: 'supports',
    },
    // F5: Benchmark — Line 1 Morning
    {
      id: IDS.F_BENCHMARK,
      text: 'Line 1 Morning shift is the best-in-class benchmark. Centered at target with tight spread.',
      createdAt: epoch(20),
      context: {
        activeFilters: { Line: ['Line 1'], Shift: ['Morning'] },
        cumulativeScope: null,
        stats: { mean: 500.0, cpk: 1.65, samples: 24 },
      },
      status: 'analyzed',
      comments: [],
      statusChangedAt: epoch(20),
      role: 'benchmark',
      benchmarkStats: {
        mean: 500.0,
        stdDev: 1.01,
        cpk: 1.65,
        count: 24,
      },
    },
  ];
}

function buildSuspectedCauses(): SuspectedCause[] {
  return [
    {
      id: IDS.HUB_NOZZLE,
      name: 'Line 2 nozzle wear',
      synthesis:
        'Line 2 consistently overfills by ~2g with approximately twice the variation of other lines. ' +
        'Combined with night shift reduced oversight, this produces the worst Cpk readings in the plant. ' +
        'Gemba inspection of the Line 2 nozzle orifice is pending to confirm physical wear.',
      questionIds: [IDS.Q_LINE, IDS.Q_LINE_NOZZLE, IDS.Q_SHIFT],
      findingIds: [IDS.F_LINE2_HIGH, IDS.F_NIGHT_SPREAD, IDS.F_LINE2_NIGHT],
      evidence: {
        mode: 'standard',
        contribution: {
          value: 0.23,
          label: 'R²adj',
          description: 'Explains 23% of variation',
        },
      },
      selectedForImprovement: true,
      status: 'suspected',
      createdAt: iso(28),
      updatedAt: iso(48),
    },
  ];
}

function buildCategories(): InvestigationCategory[] {
  return [
    {
      id: IDS.CAT_EQUIPMENT,
      name: 'Equipment',
      factorNames: ['Line'],
      color: '#3b82f6', // blue
      inferredFrom: 'Line',
    },
    {
      id: IDS.CAT_OPERATIONS,
      name: 'Operations',
      factorNames: ['Shift', 'Operator'],
      color: '#a855f7', // purple
      inferredFrom: 'Shift',
    },
  ];
}

// ============================================================================
// Export
// ============================================================================

export const investigationShowcase: SampleDataset = {
  name: 'Showcase: Fill Weight Investigation',
  description:
    'Packaging line fill weight with pre-populated questions, findings, and suspected cause hub. Demonstrates the full investigation workflow.',
  icon: 'microscope',
  urlKey: 'investigation-showcase',
  category: 'journeys',
  featured: true,
  data: generateFillWeightData(),
  config: {
    outcome: 'Fill_Weight_g',
    factors: ['Line', 'Shift', 'Material_Batch', 'Operator'],
    specs: { lsl: 495, usl: 505, target: 500 },
    subgroupConfig: { method: 'fixed-size', size: 5 },
    investigation: {
      findings: buildFindings(),
      questions: buildQuestions(),
      suspectedCauses: buildSuspectedCauses(),
      categories: buildCategories(),
    },
    processMap: {
      version: 1,
      ctsColumn: 'Fill_Weight_g',
      nodes: [{ id: 'step-fill', name: 'Fill', order: 0, ctqColumn: 'Fill_Weight_g' }],
      tributaries: [
        { id: 'trib-line', stepId: 'step-fill', column: 'Line', role: 'machine' },
        { id: 'trib-shift', stepId: 'step-fill', column: 'Shift', role: 'shift' },
        { id: 'trib-batch', stepId: 'step-fill', column: 'Material_Batch', role: 'batch' },
        { id: 'trib-operator', stepId: 'step-fill', column: 'Operator', role: 'operator' },
      ],
      subgroupAxes: ['trib-line'],
      hunches: [
        { id: 'h-nozzle', text: 'Nozzle wear on Line 2', tributaryId: 'trib-line' },
        { id: 'h-night', text: 'Night shift has more spread', tributaryId: 'trib-shift' },
      ],
      createdAt: iso(0),
      updatedAt: iso(0),
    },
  },
};
