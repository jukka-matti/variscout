# Data Flow Architecture

How data moves through VariScout from upload to persistence.

---

## Overview

VariScout processes data entirely client-side. This diagram shows the complete flow:

```mermaid
flowchart TB
    subgraph Input["Data Input"]
        A1[File Upload] --> B[Parser]
        A2[Paste Data] --> B
        A3[Sample Dataset] --> B
    end

    subgraph Processing["Processing Layer"]
        B --> C[Validation]
        C --> D[Column Detection]
        D --> E[Data State]
    end

    subgraph Analysis["Analysis Engine"]
        E --> F1[Statistics]
        E --> F2[ANOVA]
        E --> F3[Regression]
        E --> F5[Performance]
    end

    subgraph Presentation["Presentation Layer"]
        F1 --> G1[I-Chart]
        F2 --> G2[Boxplot]
        F2 --> G3[Pareto]
        F1 --> G4[Capability]
        F3 --> G5[Scatter]
        F5 --> G7[Performance Dashboard]
    end

    subgraph Persistence["Storage Layer"]
        E --> H1[(IndexedDB)]
        E --> H2[(OneDrive)]
        E --> H3[(Excel Doc Props)]
    end
```

---

## Data Input Stage

### File Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Upload UI
    participant H as useDataIngestion
    participant P as Parser
    participant V as Validator

    U->>UI: Select file (.csv, .xlsx)
    UI->>H: onFileSelect(file)
    H->>P: parseFile(file)
    P->>P: Detect format
    P->>P: Extract rows
    P-->>H: RawData[]
    H->>V: validateData(data)
    V->>V: Check types
    V->>V: Detect columns
    V-->>H: ValidationResult
    H-->>UI: DataReady + Quality Report
```

### Supported Formats

| Format        | Parser   | Notes                  |
| ------------- | -------- | ---------------------- |
| CSV           | Built-in | Auto-detects delimiter |
| TSV           | Built-in | Tab-separated          |
| Excel (.xlsx) | SheetJS  | First sheet by default |
| Paste         | Built-in | Tab/comma detection    |

---

## Validation Stage

### Column Detection

```mermaid
flowchart LR
    A[Raw Data] --> B{Has numeric columns?}
    B -->|Yes| C[Identify measure columns]
    B -->|No| D[Error: No numeric data]
    C --> E{Has factor columns?}
    E -->|Yes| F[Identify factor columns]
    E -->|No| G[Measure-only mode]
    F --> H[Column Mapping UI]
    G --> H
```

### Keyword Detection

The parser detects special columns by keywords:

| Keyword Pattern          | Column Type    | Example         |
| ------------------------ | -------------- | --------------- |
| `operator`, `inspector`  | Operator (MSA) | "Operator Name" |
| `part`, `sample`, `item` | Part ID (MSA)  | "Sample ID"     |
| `usl`, `upper spec`      | Specification  | "USL_Weight"    |
| `lsl`, `lower spec`      | Specification  | "LSL_Weight"    |
| `target`                 | Specification  | "Target Value"  |

### Data Quality Report

```typescript
interface ValidationResult {
  isValid: boolean;
  rowCount: number;
  columnCount: number;
  numericColumns: string[];
  factorColumns: string[];
  warnings: ValidationWarning[];
  errors: ValidationError[];
}
```

---

## State Management

### DataContext Structure

```mermaid
flowchart TD
    subgraph DataContext["DataContext (Central State)"]
        R[rawData] --> F[filteredData]
        S[specs] --> C[calculations]
        M[measureSpecs] --> C
        FL[filters] --> F
        PM[isPerformanceMode] --> C
    end

    subgraph Actions["Actions"]
        A1[setData]
        A2[setSpecs]
        A3[setFilters]
        A4[setPerformanceMode]
    end

    subgraph Consumers["Consumers"]
        CH[Charts]
        ST[Stats Panels]
        FI[Filter UI]
    end

    Actions --> DataContext
    DataContext --> Consumers
```

### Filter Application

```mermaid
flowchart LR
    A[rawData] --> B{filters active?}
    B -->|No| C[filteredData = rawData]
    B -->|Yes| D[Apply filter predicate]
    D --> E[filteredData = subset]
    E --> F[Recalculate stats]
    F --> G[Update charts]
```

---

## Analysis Engine

### Statistics Calculation

```mermaid
flowchart TD
    subgraph Input
        D[filteredData]
        S[specs: USL, LSL, target]
    end

    subgraph Core["calculateStats()"]
        M[mean = Σx/n]
        SD[stdDev = √(Σ(x-μ)²/n)]
        CL[UCL = μ + 3σ<br/>LCL = μ - 3σ]
        CP[Cp = (USL-LSL)/6σ]
        CPK[Cpk = min(CPU, CPL)]
    end

    Input --> Core
    Core --> R[StatsResult]
```

### ANOVA Calculation

```mermaid
flowchart TD
    A[filteredData] --> B[Group by factor]
    B --> C[Calculate SS_between]
    B --> D[Calculate SS_within]
    C --> E[F = MS_between / MS_within]
    D --> E
    E --> F[p-value from F-distribution]
    C --> G[η² = SS_between / SS_total]
    D --> G
    F --> H[AnovaResult]
    G --> H
```

---

## Platform-Specific Flows

### PWA Data Flow

```mermaid
flowchart TB
    subgraph Browser["User's Browser"]
        A[React App] --> B[DataContext]
        B --> C[(IndexedDB)]
        C --> D[Dexie.js]
    end

    subgraph Offline["Service Worker"]
        E[Cache API] --> F[Offline Assets]
    end

    A <--> E
```

### Azure App Data Flow

```mermaid
flowchart TB
    subgraph Browser["User's Browser"]
        A[React App] --> B[DataContext]
        B --> C[(IndexedDB)]
    end

    subgraph Cloud["Microsoft Cloud"]
        D[MSAL Auth] --> E[Access Token]
        E --> F[Graph API]
        F --> G[(OneDrive)]
    end

    B <--> D
    C <--> G

    note1[Bi-directional sync:<br/>Local-first, cloud backup]
```

### Excel Add-in Data Flow

```mermaid
flowchart TB
    subgraph Excel["Excel Workbook"]
        A[Worksheet Data] --> B[Table Range]
        B --> C[Slicers]
    end

    subgraph AddIn["Content Add-in"]
        D[Office.js API] --> E[Read Table]
        E --> F[Charts]
        G[Custom Doc Props] --> H[State Bridge]
    end

    subgraph State["Persistence"]
        H --> I[Spec limits]
        H --> J[Selected measure]
        H --> K[View state]
    end

    Excel --> D
    F --> Excel
```

---

## Hook Dependencies

```mermaid
flowchart TD
    subgraph Core["Core Hooks"]
        DS[useDataState]
        FN[useFilterNavigation]
        VT[useVariationTracking]
    end

    subgraph Chart["Chart Hooks"]
        CS[useChartScale]
        CT[useChartTheme]
        RM[useResponsiveChartMargins]
    end

    subgraph UI["UI Hooks"]
        KN[useKeyboardNavigation]
        MQ[useIsMobile]
    end

    DS --> FN
    FN --> VT
    DS --> CS
    CS --> RM
```

---

## Data Export

### Export Formats

```mermaid
flowchart LR
    A[Filtered Data] --> B{Export Format}
    B --> C[CSV]
    B --> D[JSON]
    B --> E[Screenshot]

    C --> F[Download file]
    D --> F
    E --> G[Canvas capture]
    G --> F
```

---

## See Also

- [Component Patterns](component-patterns.md) - Hook integration details
- [Offline-First](offline-first.md) - Persistence strategy
- [Shared Packages](shared-packages.md) - Package responsibilities
- [PWA Storage](../../08-products/pwa/storage.md) - IndexedDB details
- [OneDrive Sync](../../08-products/azure/onedrive-sync.md) - Cloud sync details
