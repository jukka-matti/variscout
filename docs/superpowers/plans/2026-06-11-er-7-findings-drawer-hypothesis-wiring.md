---
tier: living
purpose: build
title: 'ER-7 Findings Drawer + Hypothesis Wiring Implementation Plan'
audience: agent
status: active
date: 2026-06-11
layer: spec
topic: [explore, analyze, findings, hypotheses, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
implements:
  - docs/03-features/workflows/findings-hypotheses.md
---

# ER-7 Findings Drawer + Hypothesis Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver ER-7's Explore findings drawer grammar, finding-to-hypothesis condition inheritance, and Wall task assignee capture.

**Architecture:** Keep entity behavior in shared store/core surfaces and app-specific panel mounting in the PWA/Azure shells. Findings remain evidence objects; hypotheses remain mechanism claims whose status is derived by existing survey logic.

**Tech Stack:** React, TypeScript, Zustand stores, Vitest, Testing Library, pnpm/Turbo.

---

## Task 1: Store-Level Finding → Hypothesis Condition

**Files:**

- Modify: `packages/stores/src/analyzeStore.ts`
- Test: `packages/stores/src/__tests__/analyzeStore.test.ts`

- [ ] Add failing tests that `createHubFromFinding` derives a `Hypothesis.condition` from boxplot, pareto, I-Chart, and probability finding sources; links the finding; and leaves `status` at the factory default.
- [ ] Implement condition derivation in the store action by calling `deriveConditionFromFindingSource` with hints resolved from finding context/source.
- [ ] Preserve fallback behavior: missing finding returns `null`; source without enough hints still creates a linked hub without a condition.

## Task 2: Wall Task Assignee Capture

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.actionItems.test.tsx`

- [ ] Add failing UI test proving the add-task form can choose a member and forwards the assignee.
- [ ] Update callback signatures to `(hypothesisId, text, assignee?)`.
- [ ] Render a member select when members exist; keep no-member single-user flow unchanged.
- [ ] Thread the assignee through PWA and Azure handlers into the existing store/action APIs.

## Task 3: Findings Drawer/Card Affordances

**Files:**

- Modify: `packages/ui/src/components/FindingsPanel/FindingsPanelBase.tsx`
- Modify: `packages/ui/src/components/FindingsLog/FindingCard.tsx`
- Modify: `packages/ui/src/components/FindingsLog/FindingsLog.tsx`
- Tests: `packages/ui/src/components/FindingsPanel/__tests__/FindingsPanelBase.test.tsx`, `packages/ui/src/components/FindingsLog/__tests__/FindingCard.test.tsx`

- [ ] Add failing tests for drawer tabs/footer and finding card condition/evidence/status affordances.
- [ ] Add Findings/Journal tabs and footer commands to `FindingsPanelBase`, keeping the panel as a push-side layout element.
- [ ] Render condition chips and condition-scoped evidence on cards from existing finding context/source/window data.
- [ ] Surface support/counts-against controls through optional callbacks without using hypothesis status vocabulary on finding cards.

## Task 4: Explore Mounting + Docs

**Files:**

- Modify app shell/layout files only where needed to retire Explore PI panel and keep Azure CoScout as right drawer / PWA upgrade hint.
- Modify: `docs/03-features/workflows/findings-hypotheses.md`
- Modify: `packages/stores/CLAUDE.md`

- [ ] Re-home or hide Explore PI panel entry points without removing Data Table access.
- [ ] Document seed-not-become, one-question mechanism dialog, support/counts-against, and store-level condition inheritance.
- [ ] Run focused tests, both app test suites, `bash scripts/pr-ready-check.sh`, and browser gate.
