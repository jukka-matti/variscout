---
tier: ephemeral
purpose: build
title: 'AW-3 Legible gates implementation sub-plan'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, gates, readability, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/plans/2026-06-08-aw-1-wall-readable-scale.md
  - docs/superpowers/plans/2026-06-08-aw-2-canvas-first-chrome.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# AW-3 Legible Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Worktree: `.worktrees/feat-aw-3-legible-gates` (branch `feat/aw-3-legible-gates`). TDD is required: write the failing seam test, verify red, implement, verify green, then commit.

**Goal:** Make Wall logic gates read as labeled badges at the default AW-1/AW-2 scale, for example `HOLDS 38/42 · H1 ∧ H2`, instead of a tiny diamond plus detached text.

**Architecture:** Keep the shipped `GateNode` / `runAndCheck` engine and drag-to-compose seam. `GateBadge` becomes the shared SVG primitive for a readable pill badge with stable measurement selectors. `WallCanvas` composes the existing gate evaluation with a concise expression label derived from the current contribution tree and hub labels. PWA and Azure stay in parity because both apps consume the shared Analyze Wall component.

**Tech Stack:** React SVG, `@variscout/core` gate evaluation, `@variscout/ui` AnalyzeWall components, Vitest + Testing Library, Browser verification for PWA and Azure.

---

### Task 1: Make GateBadge Readable and Measurable

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/GateBadge.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/GateBadge.test.tsx`

- [ ] **Step 1: Write failing badge tests**

Add tests proving the badge renders the primary `HOLDS N/M` label, includes the gate expression when provided, exposes stable test/measurement attributes, and uses readable SVG geometry/text sizing rather than the small diamond-only glyph.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/GateBadge.test.tsx
```

Expected before implementation: expression/measurement/readability assertions fail against the current tiny diamond badge.

- [ ] **Step 3: Implement readable badge**

Render a compact pill-like SVG badge with `HOLDS N/M` as the first visible label, optional expression text after a separator, and the gate kind retained as metadata/accessibility. Keep click, keyboard, and context-menu behavior unchanged for `onRun` / `onContextMenu`.

- [ ] **Step 4: Verify green and commit**

Run the targeted badge test. Then branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-aw-3-legible-gates`; branch is `feat/aw-3-legible-gates`.

Commit: `feat(ui): make wall gate badges readable`.

### Task 2: Compose Gate Expressions from WallCanvas Data

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`

- [ ] **Step 1: Write failing WallCanvas tests**

Extend the scope gate tests to use a compound `GateNode` such as `and([H1, H2])`, assert `HOLDS N/M` matches `runAndCheck` over the active rows, and assert the badge includes a concise expression label such as `H1 ∧ H2`. Add a per-hypothesis badge regression proving single-hub gates remain readable.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx
```

Expected before implementation: the scope gate renders only the problem card's small HOLDS row and current badge lacks the expression/readable badge contract.

- [ ] **Step 3: Implement expression composition**

Derive stable short hub labels from the rendered hub order and compose `GateNode` labels without changing boolean semantics. Use `∧`, `∨`, and `¬` in the expression text; leave `runAndCheck` as the only source of `holds` / `total`. Do not modify card internals, status labels, evidence angles, activity line, Causes matrix behavior, or snap-river layout.

- [ ] **Step 4: Verify green and commit**

Run the targeted WallCanvas test plus the badge test. Branch guard and commit: `feat(ui): surface wall gate expressions`.

### Task 3: Preserve Composition and App Parity

**Files:**

- Modify tests as needed in `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`
- Modify app seam tests only if shared selectors need parity coverage

- [ ] **Step 1: Write or extend interaction tests**

Assert that enabling `onComposeGate` still renders draggable hubs and droppable gate badges, and that overlay/mobile branches keep their existing behavior.

- [ ] **Step 2: Verify targeted regression**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/GateBadge.test.tsx src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx src/components/AnalyzeWall/__tests__/useWallDragDrop.test.tsx
```

- [ ] **Step 3: Commit any parity polish**

If app seams need selectors or fixture updates, keep them behavior-only and commit separately after branch guard.

### Task 4: Final Verification and Merge

**Files:**

- PR body with browser screenshots and measurements.

- [ ] **Step 1: Run full merge gate**

Run:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] **Step 2: Browser verify both apps**

Start each app, load `?sample=analyze-showcase`, navigate to Analyze -> Wall, and verify any rendered gate badge reads as a labeled `HOLDS N/M` badge at entry scale. If the showcase path has no authored compound gate, use the app's gate composition flow or a development fixture to create a compound gate, then verify:

- `HOLDS N/M` is legible without zooming.
- The expression label is visible.
- Drag-to-compose remains reachable.
- PWA and Azure render the same shared badge surface.

Capture screenshots for both apps.

- [ ] **Step 3: Open PR and merge**

Open the PR with screenshot evidence and measurements. After required checks pass, merge with:

```bash
gh pr merge --merge --delete-branch
```

Never use squash.
