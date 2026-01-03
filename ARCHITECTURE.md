# VariScout Lite: Architecture Overview

VariScout Lite is designed as a **browser-first**, **offline-capable** Progressive Web App (PWA) for manufacturing variation analysis. It prioritizes data privacy (no cloud) and works on any device.

## 1. Repository Structure

VariScout Lite uses a **pnpm workspaces monorepo** to support multiple applications from shared code:

```
variscout-lite/
├── packages/
│   ├── core/              # @variscout/core - Pure logic (stats, parser, license)
│   └── charts/            # @variscout/charts - Props-based Visx chart components
├── apps/
│   ├── pwa/               # PWA website (React + Vite + PWA)
│   └── excel-addin/       # Excel Add-in (Office.js + React + Fluent UI)
├── docs/
│   ├── concepts/          # Strategic product decisions
│   ├── design-system/     # Design tokens, components, charts
│   ├── technical/         # Implementation guides
│   └── products/          # Product specs (PWA, Website, Excel, Power BI, Azure)
├── pnpm-workspace.yaml    # Workspace configuration
├── tsconfig.base.json     # Shared TypeScript config
└── package.json           # Root scripts
```

> **Detailed monorepo documentation:** [docs/MONOREPO_ARCHITECTURE.md](docs/MONOREPO_ARCHITECTURE.md)

## 2. High-Level Stack

- **Runtime**: Progressive Web App (PWA) with Service Worker
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first), [Fluent UI](https://developer.microsoft.com/en-us/fluentui) (Excel Add-in)
- **Visualization**: [Visx](https://airbnb.io/visx/) (Low-level D3 primitives for React) via `@variscout/charts`
- **Shared Logic**: `@variscout/core` package (stats, parser, license)
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
└───────────────────┼─────────────────┴────────────────────┼───────────────────┘
                    │                                      │
                    ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PACKAGES                                        │
├─────────────────────────────────────┬───────────────────────────────────────┤
│         @variscout/charts           │          @variscout/core              │
│       (packages/charts/)            │        (packages/core/)               │
│                                     │                                       │
│  IChart │ Boxplot │ ParetoChart     │  stats.ts │ parser.ts │ license.ts   │
│  CapabilityHistogram │ responsive   │  edition.ts │ export.ts │ types.ts   │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

### @variscout/core

Pure TypeScript logic with no React dependencies:

| Module       | Purpose                                                       |
| ------------ | ------------------------------------------------------------- |
| `stats.ts`   | Mean, StdDev, UCL/LCL, Cp, Cpk, conformance, factor grouping  |
| `parser.ts`  | CSV/Excel file parsing                                        |
| `license.ts` | License key validation (offline)                              |
| `edition.ts` | Edition configuration (community/itc/licensed)                |
| `export.ts`  | CSV export utilities                                          |
| `types.ts`   | Shared TypeScript interfaces (StatsResult, ConformanceResult) |

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

### @variscout/pwa

React application with PWA capabilities:

| Module                     | Purpose                      |
| -------------------------- | ---------------------------- |
| `context/DataContext.tsx`  | Centralized state management |
| `components/Dashboard.tsx` | Main 3-chart layout          |
| `components/Mobile*.tsx`   | Mobile-optimized components  |
| `lib/persistence.ts`       | IndexedDB + localStorage     |
| `hooks/useResponsive*.ts`  | Responsive sizing hooks      |

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

## 4. Core Modules

### 4.1 Data Context (`apps/pwa/src/context/DataContext.tsx`)

The application uses a centralized React Context to manage the entire analysis state.

- **State (`filteredData`)**: Derived from `rawData` based on active global filters.
- **Performance**: Uses `useMemo` extensively to prevent re-calculating statistics on every render.
- **Persistence**: Auto-saves to localStorage, exposes methods for IndexedDB project management.
- **Flow**: Import → `setRawData` → `detectColumns` → `DataContext` Updates → Charts Render.

### 4.2 Statistics Engine (`packages/core/src/stats.ts`)

A tailored math library that computes quality control metrics on the fly.

- **Metrics**: Mean, StdDev, UCL/LCL (3-sigma), Cp, Cpk, Out-of-Spec %.
- **Logic**: Handles both standard (USL & LSL) and one-sided (USL or LSL only) specifications.

### 4.3 Visualization Layer (`apps/pwa/src/components/charts/`)

Built with Visx to ensure complete control over rendering behavior and interactions.

- **I-Chart**: Time-series visualization with dynamic control limit overlays.
- **Boxplot**: Distribution analysis showing quartiles and outliers.
- **Pareto**: Factor frequency analysis.

### 4.4 Persistence Layer (`apps/pwa/src/lib/persistence.ts`)

Handles all data storage operations in the browser.

- **Auto-save**: Debounced saves to localStorage on every state change.
- **Project Storage**: Named projects saved to IndexedDB for larger datasets.
- **File Export/Import**: Download/upload `.vrs` JSON files for portability.

## 5. Data Persistence

### Auto-Save (localStorage)

- Current session auto-saved every second (debounced)
- Automatically restores on page reload
- Provides session recovery if browser closes unexpectedly

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
│   │   │   ├── license.ts       # License validation
│   │   │   ├── edition.ts       # Edition configuration
│   │   │   ├── export.ts        # CSV export
│   │   │   └── types.ts         # Shared interfaces
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── charts/                  # @variscout/charts
│       ├── src/
│       │   ├── index.ts         # Barrel export
│       │   ├── IChart.tsx       # I-Chart component
│       │   ├── Boxplot.tsx      # Boxplot component
│       │   ├── ParetoChart.tsx  # Pareto chart component
│       │   ├── CapabilityHistogram.tsx
│       │   ├── ProbabilityPlot.tsx
│       │   ├── ChartSourceBar.tsx
│       │   ├── responsive.ts    # Responsive utilities
│       │   └── types.ts         # Chart interfaces
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
│   └── excel-addin/             # @variscout/excel-addin
│       ├── src/
│       │   ├── taskpane/        # Task Pane UI (sidebar)
│       │   │   └── TaskPane.tsx # 4-step setup wizard
│       │   ├── content/         # Content Add-in (embedded)
│       │   │   └── ContentApp.tsx
│       │   ├── utils/           # Excel integration utilities
│       │   │   ├── stateBridge.ts
│       │   │   ├── tableManager.ts
│       │   │   ├── slicerManager.ts
│       │   │   └── dataFilter.ts
│       │   └── commands/        # Excel ribbon commands
│       ├── manifest.xml         # Office Add-in manifest
│       ├── vite.config.ts
│       ├── package.json
│       └── dist/                # Add-in build output (gitignored)
│
├── docs/                        # Documentation
│   ├── concepts/                # Strategic product decisions
│   ├── design-system/           # Design tokens, components, charts
│   ├── technical/               # Implementation guides
│   └── products/                # Product specs (PWA, Website, Excel, Power BI, Azure)
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

| Hook                        | File                                              | Purpose                                        |
| --------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| `useResponsiveChartMargins` | `apps/pwa/src/hooks/useResponsiveChartMargins.ts` | Dynamic chart margins based on container width |
| `useResponsiveChartFonts`   | `apps/pwa/src/hooks/useResponsiveChartMargins.ts` | Scaled font sizes for chart labels             |
| `useResponsiveTickCount`    | `apps/pwa/src/hooks/useResponsiveChartMargins.ts` | Optimal tick count for axis length             |

### Layout Detection

Components use `window.innerWidth` with resize listeners to conditionally render:

- `Dashboard.tsx`: Renders `MobileDashboard` below 640px
- `SpecEditor.tsx`: Renders as bottom sheet below 640px
- `AppHeader.tsx`: Shows mobile menu button below 640px

## 9. Building & Deployment

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

### Edition-Specific Builds

```bash
pnpm build:pwa:community    # Free with "VariScout Lite" branding
pnpm build:pwa:itc          # ITC-branded version
pnpm build:pwa:licensed     # No branding (pre-licensed)
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

## 10. Excel Add-in Architecture

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

> **See also:** [docs/concepts/EXCEL_ADDIN_STRATEGY.md](docs/concepts/EXCEL_ADDIN_STRATEGY.md) for the full strategic analysis.

## 11. Performance Budget

| Metric              | Budget          |
| ------------------- | --------------- |
| Initial bundle      | < 200KB gzipped |
| Total app size      | < 700KB         |
| LCP                 | < 2.5s          |
| FID                 | < 100ms         |
| CLS                 | < 0.1           |
| Time to Interactive | < 3s            |

## 12. Browser Support

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 90+             |
| Safari  | 14+             |
| Edge    | 90+             |

### Required APIs

- IndexedDB (project storage)
- Service Workers (offline capability)
- Web Crypto API (license validation)
- ES2020+
