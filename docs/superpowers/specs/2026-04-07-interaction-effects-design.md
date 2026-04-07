---
title: Interaction Effects — Two-Pass Best Subsets with OLS Interaction Screening
status: draft
date: 2026-04-07
related:
  [
    adr-067,
    adr-052,
    adr-054,
    evidence-map-design,
    continuous-regression-design,
    investigation-spine-design,
  ]
benchmark: Minitab Best Subsets with two-way interactions, JMP Fit Model
---

# Interaction Effects — Two-Pass Best Subsets

Extend the unified GLM engine (ADR-067) to detect and include two-way interaction terms in the regression model. Matches Minitab Best Subsets capability for interaction detection while respecting browser execution constraints and VariScout's question-driven investigation methodology.

---

## 1. Problem

The current best subsets engine evaluates main effects only. When two factors interact — their combined pattern differs from the sum of individual effects — the model understates R²adj and the equation omits the interaction term. An MBB running Minitab would see the interaction in the model; in VariScout, it's detected separately via categorical-only cell-means (`computeInteractionEffects()`) and never enters the equation.

Three gaps:

1. **No continuous×continuous or continuous×categorical interaction detection.** The cell-means approach in `factorEffects.ts` only handles categorical pairs.
2. **Interaction terms not in the best model equation.** The equation and predictions are additive-only, which can mislead when interactions are meaningful.
3. **No interaction qualification on the equation.** Dr. Makela (MBB validation, March 2026) specifically requested: "Add interaction flag when L3 ΔR² is significant — qualify prediction."

---

## 2. Approach: Two-Pass Hierarchical Best Subsets

### Why two-pass, not full enumeration

Full enumeration with interactions as candidates: k=6 factors + C(6,2)=15 interaction pairs = 21 candidate groups → 2^21−1 = 2,097,151 OLS solves. Unacceptable in the browser.

Two-pass hierarchical:

- **Pass 1** (unchanged): Evaluate all 2^k−1 main-effect subsets, pick the best R²adj model. Returns 2–4 winning factors typically.
- **Pass 2** (new): Screen interaction pairs among winning factors only. For w winners, test C(w,2) pairs — typically 3–6 partial F-tests.

k=6, 3 winners: 63 + 6 = **69 OLS solves**. Negligible overhead vs current.

This matches the methodology: Layer 1 (main effects) validates before Layer 3 (interactions) activates. The hierarchical constraint is statistically sound — interactions between non-significant main effects are rarely meaningful, and Minitab's own documentation recommends hierarchical model selection.

### Pass 2 algorithm

For each pair (A, B) among winning factors:

1. Fit the winning model (main effects only) → SSE_main
2. Add A×B interaction columns to the design matrix, re-fit → SSE_full
3. Partial F-test: `F = [(SSE_main − SSE_full) / df_interaction] / [SSE_full / df_residual]`
4. If p < 0.10 (screening threshold, same as quadratic screening), retain the interaction term
5. After all pairs screened, re-fit the complete model (main effects + significant interactions) → final equation

The screening threshold (α=0.10) is deliberately generous — same as `shouldIncludeQuadratic()`. It's a screening pass, not a confirmatory test. The confirmed p-value appears in the final model's Type III SS results.

---

## 3. Design Matrix: Interaction Columns

New `'interaction'` type in `FactorSpec`:

```typescript
interface FactorSpec {
  name: string;
  type: 'continuous' | 'categorical' | 'interaction';
  includeQuadratic?: boolean; // continuous only
  sourceFactors?: [string, string]; // interaction only
}
```

### Column generation by factor pair type

| Pair type                                       | Columns            | Formula                                                  |
| ----------------------------------------------- | ------------------ | -------------------------------------------------------- |
| Continuous × Continuous                         | 1 column           | `(X_A − mean_A)(X_B − mean_B)` — centered product        |
| Continuous × Categorical (m levels)             | m−1 columns        | `(X_cont − mean) × dummy_j` for each non-reference level |
| Categorical (a levels) × Categorical (b levels) | (a−1)(b−1) columns | `dummy_Ai × dummy_Bj` for each non-reference level pair  |

Centering for continuous×continuous reduces collinearity between the interaction column and main-effect columns (same rationale as centering X before X²).

### FactorEncoding extension

```typescript
interface FactorEncoding {
  factorName: string;
  type: 'continuous' | 'categorical' | 'interaction';
  columnIndices: number[];
  // Existing fields for continuous/categorical...
  // New for interaction:
  sourceFactors?: [string, string];
  interactionType?: 'cont×cont' | 'cont×cat' | 'cat×cat';
}
```

---

## 4. Interaction Screening Result

```typescript
interface InteractionScreenResult {
  factors: [string, string]; // Alphabetical order, no causal direction
  pattern: 'ordinal' | 'disordinal'; // Geometric property of cell means
  deltaRSquaredAdj: number;
  pValue: number;
  isSignificant: boolean;
  interactionType: 'cont×cont' | 'cont×cat' | 'cat×cat';
  // Visualization convention (not causal):
  plotXAxis: string; // Continuous factor, or higher-level-count
  plotSeries: string; // The other factor
  plotAxisRationale: 'continuous-on-x' | 'more-levels-on-x';
}
```

### Pattern classification

- **Ordinal**: the ranking of `plotSeries` levels does not reverse across `plotXAxis` values (within observed range). Lines don't cross.
- **Disordinal**: the ranking reverses. Lines cross within the observed range.

Detection: for each `plotXAxis` value (or discretized bin for continuous), rank the `plotSeries` levels by cell mean. If the rank order is preserved across all `plotXAxis` values, ordinal. If the rank order reverses between any two `plotXAxis` values, disordinal. For continuous `plotXAxis`, discretize into quartile bins for comparison.

### Plot axis assignment

| Pair type                 | plotXAxis           | plotSeries         | Rationale                                      |
| ------------------------- | ------------------- | ------------------ | ---------------------------------------------- |
| Continuous × Categorical  | Continuous factor   | Categorical factor | Continuous on x-axis makes readable slopes     |
| Continuous × Continuous   | Higher-range factor | Lower-range factor | Wider spread on x, other as discretized series |
| Categorical × Categorical | More levels         | Fewer levels       | Spread on x, fewer series lines                |

This is a **visualization convention**, not a causal claim.

---

## 5. Predictor Types

```typescript
type PredictorType = 'categorical' | 'continuous' | 'quadratic' | 'interaction';

interface PredictorInfo {
  name: string; // "Temperature×Machine"
  factorName: string; // "Temperature×Machine" (same for interactions)
  type: PredictorType;
  coefficient: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  // New for interaction:
  sourceFactors?: [string, string];
  interactionType?: 'cont×cont' | 'cont×cat' | 'cat×cat';
}
```

---

## 6. Type III SS and VIF

**Type III SS**: No changes. The model-comparison approach (fit full model, drop one factor group, measure SSE increase) handles interaction columns automatically. The interaction group's partial η² and F-test come out of the existing `computeTypeIIISS()`.

**VIF**: Interaction columns get VIF computed like any predictor group. High VIF between a main effect and its interaction term is expected (structural collinearity). Suppress the VIF warning for interaction terms whose VIF is elevated solely due to correlation with their parent main effects.

---

## 7. Evidence Map Integration

### Edge classification

`classifyRelationship()` in `causalGraph.ts` already returns `'interactive'` when `deltaR2 > threshold`. The interaction screening result provides the `deltaRSquaredAdj` that feeds this classification — now computed via OLS for all factor type combinations, not just categorical cell means.

### Edge visual

| Pattern    | Edge style            | Edge detail                                                     |
| ---------- | --------------------- | --------------------------------------------------------------- |
| Ordinal    | Modulated lateral arc | "The gap between {Series} levels changes across {XAxis} values" |
| Disordinal | Dashed lateral arc    | "The ranking of {Series} levels reverses across {XAxis} values" |

The lateral arc (factor↔factor) is visually distinct from radial spokes (factor→outcome). This is the discovery surface — an anomaly in the map that triggers curiosity.

### Edge detail card

Clicking an interactive edge opens `EdgeDetailCard` with:

- Interaction plot (cell means with ±SE bars) — new `EdgeMiniChart` variant
- Cell sample counts per combination (Dr. Makela's caveat 2)
- Pattern label ("ordinal" / "disordinal") with hover definition
- ΔR²adj, p-value
- Plain-language summary in CoScout voice
- "Investigate this pattern" → opens CoScout with interaction context

---

## 8. Equation Display

### Interaction predictor chip

`EquationDisplay` gains a new `'interaction'` rendering case:

- Chip shows both factor names with × glyph: `Temperature × Machine`
- Tooltip expands per-level coefficients for cont×cat and cat×cat
- For cont×cont: shows single interaction coefficient

### Natural language view

> "Fill Weight = 12.1 + Temperature (+0.42/°C) + Machine (B: −2.1) + Temperature × Machine (B: −0.18/°C)"

### Qualification badge

When interaction terms are in the model:

> "Model includes factor interactions — predictions account for combined effects."

When interaction is detected but borderline (0.05 < p < 0.10):

> "Possible interaction between Temperature and Machine (p=0.08) — additive prediction may be approximate."

---

## 9. Question System

### Layer 3 gating (unchanged)

Interaction questions require ≥2 significant main effects in the winning model. The two-pass architecture enforces this naturally.

### Directional question templates

| Pattern    | Template                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ordinal    | "{FactorA} and {FactorB} — the gap between {Series} levels changes at different {XAxis} values. Worth checking why."                             |
| Disordinal | "{FactorA} and {FactorB} — the ranking flips. {Best at low} ahead at {low condition}, {other} at {high condition}. What's different about them?" |

Templates reference actual factor names and levels from the screening result. The question mirrors the interaction plot geometry.

### Question metadata

```typescript
interface GeneratedQuestion {
  // existing fields...
  type: 'main-effect' | 'interaction';
  interactionMeta?: {
    factors: [string, string];
    pattern: 'ordinal' | 'disordinal';
    deltaRSquaredAdj: number;
    plotXAxis: string;
    plotSeries: string;
  };
}
```

### Auto-answering thresholds

| ΔR²adj | Status       | Rationale                                                 |
| ------ | ------------ | --------------------------------------------------------- |
| < 2%   | Ruled out    | Statistically significant but practically negligible      |
| 2–5%   | Partial      | Contributing — worth awareness, not primary investigation |
| > 5%   | Answered yes | Meaningful interaction — investigation needed             |

---

## 10. CoScout Integration

### Context payload enrichment

```typescript
interactionEffects: Array<{
  factors: [string, string];
  pattern: 'ordinal' | 'disordinal';
  deltaRSquaredAdj: number;
  pValue: number;
  plainLanguage: string; // Pre-formatted in CoScout voice
}>;
```

### Behavior rules

- **Reactive only.** CoScout never proactively mentions interactions.
- **Weaves in when relevant.** When the analyst asks about either factor in an interacting pair, CoScout includes the interaction context.
- **Bridges to gemba.** Every interaction mention ends with a suggestion for physical verification.
- **One exception.** If the analyst closes investigation on factors that interact without addressing the interaction, CoScout can note: "Before closing — {FactorA} and {FactorB} don't behave independently in this data. Did you want to consider that?"

### Language principles

- Describe geometry: "the gap changes", "the ranking flips"
- Never assign causal direction or moderator/primary roles
- Use confidence calibration (sample size thresholds from role.ts)
- Ground in data: ΔR²adj, p-value, actual level names
- Bridge to action: "worth checking why", "gemba check on..."

---

## 11. Language Principle: Contribution, Not Causation

All interaction language across the system follows this principle from the thesis (Turtiainen 2019) and the CoScout role definition ("Correlation, not causation — VariScout shows WHERE variation concentrates; the analyst investigates WHY"):

| Do                                           | Don't                                        |
| -------------------------------------------- | -------------------------------------------- |
| "The gap between Machine levels changes"     | "Machine B is more sensitive to Temperature" |
| "The ranking reverses across Machine levels" | "Temperature helps on A but hurts on B"      |
| "These factors don't behave independently"   | "Machine moderates Temperature's effect"     |
| "The combined pattern explains +8%"          | "The interaction amplifies the difference"   |
| "Worth checking why" / "Gemba check"         | "This means..." / "The reason is..."         |

The tool observes geometric patterns. The analyst supplies causal interpretation through gemba and expert knowledge. The interaction is contributing evidence under a SuspectedCause hub, not a standalone causal claim.

---

## 12. Backward Compatibility

- **Categorical-only datasets**: The existing ANOVA cell-means path in `computeBestSubsetsANOVA()` is unchanged. Pass 2 interaction screening uses OLS but only activates when the OLS path is used (any continuous factor present). For all-categorical with the OLS path, interaction columns are cat×cat dummies — mathematically equivalent to the current cell-means ΔR².
- **Existing `computeInteractionEffects()`**: Remains as the categorical cell-means engine for Layer 3 question generation when Factor Intelligence is not active. When Factor Intelligence is active (best subsets has run), the Pass 2 screening result takes precedence.
- **BestSubsetResult interface**: New optional fields only (`interactionTerms`, `interactionScreenResults`). No breaking changes.
- **NIST validation**: Norris, Pontius, Longley tests unaffected (no interactions in those datasets).

---

## 13. Sample Data Enhancement

The `injection.ts` sample dataset (HP injection molding) should include a designed interaction between Temperature and Machine where Machine B has a different temperature response slope. This provides a built-in demo case for the interaction flow.

Specifically: Machine A shows a positive linear Temperature effect (+0.42/°C), Machine B shows a weaker positive effect (+0.18/°C). This creates an ordinal interaction with ΔR²adj ≈ 6-8%, detectable by the screening pass.

---

## 14. What This Does NOT Include

- **Response surface / contour plots** — DOE visualization, deferred
- **Three-way interactions** — rare in observational data, not in Minitab Best Subsets default
- **PredictionProfiler wiring** — component exists but not mounted; separate work item
- **Residual diagnostic plots** — Phase 2 of ADR-067
- **Interaction term in the ANOVA path** — ANOVA stays one-factor-at-a-time for boxplot display

---

## 15. Files Modified

### Core engine

| File                                           | Change                                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/stats/designMatrix.ts`      | New `'interaction'` FactorSpec type, product column generation                                                                                      |
| `packages/core/src/stats/bestSubsets.ts`       | Pass 2: `screenInteractionPairs()`, re-fit with significant interactions                                                                            |
| `packages/core/src/stats/factorEffects.ts`     | Extend `computeInteractionEffects()` to route through OLS for continuous factors. Add pattern classifier (ordinal/disordinal), plot axis assignment |
| `packages/core/src/stats/causalGraph.ts`       | `classifyRelationship()` gains pattern metadata                                                                                                     |
| `packages/core/src/stats/evidenceMapLayout.ts` | Pass interaction pattern to edge layout                                                                                                             |
| `packages/core/src/types.ts`                   | `PredictorType` gains `'interaction'`, `PredictorInfo` gains `sourceFactors`, `interactionType`                                                     |

### Hooks

| File                                          | Change                                                         |
| --------------------------------------------- | -------------------------------------------------------------- |
| `packages/hooks/src/useQuestionGeneration.ts` | Directional question templates, `interactionMeta` on questions |
| `packages/hooks/src/useEvidenceMapData.ts`    | Pass interaction pattern to edge classification                |

### UI

| File                                                                              | Change                                                          |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/ui/src/components/ProcessIntelligencePanel/EquationDisplay.tsx`         | `'interaction'` predictor chip, qualification badge             |
| `packages/ui/src/components/ProcessIntelligencePanel/FactorIntelligencePanel.tsx` | Interaction plot gains ±SE bars, cell counts                    |
| `packages/ui/src/components/EvidenceMap/EdgeDetailCard.tsx`                       | Interaction plot variant, pattern label, plain-language summary |
| `packages/ui/src/components/EvidenceMap/EdgeMiniChart.tsx`                        | New interaction plot mode                                       |
| `packages/core/src/ai/types.ts`                                                   | Enriched `interactionEffects` in AI context                     |
| `packages/core/src/ai/prompts/coScout/context/`                                   | Include interaction data in prompt tiers                        |

### Data

| File                                     | Change                                                |
| ---------------------------------------- | ----------------------------------------------------- |
| `packages/data/src/samples/injection.ts` | Enhance with designed Temperature×Machine interaction |

---

## 16. Testing Strategy

| Category                         | Tests                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------ |
| **Unit: interaction columns**    | cont×cont centered product, cont×cat (m−1) columns, cat×cat (a−1)(b−1) columns |
| **Unit: screening**              | Partial F-test detects known interaction in synthetic data, rejects null       |
| **Unit: pattern classifier**     | Ordinal and disordinal correctly identified from cell means                    |
| **Unit: plot axis assignment**   | Continuous always on x when paired with categorical, level count for same-type |
| **Integration: two-pass**        | Pass 1 correct main effects, Pass 2 adds interaction, final R²adj > main-only  |
| **Integration: Type III SS**     | Interaction partial η² correct via model comparison                            |
| **Regression: categorical-only** | Cell-means path unchanged, identical results                                   |
| **Regression: NIST**             | Norris/Pontius/Longley unaffected                                              |
| **Benchmark: injection dataset** | Temperature×Machine detected, ordinal pattern, correct ΔR²adj                  |
| **Benchmark: coffee dataset**    | No spurious interactions when main effects are weak                            |
| **UI: EquationDisplay**          | Interaction chip renders, badge shows                                          |
| **UI: EdgeDetailCard**           | Interaction plot with SE bars, cell counts                                     |
| **Language audit**               | All generated text uses geometric descriptions, no causal claims               |

---

## 17. Verification

### End-to-end verification (injection dataset)

1. Load injection molding sample data
2. Verify Pass 1 identifies Temperature and Machine as winning main effects
3. Verify Pass 2 detects Temperature×Machine interaction (ΔR²adj ≈ 6-8%, p < 0.10)
4. Verify equation includes interaction term with correct coefficient
5. Verify Evidence Map shows interactive lateral arc between Temperature and Machine nodes
6. Verify edge detail card shows interaction plot with ordinal pattern
7. Verify Layer 3 question generated with correct directional template
8. Verify CoScout context includes interaction data (check prompt payload)
9. Verify qualification badge appears on equation display

### Regression verification

1. Run `pnpm --filter @variscout/core test` — all existing tests pass
2. Load coffee sample data — no interaction terms in equation (main effects too weak)
3. Load NIST datasets — coefficients unchanged to 9 significant digits
