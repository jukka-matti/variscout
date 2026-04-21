---
title: 'FAILURE Lens: Pareto'
audience: [business, analyst]
category: methodology
status: stable
---

# FAILURE Lens: Pareto

> The Integrity Lens — look at where problems concentrate

The FAILURE lens asks what happens when you count and rank the things that go wrong. The same data that averages describe as "95% good" reveals that most problems cluster in a few specific categories when viewed through this lens.

---

## The Question

_"Where do problems concentrate? Is 'chaotic data' actually mixed streams?"_

---

## What the Pareto Reveals

- Which categories contain most defects/issues
- The vital few vs trivial many (80/20 rule)
- Hidden patterns in "generic scrap buckets"
- Whether failure modes are being masked

---

## Key Insight from Sock Mystery

> "A 'bad process' is often just a 'badly grouped' process."

Chaotic control charts with Cp < 1.0 weren't bad data — they were mixed subgroups. The Pareto finds the "blood spatter" pattern.

---

## VariScout Implementation

- Frequency analysis of any categorical column
- Cumulative percentage line
- Click any bar → filters to that category
- Reveals which factor level drives most problems

---

## The Reality Check

> "Is chaotic data masking a 'mixed subgroup' problem?"

Questions to ask:

- The "Chaos" signal (Cp < 1.0)
- Generic scrap buckets
- Multi-modal distributions

---

## Chart-to-Lens Reference

| Lens    | Chart  | Key Metric         | Key Visual                   | User Action                    |
| ------- | ------ | ------------------ | ---------------------------- | ------------------------------ |
| FAILURE | Pareto | Category frequency | Bar height + cumulative line | Click bar → filter to category |

---

## See Also

- [Four Lenses Overview](index.md)
- [Drill-Down](drilldown.md) — Progressive analysis methodology
