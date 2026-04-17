---
status: archived
title: Interaction Effects Implementation Plan
---

# Interaction Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two-way interaction terms to the unified GLM engine so the best model equation includes interaction effects for all factor type combinations (cont×cont, cont×cat, cat×cat), matching Minitab Best Subsets.

**Architecture:** Two-pass hierarchical best subsets — Pass 1 finds best main-effects model (unchanged), Pass 2 screens interaction pairs among winning factors via partial F-test and re-fits. Interaction columns generated in the design matrix. Pattern classification (ordinal/disordinal) drives question language and Evidence Map edge display.

**Tech Stack:** TypeScript, Float64Array, Vitest, React (UI components)

**Spec:** `docs/superpowers/specs/2026-04-07-interaction-effects-design.md`

---

## File Map

| File                                                             | Action | Responsibility                                                     |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `packages/core/src/types.ts`                                     | Modify | Add `'interaction'` to PredictorType, extend PredictorInfo         |
| `packages/core/src/stats/designMatrix.ts`                        | Modify | Add `'interaction'` FactorSpec type, product column generation     |
| `packages/core/src/stats/interactionScreening.ts`                | Create | Partial F-test screening, pattern classifier, plot axis assignment |
| `packages/core/src/stats/bestSubsets.ts`                         | Modify | Pass 2: screen interactions among winners, re-fit final model      |
| `packages/core/src/stats/factorEffects.ts`                       | Modify | Route continuous pairs through OLS, add pattern/axis metadata      |
| `packages/core/src/stats/index.ts`                               | Modify | Export new types and functions                                     |
| `packages/core/src/stats/__tests__/designMatrix.test.ts`         | Modify | Tests for interaction columns                                      |
| `packages/core/src/stats/__tests__/interactionScreening.test.ts` | Create | Screening, pattern classifier, axis assignment tests               |
| `packages/core/src/stats/__tests__/bestSubsets.test.ts`          | Modify | Two-pass integration tests                                         |
| `packages/data/src/samples/injection.ts`                         | Modify | Add Temperature×Machine interaction to data generation             |

---

### Task 1: Extend PredictorType and PredictorInfo

**Files:**

- Modify: `packages/core/src/types.ts:563-587`

- [ ] **Step 1: Add 'interaction' to PredictorType and extend PredictorInfo**

In `packages/core/src/types.ts`, change line 563:

```typescript
export type PredictorType = 'categorical' | 'continuous' | 'quadratic' | 'interaction';
```

Add new optional fields to `PredictorInfo` after the `mean` field (after line 587):

```typescript
  /** Interaction: source factor names */
  sourceFactors?: [string, string];
  /** Interaction: type of factor pair */
  interactionType?: 'cont×cont' | 'cont×cat' | 'cat×cat';
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter @variscout/core build`
Expected: SUCCESS (no consumers of these types break — new fields are optional)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/types.ts
git commit -m "$(cat <<'EOF'
feat(core): add 'interaction' to PredictorType and extend PredictorInfo

Support interaction predictors in the unified GLM engine.
New optional fields: sourceFactors, interactionType.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 2: Add interaction columns to design matrix

**Files:**

- Modify: `packages/core/src/stats/designMatrix.ts:30-78,130-307`
- Test: `packages/core/src/stats/__tests__/designMatrix.test.ts`

- [ ] **Step 1: Write failing tests for interaction column generation**

Append to `packages/core/src/stats/__tests__/designMatrix.test.ts`:

```typescript
// ---------------------------------------------------------------------------
// Interaction columns
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — interaction columns', () => {
  const data: DataRow[] = [
    { temp: 10, machine: 'A', y: 1 },
    { temp: 20, machine: 'A', y: 2 },
    { temp: 10, machine: 'B', y: 3 },
    { temp: 20, machine: 'B', y: 4 },
    { temp: 15, machine: 'A', y: 1.5 },
    { temp: 15, machine: 'B', y: 3.5 },
  ];

  it('cont×cat: creates (m-1) product columns', () => {
    const result = buildDesignMatrix(data, 'y', [
      { name: 'temp', type: 'continuous' },
      { name: 'machine', type: 'categorical' },
      { name: 'temp×machine', type: 'interaction', sourceFactors: ['temp', 'machine'] },
    ]);
    // intercept(1) + temp(1) + machine(1 dummy for B) + interaction(1 product) = 4
    expect(result.p).toBe(4);
    const intEnc = result.encodings.find(e => e.type === 'interaction');
    expect(intEnc).toBeDefined();
    expect(intEnc!.factorName).toBe('temp×machine');
    expect(intEnc!.sourceFactors).toEqual(['temp', 'machine']);
    expect(intEnc!.interactionType).toBe('cont×cat');
    expect(intEnc!.columnIndices).toHaveLength(1);
  });

  it('cont×cont: creates 1 centered product column', () => {
    const contData: DataRow[] = [
      { x1: 10, x2: 100, y: 1 },
      { x1: 20, x2: 200, y: 4 },
      { x1: 15, x2: 150, y: 2 },
      { x1: 25, x2: 250, y: 5 },
    ];
    const result = buildDesignMatrix(contData, 'y', [
      { name: 'x1', type: 'continuous' },
      { name: 'x2', type: 'continuous' },
      { name: 'x1×x2', type: 'interaction', sourceFactors: ['x1', 'x2'] },
    ]);
    // intercept(1) + x1(1) + x2(1) + interaction(1) = 4
    expect(result.p).toBe(4);
    const intEnc = result.encodings.find(e => e.type === 'interaction');
    expect(intEnc).toBeDefined();
    expect(intEnc!.interactionType).toBe('cont×cont');

    // Verify centering: product column should be (x1 - mean_x1)(x2 - mean_x2)
    const meanX1 = (10 + 20 + 15 + 25) / 4; // 17.5
    const meanX2 = (100 + 200 + 150 + 250) / 4; // 175
    const intCol = Array.from(result.X[intEnc!.columnIndices[0]]);
    expect(intCol[0]).toBeCloseTo((10 - meanX1) * (100 - meanX2)); // (-7.5)(-75) = 562.5
    expect(intCol[1]).toBeCloseTo((20 - meanX1) * (200 - meanX2)); // (2.5)(25) = 62.5
  });

  it('cat×cat: creates (a-1)(b-1) product columns', () => {
    const catData: DataRow[] = [
      { shift: 'Day', machine: 'A', y: 1 },
      { shift: 'Day', machine: 'B', y: 2 },
      { shift: 'Day', machine: 'C', y: 3 },
      { shift: 'Night', machine: 'A', y: 4 },
      { shift: 'Night', machine: 'B', y: 5 },
      { shift: 'Night', machine: 'C', y: 6 },
    ];
    const result = buildDesignMatrix(catData, 'y', [
      { name: 'shift', type: 'categorical' },
      { name: 'machine', type: 'categorical' },
      { name: 'shift×machine', type: 'interaction', sourceFactors: ['shift', 'machine'] },
    ]);
    // shift: 2 levels → 1 dummy. machine: 3 levels → 2 dummies.
    // interaction: (2-1)(3-1) = 2 product columns
    // intercept(1) + shift(1) + machine(2) + interaction(2) = 6
    expect(result.p).toBe(6);
    const intEnc = result.encodings.find(e => e.type === 'interaction');
    expect(intEnc!.interactionType).toBe('cat×cat');
    expect(intEnc!.columnIndices).toHaveLength(2);
  });

  it('interaction encoding references source factor names', () => {
    const result = buildDesignMatrix(data, 'y', [
      { name: 'temp', type: 'continuous' },
      { name: 'machine', type: 'categorical' },
      { name: 'temp×machine', type: 'interaction', sourceFactors: ['temp', 'machine'] },
    ]);
    const intEnc = result.encodings.find(e => e.type === 'interaction')!;
    expect(intEnc.sourceFactors).toEqual(['temp', 'machine']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run designMatrix`
Expected: FAIL — `'interaction'` not in FactorSpec type, `sourceFactors` not in FactorEncoding

- [ ] **Step 3: Extend FactorSpec and FactorEncoding interfaces**

In `packages/core/src/stats/designMatrix.ts`, update `FactorEncoding` (line 30-49):

```typescript
export interface FactorEncoding {
  /** Factor column name in the source data */
  factorName: string;
  /** Whether this factor is treated as continuous, categorical, or interaction */
  type: 'continuous' | 'categorical' | 'interaction';
  /**
   * Column indices in X (0 = intercept).
   * Categorical: one index per non-reference level (k-1 columns).
   * Continuous: one index (linear) or two indices [linear, quadratic].
   * Interaction: one or more product columns depending on source factor types.
   */
  columnIndices: number[];
  /** Categorical: all levels sorted alphabetically */
  levels?: string[];
  /** Categorical: omitted level (most frequent) used as reference */
  referenceLevel?: string;
  /** Continuous + quadratic: column index of the (x - mean)² term */
  quadraticIndex?: number;
  /** Continuous: mean of the factor values (used for centering) */
  mean?: number;
  /** Interaction: source factor names */
  sourceFactors?: [string, string];
  /** Interaction: factor pair type */
  interactionType?: 'cont×cont' | 'cont×cat' | 'cat×cat';
}
```

Update `FactorSpec` (line 73-78):

```typescript
export interface FactorSpec {
  name: string;
  type: 'continuous' | 'categorical' | 'interaction';
  /** Continuous only: include a (x - mean)² column in addition to the linear term */
  includeQuadratic?: boolean;
  /** Interaction only: source factor names (must match earlier FactorSpec names) */
  sourceFactors?: [string, string];
}
```

- [ ] **Step 4: Implement interaction column generation in buildDesignMatrix**

In `packages/core/src/stats/designMatrix.ts`, after the existing categorical/continuous encoding loop (around line 246), add handling for the `'interaction'` type inside the encoding metadata computation:

```typescript
    } else if (type === 'interaction') {
      // Interaction: product of source factor columns
      const [srcA, srcB] = factors[fi].sourceFactors!;
      const encA = encodings.find(e => e.factorName === srcA);
      const encB = encodings.find(e => e.factorName === srcB);

      if (!encA || !encB) {
        throw new Error(`Interaction source factors ${srcA}, ${srcB} not found in prior encodings`);
      }

      // Determine interaction type and column count
      const typeA = encA.type;
      const typeB = encB.type;
      let interactionType: 'cont×cont' | 'cont×cat' | 'cat×cat';
      let numCols: number;

      if (typeA === 'continuous' && typeB === 'continuous') {
        interactionType = 'cont×cont';
        numCols = 1; // single centered product
      } else if (typeA === 'categorical' && typeB === 'categorical') {
        interactionType = 'cat×cat';
        const levelsA = encA.levels!.filter(l => l !== encA.referenceLevel);
        const levelsB = encB.levels!.filter(l => l !== encB.referenceLevel);
        numCols = levelsA.length * levelsB.length;
      } else {
        interactionType = 'cont×cat';
        const catEnc = typeA === 'categorical' ? encA : encB;
        const nonRefLevels = catEnc.levels!.filter(l => l !== catEnc.referenceLevel);
        numCols = nonRefLevels.length;
      }

      const startCol = totalCols;
      const columnIndices = Array.from({ length: numCols }, (_, i) => startCol + i);
      totalCols += numCols;

      encodings.push({
        factorName: name,
        type: 'interaction',
        columnIndices,
        sourceFactors: [srcA, srcB],
        interactionType,
      });
    }
```

In the Pass 2 fill loop (around line 278), add interaction column filling after the factor columns loop:

```typescript
// Interaction columns (must run after all main-effect columns are filled)
for (let fi = 0; fi < factors.length; fi++) {
  const { type } = factors[fi];
  if (type !== 'interaction') continue;

  const enc = encodings[fi];
  const [srcA, srcB] = enc.sourceFactors!;
  const encA = encodings.find(e => e.factorName === srcA)!;
  const encB = encodings.find(e => e.factorName === srcB)!;

  if (enc.interactionType === 'cont×cont') {
    // Centered product: (xA - meanA)(xB - meanB)
    const meanA = encA.mean!;
    const meanB = encB.mean!;
    const colA = encA.columnIndices[0];
    const colB = encB.columnIndices[0];
    for (let r = 0; r < n; r++) {
      X[enc.columnIndices[0]][r] = (X[colA][r] - meanA) * (X[colB][r] - meanB);
    }
  } else if (enc.interactionType === 'cont×cat') {
    // Product of continuous value × each categorical dummy
    const contEnc = encA.type === 'continuous' ? encA : encB;
    const catEnc = encA.type === 'categorical' ? encA : encB;
    const contCol = contEnc.columnIndices[0];
    const catCols = catEnc.columnIndices;
    for (let ci = 0; ci < catCols.length; ci++) {
      for (let r = 0; r < n; r++) {
        X[enc.columnIndices[ci]][r] = X[contCol][r] * X[catCols[ci]][r];
      }
    }
  } else {
    // cat×cat: product of each pair of dummies
    const colsA = encA.columnIndices;
    const colsB = encB.columnIndices;
    let idx = 0;
    for (let ai = 0; ai < colsA.length; ai++) {
      for (let bi = 0; bi < colsB.length; bi++) {
        for (let r = 0; r < n; r++) {
          X[enc.columnIndices[idx]][r] = X[colsA[ai]][r] * X[colsB[bi]][r];
        }
        idx++;
      }
    }
  }
}
```

Note: The existing factor columns loop (line 278) iterates `factors` and handles `categorical` and `continuous`. The interaction fill must happen **after** all main-effect columns are populated because it reads from them. Split the fill into two passes within the same `for (let ri ...)` loop, or add a second loop for interaction fill after the main loop.

The cleanest approach: keep the existing `for (let ri = 0; ri < n; ri++)` loop for main effects, then add the interaction column fill as a separate block after it (iterating rows per interaction encoding). This avoids nesting complexity.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run designMatrix`
Expected: ALL PASS (new tests + existing tests)

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/stats/designMatrix.ts packages/core/src/stats/__tests__/designMatrix.test.ts
git commit -m "$(cat <<'EOF'
feat(core): add interaction column generation to design matrix

Support cont×cont (centered product), cont×cat (value × dummy),
and cat×cat (dummy × dummy) interaction columns in buildDesignMatrix.
New FactorSpec type: 'interaction' with sourceFactors.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 3: Create interaction screening module

**Files:**

- Create: `packages/core/src/stats/interactionScreening.ts`
- Create: `packages/core/src/stats/__tests__/interactionScreening.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/src/stats/__tests__/interactionScreening.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  screenInteractionPair,
  classifyInteractionPattern,
  assignPlotAxes,
} from '../interactionScreening';
import type { DataRow } from '../../types';

// ---------------------------------------------------------------------------
// Synthetic data with known interaction
// ---------------------------------------------------------------------------

function makeInteractionData(): DataRow[] {
  // Temperature × Machine interaction:
  // Machine A: slope = +2.0 per unit temp
  // Machine B: slope = +0.5 per unit temp (ordinal — same direction, different magnitude)
  const rows: DataRow[] = [];
  for (let i = 0; i < 50; i++) {
    const temp = 10 + (i % 10) * 2; // 10, 12, ..., 28
    const machine = i < 25 ? 'A' : 'B';
    const slope = machine === 'A' ? 2.0 : 0.5;
    const y = 100 + slope * (temp - 20) + (i % 3) * 0.1; // small noise via mod
    rows.push({ Temperature: temp, Machine: machine, Weight: y });
  }
  return rows;
}

function makeNoInteractionData(): DataRow[] {
  // Same slope for both machines — no interaction
  const rows: DataRow[] = [];
  for (let i = 0; i < 50; i++) {
    const temp = 10 + (i % 10) * 2;
    const machine = i < 25 ? 'A' : 'B';
    const machineEffect = machine === 'A' ? 0 : 5; // parallel shift only
    const y = 100 + 1.5 * (temp - 20) + machineEffect + (i % 3) * 0.1;
    rows.push({ Temperature: temp, Machine: machine, Weight: y });
  }
  return rows;
}

function makeDisordinalData(): DataRow[] {
  // Machine A: positive slope, Machine B: negative slope (lines cross)
  const rows: DataRow[] = [];
  for (let i = 0; i < 50; i++) {
    const temp = 10 + (i % 10) * 2;
    const machine = i < 25 ? 'A' : 'B';
    const slope = machine === 'A' ? 1.5 : -1.0;
    const y = 100 + slope * (temp - 20) + (i % 3) * 0.1;
    rows.push({ Temperature: temp, Machine: machine, Weight: y });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// screenInteractionPair
// ---------------------------------------------------------------------------

describe('screenInteractionPair', () => {
  it('detects significant cont×cat interaction', () => {
    const data = makeInteractionData();
    const result = screenInteractionPair(
      data,
      'Weight',
      [
        { name: 'Temperature', type: 'continuous' },
        { name: 'Machine', type: 'categorical' },
      ],
      'Temperature',
      'Machine'
    );
    expect(result.isSignificant).toBe(true);
    expect(result.deltaRSquaredAdj).toBeGreaterThan(0.02);
    expect(result.interactionType).toBe('cont×cat');
  });

  it('rejects interaction when slopes are parallel', () => {
    const data = makeNoInteractionData();
    const result = screenInteractionPair(
      data,
      'Weight',
      [
        { name: 'Temperature', type: 'continuous' },
        { name: 'Machine', type: 'categorical' },
      ],
      'Temperature',
      'Machine'
    );
    expect(result.isSignificant).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// classifyInteractionPattern
// ---------------------------------------------------------------------------

describe('classifyInteractionPattern', () => {
  it('classifies ordinal when slopes have same sign', () => {
    const data = makeInteractionData();
    const pattern = classifyInteractionPattern(data, 'Weight', 'Temperature', 'Machine');
    expect(pattern).toBe('ordinal');
  });

  it('classifies disordinal when ranking reverses', () => {
    const data = makeDisordinalData();
    const pattern = classifyInteractionPattern(data, 'Weight', 'Temperature', 'Machine');
    expect(pattern).toBe('disordinal');
  });
});

// ---------------------------------------------------------------------------
// assignPlotAxes
// ---------------------------------------------------------------------------

describe('assignPlotAxes', () => {
  it('puts continuous factor on x-axis for cont×cat', () => {
    const axes = assignPlotAxes('Temperature', 'continuous', 'Machine', 'categorical');
    expect(axes.plotXAxis).toBe('Temperature');
    expect(axes.plotSeries).toBe('Machine');
    expect(axes.plotAxisRationale).toBe('continuous-on-x');
  });

  it('puts continuous on x-axis even when listed second', () => {
    const axes = assignPlotAxes('Machine', 'categorical', 'Temperature', 'continuous');
    expect(axes.plotXAxis).toBe('Temperature');
    expect(axes.plotSeries).toBe('Machine');
  });

  it('puts more levels on x-axis for cat×cat', () => {
    const axes = assignPlotAxes('Shift', 'categorical', 'Machine', 'categorical', 2, 4);
    expect(axes.plotXAxis).toBe('Machine');
    expect(axes.plotSeries).toBe('Shift');
    expect(axes.plotAxisRationale).toBe('more-levels-on-x');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run interactionScreening`
Expected: FAIL — module not found

- [ ] **Step 3: Implement interactionScreening.ts**

Create `packages/core/src/stats/interactionScreening.ts`:

```typescript
/**
 * Interaction screening — partial F-test, pattern classification, plot axes.
 *
 * Screens factor pairs for two-way interaction effects using a partial F-test
 * comparing main-effects-only model vs model with interaction term.
 * Classifies the interaction pattern as ordinal or disordinal.
 *
 * @module interactionScreening
 */

import type { DataRow } from '../types';
import type { FactorSpec } from './designMatrix';
import { buildDesignMatrix } from './designMatrix';
import { solveOLS } from './olsRegression';
import { fDistributionPValue } from './distributions';
import { toNumericValue } from '../types';
import * as d3 from 'd3-array';

// ============================================================================
// Types
// ============================================================================

/** Result of screening one factor pair for interaction. */
export interface InteractionScreenResult {
  /** Factor names in alphabetical order */
  factors: [string, string];
  /** Geometric pattern of the interaction */
  pattern: 'ordinal' | 'disordinal';
  /** Change in R²adj from adding the interaction term */
  deltaRSquaredAdj: number;
  /** p-value from partial F-test */
  pValue: number;
  /** Whether the interaction passes the screening threshold */
  isSignificant: boolean;
  /** Factor pair type */
  interactionType: 'cont×cont' | 'cont×cat' | 'cat×cat';
  /** Factor for the x-axis of the interaction plot (visualization convention) */
  plotXAxis: string;
  /** Factor for the line series of the interaction plot */
  plotSeries: string;
  /** Why these axes were assigned */
  plotAxisRationale: 'continuous-on-x' | 'more-levels-on-x';
}

// ============================================================================
// Screening
// ============================================================================

/**
 * Screen a single factor pair for interaction via partial F-test.
 *
 * Compares two models:
 *   - Main effects only: y ~ allFactors (no interaction)
 *   - With interaction:  y ~ allFactors + factorA×factorB
 *
 * @param data - Data rows
 * @param outcome - Outcome column name
 * @param allSpecs - All factor specs in the winning model
 * @param factorA - First factor in the pair
 * @param factorB - Second factor in the pair
 * @param alpha - Screening threshold (default 0.10, generous for screening)
 * @returns Screening result with significance, pattern, and axes
 */
export function screenInteractionPair(
  data: DataRow[],
  outcome: string,
  allSpecs: FactorSpec[],
  factorA: string,
  factorB: string,
  alpha: number = 0.1
): InteractionScreenResult {
  const sortedFactors: [string, string] =
    factorA < factorB ? [factorA, factorB] : [factorB, factorA];

  const typeA = allSpecs.find(s => s.name === factorA)!.type as 'continuous' | 'categorical';
  const typeB = allSpecs.find(s => s.name === factorB)!.type as 'continuous' | 'categorical';

  let interactionType: 'cont×cont' | 'cont×cat' | 'cat×cat';
  if (typeA === 'continuous' && typeB === 'continuous') {
    interactionType = 'cont×cont';
  } else if (typeA === 'categorical' && typeB === 'categorical') {
    interactionType = 'cat×cat';
  } else {
    interactionType = 'cont×cat';
  }

  // Fit main-effects-only model
  let mainMatrix, mainSolution;
  try {
    mainMatrix = buildDesignMatrix(data, outcome, allSpecs);
    mainSolution = solveOLS(mainMatrix.X, mainMatrix.y, mainMatrix.n, mainMatrix.p);
  } catch {
    return makeNullResult(sortedFactors, interactionType, factorA, typeA, factorB, typeB);
  }

  // Fit model with interaction term added
  const interactionName = `${factorA}×${factorB}`;
  const specsWithInteraction: FactorSpec[] = [
    ...allSpecs,
    { name: interactionName, type: 'interaction', sourceFactors: [factorA, factorB] },
  ];

  let fullMatrix, fullSolution;
  try {
    fullMatrix = buildDesignMatrix(data, outcome, specsWithInteraction);
    fullSolution = solveOLS(fullMatrix.X, fullMatrix.y, fullMatrix.n, fullMatrix.p);
  } catch {
    return makeNullResult(sortedFactors, interactionType, factorA, typeA, factorB, typeB);
  }

  // Partial F-test
  const dfInteraction = fullMatrix.p - mainMatrix.p;
  const dfResidual = fullMatrix.n - fullMatrix.p;
  const sseDiff = Math.max(0, mainSolution.sse - fullSolution.sse);
  const mseResidual = dfResidual > 0 ? fullSolution.sse / dfResidual : 0;
  const partialF = dfInteraction > 0 && mseResidual > 0 ? sseDiff / dfInteraction / mseResidual : 0;
  const pValue =
    dfInteraction > 0 && dfResidual > 0
      ? fDistributionPValue(partialF, dfInteraction, dfResidual)
      : 1;

  const deltaRSquaredAdj = Math.max(0, fullSolution.rSquaredAdj - mainSolution.rSquaredAdj);

  // Pattern classification
  const pattern = classifyInteractionPattern(data, outcome, factorA, factorB);

  // Plot axes
  const axes = assignPlotAxes(factorA, typeA, factorB, typeB);

  return {
    factors: sortedFactors,
    pattern,
    deltaRSquaredAdj,
    pValue,
    isSignificant: pValue < alpha,
    interactionType,
    ...axes,
  };
}

// ============================================================================
// Pattern classification
// ============================================================================

/**
 * Classify interaction pattern as ordinal or disordinal.
 *
 * Ordinal: the ranking of plotSeries levels is preserved across plotXAxis values.
 * Disordinal: the ranking reverses at some point (lines cross).
 *
 * For continuous plotXAxis, discretizes into quartile bins.
 */
export function classifyInteractionPattern(
  data: DataRow[],
  outcome: string,
  factorA: string,
  factorB: string
): 'ordinal' | 'disordinal' {
  // Collect valid rows
  const rows: { a: string; b: string; y: number; aNum?: number }[] = [];
  for (const row of data) {
    const y = toNumericValue(row[outcome]);
    if (y === undefined) continue;
    const a = row[factorA];
    const b = row[factorB];
    if (a === null || a === undefined || b === null || b === undefined) continue;
    const aNum = toNumericValue(a);
    rows.push({ a: String(a), b: String(b), y, aNum });
  }

  if (rows.length < 4) return 'ordinal'; // not enough data

  // Determine if factorA is continuous (has numeric values with >6 unique)
  const aIsNumeric = rows.every(r => r.aNum !== undefined);
  const uniqueA = new Set(rows.map(r => r.a)).size;
  const aIsContinuous = aIsNumeric && uniqueA > 6;

  // Get the "x-axis" bins
  let xBins: string[];
  if (aIsContinuous) {
    // Discretize into quartiles
    const sorted = rows.map(r => r.aNum!).sort((a, b) => a - b);
    const q1 = d3.quantile(sorted, 0.25)!;
    const q3 = d3.quantile(sorted, 0.75)!;
    xBins = ['low', 'high'];
    for (const r of rows) {
      r.a = r.aNum! <= q1 ? 'low' : r.aNum! >= q3 ? 'high' : 'mid';
    }
    xBins = ['low', 'mid', 'high'].filter(b => rows.some(r => r.a === b));
  } else {
    xBins = [...new Set(rows.map(r => r.a))].sort();
  }

  const seriesLevels = [...new Set(rows.map(r => r.b))].sort();
  if (seriesLevels.length < 2 || xBins.length < 2) return 'ordinal';

  // Compute cell means for each (xBin, seriesLevel)
  const cellMeans = new Map<string, number>();
  const cellCounts = new Map<string, number[]>();
  for (const r of rows) {
    const key = `${r.a}|${r.b}`;
    if (!cellCounts.has(key)) cellCounts.set(key, []);
    cellCounts.get(key)!.push(r.y);
  }
  for (const [key, vals] of cellCounts) {
    cellMeans.set(key, d3.mean(vals) ?? 0);
  }

  // Check if ranking reverses between any two x-bins
  for (let xi = 0; xi < xBins.length - 1; xi++) {
    for (let si = 0; si < seriesLevels.length; si++) {
      for (let sj = si + 1; sj < seriesLevels.length; sj++) {
        const meanI_curr = cellMeans.get(`${xBins[xi]}|${seriesLevels[si]}`);
        const meanJ_curr = cellMeans.get(`${xBins[xi]}|${seriesLevels[sj]}`);
        const meanI_next = cellMeans.get(`${xBins[xi + 1]}|${seriesLevels[si]}`);
        const meanJ_next = cellMeans.get(`${xBins[xi + 1]}|${seriesLevels[sj]}`);

        if (
          meanI_curr === undefined ||
          meanJ_curr === undefined ||
          meanI_next === undefined ||
          meanJ_next === undefined
        )
          continue;

        const diffCurr = meanI_curr - meanJ_curr;
        const diffNext = meanI_next - meanJ_next;

        // Sign reversal = disordinal
        if ((diffCurr > 0 && diffNext < 0) || (diffCurr < 0 && diffNext > 0)) {
          return 'disordinal';
        }
      }
    }
  }

  return 'ordinal';
}

// ============================================================================
// Plot axis assignment
// ============================================================================

/**
 * Assign plot axes based on factor types (visualization convention, not causal).
 */
export function assignPlotAxes(
  factorA: string,
  typeA: 'continuous' | 'categorical',
  factorB: string,
  typeB: 'continuous' | 'categorical',
  levelsA?: number,
  levelsB?: number
): {
  plotXAxis: string;
  plotSeries: string;
  plotAxisRationale: 'continuous-on-x' | 'more-levels-on-x';
} {
  // Continuous always goes on x-axis
  if (typeA === 'continuous' && typeB === 'categorical') {
    return { plotXAxis: factorA, plotSeries: factorB, plotAxisRationale: 'continuous-on-x' };
  }
  if (typeB === 'continuous' && typeA === 'categorical') {
    return { plotXAxis: factorB, plotSeries: factorA, plotAxisRationale: 'continuous-on-x' };
  }
  if (typeA === 'continuous' && typeB === 'continuous') {
    // Both continuous: higher range on x (fallback to alphabetical)
    return { plotXAxis: factorA, plotSeries: factorB, plotAxisRationale: 'continuous-on-x' };
  }
  // Both categorical: more levels on x-axis
  const lA = levelsA ?? 2;
  const lB = levelsB ?? 2;
  if (lA >= lB) {
    return { plotXAxis: factorA, plotSeries: factorB, plotAxisRationale: 'more-levels-on-x' };
  }
  return { plotXAxis: factorB, plotSeries: factorA, plotAxisRationale: 'more-levels-on-x' };
}

// ============================================================================
// Helpers
// ============================================================================

function makeNullResult(
  factors: [string, string],
  interactionType: 'cont×cont' | 'cont×cat' | 'cat×cat',
  factorA: string,
  typeA: 'continuous' | 'categorical',
  factorB: string,
  typeB: 'continuous' | 'categorical'
): InteractionScreenResult {
  return {
    factors,
    pattern: 'ordinal',
    deltaRSquaredAdj: 0,
    pValue: 1,
    isSignificant: false,
    interactionType,
    ...assignPlotAxes(factorA, typeA, factorB, typeB),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run interactionScreening`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/stats/interactionScreening.ts packages/core/src/stats/__tests__/interactionScreening.test.ts
git commit -m "$(cat <<'EOF'
feat(core): add interaction screening with pattern classification

Partial F-test for interaction significance, ordinal/disordinal
pattern detection from cell means, plot axis assignment by convention.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 4: Add Pass 2 to best subsets

**Files:**

- Modify: `packages/core/src/stats/bestSubsets.ts:593-771`
- Modify: `packages/core/src/stats/__tests__/bestSubsets.test.ts`

- [ ] **Step 1: Write failing integration test**

Append to `packages/core/src/stats/__tests__/bestSubsets.test.ts`:

```typescript
describe('computeBestSubsets — interaction screening (Pass 2)', () => {
  it('detects interaction in the best model when present', () => {
    // Build synthetic data with Temperature×Machine interaction
    const data: DataRow[] = [];
    for (let i = 0; i < 60; i++) {
      const temp = 10 + (i % 10) * 2;
      const machine = i < 30 ? 'A' : 'B';
      const slope = machine === 'A' ? 2.0 : 0.5;
      const y = 100 + slope * (temp - 20) + (machine === 'B' ? 5 : 0) + (i % 5) * 0.05;
      data.push({ Temperature: temp, Machine: machine, Weight: y });
    }

    const result = computeBestSubsets(data, 'Weight', ['Temperature', 'Machine']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    // Interaction should be detected and included
    expect(best.interactionScreenResults).toBeDefined();
    expect(best.interactionScreenResults!.length).toBeGreaterThan(0);
    expect(best.interactionScreenResults![0].isSignificant).toBe(true);

    // Best model should have interaction terms in predictors
    expect(best.hasInteractionTerms).toBe(true);

    // R²adj with interaction should be higher than without
    const mainOnlySubset = result!.subsets.find(
      s => s.factors.length === 2 && !s.hasInteractionTerms
    );
    if (mainOnlySubset) {
      expect(best.rSquaredAdj).toBeGreaterThan(mainOnlySubset.rSquaredAdj);
    }
  });

  it('does not add interaction when none is significant', () => {
    // Parallel slopes — no interaction
    const data: DataRow[] = [];
    for (let i = 0; i < 60; i++) {
      const temp = 10 + (i % 10) * 2;
      const machine = i < 30 ? 'A' : 'B';
      const y = 100 + 1.5 * (temp - 20) + (machine === 'B' ? 5 : 0) + (i % 5) * 0.05;
      data.push({ Temperature: temp, Machine: machine, Weight: y });
    }

    const result = computeBestSubsets(data, 'Weight', ['Temperature', 'Machine']);
    const best = result!.subsets[0];
    expect(best.hasInteractionTerms).toBeFalsy();
  });

  it('preserves backward compat — all-categorical still uses ANOVA path', () => {
    const data: DataRow[] = [
      { Shift: 'Day', Machine: 'A', y: 10 },
      { Shift: 'Day', Machine: 'B', y: 12 },
      { Shift: 'Night', Machine: 'A', y: 15 },
      { Shift: 'Night', Machine: 'B', y: 20 },
      { Shift: 'Day', Machine: 'A', y: 11 },
      { Shift: 'Night', Machine: 'B', y: 19 },
    ];
    const result = computeBestSubsets(data, 'y', ['Shift', 'Machine']);
    expect(result).not.toBeNull();
    expect(result!.usedOLS).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run bestSubsets`
Expected: FAIL — `interactionScreenResults` and `hasInteractionTerms` not defined on BestSubsetResult

- [ ] **Step 3: Add new fields to BestSubsetResult and BestSubsetsResult**

In `packages/core/src/stats/bestSubsets.ts`, add to `BestSubsetResult` interface (after `warnings` field, around line 81):

```typescript
  /** Interaction screening results for factor pairs in this model */
  interactionScreenResults?: InteractionScreenResult[];
  /** Whether the model includes interaction terms */
  hasInteractionTerms?: boolean;
```

Add import at the top of the file:

```typescript
import { screenInteractionPair } from './interactionScreening';
import type { InteractionScreenResult } from './interactionScreening';
```

- [ ] **Step 4: Implement Pass 2 in computeBestSubsetsOLS**

In `packages/core/src/stats/bestSubsets.ts`, after the existing Pass 1 logic that sorts subsets and computes Type III SS / VIF for the best model (around line 725-770), add Pass 2 before the return statement:

```typescript
// =====================================================================
// Pass 2: Screen interaction pairs among winning factors
// =====================================================================

if (best.factors.length >= 2) {
  const winningFactors = best.factors;
  const screenResults: InteractionScreenResult[] = [];

  // Build specs for the winning model
  const winningSpecs: FactorSpec[] = winningFactors.map(f => ({
    name: f,
    type: factorTypeMap.get(f) ?? ('categorical' as const),
    includeQuadratic: quadraticFlags.get(f) ?? false,
  }));

  // Screen all pairs among winners
  for (let i = 0; i < winningFactors.length; i++) {
    for (let j = i + 1; j < winningFactors.length; j++) {
      const result = screenInteractionPair(
        data,
        outcome,
        winningSpecs,
        winningFactors[i],
        winningFactors[j]
      );
      screenResults.push(result);
    }
  }

  best.interactionScreenResults = screenResults;

  // If any significant interactions found, re-fit model with them
  const significantInteractions = screenResults.filter(r => r.isSignificant);

  if (significantInteractions.length > 0) {
    const specsWithInteractions: FactorSpec[] = [
      ...winningSpecs,
      ...significantInteractions.map(r => ({
        name: `${r.factors[0]}×${r.factors[1]}`,
        type: 'interaction' as const,
        sourceFactors: [r.factors[0], r.factors[1]] as [string, string],
      })),
    ];

    try {
      const fullMatrix = buildDesignMatrix(data, outcome, specsWithInteractions);
      if (fullMatrix.n >= fullMatrix.p + 1) {
        const fullSolution = solveOLS(fullMatrix.X, fullMatrix.y, fullMatrix.n, fullMatrix.p);

        // Update best model with interaction-augmented results
        best.rSquared = fullSolution.rSquared;
        best.rSquaredAdj = fullSolution.rSquaredAdj;
        best.fStatistic = fullSolution.fStatistic;
        best.pValue = fullSolution.fPValue;
        best.rmse = fullSolution.rmse;
        best.dfModel = fullMatrix.p - 1;
        best.hasInteractionTerms = true;

        // Re-extract predictors with interaction terms
        best.predictors = extractPredictors(fullSolution, fullMatrix.encodings);
        best.intercept = fullSolution.coefficients[0];

        // Re-compute Type III SS with interaction model
        const typeIIIResults = computeTypeIIISS(data, outcome, specsWithInteractions);
        if (typeIIIResults) {
          best.typeIIIResults = typeIIIResults;
        }

        // Re-compute VIF
        try {
          const vif = computeVIF(fullMatrix.X, fullMatrix.n, fullMatrix.p, fullMatrix.encodings);
          best.vif = vif;
          best.warnings = checkGuardrails(fullSolution, fullMatrix.n, fullMatrix.p, vif);
        } catch {
          // VIF failed — not critical
        }
      }
    } catch {
      // Re-fit failed — keep main-effects-only model
      best.hasInteractionTerms = false;
    }
  }
}
```

Also update `extractPredictors` to handle interaction encodings. Add a new case after the quadratic case:

```typescript
if (enc.type === 'interaction') {
  // For interaction encodings, create one PredictorInfo per column
  for (let ci = 0; ci < enc.columnIndices.length; ci++) {
    const colIdx = enc.columnIndices[ci];
    predictors.push({
      name: enc.factorName,
      factorName: enc.factorName,
      type: 'interaction',
      coefficient: solution.coefficients[colIdx],
      standardError: solution.standardErrors[colIdx],
      tStatistic: solution.tStatistics[colIdx],
      pValue: solution.pValues[colIdx],
      isSignificant: solution.pValues[colIdx] < 0.05,
      sourceFactors: enc.sourceFactors as [string, string],
      interactionType: enc.interactionType,
    });
  }
  continue; // skip to next encoding
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run bestSubsets`
Expected: ALL PASS (new + existing tests)

- [ ] **Step 6: Run all core tests for regression**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: ALL PASS — NIST validation, existing ANOVA path, categorical-only all unchanged

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/stats/bestSubsets.ts packages/core/src/stats/__tests__/bestSubsets.test.ts
git commit -m "$(cat <<'EOF'
feat(core): add Pass 2 interaction screening to best subsets

After finding the best main-effects model, screen all factor pairs
among winners for two-way interactions via partial F-test (α=0.10).
Significant interactions are added to the model and re-fit.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 5: Export new types and functions from stats index

**Files:**

- Modify: `packages/core/src/stats/index.ts`

- [ ] **Step 1: Add exports**

In `packages/core/src/stats/index.ts`, add after the factorEffects exports (around line 136):

```typescript
// Interaction screening (Pass 2 of best subsets)
export type { InteractionScreenResult } from './interactionScreening';
export {
  screenInteractionPair,
  classifyInteractionPattern,
  assignPlotAxes,
} from './interactionScreening';
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter @variscout/core build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/stats/index.ts
git commit -m "$(cat <<'EOF'
feat(core): export interaction screening types and functions

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 6: Enhance injection sample data with interaction

**Files:**

- Modify: `packages/data/src/samples/injection.ts:7-59`

- [ ] **Step 1: Add Temperature×Machine interaction to data generation model**

In `packages/data/src/samples/injection.ts`, update the data generation model comment (lines 7-15) and the `fillWeight` formula (lines 51-59).

Change the `MACHINE_EFFECTS` to also have temperature-dependent slopes:

```typescript
// Machine-specific temperature sensitivity (interaction):
//   M1: standard slope (0.015/°C)
//   M2: higher slope (0.025/°C) — more sensitive to temperature
//   M3: standard slope (0.015/°C)
//   M4: lower slope (0.005/°C) — less sensitive to temperature
const MACHINE_TEMP_SLOPES: Record<string, number> = { M1: 0.015, M2: 0.025, M3: 0.015, M4: 0.005 };
```

Update the fillWeight formula to use machine-specific temperature slopes instead of the fixed 0.015:

```typescript
const tempSlope = MACHINE_TEMP_SLOPES[machine];
const fillWeight =
  12.5 +
  tempSlope * deltaTemp -
  0.001 * deltaTemp * deltaTemp +
  0.005 * deltaForce +
  0.002 * deltaCool +
  SUPPLIER_EFFECTS[supplier] +
  MACHINE_EFFECTS[machine] +
  normal() * 0.15;
```

Update the file header comment to document the interaction:

```typescript
// Data generation model:
//   Fill_Weight = 12.5
//     + machine_temp_slope * (Temp - 195)  temperature slope varies by machine (INTERACTION)
//     - 0.001 * (Temp - 195)²              quadratic: sweet spot at 195°C
//     + 0.005 * (Force - 85)               linear clamping force effect
//     + 0.002 * (CoolTime - 20)            weak cooling time effect
//     + supplier_effect                     A: +0.3, B: 0, C: -0.4
//     + machine_effect                      M1: -0.1, M2: +0.2, M3: 0, M4: -0.1
//     + N(0, 0.15)                          process noise
//
// Designed interaction: Temperature × Machine (ordinal — M2 more sensitive, M4 less)
```

- [ ] **Step 2: Run data package build**

Run: `pnpm --filter @variscout/data build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add packages/data/src/samples/injection.ts
git commit -m "$(cat <<'EOF'
feat(data): add Temperature×Machine interaction to injection sample

Machine-specific temperature slopes create an ordinal interaction
(M2 more sensitive, M4 less) for demonstrating interaction detection.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 7: Run full test suite and verify end-to-end

**Files:**

- No new files — verification only

- [ ] **Step 1: Run all core tests**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: ALL PASS — all existing tests + new interaction tests

- [ ] **Step 2: Run full monorepo tests**

Run: `pnpm test`
Expected: ALL PASS across all packages

- [ ] **Step 3: Verify injection dataset detects interaction**

Write a quick verification test or use the existing bestSubsets test with injection data. The injection dataset should show Temperature×Machine interaction as significant in Pass 2.

- [ ] **Step 4: Commit any test fixes if needed**

---

## Deferred to follow-up tasks (not in this plan)

These items are in the spec but are UI/hooks work that depends on the core engine being complete:

1. **EquationDisplay** — `'interaction'` predictor chip rendering, qualification badge
2. **EdgeDetailCard / EdgeMiniChart** — interaction plot variant with SE bars
3. **useQuestionGeneration** — directional question templates from screening results
4. **useEvidenceMapData** — pass interaction pattern to edge classification
5. **CoScout context** — enriched interactionEffects in AI prompt payload
6. **factorEffects.ts** — route continuous pairs through OLS (can use screenInteractionPair)

These should be a separate plan once the core engine tasks above are verified.
