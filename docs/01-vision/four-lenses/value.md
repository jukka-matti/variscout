---
title: 'VALUE Lens: Capability Histogram'
---

# VALUE Lens: Capability Histogram

> The Alignment Lens — a different type of question

The VALUE lens is fundamentally different from the other three. While CHANGE, FLOW, and FAILURE analyze internal process behavior (what the process is doing), VALUE brings in an **external reference** — the customer's specification. It asks: "does the variation we found actually matter to the customer?"

This makes VALUE a different kind of question, and often a different kind of story. The detective lenses (CHANGE, FLOW, FAILURE) find the source of variation. The VALUE lens determines whether it's worth fixing.

---

## The Question

_"Are we measuring what the customer actually experiences? Do we meet their specs?"_

---

## What the Capability Histogram Reveals

- Distribution shape (normal, bimodal, skewed)
- Position relative to specifications (USL/LSL/Target)
- Cp/Cpk metrics (process capability)
- Pass/fail percentage

---

## Key Insight from Sock Mystery

> "If you get Value wrong, the rest of the analysis is meaningless."

The demand for "consistent length" only made sense within a size category. Rational subgroups must align with how customers experience variation.

---

## VariScout Implementation

- Specification limit inputs (USL/LSL/Target)
- Cp/Cpk calculation with visual indicators
- Distribution overlay on histogram
- Multi-tier grading support (coffee A/B/C grades, etc.)

---

## The Reality Check

> "Are we measuring what the customer actually experiences?"

Questions to ask:

- Customer vs Machine CTQ
- Relative vs Absolute specs
- The "So What?" test

---

## Chart-to-Lens Reference

| Lens  | Chart      | Key Metric | Key Visual              | User Action        |
| ----- | ---------- | ---------- | ----------------------- | ------------------ |
| VALUE | Capability | Cp/Cpk     | Histogram vs spec lines | Set USL/LSL/Target |

---

## See Also

- [Four Lenses Overview](index.md)
- [Two Voices](../two-voices/index.md) — Control limits vs specification limits
- [Subgroup Capability](../../03-features/analysis/subgroup-capability.md) — Per-subgroup Cp/Cpk stability analysis
