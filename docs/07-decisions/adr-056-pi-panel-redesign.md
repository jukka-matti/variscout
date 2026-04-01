---
title: 'ADR-056: Process Intelligence Panel Redesign'
audience: [developer, architect]
category: architecture
status: stable
related: [pi-panel, questions, journal, investigation, findings, stats-panel]
---

# ADR-056: Process Intelligence Panel Redesign

**Status:** Accepted
**Date:** 2026-04-01

## Context

The PI panel had Summary|Data|What-If tabs showing statistical metrics but no investigation intelligence. Questions and findings were confined to the Investigation workspace and a separate FindingsPanel right sidebar in Analysis, creating three overlapping surfaces.

## Decision

1. **Replace tabs** with Stats | Questions | Journal | ⋯ (overflow: Data, What-If)
2. **Remove FindingsPanel** right sidebar from Analysis workspace
3. **Add question-driven status terminology**: Open → Investigating → Answered / Ruled out
4. **Context-reactive** Questions tab highlights the active drill-down factor
5. **PWA parity**: Both new tabs available, journal is session-only

## Consequences

### Positive

- Charts gain +320-600px in Analysis workspace
- Two surfaces for investigation (PI panel compact + Investigation workspace deep) instead of three
- Question-first terminology aligns with Turtiainen 2019 methodology
- Journal provides chronological audit trail for reports

### Negative

- Side-by-side chart + finding editing requires switching to Investigation workspace
- FindingsPanel, FindingDetailPanel, InvestigationSidebar components deprecated (code to remove)

## Implementation

- `@variscout/core/findings`: `getQuestionDisplayStatus()`, `QUESTION_STATUS_LABELS`, `QUESTION_STATUS_COLORS`
- `@variscout/hooks`: `useJournalEntries`, `useQuestionReactivity`
- `@variscout/ui`: `QuestionsTabView`, `QuestionRow`, `QuestionRowExpanded`, `ObservationsSection`, `ConclusionCard`, `JournalTabView`, `JournalEntryRow`, `PIOverflowMenu`
- `StatsPanelBase` tab type changed from `'summary'|'data'|'whatif'` to `'stats'|'questions'|'journal'`
- `panelsStore`: added `piActiveTab`, `piOverflowView`; deprecated `isFindingsOpen`
