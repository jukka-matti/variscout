# Batch Process Consistency

## The Problem

A Process or Production Chemist runs the same recipe batch after batch — same ingredients, same settings, same procedure. But yield and purity vary. Some batches are perfect; others require rework or fail release testing. "What's changing?" is the question nobody can answer, because the data is recorded per batch but never analyzed across batches by factor.

The variables are numerous: raw material lot, reactor vessel, operator, ambient conditions, time-of-year. The data exists in the batch record system, but each batch is reviewed individually for release — nobody looks at the patterns across 100+ batches to find the hidden factor driving inconsistency.

## Target Searcher

| Role                         | Industry                 | Searches for                                               | Current tool                    |
| ---------------------------- | ------------------------ | ---------------------------------------------------------- | ------------------------------- |
| Process / Production Chemist | Chemical, Food, Pharma   | "batch variation analysis," "batch-to-batch consistency"   | Batch records, Excel trending   |
| Production Manager           | Food, Beverage, Chemical | "batch quality variation causes," "production consistency" | Quality reports, ERP batch data |
| Quality Engineer             | Process manufacturing    | "batch process SPC," "batch analysis tool"                 | Manual Excel charts per batch   |

## Keyword Cluster

**Primary:**

- batch variation analysis
- batch-to-batch consistency
- batch process quality

**Long-tail:**

- why does batch quality vary with same recipe
- batch consistency analysis tool
- how to find cause of batch variation
- reactor vessel comparison quality
- raw material lot impact on batch quality

**Related queries:**

- SPC for batch processes
- batch process control chart
- process manufacturing quality tools
- batch release trend analysis
- chemical process variation reduction

## The VariScout Journey

1. **Paste batch data** — rows with Batch ID, Vessel, Material Lot, Operator, Date, Season, Yield/Purity columns
2. **I-Chart** — batch results over time: instability visible, with clusters of good and bad batches (but no obvious time pattern)
3. **Boxplot by Vessel** — Vessel 2 has wider spread and lower median yield. eta-squared: "Vessel explains 22% of yield variation"
4. **Boxplot by Material Lot** — Supplier B's lots have higher variation. eta-squared: "Material lot explains 31% of yield variation"
5. **Drill-down: Vessel 2** — boxplot by Material Lot within Vessel 2. The combination of Vessel 2 + Supplier B material = worst batches
6. **Drill-down: Vessel 2 + Supplier B** — I-Chart shows all 8 problem batches cluster here
7. **Capability** — Cpk overall: 0.9. Cpk excluding Vessel 2 + Supplier B: 1.4. Fixing this combination alone makes the process capable.

**Aha moment:** "Same recipe, same settings — but Vessel 2 reacts differently with Supplier B's raw material. Neither factor alone is bad enough to catch. It's the _interaction_ that kills yield. The drill-down made it obvious."

## Before / After

| Before VariScout                                     | After VariScout                                        |
| ---------------------------------------------------- | ------------------------------------------------------ |
| "Same recipe, different results — we don't know why" | Vessel 2 + Supplier B material = root cause identified |
| Each batch reviewed individually                     | Cross-batch analysis reveals patterns                  |
| Root cause attributed to "normal variation"          | eta-squared quantifies factor contributions            |
| Process runs at Cpk = 0.9 (not capable)              | Fixing one interaction: Cpk jumps to 1.4               |
| Rework costs accepted as normal                      | Specific improvement target with measurable impact     |

## Website Content Map

**Landing page:** `/solutions/batch-analysis`

- Headline: "Same recipe. Different results. Find out why in 30 seconds."
- Key message: Cross-batch analysis reveals which vessel, material lot, or operator combination drives inconsistency
- Interactive demo: Batch process dataset with vessel and material lot factors

**Case study:** Chemical/food batch data — 100 batches, 3 vessels, 4 material lots, 5 operators

- Narrative: "They ran the same recipe 100 times. The drill-down revealed why 15% of batches failed."
- eta-squared showing factor contributions
- Interaction effect: neither factor alone is the problem

**Blog posts:**

- "Batch-to-Batch Variation: It's Not Random, and Here's How to Find the Pattern" (methodology)
- "SPC for Batch Processes: A Practical Guide" (educational)
- "The Interaction Effect: When Two 'OK' Factors Create a Problem Together" (advanced)

**Social:**

- LinkedIn: "Same recipe, 100 batches, 15% failure rate. In 30 seconds we found the specific vessel + material combination that explained it all. Here's the analysis." (discovery story)
- YouTube: "Batch Process Variation Analysis" — 5-minute demo

## Platform Fit

| Stage                    | Product                 | Why                                                                             |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------- |
| Root cause investigation | **PWA** (free)          | Paste batch data, find the factor combination                                   |
| Ongoing batch monitoring | **Excel Add-in** (free) | Connect to batch record export, trend analysis                                  |
| Process team             | **Azure App** (paid)    | Multiple chemists, Performance Mode across products/parameters, shared analysis |
