---
title: Data Pipeline Map
description: End-to-end data flow from CSV upload through statistics, charts, and AI — with TypeScript interfaces at every boundary
journey-phase: [all]
---

# Data Pipeline Map

End-to-end data flow from CSV upload through statistics, charts, and AI — with TypeScript interfaces at every boundary. Extends [data-flow.md](data-flow.md) with the full pipeline view including AI integration.

---

## 1. Full Pipeline Overview

```mermaid
flowchart TB
    subgraph Input["Data Input"]
        CSV[CSV File] --> Parse[parseCSV]
        XLS[Excel File] --> ParseXL[parseExcel]
        Paste[Paste Data] --> ParseTxt[parseText]
        Sample[Sample Dataset] --> Direct[Pre-parsed DataRow array]
    end

    subgraph Detection["Column Detection"]
        Parse --> DC[detectColumns]
        ParseXL --> DC
        ParseTxt --> DC
        Direct --> DC
        DC --> CM[ColumnMapping UI]
    end

    subgraph Validation["Validation"]
        CM --> VD[validateData]
        VD --> DQR[DataQualityReport]
    end

    subgraph State["DataContext"]
        DQR --> CTX[rawData + specs + filters]
        CTX --> FD[filteredData]
    end

    subgraph Stats["Statistics Engine"]
        FD --> CS[calculateStats]
        CS --> SR[StatsResult]
        FD --> CA[calculateAnova]
        CA --> AR[AnovaResult]
    end

    subgraph Charts["Chart Transforms"]
        FD --> IC[useIChartData]
        IC --> ICP[IChartPoint array]
        FD --> BD[useBoxplotData]
        BD --> BDD[BoxplotData array]
        FD --> PD[useParetoChartData]
        PD --> PI[ParetoItem array]
    end

    subgraph Presentation["Chart Components"]
        ICP --> ICH[I-Chart]
        BDD --> BOX[Boxplot]
        PI --> PAR[Pareto]
        SR --> STP[StatsPanel]
        AR --> ANV[AnovaResults]
    end

    subgraph Investigation["Findings"]
        Presentation --> FND[Finding array]
        FND --> Board[FindingBoardView]
    end

    subgraph AI["AI Layer (preview)"]
        SR --> AIC[buildAIContext]
        AR --> AIC
        FD --> AIC
        FND --> AIC
        AIC --> Prompts[3-tier prompt templates]
        Prompts --> SVC[AI Service - Azure OpenAI]
        SVC --> NB[NarrativeBar]
        SVC --> CIC[ChartInsightChips]
        SVC --> COS[CoScout - conversational]
    end

    subgraph Persistence["Storage"]
        CTX --> IDB[(IndexedDB)]
        CTX --> OD[("OneDrive (Team plan)")]
    end
```

---

## 2. TypeScript Interfaces at Boundaries

Each boundary between pipeline stages has a well-defined TypeScript interface. The shapes below are abbreviated from the actual source.

### Input Boundary

```typescript
// packages/core/src/types.ts
type DataCellValue = string | number | boolean | null | undefined;

interface DataRow {
  [columnName: string]: DataCellValue;
}
```

All parsers (`parseCSV`, `parseText`, `parseExcel`) return `DataRow[]`.

### Column Detection Boundary

```typescript
// packages/core/src/parser/types.ts
interface DetectedColumns {
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  confidence: 'high' | 'medium' | 'low';
  columnAnalysis: ColumnAnalysis[];
}
```

### Validation Boundary

```typescript
// packages/core/src/parser/types.ts
interface DataQualityReport {
  totalRows: number;
  validRows: number;
  excludedRows: ExcludedRow[];
  columnIssues: ColumnIssue[];
}

interface ExclusionReason {
  type: 'missing' | 'non_numeric' | 'empty';
  column: string;
  value?: string;
}
```

### Stats Boundary

```typescript
// packages/core/src/types.ts
interface StatsResult {
  mean: number;
  median: number;
  stdDev: number; // Sample std dev (sigma_overall)
  sigmaWithin: number; // Within-subgroup std dev (MR-bar / d2)
  mrBar: number; // Mean moving range
  ucl: number; // Upper Control Limit (mean + 3 * sigmaWithin)
  lcl: number; // Lower Control Limit (mean - 3 * sigmaWithin)
  cp?: number; // Process Capability (requires USL + LSL)
  cpk?: number; // Process Capability accounting for centering
  outOfSpecPercentage: number;
}
```

### ANOVA Boundary

```typescript
// packages/core/src/types.ts
interface AnovaResult {
  groups: AnovaGroup[];
  ssb: number; // Sum of squares between groups
  ssw: number; // Sum of squares within groups
  dfBetween: number; // Degrees of freedom (k-1)
  dfWithin: number; // Degrees of freedom (N-k)
  msb: number; // Mean square between
  msw: number; // Mean square within
  fStatistic: number; // F = MSB / MSW
  pValue: number;
  isSignificant: boolean; // p < 0.05
  etaSquared: number; // Effect size (SSB / SST)
  insight: string; // Plain-language interpretation
}
```

### Filter Boundary

```typescript
// packages/core/src/navigation.ts
interface FilterAction {
  id: string;
  type: FilterType; // 'filter' | 'highlight'
  source: FilterSource; // Which chart initiated
  factor?: string; // Column being filtered
  values: (string | number)[];
  rowIndex?: number; // I-Chart row highlight
  timestamp: number;
}
```

### Finding Boundary

```typescript
// packages/core/src/findings.ts
type FindingStatus = 'observed' | 'investigating' | 'analyzed';
type FindingTag = 'key-driver' | 'low-impact';

type FindingSource =
  | { chart: 'boxplot' | 'pareto'; category: string }
  | { chart: 'ichart'; anchorX: number; anchorY: number };

interface FindingContext {
  activeFilters: Record<string, (string | number)[]>;
  cumulativeScope: number | null;
  stats?: { mean: number; median?: number; cpk?: number; samples: number };
}

interface Finding {
  id: string;
  text: string;
  createdAt: number;
  context: FindingContext;
  status: FindingStatus;
  tag?: FindingTag;
  comments: FindingComment[];
  statusChangedAt: number;
  source?: FindingSource;
  assignee?: FindingAssignee;
}
```

### Persistence Boundary

```typescript
// packages/hooks/src/types.ts
interface AnalysisState {
  version: string;
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: SpecLimits;
  measureSpecs?: Record<string, SpecLimits>;
  filters: Record<string, (string | number)[]>;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases?: Record<string, string>;
  valueLabels?: Record<string, Record<string, string>>;
  displayOptions?: DisplayOptions;
  cpkTarget?: number;
  stageColumn?: string | null;
  stageOrderMode?: StageOrderMode;
  isPerformanceMode?: boolean;
  measureColumns?: string[];
  selectedMeasure?: string | null;
  measureLabel?: string | null;
  chartTitles?: Record<string, string>;
  filterStack?: FilterAction[];
  viewState?: ViewState;
  findings?: Finding[];
}
```

---

## 3. Stats Pipeline Swim Lane

```mermaid
flowchart LR
    subgraph Input["Filtered Data"]
        FD["filteredData (DataRow[])"]
        SP["specs (SpecLimits)"]
        FC["factor (string)"]
    end

    subgraph Core["@variscout/core"]
        CS["calculateStats(values, specs)"]
        CA["calculateAnova(data, factor)"]
    end

    subgraph Output["Results"]
        SR["StatsResult"]
        AR["AnovaResult"]
    end

    subgraph Hooks["@variscout/hooks — Chart Transforms"]
        ICD["useIChartData()"]
        BPD["useBoxplotData()"]
        PCD["useParetoChartData()"]
    end

    subgraph ChartData["Chart Data Shapes"]
        ICP["IChartPoint[]"]
        BDD["BoxplotData[]"]
        PI["ParetoItem[]"]
    end

    FD --> CS
    SP --> CS
    CS --> SR

    FD --> CA
    FC --> CA
    CA --> AR

    FD --> ICD
    FD --> BPD
    FD --> PCD
    SR --> ICD

    ICD --> ICP
    BPD --> BDD
    PCD --> PI
```

---

## 4. AI Pipeline Swim Lane

> **Note**: AI features are shipped behind a preview gate. The pipeline components (NarrativeBar, ChartInsightChips, CoScout) are defined in the knowledge layer but not yet wired to live AI services in the main codebase. See the [investigation lifecycle map](../../03-features/workflows/investigation-lifecycle-map.md) for IDEOI phase definitions and CoScout behavior per phase.

```mermaid
flowchart LR
    subgraph Context["Analysis Context"]
        SR[StatsResult]
        AR[AnovaResult]
        FA["FilterAction[]"]
        FND["Finding[]"]
        Phase["IDEOI Phase"]
    end

    subgraph Build["Context Assembly"]
        BAC["buildAIContext()"]
    end

    subgraph Prompts["Prompt Templates (3-tier)"]
        SYS["System prompt (role + rules)"]
        DOM["Domain prompt (SPC methodology)"]
        CTX["Context prompt (current data state)"]
    end

    subgraph Service["AI Service"]
        AOAI["Azure OpenAI"]
    end

    subgraph Output["AI Output Components"]
        NB["NarrativeBar — summary text"]
        CIC["ChartInsightChips — per-chart suggestions"]
        COS["CoScout — conversational, phase-aware"]
    end

    SR --> BAC
    AR --> BAC
    FA --> BAC
    FND --> BAC
    Phase --> BAC

    BAC --> SYS
    BAC --> DOM
    BAC --> CTX

    SYS --> AOAI
    DOM --> AOAI
    CTX --> AOAI

    AOAI --> NB
    AOAI --> CIC
    AOAI --> COS
```

### IDEOI Phase Mapping

The AI layer adapts behavior based on the current investigation phase:

| IDEOI Phase      | Trigger              | CoScout Behavior                            |
| ---------------- | -------------------- | ------------------------------------------- |
| **Initial**      | Data loaded          | Suggests patterns in data                   |
| **Diverging**    | First finding pinned | Suggests possible hypotheses                |
| **Evaluating**   | Hypothesis linked    | Challenges assumptions, suggests validation |
| **Organizing**   | Finding analyzed     | Summarizes root causes, suggests actions    |
| **Implementing** | Actions defined      | Tracks progress, projects improvement       |

---

## 5. Persistence Pipeline

```mermaid
flowchart TB
    subgraph State["Application State"]
        AS["AnalysisState"]
    end

    subgraph Local["Local Storage (all platforms)"]
        IDB[("IndexedDB")]
    end

    subgraph Cloud["Cloud Storage (Team plan only)"]
        EA["EasyAuth"] --> TK["Access Token"]
        TK --> GRAPH["Graph API"]
        GRAPH --> OD[("OneDrive")]
    end

    AS -->|"Dexie.js"| IDB
    AS -->|"StorageProvider"| EA
    IDB <-->|"Bi-directional sync"| OD

    style Cloud fill:#f0f9ff,stroke:#3b82f6
```

`AnalysisState` is the single serializable shape that captures the full state of an analysis session. Key fields for persistence:

| Field               | Purpose                                |
| ------------------- | -------------------------------------- |
| `rawData`           | Original uploaded data rows            |
| `specs`             | USL, LSL, target specifications        |
| `filters`           | Active filter selections               |
| `filterStack`       | Ordered `FilterAction[]` drill trail   |
| `findings`          | Investigation findings with status     |
| `viewState`         | Active tab, focused chart, panel state |
| `isPerformanceMode` | Multi-measure mode flag                |
| `measureColumns`    | Selected measure columns               |
| `cpkTarget`         | Capability target (default 1.33)       |

---

## 6. Filter Recalculation Flow

A single filter click triggers a cascade of recalculations through the pipeline:

```mermaid
flowchart TD
    A["User clicks Boxplot category"] --> B["useFilterNavigation.addFilter()"]
    B --> C["DataContext.dispatch( SET_FILTERS )"]
    C --> D["filteredData recomputed"]
    D --> E["calculateStats(filteredData)"]
    D --> F["calculateAnova(filteredData, nextFactor)"]
    E --> G["New StatsResult"]
    F --> H["New AnovaResult"]
    G --> I["All chart hooks recompute"]
    H --> I
    I --> J["All chart components re-render"]
    J --> K{"AI enabled?"}
    K -->|Yes| L["Debounce 500ms"]
    L --> M["buildAIContext()"]
    M --> N["NarrativeBar updates"]
    K -->|No| O["Done"]
```

### What gets recomputed

| Stage        | Function / Hook        | Output                                        |
| ------------ | ---------------------- | --------------------------------------------- |
| Filter       | `useFilterNavigation`  | Updated `FilterAction[]`                      |
| Data         | DataContext reducer    | `filteredData` (subset of `rawData`)          |
| Stats        | `calculateStats()`     | New `StatsResult` (mean, Cpk, control limits) |
| ANOVA        | `calculateAnova()`     | New `AnovaResult` (F, p, eta-squared)         |
| I-Chart      | `useIChartData()`      | New `IChartPoint[]`                           |
| Boxplot      | `useBoxplotData()`     | New `BoxplotData[]`                           |
| Pareto       | `useParetoChartData()` | New `ParetoItem[]`                            |
| Variation    | `useVariationTracking` | Updated scope fraction and cumulative %       |
| AI (preview) | `buildAIContext()`     | Refreshed narrative and insights              |

---

## 7. Filter Drill-Down Sequence Diagram

Complete round-trip from user click to updated UI:

```mermaid
sequenceDiagram
    participant User
    participant Boxplot
    participant useFilterNavigation
    participant DataContext
    participant Stats as calculateStats
    participant ANOVA as calculateAnova
    participant Charts as Chart hooks
    participant AI as AI layer (debounced)

    User->>Boxplot: Click category bar
    Boxplot->>useFilterNavigation: addFilter(factor, value)
    useFilterNavigation->>DataContext: dispatch SET_FILTERS
    DataContext->>DataContext: Recompute filteredData

    par Statistics
        DataContext->>Stats: calculateStats(filteredData, specs)
        Stats-->>DataContext: StatsResult
    and ANOVA
        DataContext->>ANOVA: calculateAnova(filteredData, nextFactor)
        ANOVA-->>DataContext: AnovaResult
    end

    DataContext-->>Charts: New props (filteredData, stats, anova)
    Charts->>Charts: useIChartData + useBoxplotData + useParetoChartData

    Charts-->>Boxplot: Re-render with drill-down data
    Note over Boxplot: Next factor level displayed

    opt AI preview enabled
        DataContext-->>AI: AIContext (debounced 500ms)
        AI-->>User: NarrativeBar update
    end
```

---

## 8. See Also

- [Data Flow](data-flow.md) -- detailed input/validation stages and platform-specific flows
- [System Map](system-map.md) -- package topology and dependency graph
- [Component Patterns](component-patterns.md) -- hook integration details and DataContext structure
- [Investigation Lifecycle Map](../../03-features/workflows/investigation-lifecycle-map.md) -- IDEOI phases and CoScout behavior
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) -- findings workflow specification
