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
import type {
  Finding,
  Question,
  SuspectedCause,
  CausalLink,
  InvestigationCategory,
} from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

// ============================================================================
// Stable IDs — enable cross-references between questions, findings, hubs, links
// ============================================================================

const IDS = {
  // Questions
  Q_CAPABILITY: 'q-sbw-capability',
  Q_LOT: 'q-sbw-lot',
  Q_PRESSURE: 'q-sbw-pressure',
  Q_INTERACTION: 'q-sbw-lot-pressure',
  Q_CAVITY: 'q-sbw-cavity',
  Q_OPERATOR: 'q-sbw-operator',
  Q_SHIFT: 'q-sbw-shift',
  Q_DEFECT_MIX: 'q-sbw-defect-mix',
  Q_IMPROVEMENT: 'q-sbw-improvement',
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

function buildQuestions(): Question[] {
  return [
    // Q1 — capability assessment (Define/Measure)
    {
      id: IDS.Q_CAPABILITY,
      text: 'Is the barrel-weight process capable to spec (Cpk ≥ 1.33)?',
      status: 'answered',
      linkedFindingIds: [IDS.F_CAPABILITY_GAP],
      createdAt: isoAt(0),
      updatedAt: isoAt(4),
      validationType: 'data',
      questionSource: 'analyst',
      manualNote:
        'Baseline Cpk ≈ 0.76 (within-subgroup sigma, n=5 rational subgroups) against USL 12.30 / LSL 11.70. ~4% of parts fall below LSL. Probability plot shows a clear left tail — underweight parts dominate the failure mode.',
    },
    // Q2 — Lot effect (Analyze)
    {
      id: IDS.Q_LOT,
      text: 'Does material Lot (L1/L2/L3) affect barrel weight?',
      factor: 'Lot_ID',
      status: 'answered',
      linkedFindingIds: [IDS.F_LOT3_LIGHT],
      createdAt: isoAt(6),
      updatedAt: isoAt(10),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.18,
        rSquaredAdj: 0.17,
      },
    },
    // Q3 — Hold Pressure effect (Analyze)
    {
      id: IDS.Q_PRESSURE,
      text: 'Does Hold Pressure influence barrel weight?',
      factor: 'Hold_Pressure_bar',
      status: 'answered',
      linkedFindingIds: [IDS.F_PRESSURE_SLOPE],
      createdAt: isoAt(8),
      updatedAt: isoAt(12),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        rSquaredAdj: 0.31,
      },
    },
    // Q4 — Lot × Pressure interaction (Analyze, the "aha")
    {
      id: IDS.Q_INTERACTION,
      text: 'Does the Lot moderate the Hold-Pressure effect on weight?',
      status: 'answered',
      linkedFindingIds: [IDS.F_INTERACTION],
      createdAt: isoAt(12),
      updatedAt: isoAt(20),
      validationType: 'data',
      questionSource: 'analyst',
      manualNote:
        'Interaction plot shows disordinal crossing: Lot 3 is much more sensitive to pressure than L1/L2 — it needs ~5 bar more to hit target weight.',
    },
    // Q5 — Cavity effect (Analyze)
    {
      id: IDS.Q_CAVITY,
      text: 'Does Cavity (Cav1 vs Cav2) affect weight?',
      factor: 'Cavity',
      status: 'answered',
      linkedFindingIds: [IDS.F_CAVITY2_LIGHT],
      createdAt: isoAt(10),
      updatedAt: isoAt(14),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.1,
      },
      ideas: [
        {
          id: IDS.IDEA_CAVITY2_GATE,
          text: 'Rebalance Cavity 2 gate — adjust fill pattern to match Cav1',
          timeframe: 'weeks',
          cost: { category: 'medium' },
          direction: 'prevent',
          selected: false,
          notes:
            'Small persistent main effect (~0.05 g lower on Cav2). Mold tech can rebalance during next scheduled maintenance.',
          createdAt: isoAt(22),
        },
      ],
    },
    // Q6 — Operator (Analyze, ruled-out red herring)
    {
      id: IDS.Q_OPERATOR,
      text: 'Does Operator affect weight?',
      factor: 'Operator',
      status: 'ruled-out',
      linkedFindingIds: [],
      createdAt: isoAt(10),
      updatedAt: isoAt(14),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.003,
      },
      manualNote:
        'No meaningful operator effect (η² < 1%). Both operators run equivalent weight distributions.',
    },
    // Q7 — Shift (Analyze, ruled-out red herring)
    {
      id: IDS.Q_SHIFT,
      text: 'Does Shift (Day vs Eve) affect weight?',
      factor: 'Shift',
      status: 'ruled-out',
      linkedFindingIds: [],
      createdAt: isoAt(10),
      updatedAt: isoAt(14),
      validationType: 'data',
      questionSource: 'factor-intel',
      evidence: {
        etaSquared: 0.002,
      },
      manualNote:
        'Shift is not a driver (η² < 1%). Rule out and refocus on material + process parameters.',
    },
    // Q8 — QC defect mix (Analyze/Improve — focuses the 80/20)
    {
      id: IDS.Q_DEFECT_MIX,
      text: 'Which defect mode should we attack first (Pareto priority)?',
      factor: 'Defect_Type',
      status: 'answered',
      linkedFindingIds: [IDS.F_DEFECT_PARETO],
      createdAt: isoAt(14),
      updatedAt: isoAt(18),
      validationType: 'data',
      questionSource: 'analyst',
      manualNote:
        'Underweight dominates the defect Pareto (34 of 80 non-OK events, 42%). Short shots and flash follow but each <20. Prioritizing underweight is the 80/20 call — and it ties directly to the capability gap and the Lot 3 hub.',
    },
    // Q9 — Improvement (Improve/Control)
    {
      id: IDS.Q_IMPROVEMENT,
      text: 'How do we reach Cpk ≥ 1.33 within the next 4 weeks?',
      status: 'investigating',
      linkedFindingIds: [],
      createdAt: isoAt(24),
      updatedAt: isoAt(26),
      validationType: 'gemba',
      validationTask:
        'Pilot lot-specific pressure recipe on Lot 3 (raise setpoint to ~88 bar), measure 1 shift, compare to baseline.',
      taskCompleted: false,
      questionSource: 'analyst',
      ideas: [
        {
          id: IDS.IDEA_LOT3_RECIPE,
          text: 'Lot-specific pressure recipe: raise Lot 3 hold pressure to 88 bar (from 83 bar)',
          timeframe: 'days',
          cost: { category: 'low' },
          direction: 'eliminate',
          selected: true,
          notes:
            'Directly counters the interaction. Expected to recover the low tail and move projected Cpk from ~0.76 to ~1.4.',
          createdAt: isoAt(25),
        },
        {
          id: IDS.IDEA_INSPECT_L3,
          text: 'Interim: 100% weight check during Lot 3 runs until recipe is validated',
          timeframe: 'just-do',
          cost: { category: 'low' },
          direction: 'detect',
          selected: true,
          notes:
            'Containment while the pressure-recipe pilot runs. Catches underweight before shipment.',
          createdAt: isoAt(25),
        },
      ],
    },
  ];
}

function buildFindings(): Finding[] {
  return [
    // F1 — capability gap (Define/Measure finding)
    {
      id: IDS.F_CAPABILITY_GAP,
      text: 'Process is not capable: Cpk ≈ 0.76 against USL 12.30 / LSL 11.70 (within-subgroup sigma, n=5 rational subgroups). The distribution has a left tail — roughly 4% of parts are below LSL.',
      createdAt: epochAt(2),
      context: {
        activeFilters: {},
        cumulativeScope: null,
        stats: { mean: 11.99, cpk: 0.76, samples: 300 },
      },
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-cap-1',
          text: 'Probability plot shows left-tail deviation from normal — underweight parts dominate the failure mode.',
          createdAt: epochAt(3),
        },
      ],
      statusChangedAt: epochAt(4),
      source: { chart: 'probability', anchorX: 11.7, anchorY: 0.02, timeLens: DEFAULT_TIME_LENS },
      questionId: IDS.Q_CAPABILITY,
      validationStatus: 'supports',
    },
    // F2 — Lot 3 runs light (boxplot by Lot)
    {
      id: IDS.F_LOT3_LIGHT,
      text: 'Lot 3 runs ~0.10 g lighter than Lot 1 and Lot 2. Boxplot shows the entire L3 distribution shifted down.',
      createdAt: epochAt(8),
      context: {
        activeFilters: { Lot_ID: ['L3'] },
        cumulativeScope: null,
        stats: { mean: 11.92, cpk: 0.45, samples: 100 },
      },
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-lot-1',
          text: 'η² ≈ 0.18 — Lot explains ~18% of total weight variation. Material is a first-order driver.',
          createdAt: epochAt(9),
        },
      ],
      statusChangedAt: epochAt(10),
      source: { chart: 'boxplot', category: 'L3', timeLens: DEFAULT_TIME_LENS },
      questionId: IDS.Q_LOT,
      validationStatus: 'supports',
    },
    // F3 — Hold Pressure positive slope (scatter / regression)
    {
      id: IDS.F_PRESSURE_SLOPE,
      text: 'Hold Pressure is a continuous driver: weight increases ~0.015 g per bar. Linear regression R²adj ≈ 0.31 on pressure alone.',
      createdAt: epochAt(10),
      context: {
        activeFilters: {},
        cumulativeScope: null,
        stats: { mean: 11.99, samples: 300 },
      },
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-press-1',
          text: 'Scatter of Weight vs Hold Pressure shows a clear positive trend. This is the most actionable continuous lever we have.',
          createdAt: epochAt(11),
        },
      ],
      statusChangedAt: epochAt(12),
      questionId: IDS.Q_PRESSURE,
      validationStatus: 'supports',
    },
    // F4 — Lot × Pressure interaction (the "aha" finding)
    {
      id: IDS.F_INTERACTION,
      text: 'Disordinal Lot × Hold-Pressure interaction: Lot 3 needs ~5 bar more pressure than L1/L2 to reach the same weight. L3 slope is ~0.027 g/bar vs ~0.015 g/bar for L1/L2.',
      createdAt: epochAt(16),
      context: {
        activeFilters: { Lot_ID: ['L3'] },
        cumulativeScope: null,
        stats: { mean: 11.92, samples: 100 },
      },
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-int-1',
          text: 'Interaction plot shows Lot 1/2 lines nearly parallel; Lot 3 line crosses them — classic disordinal pattern. Higher regrind fraction on L3 raises melt viscosity and shifts the pressure sensitivity.',
          createdAt: epochAt(17),
        },
      ],
      statusChangedAt: epochAt(20),
      questionId: IDS.Q_INTERACTION,
      validationStatus: 'supports',
    },
    // F5 — Cavity 2 slightly light (boxplot by Cavity)
    {
      id: IDS.F_CAVITY2_LIGHT,
      text: 'Cavity 2 runs ~0.11 g lighter than Cavity 1 on average (η² ≈ 10%). Secondary contributor — likely gate geometry — addressable during next mold maintenance.',
      createdAt: epochAt(12),
      context: {
        activeFilters: { Cavity: ['Cav2'] },
        cumulativeScope: null,
        stats: { mean: 11.93, samples: 150 },
      },
      status: 'analyzed',
      comments: [
        {
          id: 'c-cav-1',
          text: 'Secondary contributor. Worth addressing during the next mold maintenance window.',
          createdAt: epochAt(13),
        },
      ],
      statusChangedAt: epochAt(14),
      source: { chart: 'boxplot', category: 'Cav2', timeLens: DEFAULT_TIME_LENS },
      questionId: IDS.Q_CAVITY,
      validationStatus: 'supports',
    },
    // F6 — Defect Pareto (80/20 priority)
    {
      id: IDS.F_DEFECT_PARETO,
      text: 'Underweight dominates the QC defect Pareto (34 events, 42% of non-OK). Short Shot and Flash follow at ~20 each. The underweight cluster is the same physical problem as the capability gap — fixing Lot 3 pressure should attack both at once.',
      createdAt: epochAt(14),
      context: {
        activeFilters: {},
        cumulativeScope: null,
        stats: { mean: 11.99, samples: 300 },
      },
      status: 'analyzed',
      tag: 'key-driver',
      comments: [
        {
          id: 'c-pareto-1',
          text: 'Pareto confirms the 80/20: the top-3 defect modes cover ~83% of all non-OK events. Prioritize Underweight.',
          createdAt: epochAt(15),
        },
      ],
      statusChangedAt: epochAt(18),
      source: { chart: 'pareto', category: 'Underweight', timeLens: DEFAULT_TIME_LENS },
      questionId: IDS.Q_DEFECT_MIX,
      validationStatus: 'supports',
    },
    // F7 — Within-lot Cpk variation (capability mode insight)
    {
      id: IDS.F_WITHIN_LOT_CPK,
      text: 'Within-lot Cpk varies widely on Lot 3: rolling n=5 subgroup Cpks span roughly 0.3–1.1 on L3 vs 0.8–1.6 on L1/L2. The tail is not uniform — L3 has weak subgroups that drive the overall gap.',
      createdAt: epochAt(18),
      context: {
        activeFilters: { Lot_ID: ['L3'] },
        cumulativeScope: null,
        stats: { mean: 11.92, cpk: 0.45, samples: 100 },
      },
      status: 'analyzed',
      comments: [
        {
          id: 'c-within-1',
          text: 'Toggle the I-chart to Capability view to see the per-subgroup Cpk trajectory. Boxplot of Lot × Cpk (capability mode) shows L3 centered well below 1.0.',
          createdAt: epochAt(19),
        },
      ],
      statusChangedAt: epochAt(20),
      questionId: IDS.Q_LOT,
      validationStatus: 'supports',
    },
  ];
}

function buildSuspectedCauses(): SuspectedCause[] {
  return [
    {
      id: IDS.HUB_LOT3_PRESSURE,
      name: 'Lot 3 under-pressurized — regrind-rich material needs +5 bar',
      synthesis:
        'Lot 3 contains more regrind than Lots 1 and 2, which raises melt viscosity and makes weight more sensitive to hold pressure. At the current 83 bar setpoint, L3 barrels fall ~0.10 g light on average, producing the left tail that drives Cpk below 1.0. QC-caught "Underweight" defects cluster on the same population, confirming this is the 80/20 priority. A lot-specific pressure recipe (L3 → ~88 bar) is expected to recover the tail, collapse the Underweight Pareto bar, and restore capability. Cavity 2 contributes a secondary ~0.10 g main effect.',
      questionIds: [IDS.Q_LOT, IDS.Q_PRESSURE, IDS.Q_INTERACTION, IDS.Q_DEFECT_MIX],
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
      status: 'suspected',
      createdAt: isoAt(20),
      updatedAt: isoAt(26),
    },
  ];
}

function buildCausalLinks(): CausalLink[] {
  return [
    {
      id: IDS.L_PRESSURE_WEIGHT,
      fromFactor: 'Hold_Pressure_bar',
      toFactor: 'Weight_g',
      whyStatement:
        'Higher hold pressure packs more melt into the cavity before freeze-off, increasing barrel weight.',
      direction: 'drives',
      evidenceType: 'data',
      questionIds: [IDS.Q_PRESSURE],
      findingIds: [IDS.F_PRESSURE_SLOPE],
      hubId: IDS.HUB_LOT3_PRESSURE,
      strength: 0.31,
      source: 'analyst',
      createdAt: isoAt(20),
      updatedAt: isoAt(20),
    },
    {
      id: IDS.L_LOT_WEIGHT,
      fromFactor: 'Lot_ID',
      toFactor: 'Weight_g',
      whyStatement:
        'Lot 3 has higher regrind content, which lowers effective fill density at current pressure.',
      direction: 'drives',
      evidenceType: 'data',
      questionIds: [IDS.Q_LOT],
      findingIds: [IDS.F_LOT3_LIGHT],
      hubId: IDS.HUB_LOT3_PRESSURE,
      strength: 0.18,
      source: 'analyst',
      createdAt: isoAt(20),
      updatedAt: isoAt(20),
    },
    {
      id: IDS.L_LOT_MODULATES_PRESSURE,
      fromFactor: 'Lot_ID',
      toFactor: 'Hold_Pressure_bar',
      whyStatement:
        'Regrind content changes viscosity, which changes how much hold pressure is needed to reach target weight (disordinal interaction).',
      direction: 'modulates',
      evidenceType: 'data',
      questionIds: [IDS.Q_INTERACTION],
      findingIds: [IDS.F_INTERACTION],
      hubId: IDS.HUB_LOT3_PRESSURE,
      source: 'analyst',
      relationshipType: 'interactive',
      createdAt: isoAt(20),
      updatedAt: isoAt(20),
    },
    {
      id: IDS.L_CAVITY_WEIGHT,
      fromFactor: 'Cavity',
      toFactor: 'Weight_g',
      whyStatement:
        'Cavity 2 gate geometry restricts melt flow slightly, producing a ~0.05 g persistent underfill.',
      direction: 'drives',
      evidenceType: 'data',
      questionIds: [IDS.Q_CAVITY],
      findingIds: [IDS.F_CAVITY2_LIGHT],
      strength: 0.04,
      source: 'analyst',
      createdAt: isoAt(20),
      updatedAt: isoAt(20),
    },
  ];
}

function buildCategories(): InvestigationCategory[] {
  return [
    {
      id: IDS.CAT_MATERIAL,
      name: 'Material',
      factorNames: ['Lot_ID'],
      color: '#f97316', // orange
      inferredFrom: 'Lot_ID',
    },
    {
      id: IDS.CAT_PROCESS,
      name: 'Process',
      factorNames: ['Hold_Pressure_bar', 'Cavity'],
      color: '#3b82f6', // blue
      inferredFrom: 'Hold_Pressure_bar',
    },
    {
      id: IDS.CAT_WORKFORCE,
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
      questions: buildQuestions(),
      suspectedCauses: buildSuspectedCauses(),
      causalLinks: buildCausalLinks(),
      categories: buildCategories(),
    },
  },
};
