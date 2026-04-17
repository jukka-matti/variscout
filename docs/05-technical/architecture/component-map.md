---
title: Component Map
description: L3 component views per package — internal modules and their responsibilities
journey-phase: [all]
---

# Component Map

<!-- journey-phase: [all] -->

L3 component decomposition for each VariScout package. These are architecture component diagrams maintained alongside the codebase.

## Package Overview

All packages and their internal module counts at a glance.

```mermaid
flowchart LR
    subgraph core["@variscout/core (13 modules)"]
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
        c10["AI Context"]
        c11["Findings"]
        c12["i18n"]
        c13["Performance"]
    end

    subgraph charts["@variscout/charts (18 components)"]
        direction TB
        ch1["10 Standard Charts"]
        ch2["4 Performance Charts (+ Base)"]
    end

    subgraph hooks["@variscout/hooks (127 hooks)"]
        direction TB
        h1["8 State & Data"]
        h2["9 Chart Data & Visualization"]
        h3["5 UI State"]
        h4["8 Business Logic & AI"]
        h5["5 Advanced Composition"]
        h6["3 i18n & Theme"]
        h7["3 Reporting & Export"]
    end

    subgraph ui["@variscout/ui (92 components)"]
        direction TB
        u1["10 Input"]
        u2["4 Data Display"]
        u3["8 Analysis"]
        u4["6 Chart Wrappers"]
        u5["4 Navigation"]
        u6["13 Findings"]
        u7["2 Simulation"]
        u8["5 Dashboard"]
        u9["11 AI & CoScout"]
        u11["6 Report View"]
        u12["6 Investigation"]
        u13["3 Utilities"]
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

    subgraph yamazumi["Yamazumi Charts (lean time study)"]
        yam_chart["YamazumiChart<br/><small>Stacked bar by activity type<br/>takt time line</small>"]
    end

    subgraph evidencemap["Evidence Map (causal graph)"]
        ev_map["EvidenceMap<br/><small>Force-directed causal graph<br/>3-layer: statistical, investigation, synthesis</small>"]
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
    yamazumi --> core_types
    yamazumi --> core_stats
    evidencemap --> core_types
    evidencemap --> core_stats
    supporting --> core_types
```

---

## @variscout/hooks

Shared React hooks organized by concern. Depends on `@variscout/core` for types, statistics utilities, and tier logic.

```mermaid
flowchart TB
    subgraph state["State & Data (8)"]
        datastate["useDataState"]
        usetier["useTier"]
        dataingestion["useDataIngestion"]
        columnclass["useColumnClassification"]
        drillpath["useDrillPath"]
        projpersist["useProjectPersistence"]
        filterhandlers["useFilterHandlers"]
        createfactormodal["useCreateFactorModal"]
    end

    subgraph chartdata["Chart Data & Visualization (9)"]
        chartscale["useChartScale"]
        boxplotdata["useBoxplotData"]
        ichartdata["useIChartData"]
        margins["useResponsiveChartMargins"]
        paretodata["useParetoChartData"]
        dashdata["useDashboardComputedData"]
        boxplotwrap["useBoxplotWrapperData"]
        ichartwrap["useIChartWrapperData"]
        dashcharts["useDashboardChartsBase"]
    end

    subgraph uistate["UI State (5)"]
        filternav["useFilterNavigation"]
        keyboard["useKeyboardNavigation"]
        focusednav["useFocusedChartNav"]
        annotations["useAnnotations"]
        highlightfade["useHighlightFade"]
    end

    subgraph business["Business Logic & AI (8)"]
        vartrack["useVariationTracking"]
        violations["useControlViolations"]
        findings["useFindings"]
        hypotheses["useHypotheses"]
        aicontext["useAIContext"]
        aicoscout["useAICoScout"]
        narration["useNarration"]
        chartinsights["useChartInsights"]
    end

    subgraph composition["Advanced Composition (5)"]
        chartcopy["useChartCopy"]
        knowledgesearch["useKnowledgeSearch"]
        verifycharts["useVerificationCharts"]
        journeyphase["useJourneyPhase"]
        snapshotdata["useSnapshotData"]
    end

    subgraph i18ntheme["i18n & Theme (3)"]
        localestate["useLocaleState"]
        translation["useTranslation"]
        themestate["useThemeState"]
    end

    subgraph reporting["Reporting (3)"]
        reportsections["useReportSections"]
        scrollspy["useScrollSpy"]
        copysection["copySectionAsHTML"]
    end

    subgraph deps["@variscout/core"]
        core_types["Types"]
        core_stats["Statistics Engine"]
        core_tier["Tier System"]
    end

    state --> core_types
    state --> core_tier
    chartdata --> core_types
    chartdata --> core_stats
    uistate --> core_types
    business --> core_types
    business --> core_stats
    composition --> core_types
```

---

## @variscout/ui

110+ shared UI components across 14 categories. Uses the `colorScheme` pattern with `defaultScheme` semantic tokens. Depends on core, hooks, and charts.

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

    subgraph analysis["Analysis (6)"]
        anova["AnovaResults"]
        statspanel["StatsPanelBase"]
        yaxispopover["YAxisPopover"]
        axiseditor["AxisEditor"]
        factorsel["FactorSelector"]
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

    subgraph findings["Findings (13)"]
        findingslog["FindingsLog"]
        findingcard["FindingCard"]
        findingeditor["FindingEditor"]
        findingstatus["FindingStatusBadge"]
        findingcomments["FindingComments"]
        findingboard["FindingBoardView"]
        findingspanel["FindingsPanelBase"]
        findingswindow["FindingsWindow"]
        findingsexport["FindingsExportMenu"]
        hypothesistree["HypothesisTreeView"]
        hypothesisnode["HypothesisNode"]
        findingdetail["FindingDetailPanel"]
        briefheader["BriefHeader"]
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

    subgraph aicoscout["AI & CoScout (11)"]
        narrativebar["NarrativeBar"]
        chartinsightchip["ChartInsightChip"]
        coscoutinline["CoScoutInline"]
        coscoutmessages["CoScoutMessages"]
        coscoutpanel["CoScoutPanelBase"]
        processdesc["ProcessDescriptionField"]
        aionboarding["AIOnboardingTooltip"]
        previewbadge["PreviewBadge"]
        ichartwrapbase["IChartWrapperBase"]
        boxplotwrapbase["BoxplotWrapperBase"]
        paretowrapbase["ParetoChartWrapperBase"]
    end


    subgraph report["Report View (6)"]
        reportview["ReportViewBase"]
        reportsection["ReportSection"]
        reportstep["ReportStepMarker"]
        reportkpi["ReportKPIGrid"]
        reportchart["ReportChartSnapshot"]
        verifevidence["VerificationEvidenceBase"]
    end

    subgraph investigation["Investigation (6)"]
        investsidebar["InvestigationSidebar"]
        stagedcomp["StagedComparisonCard"]
        investphase["InvestigationPhaseBadge"]
        presentview["PresentationViewBase"]
        investprompt2["InvestigationPrompt"]
        dashlayout["DashboardLayoutBase"]
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
    ui["@variscout/ui<br/>(110+ components)"]
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

## Yamazumi Dashboard Slot Composition

When Yamazumi (lean time study) mode is active, the standard 4-slot dashboard layout is replaced:

| Slot | Standard Mode | Yamazumi Mode                                                | Hook / Component           |
| ---- | ------------- | ------------------------------------------------------------ | -------------------------- |
| 1    | I-Chart       | I-Chart (switchable metric via `YamazumiIChartMetricToggle`) | `useYamazumiIChartData`    |
| 2    | Boxplot       | YamazumiChart (stacked bars by activity type)                | `useYamazumiChartData`     |
| 3    | Pareto        | Pareto (5 switchable modes via `YamazumiParetoModeDropdown`) | `useYamazumiParetoData`    |
| 4    | Stats Panel   | Yamazumi Summary (`YamazumiSummaryBar`)                      | Core `computeYamazumiData` |

Detection is automatic via `detectYamazumiFormat()` in `@variscout/core` during paste or file upload. The detection modal (`YamazumiDetectedModal`) confirms the mapping before entering Yamazumi mode.

---

## Diagram Health

Run `pnpm docs:check` to verify that component counts and type values in these diagrams match the current codebase. The script checks package export counts and ensures all enum values (FindingStatus, InvestigationPhase, etc.) appear in the relevant diagrams.

## See Also

- [system-map.md](system-map.md) -- L1 Context + L2 Container diagrams
- [shared-packages.md](shared-packages.md) -- Detailed package APIs and export inventories
- [component-patterns.md](component-patterns.md) -- React component conventions and hook patterns
- [data-flow.md](data-flow.md) -- End-to-end data pipeline
- [data-pipeline-map.md](data-pipeline-map.md) -- Step-by-step data transformation pipeline
