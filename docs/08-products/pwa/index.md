# PWA (Progressive Web App)

The primary VariScout application, running entirely in the browser.

---

## Overview

The PWA is a React application that:

- Runs entirely in the browser (no server required)
- Works offline after initial load
- Can be installed like a native app
- Stores data locally in IndexedDB

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

## Editions

| Edition       | Branding       | Theming                                | Price    |
| ------------- | -------------- | -------------------------------------- | -------- |
| **Community** | VariScout logo | Dark only                              | Free     |
| **Licensed**  | No branding    | Light/Dark/System + Accents (PWA only) | €99/year |

Build commands:

```bash
pnpm build:pwa:community  # Community edition
pnpm build:pwa:licensed   # Licensed edition
```

> **Note**: Theme customization requires PWA installation (Add to Home Screen) plus a valid license key.

---

## Features

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
│  │   Projects │ Settings │ License                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Service Worker (offline)                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## See Also

- [Licensing](licensing.md)
- [Storage](storage.md)
- [ADR-004: Offline-First](../../07-decisions/adr-004-offline-first.md)
