# Lead Time Variation Analysis

## The Problem

A Supply Chain or Procurement Analyst reports "average lead time: 5 days" to the planning team. Production schedules around it. But actual lead times range from 2 to 14 days, and nobody knows which suppliers, routes, or order sizes drive the unpredictability. Safety stock is set high to compensate — tying up capital. Late deliveries still happen because the average hides the tail.

The data is in the ERP — purchase orders with order date, promised date, received date, supplier, item category, order quantity. Reports show average lead time by supplier. Nobody asks "what's the _variation_ in lead time, and what drives it?"

## Target Searcher

| Role                 | Industry              | Searches for                                                    | Current tool                       |
| -------------------- | --------------------- | --------------------------------------------------------------- | ---------------------------------- |
| Supply Chain Analyst | Manufacturing, Retail | "lead time variation analysis," "supplier lead time comparison" | ERP reports, Excel pivot tables    |
| Procurement Manager  | Any                   | "lead time reliability by supplier," "lead time reduction"      | Supplier scorecards                |
| Production Planner   | Manufacturing         | "lead time unpredictability," "safety stock optimization"       | MRP system, average-based planning |

## Keyword Cluster

**Primary:**

- lead time variation analysis
- supplier lead time comparison
- lead time reliability

**Long-tail:**

- how to analyze lead time variation by supplier
- why lead times are unpredictable
- lead time analysis for safety stock
- supplier reliability beyond average lead time
- purchase order lead time SPC

**Related queries:**

- supply chain variation analysis
- supplier delivery reliability metrics
- lead time distribution analysis
- safety stock vs lead time variation
- procurement analytics tools

## The VariScout Journey

1. **Paste PO data** — rows with Supplier, Item Category, Order Quantity, Order Date, Received Date, Lead Time Days columns
2. **I-Chart** — lead time over time shows instability — periods of short and long lead times with no obvious calendar pattern
3. **Boxplot by Supplier** — Supplier X has 3x the variation of Supplier Y despite similar averages. eta-squared: "Supplier explains 26% of lead time variation"
4. **Drill-down: Supplier X** — boxplot by Order Size (small/medium/large). Large orders have dramatically longer and more variable lead times
5. **Drill-down: Supplier X + Large orders** — boxplot by Item Category. Category A is fine; Category B lead times range from 5 to 18 days
6. **Capability** — against "within 7 days" SLA: Supplier Y Cpk = 1.3, Supplier X overall = 0.7, Supplier X Large Category B = 0.1
7. **Staged analysis** — before/after a recent contract renegotiation: did it actually improve lead time reliability?

**Aha moment:** "Supplier X's average lead time of 5.2 days looked almost identical to Supplier Y's 4.8 days. But Supplier X's large orders for Category B items range from 5-18 days — completely unpredictable. That's what's forcing our safety stock up and causing stockouts. The average told us they were 'about the same.' The variation tells a completely different story."

## Before / After

| Before VariScout                               | After VariScout                                            |
| ---------------------------------------------- | ---------------------------------------------------------- |
| "Average lead time: 5 days" for all suppliers  | Supplier X large Category B = 5-18 days (unpredictable)    |
| Safety stock based on average + buffer         | Safety stock based on actual variation by supplier/item    |
| Supplier X "about the same" as Supplier Y      | Supplier X incapable for large orders (Cpk = 0.1 vs SLA)   |
| Planning disrupted by "unexpected" late orders | Specific supplier + size + category combination identified |
| No before/after for contract changes           | Staged analysis validates whether improvements are real    |

## Website Content Map

**Landing page:** `/solutions/lead-time-analysis`

- Headline: "Average lead time: 5 days. Actual range: 2 to 14 days. Find out what drives the spread."
- Key message: Variation analysis reveals which suppliers are reliable and which are predictable only on average
- Interactive demo: Purchase order dataset with supplier, order size, and item category

**Case study:** Supply chain data — 5 suppliers, 3 order size classes, 4 item categories, 12 months

- Narrative: "Two suppliers had the same average lead time. One was reliable. One was chaos."
- Capability against SLA per supplier/combination
- Safety stock implications of addressing the variation

**Blog posts:**

- "Lead Time Variation: Why Average Lead Time Is a Dangerous Metric" (methodology)
- "Supplier Lead Time Reliability: Beyond Average to Capability" (educational + tool)
- "How Lead Time Variation Drives Safety Stock — and How to Fix It" (practical)

**Social:**

- LinkedIn: "Two suppliers, same average lead time. One delivers in 4-6 days. The other: 2-14 days. Guess which one's costing you in safety stock? Here's the analysis that reveals the truth." (data story)
- YouTube: "Lead Time Variation Analysis" — 4-minute demo with VariScout

## Platform Fit

| Stage              | Product                 | Why                                                                  |
| ------------------ | ----------------------- | -------------------------------------------------------------------- |
| One-off analysis   | **PWA** (free)          | Paste PO data, find the variation sources                            |
| Ongoing monitoring | **Excel Add-in** (free) | Connect to ERP export, slicer by supplier/category/size              |
| Supply chain team  | **Azure App** (paid)    | Multiple analysts, Performance Mode across suppliers, trend tracking |
