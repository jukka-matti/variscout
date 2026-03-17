---
title: 'Tableau Competitive Benchmark'
---

# Tableau Competitive Benchmark

> Based on public documentation, published feature sets, and market positioning knowledge. Unlike the [EDAScout Benchmark](edascout-benchmark.md), this assessment does not include direct codebase analysis.

---

## Product Profile

| Dimension           | Tableau                                                                       | VariScout                                               |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Platform**        | Desktop (authoring) + Server/Cloud (viewing)                                  | Browser-based (PWA, Azure, Excel Add-in)                |
| **Pricing**         | $75/user/month (Creator), $42/user/month (Explorer), $15/user/month (Viewer)  | From €99/month (Azure) or free (PWA)                    |
| **Distribution**    | Salesforce direct sales, cloud and on-premise                                 | Azure Marketplace, AppSource, public URL                |
| **Target audience** | Business analysts, data teams, executives                                     | Quality practitioners, Green Belts, learners            |
| **Market position** | Dominant BI and visual analytics platform                                     | Specialized variation analysis tool                     |
| **Analysis model**  | Dashboard-centric: drag fields onto shelves, build views, assemble dashboards | Four Lenses: 4 coordinated charts with linked filtering |
| **Navigation**      | Sidebar filters, cross-filtering between sheets                               | Progressive stratification drill-down                   |
| **Parent company**  | Salesforce                                                                    | Independent                                             |

---

## Core Capabilities

Tableau is the industry-defining visual analytics platform. It excels at making data accessible through interactive visualizations and dashboards. Its relevance to VariScout is primarily as the tool that defines the "sidebar filter" paradigm that VariScout explicitly rejects.

### Visual Analytics Engine

Tableau's VizQL engine automatically determines appropriate chart types based on the data types placed on rows, columns, and marks shelves. The analyst builds views by dragging fields — similar in spirit to JMP's Graph Builder but optimized for business data rather than statistical analysis. The visual grammar is expressive: small multiples, stacked bars, scatterplots, maps, and treemaps are all achievable through shelf configuration.

### Sidebar Filters

Tableau's filter panel is the paradigm for dashboard filtering. Filters appear as sidebar controls — dropdowns, checkboxes, sliders, date ranges — alongside the visualization area. Each filter operates on a dimension or measure. Filters can be configured as single-select, multi-select, or range. Quick filters provide immediate visual feedback as selections change.

Cross-filtering between sheets on a dashboard allows clicking a data point in one chart to filter all other charts. This is the closest Tableau comes to VariScout's linked filtering, though the mechanism is fundamentally different: Tableau cross-filtering is a dashboard configuration feature, not an investigation methodology.

### Small Multiples

Tableau natively supports small multiples through the rows and columns shelves. Dragging a dimension to the rows shelf creates a grid of charts — one per dimension value. The implementation is flexible: any chart type can be faceted across any dimension. This is one of Tableau's strongest features for comparison-based analysis.

### Calculated Fields and LOD Expressions

Tableau's calculated field language supports aggregation, string manipulation, date operations, and table calculations. Level of Detail (LOD) expressions allow calculations at different granularities than the visualization's default. However, statistical calculations beyond basic aggregations (mean, median, count, percentile) require LOD expertise. There is no built-in ANOVA, regression, or capability analysis.

### Dashboard Assembly

Tableau's primary output is the dashboard: a canvas combining multiple visualization sheets, filter controls, text, and images. Dashboards are designed for consumption — built by analysts, viewed by stakeholders. The authoring/viewing split maps to the Creator/Explorer/Viewer pricing tiers.

### Tableau Prep

Data preparation tool for cleaning, reshaping, and joining data before analysis. Relevant to quality data workflows where raw measurement data needs structuring. This is a separate product from the analytics platform.

---

## Analysis and Investigation Workflow

Tableau's workflow is **build-then-view**:

1. The analyst (Creator) connects to data sources
2. They build individual visualization sheets by dragging fields onto shelves
3. They assemble sheets into dashboards with filter controls
4. They publish dashboards for Explorers and Viewers to consume
5. Consumers interact through the pre-configured filters and cross-filtering

For variation investigation, a Tableau user would:

1. Build a bar chart showing a measurement across factors (machines, shifts, etc.)
2. Add reference lines for specification limits (manual configuration)
3. Create additional sheets for different views of the same data
4. Assemble a dashboard with filter controls for each factor
5. Use the dashboard interactively, applying filters to see subsets

The critical gap: Tableau cannot calculate control limits, capability indices, ANOVA, or any SPC-specific statistics. The analyst must calculate these externally (in Excel or R/Python) and import the results, or use basic aggregations (mean, standard deviation) as approximations. There are no Nelson rules, no Western Electric rules, no statistical process control logic.

The filter interaction model is fundamentally different from VariScout's progressive stratification. Tableau filters are configuration controls — the analyst checks boxes and selects values. VariScout's drill-down is an investigation action — the analyst clicks where they see variation, and the click carries analytical meaning (filtering by the source of variation).

---

## How Tableau Addresses Our 6 Tensions

| Tension                  | Tableau's Approach                                                                                                                                                                                            | Assessment                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Hierarchy Assumption** | No interaction detection. Calculated fields can approximate interaction effects through LOD expressions, but this requires advanced Tableau expertise and isn't part of any standard workflow.                | Not addressed.                                                                                                   |
| **Discoverability**      | Sidebar filters make all filter options permanently visible. Cross-filtering between charts provides visual feedback. This is the strongest discoverability model in BI tools — everything is always visible. | Fully addressed for filter discoverability; not addressed for analytical discoverability (which factors matter). |
| **Factor Ordering**      | No concept of factor ranking by contribution. All filters are presented equally. The analyst must bring their own domain knowledge to decide which factors to examine.                                        | Not addressed.                                                                                                   |
| **When to Stop**         | No stopping guidance. Dashboards are open-ended exploration tools with no concept of investigation completeness.                                                                                              | Not addressed.                                                                                                   |
| **Mobile Screen Budget** | Tableau Mobile adapts dashboards to smaller screens. Device-specific layouts can be designed. But sidebar filters consume significant screen real estate on mobile, requiring a collapsible filter pane.      | Partially addressed through device layouts; filter space remains problematic.                                    |
| **Path Dependency**      | No drill-down path exists. Filters are stateless configurations — applying Machine=A then Shift=Night produces the same result as Shift=Night then Machine=A.                                                 | Not applicable — no sequential drill-down model.                                                                 |

---

## Feature Comparison

| Capability                          | Tableau                                        | VariScout                                                                |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| Visual analytics (general)          | Industry-leading breadth and polish            | Focused on SPC/quality domain                                            |
| Control charts (I-MR)               | Not available natively                         | Yes (I-Chart)                                                            |
| Capability analysis (Cp/Cpk)        | Not available                                  | Yes, integrated                                                          |
| Boxplot                             | Available as chart type                        | Integrated with drill-down filtering                                     |
| Pareto chart                        | Available (sorted bar chart)                   | Integrated with drill-down filtering                                     |
| ANOVA                               | Not available                                  | Yes, with eta-squared ranking                                            |
| Regression                          | Trend line only (no model diagnostics)         | Simple and multiple regression                                           |
| Gage R&R                            | Not available                                  | Not available                                                            |
| Small multiples                     | Native (rows/columns shelf)                    | Planned feature                                                          |
| Sidebar filters                     | Core paradigm (checkboxes, sliders, dropdowns) | Rejected pattern (see [evaluation](../patterns/sidebar-filter-panel.md)) |
| Cross-filtering                     | Yes (dashboard-level action)                   | Yes (linked filtering, investigation-driven)                             |
| Linked filtering across chart types | Dashboard actions (configurable)               | Native (core differentiator)                                             |
| Statistical calculations            | Basic aggregations only                        | SPC-specific (Cpk, ANOVA, eta-squared)                                   |
| Nelson rules / run tests            | Not available                                  | Yes                                                                      |
| Dashboard publishing                | Yes (Server/Cloud)                             | Not applicable (analysis tool, not BI)                                   |
| Browser-based analysis              | Viewer/Explorer roles (view and filter only)   | Full analysis capability                                                 |
| Price for individual analyst        | $75/month (Creator)                            | Free (PWA) or from €99/month (Azure)                                     |

---

## Strategic Implications for VariScout

### Where We Differentiate

- **Statistical depth**: Tableau has no SPC capabilities. No control charts, no capability analysis, no ANOVA, no process-specific statistics. This is the most fundamental differentiation — VariScout solves a problem Tableau cannot address.
- **Investigation vs. dashboard**: Tableau builds dashboards for known questions. VariScout guides investigations for unknown causes. The cognitive model is fundamentally different — configuration vs. investigation.
- **Variation quantification**: Tableau can show data by factor but cannot quantify how much each factor contributes to variation. Eta-squared ranking and cumulative variation tracking are capabilities that BI tools lack entirely.
- **Methodology embedding**: VariScout's progressive stratification is an investigation methodology built into the interaction design. Tableau provides flexible tools; the methodology is the analyst's responsibility.

### What We Can Learn

- **Cross-filtering polish**: Tableau's cross-filtering between dashboard sheets is smooth and well-understood by users. VariScout's linked filtering should aspire to the same responsiveness and visual feedback quality.
- **Small multiples implementation**: Tableau's native small multiples through the rows/columns shelf is the benchmark for how this pattern should work. When VariScout implements small multiples, Tableau's interaction model is the reference.
- **Device-responsive layouts**: Tableau's approach to device-specific dashboard layouts demonstrates how to handle the mobile screen budget for complex analytical interfaces.

### What to Avoid Adopting

- **Sidebar filter paradigm**: This is the central point. Tableau's sidebar filters solve discoverability by making everything visible, but they convert analysis into configuration. VariScout's chart-integrated filtering is a deliberate differentiation from this paradigm. See the [Sidebar Filter Panel evaluation](../patterns/sidebar-filter-panel.md).
- **Build-then-view separation**: Tableau's Creator/Viewer split is a BI paradigm where analysts build and stakeholders consume. VariScout treats everyone as an investigator — the same person who sees the data also drills into it.
- **Breadth over depth**: Tableau's strength is generality — it works with any data for any question. VariScout's strength is specificity — it's designed for variation investigation in quality processes. Generalizing toward a BI tool would lose the domain advantage.
