# VariScout Lite: Monorepo Architecture

This document describes the multi-platform architecture for VariScout Lite, supporting both the PWA website and Excel Add-in from a single codebase.

## Overview

VariScout Lite uses a **pnpm workspaces monorepo** to share code between multiple applications:

```
variscout-lite/
├── packages/
│   ├── core/          # @variscout/core - Pure logic (stats, parser, license)
│   └── charts/        # @variscout/charts - Props-based Visx chart components
├── apps/
│   ├── pwa/           # PWA website (React + Vite + PWA)
│   │   └── dist/      # PWA build output
│   └── excel-addin/   # Excel Add-in (Office.js + React + Fluent UI)
│       └── dist/      # Add-in build output
└── docs/              # Documentation
```

## Why pnpm Workspaces?

| Aspect              | Benefit                                                           |
| ------------------- | ----------------------------------------------------------------- |
| **Code sharing**    | Clean package boundaries (`@variscout/core`, `@variscout/charts`) |
| **Build isolation** | Separate Vite configs for PWA vs Excel Add-in                     |
| **Dev experience**  | Hot reload per app, shared code updates propagate                 |
| **Deployment**      | Each app has its own `dist/` folder for independent deployment    |
| **Disk efficiency** | pnpm hard-links shared dependencies                               |

## Package Structure

### @variscout/core (`packages/core/`)

Pure TypeScript logic with no React dependencies. Can be used by any JavaScript/TypeScript application.

**Contents:**

- `stats.ts` - Statistical calculations (mean, stdDev, Cp, Cpk, calculateConformance, groupDataByFactor)
- `parser.ts` - CSV/Excel file parsing
- `license.ts` - License key validation (offline, checksum-based)
- `export.ts` - CSV export utilities
- `edition.ts` - Edition configuration (community/itc/licensed)
- `types.ts` - Shared TypeScript interfaces (StatsResult, ConformanceResult, SpecLimits)

**Usage:**

```typescript
import { calculateStats, calculateConformance, groupDataByFactor } from '@variscout/core';
import { parseCSV, parseExcel } from '@variscout/core';
import { isValidLicenseFormat, hasValidLicense } from '@variscout/core';
```

### @variscout/charts (`packages/charts/`)

Props-based React components using Visx for data visualization. All components accept data via props (not context), enabling use in both PWA and Excel Add-in.

**Chart Components:**

- `IChart.tsx` - Individual control chart (time series) with `IChartBase` export
- `Boxplot.tsx` - Factor comparison chart with `BoxplotBase` export
- `ParetoChart.tsx` - Frequency analysis chart with `ParetoChartBase` export
- `CapabilityHistogram.tsx` - Distribution with spec limits
- `ProbabilityPlot.tsx` - Normal probability plot
- `ChartSourceBar.tsx` - Branding footer component

**Utilities:**

- `responsive.ts` - Responsive margin/font utilities (getResponsiveMargins, getResponsiveFonts, getResponsiveTickCount)
- `types.ts` - Chart prop interfaces and `calculateBoxplotStats()` helper

**Usage:**

```typescript
// Use Base components directly with props (Excel Add-in pattern)
import { IChartBase, BoxplotBase, calculateBoxplotStats } from '@variscout/charts';

// Use responsive utilities
import { getResponsiveMargins, getResponsiveFonts } from '@variscout/charts';
```

### @variscout/pwa (`apps/pwa/`)

The Progressive Web App - mobile-first website with offline capability.

**Key Features:**

- Full mobile support (320px+)
- Offline-first with Service Worker
- IndexedDB + localStorage persistence
- Swipe navigation on mobile
- Touch-optimized (44-56px targets)

**PWA-Specific Code (not shared):**

- `context/DataContext.tsx` - React context for state management
- `components/MobileDashboard.tsx` - Tab-based mobile chart navigation
- `components/MobileStatsPanel.tsx` - Mobile stats display
- `components/MobileMenu.tsx` - Mobile overflow menu
- `lib/persistence.ts` - IndexedDB + localStorage operations

### @variscout/excel-addin (`apps/excel-addin/`)

Excel Add-in using the **Hybrid Approach**: Native Excel slicers for filtering + Visx charts in Content Add-in.

> See [Excel Add-in Strategy](concepts/EXCEL_ADDIN_STRATEGY.md) for the full strategic analysis.

**Status:** Fully implemented with Task Pane and Content Add-in

**Task Pane (sidebar UI):**

- 4-step Setup Wizard (Data Selection → Factor Config → Outcome → Spec Config)
- Stats display with conformance analysis
- Chart panel with I-Chart and Boxplot
- Configurable Cpk target threshold
- Fluent UI components for native Office look

**Content Add-in (embedded in worksheet):**

- Embedded I-Chart and Boxplot charts
- Live data filtering via native Excel slicers
- Polls for slicer changes (respects Excel Table filtering)
- Stats header with n, Mean, StdDev, Cpk

**Excel Integration Utilities:**

- `stateBridge.ts` - State sync via Custom Document Properties
- `tableManager.ts` - Excel Table creation from data ranges
- `slicerManager.ts` - Native slicer creation and management
- `dataFilter.ts` - Data filtering logic for slicer changes
- `excelData.ts` - Range reading and data extraction

**Future:**

- Copilot actions for natural language queries
- License validation (same system as PWA)

## Build Commands

```bash
# Development
pnpm dev                    # Start PWA dev server (http://localhost:5173)
pnpm dev:excel              # Start Excel Add-in dev server (https://localhost:3000)

# Production builds
pnpm build                  # Build all packages and apps
pnpm build:pwa              # Build PWA only
pnpm build:excel            # Build Excel Add-in only

# Edition-specific PWA builds
pnpm build:pwa:community    # Free with "VariScout Lite" branding
pnpm build:pwa:itc          # ITC-branded version
pnpm build:pwa:licensed     # Pre-licensed builds (no branding)

# Testing & Linting
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages
```

## Mobile Website Support

The monorepo structure **fully preserves** mobile website functionality:

| Feature              | Status             | Location                                          |
| -------------------- | ------------------ | ------------------------------------------------- |
| **MobileDashboard**  | ✅ Working         | `apps/pwa/src/components/MobileDashboard.tsx`     |
| **MobileStatsPanel** | ✅ Working         | `apps/pwa/src/components/MobileStatsPanel.tsx`    |
| **MobileMenu**       | ✅ Working         | `apps/pwa/src/components/MobileMenu.tsx`          |
| **Responsive hooks** | ✅ Working         | `apps/pwa/src/hooks/useResponsiveChartMargins.ts` |
| **PWA manifest**     | ✅ Configured      | `apps/pwa/vite.config.ts` (VitePWA plugin)        |
| **Service Worker**   | ✅ Offline-capable | Auto-generated by Workbox                         |
| **Touch targets**    | ✅ 44-56px minimum | Enforced in all mobile components                 |
| **Swipe navigation** | ✅ Working         | 50px min distance, left/right                     |

**Key design decisions:**

- Mobile components are **PWA-specific** (not shared to packages/)
- Responsive hooks use **container width** (not window width) for flexibility
- Layout detection at `640px` breakpoint (Tailwind `sm`)
- No cross-package dependencies for mobile features

## Configuration Files

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Root `package.json`

```json
{
  "name": "variscout-lite-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @variscout/pwa dev",
    "dev:excel": "pnpm --filter @variscout/excel-addin dev",
    "build": "pnpm -r build",
    "build:pwa": "pnpm --filter @variscout/pwa build",
    "build:excel": "pnpm --filter @variscout/excel-addin build",
    "build:pwa:community": "VITE_EDITION=community pnpm --filter @variscout/pwa build",
    "build:pwa:itc": "VITE_EDITION=itc pnpm --filter @variscout/pwa build",
    "build:pwa:licensed": "VITE_EDITION=licensed pnpm --filter @variscout/pwa build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  }
}
```

### `tsconfig.base.json`

Shared TypeScript configuration extended by all packages:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true
  }
}
```

## Deployment Strategy

| App                        | Hosting              | URL                                        |
| -------------------------- | -------------------- | ------------------------------------------ |
| **PWA**                    | Vercel               | variscout.com (or similar)                 |
| **Excel Add-in**           | Vercel               | variscout.com/excel/ (or separate project) |
| **Enterprise Self-Hosted** | Customer's Azure SWA | Their domain                               |

**Why Vercel for both?**

- Already using it for PWA
- Automatic HTTPS (required for Office Add-ins)
- Free tier sufficient
- Single platform to manage

## Edition System

VariScout Lite supports three editions controlled by build-time and runtime configuration:

| Edition       | Branding                            | Distribution           | Price |
| ------------- | ----------------------------------- | ---------------------- | ----- |
| **Community** | "VariScout Lite" footer             | Public web             | Free  |
| **ITC**       | "International Trade Centre" footer | ITC network            | Free  |
| **Licensed**  | No branding                         | License key activation | €39   |

**Build-time:** Set `VITE_EDITION` environment variable
**Runtime:** License key can upgrade Community → Licensed

See `packages/core/src/edition.ts` for implementation.

## Adding a New Package

1. Create directory: `packages/new-package/`
2. Add `package.json`:
   ```json
   {
     "name": "@variscout/new-package",
     "version": "1.0.0",
     "type": "module",
     "main": "./src/index.ts"
   }
   ```
3. Add `tsconfig.json` extending `tsconfig.base.json`
4. Run `pnpm install` to link the package
5. Import in other packages: `import { ... } from '@variscout/new-package'`

## Adding a New App

1. Create directory: `apps/new-app/`
2. Add `package.json` with dependencies on shared packages:
   ```json
   {
     "dependencies": {
       "@variscout/core": "workspace:*"
     }
   }
   ```
3. Add build configuration (Vite, etc.)
4. Add scripts to root `package.json`
5. Run `pnpm install`

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - High-level technical architecture
- [Excel Add-in Strategy](concepts/EXCEL_ADDIN_STRATEGY.md) - PWA vs Excel Add-in comparison, Hybrid approach decision
- [Excel Copilot Concept](concepts/EXCEL_COPILOT_CONCEPT.md) - Copilot integration vision
- [Monetization Concept](concepts/MONETIZATION_CONCEPT.md) - Business and pricing strategy
