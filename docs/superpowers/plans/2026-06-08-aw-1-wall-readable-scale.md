---
tier: ephemeral
purpose: build
title: 'AW-1 Wall readable scale implementation sub-plan'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, scale, viewbox, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# AW-1 Wall Readable Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Worktree: `.worktrees/feat-aw-1-wall-readable-scale` (branch `feat/aw-1-wall-readable-scale`). TDD is required: write the failing seam test, verify red, implement, verify green, then commit.

**Goal:** Make the populated Analyze Wall readable on entry and make Fit change the effective scale instead of only resetting the inner pan/zoom layer.

**Architecture:** The SVG `viewBox` is the single authority for readable default and fit scale. `computeWallContentBBox` returns a tight content box for actual Wall content, and `WallCanvas` renders that box as the destination `viewBox`; app Fit handlers reset user interaction state back to the same viewBox-owned fit instead of pretending inner zoom owns the scale. The inner `zoom/pan` transform remains the user interaction layer only.

**Tech Stack:** React, SVG, Zustand canvas viewport store, `@variscout/ui` AnalyzeWall layout helpers, Vitest + Testing Library, Browser verification for PWA and Azure.

---

### Task 1: Lock the Sparse Content BBox Contract

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts`
- Modify: `packages/ui/src/components/AnalyzeWall/wallLayout.ts`

- [ ] **Step 1: Write failing layout tests**

Add tests proving sparse populated Walls are measured by occupied content, while factor glyphs remain included when present.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @variscout/ui test -- packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts`

Expected before implementation: the sparse bbox test fails because the current bbox still includes always-present far content and spans too much height.

- [ ] **Step 3: Implement the tighter bbox**

Update `computeWallContentBBox` so it includes hub cards and finding chips as occupied content, includes factor glyphs only when `layout.factorPositions.size > 0`, includes the scope anchor only when hubs/findings exist, and preserves the full-canvas fallback when there are no boxes.

- [ ] **Step 4: Verify green and commit**

Run the same targeted UI layout test. Then branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-aw-1-wall-readable-scale`; branch is `feat/aw-1-wall-readable-scale`.

Commit: `test(ui): lock wall readable bbox contract` or `fix(ui): tighten wall content bbox`.

### Task 2: Make WallCanvas Expose and Use the Readable ViewBox

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/wallLayout.ts`

- [ ] **Step 1: Write failing WallCanvas scale tests**

Add load-bearing tests that parse the rendered destination SVG `viewBox` and `data-wall-content-bbox` to prove the default populated Wall fills a conservative viewport threshold, not merely that the viewBox changed from `0 0 2000 1400`.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @variscout/ui test -- packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`

Expected before implementation: the threshold or metadata assertion fails on the current decoupled scale behavior.

- [ ] **Step 3: Implement readable viewBox metadata**

Add a small shared helper for readable Wall viewBox formatting if needed, compute `populatedContentBBox` once in `WallCanvas`, use `formatWallViewBox(populatedContentBBox)`, and expose `data-wall-content-bbox` on the SVG for tests/browser measurement. Keep overlay mode on the full canvas viewBox and mobile on `MobileCardList`.

- [ ] **Step 4: Verify green and commit**

Run the targeted `WallCanvas.test.tsx` command, then branch guard and commit.

### Task 3: Make Fit Reset to the ViewBox-Owned Scale in Both Apps

**Files:**

- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify tests only if an existing app seam directly covers Fit behavior.

- [ ] **Step 1: Write or extend a failing app parity seam where practical**

Prefer a shared UI-level negative-control test if app tests are too heavy: render with a zoomed/panned viewport, invoke the Fit command/button path, and assert effective transform/scale changes. The test must fail if Fit only calls `onFit` without changing scale.

- [ ] **Step 2: Verify red**

Run the narrowest relevant UI/app test command and confirm failure is caused by Fit being a no-op for effective scale.

- [ ] **Step 3: Implement parity fit handlers**

In both apps, keep `fitWallToContent` as the handler used by the toolbar and keyboard shortcut. It must reset `zoom: 1` and `pan: { x: 0, y: 0 }` through `useCanvasViewportStore.getState().fitToContent(wallHubId, 'l2', ...)`, so the rendered destination Wall returns to the viewBox-owned fit and any user zoom/pan is cleared.

- [ ] **Step 4: Verify green and commit**

Run targeted UI/app tests. Branch guard and commit.

### Task 4: Final Verification, Browser Evidence, PR, Merge

**Files:**

- PR body only; screenshots saved as local artifacts if needed.

- [ ] **Step 1: Run targeted regression tests**

Run:

```bash
pnpm --filter @variscout/ui test -- packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx packages/ui/src/components/AnalyzeWall/__tests__/useWallKeyboard.test.tsx
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa test
```

- [ ] **Step 2: Run full merge gate**

Run: `bash scripts/pr-ready-check.sh`

- [ ] **Step 3: Browser verify both apps**

Start each app, load `?sample=analyze-showcase`, measure the Wall SVG `viewBox` and client box on entry, then zoom/pan away and press Fit. Capture before/after screenshots and record the measured change in the PR body.

- [ ] **Step 4: Open PR and merge**

Open the PR with the screenshot evidence and measurements. After required checks pass, merge with:

```bash
gh pr merge --merge --delete-branch
```

Never use squash.
