/**
 * Syringe Barrel Weight — end-to-end Green Belt demo investigation.
 *
 * Story: a 2-cavity injection-molding process producing medical syringe barrels.
 * Target weight 12.00 g (USL 12.30 / LSL 11.70). Baseline process is not capable
 * (Cpk < 1.0) with a left-skewed tail. Stratified EDA reveals a disordinal
 * Lot × Hold-Pressure interaction: material Lot 3 has higher regrind content and
 * needs ~5 bar more hold pressure to match Lot 1/2 weight. Cavity 2 also runs
 * slightly light. Operator and Shift are red herrings.
 *
 * Seeded investigation walks the full RDMAIC spine (Define/Measure → Analyze →
 * Improve → Control) so a first-time user opening `?sample=syringe-barrel-weight`
 * sees a complete GB-level investigation.
 */
import type { SampleDataset } from '../types';
import { mulberry32 } from '../utils';
import type { Finding, Hypothesis, CausalLink, AnalyzeCategory } from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

// ============================================================================
// Stable IDs — enable cross-references between questions, findings, hubs, links
// ============================================================================

const IDS = {
  // Findings
  F_CAPABILITY_GAP: 'f-sbw-capability-gap',
  F_LOT3_LIGHT: 'f-sbw-lot3-light',
  F_PRESSURE_SLOPE: 'f-sbw-pressure-slope',
  F_INTERACTION: 'f-sbw-lot-pressure-interaction',
  F_CAVITY2_LIGHT: 'f-sbw-cavity2-light',
  F_DEFECT_PARETO: 'f-sbw-defect-pareto',
  F_WITHIN_LOT_CPK: 'f-sbw-within-lot-cpk',
  // Hub
  HUB_LOT3_PRESSURE: 'hub-sbw-lot3-pressure',
  // Causal links
  L_PRESSURE_WEIGHT: 'l-sbw-pressure-weight',
  L_LOT_WEIGHT: 'l-sbw-lot-weight',
  L_LOT_MODULATES_PRESSURE: 'l-sbw-lot-modulates-pressure',
  L_CAVITY_WEIGHT: 'l-sbw-cavity-weight',
  // Categories
  CAT_MATERIAL: 'cat-sbw-material',
  CAT_PROCESS: 'cat-sbw-process',
  CAT_WORKFORCE: 'cat-sbw-workforce',
  // Improvement ideas
  IDEA_LOT3_RECIPE: 'idea-sbw-lot3-recipe',
  IDEA_INSPECT_L3: 'idea-sbw-inspect-l3',
  IDEA_CAVITY2_GATE: 'idea-sbw-cavity2-gate',
} as const;

// ============================================================================
// Time anchors — roughly "3 weeks of production" ending a few days ago
// ============================================================================

const BASE = new Date('2026-03-23T06:00:00Z');
const hoursToMs = (h: number) => h * 3_600_000;
const isoAt = (hoursFromBase: number) =>
  new Date(BASE.getTime() + hoursToMs(hoursFromBase)).toISOString();
const epochAt = (hoursFromBase: number) => BASE.getTime() + hoursToMs(hoursFromBase);

// ============================================================================
// Data generation (deterministic — seeded PRNG, never Math.random)
// ============================================================================

/**
 * Generate 300 observations with a known causal structure:
 *
 *   weight = 12.00
 *          + lotEffect[lot]                      // L1=+0.03, L2=0, L3=-0.10
 *          + 0.015 * (holdPressure - 83)         // linear pressure driver
 *          + cavityEffect[cavity]                // Cav1=+0.025, Cav2=-0.025
 *          + (lot==='L3' ? 0.012 * (p - 83) : 0) // disordinal L3 × pressure
 *          + N(0, 0.075)                         // residual noise
 *
 * Lots run sequentially (each ~100 rows in a 1-week block), so time-ordered
 * charts show step changes when lots change — useful for the investigation story.
 * Operator and Shift are intentionally uncorrelated with weight.
 */
function generateData(): Record<string, unknown>[] {
  const rng = mulberry32(2026);
  const uniform = (lo: number, hi: number) => lo + (hi - lo) * rng();
  const normal = (mean: number, sd: number) => {
    const u = 1 - rng();
    const v = rng();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const lotEffect: Record<string, number> = { L1: 0.03, L2: 0, L3: -0.1 };
  const cavityEffect: Record<string, number> = { Cav1: 0.055, Cav2: -0.055 };

  const lots = ['L1', 'L2', 'L3'];
  const cavities = ['Cav1', 'Cav2'];
  const operators = ['A', 'B'];
  const CYCLES_PER_COMBO = 25; // 3 * 2 * 2 * 25 = 300

  const rows: Record<string, unknown>[] = [];
  let obs = 1;
  let hours = 0;

  for (const lot of lots) {
    for (const cavity of cavities) {
      for (const operator of operators) {
        for (let cycle = 0; cycle < CYCLES_PER_COMBO; cycle++) {
          const shift = cycle < Math.floor(CYCLES_PER_COMBO / 2) ? 'Day' : 'Eve';
          const holdPressure = uniform(75, 92);
          const holdPressureRounded = Math.round(holdPressure * 10) / 10;
          const interaction = lot === 'L3' ? 0.012 * (holdPressure - 83) : 0;
          const weightRaw =
            12.0 +
            lotEffect[lot] +
            0.015 * (holdPressure - 83) +
            cavityEffect[cavity] +
            interaction +
            normal(0, 0.075);
          const weight = Math.round(weightRaw * 1000) / 1000;

          // Defect_Type is QC's judgement at inspection. Rules mirror the causal
          // story: underweight tails below LSL, short shots from low pressure,
          // flash from high pressure on Cav2, sink marks ~5% random (red herring
          // for Pareto ranking), contamination rare. Keep independent rolls
          // consistent across the loop (two rng draws per part) for determinism.
          const randSink = rng();
          const randContam = rng();
          let defect = 'OK';
          if (weight < 11.8) {
            defect = 'Underweight';
          } else if (holdPressure < 77) {
            defect = 'Short_Shot';
          } else if (holdPressure > 90 && cavity === 'Cav2') {
            defect = 'Flash';
          } else if (randSink < 0.05) {
            defect = 'Sink_Mark';
          } else if (randContam < 0.015) {
            defect = 'Contamination';
          }

          rows.push({
            Observation: obs++,
            Timestamp: isoAt(hours),
            Lot_ID: lot,
            Hold_Pressure_bar: holdPressureRounded,
            Cavity: cavity,
            Operator: operator,
            Shift: shift,
            Defect_Type: defect,
            Weight_g: weight,
          });

          hours += 1.5; // ~16 obs/day -> 300 rows spans ~18.75 days (≈ 3 weeks)
        }
      }
    }
  }
  return rows;
}

// ============================================================================
// Investigation payload
// ============================================================================

function buildFindings(): Finding[] {
  return [
    // F1 — capability gap (Define/Measure finding)
    {
      id: IDS.F_CAPABILITY_GAP,
      deletedAt: null,
      text: 'Process is not capable: Cpk ≈ 0.76 against USL 12.30 / LSL 11.70 (within-subgroup sigma, n=5 rational subgroups). The distribution has a left tail — roughly 4% of parts are below LSL.',
      createdAt: epochAt(2),
      context: {
        activeFilters: {},
        cumulativeScope: null,
        stats: { mean: 11.99, cpk: 0.76, samples: 300 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-cap-1',
          parentId: IDS.F_CAPABILITY_GAP,
          parentKind: 'finding' as const,
          deletedAt: null,
          text: 'Probability plot shows left-tail deviation from normal — underweight parts dominate the failure mode.',
          createdAt: epochAt(3),
        },
      ],
      statusChangedAt: epochAt(4),
      source: { chart: 'probability', anchorX: 11.7, anchorY: 0.02, timeLens: DEFAULT_TIME_LENS },
      validationStatus: 'supports',
    },
    // F2 — Lot 3 runs light (boxplot by Lot)
    {
      id: IDS.F_LOT3_LIGHT,
      deletedAt: null,
      text: 'Lot 3 runs ~0.10 g lighter than Lot 1 and Lot 2. Boxplot shows the entire L3 distribution shifted down.',
      createdAt: epochAt(8),
      context: {
        activeFilters: { Lot_ID: ['L3'] },
        cumulativeScope: null,
        stats: { mean: 11.92, cpk: 0.45, samples: 100 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-lot-1',
          parentId: IDS.F_LOT3_LIGHT,
          parentKind: 'finding' as const,
          deletedAt: null,
          text: 'η² ≈ 0.18 — Lot explains ~18% of total weight variation. Material is a first-order driver.',
          createdAt: epochAt(9),
        },
      ],
      statusChangedAt: epochAt(10),
      source: { chart: 'boxplot', category: 'L3', timeLens: DEFAULT_TIME_LENS },
      validationStatus: 'supports',
    },
    // F3 — Hold Pressure positive slope (scatter / regression)
    {
      id: IDS.F_PRESSURE_SLOPE,
      deletedAt: null,
      text: 'Hold Pressure is a continuous driver: weight increases ~0.015 g per bar. Linear regression R²adj ≈ 0.31 on pressure alone.',
      createdAt: epochAt(10),
      context: {
        activeFilters: {},
        cumulativeScope: null,
        stats: { mean: 11.99, samples: 300 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-press-1',
          parentId: IDS.F_PRESSURE_SLOPE,
          parentKind: 'finding' as const,
          deletedAt: null,
          text: 'Scatter of Weight vs Hold Pressure shows a clear positive trend. This is the most actionable continuous lever we have.',
          createdAt: epochAt(11),
        },
      ],
      statusChangedAt: epochAt(12),
      validationStatus: 'supports',
    },
    // F4 — Lot × Pressure interaction (the "aha" finding)
    {
      id: IDS.F_INTERACTION,
      deletedAt: null,
      text: 'Disordinal Lot × Hold-Pressure interaction: Lot 3 needs ~5 bar more pressure than L1/L2 to reach the same weight. L3 slope is ~0.027 g/bar vs ~0.015 g/bar for L1/L2.',
      createdAt: epochAt(16),
      context: {
        activeFilters: { Lot_ID: ['L3'] },
        cumulativeScope: null,
        stats: { mean: 11.92, samples: 100 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-int-1',
          parentId: IDS.F_INTERACTION,
          parentKind: 'finding' as const,
          deletedAt: null,
          text: 'Interaction plot shows Lot 1/2 lines nearly parallel; Lot 3 line crosses them — classic disordinal pattern. Higher regrind fraction on L3 raises melt viscosity and shifts the pressure sensitivity.',
          createdAt: epochAt(17),
        },
      ],
      statusChangedAt: epochAt(20),
      validationStatus: 'supports',
    },
    // F5 — Cavity 2 slightly light (boxplot by Cavity)
    {
      id: IDS.F_CAVITY2_LIGHT,
      deletedAt: null,
      text: 'Cavity 2 runs ~0.11 g lighter than Cavity 1 on average (η² ≈ 10%). Secondary contributor — likely gate geometry — addressable during next mold maintenance.',
      createdAt: epochAt(12),
      context: {
        activeFilters: { Cavity: ['Cav2'] },
        cumulativeScope: null,
        stats: { mean: 11.93, samples: 150 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      comments: [
        {
          id: 'c-cav-1',
          parentId: IDS.F_CAVITY2_LIGHT,
          parentKind: 'finding' as const,
          deletedAt: null,
          text: 'Secondary contributor. Worth addressing during the next mold maintenance window.',
          createdAt: epochAt(13),
        },
      ],
      statusChangedAt: epochAt(14),
      source: { chart: 'boxplot', category: 'Cav2', timeLens: DEFAULT_TIME_LENS },
      validationStatus: 'supports',
    },
    // F6 — Defect Pareto (80/20 priority)
    {
      id: IDS.F_DEFECT_PARETO,
      deletedAt: null,
      text: 'Underweight dominates the QC defect Pareto (34 events, 42% of non-OK). Short Shot and Flash follow at ~20 each. The underweight cluster is the same physical problem as the capability gap — fixing Lot 3 pressure should attack both at once.',
      createdAt: epochAt(14),
      context: {
        activeFilters: {},
        cumulativeScope: null,
        stats: { mean: 11.99, samples: 300 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-pareto-1',
          parentId: IDS.F_DEFECT_PARETO,
          parentKind: 'finding' as const,
          deletedAt: null,
          text: 'Pareto confirms the 80/20: the top-3 defect modes cover ~83% of all non-OK events. Prioritize Underweight.',
          createdAt: epochAt(15),
        },
      ],
      statusChangedAt: epochAt(18),
      source: { chart: 'pareto', category: 'Underweight', timeLens: DEFAULT_TIME_LENS },
      validationStatus: 'supports',
    },
    // F7 — Within-lot Cpk variation (capability mode insight)
    {
      id: IDS.F_WITHIN_LOT_CPK,
      deletedAt: null,
      text: 'Within-lot Cpk varies widely on Lot 3: rolling n=5 subgroup Cpks span roughly 0.3–1.1 on L3 vs 0.8–1.6 on L1/L2. The tail is not uniform — L3 has weak subgroups that drive the overall gap.',
      createdAt: epochAt(18),
      context: {
        activeFilters: { Lot_ID: ['L3'] },
        cumulativeScope: null,
        stats: { mean: 11.92, cpk: 0.45, samples: 100 },
      },
      evidenceType: 'data',
      status: 'analyzed',
      comments: [
        {
          id: 'c-within-1',
          parentId: IDS.F_WITHIN_LOT_CPK,
          parentKind: 'finding' as const,
          deletedAt: null,
          text: 'Toggle the I-chart to Capability view to see the per-subgroup Cpk trajectory. Boxplot of Lot × Cpk (capability mode) shows L3 centered well below 1.0.',
          createdAt: epochAt(19),
        },
      ],
      statusChangedAt: epochAt(20),
      validationStatus: 'supports',
    },
  ];
}

function buildHypotheses(): Hypothesis[] {
  return [
    {
      id: IDS.HUB_LOT3_PRESSURE,
      deletedAt: null,
      name: 'Lot 3 under-pressurized — regrind-rich material needs +5 bar',
      synthesis:
        'Lot 3 contains more regrind than Lots 1 and 2, which raises melt viscosity and makes weight more sensitive to hold pressure. At the current 83 bar setpoint, L3 barrels fall ~0.10 g light on average, producing the left tail that drives Cpk below 1.0. QC-caught "Underweight" defects cluster on the same population, confirming this is the 80/20 priority. A lot-specific pressure recipe (L3 → ~88 bar) is expected to recover the tail, collapse the Underweight Pareto bar, and restore capability. Cavity 2 contributes a secondary ~0.10 g main effect.',
      findingIds: [
        IDS.F_LOT3_LIGHT,
        IDS.F_PRESSURE_SLOPE,
        IDS.F_INTERACTION,
        IDS.F_DEFECT_PARETO,
        IDS.F_WITHIN_LOT_CPK,
      ],
      evidence: {
        mode: 'standard',
        contribution: {
          value: 0.52,
          label: 'R²adj',
          description: 'Lot + Pressure + interaction explain ~52% of variation',
        },
      },
      selectedForImprovement: true,
      status: 'proposed',
      createdAt: epochAt(20),
      updatedAt: epochAt(26),
    },
  ];
}

function buildCausalLinks(): CausalLink[] {
  return [
    {
      id: IDS.L_PRESSURE_WEIGHT,
      deletedAt: null,
      fromFactor: 'Hold_Pressure_bar',
      toFactor: 'Weight_g',
      whyStatement:
        'Higher hold pressure packs more melt into the cavity before freeze-off, increasing barrel weight.',
      direction: 'drives',
      evidenceType: 'data',
      findingIds: [IDS.F_PRESSURE_SLOPE],
      hypothesisId: IDS.HUB_LOT3_PRESSURE,
      strength: 0.31,
      source: 'analyst',
      createdAt: epochAt(20),
      updatedAt: epochAt(20),
    },
    {
      id: IDS.L_LOT_WEIGHT,
      deletedAt: null,
      fromFactor: 'Lot_ID',
      toFactor: 'Weight_g',
      whyStatement:
        'Lot 3 has higher regrind content, which lowers effective fill density at current pressure.',
      direction: 'drives',
      evidenceType: 'data',
      findingIds: [IDS.F_LOT3_LIGHT],
      hypothesisId: IDS.HUB_LOT3_PRESSURE,
      strength: 0.18,
      source: 'analyst',
      createdAt: epochAt(20),
      updatedAt: epochAt(20),
    },
    {
      id: IDS.L_LOT_MODULATES_PRESSURE,
      deletedAt: null,
      fromFactor: 'Lot_ID',
      toFactor: 'Hold_Pressure_bar',
      whyStatement:
        'Regrind content changes viscosity, which changes how much hold pressure is needed to reach target weight (disordinal interaction).',
      direction: 'modulates',
      evidenceType: 'data',
      findingIds: [IDS.F_INTERACTION],
      hypothesisId: IDS.HUB_LOT3_PRESSURE,
      source: 'analyst',
      relationshipType: 'interactive',
      createdAt: epochAt(20),
      updatedAt: epochAt(20),
    },
    {
      id: IDS.L_CAVITY_WEIGHT,
      deletedAt: null,
      fromFactor: 'Cavity',
      toFactor: 'Weight_g',
      whyStatement:
        'Cavity 2 gate geometry restricts melt flow slightly, producing a ~0.05 g persistent underfill.',
      direction: 'drives',
      evidenceType: 'data',
      findingIds: [IDS.F_CAVITY2_LIGHT],
      strength: 0.04,
      source: 'analyst',
      createdAt: epochAt(20),
      updatedAt: epochAt(20),
    },
  ];
}

function buildCategories(): AnalyzeCategory[] {
  return [
    {
      id: IDS.CAT_MATERIAL,
      createdAt: epochAt(0),
      deletedAt: null,
      name: 'Material',
      factorNames: ['Lot_ID'],
      color: '#f97316', // orange
      inferredFrom: 'Lot_ID',
    },
    {
      id: IDS.CAT_PROCESS,
      createdAt: epochAt(0),
      deletedAt: null,
      name: 'Process',
      factorNames: ['Hold_Pressure_bar', 'Cavity'],
      color: '#3b82f6', // blue
      inferredFrom: 'Hold_Pressure_bar',
    },
    {
      id: IDS.CAT_WORKFORCE,
      createdAt: epochAt(0),
      deletedAt: null,
      name: 'Workforce',
      factorNames: ['Operator', 'Shift'],
      color: '#a855f7', // purple
      inferredFrom: 'Operator',
    },
  ];
}

// ============================================================================
// Export
// ============================================================================

export const syringeBarrelWeight: SampleDataset = {
  name: 'Syringe Barrel Weight (End-to-End GB)',
  description:
    'Injection-molding capability gap with a disordinal Lot × Pressure interaction. ' +
    'Pre-populated with capability assessment, stratified findings, a suspected-cause hub, ' +
    'a causal graph, and PDCA ideas — walks the full RDMAIC spine at Green Belt level.',
  icon: 'flask-conical',
  urlKey: 'syringe-barrel-weight',
  category: 'journeys',
  featured: true,
  data: generateData(),
  config: {
    outcome: 'Weight_g',
    factors: ['Lot_ID', 'Hold_Pressure_bar', 'Cavity', 'Operator', 'Shift', 'Defect_Type'],
    specs: { lsl: 11.7, usl: 12.3, target: 12.0 },
    // Rolling n=5 subgroups → ~60 rational subgroups over the 3-week run.
    // Enables Cpk-over-time on the I-chart (capability view) and within-lot
    // Cpk distribution on the boxplot — both invisible with size=1 default.
    subgroupConfig: { method: 'fixed-size', size: 5 },
    // Land on the raw-value I-chart (measurement view). Capability is a
    // deliberate toggle in the demo walk-through, not the initial state.
    displayOptions: {
      standardIChartMetric: 'measurement',
      showCpk: true,
      showSpecs: true,
    },
    // QC-caught defects as a pre-aggregated Pareto — mirrors the in-dataset
    // Defect_Type counts so toggling between derived/separate Pareto is
    // consistent. Underweight #1 reinforces the capability-gap story.
    separateParetoData: [
      { category: 'Underweight', count: 34 },
      { category: 'Short_Shot', count: 17 },
      { category: 'Flash', count: 16 },
      { category: 'Sink_Mark', count: 9 },
      { category: 'Contamination', count: 4 },
    ],
    investigation: {
      findings: buildFindings(),
      hypotheses: buildHypotheses(),
      causalLinks: buildCausalLinks(),
      categories: buildCategories(),
    },
    improvementProject: {
      issueStatement:
        'Baseline syringe barrel weight is not capable against 11.70-12.30 g specs; the left tail creates underweight rejects concentrated in Lot 3.',
      metadata: {
        businessCase:
          'Recover barrel-weight capability before the next validation run by stabilizing Lot 3 pressure response and reducing underweight rejects.',
      },
      goal: {
        outcomeGoals: [
          {
            outcomeSpecId: 'weight-g',
            baseline: 0.76,
            target: 1.33,
            deadline: '2026-04-24',
          },
        ],
        factorControls: [
          {
            factor: 'Hold_Pressure_bar',
            targetCondition: 'Lot 3 recipe setpoint raised to 88 bar with first-hour verification',
            linkedHypothesisId: IDS.HUB_LOT3_PRESSURE,
          },
          {
            factor: 'Cavity',
            targetCondition: 'Cavity 2 gate wear checked during planned mold maintenance',
          },
        ],
        mechanismGoals: [
          {
            description:
              'Confirm whether regrind-rich Lot 3 material needs a lot-specific hold-pressure recipe.',
            linkedFindingIds: [IDS.F_LOT3_LIGHT, IDS.F_PRESSURE_SLOPE, IDS.F_INTERACTION],
          },
        ],
      },
      sections: {
        background: {
          snapshotText:
            'Baseline Cpk is about 0.76 with Underweight as the dominant defect. Lot 3 and hold pressure together explain the largest share of variation.',
          manualNarrative:
            'The first improvement round should protect medical-device weight compliance while avoiding unnecessary broad process changes.',
        },
        approach: {
          narrative:
            'Pilot a Lot 3 pressure recipe, verify first-hour weight response, then decide whether to standardize the recipe and schedule Cavity 2 maintenance.',
        },
      },
      actions: [
        {
          id: 'act-sbw-lot3-recipe-trial',
          text: 'Run Lot 3 pilot at 88 bar and capture first-hour barrel weights',
          status: 'in-progress',
          assignedTo: { displayName: 'Process engineer' },
          dueAt: '2026-04-10',
          doneAt: null,
          doneBy: null,
          createdBy: { displayName: 'VariScout demo' },
          createdAt: epochAt(28),
        },
        {
          id: 'act-sbw-qc-pareto-watch',
          text: 'Review Underweight Pareto after the pilot batch',
          status: 'open',
          assignedTo: { displayName: 'QA lead' },
          dueAt: '2026-04-12',
          doneAt: null,
          doneBy: null,
          createdBy: { displayName: 'VariScout demo' },
          createdAt: epochAt(29),
        },
        {
          id: 'act-sbw-cavity2-check',
          text: 'Add Cavity 2 gate inspection to the planned mold maintenance window',
          status: 'done',
          assignedTo: null,
          dueAt: null,
          doneAt: isoAt(31),
          doneBy: { displayName: 'Tooling lead' },
          createdBy: { displayName: 'VariScout demo' },
          createdAt: epochAt(30),
        },
      ],
    },
  },
};
