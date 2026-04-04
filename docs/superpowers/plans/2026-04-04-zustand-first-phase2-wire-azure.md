---
title: 'Zustand-First Architecture — Phase 2: Wire Azure App'
---

# Zustand-First Architecture — Phase 2: Wire Azure App

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace DataContext with Zustand stores in the Azure app using a compatibility shim — zero changes to 35+ consumer files. Eliminate render loops structurally.

**Architecture:** Create `useDataCompat()` that reads from `@variscout/stores` instead of React Context. Export it as `useData()` from DataContext.tsx. Consumers don't change. DataProvider stays temporarily for cloud sync orchestration but no longer owns state.

**Tech Stack:** @variscout/stores (Phase 1), existing Azure infrastructure

---

## Strategy: Compatibility Shim

Instead of changing 35+ files, we:

1. Create `useDataCompat()` that maps Zustand store selectors to the old `useData()` interface
2. Replace `useData` export in DataContext.tsx to use the shim
3. Keep DataProvider for cloud sync orchestration during transition
4. All 35+ consumers work unchanged — they still call `useData()` but now it reads from Zustand

This is a 1-day task, not a 1-week migration.

---

### Task 1: Create useDataCompat shim

Create the compatibility shim that bridges Zustand stores to the useData() interface. This is the core of the migration.

### Task 2: Replace DataProvider internals

Gut DataProvider — it no longer owns state (stores do). It becomes a thin shell that:

- Initializes stores on mount
- Provides the compatibility shim via Context (for backward compat)
- Handles cloud sync subscription

### Task 3: Wire investigation state through stores

Replace the 3 orchestration hooks (useFindingsOrchestration, useInvestigationOrchestration, useImprovementOrchestration) in Editor.tsx with direct store usage.

### Task 4: Wire cloud sync to store.subscribe

Replace useAutoSave + saveProject flow with store.subscribe → debounced save.

### Task 5: Verify — build + test + dev server

Full verification: build, test suite, dev server check.
