# Supplier PPAP Capability Studies

## The Problem

A Supplier Quality Engineer at an automotive OEM or Tier 1 receives PPAP (Production Part Approval Process) submissions from suppliers. The supplier claims Cpk > 1.67 for critical characteristics, but are those numbers real? The SQE needs to verify independently — and quickly, because there are 15 suppliers and 200+ characteristics to review this quarter.

Currently, the SQE opens each supplier's Excel file, manually calculates Cpk in a separate spreadsheet, and spots-checks a few characteristics. Multi-characteristic parts (20+ dimensions) mean hours of work per submission. There's no way to see all characteristics ranked worst-first.

## Target Searcher

| Role                            | Industry               | Searches for                                                   | Current tool                           |
| ------------------------------- | ---------------------- | -------------------------------------------------------------- | -------------------------------------- |
| Supplier Quality Engineer (SQE) | Automotive OEM, Tier 1 | "PPAP capability study," "Cpk 1.67 verification"               | Excel, Minitab (if available)          |
| Quality Engineer                | Automotive, Aerospace  | "process capability analysis tool," "multi-characteristic Cpk" | Manual Excel calculations              |
| Supplier Development Engineer   | Manufacturing          | "supplier qualification capability," "PPAP data analysis"      | Supplier-provided reports (unverified) |

## Keyword Cluster

**Primary:**

- PPAP capability study
- Cpk 1.67 requirement
- process capability analysis tool
- supplier qualification Cpk

**Long-tail:**

- how to verify supplier Cpk data
- multi-characteristic capability analysis
- PPAP initial sample inspection report
- Cpk calculation for multiple dimensions
- supplier PPAP data analysis tool free

**Related queries:**

- AIAG PPAP requirements
- process capability index automotive
- Minitab Cpk analysis alternative
- capability study template
- supplier part approval process tools

## The VariScout Journey

1. **Paste supplier measurement data** — rows with Characteristic, Sample, Measurement (often 30+ samples per characteristic per PPAP requirement)
2. **I-Chart** — first check: is the data stable? A Cpk calculated on unstable data is meaningless. Nelson rules flag any instability
3. **Capability** — Cpk with histogram and spec limits overlaid. Immediate visual: is the distribution centered? How much margin to spec?
4. **Performance Mode** — all characteristics ranked by Cpk, worst first. Red/amber/green coding against 1.67 threshold
5. **Drill into worst characteristic** — Cpk = 0.98 (claimed 1.72 by supplier). I-Chart shows drift — supplier's data was cherry-picked from a good period
6. **Staged analysis** — if supplier claims improvement: before/after comparison validates (or disputes) the claim
7. **Gage R&R** — if measurements seem suspicious: is the measurement method consistent enough to distinguish good from bad?

**Aha moment:** "The supplier reported Cpk = 1.72. Our independent analysis shows 0.98 — and the process isn't even stable. They measured during a good run. Performance Mode flagged it in 10 seconds across 25 characteristics."

## Before / After

| Before VariScout                       | After VariScout                               |
| -------------------------------------- | --------------------------------------------- |
| Trust supplier-reported Cpk values     | Independent verification in seconds           |
| Check 3 of 25 characteristics manually | Performance Mode ranks all 25, worst first    |
| No stability check before capability   | I-Chart + Nelson rules verify stability first |
| Hours per PPAP review                  | Minutes per PPAP review                       |
| Binary pass/fail per characteristic    | Visual Cpk with histogram — see _how_ capable |

## Website Content Map

**Landing page:** `/solutions/ppap-capability`

- Headline: "Verify supplier capability in minutes, not hours."
- Key message: Paste PPAP data, see all characteristics ranked by Cpk. Worst first. Stability verified.
- Interactive demo: 25-characteristic PPAP dataset

**Case study:** Automotive PPAP submission — 25 critical characteristics, 30 samples each

- Narrative: "The supplier said Cpk = 1.72. We found 0.98."
- Show Performance Mode ranking across characteristics
- Demonstrate stability check catching cherry-picked data

**Blog posts:**

- "How to Verify Supplier Cpk Data Independently" (educational + tool)
- "Why Capability Without Stability Is Meaningless" (methodology)
- "PPAP Capability Analysis in 5 Minutes: A Step-by-Step Guide" (practical)

**Social:**

- LinkedIn: "We review 200+ PPAP characteristics per quarter. Here's how we cut review time from hours to minutes per submission." (efficiency story)
- YouTube: "PPAP Capability Review with VariScout" — 5-minute demo of multi-characteristic analysis

## Platform Fit

| Stage              | Product                 | Why                                                                    |
| ------------------ | ----------------------- | ---------------------------------------------------------------------- |
| Quick verification | **PWA** (free)          | Paste supplier data, verify Cpk for a few characteristics              |
| Full PPAP review   | **Excel Add-in** (free) | Connect to PPAP measurement spreadsheet, slicer by characteristic      |
| SQE team workflow  | **Azure App** (paid)    | Performance Mode across all characteristics, team sharing, audit trail |
