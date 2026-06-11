---
title: ER-8 Y-model and specs everywhere implementation plan
status: delivered
date: 2026-06-11
owner: codex
---

# ER-8 — Y-model + Specs Everywhere

## Context

Implement the D10 Explore Y-model slice from the 2026-06-10 Explore redesign plan after ER-7 landed on `main`. The active Y is switchable, tracked outcomes stay explicit, per-measure specs resolve via `measureSpecs[outcome] ?? specs`, and chart slots remain unchanged.

## Plan

1. [x] Replace the raw I-Chart outcome select in `DashboardLayoutBase` with a grouped Y switcher:
   - tracked outcomes first, with spec badges;
   - other numeric outcomes second;
   - selecting an untracked Y only switches active Y;
   - show inline `track this outcome?` for an untracked active Y.
2. [x] Thread tracked outcomes, per-measure spec lookup, and the promotion callback from PWA and Azure dashboards.
3. [x] Add a small canvas-store tracking action so promotion updates the document outcome list without re-opening the mapping wizard.
4. [x] Sever the PWA Frame `+ track another outcome` wizard jump by routing to Explore instead.
5. [x] Ensure pin and chart findings persist `FindingContext.yColumn`, then render the Y on cards and group drawer findings by Y when multiple Y values exist.
6. [x] Update `SpecEditor` inference copy so limits echo direction clearly and empty specs imply no direction.
7. [x] Add targeted tests for the switcher, finding Y display/grouping, capture Y stamping, and spec inference copy.
8. [x] Run required PWA/Azure suites, `bash scripts/pr-ready-check.sh`, and browser-gate the grouped switcher, promotion, spec lines, and Y-stamped findings.
