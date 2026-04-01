---
title: Process Intelligence Panel Redesign
date: 2026-04-01
status: delivered
audience: [developer, designer]
category: design-spec
related: [stats-panel, questions, journal, findings, investigation, pi-panel, adr-056]
---

# Process Intelligence Panel Redesign

Replace the Summary|Data|What-If tab layout of the PI panel with Stats|Questions|Journal tabs, eliminating the separate FindingsPanel right sidebar and consolidating investigation surfaces.

## Problem

Three overlapping surfaces existed for investigation in the Analysis workspace:

1. The PI panel (Stats only — Summary|Data|What-If tabs)
2. The FindingsPanel right sidebar (separate sliding panel)
3. The Investigation workspace tab (full question-driven EDA)

This caused confusion about where to interact with questions and findings during analysis. The FindingsPanel also consumed 320-600px of horizontal space, pushing charts off-screen on smaller displays.

## Design Decisions

### Tab Replacement

Old tabs: **Summary | Data | What-If**

New tabs: **Stats | Questions | Journal | ⋯**

- **Stats** — Statistical summary (Cpk, mean, sigma, ANOVA) — replaces Summary
- **Questions** — Question list with display status, auto-linked findings, expand/collapse — new
- **Journal** — Chronological activity log for audit trail and report generation — new
- **⋯ (overflow)** — Houses Data and What-If views to preserve full feature access

### Question Display Status

Question status uses investigation-first terminology aligned with Turtiainen 2019:

| Status          | Display Label | Color |
| --------------- | ------------- | ----- |
| `open`          | Open          | slate |
| `investigating` | Investigating | blue  |
| `answered`      | Answered      | green |
| `ruled_out`     | Ruled out     | muted |

Implemented via `getQuestionDisplayStatus()`, `QUESTION_STATUS_LABELS`, `QUESTION_STATUS_COLORS` in `@variscout/core/findings`.

### Context Reactivity

The Questions tab highlights questions linked to the currently active drill-down factor via `useQuestionReactivity`. When a factor is selected in the Boxplot/I-Chart, relevant questions surface at the top of the list with a visual indicator.

### Journal

The Journal tab shows a chronological stream of investigation events: findings created, questions answered, drill-downs taken, filter changes. In the PWA, the journal is session-only (cleared on page reload). In Azure, journal entries persist with the project.

Implemented via `useJournalEntries` in `@variscout/hooks`.

### FindingsPanel Removal

`FindingsPanelBase` is deprecated as a sidebar in the Analysis workspace. Charts now occupy the full available width. Deep finding editing is available in the Investigation workspace.

## Components

| Component             | Package         | Purpose                                      |
| --------------------- | --------------- | -------------------------------------------- |
| `QuestionsTabView`    | `@variscout/ui` | Questions tab content with filter + list     |
| `QuestionRow`         | `@variscout/ui` | Compact question item with status badge      |
| `QuestionRowExpanded` | `@variscout/ui` | Expanded question with findings + conclusion |
| `ObservationsSection` | `@variscout/ui` | Linked observations within expanded question |
| `ConclusionCard`      | `@variscout/ui` | Conclusion text + status selection           |
| `JournalTabView`      | `@variscout/ui` | Journal tab with grouped entries             |
| `JournalEntryRow`     | `@variscout/ui` | Single journal event row                     |
| `PIOverflowMenu`      | `@variscout/ui` | ⋯ overflow dropdown (Data, What-If)          |

## Hooks

| Hook                    | Package            | Purpose                              |
| ----------------------- | ------------------ | ------------------------------------ |
| `useJournalEntries`     | `@variscout/hooks` | Journal state and event recording    |
| `useQuestionReactivity` | `@variscout/hooks` | Factor-to-question highlight mapping |

## Store Changes

`panelsStore` additions:

- `piActiveTab: 'stats' | 'questions' | 'journal'` — active PI panel tab
- `piOverflowView: 'data' | 'whatif' | null` — active overflow view

`panelsStore` deprecations:

- `isFindingsOpen` — no longer needed (FindingsPanel removed from Analysis)

## PWA Parity

Both Questions and Journal tabs are available in the PWA. The journal is session-only (no persistence). Question status changes persist only in memory (no IndexedDB in PWA).

## ADR Reference

See [ADR-056](../../07-decisions/adr-056-pi-panel-redesign.md) for the architectural decision record.
