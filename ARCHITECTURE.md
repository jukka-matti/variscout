# VariScout Lite: Architecture Overview

VariScout Lite is designed as a **browser-first**, **offline-capable** Progressive Web App (PWA) for manufacturing variation analysis. It prioritizes data privacy (no cloud) and works on any device.

## 1. Repository Structure

VariScout Lite uses a **pnpm workspaces monorepo** to support multiple applications from shared code:

```
variscout-lite/
├── packages/
│   └── core/              # @variscout/core - Pure logic (stats, parser, license)
├── apps/
│   └── pwa/               # PWA website (React + Vite + PWA)
├── docs/                  # Documentation
├── pnpm-workspace.yaml    # Workspace configuration
├── tsconfig.base.json     # Shared TypeScript config
└── package.json           # Root scripts
```

> **Detailed monorepo documentation:** [docs/MONOREPO_ARCHITECTURE.md](docs/MONOREPO_ARCHITECTURE.md)

## 2. High-Level Stack

- **Runtime**: Progressive Web App (PWA) with Service Worker
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first)
- **Visualization**: [Visx](https://airbnb.io/visx/) (Low-level D3 primitives for React)
- **Shared Logic**: `@variscout/core` package (stats, parser, license)
- **Persistence**: IndexedDB + localStorage
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox
- **Package Manager**: [pnpm](https://pnpm.io/) with workspaces

## 3. Package Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    @variscout/pwa                       │
│                   (apps/pwa/)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Components  │  │  Context    │  │  Persistence    │ │
│  │ (Charts,    │  │ (DataCtx)   │  │  (IndexedDB)    │ │
│  │  Mobile)    │  │             │  │                 │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                  │          │
│         └────────────────┼──────────────────┘          │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              @variscout/core                     │   │
│  │             (packages/core/)                     │   │
│  │                                                  │   │
│  │  stats.ts │ parser.ts │ license.ts │ edition.ts │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### @variscout/core

Pure TypeScript logic with no React dependencies:

| Module       | Purpose                                        |
| ------------ | ---------------------------------------------- |
| `stats.ts`   | Mean, StdDev, UCL/LCL, Cp, Cpk calculations    |
| `parser.ts`  | CSV/Excel file parsing                         |
| `license.ts` | License key validation (offline)               |
| `edition.ts` | Edition configuration (community/itc/licensed) |
| `export.ts`  | CSV export utilities                           |
| `types.ts`   | Shared TypeScript interfaces                   |

### @variscout/pwa

React application with PWA capabilities:

| Module                     | Purpose                      |
| -------------------------- | ---------------------------- |
| `context/DataContext.tsx`  | Centralized state management |
| `components/Dashboard.tsx` | Main 3-chart layout          |
| `components/Mobile*.tsx`   | Mobile-optimized components  |
| `lib/persistence.ts`       | IndexedDB + localStorage     |
| `hooks/useResponsive*.ts`  | Responsive sizing hooks      |

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
│   └── core/                    # @variscout/core
│       ├── src/
│       │   ├── index.ts         # Barrel export
│       │   ├── stats.ts         # Statistics calculations
│       │   ├── parser.ts        # File parsing
│       │   ├── license.ts       # License validation
│       │   ├── edition.ts       # Edition configuration
│       │   ├── export.ts        # CSV export
│       │   └── types.ts         # Shared interfaces
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   └── pwa/                     # @variscout/pwa
│       ├── public/              # Static assets, PWA icons
│       ├── src/
│       │   ├── components/      # UI Components
│       │   │   ├── Dashboard.tsx
│       │   │   ├── MobileDashboard.tsx
│       │   │   ├── MobileStatsPanel.tsx
│       │   │   ├── MobileMenu.tsx
│       │   │   └── charts/      # Chart components
│       │   ├── context/         # DataContext
│       │   ├── lib/             # PWA utilities (persistence)
│       │   ├── hooks/           # Custom hooks
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── docs/                        # Documentation
├── dist/                        # Build outputs (gitignored)
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
```

### Production Build

```bash
pnpm build           # Build all packages and apps
pnpm build:pwa       # Build PWA only
pnpm preview         # Preview production build locally
```

### Edition-Specific Builds

```bash
pnpm build:pwa:community    # Free with "VariScout Lite" branding
pnpm build:pwa:itc          # ITC-branded version
pnpm build:pwa:licensed     # No branding (pre-licensed)
```

### Deployment

The app deploys as a static site to any hosting provider.

**Vercel (Recommended):**

```bash
npx vercel
```

**Manual:**
Deploy the `apps/pwa/dist/` folder to any static host (Netlify, GitHub Pages, S3, etc.)
