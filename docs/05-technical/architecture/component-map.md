---
title: Component Map
description: L3 component views per package — internal modules and their responsibilities
journey-phase: [all]
---

# Component Map

<!-- journey-phase: [all] -->

L3 component decomposition for each VariScout package. These diagrams are manually maintained Mermaid translations of the canonical architecture model in [`docs/architecture/likec4/`](../../architecture/likec4/).

## Package Overview

All packages and their internal module counts at a glance.

```mermaid
flowchart LR
    subgraph core["@variscout/core (9 modules)"]
        direction TB
        c1["Statistics Engine"]
        c2["CSV/Excel Parser"]
        c3["Tier System"]
        c4["Navigation"]
        c5["Types"]
        c6["Variation Analysis"]
        c7["Glossary"]
        c8["Export"]
        c9["Utilities"]
    end

    subgraph charts["@variscout/charts (14 components)"]
        direction TB
        ch1["6 Standard Charts"]
        ch2["4 Performance Charts"]
        ch3["4 Supporting"]
    end

    subgraph hooks["@variscout/hooks (13 hooks)"]
        direction TB
        h1["2 State"]
        h2["2 Navigation"]
        h3["6 Chart Data"]
        h4["1 Export"]
        h5["3 Tracking"]
    end

    subgraph ui["@variscout/ui (52 components)"]
        direction TB
        u1["10 Input"]
        u2["4 Data Display"]
        u3["8 Analysis"]
        u4["6 Chart Wrappers"]
        u5["4 Navigation"]
        u6["8 Findings"]
        u7["2 Simulation"]
        u8["5 Dashboard"]
        u9["3 Utilities"]
    end

    subgraph data["@variscout/data (4 datasets)"]
        direction TB
        d1["coffee"]
        d2["journey"]
        d3["bottleneck"]
        d4["sachets"]
    end

    charts --> core
    hooks --> core
    ui --> core
    ui --> hooks
    ui --> charts
```

---

## @variscout/core

Pure TypeScript — zero React dependencies. The foundation layer that all other packages depend on.

```mermaid
flowchart TB
    subgraph core["@variscout/core"]
        stats["Statistics Engine<br/><small>stats.ts</small><br/><small>calculateStats, mean, stddev,<br/>Cp, Cpk, ANOVA, Nelson rules</small>"]
        parser["CSV/Excel Parser<br/><small>parser.ts</small><br/><small>parseCSV, parseExcel,<br/>detectColumns, keyword detection</small>"]
        tier["Tier System<br/><small>tier.ts</small><br/><small>getTier, isPaidTier,<br/>channel limits, plan gating</small>"]
        nav["Navigation<br/><small>navigation.ts</small><br/><small>drill path, filter types,<br/>breadcrumb state</small>"]
        types["Types<br/><small>types.ts</small><br/><small>StatsResult, DataRow,<br/>Finding, AnalysisState</small>"]
        variation["Variation Analysis<br/><small>variation/</small><br/><small>contributions, simulation,<br/>decomposition, Total SS</small>"]
        glossary["Glossary<br/><small>glossary/</small><br/><small>terms, types,<br/>concept definitions</small>"]
        export["Export<br/><small>export/</small><br/><small>CSV export,<br/>chart data formatting</small>"]
        utils["Utilities<br/><small>utils/</small><br/><small>EXIF stripping,<br/>data transforms</small>"]
    end

    stats --> types
    parser --> types
    variation --> stats
    variation --> types
    export --> types
    glossary --> types
    nav --> types
    tier --> types
```

**Key dependency rule:** `types.ts` is the shared foundation. Statistics and variation analysis are the most complex modules; everything else is relatively independent.

---

## @variscout/charts

React + Visx chart components. Every chart exports both a responsive wrapper (uses `withParentSize`) and a `*Base` variant for explicit sizing.

```mermaid
flowchart TB
    subgraph standard["Standard Charts"]
        ichart["IChart<br/><small>Individual control chart<br/>UCL/LCL, Nelson violations</small>"]
        boxplot["Boxplot<br/><small>Category boxplot<br/>violin mode, sorting, annotations</small>"]
        pareto["ParetoChart<br/><small>Pareto ranking<br/>cumulative line, annotations</small>"]
        capability["CapabilityHistogram<br/><small>Process capability<br/>normal curve overlay</small>"]
        probability["ProbabilityPlot<br/><small>Normal probability<br/>distribution assessment</small>"]
        scatter["ScatterPlot<br/><small>X-Y scatter<br/>trend line</small>"]
    end

    subgraph performance["Performance Charts (multi-measure)"]
        perf_ichart["PerformanceIChart<br/><small>Cpk scatter by channel</small>"]
        perf_boxplot["PerformanceBoxplot<br/><small>Distribution comparison<br/>max 5 channels</small>"]
        perf_pareto["PerformancePareto<br/><small>Cpk ranking<br/>max 20 channels</small>"]
        perf_capability["PerformanceCapability<br/><small>Single channel histogram</small>"]
    end

    subgraph supporting["Supporting Components"]
        stats_table["BoxplotStatsTable<br/><small>Summary statistics table</small>"]
        legend["ChartLegend"]
        signature["ChartSignature<br/><small>Branding for exports</small>"]
        sourcebar["ChartSourceBar<br/><small>Footer branding (free tier)</small>"]
    end

    subgraph deps["@variscout/core"]
        core_stats["Statistics Engine"]
        core_types["Types"]
    end

    standard --> core_types
    standard --> core_stats
    performance --> core_types
    performance --> core_stats
    supporting --> core_types
```

---

## @variscout/hooks

Shared React hooks organized by concern. Depends on `@variscout/core` for types, statistics utilities, and tier logic.

```mermaid
flowchart TB
    subgraph state["State Hooks"]
        datastate["useDataState<br/><small>Shared DataContext<br/>state management</small>"]
        usetier["useTier<br/><small>License tier state<br/>and limits</small>"]
    end

    subgraph navigation["Navigation Hooks"]
        filternav["useFilterNavigation<br/><small>Multi-select filters<br/>breadcrumbs, drill trail</small>"]
        keyboard["useKeyboardNavigation<br/><small>Arrow key focus<br/>management</small>"]
    end

    subgraph chartdata["Chart Data Hooks"]
        chartscale["useChartScale<br/><small>Y-axis scale calculation</small>"]
        boxplotdata["useBoxplotData<br/><small>d3 boxplot computation</small>"]
        ichartdata["useIChartData<br/><small>I-Chart data transform</small>"]
        margins["useResponsiveChartMargins<br/><small>Dynamic margins</small>"]
        paretodata["useParetoChartData<br/><small>Pareto data prep</small>"]
        dashdata["useDashboardComputedData<br/><small>Dashboard stats</small>"]
    end

    subgraph exporthooks["Export Hooks"]
        chartcopy["useChartCopy<br/><small>Clipboard, PNG, SVG</small>"]
    end

    subgraph tracking["Tracking Hooks"]
        vartrack["useVariationTracking<br/><small>Cumulative Total SS<br/>scope tracking</small>"]
        annotation["useAnnotationMode<br/><small>Chart annotation state</small>"]
        violations["useControlViolations<br/><small>Control chart violation<br/>detection</small>"]
    end

    subgraph deps["@variscout/core"]
        core_types["Types"]
        core_stats["Statistics Engine"]
        core_tier["Tier System"]
    end

    state --> core_types
    state --> core_tier
    navigation --> core_types
    chartdata --> core_types
    chartdata --> core_stats
    tracking --> core_types
    tracking --> core_stats
```

---

## @variscout/ui

52 shared UI components across 9 categories. Uses the `colorScheme` pattern with `defaultScheme` semantic tokens. Depends on core, hooks, and charts.

```mermaid
flowchart TB
    subgraph input["Input (10)"]
        columnmapping["ColumnMapping"]
        createfactor["CreateFactorModal"]
        measuresel["MeasureColumnSelector"]
        chartype["CharacteristicTypeSelector"]
        manualentry["ManualEntryBase"]
        manualsetup["ManualEntrySetupBase"]
        slider["Slider"]
        speceditor["SpecEditor"]
        specspopover["SpecsPopover"]
        pastescreen["PasteScreenBase"]
    end

    subgraph datadisplay["Data Display (4)"]
        dataquality["DataQualityBanner"]
        datatable["DataTableBase"]
        perfdetected["PerformanceDetectedModal"]
        mobilesheet["MobileCategorySheet"]
    end

    subgraph analysis["Analysis (8)"]
        anova["AnovaResults"]
        statspanel["StatsPanelBase"]
        variationbar["VariationBar"]
        yaxispopover["YAxisPopover"]
        axiseditor["AxisEditor"]
        factorsel["FactorSelector"]
        investprompt["InvestigationPrompt"]
        boxplottoggle["BoxplotDisplayToggle"]
    end

    subgraph chartwrappers["Chart Wrappers (6)"]
        annotationlayer["ChartAnnotationLayer"]
        annotationmenu["AnnotationContextMenu"]
        chartcard["ChartCard"]
        downloadmenu["ChartDownloadMenu"]
        edittitle["EditableChartTitle"]
        focusedview["FocusedChartViewBase"]
    end

    subgraph navcomps["Navigation (4)"]
        breadcrumb["FilterBreadcrumb"]
        chipdropdown["FilterChipDropdown"]
        contextbar["FilterContextBar"]
        selectionpanel["SelectionPanel"]
    end

    subgraph findings["Findings (8)"]
        findingslog["FindingsLog"]
        findingcard["FindingCard"]
        findingeditor["FindingEditor"]
        findingstatus["FindingStatusBadge"]
        findingcomments["FindingComments"]
        findingboard["FindingBoardView"]
        findingspanel["FindingsPanel"]
        findingswindow["FindingsWindow"]
    end

    subgraph simulation["Simulation (2)"]
        whatif["WhatIfSimulator"]
        whatifpage["WhatIfPageBase"]
    end

    subgraph dashboard["Dashboard (5)"]
        dashgrid["DashboardGrid"]
        dashcard["DashboardChartCard"]
        focusedcard["FocusedChartCard"]
        focusedoverlay["FocusedViewOverlay"]
        settingspanel["SettingsPanelBase"]
    end

    subgraph utilities["Utilities (3)"]
        helptooltip["HelpTooltip"]
        upgradeprompt["UpgradePrompt"]
        errorboundary["ErrorBoundary"]
    end
```

### UI dependency flow

The UI package composes all three lower-level packages:

```mermaid
flowchart LR
    ui["@variscout/ui<br/>(52 components)"]
    core["@variscout/core<br/>types, tier"]
    hooks["@variscout/hooks<br/>state, navigation, data"]
    charts["@variscout/charts<br/>chart components"]

    ui --> core
    ui --> hooks
    ui --> charts
```

---

## @variscout/data

Pre-computed sample datasets. No internal package dependencies — pure TypeScript data files consumed by apps and website.

```mermaid
flowchart TB
    subgraph data["@variscout/data"]
        coffee["coffeeSample<br/><small>Extraction temperature<br/>multi-factor</small>"]
        journey["journeySample<br/><small>Customer journey<br/>staged analysis</small>"]
        bottleneck["bottleneckSample<br/><small>Production bottleneck<br/>multi-measure</small>"]
        sachets["sachetsSample<br/><small>Packaging weight<br/>basic SPC</small>"]
    end

    pwa["apps/pwa"] --> data
    azure["apps/azure"] --> data
    website["apps/website"] --> data
```

---

## Cross-Package Component Flow

How components compose across package boundaries during a typical analysis session:

```mermaid
flowchart TB
    subgraph app["App Layer (pwa / azure)"]
        dashboard["Dashboard"]
        datacontext["DataContext"]
    end

    subgraph ui_layer["@variscout/ui"]
        dashgrid["DashboardGrid"]
        chartcard["DashboardChartCard"]
        statspanel["StatsPanelBase"]
        filternav_ui["FilterBreadcrumb"]
        findingslog["FindingsLog"]
    end

    subgraph hooks_layer["@variscout/hooks"]
        datastate["useDataState"]
        filternav["useFilterNavigation"]
        boxplotdata["useBoxplotData"]
        chartscale["useChartScale"]
    end

    subgraph charts_layer["@variscout/charts"]
        ichart["IChart"]
        boxplot["Boxplot"]
        pareto["ParetoChart"]
    end

    subgraph core_layer["@variscout/core"]
        stats["calculateStats"]
        parser["parseCSV"]
        types["Types"]
    end

    dashboard --> dashgrid
    dashboard --> chartcard
    dashboard --> statspanel
    dashboard --> filternav_ui
    dashboard --> findingslog

    datacontext --> datastate
    filternav_ui --> filternav

    chartcard --> ichart
    chartcard --> boxplot
    chartcard --> pareto

    boxplotdata --> stats
    chartscale --> types
    datastate --> parser
    datastate --> types
    ichart --> types
    boxplot --> types
    pareto --> types
```

---

## Source of Truth

The canonical architecture model is defined in **LikeC4**:

```
docs/architecture/likec4/
├── model.c4    — L1 context + L2 containers + relationships
├── core.c4     — L3 @variscout/core components
├── charts.c4   — L3 @variscout/charts components
├── hooks.c4    — L3 @variscout/hooks components
├── ui.c4       — L3 @variscout/ui components
└── views.c4    — View definitions (L1-L3)
```

To render or export:

- **Interactive browser:** `pnpm docs:c4:serve`
- **Export to Mermaid:** `pnpm docs:c4`

The Mermaid diagrams in this file are manually maintained translations. When the LikeC4 model changes, update these diagrams to match.

## See Also

- [system-map.md](system-map.md) -- L1 Context + L2 Container diagrams
- [shared-packages.md](shared-packages.md) -- Detailed package APIs and export inventories
- [component-patterns.md](component-patterns.md) -- React component conventions and hook patterns
- [data-flow.md](data-flow.md) -- End-to-end data pipeline
- [data-pipeline-map.md](data-pipeline-map.md) -- Step-by-step data transformation pipeline
