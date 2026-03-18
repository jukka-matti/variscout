---
title: System Map
description: Visual architecture overview of VariScout's packages, apps, and external integrations
journey-phase: [all]
---

# System Map

Visual entry point for understanding VariScout's architecture. Start here, then drill into component-level docs linked below.

## Context Diagram (C4 L1)

Who uses VariScout and what external systems does it touch?

```mermaid
C4Context
    title VariScout System Context

    Person(analyst, "Quality Analyst", "Analyses process variation using control charts, capability indices, and Pareto rankings")

    System(variscout, "VariScout", "Offline-first variation analysis tool (PWA + Azure App)")

    System_Ext(azuread, "Azure AD", "EasyAuth identity provider")
    System_Ext(onedrive, "Microsoft OneDrive", "Cloud file sync via Graph API")
    System_Ext(teams, "Microsoft Teams", "Channel tabs, SSO, photo capture")
    System_Ext(aisearch, "Azure AI Search", "AI-powered analysis suggestions")

    Rel(analyst, variscout, "Uploads data, reviews charts, investigates variation")
    Rel(variscout, azuread, "Authenticates via EasyAuth")
    Rel(variscout, onedrive, "Syncs projects (Team plan)")
    Rel(variscout, teams, "Embeds as channel tab, captures photos")
    Rel(variscout, aisearch, "Queries for AI-assisted analysis")
```

## Container Diagram (C4 L2)

Monorepo packages, apps, and their dependency relationships.

```mermaid
flowchart TB
    subgraph apps["Apps"]
        pwa["apps/pwa<br/><i>React + Vite</i><br/>FREE demo tool"]
        azure["apps/azure<br/><i>React + Vite</i><br/>Azure Team App"]
        website["apps/website<br/><i>Astro + React Islands</i><br/>Marketing site"]
    end

    subgraph packages["Packages"]
        ui["@variscout/ui<br/><i>Shared UI components</i>"]
        hooks["@variscout/hooks<br/><i>Shared React hooks</i>"]
        charts["@variscout/charts<br/><i>React + Visx charts</i>"]
        core["@variscout/core<br/><i>Pure logic, stats, parser, tier</i>"]
        data["@variscout/data<br/><i>Sample datasets</i>"]
    end

    subgraph infra["Infrastructure"]
        arm["infra/mainTemplate.json<br/><i>ARM template</i>"]
    end

    subgraph external["External Systems"]
        azuread["Azure AD"]
        onedrive["OneDrive"]
        teams["Teams"]
        aisearch["Azure AI Search"]
    end

    %% App dependencies
    pwa --> core & charts & hooks & ui & data
    azure --> core & charts & hooks & ui & data
    website --> charts & data

    %% Package dependencies
    ui --> core & hooks & charts
    hooks --> core
    charts --> core

    %% External integrations (Azure app only)
    azure -.-> azuread & onedrive & teams & aisearch
    arm -.-> azure
```

### Key dependency rules

- **Apps** import from packages; packages never import from apps.
- **`@variscout/core`** has zero React dependencies (pure TypeScript + d3-array, exceljs, papaparse).
- **`@variscout/data`** has no internal package dependencies.
- **`@variscout/ui`** is the highest-level shared package, composing core, hooks, and charts.

## Package Responsibilities

| Package             | Role                                                                | Key exports                                                              | Docs                                           |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| `@variscout/core`   | Statistics engine, CSV/Excel parser, tier system, glossary, types   | `calculateStats`, `parseCSV`, `getTier`, `GlossaryTerm`                  | [shared-packages.md](shared-packages.md)       |
| `@variscout/charts` | Visx chart components (I-Chart, Boxplot, Pareto, Performance suite) | `IChart`, `Boxplot`, `ParetoChart`, `PerformanceIChart`, `useChartTheme` | [component-patterns.md](component-patterns.md) |
| `@variscout/data`   | Pre-computed sample datasets for demo and testing                   | `coffeeSample`, `journeySample`, `bottleneckSample`                      | [shared-packages.md](shared-packages.md)       |
| `@variscout/hooks`  | Shared React hooks for state, navigation, data transforms           | `useDataState`, `useFilterNavigation`, `useChartScale`, `useTier`        | [component-patterns.md](component-patterns.md) |
| `@variscout/ui`     | Shared UI components with colorScheme theming pattern               | `StatsPanelBase`, `FindingsLog`, `DashboardGrid`, `WhatIfSimulator`      | [component-patterns.md](component-patterns.md) |

## App Responsibilities

| App            | Distribution      | Technology              | Key characteristics                                                |
| -------------- | ----------------- | ----------------------- | ------------------------------------------------------------------ |
| `apps/pwa`     | Public URL (free) | React + Vite PWA        | Session-only storage, 3 factors max, 50K rows                      |
| `apps/azure`   | Azure Marketplace | React + Vite + EasyAuth | IndexedDB + OneDrive sync, 6 factors, 100K rows, Teams integration |
| `apps/website` | Public URL        | Astro + React Islands   | Static marketing site with embedded chart demos                    |

## Infrastructure

| Component                                    | Purpose                                                           | Docs                                                       |
| -------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `infra/mainTemplate.json`                    | ARM template for Azure Marketplace Managed Application deployment | [arm-template.md](../../08-products/azure/arm-template.md) |
| `.github/workflows/deploy-azure-staging.yml` | CI/CD pipeline: build + OIDC deploy to staging                    | [deployment.md](../implementation/deployment.md)           |

## See Also

- [component-map.md](component-map.md) -- L3 component views per package (internal modules)
- [data-flow.md](data-flow.md) -- End-to-end data pipeline from ingestion to chart rendering
- [shared-packages.md](shared-packages.md) -- Detailed package APIs and export inventories
- [monorepo.md](monorepo.md) -- Build system, workspace configuration, import rules
- [component-patterns.md](component-patterns.md) -- React component conventions and hook patterns
- [offline-first.md](offline-first.md) -- Storage strategy, sync architecture, conflict resolution
- [data-pipeline-map.md](data-pipeline-map.md) -- Step-by-step data transformation pipeline
