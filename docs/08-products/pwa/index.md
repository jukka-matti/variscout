# PWA (Progressive Web App)

> **Deprecation Notice**: The PWA is deprecated as a commercial product. It remains available for evaluation, demos, and as the reference implementation for development. See [ADR-007](../../07-decisions/adr-007-azure-marketplace-distribution.md) for details on the new distribution strategy.

---

## Status: Internal / Demo Only

The PWA is no longer a commercial offering. Use cases:

| Use Case              | Appropriate | Alternative                    |
| --------------------- | ----------- | ------------------------------ |
| Evaluation & demos    | ✓           | -                              |
| Development reference | ✓           | -                              |
| Production use        | ✗           | [Azure App](../azure/index.md) |
| Commercial licensing  | ✗           | Azure Marketplace              |
| Team collaboration    | ✗           | Azure App with OneDrive        |

---

## Overview

The PWA is a React application that:

- Runs entirely in the browser (no server required)
- Works offline after initial load
- Can be installed like a native app
- Stores data locally in IndexedDB

This implementation serves as the **reference codebase** for VariScout features before they're ported to Azure App and Excel Add-in.

---

## Technical Stack

| Component | Technology               |
| --------- | ------------------------ |
| Framework | React 18 + TypeScript    |
| Build     | Vite                     |
| Styling   | Tailwind CSS             |
| Charts    | Visx (@variscout/charts) |
| State     | React Context            |
| Storage   | IndexedDB (Dexie.js)     |
| Offline   | Service Worker           |

---

## Features

All features are available for evaluation:

- All chart types (I-Chart, Boxplot, Pareto, Capability, Regression, Gage R&R)
- Performance Mode for multi-channel analysis
- Drill-down with breadcrumb navigation
- Linked filtering across charts
- CSV/Excel file import
- Data export (CSV, JSON, screenshots)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    REACT APPLICATION                         │ │
│  │   DataContext → Charts → Analysis                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      IndexedDB                               │ │
│  │   Projects │ Settings                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Service Worker (offline)                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm --filter @variscout/pwa test
```

---

## Role in Development Workflow

The PWA serves as the **feature development sandbox**:

1. **New features** are prototyped in the PWA first
2. **Shared packages** are developed against PWA use cases
3. **Azure App** adopts features after PWA validation
4. **Excel Add-in** adapts features for Office.js constraints

This ensures rapid iteration while maintaining code quality across all platforms.

---

## Migration Path for Existing Users

For users who previously used the PWA:

| If You Were...        | Migrate To...                    |
| --------------------- | -------------------------------- |
| Evaluating features   | Continue using PWA (demo)        |
| Individual user (€99) | Azure App Individual tier        |
| Team user             | Azure App Team tier              |
| Excel-focused         | Excel Add-in (FREE on AppSource) |

Existing license keys will be honored until expiry.

---

## See Also

- [Storage](storage.md)
- [Azure App (Primary Product)](../azure/index.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-004: Offline-First](../../07-decisions/adr-004-offline-first.md)
