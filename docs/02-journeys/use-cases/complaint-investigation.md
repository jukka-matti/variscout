# Customer Complaint Investigation

## The Problem

A Quality Manager receives a customer complaint: "Your product is inconsistent — the last 3 shipments were out of spec." The customer demands a root cause analysis and corrective action within 48 hours. The QM needs to investigate fast: What changed? Which batch? Which line? Was it a process shift, a material change, or a measurement issue?

The production data exists, but it's in a quality system or spreadsheet with thousands of rows. The QM needs to filter to the complaint period, compare it to the prior baseline, and identify what's different — all while the customer is waiting.

## Target Searcher

| Role                            | Industry                | Searches for                                                       | Current tool                       |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| Quality Manager                 | Any manufacturing       | "customer complaint investigation," "quality complaint analysis"   | 8D reports, Excel filtering        |
| Quality Engineer                | Manufacturing, Food     | "root cause analysis customer complaint," "8D investigation tools" | Fishbone diagrams, 5-Why (no data) |
| Customer Quality Representative | Automotive, Electronics | "quality complaint response data," "corrective action analysis"    | Manual report writing              |

## Keyword Cluster

**Primary:**

- customer complaint investigation
- quality complaint analysis
- 8D investigation tools

**Long-tail:**

- how to investigate quality complaint with data
- customer complaint root cause analysis example
- what changed in production process
- before and after quality analysis
- complaint investigation SPC approach

**Related queries:**

- 8D problem solving tools
- corrective action analysis manufacturing
- process change detection SPC
- customer complaint response template
- variation analysis complaint period

## The VariScout Journey

1. **Filter production data to complaint period** — paste data, identify the suspect timeframe from customer complaint dates
2. **I-Chart** — over the full timeline: is there a visible shift or increase in variation during the complaint period? Nelson rules flag the change point
3. **Staged analysis: before / during / after** — quantify: "Mean shifted from 10.2 to 10.8 during the complaint period. Variation increased 40%."
4. **Boxplot by factor** — during the complaint period, what's different? Line, shift, operator, material lot. eta-squared identifies the dominant factor
5. **Drill-down** — "Material Lot 4872 explains 52% of the variation during the complaint period. This lot was received 2 weeks before the first complaint."
6. **Capability** — Cpk during complaint period vs baseline: 1.45 → 0.78. Visual evidence for the customer showing the process was capable before and is being corrected
7. **I-Chart post-correction** — after removing the suspect material lot: process returns to baseline. Corrective action validated.

**Aha moment:** "In 20 minutes we identified the specific material lot that caused the problem, quantified its impact, and showed the customer a before/during/after capability comparison. The 8D response that usually takes 2 weeks was done in an afternoon."

## Before / After

| Before VariScout                          | After VariScout                                         |
| ----------------------------------------- | ------------------------------------------------------- |
| "Something changed" — vague investigation | Specific lot + factor identified with eta-squared       |
| 2-week investigation cycle                | Same-day identification                                 |
| 8D report with fishbone and opinions      | 8D report with I-Chart, capability comparison, and data |
| Customer loses confidence                 | Customer sees quantified evidence and corrective action |
| No before/after validation                | Staged analysis proves correction worked                |

## Website Content Map

**Landing page:** `/solutions/complaint-investigation`

- Headline: "Customer complaint? Find the root cause in 20 minutes, not 2 weeks."
- Key message: Filter to complaint period, compare to baseline, identify the factor that changed — all with visual evidence
- Interactive demo: Production dataset spanning before/during/after complaint period

**Case study:** Manufacturing complaint — product inconsistency over 3 shipments

- Narrative: "The customer called on Monday. By Wednesday, we had the root cause, the corrective action, and the data to prove it."
- Staged analysis showing clear before/during/after comparison
- eta-squared identifying the material lot as the dominant factor

**Blog posts:**

- "8D Investigations with Data: From Fishbone to Facts in 20 Minutes" (methodology)
- "How to Use SPC for Customer Complaint Response" (educational)
- "Before/After Analysis: Proving Your Corrective Action Worked" (tool + methodology)

**Social:**

- LinkedIn: "Customer complaint investigation used to take 2 weeks and a fishbone diagram. Now it takes 20 minutes and actual data. Here's the approach." (methodology story)
- YouTube: "Customer Complaint Investigation with VariScout" — 5-minute walkthrough

## Platform Fit

| Stage                 | Product                 | Why                                                                     |
| --------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Urgent investigation  | **PWA** (free)          | Paste production data, filter to complaint period, find root cause fast |
| Systematic tracking   | **Excel Add-in** (free) | Connect to production quality spreadsheet, analyze by period            |
| Quality team workflow | **Azure App** (paid)    | Multiple QEs investigating, shared analysis, audit trail for 8D reports |
