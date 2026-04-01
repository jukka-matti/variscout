---
title: 'VariScout Constitution'
audience: [developer, analyst]
category: architecture
status: stable
related: [philosophy, methodology, architecture]
---

# VariScout Constitution

Non-negotiable principles that govern every architectural decision and implementation.

## Product Principles

1. **Offline-first** — All processing happens in the browser. Data never leaves the user's device unless they choose cloud sync (Azure Team).

2. **Deterministic first, AI enhances** — Core analysis (statistics, charts, Factor Intelligence, question generation) works without AI or network. CoScout adds conversational depth but is never required.

3. **30-second answers** — An analyst should see where to focus within 30 seconds of pasting data. Speed of insight, not depth of configuration.

## Methodology Principles

4. **Question-first investigation** (Turtiainen 2019) — Investigation starts from questions, not theories. Issue Statement sharpens into Problem Statement through answered questions. Hypotheses emerge from evidence, not assumptions.

5. **Four Lenses simultaneously** — I-Chart, Boxplot, Pareto, and Stats are shown together, not sequentially. Each lens reveals what the others miss. The analyst's eye does the integration.

6. **Progressive stratification** — Drill into data iteratively, guided by statistical evidence (η², R²adj). Each drill narrows scope and spawns new questions.

## Architecture Principles

7. **Props-based shared components** — `@variscout/ui` and `@variscout/charts` accept data via props, never depend on app context. This enables reuse across PWA and Azure without coupling.

8. **Strategy pattern for modes** — `resolveMode()` + `getStrategy()` is the sole source of truth for mode-specific behavior (chart slots, KPI type, question strategy, AI coaching). No cascading mode ternaries.

9. **Derive, don't duplicate** — Information derivable from code (hook lists, component counts, export paths) should be generated automatically, not maintained manually. One fact, one place.

10. **Spec-anchored development** — Design specs are living documents that evolve with the feature. They capture the "why" that ADRs and code comments don't. Update the spec first, then implement.
