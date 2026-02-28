# VariScout: Architecture Overview

VariScout Lite is designed as a **browser-first**, **offline-capable** Progressive Web App (PWA) for manufacturing variation analysis. It prioritizes data privacy (no cloud) and works on any device.

## 1. Repository Structure

VariScout Lite uses a **pnpm workspaces monorepo** to support multiple applications from shared code:

```
variscout-lite/
├── packages/
│   ├── core/              # @variscout/core - Pure logic (stats, parser, tier, glossary)
│   ├── charts/            # @variscout/charts - Props-based Visx chart components
│   ├── data/              # @variscout/data - Sample datasets with pre-computed chart data
│   ├── hooks/             # @variscout/hooks - Shared React hooks (filter navigation, scale, tracking)
│   └── ui/                # @variscout/ui - Shared UI components, colors, and hooks
├── apps/
│   ├── pwa/               # PWA website (React + Vite + PWA)
│   ├── azure/             # Azure Team App (EasyAuth + OneDrive sync)
│   └── website/           # Marketing website (Astro + React Islands)
├── docs/
│   ├── 01-vision/         # Product philosophy, Four Lenses, Two Voices
│   ├── 02-journeys/       # User research, personas, flows
│   ├── 03-features/       # Feature documentation (analysis, workflows, data, navigation)
│   ├── 04-cases/          # Case studies with demo data
│   ├── 05-technical/      # Technical architecture and implementation
│   ├── 06-design-system/  # Design tokens, components, charts
│   ├── 07-decisions/      # Architecture Decision Records
│   └── 08-products/       # Product specs (Azure, PWA, Website)
├── pnpm-workspace.yaml    # Workspace configuration
├── tsconfig.base.json     # Shared TypeScript config
└── package.json           # Root scripts
```

> **Detailed monorepo documentation:** [Monorepo Architecture](architecture/monorepo.md)

## 2. High-Level Stack

- **Runtime**: Progressive Web App (PWA) with Service Worker
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first)
- **Visualization**: [Visx](https://airbnb.io/visx/) (Low-level D3 primitives for React) via `@variscout/charts`
- **Shared Logic**: `@variscout/core` package (stats, parser, tier, glossary)
- **Persistence**: IndexedDB + OneDrive sync (Azure App), session-only (PWA)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox
- **Marketing Website**: [Astro 5](https://astro.build/) with React Islands (chart demos)
- **Package Manager**: [pnpm](https://pnpm.io/) with workspaces

## 3. Package Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  APPS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│         @variscout/pwa             │        @variscout/azure-app            │
│        (apps/pwa/)                 │       (apps/azure/)                    │
│  ┌──────────┐ ┌──────┐ ┌────────┐  │  ┌──────────┐ ┌────────┐ ┌─────────┐  │
│  │Components│ │Context│ │Session │  │  │Components│ │EasyAuth│ │Sync(IDB)│  │
│  │(Mobile)  │ │(Data) │ │ only   │  │  │(Editor)  │ │(SSO)   │ │+OneDrive│  │
│  └────┬─────┘ └───┬───┘ └───┬────┘  │  └────┬─────┘ └───┬────┘ └────┬────┘  │
│       └───────────┼─────────┘       │       └───────────┼───────────┘       │
│                   │                 │                    │                   │
└───────────────────┼─────────────────┴────────────────────┼───────────────────┘
                    │                                      │
                    ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PACKAGES                                        │
├─────────────────────────────────────┬───────────────────────────────────────┤
│         @variscout/charts           │          @variscout/core              │
│       (packages/charts/)            │        (packages/core/)               │
│                                     │                                       │
│  IChart │ Boxplot │ ParetoChart     │  stats/   │ parser/   │ tier.ts      │
│  CapabilityHistogram │ responsive   │  glossary │ export.ts │ types.ts     │
├─────────────────────────────────────┼───────────────────────────────────────┤
│          @variscout/hooks           │          @variscout/data              │
│         (packages/hooks/)           │         (packages/data/)              │
│                                     │                                       │
│  useChartScale │ useFilterNavigation│  coffee │ journey │ bottleneck       │
│  useVariationTracking │ useTier     │  sachets │ pre-computed chart data   │
├─────────────────────────────────────┼───────────────────────────────────────┤
│          @variscout/ui                                                      │
│         (packages/ui/)                                                      │
│  AnovaResults │ FilterBreadcrumb │ FilterChipDropdown │ RegressionPanel    │
│  PerformanceSetupPanel │ VariationBar │ YAxisPopover │ TierBadge          │
│  UpgradePrompt │ ChartCard │ ColumnMapping │ HelpTooltip │ colors         │
└─────────────────────────────────────────────────────────────────────────────┘

```

### @variscout/core

Pure TypeScript logic with no React dependencies:

| Module          | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `stats/`        | Mean, StdDev, UCL/LCL, Cp, Cpk, conformance, factor grouping, staged stats |
| `parser/`       | CSV/Excel file parsing, validation, keyword detection                      |
| `tier.ts`       | Tier configuration (Azure Marketplace licensing, channel limits)           |
| `navigation.ts` | Navigation types and utilities (FilterAction, BreadcrumbItem)              |
| `variation/`    | Cumulative variation tracking (η² cascading, drill suggestions)            |
| `glossary/`     | Glossary terms and type definitions for help tooltips                      |
| `export.ts`     | CSV export utilities                                                       |
| `types.ts`      | Shared TypeScript interfaces (StatsResult, LicenseTier, etc.)              |

### @variscout/charts

Props-based React components using Visx for data visualization:

| Module                    | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `IChart.tsx`              | Individual control chart with `IChartBase` export               |
| `Boxplot.tsx`             | Factor comparison with `BoxplotBase` export (`showViolin` prop) |
| `ParetoChart.tsx`         | Frequency analysis with `ParetoChartBase` export                |
| `CapabilityHistogram.tsx` | Distribution histogram with spec limits                         |
| `ProbabilityPlot.tsx`     | Normal probability plot with CI bands                           |
| `ChartSourceBar.tsx`      | Branding footer component                                       |
| `responsive.ts`           | `getResponsiveMargins`, `getResponsiveFonts`                    |
| `types.ts`                | Chart prop interfaces, `calculateBoxplotStats()`                |

### @variscout/data

Pre-computed sample datasets for the marketing website's React Islands. Provides ready-to-render chart data without runtime computation.

| Module         | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| `samples/*.ts` | Individual sample datasets (coffee, journey, bottleneck) |
| `types.ts`     | SampleDataset interface definition                       |
| `index.ts`     | `getSample()` helper and sample registry                 |

Each sample exports:

- `rawData` - Original records
- `stats` - Pre-calculated StatsResult
- `specs` - USL/LSL/Target
- `ichartData` - Pre-formatted IChartPoint[]
- `boxplotData` - Pre-calculated BoxplotGroup[]
- `paretoData` - Pre-aggregated ParetoItem[]

**Usage:**

```typescript
import { getSample } from '@variscout/data';

const sample = getSample('coffee');
// Use sample.ichartData, sample.boxplotData, etc.
```

### @variscout/ui

Shared UI component library for PWA and Azure apps.

- **Stack**: React + Tailwind CSS + Radix UI + Lucide React.
- **Goal**: Ensure consistent design system implementation across web properties.
- **Components**: `AnovaResults`, `FilterBreadcrumb`, `FilterChipDropdown`, `PerformanceSetupPanelBase`, `RegressionPanelBase`, `VariationBar`, `YAxisPopover`, `ChartCard`, `ColumnMapping`, `MeasureColumnSelector`, `PerformanceDetectedModal`, `DataQualityBanner`, `HelpTooltip`, `SelectionPanel`, `CreateFactorModal`, `TierBadge`, `UpgradePrompt`.
- **Hooks**: `useIsMobile`, `useGlossary`.
- **Services**: `errorService`.

### @variscout/hooks

Shared React hooks for cross-platform functionality:

| Hook                        | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `useChartScale`             | Calculate Y-axis range from data, specs, and axis settings    |
| `useFilterNavigation`       | Filter navigation with multi-select and filter chip support   |
| `useVariationTracking`      | Cumulative η² tracking + filter chip data with contribution % |
| `useKeyboardNavigation`     | Arrow key navigation and focus management                     |
| `useResponsiveChartMargins` | Dynamic chart margins based on container width                |
| `useDataState`              | Shared DataContext state management                           |
| `useDataIngestion`          | File upload and data parsing                                  |
| `useTier`                   | License tier state and limits (Azure Marketplace)             |
| `useAvailableOutcomes`      | Available outcome columns for analysis                        |
| `useAvailableStageColumns`  | Available stage columns for staged analysis                   |
| `useChartNavigation`        | Chart tab navigation and ordering                             |
| `useClipboardCopy`          | Clipboard copy with feedback                                  |
| `useColumnClassification`   | Column type classification for regression                     |
| `useRegressionState`        | Regression analysis mode and state management                 |

**Key types:**

| Type                        | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `FilterChipData`            | Filter chip data with contribution % and available values      |
| `UseFilterNavigationReturn` | Return type including `updateFilterValues()`, `removeFilter()` |
| `VariationTrackingResult`   | Return type including `filterChipData`                         |
| `UseTierResult`             | Tier info, validation functions, warning messages              |

**Usage:**

```typescript
import {
  useFilterNavigation,
  useVariationTracking,
  useChartScale,
  useTier,
  type FilterChipData,
} from '@variscout/hooks';
```

### Internationalization (i18n)

Implemented using `i18next` and `react-i18next`.

- **Strategy**: Per-app configuration (isolated/bundled JSON files).
- **Languages**: English (`en`), Finnish (`fi`).
- **Detection**: Browser language detection with fallback to English.

### @variscout/pwa

React application with PWA capabilities:

| Module                            | Purpose                         |
| --------------------------------- | ------------------------------- |
| `context/DataContext.tsx`         | Centralized state management    |
| `components/Dashboard.tsx`        | Main 3-chart layout             |
| `components/FilterBreadcrumb.tsx` | Breadcrumb navigation component |
| `components/Mobile*.tsx`          | Mobile-optimized components     |
| `hooks/useFilterNavigation.ts`    | Filter navigation hook          |
| `lib/persistence.ts`              | IndexedDB + localStorage        |
| `hooks/useResponsive*.ts`         | Responsive sizing hooks         |

### @variscout/azure-app

Cloud-connected team application:

| Module                    | Purpose                                |
| ------------------------- | -------------------------------------- |
| `src/auth/easyAuth.ts`    | App Service EasyAuth helper (SSO)      |
| `src/services/storage.ts` | Offline-first storage + OneDrive sync  |
| `src/context/DataContext` | Central state management (mirrors PWA) |
| `src/components/Editor`   | Main editor with data panel + charts   |

### @variscout/website

Marketing and education website (Astro 5 + React 19 Islands):

| Module                         | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `src/data/toolsData.ts`        | 7 tool page definitions (slug, lens, content)        |
| `src/data/learnData.ts`        | 11 learn topic definitions with visual sections      |
| `src/data/glossaryData.ts`     | ~26 glossary terms extending @variscout/core         |
| `src/i18n/ui.ts`               | Translation strings for 5 languages (en/de/es/fr/pt) |
| `src/i18n/utils.ts`            | getLangFromUrl(), useTranslations()                  |
| `src/components/islands/`      | 9 React islands (chart demos, hydrated on scroll)    |
| `src/layouts/BaseLayout.astro` | SEO meta, OG tags, Schema.org structured data        |

Static HTML generated by Astro; React only loads for interactive chart demos via `client:visible` hydration. Content managed through TypeScript data files (no CMS). Generates 379 pages across 5 languages.

## 4. Core Modules

### 4.1 Data Context (`apps/pwa/src/context/DataContext.tsx`)

The application uses a centralized React Context to manage the entire analysis state.

- **State (`filteredData`)**: Derived from `rawData` based on active global filters.
- **Performance**: Uses `useMemo` extensively to prevent re-calculating statistics on every render.
- **Persistence**: Azure App exposes methods for IndexedDB save/load. PWA is session-only.
- **Flow**: Import → `setRawData` → `detectColumns` → `DataContext` Updates → Charts Render.

### 4.2 Statistics Engine (`packages/core/src/stats.ts`)

A tailored math library that computes quality control metrics on the fly.

- **Metrics**: Mean, StdDev, UCL/LCL (3-sigma), Cp, Cpk, Out-of-Spec %.
- **Logic**: Handles both standard (USL & LSL) and one-sided (USL or LSL only) specifications.

**Staged Statistics** (for staged I-Charts):

| Function                  | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `determineStageOrder()`   | Auto-detect numeric patterns for stage sorting  |
| `sortDataByStage()`       | Stable sort data by stage order                 |
| `calculateStatsByStage()` | Calculate per-stage statistics (UCL, Mean, LCL) |
| `getStageBoundaries()`    | Get X boundaries for chart rendering            |

### 4.3 Visualization Layer (`apps/pwa/src/components/charts/`)

Built with Visx to ensure complete control over rendering behavior and interactions.

- **I-Chart**: Time-series visualization with dynamic control limit overlays.
- **Boxplot**: Distribution analysis showing quartiles and outliers.
- **Pareto**: Factor frequency analysis.

### 4.4 Persistence Layer (`apps/pwa/src/lib/persistence.ts`)

Handles all data storage operations in the browser.

- **Analysis Storage**: Named analyses saved to IndexedDB via explicit save/load actions.
- **File Export/Import**: Download/upload `.vrs` JSON files for portability.

## 5. Data Persistence

### Azure App

- Named analyses saved to IndexedDB + synced to OneDrive
- .vrs file export/import for portability across devices/browsers
- List, load, rename, delete operations
- App starts on HomeScreen with recent analyses list

### PWA (Free)

- Session-only — data lives in React state, cleared on refresh
- No save, no IndexedDB projects, no .vrs files
- Users paste data or load samples each session
- CSV/PNG export available during session

## 6. Directory Structure

```
variscout-lite/
├── packages/
│   ├── core/                    # @variscout/core
│   │   ├── src/
│   │   │   ├── index.ts         # Barrel export
│   │   │   ├── stats/           # Statistics calculations (13 domain modules)
│   │   │   ├── parser/          # File parsing (csv, excel, detection, validation)
│   │   │   ├── variation/       # Variation tracking (drill, contributions, suggestions)
│   │   │   ├── tier.ts          # Tier configuration (Azure Marketplace)
│   │   │   ├── glossary/        # Glossary terms and types
│   │   │   ├── export.ts        # CSV export
│   │   │   └── types.ts         # Shared interfaces
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── charts/                  # @variscout/charts
│   │   ├── src/
│   │   │   ├── index.ts         # Barrel export
│   │   │   ├── IChart.tsx       # I-Chart component
│   │   │   ├── Boxplot.tsx      # Boxplot component
│   │   │   ├── ParetoChart.tsx  # Pareto chart component
│   │   │   ├── CapabilityHistogram.tsx
│   │   │   ├── ProbabilityPlot.tsx
│   │   │   ├── ChartSourceBar.tsx
│   │   │   ├── responsive.ts    # Responsive utilities
│   │   │   └── types.ts         # Chart interfaces
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── hooks/                   # @variscout/hooks
│   │   ├── src/
│   │   │   ├── index.ts         # Barrel export
│   │   │   ├── useChartScale.ts # Y-axis scale calculation
│   │   │   ├── useFilterNavigation.ts  # Filter navigation
│   │   │   ├── useVariationTracking.ts # Cumulative Total SS tracking
│   │   │   ├── useKeyboardNavigation.ts # Keyboard navigation
│   │   │   ├── useResponsiveChartMargins.ts # Responsive margins
│   │   │   ├── useResponsiveChartFonts.ts # Responsive font sizes
│   │   │   ├── useResponsiveTickCount.ts # Responsive tick counts
│   │   │   ├── useResponsiveBreakpoints.ts # Responsive breakpoints
│   │   │   ├── useDataState.ts  # Shared DataContext state
│   │   │   ├── useDataIngestion.ts # File upload and parsing
│   │   │   ├── useTier.ts       # Tier state and limits
│   │   │   ├── useColumnClassification.ts # Column type classification
│   │   │   ├── useDrillPath.ts  # Drill path state
│   │   │   ├── useMindmapState.ts # Mindmap state management
│   │   │   ├── useBoxplotData.ts # Shared d3 boxplot computation
│   │   │   ├── useIChartData.ts # Shared I-Chart data transform
│   │   │   ├── useAnnotations.ts # Chart annotation state
│   │   │   ├── useThemeState.ts # Theme state (light/dark/system)
│   │   │   ├── useControlViolations.ts # Control/spec violation computation
│   │   │   ├── useFocusedChartNav.ts # Keyboard chart focus navigation
│   │   │   ├── useHighlightFade.ts # Highlight fade animation
│   │   │   ├── useResizablePanel.ts # Resizable panel state
│   │   │   └── useDataTablePagination.ts # Data table pagination
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                      # @variscout/ui
│       ├── src/
│       │   ├── index.ts         # Barrel export
│       │   ├── colors.ts        # UI color constants (statusColors)
│       │   ├── hooks/           # useMediaQuery, useGlossary
│       │   ├── services/        # errorService
│       │   ├── styles/          # theme.css, components.css
│       │   ├── components/      # Shared UI components
│       │   │   ├── AnovaResults/
│       │   │   ├── FilterBreadcrumb/
│       │   │   ├── FilterChipDropdown/
│       │   │   ├── FilterContextBar/
│       │   │   ├── PerformanceSetupPanel/
│       │   │   ├── VariationBar/
│       │   │   ├── YAxisPopover/
│       │   │   ├── UpgradePrompt/
│       │   │   ├── ChartCard/
│       │   │   ├── ColumnMapping/
│       │   │   ├── HelpTooltip/
│       │   │   ├── DashboardBase/  # FocusedViewOverlay, FocusedChartCard,
│       │   │   │                   # DashboardChartCard, DashboardGrid
│       │   │   ├── StatsPanelBase/
│       │   │   ├── MindmapWindow/
│       │   │   ├── MindmapPanel/
│       │   │   ├── WhatIfSimulator/
│       │   │   ├── WhatIfPage/
│       │   │   ├── ErrorBoundary/
│       │   │   ├── AxisEditor/
│       │   │   ├── FactorSelector/
│       │   │   ├── SpecsPopover/
│       │   │   ├── SpecEditor/
│       │   │   ├── CapabilityHistogram/
│       │   │   ├── ProbabilityPlot/
│       │   │   ├── BoxplotDisplayToggle/
│       │   │   ├── ChartAnnotationLayer/
│       │   │   ├── AnnotationContextMenu/
│       │   │   ├── DataTable/
│       │   │   ├── ChartDownloadMenu/
│       │   │   ├── SelectionPanel/
│       │   │   ├── CreateFactorModal/
│       │   │   ├── PasteScreen/
│       │   │   ├── ManualEntry/
│       │   │   ├── Slider/
│       │   │   └── ...
│       │   └── lib/utils.ts     # Utility functions (cn)
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── pwa/                     # @variscout/pwa
│   │   ├── public/              # Static assets, PWA icons
│   │   ├── src/
│   │   │   ├── components/      # UI Components
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── MobileDashboard.tsx
│   │   │   │   ├── MobileStatsPanel.tsx
│   │   │   │   ├── MobileMenu.tsx
│   │   │   │   ├── views/       # Extracted view components
│   │   │   │   └── charts/      # Chart wrappers (use @variscout/charts)
│   │   │   ├── context/         # DataContext
│   │   │   ├── lib/             # PWA utilities (persistence)
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── dist/                # PWA build output (gitignored)
│   │
│   └── azure/                   # @variscout/azure-app
│       ├── src/
│       │   ├── components/      # UI components (Editor, FilterBreadcrumb, etc.)
│       │   ├── context/         # DataContext (mirrors PWA)
│       │   ├── services/        # Offline-first storage + OneDrive sync
│       │   ├── auth/            # EasyAuth configuration
│       │   └── lib/             # Utilities
│       ├── vite.config.ts
│       └── package.json
│
├── docs/                        # Documentation
│   ├── 01-vision/               # Product philosophy, Four Lenses, Two Voices
│   ├── 02-journeys/             # User research, personas, flows
│   ├── 03-features/             # Feature documentation
│   ├── 04-cases/                # Case studies with demo data
│   ├── 05-technical/            # Technical architecture and implementation
│   ├── 06-design-system/        # Design tokens, components, charts
│   ├── 07-decisions/            # Architecture Decision Records
│   └── 08-products/             # Product specs (Azure, Excel, PWA, Website)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json                 # Root scripts
```

## 7. PWA & Offline Capability

The app uses `vite-plugin-pwa` to generate a Service Worker that:

- **Precaches** all static assets (JS, CSS, HTML, icons)
- **Enables offline use** after the first visit
- **Auto-updates** when new versions are deployed

The PWA runs as a browser-only tool (no installation). See [ADR-012](../07-decisions/adr-012-pwa-browser-only.md).

## 8. Responsive Architecture

The app supports screens from 320px to desktop with a comprehensive responsive system:

### Mobile Components

| Component          | File                                           | Purpose                                                 |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------- |
| `MobileDashboard`  | `apps/pwa/src/components/MobileDashboard.tsx`  | Tab-based chart view with swipe navigation              |
| `MobileStatsPanel` | `apps/pwa/src/components/MobileStatsPanel.tsx` | Full-screen stats with Summary/Histogram/Prob Plot tabs |
| `MobileMenu`       | `apps/pwa/src/components/MobileMenu.tsx`       | Dropdown menu for overflow toolbar actions              |

### Responsive Hooks

| Hook                        | Package / Location | Purpose                                        |
| --------------------------- | ------------------ | ---------------------------------------------- |
| `useResponsiveChartMargins` | `@variscout/hooks` | Dynamic chart margins based on container width |
| `useResponsiveChartFonts`   | `@variscout/hooks` | Scaled font sizes for chart labels             |
| `useResponsiveTickCount`    | `@variscout/hooks` | Optimal tick count for axis length             |
| `useMediaQuery`             | `@variscout/ui`    | Generic media query hook                       |
| `useIsMobile`               | `@variscout/ui`    | Mobile breakpoint detection (< 640px)          |

### Layout Detection

Components use `window.innerWidth` with resize listeners to conditionally render:

- `Dashboard.tsx`: Renders `MobileDashboard` below 640px
- `SpecEditor.tsx`: Renders as bottom sheet below 640px
- `AppHeader.tsx`: Shows mobile menu button below 640px

## 9. Theme System

VariScout supports light/dark theming for paid tiers via a coordinated system:

### Theme Detection

Theme is controlled via the `data-theme` attribute on `<html>`:

- `data-theme="dark"` - Dark mode (default for free tier)
- `data-theme="light"` - Light mode (paid tiers: Individual/Team/Enterprise)

### Chart Theme Hook

Charts use `useChartTheme` from `@variscout/charts` to get theme-aware colors:

```typescript
import { useChartTheme } from '@variscout/charts';

const MyChart = () => {
  const { isDark, chrome, fontScale } = useChartTheme();

  // chrome.gridLine, chrome.axisPrimary, etc. adjust automatically
};
```

### Color Architecture

| Layer         | Location                                | Purpose                   |
| ------------- | --------------------------------------- | ------------------------- |
| Theme Context | `apps/pwa/src/context/ThemeContext.tsx` | User preference storage   |
| Tier Gate     | `packages/core/src/tier.ts`             | `isPaidTier()` check      |
| Chart Colors  | `packages/charts/src/colors.ts`         | `getChromeColors(isDark)` |
| Theme Hook    | `packages/charts/src/useChartTheme.ts`  | Reactive theme state      |

### Chrome Colors

UI chrome (axes, labels, grid lines) uses theme-aware colors via `getChromeColors()`:

| Property       | Dark      | Light     |
| -------------- | --------- | --------- |
| `gridLine`     | `#1e293b` | `#f1f5f9` |
| `axisPrimary`  | `#94a3b8` | `#64748b` |
| `labelPrimary` | `#cbd5e1` | `#334155` |

Data colors (`chartColors.pass`, `chartColors.fail`, etc.) remain constant across themes.

## 10. Building & Deployment

All apps build as static sites. See [Deployment Guide](implementation/deployment.md) for build commands, environment variables, publication processes, and per-platform deployment targets.

## 11. Variation Tracking Architecture

VariScout implements **cumulative variation tracking** to help users identify the most impactful factors during drill-down analysis. This feature is shared across all platforms.

### Core Concept

When drilling down through factors, variation percentages (η² / eta-squared) are **multiplied** to show the cumulative impact. For example:

- Root: 100% of variation
- Drill to "Night Shift" (65% η²): 65% of total variation explained
- Drill to "Machine C" (71% η²): 65% × 71% = 46% cumulative

### Shared Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          @variscout/core                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  variation/                                                            │   │
│  │  ├─ calculateDrillVariation()  → cumulative η² through drill path    │   │
│  │  ├─ calculateFactorVariations() → η² for each factor (suggestions)   │   │
│  │  ├─ shouldHighlightDrill()     → threshold check (≥50%)              │   │
│  │  └─ applyFilters()             → utility for filtering data          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  navigation.ts                                                        │   │
│  │  ├─ VARIATION_THRESHOLDS       → 50% high, 30% moderate              │   │
│  │  ├─ getVariationImpactLevel()  → 'high' | 'moderate' | 'low'         │   │
│  │  └─ getVariationInsight()      → plain-language insight text         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│    PWA                    │   │    Azure App              │
│                           │   │                           │
│ useVariationTracking      │   │ useVariationTracking      │
│       ↓                   │   │       ↓                   │
│ FilterBreadcrumb          │   │ FilterBreadcrumb          │
│ (cumulative %)            │   │ (cumulative %)            │
└───────────────────────────┘   └───────────────────────────┘
```

### Platform-Specific Implementation

| Platform  | Feature                           | Implementation                                   |
| --------- | --------------------------------- | ------------------------------------------------ |
| **PWA**   | Full breadcrumb with cumulative % | `useVariationTracking` hook → `FilterBreadcrumb` |
| **PWA**   | Filter suggestions on boxplot     | `factorVariations` → `Boxplot.tsx`               |
| **Azure** | Full breadcrumb with cumulative % | `useVariationTracking` hook → `FilterBreadcrumb` |

### Visual Indicators

| Variation | Color  | Meaning                               |
| --------- | ------ | ------------------------------------- |
| ≥50%      | Red    | High impact - "drill here" suggestion |
| 30-50%    | Yellow | Moderate impact - worth investigating |
| <30%      | Gray   | Low impact - consider other factors   |

### Boxplot Integration

The `@variscout/charts` `BoxplotBase` component accepts optional `variationPct` prop:

- Displays factor name + percentage on x-axis label
- Shows "↓ drill here" indicator when `variationPct ≥ variationThreshold`
- Red highlighting for high-impact factors

## 12. Teams SDK Integration (Azure App)

The Azure app detects whether it's running inside Microsoft Teams and adapts behavior:

```
app.initialize() → app.getContext()
├── Success → Teams mode (isTeams: true)
│   ├── channelTab → show channel name in header
│   ├── personalTab → personal tab UX
│   └── SSO token via authentication.getAuthToken()
└── Failure → Browser mode (existing EasyAuth flow)
```

### Context Detection

**Key module**: `apps/azure/src/teams/teamsContext.ts`

| Concept             | Implementation                                                   |
| ------------------- | ---------------------------------------------------------------- |
| Context detection   | `initTeams()` — called on app startup, caches result             |
| React hook          | `useTeamsContext()` — provides context + loading state           |
| SSO token           | `getTeamsSsoToken()` — client-side token (not Graph-ready)       |
| Tab configuration   | `TeamsTabConfig.tsx` — shown when adding channel tab             |
| Manifest generation | `AdminTeamsSetup.tsx` — generates `.zip` with `configurableTabs` |

**Plan gating**: `VITE_VARISCOUT_PLAN` env var (`'standard'` or `'team'`) controls feature availability. The Teams SDK initializes regardless of plan (the app works as a tab in either), but Team-plan-only features (channel storage, photos) check `isTeamPlan()` from `@variscout/core/tier`.

**CSP**: `frame-ancestors` updated in `server.js` to allow Teams iframe embedding (`teams.microsoft.com`, `*.teams.microsoft.com`, `*.skype.com`).

### OBO Token Exchange

`apps/azure/src/auth/graphToken.ts` implements a token exchange chain for Graph API access:

```
Teams SSO token → Azure Function OBO exchange → Graph API token
                         ↓ (if fails)
                  EasyAuth redirect fallback
```

The Azure Function (`infra/functions/token-exchange/index.js`) is a single-purpose token exchange with no stored state. Scopes: `User.Read` + `Files.ReadWrite.All`.

### Channel Drive Resolution

`apps/azure/src/teams/channelDrive.ts` resolves the SharePoint document library for a channel:

- Graph API call: `GET /teams/{teamId}/channels/{channelId}/filesFolder`
- Returns drive ID + root folder path
- Result cached in IndexedDB to avoid repeated Graph calls
- `StorageLocation` type (`'personal' | 'team'`) routes to correct storage

### Photo Pipeline

Client-side photo processing chain:

| Module                | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `photoProcessing.ts`  | Camera capture and image preprocessing            |
| `exifStrip.ts`        | Byte-level EXIF/GPS metadata stripping (23 tests) |
| `photoUpload.ts`      | Upload to OneDrive or SharePoint via Graph API    |
| `usePhotoComments.ts` | React hook for photo attachment state in findings |

Photos are immutable once uploaded (no edit/delete). Thumbnails (~50KB base64) embedded in `.vrs` files for cross-user visibility.

### Deep Links and Sharing

| Module             | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `deepLinks.ts`     | Build and parse deep link URLs for charts/findings      |
| `useTeamsShare.ts` | Wraps `sharing.shareWebContent` + `pages.shareDeepLink` |
| `shareContent.ts`  | Finding/chart payload builders for share dialog         |

### User Identity

`getCurrentUser.ts` extracts user identity from the Teams JWT (UPN claim) with EasyAuth fallback. Enables author tracking on findings and comments.

See [ADR-016](../07-decisions/adr-016-teams-integration.md) for the full Teams integration design.

## 13. Performance Budget

| Metric              | Budget          |
| ------------------- | --------------- |
| Initial bundle      | < 200KB gzipped |
| Total app size      | < 700KB         |
| LCP                 | < 2.5s          |
| FID                 | < 100ms         |
| CLS                 | < 0.1           |
| Time to Interactive | < 3s            |

## 14. Browser Support

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 90+             |
| Safari  | 14+             |
| Edge    | 90+             |

### Required APIs

- IndexedDB (analysis storage)
- Service Workers (offline capability)
- ES2020+
