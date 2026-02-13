# COPQ Drill-Down

## The Problem

A Continuous Improvement or OpEx Manager knows the Cost of Poor Quality is too high — scrap, rework, warranty claims, downtime. The total number is reported monthly, but it's spread across products, lines, defect types, and shifts. Where should the next improvement project focus? Leadership wants a business case with specific targets, not "we'll work on quality."

The data exists in the ERP or quality system, but it's summarized in monthly reports — total scrap cost by department. Nobody drills into the interaction effects: which _specific combination_ of product + line + shift + defect type drives the most cost?

## Target Searcher

| Role              | Industry          | Searches for                                                   | Current tool                       |
| ----------------- | ----------------- | -------------------------------------------------------------- | ---------------------------------- |
| CI / OpEx Manager | Any manufacturing | "cost of poor quality analysis," "COPQ reduction"              | ERP reports, Excel pivot tables    |
| Quality Manager   | Manufacturing     | "scrap analysis by factor," "defect Pareto analysis"           | Monthly quality reports            |
| Plant Manager     | Manufacturing     | "where to focus improvement project," "quality cost breakdown" | Management dashboards (aggregated) |

## Keyword Cluster

**Primary:**

- cost of poor quality analysis
- COPQ reduction tools
- scrap analysis by factor

**Long-tail:**

- how to prioritize quality improvement projects
- Pareto analysis defect cost example
- scrap cost breakdown by product and line
- COPQ drill-down methodology
- where to focus improvement efforts with data

**Related queries:**

- Pareto chart cost of quality
- defect analysis manufacturing
- quality cost categories analysis
- Six Sigma project selection tool
- cost of poor quality is 20% of revenue

## The VariScout Journey

1. **Paste COPQ data** — rows with Product, Line, Shift, Defect Type, Cost (or defect count) columns
2. **Pareto** — rank defect types by cost. "Dimensional out-of-spec" = 42% of total COPQ. Clear starting point
3. **Boxplot by Line** — for the top defect type: which line contributes most? eta-squared: "Line explains 35% of variation in this defect"
4. **Drill-down: Line 2** — filter to worst line, boxplot by Shift. Night shift has 2.5x the defect rate
5. **Drill-down: Line 2 + Night shift** — boxplot by Product. Product X dominates
6. **I-Chart** — over time: did this start recently (assignable cause) or is it chronic?
7. **Staged analysis** — if a change was made: before/after validates improvement

**The Pareto path:** Total COPQ ($2.4M) → Dimensional OOS ($1.0M, 42%) → Line 2 ($580K, 58% of that) → Night shift ($380K, 66% of that) → Product X ($290K, 76% of that). Improvement project target: $290K annually from one specific combination.

**Aha moment:** "Our total COPQ is $2.4M/year and it felt overwhelming. 30 seconds of drill-down showed us that one product on one line on one shift accounts for $290K. That's a focused improvement project with a clear business case."

## Before / After

| Before VariScout                               | After VariScout                                           |
| ---------------------------------------------- | --------------------------------------------------------- |
| "COPQ is $2.4M — where do we start?"           | "Product X + Line 2 + Night shift = $290K target"         |
| Improvement project based on loudest complaint | Data-driven project selection with specific dollar impact |
| Monthly summary reports hide the structure     | Pareto → Boxplot → Drill-down reveals the path            |
| No quantification of factor contribution       | eta-squared: "Line explains 35% of this defect type"      |
| Weeks to build analysis for management review  | 30-second analysis with visual evidence for business case |

## Website Content Map

**Landing page:** `/solutions/copq-analysis`

- Headline: "Your COPQ is $2.4M. In 30 seconds, we'll show you where $290K of it comes from."
- Key message: Drill-down from total cost to specific product + line + shift combination
- Interactive demo: COPQ dataset with multi-level drill-down

**Case study:** Manufacturing COPQ dataset — 5 products, 3 lines, 3 shifts, 8 defect types, 12 months

- Walk through the Pareto cascade: total → defect → line → shift → product
- Show dollar values narrowing at each level
- Business case format: "This improvement project targets $290K/year"

**Blog posts:**

- "COPQ Is 20% of Revenue. Here's How to Find the 20% of COPQ That Matters." (methodology)
- "From $2.4M to $290K: A COPQ Drill-Down Example" (case study format)
- "Pareto Analysis Isn't Enough — You Need the Second Drill-Down" (advanced)

**Social:**

- LinkedIn: "Every manufacturer knows COPQ is too high. Few know exactly where it comes from. Here's a 30-second analysis that finds the needle in the haystack." (visual cascade)
- YouTube: "COPQ Drill-Down: Finding $290K in 30 Seconds" — step-by-step demo

## Platform Fit

| Stage              | Product                 | Why                                                                         |
| ------------------ | ----------------------- | --------------------------------------------------------------------------- |
| Project selection  | **PWA** (free)          | Paste COPQ data, find the biggest opportunity in minutes                    |
| Ongoing tracking   | **Excel Add-in** (free) | Connect to quality cost spreadsheet, slicer by period/product/line          |
| OpEx team workflow | **Azure App** (paid)    | Multiple analysts, Performance Mode across cost categories, shared analysis |
