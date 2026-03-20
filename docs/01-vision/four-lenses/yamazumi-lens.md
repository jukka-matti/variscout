---
title: 'Yamazumi Lens: Composition'
---

# Yamazumi Lens: Composition

> The Waste Lens — see what time is made of, not just how much there is

The Yamazumi lens extends the FLOW lens by adding a **waste composition dimension**. Where the Boxplot asks "which inputs explain the variation?", the Yamazumi chart asks "what is the time made of, and how much is waste?"

---

## The Question

_"Where is waste hiding inside the cycle time, and which station should we improve first?"_

---

## Relationship to the Four Lenses

The Yamazumi chart does not replace any of the four core lenses — it adds a composition layer that is specific to time study data:

| Core Lens   | What It Asks                        | Yamazumi Extension                             |
| ----------- | ----------------------------------- | ---------------------------------------------- |
| **CHANGE**  | "Is cycle time shifting over time?" | I-Chart shows total, VA-only, or NVA-only time |
| **FLOW**    | "Which station has the most time?"  | Yamazumi shows _why_ — VA vs NVA vs Wait       |
| **FAILURE** | "Where do problems cluster?"        | Pareto ranks waste by station or by type       |
| **VALUE**   | "Does it meet customer specs?"      | Takt compliance replaces spec compliance       |

The Yamazumi lens is most closely aligned with **FLOW** (structural decomposition) but introduces a qualitative dimension that FLOW's Boxplot cannot express: the _nature_ of the variation, not just its magnitude.

---

## How the Journey Phases Work with Time Study Data

### FRAME

Upload time study data. VariScout auto-detects the activity type column and suggests Yamazumi mode. The analyst confirms column mapping and enters takt time (the pace the customer requires).

### SCOUT

The Yamazumi chart immediately reveals:

- Which stations exceed takt time
- Whether the excess is value-add work (overloaded) or waste (improvable)
- The overall process efficiency (VA / Total)

This is the "first look" — equivalent to seeing the I-Chart pattern in Standard mode.

### INVESTIGATE

Drill down into problem stations:

- Filter to the bottleneck station to see its NVA breakdown
- Check the I-Chart for time-based trends (is waste increasing?)
- Pin findings: "Station 5 has 40% NVA, primarily rework"
- Build hypotheses: "Rework caused by upstream solder quality"

### IMPROVE

After kaizen:

- Upload post-improvement data with a stage column
- Staged analysis compares before/after Yamazumi compositions
- Process Efficiency replaces Cpk as the key improvement metric
- The takt compliance rate becomes the "pass rate" equivalent

---

## Process Efficiency as the Lean Counterpart to Cpk

In SPC, **Cpk** measures how well a process meets specification limits. In lean time study analysis, **Process Efficiency** serves the same role:

| SPC Concept   | Lean Equivalent    | Formula                     |
| ------------- | ------------------ | --------------------------- |
| Cpk           | Process Efficiency | VA time / Total time        |
| Specification | Takt time          | Available time / Demand     |
| Pass rate     | Takt compliance    | Stations below takt / Total |
| Out-of-spec   | Above takt         | Station total > Takt        |

Both answer the same fundamental question: "Is the process meeting what the customer needs?" The language and units differ, but the analytical pattern is the same.

---

## Chart-to-Lens Reference

| Lens     | Chart         | Key Metric         | Key Visual                       | User Action                      |
| -------- | ------------- | ------------------ | -------------------------------- | -------------------------------- |
| Yamazumi | YamazumiChart | Process Efficiency | Stacked composition vs takt line | Click segment → filter to detail |

---

## See Also

- [Four Lenses Overview](index.md)
- [FLOW Lens](flow.md) — The structural lens that Yamazumi extends
- [VALUE Lens](value.md) — Spec compliance, the SPC equivalent of takt compliance
- [Yamazumi Feature Doc](../../03-features/analysis/yamazumi.md)
