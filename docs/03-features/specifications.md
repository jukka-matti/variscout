---
title: VariScout Product Spec
audience: [analyst, engineer]
category: reference
status: stable
related: [product-overview, features, pricing]
---

# VariScout — Product Spec

**Version:** 2.0
**Date:** March 2026
**Status:** Stable

---

## What Is It?

A lightweight, offline variation analysis tool for quality professionals. Fast, linked charts that reveal hidden variation.

- **PWA (Free):** No AI, no API keys — a pure training tool where the struggle is the point.
- **Azure App:** Optional AI-assisted analysis via customer-deployed Azure AI Foundry. AI augments investigation, never replaces statistical analysis.

**Tagline:** _"Cut through your watermelons — without the cloud."_

---

## Target Users

| User                     | Context                             | Why Lite works                                |
| ------------------------ | ----------------------------------- | --------------------------------------------- |
| **Quality Champions**    | SMEs in developing countries        | Know statistics, need better tools than Excel |
| **Experienced analysts** | Already know what to look for       | Don't need AI guidance                        |
| **Trainers / educators** | Teaching variation analysis         | Clean demo tool, no AI unpredictability       |
| **LSS Trainers**         | Green Belt / Black Belt courses     | Minitab replacement with zero installation    |
| **Offline environments** | Factory floor, limited connectivity | 100% local, no internet needed                |

---

## Core Features

| Feature                     | Description                                           | Detailed Docs                                                                                         |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Data Import                 | CSV, Excel, paste; smart auto-mapping, validation     | [data-input.md](data/data-input.md)                                                                   |
| Three-Chart Dashboard       | I-Chart, Boxplot, Pareto with linked filtering        | [i-chart.md](analysis/i-chart.md), [boxplot.md](analysis/boxplot.md), [pareto.md](analysis/pareto.md) |
| Interactive Analysis        | Drill-down, breadcrumbs, factor selection             | [drill-down.md](navigation/drill-down.md), [linked-filtering.md](navigation/linked-filtering.md)      |
| Statistics Panel            | Conformance/Capability modes, Cp/Cpk, η², histogram   | [stats-panel.md](analysis/stats-panel.md)                                                             |
| Data Table                  | Inline editing, keyboard navigation, spec status      | [data-input.md](data/data-input.md)                                                                   |
| Save & Load (.vrs)          | Azure App: project persistence + OneDrive sync        | [storage.md](data/storage.md)                                                                         |
| Chart Annotations           | Right-click highlights + text observations → Findings | [charts.md](../../.claude/rules/charts.md) §Chart Annotations                                         |
| Export                      | PNG (charts/dashboard), CSV, SVG                      | [Chart Export](../../.claude/rules/charts.md) §Chart Export                                           |
| Branding                    | Source bar with sample count; hidden for paid tiers   | —                                                                                                     |
| Staged Analysis             | Before/after comparison with stage columns            | [staged-analysis.md](analysis/staged-analysis.md)                                                     |
| Nelson Rules                | Control chart pattern detection                       | [nelson-rules.md](analysis/nelson-rules.md)                                                           |
| Control Violation Education | Tooltip explanations, glossary terms                  | [help-tooltips.md](learning/help-tooltips.md)                                                         |
| Embed Mode                  | URL parameters for website case studies               | [embed-messaging.md](../../docs/05-technical/integrations/embed-messaging.md)                         |
| Dashboard Design            | Scrollable layout, sticky nav, presentation mode      | [dashboard-design.md](../../docs/06-design-system/patterns/dashboard-design.md)                       |

---

## What's NOT Included (PWA)

| Feature                                   | Why excluded                         |
| ----------------------------------------- | ------------------------------------ |
| AI assistance                             | PWA is a training tool — no AI, ever |
| Intent modes (Explore/Hypothesis/Monitor) | Adds complexity                      |
| Playbooks / guided workflows              | AI-dependent                         |
| Cloud sync                                | Offline-first design                 |
| Multi-user / collaboration                | Single-user tool                     |

**Philosophy:** PWA users are learning. They need visualization, not AI shortcuts.

## Azure App — Optional AI Features

The Azure App (Standard and Team plans) supports optional AI-assisted analysis via customer-deployed Azure AI Foundry. See [ADR-019](../07-decisions/adr-019-ai-integration.md).

| Feature                   | Standard |   Team   | Description                                |
| ------------------------- | :------: | :------: | ------------------------------------------ |
| NarrativeBar              | Optional | Optional | Plain-language analysis summary            |
| ChartInsightChip          | Optional | Optional | Per-chart contextual suggestions           |
| CoScoutPanel              | Optional | Optional | Conversational AI assistant                |
| Knowledge Base            |    -     | Optional | Cross-project findings + SharePoint docs   |
| Process description field | Optional | Optional | Free-text process context for AI grounding |

AI is always optional, dismissable, and controlled by a user-visible Settings toggle. No AI endpoint configured = no AI UI shown.

---

## Products & Pricing

| Product        | Distribution      | Pricing                                            | Status      |
| -------------- | ----------------- | -------------------------------------------------- | ----------- |
| Azure Standard | Azure Marketplace | €99/month (full analysis, local files)             | **PRIMARY** |
| Azure Team     | Azure Marketplace | €199/month (+ Teams, OneDrive, SharePoint, mobile) | **PRIMARY** |
| Azure Team AI  | Azure Marketplace | €279/month (+ AI-assisted analysis)                | **PRIMARY** |
| PWA            | Public URL        | FREE (forever, training & education)               | Production  |

### Free (PWA)

- All core chart types (I-Chart, Boxplot, Pareto, Capability, ANOVA)
- Copy-paste data input + sample datasets
- VariScout branding on charts
- Session-only storage (no save)

### Standard (Azure App — €99/month)

- All features, unlimited users
- EasyAuth (Microsoft SSO), file upload, save/persistence
- Performance Mode (multi-channel analysis)
- Watermark-free exports, custom theming
- Managed Application deployment via Azure Marketplace

### Team (Azure App — €199/month)

- Everything in Standard, plus:
- Teams integration (channel tabs, SSO)
- OneDrive and SharePoint sync
- Mobile access via Teams app
- Photo evidence with EXIF stripping

### Team AI (Azure App — €279/month)

- Everything in Team, plus:
- AI-assisted analysis (CoScout, narrative insights, chart insights)
- AI-powered suggested questions and hypothesis generation

---

## Competitive Positioning

### vs Minitab

| Aspect         | Minitab          | VaRiScout              |
| -------------- | ---------------- | ---------------------- |
| Price          | $1,000+/year     | From €99/month or free |
| Installation   | Desktop software | Browser (no install)   |
| Learning curve | Steep            | Minimal                |
| Feature depth  | Deep (30 years)  | Focused (essentials)   |
| Target         | Statisticians    | Everyone               |

### vs Excel

| Aspect           | Excel              | VaRiScout    |
| ---------------- | ------------------ | ------------ |
| Setup            | Build from scratch | Ready to use |
| Control limits   | Manual calculation | Automatic    |
| Linked filtering | Complex            | One click    |
| Export quality   | Varies             | Consistent   |

### Positioning Statement

> "VaRiScout is for practitioners who need answers, not statisticians who need tools. Simple enough for anyone. Rigorous enough for experts."

---

## Success Metrics

### Product Metrics

| Metric                      | Target        |
| --------------------------- | ------------- |
| Time to first chart         | < 2 minutes   |
| Free → Paid conversion      | 5-10%         |
| Monthly active users (free) | 1,000+        |
| Paid subscribers            | 100+ (Year 1) |

### Business Metrics

| Metric               | Year 1 Target |
| -------------------- | ------------- |
| ARR                  | €25,000       |
| Support tickets/user | < 0.1         |
| Churn rate           | < 20%         |

---

## Summary

> **VariScout** is a fast, offline variation analysis tool for people who know what they're doing but need better tools than Excel. Linked charts that reveal hidden variation — with optional AI-assisted analysis for Azure App customers who want natural language guidance.
>
> Perfect for quality professionals and LSS trainers: free PWA for training, Azure App for real work.
