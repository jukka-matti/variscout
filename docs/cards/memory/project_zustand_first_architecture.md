---
title: 'Zustand-First State Architecture'
description: 'COMPLETE (Apr 6 2026): 4 domain stores + School B direct access. Editor views migrated — store-aware tabs, shared hooks, layout composers.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: fe5673b394bfe4f7
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_zustand_first_architecture.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Zustand-first architecture replacing DataContext god object. Fully delivered including editor view migration:
- `docs/archive/specs/2026-04-04-zustand-first-state-architecture-design.md` (status: delivered)
- `docs/superpowers/specs/2026-04-04-zustand-direct-store-access-design.md` (status: delivered)
- `docs/superpowers/specs/2026-04-06-editor-architecture-simplification-design.md` (status: delivered)

**Architecture (School B — Direct Store Access):**
- 4 domain stores in `@variscout/stores`: projectStore, investigationStore, sessionStore (auto-persist), improvementStore
- 10 derived hooks in `@variscout/hooks`: useFilteredData, useAnalysisStats, useStagedAnalysis, usePerformanceAnalysis, useYDomain, useSpecsForMeasure, useProjectActions, useHubComputations, useCoScoutProps, useImprovementProjections
- cloudSyncSubscriber replaces useAutoSave (store.subscribe → debounced Blob Storage)
- Components import directly from stores via selectors (no facade, no DataContext)
- Store-aware UI: StatsTabContent, QuestionsTabContent, JournalTabContent in `@variscout/ui` read from `@variscout/stores`
- 5 Azure feature stores remain in `apps/azure/src/features/*/` for UI-specific state

**Editor view migration (Apr 6 2026):**
- EditorDashboardView: 810→236 lines, 56→20 hooks. Decomposed into PISection + DashboardSection + CoScoutSection + FactorPreviewSection
- InvestigationWorkspace: 669→595 lines. Shared hooks replace duplicated hub computations, CoScoutSection reused
- PIPanelBase: 6 render props → `tabs: PITabConfig[]` config API
- ProcessIntelligencePanel adapter deleted (202 lines)
- Net: -1,413 lines, 8 files deleted

**Key design decisions:**
- School B (direct selectors) over School A (facade) for selective re-rendering
- `@variscout/ui` depends on `@variscout/stores` for store-aware tab components (documented exception in monorepo.md)
- Hybrid persist: document persist for projects, Zustand middleware for session prefs
- DDD bounded contexts: project, investigation, improvement, session
