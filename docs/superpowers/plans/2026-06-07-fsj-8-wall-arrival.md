---
tier: ephemeral
purpose: build
title: 'FSJ-8 Wall Arrival Implementation Plan'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/02-journeys/wireframes/wall-arrival.md
---

# FSJ-8 Wall Arrival Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the findings-forward Wall arrival, one-time capture afterglow, named finding promotion, and epistemic status ladder for FSJ-8.

**Architecture:** FSJ-8 consumes the shipped FSJ-7 capture card and CS-10/CS-12 Wall machinery. Findings remain normal `Finding` records with `context.activeFilters`; promotion creates and links normal hypothesis hubs through each app's existing Wall source of truth; status suggestions are advisory chips that call the analyst-owned status setter.

**Tech Stack:** React, TypeScript, Zustand stores, Vitest/Testing Library, pnpm/turbo.

---

## Grounded Decisions

- FSJ-7 is merged through PR #319 plus the later engine/mobile/Azure surface on `origin/main`; no open FSJ-7 PRs were present before work began.
- `WallCanvas` owns the orphan finding affordance through `onProposeHypothesis`; this PR changes the callback to carry a typed name, not a generated title.
- PWA promotion must use `createHub(name, '')` + `connectFindingToHub`; Azure must use `hypothesesState.createHub(name, '')` + `hypothesesState.connectFinding`.
- No stored factor-to-hypothesis edge model is introduced. CS-12 derives edges from linked findings' `context.activeFilters`.
- `HypothesisStatus` and Report composition are fenced. Stored `hub.status` remains authoritative; derived status and new proposal chips are advisory only.
- `CaptureCard` internals are fenced. Afterglow state attaches around capture save confirmations and is shown only for actual Finding captures, never Factor-only.
- Hardcoded English is accepted under the FSJ precedent; log the i18n sweep if new copy lands outside current catalog patterns.

## Task 1: Plan + Worktree Setup

**Files:**

- Create: `docs/superpowers/plans/2026-06-07-fsj-8-wall-arrival.md`

- [ ] Verify no open FSJ-7 PRs with `gh pr list --state open --search FSJ-7`.
- [ ] Create `.worktrees/feat-fsj-8-wall-arrival` from `origin/main`.
- [ ] Run `pnpm install` in the worktree.
- [ ] Commit this plan after branch guard:

```bash
git rev-parse --abbrev-ref HEAD
pwd
git add docs/superpowers/plans/2026-06-07-fsj-8-wall-arrival.md
git commit -m "docs(fsj-8): add wall arrival implementation plan"
```

Expected branch: `feat/fsj-8-wall-arrival`; expected path ends with `.worktrees/feat-fsj-8-wall-arrival`.

## Task 2: Findings-Forward Wall Arrival

**Files:**

- Create: `packages/ui/src/components/AnalyzeWall/WallArrival.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/MobileCardList.test.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/MobileCardList.tsx`

- [ ] Add failing tests proving zero hubs plus findings renders `You've observed:` and one `What might cause this?` CTA per finding on desktop and mobile.
- [ ] Keep the old empty state when there are zero hubs and zero findings.
- [ ] Implement `WallArrival` as a shared presentational component that renders concise condition/evidence text from each finding and preserves fallback CTAs.
- [ ] Wire `WallCanvas` and `MobileCardList` to use it for `hubs.length === 0 && findings.length > 0`.
- [ ] Run targeted UI tests and commit `feat(fsj-8): show findings-forward wall arrival`.

## Task 3: Plain-Language Promotion Prompt

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallArrival.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/FindingChip.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Tests: existing WallCanvas/FindingChip/PWA/Azure mapwall tests

- [ ] Add failing tests proving `What might cause this?` opens a prompt titled the same, the input is initially empty, submit is disabled until non-empty, and submit calls `onProposeHypothesis(findingId, typedName)`.
- [ ] Update `onProposeHypothesis` to `(findingId: string, name: string) => void`.
- [ ] PWA: create `createHub(name, '')`, then `connectFindingToHub(hub.id, findingId)`.
- [ ] Azure: create through `hypothesesState.createHub(name, '')`, then `hypothesesState.connectFinding(hub.id, findingId)`.
- [ ] Run targeted tests and commit `feat(fsj-8): require named finding promotion`.

## Task 4: Analyze Entry Convergence

**Files:**

- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `packages/hooks/src/useHasAnalyzeContent.ts`
- Tests: PWA/Azure Analyze mapwall tests, Canvas mobile shortcut tests

- [ ] Add failing tests proving direct Analyze entry with findings and no hubs selects Wall mode once.
- [ ] Add failing tests proving mobile `WallShortcutButton` appears when findings exist even if hubs do not.
- [ ] Implement route convergence without a render-time force loop; only entry actions/effects set Wall mode.
- [ ] Run targeted tests and commit `feat(fsj-8): route findings to wall arrival`.

## Task 5: Capture Afterglow

**Files:**

- Modify: `apps/pwa/src/components/Dashboard.tsx`
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/azure/src/components/Dashboard.tsx`
- Modify: `apps/azure/src/components/MobileChartCarousel.tsx`
- Tests: PWA Dashboard, Azure Dashboard, Azure MobileChartCarousel

- [ ] Add failing tests proving actual Capture shows `Take it to Analyze ->`, Factor-only does not, dismiss hides it, and CTA routes to Analyze/Wall.
- [ ] Implement local one-time afterglow state around the save confirmation paths. Keep `CaptureCard` unchanged.
- [ ] Use existing `showAnalyze()` and Wall view-mode setters for navigation.
- [ ] Run targeted tests and commit `feat(fsj-8): add capture afterglow to analyze`.

## Task 6: Status Ladder + Proposal Chips

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.statusChip.test.tsx`

- [ ] Add failing tests for ladder labels, one-line microcopy, override select, and chip priority.
- [ ] Render ladder presentation: `Proposed -> Evidenced -> Needs disconfirmation -> Supported`, with `Refuted` as a branch.
- [ ] Keep the select as override and keep calling `onSetStatus`.
- [ ] Add advisory chips with priority Refuted, Supported, Needs disconfirmation, Evidenced.
- [ ] Run targeted tests and commit `feat(fsj-8): present hypothesis status ladder`.

## Task 7: Regression, Review, PR, Merge

- [ ] Run targeted suites:

```bash
pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/WallCanvas*.tsx src/components/AnalyzeWall/__tests__/MobileCardList.test.tsx src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.statusChip.test.tsx
pnpm --filter @variscout/pwa test src/components/__tests__/Dashboard.test.tsx src/components/views/__tests__/AnalyzeView.mapwall.test.tsx src/components/views/__tests__/FrameView.test.tsx
pnpm --filter @variscout/azure-app test src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx src/components/__tests__/Dashboard.test.tsx src/components/__tests__/MobileChartCarousel.test.tsx
pnpm docs:check
pnpm test
pnpm build
bash scripts/pr-ready-check.sh
```

- [ ] Live verify: capture Finding -> afterglow -> Analyze/Wall arrival -> name prompt -> promoted hub -> ladder proposal chip.
- [ ] Dispatch adversarial-review subagent over the branch.
- [ ] Push, create PR, and include grounding corrections, task summary, test counts, OWNER-CALL-PENDING: none, and live verification checklist.
- [ ] Merge only with `gh pr merge --merge --delete-branch` after green checks.
- [ ] Leave the worktree.

## Self-Review Checklist

- [ ] No `HypothesisStatus` enum edits.
- [ ] No Report composition or `ipReport` edits.
- [ ] No save/export nudge, `beforeunload`, name-before-invite, or ingest edits.
- [ ] No stored factor-edge model.
- [ ] No auto-derived factor or finding text used as a hypothesis title.
- [ ] No P5 vocabulary violations.
