---
title: Subgroup Capability Analysis
audience: [analyst, engineer]
category: analysis
status: stable
related: [cp, cpk, rational-subgrouping, i-chart]
---

# Subgroup Capability Analysis

## Overview

Subgroup Capability plots Cp and Cpk per subgroup on the I-Chart, revealing whether **capability itself is stable** over time, across batches, or between equipment.

A single Pp/Ppk number is a black box — it tells you the overall result but hides when and how capability shifts. By plotting capability per subgroup, you can:

- Detect **capability shifts** between batches, shifts, or time periods
- Visualize **centering loss** — the gap between Cp and Cpk shows off-center processes
- Identify **when** a process went out of capability (not just that it did)

## Dual Cp/Cpk Series

The I-Chart in Capability mode shows **both Cp and Cpk** as two series on the same chart:

- **Cpk** (primary, blue dots): Actual capability accounting for centering
- **Cp** (secondary, green dots): Potential capability assuming perfect centering

The gap between them directly visualizes centering loss:

- **Small gap**: Process is well-centered (Cpk ≈ Cp)
- **Large gap**: Process is capable but off-center — investigate centering

Each series has its own control limits (UCL/LCL) calculated from the series values.

## Subgroup Configuration

### By Column

Group measurements by a categorical column (e.g., Batch, Shift, Machine). This is the natural choice when your data already has a grouping variable.

### Fixed Size

Chunk consecutive measurements into groups of n (default 5, minimum 2). The trailing partial group is dropped — only full-size subgroups are used.

**Choosing n:**

- **n = 5**: Standard choice, good balance of sensitivity and stability
- **n = 2-3**: Maximum sensitivity to shifts, noisier control limits
- **n = 10+**: Smoother control limits, may mask short-term shifts

## Interpretation Guide

| Pattern                       | Meaning                                          |
| ----------------------------- | ------------------------------------------------ |
| Both series in control        | Capability is stable — Cpk ≈ Ppk                 |
| Cpk out of control, Cp stable | Centering is drifting while spread is consistent |
| Both out of control           | Process is fundamentally unstable                |
| Cp high, Cpk low              | Process is capable but off-center                |
| Single point below LCL        | One subgroup had unusually poor capability       |

## Relationship to Pp/Ppk

- **If the Cpk I-Chart is in control**: Cpk ≈ Ppk (the overall number is representative)
- **If the Cpk I-Chart is out of control**: Ppk is misleading (it averages unstable capability)

This is the "don't Pp on my Cp" insight: overall capability indices hide what subgroup analysis reveals.

## One-Sided Specifications

When only USL or only LSL is set:

- **Cp is not calculated** (requires both specs)
- **Cpk is calculated** using the available spec limit
- The I-Chart shows only the Cpk series (no secondary)

## Edge Cases

- **Subgroups with n=1**: Capability cannot be calculated (requires ≥2 values for sigma)
- **All identical values in subgroup**: Sigma = 0, capability is undefined
- **No specs set**: Toggle is disabled with tooltip "Set specification limits to enable capability view"

## Methodology

### Why Per-Subgroup Cp/Cpk

A single Pp/Ppk number is a black box — it tells you the overall result but hides _when_ and _how_ capability shifts. This aligns with Watson's EDA principle of "see with eyes": a time-series of capability indices reveals patterns that a summary statistic conceals.

### Connection to Two Voices

In standard mode, the Voice of the Process is expressed through control limits on raw measurements. In Capability mode, VariScout applies the same concept one level up: control limits on _Cpk values_ become the Voice of the Process applied to capability itself — meta-stability. If the Cpk I-Chart is in control, the process produces _consistently_ capable output.

### Connection to Progressive Stratification

After identifying unstable subgroups (out-of-control Cpk points), the analyst drills into WHICH factors drive capability differences — the same progressive stratification workflow as standard mode. Filter to the problematic subgroup, then examine the Boxplot and Pareto to find contributing factors.

### Supplier Context (PPAP)

For supplier quality management and PPAP submissions, this analysis provides what reviewers need: evidence that capability is _consistently_ meeting requirements, not just an average that hides batch-to-batch variation. An in-control Cpk I-Chart is stronger evidence than a single Ppk number.

## Architecture

- Core: `packages/core/src/stats/subgroupCapability.ts`
- Hooks: `packages/hooks/src/useCapabilityIChartData.ts`, `useCapabilityBoxplotData.ts`
- ADR: [ADR-038](../../07-decisions/adr-038-subgroup-capability.md)
