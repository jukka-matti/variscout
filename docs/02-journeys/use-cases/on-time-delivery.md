# On-Time Delivery Analysis

## The Problem

A Fleet Manager or Logistics Coordinator tracks On-Time Delivery (OTD) as a key metric — "92% on time this month." But the 8% late deliveries aren't random. Which carrier? Which route? Which product category? The monthly OTD percentage hides the structure, and the operations team can't target improvements because they don't know where the late deliveries concentrate.

Data is in the TMS or ERP — order dates, promised delivery dates, actual delivery dates, carrier, route, product type. Reports show a single OTD% number. Nobody asks "is our delivery process _capable_ of meeting the SLA?" — they just count late/on-time.

## Target Searcher

| Role                      | Industry                 | Searches for                                            | Current tool       |
| ------------------------- | ------------------------ | ------------------------------------------------------- | ------------------ |
| Fleet / Logistics Manager | Logistics, Distribution  | "on-time delivery analysis," "OTD improvement"          | TMS reports, Excel |
| Supply Chain Analyst      | Manufacturing, Retail    | "delivery performance by carrier," "shipping variation" | ERP dashboards     |
| Operations Manager        | E-commerce, Distribution | "delivery SLA analysis," "OTIF improvement"             | Weekly KPI reports |

## Keyword Cluster

**Primary:**

- on-time delivery analysis
- OTD improvement methods
- delivery performance by carrier

**Long-tail:**

- how to analyze delivery performance data
- on-time delivery variation by route
- delivery SLA capability analysis
- which carrier is causing late deliveries
- OTIF analysis by product and route

**Related queries:**

- supply chain reliability metrics
- logistics performance analysis tool
- delivery time SPC
- carrier performance comparison
- logistics Cpk (novel angle)

## The VariScout Journey

1. **Paste delivery data** — rows with Carrier, Route, Product Category, Weight Class, Promised Date, Actual Date, Lead Time Days columns
2. **I-Chart** — lead time over time shows stability (or lack thereof). Nelson rules catch recent deterioration
3. **Boxplot by Carrier** — Carrier B has 3x the spread of Carrier A. eta-squared: "Carrier explains 29% of lead time variation"
4. **Drill-down: Carrier B** — boxplot by Route. Rural routes show massive variation; urban routes are fine
5. **Drill-down: Carrier B + Rural** — boxplot by Weight Class. Heavy products on rural routes = late deliveries
6. **Capability vs SLA** — against "deliver within 3 days" target: overall Cpk = 0.8, Carrier A Cpk = 1.5, Carrier B Rural Heavy = Cpk 0.2
7. **Pareto** — late deliveries by combination: Carrier B + Rural + Heavy = 72% of all late deliveries

**Aha moment:** "Our OTD was 92% overall. The drill-down showed Carrier B is fine for urban small packages but can't handle heavy rural deliveries — that one combination accounts for 72% of our late deliveries. We rerouted heavy rural orders to Carrier C and OTD jumped to 97%."

## Before / After

| Before VariScout                             | After VariScout                                               |
| -------------------------------------------- | ------------------------------------------------------------- |
| "OTD is 92% — needs improvement"             | Carrier B + Rural + Heavy = 72% of late deliveries            |
| All carriers treated the same                | Carrier-specific routing based on capability data             |
| SLA measured as pass/fail percentage         | Capability analysis: Cpk against SLA per carrier/route        |
| Improvement efforts spread across all routes | Focused on the specific carrier + route + product combination |
| No quantification of carrier impact          | eta-squared: "Carrier explains 29% of lead time variation"    |

## Website Content Map

**Landing page:** `/solutions/delivery-performance`

- Headline: "Your OTD is 92%. But 72% of late deliveries come from one combination. Find it."
- Key message: Drill-down from overall OTD to carrier + route + product reveals where to focus
- Interactive demo: Delivery dataset with carrier, route, and product factors

**Case study:** Logistics company — 3 carriers, 4 routes, 3 weight classes, 6 months of deliveries

- Narrative: "We rerouted one product category and OTD jumped from 92% to 97%."
- Capability vs SLA analysis — novel "logistics Cpk" angle
- Pareto showing concentration of late deliveries

**Blog posts:**

- "On-Time Delivery Analysis: Beyond the Percentage" (methodology)
- "Logistics Cpk: Applying Process Capability to Delivery SLAs" (novel methodology)
- "Which Carrier Is Really the Problem? A Data-Driven Approach" (practical)

**Social:**

- LinkedIn: "OTD was 92%. We found that 72% of late deliveries were one carrier + one route + one product type. One routing change: 97%. Here's the analysis that found it." (before/after)
- YouTube: "On-Time Delivery Drill-Down" — 4-minute demo with VariScout

## Platform Fit

| Stage              | Product                 | Why                                                                 |
| ------------------ | ----------------------- | ------------------------------------------------------------------- |
| Investigation      | **PWA** (free)          | Paste TMS export, find the late delivery pattern                    |
| Ongoing monitoring | **Excel Add-in** (free) | Connect to delivery data spreadsheet, slicer by carrier/route       |
| Logistics team     | **Azure App** (paid)    | Multiple analysts, Performance Mode across carriers, trend tracking |
