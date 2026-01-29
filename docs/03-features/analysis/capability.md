# Capability Analysis

Capability Analysis is VariScout's tool for the **VALUE** pillar - comparing process output to customer specifications.

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

| Metric    | Formula          | Interpretation                         |
| --------- | ---------------- | -------------------------------------- |
| Cp        | (USL - LSL) / 6σ | Potential capability (spread only)     |
| Cpk       | min(CPU, CPL)    | Actual capability (spread + centering) |
| Pass Rate | % within specs   | Conformance rate                       |

---

## Prerequisites

Capability metrics require specification limits to be meaningful:

| Metric    | Requirements                   |
| --------- | ------------------------------ |
| Pass Rate | At least one spec (USL or LSL) |
| Cp        | Both USL and LSL               |
| Cpk       | At least one spec (USL or LSL) |

When no specifications are configured, the StatsPanel shows only basic statistics (Mean, Std Dev, Sample count).

---

## Capability Grades

| Cpk       | Grade     | Interpretation |
| --------- | --------- | -------------- |
| ≥1.67     | Excellent | Very capable   |
| 1.33-1.67 | Good      | Capable        |
| 1.00-1.33 | Marginal  | Barely capable |
| <1.00     | Poor      | Not capable    |

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

## See Also

- [VALUE Pillar](../../01-vision/four-pillars/value.md)
- [Two Voices](../../01-vision/two-voices/index.md)
- [Glossary: Cp/Cpk](../../glossary.md#cp)
- [Chart Design](../../06-design-system/charts/capability.md)
