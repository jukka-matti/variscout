---
title: Defect Analysis Mode — User Journey
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-17
related: [defect, journey, ppm, event-rates, copq]
---

# Defect Analysis Mode — User Journey

## Who uses this mode

Quality engineers tracking defect PPM across production lines, complaint investigators building 8D responses, and supplier quality engineers auditing incoming material defect rates. Their raw data is typically an event log from a quality system — one row per defect occurrence — or a pass/fail result per unit. They know their top defect type is "Scratch" but not which machine, shift, or product drives the scratch rate up, or whether the rate is trending. Standard SPC tools give them meaningless Cpk values on count data; Pareto charts in Excel show frequency but not contributing factors.

## What they want to achieve

The analyst wants to convert raw defect events into analyzable rates, rank defect types by frequency and cost impact, and drill into a specific type to identify which process factor (machine, shift, line, product) explains its variation. The measurable outcome is a ranked list of contributing factors with η² evidence, feeding directly into a COPQ-aligned corrective action: target the top Pareto contributor, estimate rate reduction, assign ownership.

## How they use VariScout for it

The analyst pastes an event log — one row per defect, with columns for defect type, timestamp, machine, shift, and product. `detectDefectFormat()` runs in parallel with standard column detection. When a column matches defect-type keywords (`defect`, `failure`, `reject`, `fault`) alongside no continuous numeric outcome, detection returns high confidence and triggers `DefectDetectedModal`.

The modal shows the detected data shape (event log, pre-aggregated counts, or pass/fail), suggests column roles, and asks which column defines the aggregation unit. If a timestamp column exists, the analyst aggregates by day, week, or shift; a categorical column like Batch aggregates directly.

On confirmation, `computeDefectRates()` runs the mode transform: raw events are grouped by the selected aggregation unit × defect type. If a units-produced column was mapped, rates are computed as defects per unit; otherwise raw counts are used. The working dataset — one row per aggregation group — feeds all four charts.

The dashboard: **Slot 1 — I-Chart** (defect rate per aggregation unit; Nelson rules apply; brush selection isolates spike periods), **Slot 2 — Boxplot** (rate by defect type at Level 1, by machine/shift at Level 2; η² ranks which grouping reveals most structure), **Slot 3 — Pareto** (default by defect type; frequency / time / cost POV toggles; factor-switching dropdown for machine, product, line), **Slot 4 — Defect Summary Panel** (total defects, defect rate, trend arrow, top type %, top contributing factor by η², 80/20 indicator).

The investigation flow: the analyst identifies "Scratch" as 42% of defects in the Pareto. She clicks Scratch — the raw data is filtered to Scratch events only, `computeDefectRates()` re-runs on the filtered subset, and the working dataset is rebuilt. The I-Chart now shows Scratch-only rate. The Boxplot auto-switches from defect type grouping to the next highest-η² factor (Machine). CoScout prompts: "Machine M3 explains 38% of Scratch rate variation — is M3 the only source, or does Shift interact with it?"

For COPQ reporting, the Pareto toggles to Cost POV, making scrap cost by type or machine the bar height. The `manufacturing-defects` sample dataset in `@variscout/data/samples/` provides a pre-loaded event log for training.

## What makes this mode distinctive

- **Mode transform aggregation**: `computeDefectRates()` converts raw events into rates per aggregation unit before any chart or ANOVA runs — the same pattern as Yamazumi's `computeYamazumiData()`. Standard SPC charts work on the transformed output without modification.
- **Re-aggregation on drill-down**: When the analyst filters to a specific defect type, the transform re-runs on the filtered raw data. The I-Chart shows that type's specific rate — not total rate filtered post-aggregation.
- **Three-view Evidence Map**: All Defects (factor-centric on total rate), Per-Type (regression re-run for a selected type), and Cross-Type (meta-view showing which factors are shared drivers — systemic cause detection).
- **Defect-specific CoScout coaching**: CoScout uses failure mode terminology and never references Cpk or spec limits. It coaches COPQ framing: containment first, then prevention.
- **Pareto factor switching**: The Pareto grouping column is user-selectable — switching from defect type to machine, product, or line reveals composition from different angles.

## Design reference

- **Spec:** `docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md`, `docs/superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md`
- **ADR:** (defect mode registered in `analysisStrategy.ts` under ADR-047 strategy pattern)
- **Code:** `packages/core/src/defect/` (detectDefectFormat, computeDefectRates, types), `packages/hooks/src/useDefectTransform.ts`, `packages/hooks/src/useDefectSummary.ts`, `packages/hooks/src/useDefectEvidenceMap.ts`, `packages/ui/src/components/DefectDetectedModal/`, `packages/ui/src/components/DefectSummary/`, `packages/data/src/samples/manufacturing-defects.ts`
