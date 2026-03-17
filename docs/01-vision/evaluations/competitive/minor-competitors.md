---
title: 'Minor Competitor Profiles'
---

# Minor Competitor Profiles

> Based on public documentation and published feature sets. These competitors appear in only 1–2 pattern evaluations and do not warrant full benchmark documents.

For full benchmarks of major competitors, see:

- [Minitab Benchmark](minitab-benchmark.md) (6 pattern mentions)
- [JMP Benchmark](jmp-benchmark.md) (6 pattern mentions)
- [Tableau Benchmark](tableau-benchmark.md) (6 pattern mentions)
- [Power BI Benchmark](powerbi-benchmark.md) (5 pattern mentions)
- [EDAScout Benchmark](edascout-benchmark.md) (7 pattern mentions, codebase-analyzed)

---

## SigmaXL

| Dimension           | SigmaXL                                       |
| ------------------- | --------------------------------------------- |
| **Platform**        | Excel add-in (Windows, macOS via Parallels)   |
| **Pricing**         | $299/year (single user)                       |
| **Distribution**    | Direct download                               |
| **Target audience** | Lean Six Sigma practitioners using Excel      |
| **Market position** | Budget alternative to Minitab for Excel users |

### Relevant Capabilities

SigmaXL operates entirely within Excel, adding statistical analysis capabilities through a ribbon menu. The relevant features for VariScout's pattern evaluations:

- **Multiple regression with stepwise selection**: Automated variable selection using forward, backward, or stepwise algorithms. The analyst selects response and candidate predictor columns; SigmaXL identifies the statistically significant subset. This requires understanding of regression assumptions and model diagnostics — it is a statistical tool for trained analysts, not a guided exploration feature.
- **Control charts**: Standard SPC chart types (I-MR, Xbar-R, P, C) rendered within Excel worksheets. Charts are static — they don't update when slicers change, and there is no linked filtering.
- **Capability analysis**: Cp, Cpk, Pp, Ppk with basic distribution fitting. Output is an Excel-formatted report.
- **ANOVA**: One-way and multi-way ANOVA with post-hoc tests. Output includes SS, MS, F, and p-values in tabular form.

### Pattern Relevance

SigmaXL appears in the [Auto-Combination Finder](../patterns/auto-combination-finder.md) evaluation only. Its stepwise regression provides automated factor selection but requires the analyst to configure the analysis, interpret model diagnostics, and make decisions about variable inclusion/exclusion. The approach is expert-driven model building, not automated investigation.

### Strategic Assessment

SigmaXL competes in the "statistical analysis within Excel" space. VariScout's Excel Add-in operates in the same environment but with a fundamentally different approach — VariScout provides visual, interactive SPC analysis while SigmaXL provides traditional statistical output in worksheet format. The overlap is minimal because the workflows are different: SigmaXL serves analysts who want Minitab-style statistics at a lower price; VariScout serves practitioners who want investigation-guided analysis without statistical expertise.

---

## Looker

| Dimension           | Looker                                                     |
| ------------------- | ---------------------------------------------------------- |
| **Platform**        | Cloud-based (Google Cloud)                                 |
| **Pricing**         | Custom enterprise pricing                                  |
| **Distribution**    | Google Cloud Marketplace, direct sales                     |
| **Target audience** | Data teams, enterprise analytics                           |
| **Market position** | Google's enterprise BI platform (embedded analytics focus) |

### Relevant Capabilities

Looker is Google's BI platform, focused on embedded analytics and governed data access through its LookML modeling language. The relevant feature for VariScout's pattern evaluations:

- **Filter bar pattern**: Looker dashboards use a filter bar at the top of the page with dropdowns for each filterable dimension. Filters are defined in LookML (the modeling language) and exposed to dashboard consumers. The interaction model is consistent with Tableau and Power BI — the analyst selects filter values from controls, and visuals update accordingly.
- **Cross-filtering**: Clicking a data element in one tile can filter other tiles on the dashboard. Similar in behavior to Tableau and Power BI cross-filtering.
- **Embedded analytics**: Looker's primary differentiator is embeddability — Looker dashboards are designed to be embedded in other applications. This is not relevant to VariScout's analysis workflow.

### Pattern Relevance

Looker appears in the [Sidebar Filter Panel](../patterns/sidebar-filter-panel.md) evaluation only. Its filter bar is the same paradigm as Tableau's sidebar filters and Power BI's slicers — always-visible filter controls that the analyst configures. The LookML-driven approach means filters are defined by data engineers rather than end users, which adds a governance layer but doesn't change the fundamental interaction pattern.

### Strategic Assessment

Looker competes in the enterprise BI space alongside Tableau and Power BI. For VariScout's competitive positioning, Looker represents a third data point confirming that the sidebar filter paradigm is the BI industry standard. VariScout's chart-integrated filtering is a deliberate departure from this standard, differentiated by being investigation-driven rather than configuration-driven. Looker has no SPC capabilities, no statistical analysis beyond basic aggregations, and no quality-specific workflow — the competitive overlap is limited to the general concept of filtered data visualization.
