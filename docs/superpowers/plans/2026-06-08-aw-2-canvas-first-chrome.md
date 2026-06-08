---
tier: ephemeral
purpose: build
title: 'AW-2 Canvas-first chrome implementation sub-plan'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, canvas-first, chrome, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/plans/2026-06-08-aw-1-wall-readable-scale.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# AW-2 Canvas-first Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Worktree: `.worktrees/feat-aw-2-canvas-first-chrome` (branch `feat/aw-2-canvas-first-chrome`). TDD is required: write the failing seam test, verify red, implement, verify green, then commit.

**Goal:** Make the Analyze Wall canvas own roughly 80%+ of the Analyze viewport in both apps while keeping every relocated chrome function reachable.

**Architecture:** Shared UI owns reusable chrome pieces: `OverallProblemHeader` becomes the thin top bar, `WallCanvas` exposes compact floating overlays for model-builder and missing-evidence affordances, and app shells move persistent side/top chrome out of the main canvas allocation. Azure and PWA remain behaviorally parallel except Azure keeps CoScout in its existing right slot until AW-8 moves it into the drawer shell.

**Tech Stack:** React, Tailwind utility classes, Zustand canvas/panel stores, `@variscout/ui` AnalyzeWall components, Vitest + Testing Library, Browser verification for PWA and Azure.

---

### Task 1: Add the Shared Overall Problem Header

**Files:**

- Create: `packages/ui/src/components/AnalyzeWall/OverallProblemHeader.tsx`
- Create: `packages/ui/src/components/AnalyzeWall/__tests__/OverallProblemHeader.test.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/index.ts`

- [ ] **Step 1: Write failing header tests**

Add tests for the PR #336 header contract: issue text appears, outcome/target appears, approved problem statement wins over a draft, draft is used when approved text is absent, and zero scopes render as "scope to be determined."

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/OverallProblemHeader.test.tsx`

Expected before implementation: import fails because `OverallProblemHeader` does not exist on `main`.

- [ ] **Step 3: Implement the header only**

Cherry-pick the `OverallProblemHeader` shape from PR #336, adapting only styling/export details required by current `main`. Do not cherry-pick the PR #336 scope lineage metadata, store changes, or Explore handoff in AW-2.

- [ ] **Step 4: Verify green and commit**

Run the targeted header test. Then branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-aw-2-canvas-first-chrome`; branch is `feat/aw-2-canvas-first-chrome`.

Commit: `feat(ui): add analyze overall problem header`.

### Task 2: Collapse Persistent Side Chrome and Mount the Thin Header in Both Apps

**Files:**

- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`

- [ ] **Step 1: Write failing app shell tests**

In both app seam tests, assert the Analyze Wall shell renders `OverallProblemHeader`, exposes a collapsible/overlay conclusion control, and does not allocate the old fixed-width left rail while Wall mode is active. The tests should fail on the current persistent left panel/top toolbar layout.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected before implementation: header/overlay controls are missing and the old rail remains.

- [ ] **Step 3: Implement canvas-first app shells**

Mount `OverallProblemHeader` above the canvas/content area in both apps. Replace the always-present left conclusion rail with a slim overlay trigger plus collapsible overlay panel. Preserve the existing `AnalyzeConclusion` props and callbacks. Keep Azure's issue statement editing reachable in the overlay, not as a full-height rail. Keep PWA's conclusion panel reachable in the same overlay pattern.

- [ ] **Step 4: Verify green and commit**

Run both targeted app seam tests. Branch guard and commit: `feat(apps): make analyze wall shell canvas first`.

### Task 3: Move Analyze View Toggles into Compact Floating Canvas Controls

**Files:**

- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`

- [ ] **Step 1: Write failing floating-control tests**

Assert that Wall mode renders a floating control group inside the canvas region with Wall/Map/Causes choices, group-by-tributary remains reachable when a process map exists, Fit remains reachable, and Findings/list-board controls remain reachable in the non-Wall flow.

- [ ] **Step 2: Verify red**

Run the same two app seam test commands. Expected before implementation: controls live only in the full-width toolbar, not the canvas overlay.

- [ ] **Step 3: Implement compact floating controls**

Move the primary Map/Wall/Causes and Wall-only group-by-tributary controls into an absolute top-corner control group when Wall is active. Preserve keyboard shortcuts and existing store writes (`setWallViewMode`, `setAnalyzeViewMode`, `handleViewMode`, `fitWallToContent`). Leave Findings reachable: Azure's primary Findings view still opens `FindingsLog`, and PWA's Map/Findings content switch remains available outside Wall mode.

- [ ] **Step 4: Verify green and commit**

Run both targeted app seam tests. Branch guard and commit: `feat(apps): float analyze wall mode controls`.

### Task 4: Make Model Builder and Missing Evidence On-demand Canvas Nudges

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/MissingEvidencePanel.tsx`

- [ ] **Step 1: Write failing shared UI tests**

Extend `WallCanvas.test.tsx` to prove `ModelBuilderBand` is hidden behind a compact on-canvas affordance by default and opens on demand, while missing-evidence renders as a thin collapsible nudge rather than a full-width block below the canvas. Preserve the current mobile behavior: mobile still renders `MobileCardList` plus the evidence nudge below the list.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`

Expected before implementation: model-builder renders directly inside the SVG and missing evidence takes full block chrome below the SVG.

- [ ] **Step 3: Implement on-demand affordances**

Keep all existing model-builder computation and capture behavior, but gate the visible `ModelBuilderBand` behind a small floating button/overlay in destination desktop mode. Keep missing-evidence semantics and actions intact while restyling the default collapsed state as a thin nudge. Do not change suspected-cause cards, evidence angles, activity line, Causes matrix, status labels, or snap-river layout.

- [ ] **Step 4: Verify green and commit**

Run the targeted shared UI test. Branch guard and commit: `feat(ui): make wall analysis chrome on demand`.

### Task 5: Canvas Share Measurement and Final Verification

**Files:**

- Modify tests as needed for measurement helpers only.
- PR body with screenshots and measurements.

- [ ] **Step 1: Add or extend load-bearing canvas-share tests**

Add app seam assertions that the Wall canvas host is marked with stable measurement selectors, for example `data-testid="analyze-wall-canvas-shell"` and `data-testid="analyze-wall-floating-controls"`. These tests do not replace browser measurement; they prevent the chrome from moving back into persistent rails unnoticed.

- [ ] **Step 2: Run targeted regression tests**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/OverallProblemHeader.test.tsx src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx src/components/AnalyzeWall/__tests__/MissingEvidencePanel.test.tsx
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

- [ ] **Step 3: Run full merge gate**

Run: `bash scripts/pr-ready-check.sh`

- [ ] **Step 4: Browser verify both apps**

Start each app, load a populated Analyze Wall sample, and record:

- viewport size
- canvas shell client size
- canvas share (`canvas shell area / viewport area`)
- every relocated chrome affordance reachable: problem header, conclusion overlay, mode toggle, group-by-tributary, Fit, missing-evidence nudge, model-builder overlay

Target: canvas share at or above roughly 80% in both apps. Capture screenshots for entry state and opened overlays.

- [ ] **Step 5: Open PR and merge**

Open the PR with the screenshot evidence and measurements. After required checks pass, merge with:

```bash
gh pr merge --merge --delete-branch
```

Never use squash.
