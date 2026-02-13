# Pharma OOS Investigation

## The Problem

A QC Analyst or Quality Manager gets an Out-of-Specification (OOS) result on a batch release test. Is it a real process failure, a measurement artifact, or a lab error? FDA 21 CFR 211.192 requires a systematic investigation with documented evidence. The QM needs to answer: Was the process drifting? Is the analytical method reliable? Can we identify the assignable cause?

The data exists — batch results over time, multiple analysts, multiple instruments, multiple raw material lots. But it's scattered across LIMS reports and Excel files. The investigation typically takes days of manual data compilation before the actual analysis can begin.

## Target Searcher

| Role                       | Industry               | Searches for                                                    | Current tool                          |
| -------------------------- | ---------------------- | --------------------------------------------------------------- | ------------------------------------- |
| QC Analyst                 | Pharma, Biotech        | "OOS investigation tools," "out-of-specification investigation" | LIMS reports, manual Excel analysis   |
| Quality Manager            | Pharma                 | "batch release analysis," "OOS root cause investigation"        | Paper-based investigation forms       |
| Quality Assurance Director | Pharma, Medical Device | "21 CFR 211.192 investigation tools," "OOS trend analysis"      | Quality system with limited analytics |

## Keyword Cluster

**Primary:**

- OOS investigation
- out-of-specification investigation tools
- batch release testing analysis

**Long-tail:**

- how to investigate out-of-specification result
- OOS investigation procedure with data
- batch trend analysis pharmaceutical
- analyst-to-analyst variation testing
- laboratory OOS root cause analysis

**Related queries:**

- FDA OOS guidance
- 21 CFR 211.192 investigation
- Gage R&R analytical method
- batch-to-batch variation pharma
- process capability pharmaceutical

## The VariScout Journey

1. **Paste batch test results** — rows with Batch, Analyst, Instrument, Material Lot, Test Date, Result columns
2. **I-Chart** — batch results over time: was the process drifting toward the spec limit before the OOS? Nelson Rule 2 (trend) may show gradual shift
3. **Staged analysis: before OOS / OOS batch / after correction** — quantify the magnitude of the shift
4. **Boxplot by Analyst** — do different analysts get different results on the same batch? eta-squared quantifies analyst contribution
5. **Gage R&R** — formal assessment: is the analytical method reproducible? If Gage R&R > 30%, the measurement system is the suspect, not the process
6. **Boxplot by Material Lot** — did the OOS coincide with a new raw material lot? eta-squared: "Material lot explains 44% of result variation"
7. **Boxplot by Instrument** — HPLC 2 consistently reads 0.3% lower than HPLC 1. Calibration issue?
8. **Capability** — Cpk over recent batches shows the process was marginal (Cpk = 0.9) before the OOS — not a sudden failure but a chronic capability gap

**Aha moment:** "The OOS wasn't a random lab error. The I-Chart showed the process had been drifting for 15 batches. Material Lot 4872 pushed it over the edge. And Gage R&R revealed our analytical method has 25% measurement variation — we need to address both the process drift and the method."

## Before / After

| Before VariScout                            | After VariScout                                               |
| ------------------------------------------- | ------------------------------------------------------------- |
| 3-day manual data compilation               | 30-minute paste-and-analyze                                   |
| "Is it the lab or the process?" — guesswork | Gage R&R separates measurement from process variation         |
| Investigation report based on opinions      | Visual evidence: I-Chart trend, boxplot by factor, capability |
| No trend analysis before OOS                | I-Chart shows the drift was visible for 15 batches            |
| Root cause identified by experience         | eta-squared quantifies: "Material lot = 44% of variation"     |

## Website Content Map

**Landing page:** `/solutions/pharma-investigation`

- Headline: "OOS result? Separate process failure from lab error in 30 minutes."
- Key message: I-Chart shows drift, Gage R&R tests the method, Boxplot by factor isolates the cause — with visual evidence for your investigation report
- Interactive demo: Pharma batch release dataset with analyst and instrument factors

**Case study:** Pharmaceutical batch data — 50 batches, 3 analysts, 2 instruments, 4 material lots

- Narrative: "The OOS investigation that usually takes a week was resolved in an afternoon."
- I-Chart showing 15-batch drift before OOS
- Gage R&R revealing 25% measurement variation
- Boxplot by material lot identifying the specific lot

**Blog posts:**

- "OOS Investigation with Data: A Visual Approach to Root Cause Analysis" (methodology)
- "Gage R&R for Analytical Methods: Is Your Lab Test Reliable Enough?" (educational)
- "Batch Trend Analysis: How to Spot OOS Before It Happens" (preventive)

**Social:**

- LinkedIn: "An OOS investigation that usually takes a week — resolved in 30 minutes with data analysis. Here's the approach we used." (efficiency story)
- YouTube: "Pharma OOS Investigation with VariScout" — 6-minute walkthrough

## Platform Fit

| Stage                    | Product                 | Why                                                                                                     |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Urgent OOS investigation | **PWA** (free)          | Paste LIMS data, find root cause fast                                                                   |
| Routine batch monitoring | **Excel Add-in** (free) | Connect to batch results spreadsheet, trend monitoring                                                  |
| QA team workflow         | **Azure App** (paid)    | Multiple analysts, Performance Mode across test parameters, Gage R&R for method validation, audit trail |
