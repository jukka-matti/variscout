---
title: Statistics Panel
audience: [analyst, engineer]
category: analysis
status: stable
related: [capability, boxplot, specs, conformance]
---

# Statistics Panel

<!-- journey-phase: scout -->

> **Journey phase:** SCOUT — conformance and capability metrics visible across all phases.

The Statistics Panel provides summary metrics for the current analysis view. It supports two modes depending on the analyst's focus.

---

## Two Analysis Modes

```
┌─────────────────────────────────────┐
│  ANALYSIS MODE                      │
│  ○ Conformance (batch pass/fail)    │
│  ● Capability (process performance) │
└─────────────────────────────────────┘
```

### Conformance Mode — "Does each batch pass?"

| Metric             | Description                         |
| ------------------ | ----------------------------------- |
| Pass count         | Batches within spec                 |
| Fail count         | Batches outside spec                |
| Pass rate %        | Overall success rate                |
| Failures by factor | Which supplier/station has problems |

Best for: Incoming inspection, export certification, lot acceptance.

```
┌─────────────────────────────────────┐
│  CONFORMANCE SUMMARY                │
│                                     │
│  ✅ Passed:    47/50 (94%)          │
│  🔴 Rejected:   3/50 (6%)           │
│                                     │
│  Spec: 9% - 13% moisture            │
│                                     │
│  Failures by Supplier:              │
│  • Supplier B: 2 (67% of failures)  │
│  • Supplier A: 1 (33% of failures)  │
└─────────────────────────────────────┘
```

### Capability Mode — "Can our process reliably meet specs?"

| Metric           | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| Mean             | Central tendency                                           |
| Median           | Midpoint value (always shown alongside Mean)               |
| Std Dev          | Spread of the distribution                                 |
| Cp               | Process capability (potential) — requires both USL and LSL |
| Cpk              | Process capability (actual, considers centering)           |
| % out of spec    | Actual failure rate                                        |
| η² (eta-squared) | Variation explained by factor                              |

Best for: Process improvement, ongoing monitoring, supplier qualification.

```
┌─────────────────────────────────────┐
│  CAPABILITY SUMMARY                 │
│                                     │
│  Cp:  1.42    Cpk: 0.91 ⚠️          │
│  % out of spec: 6%                  │
│                                     │
│  Process is off-center (shift up)   │
│                                     │
│  Variation by Factor:               │
│  • Supplier: 34% of variation       │
│  • Day: 12% of variation            │
└─────────────────────────────────────┘
```

---

## Display Options (Settings → Visualization)

- Toggle Cp display (only available when both USL and LSL are defined)
- Toggle Cpk display
- Configurable Cpk target threshold (default: 1.33)
  - Values below target shown in warning color (yellow/amber)
  - Values at or above target shown in success color (green)
  - Configurable threshold available in Azure App; PWA uses fixed 1.33 threshold

---

## Capability Histogram

Available via the Histogram tab in the Stats Panel.

```
┌─────────────────────────────────────┐
│  HISTOGRAM                          │
│       LSL         Mean        USL   │
│        │    ████   │           │    │
│        │   ██████  │           │    │
│        │  █████████│███        │    │
│        │ ███████████████       │    │
│  ──────┼───────────┼───────────┼──  │
│   🔴    │    🟢     │     🟢    │ 🔴 │
│ out of │  within   │   within  │out │
│  spec  │   spec    │    spec   │    │
└─────────────────────────────────────┘
```

- Distribution histogram of outcome values
- Vertical lines for USL (red dashed), LSL (red dashed), Target (green dashed), Mean (blue solid)
- Bars colored green (within spec) or red (outside spec)
- Visual complement to numeric Cp/Cpk values

---

## Spec Input Flow (Progressive Disclosure)

Users can set specification limits at two points in the workflow:

### 1. During Column Mapping (optional)

The ColumnMapping component includes a collapsible "Set Specification Limits" section at the bottom. It is collapsed by default — users who already know their specs can expand it and enter Target, LSL, and USL before proceeding to analysis. Values are applied automatically; no Apply button is required.

```
┌─────────────────────────────────────┐
│  Column Mapping                     │
│  ...                                │
│  ▶ Set Specification Limits         │  ← collapsed by default
└─────────────────────────────────────┘

Expanded:
┌─────────────────────────────────────┐
│  ▼ Set Specification Limits         │
│                                     │
│  Target: [________]   (optional)    │
│  LSL:    [________]   (optional)    │
│  USL:    [________]   (optional)    │
└─────────────────────────────────────┘
```

### 2. Pencil Link in the Stats Panel

The Stats Panel shows a pencil link below the metric cards. The link text changes based on whether specs are already configured:

- **No specs set:** `✏ Set spec limits` — clicking opens the SpecEditor popover where the user can enter Target, LSL, and USL.
- **Specs exist:** `✏ Edit spec limits` — clicking opens the same SpecEditor popover, pre-populated with current values.

```
┌─────────────────────────────────────┐
│  STATS                              │
│  Mean: 12.4    Median: 12.2         │
│  Std Dev: 0.8  Samples: 50          │
│                                     │
│  ✏ Set spec limits                  │
└─────────────────────────────────────┘
```

Once specs are saved via the SpecEditor, the capability cards (Cp, Cpk, Pass Rate) appear in the metric grid:

```
┌─────────────────────────────────────┐
│  STATS                              │
│  Pass Rate: 94%  Cp: 1.42  Cpk: 0.91│
│  Mean: 12.4    Median: 12.2         │
│  Std Dev: 0.8  Samples: 50          │
│                                     │
│  ✏ Edit spec limits                 │
└─────────────────────────────────────┘
```

**Design rationale:** A single SpecEditor popover provides a consistent spec editing experience across all entry points (Stats Panel, chart cards, header).

---

## See Also

- [Capability Analysis](capability.md) — Cp/Cpk calculations and interpretation
- [Boxplot](boxplot.md) — Factor comparison with contribution %
- [Variation Decomposition](variation-decomposition.md) — η² and Total SS metrics
