# VaRiScout Power BI Visuals — Technical Specification

## Overview

VaRiScout Power BI brings variation analysis directly into Power BI dashboards. Users get two approaches:

1. **VaRiScout Dashboard** — Single visual with all 4 charts linked internally (PWA-like experience)
2. **Individual Visuals** — 4 separate visuals that cross-filter with native Power BI

Both are included in all pricing tiers.

```
PRODUCT LINEUP
─────────────────────────────────────────────────────────────────

📦 VaRiScout Dashboard      All-in-one, internal linked filtering
📦 VaRiScout I-Chart        Individual, Power BI cross-filtering
📦 VaRiScout Boxplot        Individual, Power BI cross-filtering
📦 VaRiScout Pareto         Individual, Power BI cross-filtering
📦 VaRiScout Capability     Individual, Power BI cross-filtering

All 5 visuals included in every tier:
  • Team (10 users): €399/year
  • Department (50 users): €999/year
  • Enterprise (unlimited): €1,999/year
```

---

## Architecture

### Shared Core Package

All visuals share a common analysis engine to ensure consistency:

```
@variscout/core (internal npm package)
─────────────────────────────────────────────────────────────────

src/
├── analysis/
│   ├── statistics.ts       # Mean, stdDev, percentiles
│   ├── controlLimits.ts    # UCL, LCL, center line calculations
│   ├── capability.ts       # Cp, Cpk, Pp, Ppk
│   ├── signals.ts          # Western Electric rules, out-of-control
│   └── normality.ts        # Anderson-Darling, Shapiro-Wilk
│
├── charts/
│   ├── IChart.tsx          # Individuals control chart
│   ├── Boxplot.tsx         # Box and whisker with outliers
│   ├── Pareto.tsx          # Pareto with cumulative line
│   └── Capability.tsx      # Histogram with spec limits
│
├── utils/
│   ├── dataTransform.ts    # Power BI dataView → analysis format
│   ├── formatting.ts       # Number formatting, labels
│   └── colors.ts           # Consistent color palette
│
└── index.ts                # Public API exports
```

### Visual Structure

Each Power BI visual follows this structure:

```
variscout-{visual}/
├── src/
│   ├── visual.ts           # Main visual class (IVisual)
│   ├── settings.ts         # Visual settings (VisualSettings)
│   ├── dataTransform.ts    # dataView → chart data
│   └── components/         # React components (if using React)
│
├── capabilities.json       # Data roles, objects, dataViewMappings
├── pbiviz.json            # Visual metadata
├── package.json
└── tsconfig.json
```

---

## Visual Specifications

### 1. VaRiScout Dashboard (Combined)

The flagship visual — replicates the PWA experience inside Power BI.

```
┌─────────────────────────────────────────────────────────────────┐
│  VaRiScout Dashboard                                    [⚙️]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │       I-Chart           │  │       Boxplot           │      │
│  │    ●                    │  │    ┌───┬───┐            │      │
│  │  ● ● ●  ───UCL          │  │  ──┤   │   ├──          │      │
│  │  ●●●●●● ───CL           │  │    └───┴───┘            │      │
│  │    ●●   ───LCL          │  │   A   B   C             │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │       Pareto            │  │      Capability         │      │
│  │  ██                     │  │         ▄▄▄▄            │      │
│  │  ██ ██        ___100%   │  │   LSL  ▄████▄  USL     │      │
│  │  ██ ██ ██ ██ /          │  │    │  ▄██████▄  │       │      │
│  │  A  B  C  D             │  │    Cpk: 1.33            │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  Click any chart element to filter all charts                  │
│  [Machine A selected] [Clear filters]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Data Roles

```json
{
  "dataRoles": [
    {
      "name": "measureValue",
      "displayName": "Value (Y)",
      "kind": "Measure",
      "requiredTypes": [{ "numeric": true }]
    },
    {
      "name": "timestamp",
      "displayName": "Timestamp / Sequence",
      "kind": "Grouping",
      "requiredTypes": [{ "dateTime": true }, { "integer": true }]
    },
    {
      "name": "factors",
      "displayName": "Factors (Categories)",
      "kind": "Grouping",
      "requiredTypes": [{ "text": true }]
    },
    {
      "name": "specLSL",
      "displayName": "Lower Spec Limit",
      "kind": "Measure",
      "requiredTypes": [{ "numeric": true }]
    },
    {
      "name": "specUSL",
      "displayName": "Upper Spec Limit",
      "kind": "Measure",
      "requiredTypes": [{ "numeric": true }]
    },
    {
      "name": "specTarget",
      "displayName": "Target",
      "kind": "Measure",
      "requiredTypes": [{ "numeric": true }]
    }
  ]
}
```

#### Settings

```typescript
export class DashboardSettings extends VisualSettings {
  // Layout
  public layout = {
    gridCols: 2, // 2x2 default
    showIChart: true,
    showBoxplot: true,
    showPareto: true,
    showCapability: true,
  };

  // Control limits
  public controlLimits = {
    method: 'average', // "average" | "median" | "custom"
    customUCL: null,
    customLCL: null,
    sigmaMultiple: 3,
  };

  // Filtering behavior
  public filtering = {
    enableInternalFilter: true,
    recalculateLimitsOnFilter: false, // Lock to full dataset by default
  };

  // Appearance
  public appearance = {
    colorScheme: 'default',
    showDataLabels: true,
    showGridLines: true,
  };
}
```

#### Internal Filtering Logic

```typescript
// Dashboard manages its own filter state
interface DashboardState {
  selectedFactor: string | null;
  selectedValue: string | null;
  filteredIndices: number[];
}

class VaRiScoutDashboard implements IVisual {
  private state: DashboardState = {
    selectedFactor: null,
    selectedValue: null,
    filteredIndices: [],
  };

  // When Pareto bar clicked
  private handleParetoClick(factor: string, value: string) {
    this.state.selectedFactor = factor;
    this.state.selectedValue = value;
    this.state.filteredIndices = this.calculateFilteredIndices();

    // Re-render all charts with filtered data
    this.renderAllCharts();

    // Also apply Power BI selection (for external cross-filter)
    this.applyPowerBISelection();
  }

  private renderAllCharts() {
    const data = this.settings.filtering.recalculateLimitsOnFilter
      ? this.getFilteredData()
      : this.fullData;

    const limits = this.settings.filtering.recalculateLimitsOnFilter
      ? calculateControlLimits(this.getFilteredData())
      : this.baselineLimits;

    this.renderIChart(data, limits, this.state.filteredIndices);
    this.renderBoxplot(data, this.state);
    this.renderPareto(data, this.state);
    this.renderCapability(data, limits);
  }
}
```

---

### 2. Individual Visuals Pattern

Each individual visual follows Power BI conventions for cross-filtering.

#### VaRiScout I-Chart

```
┌─────────────────────────────────────────────────────┐
│  VaRiScout I-Chart                           [⚙️]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Value                                              │
│    │      ●                                         │
│    │    ● ● ●            ─── UCL (10.05)           │
│    │  ●●●●●●●●●●●●●●     ─── CL  (10.00)           │
│    │      ●●●                                       │
│    │        ●            ─── LCL (9.95)            │
│    └──────────────────────────────────────          │
│         Time / Sequence                             │
│                                                     │
│  Mean: 10.001  |  StdDev: 0.015  |  n: 500         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Roles:**

```json
{
  "dataRoles": [
    {
      "name": "measureValue",
      "displayName": "Value",
      "kind": "Measure"
    },
    {
      "name": "timestamp",
      "displayName": "Timestamp / Sequence",
      "kind": "Grouping"
    }
  ]
}
```

**Settings:**

```typescript
export class IChartSettings extends VisualSettings {
  public controlLimits = {
    method: 'average',
    customUCL: null,
    customLCL: null,
    sigmaMultiple: 3,
    lockToBaseline: false, // Don't recalculate on cross-filter
  };

  public signals = {
    highlightOutOfControl: true,
    showRunRules: true, // Western Electric rules
    showTrendLines: false,
  };

  public appearance = {
    pointColor: '#2563eb',
    limitLineColor: '#dc2626',
    centerLineColor: '#16a34a',
  };
}
```

#### VaRiScout Boxplot

```
┌─────────────────────────────────────────────────────┐
│  VaRiScout Boxplot                           [⚙️]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Value  ●                                           │
│    │    │   ●                                       │
│    │  ──┼── │   ●                                   │
│    │ ┌──┴──┐├──┐                                    │
│    │ │  │  ││  │                                    │
│    │ │  │  │├──┤                                    │
│    │ └──┬──┘│  │                                    │
│    │  ──┼── └──┘                                    │
│    │    │                                           │
│    └────────────────────                            │
│      Machine A   B   C                              │
│                                                     │
│  Different? YES (p=0.003, Kruskal-Wallis)          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Roles:**

```json
{
  "dataRoles": [
    {
      "name": "measureValue",
      "displayName": "Value",
      "kind": "Measure"
    },
    {
      "name": "category",
      "displayName": "Category",
      "kind": "Grouping"
    }
  ]
}
```

#### VaRiScout Pareto

```
┌─────────────────────────────────────────────────────┐
│  VaRiScout Pareto                            [⚙️]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Count                                       100%   │
│    │  ██                               ●────        │
│    │  ██                         ●─────             │
│    │  ██  ██               ●─────                   │
│    │  ██  ██  ██     ●─────                         │
│    │  ██  ██  ██  ██                                │
│    └────────────────────────                        │
│       A   B   C   D                                 │
│                                                     │
│  A + B = 72% of variation                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### VaRiScout Capability

```
┌─────────────────────────────────────────────────────┐
│  VaRiScout Capability                        [⚙️]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│              LSL        Target        USL           │
│               │            │           │            │
│               ▼            ▼           ▼            │
│                      ▄▄▄▄▄▄▄▄                       │
│                    ▄██████████▄                     │
│                  ▄██████████████▄                   │
│               ▁▄████████████████▄▁                  │
│    ───────────────────────────────────────          │
│                                                     │
│    Cp: 1.45    Cpk: 1.33    Pp: 1.42   Ppk: 1.30   │
│                                                     │
│    Process is CAPABLE (Cpk ≥ 1.33)                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Cross-Filtering Behavior

### Power BI Native (Individual Visuals)

Individual visuals use Power BI's SelectionManager:

```typescript
import powerbi from 'powerbi-visuals-api';
import ISelectionManager = powerbi.extensibility.ISelectionManager;

class VaRiScoutPareto implements IVisual {
  private selectionManager: ISelectionManager;

  constructor(options: VisualConstructorOptions) {
    this.selectionManager = options.host.createSelectionManager();
  }

  private handleBarClick(category: string, selectionId: ISelectionId) {
    // Apply selection — Power BI handles cross-filtering
    this.selectionManager.select(selectionId).then((ids: ISelectionId[]) => {
      this.renderWithSelection(ids);
    });
  }

  public update(options: VisualUpdateOptions) {
    const dataView = options.dataViews[0];

    // Check if this is a filter update from another visual
    if (options.type === VisualUpdateType.Data) {
      // Data has been filtered by Power BI
      // Received data is already filtered — just render it
      this.render(this.transformData(dataView));
    }
  }
}
```

### Internal Filtering (Dashboard Visual)

Dashboard visual manages its own state AND notifies Power BI:

```typescript
class VaRiScoutDashboard implements IVisual {
  private selectionManager: ISelectionManager;
  private internalFilter: { factor: string; value: string } | null = null;

  private handleChartClick(factor: string, value: string, selectionId: ISelectionId) {
    // 1. Update internal state
    this.internalFilter = { factor, value };

    // 2. Re-render all internal charts with filter
    this.renderAllChartsFiltered();

    // 3. Also notify Power BI (for other visuals on page)
    this.selectionManager.select(selectionId);
  }

  private clearFilter() {
    this.internalFilter = null;
    this.selectionManager.clear();
    this.renderAllCharts();
  }
}
```

### Control Limits on Filter

Key UX decision: What happens to control limits when data is filtered?

```typescript
interface ControlLimitSettings {
  // If true: recalculate UCL/LCL from filtered data
  // If false: keep limits from full dataset (baseline)
  recalculateLimitsOnFilter: boolean;
}

// Example: User filters to "Machine A" only
//
// recalculateLimitsOnFilter: true
//   → UCL/LCL calculated from Machine A data only
//   → Shows "is Machine A in control with itself?"
//
// recalculateLimitsOnFilter: false (default)
//   → UCL/LCL from full dataset
//   → Shows "how does Machine A compare to overall baseline?"
```

**UI Setting:**

```
Control Limits
○ Recalculate on filter (compare within selection)
● Lock to baseline (compare to overall)
```

---

## Development Setup

### Prerequisites

```bash
# Install Power BI tools
npm install -g powerbi-visuals-tools

# Verify
pbiviz --version
```

### Project Structure

```
variscout-powerbi/
├── packages/
│   ├── core/                    # @variscout/core
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dashboard/               # VaRiScout Dashboard visual
│   │   ├── src/
│   │   ├── capabilities.json
│   │   ├── pbiviz.json
│   │   └── package.json
│   │
│   ├── ichart/                  # VaRiScout I-Chart visual
│   ├── boxplot/                 # VaRiScout Boxplot visual
│   ├── pareto/                  # VaRiScout Pareto visual
│   └── capability/              # VaRiScout Capability visual
│
├── package.json                 # Workspace root
├── lerna.json                   # Monorepo management
└── README.md
```

### Build Commands

```bash
# Install dependencies
npm install

# Build core package
npm run build:core

# Build all visuals
npm run build:visuals

# Build specific visual
npm run build:dashboard

# Package for distribution
npm run package              # Creates .pbiviz files

# Development server (single visual)
cd packages/dashboard
pbiviz start
```

### Development Workflow

```bash
# 1. Start dev server for dashboard visual
cd packages/dashboard
pbiviz start

# 2. In Power BI Service or Desktop:
#    - Enable Developer Mode
#    - Add "Developer Visual" to report
#    - Visual auto-reloads on code changes

# 3. Make changes to src/
#    - visual.ts for behavior
#    - capabilities.json for data fields
#    - settings.ts for configuration panel
```

---

## Certification Requirements

### Microsoft Certification Checklist

Each visual must pass certification for AppSource:

```
CERTIFICATION REQUIREMENTS
─────────────────────────────────────────────────────────────────

Performance
☐ Initial render < 500ms
☐ No memory leaks
☐ Handles 10,000+ data points smoothly

Security
☐ No external API calls (except allowed list)
☐ No data exfiltration
☐ No localStorage/sessionStorage
☐ Runs in sandbox

Compatibility
☐ Works in Power BI Desktop
☐ Works in Power BI Service
☐ Works in Power BI Mobile
☐ Works in embedded scenarios

Accessibility
☐ Keyboard navigation
☐ Screen reader support
☐ High contrast mode
☐ Color-blind friendly defaults

Code Quality
☐ No console.log in production
☐ No eval() or Function()
☐ TypeScript strict mode
☐ Passes linting
```

### Testing Matrix

```
TEST MATRIX
─────────────────────────────────────────────────────────────────

Platform             Dashboard  I-Chart  Boxplot  Pareto  Capability
────────────────────────────────────────────────────────────────────
PBI Desktop (Win)    ☐          ☐        ☐        ☐       ☐
PBI Desktop (Mac)    ☐          ☐        ☐        ☐       ☐
PBI Service          ☐          ☐        ☐        ☐       ☐
PBI Mobile (iOS)     ☐          ☐        ☐        ☐       ☐
PBI Mobile (Android) ☐          ☐        ☐        ☐       ☐
Embedded (iframe)    ☐          ☐        ☐        ☐       ☐
Report Server        ☐          ☐        ☐        ☐       ☐

Data Scenarios
────────────────────────────────────────────────────────────────────
Empty data           ☐          ☐        ☐        ☐       ☐
10 rows              ☐          ☐        ☐        ☐       ☐
1,000 rows           ☐          ☐        ☐        ☐       ☐
100,000 rows         ☐          ☐        ☐        ☐       ☐
Nulls in data        ☐          ☐        ☐        ☐       ☐
Negative values      ☐          ☐        ☐        ☐       ☐
Date sequences       ☐          ☐        ☐        ☐       ☐
Integer sequences    ☐          ☐        ☐        ☐       ☐
```

---

## AppSource Listing

### Visual Metadata (pbiviz.json)

```json
{
  "visual": {
    "name": "vaRiScoutDashboard",
    "displayName": "VaRiScout Dashboard",
    "guid": "vaRiScoutDashboard_XXXXX",
    "visualClassName": "VaRiScoutDashboard",
    "version": "1.0.0",
    "description": "Complete variation analysis: I-Chart, Boxplot, Pareto, and Capability in one linked visual.",
    "supportUrl": "https://variscout.com/support",
    "gitHubUrl": ""
  },
  "author": {
    "name": "RDMAIC Oy",
    "email": "support@variscout.com"
  },
  "apiVersion": "5.3.0",
  "assets": {
    "icon": "assets/icon.png"
  }
}
```

### Pricing Tiers in AppSource

```
APPSOURCE LISTING
─────────────────────────────────────────────────────────────────

VaRiScout for Power BI
by RDMAIC Oy

"Variation analysis for Lean Six Sigma in Power BI"

Includes:
✓ VaRiScout Dashboard (all-in-one)
✓ VaRiScout I-Chart
✓ VaRiScout Boxplot
✓ VaRiScout Pareto
✓ VaRiScout Capability

Pricing:
• Team (up to 10 users): €399/year
• Department (up to 50 users): €999/year
• Enterprise (unlimited): €1,999/year

Free trial: 30 days
```

---

## Phased Development

### Phase 1: Dashboard Visual (MVP)

**Timeline:** 8-10 weeks

```
Week 1-2: Setup & Core
├── Project structure
├── @variscout/core package (port from PWA)
└── Basic visual scaffolding

Week 3-4: I-Chart in Dashboard
├── Data binding
├── Control limit calculation
├── Render with Visx
└── Signal detection (out-of-control points)

Week 5-6: Other Charts
├── Boxplot
├── Pareto
├── Capability histogram
└── Layout management (2x2 grid)

Week 7-8: Internal Filtering
├── Click handlers
├── State management
├── Filter UI (chips, clear button)
└── "Lock limits" toggle

Week 9-10: Polish & Submit
├── Settings panel
├── Accessibility
├── Performance optimization
├── Certification submission
```

**Deliverable:** VaRiScout Dashboard on AppSource

### Phase 2: Individual Visuals

**Timeline:** 6-8 weeks (after Phase 1)

```
Week 1-2: I-Chart Individual
├── Extract from dashboard
├── Power BI SelectionManager integration
├── Standalone settings
└── Certification

Week 3-4: Capability Individual
├── Most unique value (Cp/Cpk in Power BI)
├── Spec limits configuration
└── Certification

Week 5-6: Boxplot & Pareto
├── Simpler charts
├── Cross-filter integration
└── Certifications (x2)

Week 7-8: Integration Testing
├── All 5 visuals on one report
├── Cross-filter behavior
├── Performance with multiple visuals
```

**Deliverable:** All 5 visuals on AppSource

### Phase 3: Advanced Features

**Timeline:** TBD based on user feedback

```
Potential features:
├── Export to VaRiScout PWA (.vrs file)
├── Gage R&R visual
├── Baseline comparison (historical vs current)
├── Annotations on I-Chart
└── Custom Western Electric rules
```

---

## Notes

### What We're NOT Building

- No data storage (Power BI handles this)
- No licensing system (AppSource handles this)
- No user authentication (Power BI handles this)
- No mobile-specific UI (Power BI handles responsive)

### Shared Code with PWA

The `@variscout/core` package can be shared:

```typescript
// Same statistical functions
import { calculateControlLimits, calculateCapability } from '@variscout/core';

// Same chart components (Visx)
import { IChart, Boxplot, Pareto, Capability } from '@variscout/core/charts';
```

**Difference:** PWA uses React for full UI, Power BI visuals use React only for chart rendering (wrapped in IVisual class).

### Why Visx Over D3 Directly

- Visx = React components wrapping D3 primitives
- Easier to share with PWA (both React-based)
- Type-safe with TypeScript
- Smaller bundle than full D3
