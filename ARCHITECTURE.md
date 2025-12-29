# VariScout Lite: Architecture Overview

VariScout Lite is designed as a **browser-first**, **offline-capable** Progressive Web App (PWA) for manufacturing variation analysis. It prioritizes data privacy (no cloud) and works on any device.

## 1. High-Level Stack

-   **Runtime**: Progressive Web App (PWA) with Service Worker
-   **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first)
-   **Visualization**: [Visx](https://airbnb.io/visx/) (Low-level D3 primitives for React)
-   **Data Engine**: In-memory TypeScript logic (`src/logic/stats.ts`)
-   **Persistence**: IndexedDB + localStorage (`src/lib/persistence.ts`)
-   **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox

## 2. Core Modules

### 2.1 Data Context (`src/context/DataContext.tsx`)
The application uses a centralized React Context to manage the entire analysis state. This ensures that all charts and stats panels are perfectly synchronized.

-   **State (`filteredData`)**: Derived from `rawData` based on active global filters.
-   **Performance**: Uses `useMemo` extensively to prevent re-calculating statistics on every render.
-   **Persistence**: Auto-saves to localStorage, exposes methods for IndexedDB project management.
-   **Flow**: Import → `setRawData` → `detectColumns` → `DataContext` Updates → Charts Render.

### 2.2 Statistics Engine (`src/logic/stats.ts`)
A tailored math library that computes quality control metrics on the fly.
-   **Metrics**: Mean, StdDev, UCL/LCL (3-sigma), Cp, Cpk, Out-of-Spec %.
-   **Logic**: Handles both standard (USL & LSL) and one-sided (USL or LSL only) specifications.

### 2.3 Visualization Layer (`src/components/charts/`)
Built with Visx to ensure complete control over rendering behavior and interactions.
-   **I-Chart**: Time-series visualization with dynamic control limit overlays.
-   **Boxplot**: Distribution analysis showing quartiles and outliers.
-   **Pareto**: Factor frequency analysis.

### 2.4 Persistence Layer (`src/lib/persistence.ts`)
Handles all data storage operations in the browser.
-   **Auto-save**: Debounced saves to localStorage on every state change.
-   **Project Storage**: Named projects saved to IndexedDB for larger datasets.
-   **File Export/Import**: Download/upload `.vrs` JSON files for portability.

## 3. Data Persistence

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

## 4. Directory Structure

```
├── public/             # Static assets, PWA icons
├── src/
│   ├── components/     # UI Components (Dashboard, Charts, Modals)
│   ├── context/        # Global State Management (DataContext)
│   ├── lib/            # Utilities (persistence layer)
│   ├── logic/          # Pure TS Business Logic (Stats, Parser)
│   ├── hooks/          # Custom React Hooks
│   ├── data/           # Sample datasets
│   ├── test/           # Test Setup & Configuration
│   ├── App.tsx         # Root Component
│   └── main.tsx        # Entry Point
├── dist/               # Production Build Output
├── vercel.json         # Vercel Deployment Config
└── package.json        # Dependencies & Scripts
```

## 5. PWA & Offline Capability

The app uses `vite-plugin-pwa` to generate a Service Worker that:
- **Precaches** all static assets (JS, CSS, HTML, icons)
- **Enables offline use** after the first visit
- **Auto-updates** when new versions are deployed

Users can "install" the app:
- Mobile: "Add to Home Screen"
- Desktop: Browser install prompt

## 6. Responsive Architecture

The app supports screens from 320px to desktop with a comprehensive responsive system:

### Mobile Components
| Component | File | Purpose |
|-----------|------|---------|
| `MobileDashboard` | `src/components/MobileDashboard.tsx` | Tab-based chart view with swipe navigation |
| `MobileStatsPanel` | `src/components/MobileStatsPanel.tsx` | Full-screen stats with Summary/Histogram/Prob Plot tabs |
| `MobileMenu` | `src/components/MobileMenu.tsx` | Dropdown menu for overflow toolbar actions |

### Responsive Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useResponsiveChartMargins` | `src/hooks/useResponsiveChartMargins.ts` | Dynamic chart margins based on container width |
| `useResponsiveChartFonts` | `src/hooks/useResponsiveChartMargins.ts` | Scaled font sizes for chart labels |
| `useResponsiveTickCount` | `src/hooks/useResponsiveChartMargins.ts` | Optimal tick count for axis length |

### Layout Detection
Components use `window.innerWidth` with resize listeners to conditionally render:
- `Dashboard.tsx`: Renders `MobileDashboard` below 640px
- `SpecEditor.tsx`: Renders as bottom sheet below 640px
- `AppHeader.tsx`: Shows mobile menu button below 640px

## 7. Building & Deployment

### Development
```bash
npm run dev          # Start dev server at localhost:5173
```

### Production Build
```bash
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build locally
```

### Deployment
The app deploys as a static site to any hosting provider.

**Vercel (Recommended):**
```bash
npx vercel
```

**Manual:**
Deploy the `dist/` folder to any static host (Netlify, GitHub Pages, S3, etc.)
