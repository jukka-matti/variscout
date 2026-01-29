# VariScout Documentation

**Lightweight, offline-first variation analysis for quality professionals.**

VariScout helps quality engineers, operations managers, and Lean Six Sigma practitioners find and fix the sources of process variation. No backend required - all analysis happens in your browser.

---

## Quick Start

```bash
# PWA development
pnpm dev

# Excel Add-in development
pnpm dev:excel

# Azure Team App development
pnpm --filter @variscout/azure-app dev
```

---

## Core Concepts

<div class="grid cards" markdown>

- :material-chart-line:{ .lg .middle } **Four Pillars**

  ***

  Watson's Four Pillars of Process Knowledge: Change, Flow, Failure, Value

  [:octicons-arrow-right-24: Learn more](01-vision/four-pillars/index.md)

- :material-bullseye:{ .lg .middle } **Two Voices**

  ***

  Understanding control limits (process voice) vs specification limits (customer voice)

  [:octicons-arrow-right-24: Learn more](01-vision/two-voices/index.md)

- :material-filter:{ .lg .middle } **Drill-Down Analysis**

  ***

  Progressive stratification to find where variation hides

  [:octicons-arrow-right-24: Learn more](03-features/navigation/drill-down.md)

- :material-school:{ .lg .middle } **Case Studies**

  ***

  Real-world examples with data files for learning

  [:octicons-arrow-right-24: Browse cases](04-cases/index.md)

</div>

---

## The Promise

> **46% of your variation may be hiding in one place. Find it. Fix it. Check it. Continue.**

VariScout is EDA (Exploratory Data Analysis) for process improvement - not statistical verification. The goal is finding WHERE to focus, then applying Lean thinking to understand WHY.

| Academic Statistician            | Process Improvement Practitioner |
| -------------------------------- | -------------------------------- |
| "Is this significant at p<0.05?" | "Where should I focus?"          |
| Hypothesis testing               | Pattern finding                  |
| Statistical correctness          | Directional guidance             |
| Analysis as end goal             | Analysis as starting point       |

---

## Products

| Product                                      | Platform         | Status     |
| -------------------------------------------- | ---------------- | ---------- |
| [PWA](08-products/pwa/index.md)              | Web Browser      | Production |
| [Excel Add-in](08-products/excel/index.md)   | Microsoft Excel  | Production |
| [Azure Team App](08-products/azure/index.md) | Microsoft Teams  | Beta       |
| [Power BI](08-products/powerbi/index.md)     | Power BI Service | Planned    |

---

## Editions

| Edition       | Branding       | Theming                                | Price    |
| ------------- | -------------- | -------------------------------------- | -------- |
| **Community** | VariScout logo | Dark only                              | Free     |
| **Licensed**  | No branding    | Light/Dark/System + Accents (PWA only) | €99/year |

---

## Architecture

VariScout uses a monorepo structure with shared packages:

```
packages/
├── core/      # Statistics, parser, types (no React)
├── charts/    # Visx chart components
├── hooks/     # Shared React hooks
├── ui/        # Shared UI components
└── data/      # Sample datasets

apps/
├── pwa/           # React + Vite PWA
├── azure/         # Azure Team App
├── website/       # Astro marketing site
└── excel-addin/   # Office.js Add-in
```

[:octicons-arrow-right-24: Technical documentation](05-technical/index.md)

---

## Design System

A unified design system covering PWA and Excel Add-in:

- **Theme-aware**: Supports dark/light modes
- **Data-focused**: Colors prioritize data visibility
- **Consistent**: Same semantics across platforms
- **Accessible**: WCAG AA compliant

[:octicons-arrow-right-24: Design system](06-design-system/index.md)

---

## Contributing

This is a private repository. For contribution guidelines, contact the maintainers.

---

_Documentation built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)_
