---
title: QDE 2.0 Survey Foundation Phase Plan
audience: [engineer, product]
category: implementation
status: delivered
date: 2026-04-26
related: [question-driven-eda-2, survey, mechanism-branches, signal-cards, process-map]
---

# QDE 2.0 Survey Foundation Phase Plan

## Scope

This phase adds Survey as a deterministic evaluator over the current
investigation state. Survey answers:

```text
What can I do with this data, what would I miss, and what should I collect next?
```

Survey is not a new persisted domain store, not a fifth Zustand store, and not a
new top-level workspace. It evaluates existing project state: dataset shape,
selected mappings, specs, optional Process Map, questions, findings, and
Mechanism Branches.

## Implementation Shape

- Add a pure `@variscout/core/survey` evaluator.
- Reuse existing deterministic helpers:
  - `detectColumns()`
  - `detectWideFormat()`
  - Yamazumi detection
  - defect detection
  - `inferMode()`
  - `detectGaps()`
  - Mechanism Branch projection
- Return a `SurveyEvaluation` with:
  - `possibility`
  - `power`
  - `trust`
  - ordered next-data and next-check recommendations
- Keep trust and power advisory in this slice. No Signal Card persistence and no
  formal measurement-study planner ship here.
- Add `SurveyNotebookBase` in `@variscout/ui` with `Possibility`, `Power`, and
  `Trust` tabs plus compact/mobile rendering.
- Integrate the notebook into the Azure Process Intelligence sidebar as a
  `Survey` tab.
- Expose Survey from the Azure mobile `More` sheet as a compact bottom sheet.
- Let accepted recommendations promote their action text into
  `processContext.nextMove`, reusing the existing save/load path.

## Out Of Scope

- Signal Card model, persistence, chips, or editable trust fields.
- Formal retrospective power or measurement-study calculations.
- Gage R&R mode.
- New top-level `SURVEY` workspace or navigation tab.
- New domain store.
- CoScout mutation of Survey output.

## Verification Targets

- Core tests for no-data state, Standard/Four Lenses affordance, capability
  caution, Process Map gaps, branch counter-check recommendations, and stable
  recommendation ordering.
- UI tests for notebook tabs, compact rendering, and accepting next moves.
- Azure tests for PI Survey tab, mobile More Survey action, accepted next-move
  persistence, and local save/load preservation.
- Repository verification: `pnpm docs:check`, `pnpm check:i18n`, targeted
  package tests, Azure build, and `bash scripts/pr-ready-check.sh`.

## Next Phase

Signal Cards remain the next QDE 2.0 phase. Survey now provides advisory trust
and power surfaces so Signal Cards can replace those placeholders with persisted
signal-level facts in the next slice.
