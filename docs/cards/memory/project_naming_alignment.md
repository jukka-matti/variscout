---
title: 'Naming Alignment Refactor (Apr 2 2026)'
description: 'Major rename — Hypothesis→Question, StatsPanel→PIPanel, status unification'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_naming_alignment.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## Hypothesis → Question Rename (Apr 2 2026)

Complete rename across 155 files, 1076+ occurrences. All types, hooks, components, stores renamed.

**Why:** ADR-053 reframed investigation as question-driven. Constitution Principle 5: "questions, not theories." Code now matches product mental model.

**Key mappings:**
- `Hypothesis` type → `Question`
- `HypothesisStatus` → `QuestionStatus` (values unified: open | investigating | answered | ruled-out)
- `HypothesisValidationType` → `QuestionValidationType`
- `useHypotheses` → `useQuestions`
- `createHypothesis()` → `createQuestion()`
- `Finding.hypothesisId` → `Finding.questionId`
- `getQuestionDisplayStatus()` mapping function → DELETED (status IS question status now)
- `EntryScenario: 'hypothesis'` → `'exploration'`

**How to apply:** Use `Question` everywhere. The old `Hypothesis` type no longer exists. Status values are directly `'open' | 'investigating' | 'answered' | 'ruled-out'`.

## StatsPanel → ProcessIntelligencePanel (Apr 2 2026)

- `StatsPanel/` folder → `ProcessIntelligencePanel/`
- `StatsPanelBase` → `PIPanelBase`
- `isStatsSidebarOpen` → `isPISidebarOpen`
- `toggleStatsSidebar` → `togglePISidebar`
- "Point Investigation" comment → "Process Intelligence"

**How to apply:** Use `PIPanelBase` for the PI panel component. `StatsSummaryPanel` name kept (it IS a stats sub-component).

## Data migration needed

Persisted projects in IndexedDB/OneDrive still use old field names (`hypotheses`, old status values). A migration function is needed on load. Not yet implemented.
