---
title: 'Unified AppHeader'
description: 'App header + ProjectHeader merged into single 44px adaptive bar with portfolio/project modes'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_unified_header.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Merged the App header (56px, in App.tsx) and ProjectHeader (44px) into a single `AppHeader` component (`apps/azure/src/components/AppHeader.tsx`), reclaiming 56px of vertical space for chart content.

**Why:** Two stacked headers wasted 100px, duplicated project name ("/ New Analysis" breadcrumb + project name), and split user actions across two bars.

**How to apply:**
- `AppHeader` has two modes: `portfolio` (logo + "VariScout" text + settings gear) and `project` (logo mark + project name + workspace tabs + right zone)
- Logo mark [V] (Activity icon in blue square) replaces back arrow; `canNavigateBack` prop controls interactivity
- Save button removed entirely — auto-save via `useAutoSave`, status shown as dot next to project name
- User name, logout, admin → Settings panel Account section (new `userName`, `userEmail`, `isAdmin`, `onAdminHub`, `onSignOut` props)
- Settings gear (⚙) always last in right zone, opens SettingsPanel via `onOpenSettings` prop
- Right zone primary action slot: `+ Add Data` (Analysis), `→ Actions` (Improvement), nothing (other workspaces)
- App.tsx renders `<AppHeader mode="portfolio">` for non-editor views; Editor.tsx renders `<AppHeader mode="project">`
- Editor height: `h-screen` (AppHeader is inside flex layout, no calc needed)
- **Auto-naming**: `cleanProjectName()` in Editor.tsx — file uploads use cleaned filename (strip extension, replace _/- with spaces), paste/manual use "Analysis {date}". Applied on first `handleSave()` when `currentProjectName` is null.
- **Project name dropdown**: Click project name in desktop header → Rename... (window.prompt), Export CSV (downloadCSV), Save As... (Team only, deferred). `projectMenuOpen` state + outside-click pattern in AppHeader.
- Spec: `docs/superpowers/specs/2026-04-02-unified-header-design.md` (status: delivered)
- Predecessor spec `2026-04-01-header-redesign-design.md` marked as superseded
- Also fixed: I-Chart integer ticks, capability header stats mismatch, PI panel parent-relative resize
