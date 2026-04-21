---
title: 'Monorepo Architecture'
audience: [developer, architect]
category: architecture
status: stable
---

# Monorepo Architecture

VariScout uses a pnpm workspaces monorepo to share code across multiple applications.

---

## Structure

```
variscout-lite/
├── packages/
│   ├── core/          # @variscout/core - Stats, parser, license, types
│   ├── charts/        # @variscout/charts - Visx chart components
│   ├── data/          # @variscout/data - Sample datasets
│   ├── hooks/         # @variscout/hooks - Shared React hooks
│   └── ui/            # @variscout/ui - Shared UI utilities
├── apps/
│   ├── pwa/           # PWA website (React + Vite)
│   ├── azure/         # Azure Team App (EasyAuth + OneDrive sync)
│   └── website/       # Marketing website (Astro + React Islands)
└── docs/              # Documentation
```

---

## Package Responsibilities

### @variscout/core

Pure logic with no React dependencies:

- Statistical calculations (mean, Cp, Cpk, ANOVA)
- CSV/Excel parsing and validation
- TypeScript type definitions
- Glossary terms and definitions

### @variscout/charts

React + Visx chart components:

- IChart, Boxplot, ParetoChart, ScatterPlot
- Performance charts (multi-channel analysis)
- Theme-aware colors via `useChartTheme`
- Responsive utilities

### @variscout/hooks

Shared React hooks:

- `useChartScale` - Y-axis scale calculation
- `useFilterNavigation` - Filter navigation with breadcrumbs
- `useVariationTracking` - Cumulative η² tracking
- `useDataState` - Shared DataContext state management
- `useDataIngestion` - File upload and data parsing
- `useKeyboardNavigation` - Arrow key focus management
- `useResponsiveChartMargins` - Dynamic chart margins
- `useColumnClassification` - Column type detection
- `useRegressionState` - Regression panel state management

### @variscout/ui

Shared UI components and utilities:

- `ChartCard` - Reusable chart container with header, controls, and actions
- `ColumnMapping` - Column selection UI for data setup
- `MeasureColumnSelector` - Checkbox list for selecting measure columns
- `PerformanceDetectedModal` - Wide-format data detection prompt
- `DataQualityBanner` - Data validation summary display
- `HelpTooltip` - Contextual help with glossary integration
- `useGlossary` hook
- `useIsMobile` responsive hook
- Color constants (statusColors)
- Error service utilities

### @variscout/data

Sample datasets with pre-computed statistics:

- Coffee, journey, bottleneck, sachets samples
- Pre-computed chart data for demos

---

## Dependency Rules

```
apps/ ──────────────────────────────────────────────────▶
  │
  │ import from packages (never the reverse)
  │
  ▼
packages/ ──────────────────────────────────────────────▶
  │
  ├── @variscout/core (no React, no external deps)
  │     │
  │     └── types, stats, parser, glossary
  │
  ├── @variscout/charts (depends on core)
  │     │
  │     └── React + Visx chart components
  │
  ├── @variscout/hooks (depends on core)
  │     │
  │     └── shared React hooks
  │
  └── @variscout/ui (depends on core)
        │
        └── UI utilities, HelpTooltip
```

**Rules:**

- Apps import from packages: `import { calculateStats } from '@variscout/core'`
- Packages never import from apps
- `@variscout/core` has no React dependencies
- Use `workspace:*` for internal package references

---

## Build Commands

```bash
# Build all packages and apps
pnpm build

# Build specific package/app
pnpm --filter @variscout/pwa build
pnpm --filter @variscout/core build

# Build recursively (dependencies first)
pnpm -r build

# Development servers
pnpm dev                               # PWA
pnpm --filter @variscout/azure-app dev # Azure app
```

---

## Adding Dependencies

| Type              | Where to Add            | Example                            |
| ----------------- | ----------------------- | ---------------------------------- |
| Shared tooling    | Root `devDependencies`  | TypeScript, ESLint, Vitest         |
| Package-specific  | Package `dependencies`  | Visx in @variscout/charts          |
| Internal packages | `workspace:*` reference | `"@variscout/core": "workspace:*"` |

---

## See Also

- [ADR-001: Monorepo Decision](../../07-decisions/adr-001-monorepo.md)
- [Shared Packages](shared-packages.md)
