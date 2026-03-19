---
title: VariScout Documentation
description: Lightweight, offline-first variation analysis for quality professionals
---

# VariScout Documentation

**Lightweight, offline-first variation analysis for quality professionals.**

VariScout helps quality engineers, operations managers, and Lean Six Sigma practitioners find and fix the sources of process variation. No backend required - all analysis happens in your browser.

---

## Quick Start

```bash
# PWA development
pnpm dev

# Azure Team App development
pnpm --filter @variscout/azure-app dev
```

---

## Core Concepts

- **[Four Lenses](01-vision/four-lenses/index.md)** — Watson's Four Lenses of Process Knowledge: Change, Flow, Failure, Value
- **[Two Voices](01-vision/two-voices/index.md)** — Understanding control limits (process voice) vs specification limits (customer voice)
- **[Progressive Filtering](03-features/navigation/progressive-filtering.md)** — Progressive stratification to find where variation hides
- **[Case Studies](04-cases/index.md)** — Real-world examples with data files for learning
- **[Glossary](glossary.md)** — Key terms and definitions used across VariScout

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

## Products & Pricing

| Product                                      | Distribution      | Pricing                                                   | Status      |
| -------------------------------------------- | ----------------- | --------------------------------------------------------- | ----------- |
| [Azure Standard](08-products/azure/index.md) | Azure Marketplace | €79/month (full analysis + CoScout AI, local files)       | **PRIMARY** |
| [Azure Team](08-products/azure/index.md)     | Azure Marketplace | €199/month (+ Teams, OneDrive, mobile, AI Knowledge Base) | **PRIMARY** |
| [PWA](08-products/pwa/index.md)              | Public URL        | FREE (forever, training & education)                      | Production  |

---

## Architecture & Design System

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
└── website/       # Astro marketing site
```

A unified design system covers both PWA and Azure App: theme-aware (dark/light), data-focused colors, consistent semantics across platforms, and WCAG AA accessible.

[Technical documentation](05-technical/index.md) | [Design system](06-design-system/index.md)

---

## Contributing

This is a private repository. For contribution guidelines, contact the maintainers.

---

_Documentation built with [Starlight](https://starlight.astro.build/)_
