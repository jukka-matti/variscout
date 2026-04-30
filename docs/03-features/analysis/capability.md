---
title: Capability Analysis
audience: [analyst, engineer]
category: analysis
status: stable
related: [cpk, cp, normal-distribution, sigma-estimation, specification-limits]
---

# Capability Analysis

<!-- journey-phase: scout -->

> **Journey phase:** SCOUT (VALUE lens) — specification-aware comparison to customer requirements.

Capability Analysis is VariScout's tool for the **VALUE** lens - comparing process output to customer specifications.

---

## Purpose

_"Are we measuring what the customer actually experiences? Do we meet their specs?"_

Capability reveals:

- Distribution shape (normal, bimodal, skewed)
- Position relative to specifications (USL/LSL/Target)
- Cp/Cpk metrics (process capability)
- Pass/fail percentage

---

## Key Metrics

| Metric    | Formula                 | Interpretation                         |
| --------- | ----------------------- | -------------------------------------- |
| Cp        | (USL - LSL) / 6σ_within | Potential capability (spread only)     |
| Cpk       | min(CPU, CPL)           | Actual capability (spread + centering) |
| Pass Rate | % within specs          | Conformance rate                       |

### One-Sided Characteristics

For directional [characteristic types](characteristic-types.md), capability metrics adapt:

- **Smaller-is-better** (USL only): Cp and Cpk use only the upper specification limit
- **Larger-is-better** (LSL only): Cp and Cpk use only the lower specification limit
- **Nominal** (USL + LSL): Standard two-sided Cp/Cpk calculation

When only one spec limit is set, Cp equals Cpk (there is only one side to measure against). The capability histogram still shows the full distribution but marks only the relevant limit.

---

## Sigma Estimation (σ_within)

VariScout uses **σ_within** (within-subgroup standard deviation) for Cp/Cpk and I-Chart control limits, not the overall standard deviation. This is the industry standard approach used by Minitab, JMP, and other SPC software.

### How σ_within is estimated

σ_within is estimated from the **moving range** of consecutive observations:

```
σ_within = MR̄ / d2
```

Where:

- **MR̄** = mean of absolute differences between consecutive points: mean(|x*i - x*{i-1}|)
- **d2** = 1.128 (unbiasing constant for span of 2)

### Why subgroup size = 1 (individuals)

In standard Values mode, VariScout uses subgroup size n=1 because data arrives as individual measurements (flat rows). In **Capability mode**, the analyst defines rational subgroups (by column or fixed size) and VariScout calculates per-subgroup Cp/Cpk. See [Subgroup Capability Analysis](subgroup-capability.md).

In standard mode, this means:

- Chart type is always **I-MR** (Individuals and Moving Range)
- The moving range span is 2 (consecutive pairs), giving d2 = 1.128
- No subgroup size selector is needed (unlike Minitab, which supports X̄-R charts with larger subgroups)

**Reference — Minitab d2 constants by subgroup size:**

| n               | d2    | Chart type |
| --------------- | ----- | ---------- |
| 1 (individuals) | 1.128 | I-MR       |
| 2               | 1.128 | X̄-R        |
| 3               | 1.693 | X̄-R        |
| 4               | 2.059 | X̄-R        |
| 5               | 2.326 | X̄-R        |

### Data order matters

The moving range assumes data is in **time or production order**. If rows are shuffled or sorted by value, MR̄ will be inflated and σ_within will overestimate true short-term variation.

### σ_within vs σ_overall

|                      | σ_within (MR̄/d2)                  | σ_overall (sample std dev)       |
| -------------------- | --------------------------------- | -------------------------------- |
| **Used for**         | Cp, Cpk, control limits (UCL/LCL) | Pp, Ppk (not currently computed) |
| **Captures**         | Short-term, inherent variation    | All variation including shifts   |
| **Sensitive to**     | Consecutive-point differences     | All data points equally          |
| **When they differ** | Process has shifts or trends      | —                                |

VariScout computes Cp/Cpk only (using σ_within). Pp/Ppk (using σ_overall) are not reported directly. However, Capability mode plots Cpk per subgroup on the I-Chart — if the Cpk I-Chart is in control, then Cpk ≈ Ppk naturally. This provides the same information more diagnostically. See [Subgroup Capability Analysis](subgroup-capability.md).

---

## Prerequisites

Capability metrics require specification limits to be meaningful:

| Metric    | Requirements                   |
| --------- | ------------------------------ |
| Pass Rate | At least one spec (USL or LSL) |
| Cp        | Both USL and LSL               |
| Cpk       | At least one spec (USL or LSL) |

When no specifications are configured, the top strip shows only basic statistics (Mean, Std Dev, Sample count) and the adaptive lens labels the histogram view as **Distribution** rather than **Capability**.

---

## Capability Grades (target-relative)

VariScout grades Cpk relative to a **user-set Cpk target** (default `1.33`), not against fixed literature thresholds. The target is configurable per investigation (in the Spec editor) and per hub (on the capability signal). Raising the target raises the bar.

| Surface                          | Green          | Amber                      | Red                   |
| -------------------------------- | -------------- | -------------------------- | --------------------- |
| Process moments (`statusForCpk`) | `cpk ≥ target` | `cpk ≥ target × 0.75`      | `cpk < target × 0.75` |
| Report KPI grids (`getCpkColor`) | `cpk ≥ target` | `cpk ≥ 1.0` and `< target` | `cpk < 1.0`           |

The two surfaces share the green threshold (always `target`); they differ slightly on the amber/red split. Source of truth: `statusForCpk` in `packages/core/src/processMoments.ts` and `getCpkColor` in `packages/ui/src/components/ReportView/ReportKPIGrid.tsx`.

For reference, the canonical literature thresholds (≥1.67 excellent, 1.33–1.67 good, 1.00–1.33 marginal, <1.00 not capable) are what most process-improvement texts assume when the analyst hasn't set a target. With `target = 1.33`, VariScout's green/red boundary aligns with the literature "capable" line.

### Dashboard Behavior in Capability Mode

When the analyst toggles to Capability mode:

- **I-Chart**: Dual Cpk/Cp series with connecting lines showing centering gap
- **Variation Sources panel**: Stays subgroup-focused in the laptop baseline; capability does not take over the boxplot slot
- **Adaptive lens**: The secondary tab becomes **Capability** (instead of **Distribution**) and remains paired with **Probability**
- **Pareto**: Appears in the adaptive lens only when the dataset has a meaningful ranking dimension
- **Process Health Bar**: Shows overall Cpk and % subgroups meeting Cpk target

---

## Histogram Elements

| Element      | Description            |
| ------------ | ---------------------- |
| Bars         | Frequency distribution |
| USL line     | Upper specification    |
| LSL line     | Lower specification    |
| Target line  | Ideal value            |
| Normal curve | Fitted distribution    |

---

## Interpretation

| Pattern                    | Meaning         |
| -------------------------- | --------------- |
| Distribution within specs  | Capable process |
| Distribution exceeds specs | Not capable     |
| Centered on target         | Well-centered   |
| Shifted toward one spec    | Centering issue |
| Bimodal                    | Mixed streams   |

---

---

## Technical Reference

VariScout's implementation:

```typescript
// From @variscout/core
import { calculateStats } from '@variscout/core';

const stats = calculateStats(values, usl, lsl);
// Returns: { mean, stdDev, sigmaWithin, mrBar, ucl, lcl, cp, cpk, outOfSpecPercentage, ... }

// σ_within = MR̄ / d2 (d2 = 1.128 for individuals chart)
// Cp  = (USL - LSL) / (6 * sigmaWithin)
// Cpk = min((USL - mean) / (3 * sigmaWithin), (mean - LSL) / (3 * sigmaWithin))
// UCL = mean + 3 * sigmaWithin
// LCL = mean - 3 * sigmaWithin
```

**Test coverage:** See `packages/core/src/__tests__/stats.test.ts` for capability tests.

---

## See Also

- [VALUE Lens](../../01-vision/four-lenses/value.md) - Customer value concepts
- [Two Voices](../../01-vision/two-voices/index.md) - Control limits vs specs
- [Probability Plot](probability-plot.md) - Check normality assumption
- [Statistics Panel](stats-panel.md) - Where summary stats and the adaptive lens fit together
- [Performance Mode](performance-mode.md) - Multi-channel capability comparison
- [Staged Analysis](staged-analysis.md) - Before/after capability comparison
- [Glossary: Cp/Cpk](../../glossary.md#cp)
- [Chart Design](../../06-design-system/charts/capability.md)
- [Subgroup Capability](subgroup-capability.md) - Per-subgroup Cp/Cpk stability analysis
- [Case: Packaging](../../04-cases/packaging/index.md) - Capability assessment example
