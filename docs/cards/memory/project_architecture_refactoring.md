---
title: 'Architecture Refactoring'
description: 'Apr 5-6 2026 — type canonicalization, popout unification, store consolidation (Apr 5) + editor simplification (Apr 6). Two major passes.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 0a5d8f86fbcefb96
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_architecture_refactoring.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## Pass 1: Type + Popout + Store Consolidation (Apr 5)

**Spec A — Type Canonicalization:**
- Created `@variscout/core/ui-types` and `@variscout/core/evidenceMap`
- 15 types that were in 23 locations → 1 canonical source each

**Spec B — Popout Unification:**
- `usePopoutChannel` enhanced: hydration, lifecycle, heartbeat, generic typing
- All 3 popouts migrated from localStorage to `usePopoutChannel`

**Spec C — Store Consolidation:**
- `findingsStore`, `investigationStore` (feature): trimmed to UI-only
- `improvementStore` (feature): DELETED, state moved to `panelsStore`

## Pass 2: Editor Architecture Simplification (Apr 6)

- EditorDashboardView: 810→236 lines (PISection + DashboardSection + CoScoutSection + FactorPreviewSection)
- InvestigationWorkspace: 669→595 lines (shared hooks + CoScoutSection reuse)
- PIPanelBase: 6 render props → `tabs: PITabConfig[]` config API (~194 lines)
- 3 shared hooks: useHubComputations, useCoScoutProps, useImprovementProjections (59 tests)
- 3 store-aware tabs: StatsTabContent, QuestionsTabContent, JournalTabContent
- 8 files deleted, net -1,413 lines
- ProcessIntelligencePanel adapter deleted
- `@variscout/ui` now depends on `@variscout/stores` (documented exception)

**Why:** Zustand-first direct store access was spec'd (Apr 4) but hadn't been applied to editor views. 56 hooks in EditorDashboardView were mostly prop-drilling. Hub computations were duplicated across 2 views.

**How to apply:** New shared hooks, store-aware tab components, and section components. When adding new PI Panel tabs, create a store-aware `*TabContent` component and add it to the tabs config in PISection. When adding features that span views, put shared computation in `@variscout/hooks`.
