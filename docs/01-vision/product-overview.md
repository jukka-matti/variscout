---
title: 'VariScout: Product Overview'
audience: [business, analyst]
category: methodology
status: stable
---

# VariScout: Product Overview

## Philosophy

**Methodology is the product.** VariScout is structured investigation for process improvement — question-driven, evidence-based, AI-assisted.

We deliberately chose investigation depth over statistical breadth. Instead of competing with Minitab on test coverage, we built the investigation methodology (Turtiainen 2019) into the product: FRAME → SCOUT → INVESTIGATE → IMPROVE → REPORT as workspace tabs, question-driven EDA as the core workflow, and three evidence types (data, gemba, expert) as the investigation backbone.

---

## What We Built

### Core Analysis Dashboard

- **I-Chart**: Time series with auto-calculated control limits (UCL/LCL)
- **Boxplot**: Factor comparison (e.g., Farm A vs Farm B)
- **Pareto**: Frequency analysis for categorical data
- **Linked Filtering**: Click any chart element to filter all others instantly
- **Interactive Labels**: Rename axes and categories directly on the chart
- **Focus Mode**: Maximize any chart for presentation or detailed analysis (Carousel navigation)

### Data Input

- **File Import**: Drag-and-drop CSV and Excel (.xlsx)
- **Manual Entry**: Direct data entry with two modes:
  - **Standard Mode**: Factor-outcome analysis with running statistics
  - **Performance Mode**: Multi-channel entry with per-channel Cpk indicators
  - Keyboard navigation, spec compliance feedback (56px touch targets for tablets)
- **Paste from Excel**: Tab-separated data supported

### Export Options

- **PNG Export**: Save charts as images for reports
- **CSV Export**: Excel-compatible data export with row numbers and spec status
- **Project Files**: Save/load as .vrs files for sharing (Azure App only)

### Display Modes

- **Presentation Mode**: Fullscreen view with all charts optimized for stakeholder presentations (Escape to exit)
- **Focus Mode**: Maximize any chart for detailed analysis with carousel navigation
- **Scrollable Layout**: Charts have comfortable minimum heights with sticky navigation

### Capability Analysis

- **Cp/Cpk Metrics**: Configurable process capability indices (toggle in Stats Panel)
- **Capability Histogram**: Visual distribution analysis with spec limits overlay (tab in Stats Panel)
- **Spec Editor**: Contextual editing of USL/LSL/Target directly in the analysis view

### Data Table

- **View Data**: Excel-like table view of all imported data
- **Inline Editing**: Click any cell to edit values
- **Keyboard Navigation**: Tab/Enter to move between cells
- **Spec Status**: Color-coded pass/fail indicators per row
- **Row Operations**: Add and delete rows

### Persistence

- **Azure App**: Named analyses saved to IndexedDB + synced to OneDrive. Download .vrs files for portability.
- **PWA (Free)**: Session-only — data lives in React state, cleared on refresh. No save, no .vrs files.

---

## What We Chose NOT to Build

Based on UX research, we considered a complex 4-mode architecture with:

- Field Mode (touch-optimized data entry)
- Analysis Mode (command palette, templates)
- Presentation Mode (annotations, insight cards)
- Certification Mode (audit trails, compliance packages)

**We rejected this approach** because:

1. It added complexity without proportional value
2. The core tool already serves the main use cases
3. Simple enhancements (Focus Mode, Presentation Mode, Manual Entry) addressed the key needs
4. Maintaining 4 separate UIs would slow future development

The exploratory design is archived in `docs/archive/PRODUCT_CONCEPTS_v1_abandoned.md` for reference.

---

## Target Users

Based on UX research with quality professionals in developing countries:

| Persona    | Role                             | Key Need                              |
| ---------- | -------------------------------- | ------------------------------------- |
| **Grace**  | QA Manager (Kenya)               | Reduce 4-hour Excel work to 1 hour    |
| **Raj**    | Quality Engineer (India)         | Real-time variation monitoring        |
| **Carlos** | Training Coordinator (Guatemala) | Explain quality data to farmer groups |

See [UX Research](../02-journeys/ux-research.md) for detailed personas, JTBD, and use cases.

---

## Design Principles

1. **Offline by default** - Works without internet after first visit
2. **Data stays local** - Zero external data transmission
3. **Transparent math** - Show formulas, explain metrics
4. **CSV exportable** - All data can be opened in Excel
5. **Linked exploration** - Charts talk to each other through filtering
6. **Fast to first insight** - Under 30 seconds from upload
7. **Export-ready outputs** - Professional charts for reports
8. **Simple over complete** - Do fewer things, do them well

---

## Technical Highlights

| Aspect    | Implementation            |
| --------- | ------------------------- |
| Runtime   | PWA with Service Worker   |
| Framework | React + TypeScript + Vite |
| Styling   | Tailwind CSS              |
| Charts    | Visx (D3 primitives)      |
| Storage   | IndexedDB + localStorage  |
| Bundle    | ~700KB gzipped            |

---

## Repository Structure

VariScout is a pnpm monorepo with shared packages and multiple apps:

```
variscout-lite/
├── packages/
│   ├── core/              # @variscout/core - Stats, parser, tier, glossary (pure TypeScript)
│   ├── charts/            # @variscout/charts - Visx chart components
│   ├── data/              # @variscout/data - Sample datasets with pre-computed chart data
│   ├── hooks/             # @variscout/hooks - Shared React hooks
│   └── ui/                # @variscout/ui - Shared UI components
├── apps/
│   ├── pwa/               # PWA website (React + Vite) — free training tool
│   ├── azure/             # Azure Team App (EasyAuth + OneDrive sync)
│   └── website/           # Marketing website (Astro + React Islands)
└── docs/                  # Documentation (vision, journeys, features, technical, decisions)
```

---

## Strategic Direction: LSS Training Market

### The Opportunity

VariScout occupies a distinct category from Minitab: structured investigation for process improvement. Rather than competing on statistical test coverage, we differentiate through the investigation methodology itself — question-driven EDA (Turtiainen 2019), three evidence types (data, gemba, expert), and workspace navigation that mirrors the investigation journey. LSS trainers adopt VariScout because it teaches the methodology, not just the statistics.

### Trainer Pain Points We Solve

| Minitab Pain                            | VaRiScout Solution            |
| --------------------------------------- | ----------------------------- |
| Expensive per-seat licensing            | Free/cheap for classroom use  |
| Students fight the UI                   | Clean, obvious interface      |
| "Which menu is that test under?"        | Guided workflows              |
| Output requires interpretation training | Plain-language insights       |
| Installation headaches                  | Browser-based, works anywhere |

### Feature Status

| Feature             | Status                                                                          | Purpose                                       |
| ------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| ANOVA integration   | **Delivered**                                                                   | Statistical confirmation of group differences |
| Regression analysis | Deferred to Phase 2 ([ADR-014](../07-decisions/adr-014-regression-deferral.md)) | Multi-factor comparison with auto-fit         |

---

_See also:_

- `README.md` - Quick start and installation
- [Architecture](../05-technical/architecture.md) - Technical architecture details
- [UX Research](../02-journeys/ux-research.md) - User research, personas, JTBD
- [Specifications](../03-features/specifications.md) - Detailed functional specifications
- [Product Specs](../08-products/) - Product specs (PWA, Website, Azure)
