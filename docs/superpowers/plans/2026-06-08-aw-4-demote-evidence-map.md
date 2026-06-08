---
tier: ephemeral
purpose: build
title: 'AW-4 Demote Evidence Map implementation sub-plan'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, evidence-map, lenses, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/plans/2026-06-08-aw-1-wall-readable-scale.md
  - docs/superpowers/plans/2026-06-08-aw-2-canvas-first-chrome.md
  - docs/superpowers/plans/2026-06-08-aw-3-legible-gates.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# AW-4 Demote Evidence Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Worktree: `.worktrees/feat-aw-4-demote-evidence-map` (branch `feat/aw-4-demote-evidence-map`). TDD is required: write the failing seam test, verify red, implement, verify green, then commit.

**Goal:** Make Analyze land on the Wall and reduce the primary Analyze lens set to **Wall + Causes**, while keeping Findings reachable and preserving read-only Evidence Map usage in Report/mobile surfaces.

**Architecture:** `canvasViewportStore.viewMode` remains the shared app-level Wall lens authority, but its default and unknown persisted fallback become `wall`. The primary Analyze controls in Azure and PWA stop offering the Evidence Map lens and only expose Wall/Causes in the Wall canvas chrome. Findings remains a separate Analyze content view/list, not a deleted surface. `AnalyzeMapView` and `CausalLinkCreator` are parked out of the primary Analyze flow; `EvidenceMapBase` stays available for Report and PWA mobile/read-only consumers.

**Tech Stack:** Zustand canvas viewport store, React Analyze shells in Azure/PWA, shared `@variscout/ui` Wall components, Vitest + Testing Library, browser verification for PWA and Azure.

---

### Task 1: Change the View-Mode Authority Default

**Files:**

- Modify: `packages/stores/src/canvasViewportStore.ts`
- Modify: `packages/stores/src/__tests__/canvasViewportStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Update tests so the initial view mode is `wall`, unknown persisted `viewMode` values normalize to `wall`, and `causes` still persists/rehydrates. Keep explicit `map` normalization only if needed for backward-compatible reads from already persisted state, but do not make it the default or fallback.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/stores test -- src/__tests__/canvasViewportStore.test.ts
```

Expected before implementation: default/fallback assertions fail because the store still initializes and normalizes unknown values to `map`.

- [ ] **Step 3: Implement default/fallback shift**

Set `getCanvasViewportInitialState().viewMode` to `wall` and make `normalizeCanvasViewMode` return `wall` for unknown values while still accepting persisted `map`, `wall`, and `causes` values. This keeps old persisted Map state readable without letting stale/unknown values re-center Analyze on Map.

- [ ] **Step 4: Verify green and commit**

Run the targeted store test. Then branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-aw-4-demote-evidence-map`; branch is `feat/aw-4-demote-evidence-map`.

Commit: `feat(stores): default analyze wall view to wall`.

### Task 2: Demote Map from Azure Analyze Primary Flow

**Files:**

- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`

- [ ] **Step 1: Write failing Azure seam tests**

Assert Analyze renders the Wall by default, the visible Wall chrome offers `Wall` and `Causes` but no `Map`, and the top-level Analyze content switch still offers `Findings` when the Wall chrome is not active. Add a negative control that `AnalyzeMapView` is not mounted in the primary Analyze flow.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
```

Expected before implementation: default is Map, Map button exists, and `AnalyzeMapView` mounts.

- [ ] **Step 3: Implement Azure lens simplification**

Remove `map` from the primary Wall/Causes controls and route non-Wall/non-Causes Analyze content to Findings. Do not delete `AnalyzeMapView` or causal-link persistence code; stop mounting `AnalyzeMapView`/`CausalLinkCreator` from the primary flow. Keep Findings list/board callbacks and photo/add/restore behavior intact.

- [ ] **Step 4: Verify green and commit**

Run the Azure mapwall seam test. Branch guard and commit: `feat(azure): land analyze on wall`.

### Task 3: Demote Map from PWA Analyze Primary Flow

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`

- [ ] **Step 1: Write failing PWA seam tests**

Assert PWA Analyze lands on Wall, the primary Wall chrome exposes Wall/Causes only, the Evidence Map content switch is absent from the primary Analyze flow, and Findings remains reachable as the list/board surface.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected before implementation: default is Map, Map/Evidence Map controls exist, and Evidence Map can mount from the primary toggle.

- [ ] **Step 3: Implement PWA lens simplification**

Remove the Evidence Map content switch and `map` option from the primary Analyze controls. Keep `EvidenceMapBase` imports/usage only where read-only Report/mobile behavior needs it. Preserve Findings list/board behavior and the Causes matrix.

- [ ] **Step 4: Verify green and commit**

Run the PWA mapwall seam test. Branch guard and commit: `feat(pwa): land analyze on wall`.

### Task 4: Prove Report/Mobile Evidence Map Is Preserved

**Files:**

- Modify tests only, unless a regression is found:
  - `apps/pwa/src/components/views/__tests__/ReportView.evidenceMap.test.tsx` or equivalent
  - `apps/azure/src/components/views/__tests__/ReportView.evidenceMap.test.tsx` or equivalent

- [ ] **Step 1: Add or confirm read-only Evidence Map tests**

Add focused assertions if coverage is missing: Report still renders its evidence-map/timeline surface using `EvidenceMapBase`, and PWA mobile remains unaffected by the primary Analyze lens simplification.

- [ ] **Step 2: Verify targeted report/mobile coverage**

Run the relevant Report/mobile tests plus the two app mapwall tests.

- [ ] **Step 3: Commit test-only preservation coverage if needed**

Branch guard and commit: `test(apps): preserve read-only evidence map coverage`.

### Task 5: Final Verification and Merge

**Files:**

- PR body with browser screenshots and measurements.

- [ ] **Step 1: Run final merge gate**

Run:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] **Step 2: Browser verify both apps**

Start each app, load `?sample=analyze-showcase`, click Analyze, and verify:

- Analyze lands directly on the Wall.
- The primary lens controls show Wall and Causes, not Map/Evidence Map.
- Findings remains reachable from Analyze.
- Causes matrix still opens.
- Report still renders its read-only evidence map/timeline surface.

Capture screenshots for PWA and Azure.

- [ ] **Step 3: Open PR and merge**

Open the PR with screenshot evidence and measurements. After required checks pass, merge with:

```bash
gh pr merge --merge --delete-branch
```

Never use squash.
