---
title: 'PI Panel Redesign'
description: 'ADR-056 — Stats|Questions|Journal|Docs tabs, store-aware content, PITabConfig API. Editor simplification Apr 6 2026.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 445f3265ab54282a
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_pi_panel_redesign.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

PI Panel redesigned from Summary|Data|What-If to **Stats|Questions|Journal|Docs** (ADR-056, Apr 2026), then architecturally simplified (Apr 6 2026).

**Why:** The PI panel showed numbers but no analytical intelligence. Questions and findings were confined to Investigation workspace. Then the prop-drilling pattern (19+ props via render props) made every new feature touch EditorDashboardView.

**Architecture (Apr 6 2026):**
- PIPanelBase is a pure layout shell (~194 lines) accepting `tabs: PITabConfig[]` — no render props, no stats props
- 3 store-aware tab components in `@variscout/ui`: StatsTabContent, QuestionsTabContent, JournalTabContent
- DocsTab stays app-level (Azure-only, needs Blob Storage)
- Data and What-If accessible via overflow menu (`PIOverflowItem` with `onSelect` callback)
- PISection in `apps/azure/src/components/editor/PISection.tsx` wires tabs + resize + panelsStore sync
- PIPanelBase supports controlled tab mode (`activeTab`/`onTabChange` props) for panelsStore.piActiveTab sync

**How to apply:**
- `PITabConfig` type: `{ id: string; label: string; badge?: number; content: ReactNode }`
- Tab content components read from `@variscout/stores` directly (store-aware)
- Apps configure which tabs to show: Azure all 4, PWA stats only
- `panelsStore` has `piActiveTab`, `piOverflowView`; `isFindingsOpen` deprecated
- Question status: Open → Investigating → Answered / Ruled out
- Context-reactive: drilling into a factor highlights the corresponding question

**Deleted components (absorbed):**
- ProcessIntelligencePanel.tsx adapter (202 lines) → PISection + StatsTabContent
- StatsSummaryPanel → StatsTabContent
- ObservationsSection → QuestionsTabView
- PIOverflowMenu → PIPanelBase
- QuestionRowExpanded → QuestionRow (merged via `expanded` prop)
- JournalTabView/JournalEntryRow → JournalTabContent
