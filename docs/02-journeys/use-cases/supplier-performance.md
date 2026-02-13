# Supplier Performance Comparison

## The Problem

A Supplier Quality Engineer manages 3-8 suppliers for the same part. Incoming inspection catches individual lot failures, but there's no systemic view — which supplier is actually capable? Which dimension is the weak point? Price negotiations and supplier development decisions are made on gut feel or recent memory rather than data.

The SQE has an Excel sheet with thousands of incoming inspection rows. They can filter by supplier and eyeball the numbers, but comparing suppliers across multiple dimensions simultaneously is manual and time-consuming. Minitab could do it, but the license sits with the quality lab — the SQE doesn't have access.

## Target Searcher

| Role                            | Industry                               | Searches for                                           | Current tool                        |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| Supplier Quality Engineer (SQE) | Manufacturing, Automotive, Electronics | "supplier quality comparison," "supplier Cpk analysis" | Excel pivot tables, manual reports  |
| Procurement / Sourcing Analyst  | Any manufacturing                      | "vendor rating system," "supplier performance metrics" | Scorecards, ERP reports             |
| Quality Manager                 | Manufacturing                          | "incoming inspection analysis," "supplier capability"  | Paper-based or spreadsheet tracking |

## Keyword Cluster

**Primary:**

- supplier quality analysis
- supplier performance comparison
- supplier Cpk comparison

**Long-tail:**

- how to compare supplier quality data
- supplier capability analysis example
- incoming inspection variation analysis
- supplier quality rating with data
- which supplier is best statistically

**Related queries:**

- Minitab supplier analysis alternative
- free supplier quality tool
- supplier quality dashboard
- vendor rating SPC
- incoming inspection trend analysis

## The VariScout Journey

1. **Paste incoming inspection data** — rows with Supplier, Dimension, Measurement, Lot, Date columns
2. **I-Chart** — see measurement stability over time across all suppliers mixed together (often looks chaotic)
3. **Boxplot by Supplier** — immediate visual: Supplier C has wider spread. eta-squared shows "Supplier explains 38% of variation"
4. **Drill-down: Supplier C** — filter to worst supplier, boxplot by Dimension reveals Dimension B is the problem (other dimensions are fine)
5. **Capability** — Cpk for each supplier-dimension combination. Supplier C Dimension B: Cpk = 0.62 (target: 1.33)
6. **Pareto** — 80% of rejects come from 2 of 5 suppliers
7. **Performance Mode** — if multiple dimensions: rank all supplier-dimension combinations by Cpk, worst first

**Aha moment:** "We thought Supplier C was 'about the same' as the others. Their average is fine — but their variation on Dimension B makes them incapable. We now have the data to drive a focused supplier development conversation."

## Before / After

| Before VariScout                     | After VariScout                                           |
| ------------------------------------ | --------------------------------------------------------- |
| "All suppliers meet spec on average" | Specific supplier + dimension failures identified         |
| Gut-feel supplier ratings            | eta-squared quantifies supplier contribution to variation |
| Reactive: catch bad lots             | Proactive: identify suppliers trending toward failure     |
| Negotiations lack data leverage      | Cpk evidence for supplier development conversations       |
| Hours building Excel pivot charts    | 30-second paste-and-analyze                               |

## Website Content Map

**Landing page:** `/solutions/supplier-quality`

- Headline: "Which supplier is really the problem? Find out in 30 seconds."
- Key message: Paste your incoming inspection data, see supplier capability ranked instantly
- Interactive demo with sample supplier comparison data

**Case study:** Incoming inspection dataset — 5 suppliers, 3 dimensions, 200 lots

- Walk through: average hides the problem → boxplot reveals → drill-down isolates
- Show eta-squared quantifying supplier contribution
- Performance Mode ranking across dimensions

**Blog posts:**

- "How to Compare Supplier Quality Beyond Pass/Fail" (educational)
- "Why Average Incoming Inspection Data Lies" (methodology — aggregation trap)
- "Supplier Cpk: The Number Your Procurement Team Needs" (tool + methodology)

**Social:**

- LinkedIn: "We analyzed 2 years of incoming inspection data in 30 seconds. Here's what we found hiding in the averages." (before/after visual)
- YouTube: 2-minute demo — paste supplier data, watch the story unfold

## Platform Fit

| Stage              | Product                 | Why                                                                                 |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------- |
| Discovery          | **PWA** (free)          | Paste sample data or own data, see supplier comparison instantly                    |
| Ongoing monitoring | **Excel Add-in** (free) | Connect to incoming inspection spreadsheet, live slicer-based filtering             |
| Team adoption      | **Azure App** (paid)    | Multiple SQEs sharing analysis, OneDrive sync, Performance Mode for multi-dimension |
