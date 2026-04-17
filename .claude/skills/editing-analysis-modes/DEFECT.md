<!-- TOC: Input shapes · detectDefectFormat · DefectDetectedModal · computeDefectRates · Chart slots · Evidence Map three-view · CoScout coaching -->

# Defect Mode Reference

- [What Defect Mode Is](#what-defect-mode-is)
- [Three Input Data Shapes](#three-input-data-shapes)
- [Detection: detectDefectFormat()](#detection-detectdefectformat)
- [UX: DefectDetectedModal](#ux-defectdetectedmodal)
- [Mode Transform: computeDefectRates()](#mode-transform-computedefectrates)
- [Chart Slot Mapping](#chart-slot-mapping)
- [DefectSummary Panel (Slot 4)](#defectsummary-panel-slot-4)
- [Evidence Map Three-View Model](#evidence-map-three-view-model)
- [CoScout Coaching Language](#coscout-coaching-language)
- [Sample Dataset](#sample-dataset)
- [Key Files](#key-files)

## What Defect Mode Is

Defect mode makes defect/error data a first-class citizen. Instead of forcing analysts to use I-Chart control limits (which assume normality) on raw defect event counts, defect mode aggregates raw events into **rates** — a numeric Y that the existing Four Lenses handle naturally.

**Design principle:** Turn defect data into rates, then use existing charts. No new statistical engine (no Poisson/binomial). No new chart types for Slots 1–3.

**`AnalysisMode` value:** `'defect'`
**`ResolvedMode` value:** `'defect'`
**KPI metric:** `'Defect Rate'` (or `'Defects/Unit'` if units produced column available)

## Three Input Data Shapes

| Shape | Description | Transform |
|-------|-------------|-----------|
| `'event-log'` | One row per defect event. Columns: timestamp/batch, defect type, machine, product, etc. | Aggregated: group by [unit], count events per group |
| `'pre-aggregated'` | One row per period with defect count column. | Pass-through: count column becomes Y directly |
| `'pass-fail'` | One row per unit with OK/NG result column. | Aggregated: group by [unit], compute fail proportion |

`DefectDataShape = 'event-log' | 'pre-aggregated' | 'pass-fail'` in `packages/core/src/defect/types.ts`.

## Detection: detectDefectFormat()

`detectDefectFormat()` in `packages/core/src/defect/detection.ts` runs at import time alongside yamazumi and wide-format detection. Returns `DefectDetection` with:

- `isDefectFormat: boolean`
- `confidence: 'high' | 'medium' | 'low'`
- `dataShape: DefectDataShape`
- `suggestedMapping: Partial<DefectMapping>`

**Detection signals:**

- **Event log**: Categorical column with defect-type keywords (`defect`, `error`, `failure`, `reject`, `scrap`, `fault`, `issue`, `nonconformance`) AND no continuous numeric outcome column
- **Pre-aggregated**: Numeric column with count keywords (`count`, `defects`, `errors`, `rejects`, `failures`, `qty_defective`) AND a time/batch grouping column
- **Pass/fail**: Categorical column with exactly 2 unique values matching OK/NG, Pass/Fail, Good/Bad, Conforming/Nonconforming, 0/1, Y/N patterns

## UX: DefectDetectedModal

When `detectDefectFormat()` returns `isDefectFormat: true`, `DefectDetectedModal` appears (mirrors `YamazumiDetectedModal` pattern). Shows:

- Detection confidence badge
- Detected data shape
- Suggested column roles (defect type, count, aggregation unit, optional units produced / cost)
- "Enable Defect Mode" vs "Use Standard Mode" buttons

The analyst confirms or adjusts column assignments before analysis runs. This is the only entry point to defect mode — it cannot be auto-activated without user confirmation.

**Component:** `packages/ui/src/components/DefectDetectedModal/`

## Mode Transform: computeDefectRates()

`computeDefectRates()` in `packages/core/src/defect/transform.ts` runs **before** the stats engine on any filter change. The resulting working dataset is what all four charts, ANOVA, and Best Subsets consume.

```
Raw rows → computeDefectRates(rows, mapping) → Working dataset (aggregated rates)
                                                  → All 4 charts + ANOVA
     Filters trigger re-transform on raw data
```

**Event log → aggregated output:**

- Group by `[aggregation unit]` (e.g., shift, date-hour)
- Output: one row per `[aggregation unit × defect type]`
- Columns: aggregation unit value, `DefectCount`, `DefectRate` (count/units if available), defect type (preserved as factor), other factors (machine, product, line)

**Pre-aggregated → pass-through:** Count column becomes Y. No aggregation needed.

**Pass/fail → proportion:** Group by `[aggregation unit]`, compute `fail_count / total_count` per group.

**React hook:** `useDefectTransform` in `packages/hooks/src/useDefectTransform.ts` wraps `computeDefectRates()` with reactive re-aggregation. When the user drills down to a specific defect type, the hook filters raw events first, then re-aggregates — this may reveal patterns invisible at the total rate level.

**`DefectTransformResult` type:** `packages/core/src/defect/transform.ts` — output shape of the transform.

## Chart Slot Mapping

| Slot | `ChartSlotType` | Chart | Role |
|------|-----------------|-------|------|
| 1 | `'ichart'` | I-Chart (reused) | Aggregated defect rate over time — uses working dataset Y = `DefectRate` |
| 2 | `'boxplot'` | Boxplot (reused) | Rate distribution per category: L1 = defect type, L2+ = machine/shift/line |
| 3 | `'pareto'` | Pareto (reused) | Category ranking with enhanced factor selector |
| 4 | `'defect-summary'` | `DefectSummary` | Total defects, rate, trend, top type, top factor — replaces Stats/Cpk panel |

**No new chart components for Slots 1–3.** All three reuse existing chart components with the mode-transformed working dataset as input.

**Pareto enhancement:** In defect mode, the Pareto's factor selector is more prominent. Default grouping = defect type (freq/time/cost POVs). User can switch to: machine, product, line, shift, operator. Combined with filter chips: filter to "Type A" → switch Pareto to "by machine" → see which machines produce Type A.

## DefectSummary Panel (Slot 4)

The `DefectSummary` component replaces the standard Stats/Capability panel. Displays:

- **Total defects** — raw count across all data
- **Defect rate** — per unit if denominator available, else per aggregation unit
- **Trend** — arrow indicator (↑ increasing, → stable, ↓ decreasing) based on I-Chart regression
- **Top defect type** — highest frequency type + percentage
- **Top contributing factor** — highest η² factor + its value
- **80/20 indicator** — how many types account for 80% of defects

**Component:** `packages/ui/src/components/DefectSummary/`

## Evidence Map Three-View Model

Defect mode adds a three-view selector to the Evidence Map. Defect types decompose the **outcome (Y)**, they are not factors (X). The map stays factor-centric; the view selector controls which Y the map shows.

| View | Description |
|------|-------------|
| **View 1: All Defects** (default) | Standard factor map on total defect rate. Zero extra computation — uses existing best subsets result |
| **View 2: Per-Type** | Regression re-runs on data filtered to one defect type. Factor ranking may differ from total rate |
| **View 3: Cross-Type** | Meta-view: factor nodes sized by how many defect types they significantly explain. No single regression — derived from cached per-type results |

**Cross-type insight:** When a factor drives 2+ types, CoScout can flag it as a systemic cause. "Machine explains Scratch and Dent → systemic process issue, not type-specific."

**Lazy computation:** Per-type regressions are computed on demand and cached. Cross-type view becomes available after 2+ types have been analyzed.

**UI components:**
- `packages/ui/src/components/EvidenceMap/DefectTypeSelector.tsx` — view/type selector
- `packages/ui/src/components/EvidenceMap/CrossTypeEvidenceMap.tsx` — cross-type meta-view

## CoScout Coaching Language

`aiToolSet: 'standard'` — defect mode reuses the standard tool set but the CoScout phase prompts apply defect-specific terminology.

**Use:** defect type, failure mode, defect rate, escape rate, containment, corrective action, Pareto principle, 80/20, frequency, composition, contributing factor, COPQ (cost of poor quality).

**Never use:** Cpk, Cp, specification limits, capability index, process capability. These are meaningless for count data.

**Nelson rules:** Valid on aggregated defect rates (approximately continuous). Not valid on raw event counts. Apply Nelson rules to the I-Chart (aggregated rates) only.

**Phase framing:**
- FRAME: "What is the defect problem?" — total rate, cost impact, trend direction
- SCOUT: "Where do defects concentrate?" — Pareto for top types, Boxplot for factor comparison, I-Chart for temporal patterns
- INVESTIGATE: "What drives this defect type?" — drill to one type, η² factor ranking, brush spike periods
- IMPROVE: "How to reduce defects?" — target top Pareto contributor, containment vs prevention, estimate rate reduction

`questionStrategy.generator = 'defectAnalysis'` — evidence metric = `rSquaredAdj`, question focus = "Which defect type dominates and which factor drives defect rate variation?"

## Sample Dataset

`packages/data/src/samples/manufacturing-defects.ts` — pre-built defect event log dataset for demos and training.

Also: `packages/data/src/samples/weld-defects.ts` for weld-specific failure modes.

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/defect/types.ts` | `DefectDataShape`, `DefectMapping`, `DefectDetection` |
| `packages/core/src/defect/detection.ts` | `detectDefectFormat()` |
| `packages/core/src/defect/transform.ts` | `computeDefectRates()`, `DefectTransformResult` |
| `packages/core/src/defect/questions.ts` | `generateDefectAnalysisQuestions()` |
| `packages/hooks/src/useDefectTransform.ts` | Reactive re-aggregation hook |
| `packages/hooks/src/useDefectSummary.ts` | Summary stats for Slot 4 |
| `packages/hooks/src/useDefectEvidenceMap.ts` | Three-view Evidence Map data |
| `packages/ui/src/components/DefectDetectedModal/` | Import confirmation modal |
| `packages/ui/src/components/DefectSummary/` | Slot 4 KPI panel |
| `packages/ui/src/components/EvidenceMap/DefectTypeSelector.tsx` | View selector |
| `packages/ui/src/components/EvidenceMap/CrossTypeEvidenceMap.tsx` | Cross-type meta-view |
| `docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md` | Full design spec |
| `docs/superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md` | Evidence Map integration detail |
