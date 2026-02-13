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
│   ├── azure/             # Azure Team App (React + MSAL + Azure Functions)
│   ├── website/           # Marketing website (Astro + React Islands)
│   └── excel-addin/       # Excel Add-in (Office.js + React + Fluent UI)
├── docs/
│   ├── 01-vision/         # Product philosophy, Four Pillars, Two Voices
│   ├── 02-journeys/       # User research, personas, flows
│   ├── 03-features/       # Feature documentation (analysis, workflows, data, navigation)
│   ├── 04-cases/          # Case studies with demo data
│   ├── 05-technical/      # Technical architecture and implementation
│   ├── 06-design-system/  # Design tokens, components, charts
│   ├── 07-decisions/      # Architecture Decision Records
│   └── 08-products/       # Product specs (Azure, Excel, PWA, Website, Power BI)
├── pnpm-workspace.yaml    # Workspace configuration
├── tsconfig.base.json     # Shared TypeScript config
└── package.json           # Root scripts
```

> **Detailed monorepo documentation:** [Monorepo Architecture](architecture/monorepo.md)

## 2. High-Level Stack

- **Runtime**: Progressive Web App (PWA) with Service Worker
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first), [Fluent UI](https://developer.microsoft.com/en-us/fluentui) (Excel Add-in)
- **Visualization**: [Visx](https://airbnb.io/visx/) (Low-level D3 primitives for React) via `@variscout/charts`
- **Shared Logic**: `@variscout/core` package (stats, parser, tier, glossary)
- **Persistence**: IndexedDB + localStorage (PWA), Custom Document Properties (Excel)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox
- **Excel Integration**: [Office.js](https://learn.microsoft.com/en-us/office/dev/add-ins/) for Excel Add-in
- **Package Manager**: [pnpm](https://pnpm.io/) with workspaces

## 3. Package Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  APPS                                        │
├────────────────────────────────────┬────────────────────────────────────────┤
│         @variscout/pwa             │        @variscout/excel-addin          │
│        (apps/pwa/)                 │       (apps/excel-addin/)              │
│  ┌──────────┐ ┌──────┐ ┌────────┐  │  ┌──────────┐ ┌─────────┐ ┌─────────┐  │
│  │Components│ │Context│ │Persist │  │  │TaskPane  │ │Content  │ │Office.js│  │
│  │(Mobile)  │ │(Data) │ │(IDB)   │  │  │(Wizard)  │ │(Charts) │ │(Bridge) │  │
│  └────┬─────┘ └───┬───┘ └───┬────┘  │  └────┬─────┘ └────┬────┘ └────┬────┘  │
│       └───────────┼─────────┘       │       └────────────┼───────────┘       │
│                   │                 │                    │                   │
│         @variscout/azure-app        │                    │                   │
│         (apps/azure/)               │                    │                   │
│  ┌──────────┐ ┌──────┐ ┌─────────┐  │                    │                   │
│  │Components│ │ MSAL │ │Sync(IDB)│  │                    │                   │
│  └────┬─────┘ └───┬──┘ └────┬────┘  │                    │                   │
│       └───────────┼─────────┘       │                    │                   │
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
│  IChart │ Boxplot │ ParetoChart     │  stats.ts │ parser.ts │ tier.ts      │
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
| `stats.ts`      | Mean, StdDev, UCL/LCL, Cp, Cpk, conformance, factor grouping, staged stats |
| `parser.ts`     | CSV/Excel file parsing                                                     |
| `tier.ts`       | Tier configuration (Azure Marketplace licensing, channel limits)           |
| `navigation.ts` | Navigation types and utilities (FilterAction, BreadcrumbItem)              |
| `variation.ts`  | Cumulative variation tracking (η² cascading, drill suggestions)            |
| `edition.ts`    | Edition detection (deprecated, use tier.ts for new code)                   |
| `glossary/`     | Glossary terms and type definitions for help tooltips                      |
| `export.ts`     | CSV export utilities                                                       |
| `types.ts`      | Shared TypeScript interfaces (StatsResult, LicenseTier, etc.)              |

### @variscout/charts

Props-based React components using Visx for data visualization:

| Module                    | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `IChart.tsx`              | Individual control chart with `IChartBase` export |
| `Boxplot.tsx`             | Factor comparison with `BoxplotBase` export       |
| `ParetoChart.tsx`         | Frequency analysis with `ParetoChartBase` export  |
| `CapabilityHistogram.tsx` | Distribution histogram with spec limits           |
| `ProbabilityPlot.tsx`     | Normal probability plot with CI bands             |
| `ChartSourceBar.tsx`      | Branding footer component                         |
| `responsive.ts`           | `getResponsiveMargins`, `getResponsiveFonts`      |
| `types.ts`                | Chart prop interfaces, `calculateBoxplotStats()`  |

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

Shared UI component library for PWA and Azure apps (not Excel Add-in).

- **Stack**: React + Tailwind CSS + Radix UI + Lucide React.
- **Goal**: Ensure consistent design system implementation across web properties.
- **Components**: `AnovaResults`, `FilterBreadcrumb`, `FilterChipDropdown`, `PerformanceSetupPanelBase`, `RegressionPanelBase`, `VariationBar`, `YAxisPopover`, `ChartCard`, `ColumnMapping`, `MeasureColumnSelector`, `PerformanceDetectedModal`, `DataQualityBanner`, `HelpTooltip`, `SelectionPanel`, `CreateFactorModal`, `TierBadge`, `UpgradePrompt`.
- **Hooks**: `useIsMobile`, `useGlossary`.
- **Services**: `errorService`.
- **Utilities**: `gradeColors`.

### @variscout/hooks

Shared React hooks for cross-platform functionality:

| Hook                        | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `useChartScale`             | Calculate Y-axis range from data, specs, and grades           |
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

### @variscout/excel-addin

Excel Add-in with hybrid approach (native slicers + Visx charts):

| Module                   | Purpose                                        |
| ------------------------ | ---------------------------------------------- |
| `taskpane/TaskPane.tsx`  | 4-step setup wizard (Data→Factor→Outcome→Spec) |
| `content/ContentApp.tsx` | Embedded chart panel in worksheet              |
| `utils/stateBridge.ts`   | State sync via Custom Document Properties      |
| `utils/tableManager.ts`  | Excel Table creation from data ranges          |
| `utils/slicerManager.ts` | Native slicer creation and management          |
| `utils/dataFilter.ts`    | Data filtering logic for slicer changes        |

### @variscout/azure-app

Cloud-connected team application:

| Module                    | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `src/auth/msalConfig.ts`  | Microsoft Entra ID configuration          |
| `src/services/storage.ts` | Offline-first storage service with sync   |
| `src/db/schema.ts`        | Dexie.js schema for offline data          |
| `api/projects/`           | Azure Functions for Graph API integration |

### @variscout/website

Marketing and education website (Astro 5 + React 19 Islands):

| Module                         | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `src/data/toolsData.ts`        | 7 tool page definitions (slug, pillar, content)      |
| `src/data/learnData.ts`        | 10 learn topic definitions with visual sections      |
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
- **Persistence**: Exposes methods for IndexedDB project management (explicit save/load).
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

- **Project Storage**: Named projects saved to IndexedDB via explicit save/load actions.
- **File Export/Import**: Download/upload `.vrs` JSON files for portability.

## 5. Data Persistence

The app always starts on the HomeScreen. Users must explicitly save and load projects.

### Named Projects (IndexedDB)

- Save multiple analyses with custom names
- List, load, rename, delete operations
- Handles larger datasets than localStorage

### File Export/Import (.vrs)

- Download analysis as portable JSON file
- Share analyses across devices or browsers
- Backup and restore functionality

## 6. Directory Structure

```
variscout-lite/
├── packages/
│   ├── core/                    # @variscout/core
│   │   ├── src/
│   │   │   ├── index.ts         # Barrel export
│   │   │   ├── stats.ts         # Statistics calculations
│   │   │   ├── parser.ts        # File parsing
│   │   │   ├── tier.ts          # Tier configuration (Azure Marketplace)
│   │   │   ├── edition.ts       # Edition detection (deprecated)
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
│   │   │   ├── useVariationTracking.ts # Cumulative η² tracking
│   │   │   ├── useKeyboardNavigation.ts # Keyboard navigation
│   │   │   ├── useResponsiveChartMargins.ts # Responsive margins
│   │   │   ├── useDataState.ts  # Shared DataContext state
│   │   │   ├── useDataIngestion.ts # File upload and parsing
│   │   │   ├── useTier.ts       # Tier state and limits
│   │   │   ├── useChartNavigation.ts # Chart tab navigation
│   │   │   ├── useClipboardCopy.ts # Clipboard copy
│   │   │   ├── useColumnClassification.ts # Column type classification
│   │   │   └── useRegressionState.ts # Regression analysis state
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                      # @variscout/ui
│       ├── src/
│       │   ├── index.ts         # Barrel export
│       │   ├── colors.ts        # UI color constants (gradeColors)
│       │   ├── hooks/           # useMediaQuery, useGlossary
│       │   ├── services/        # errorService
│       │   ├── components/      # Shared UI components
│       │   │   ├── AnovaResults/
│       │   │   ├── FilterBreadcrumb/
│       │   │   ├── FilterChipDropdown/
│       │   │   ├── PerformanceSetupPanel/
│       │   │   ├── RegressionPanel/
│       │   │   ├── VariationBar/
│       │   │   ├── YAxisPopover/
│       │   │   ├── TierBadge/
│       │   │   ├── UpgradePrompt/
│       │   │   ├── ChartCard/
│       │   │   ├── ColumnMapping/
│       │   │   ├── HelpTooltip/
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
│   ├── azure/                   # @variscout/azure-app
│   │   ├── src/
│   │   │   ├── components/      # UI components (Dashboard, FilterBreadcrumb, etc.)
│   │   │   ├── context/         # DataContext (mirrors PWA)
│   │   │   ├── services/        # Offline-first storage + OneDrive sync
│   │   │   ├── auth/            # MSAL configuration
│   │   │   └── lib/             # Edition detection, utilities
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── excel-addin/             # @variscout/excel-addin
│       ├── src/
│       │   ├── taskpane/        # Task Pane UI (sidebar)
│       │   │   └── TaskPane.tsx # 4-step setup wizard
│       │   ├── content/         # Content Add-in (embedded)
│       │   │   └── ContentApp.tsx
│       │   ├── lib/             # stateBridge, licenseDetection, featureLimits
│       │   └── commands/        # Excel ribbon commands
│       ├── manifest.xml         # Office Add-in manifest
│       ├── vite.config.ts
│       ├── package.json
│       └── dist/                # Add-in build output (gitignored)
│
├── docs/                        # Documentation
│   ├── 01-vision/               # Product philosophy, Four Pillars, Two Voices
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

Users can "install" the app:

- Mobile: "Add to Home Screen"
- Desktop: Browser install prompt

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

### Development

```bash
pnpm dev             # Start PWA dev server at localhost:5173
pnpm dev:excel       # Start Excel Add-in dev server at localhost:3000
```

### Production Build

```bash
pnpm build           # Build all packages and apps
pnpm build:pwa       # Build PWA only
pnpm build:excel     # Build Excel Add-in only
pnpm preview         # Preview production build locally
```

### Deployment

Both apps deploy as static sites to any hosting provider.

**PWA (Vercel Recommended):**

```bash
npx vercel
```

Deploy `apps/pwa/dist/` to any static host (Netlify, GitHub Pages, S3, etc.)

**Excel Add-in:**

Deploy `apps/excel-addin/dist/` to any HTTPS host (required for Office Add-ins). Update `manifest.xml` with production URLs.

## 11. Excel Add-in Architecture

The Excel Add-in uses a **Hybrid Approach**: native Excel slicers for filtering combined with Visx charts in a Content Add-in.

### Task Pane (Sidebar)

- 4-step setup wizard: Data Selection → Factor Config → Outcome → Spec Config
- Stats display with conformance analysis
- Chart panel with I-Chart and Boxplot
- Configurable Cpk target threshold
- Fluent UI components for native Office look

### Content Add-in (Embedded in Worksheet)

- Embedded I-Chart and Boxplot charts
- Live data filtering via native Excel slicers
- Polls for slicer changes (respects Excel Table filtering)
- Stats header with n, Mean, StdDev, Cpk

### State Bridge

Configuration is persisted in Excel document via Custom Document Properties, allowing the analysis to survive document save/reload cycles.

> **See also:** [Excel Strategy](../08-products/excel/strategy.md) for the full strategic analysis.

## 12. Variation Tracking Architecture

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
│  │  variation.ts                                                         │   │
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
┌───────────────────┐   ┌───────────────────────┐   ┌───────────────────┐
│    PWA            │   │    Excel Add-in       │   │    Azure App      │
│                   │   │                       │   │                   │
│ useVariationTracking │ │ calculateFactorVariations │ │ useVariationTracking │
│       ↓           │   │         ↓             │   │       ↓           │
│ FilterBreadcrumb  │   │    BoxplotBase        │   │ FilterBreadcrumb  │
│ (cumulative %)    │   │   (variation % label) │   │ (cumulative %)    │
└───────────────────┘   └───────────────────────┘   └───────────────────┘
```

### Platform-Specific Implementation

| Platform  | Feature                           | Implementation                                   |
| --------- | --------------------------------- | ------------------------------------------------ |
| **PWA**   | Full breadcrumb with cumulative % | `useVariationTracking` hook → `FilterBreadcrumb` |
| **PWA**   | Filter suggestions on boxplot     | `factorVariations` → `Boxplot.tsx`               |
| **Excel** | Variation % on boxplot axis label | `calculateFactorVariations` → `BoxplotBase`      |
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

- IndexedDB (project storage)
- Service Workers (offline capability)
- ES2020+
