---
tier: ephemeral
purpose: build
title: 'AW-5 Scope findings implementation sub-plan'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, findings, scope, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/plans/2026-06-08-aw-4-demote-evidence-map.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# AW-5 Scope Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Worktree: `.worktrees/feat-aw-5-scope-findings` (branch `feat/aw-5-scope-findings`). TDD is required: write the failing seam test, verify red, implement, verify green, then commit.

**Goal:** Close the write-only `Finding.scopeId` gap so the Wall and Findings list show the findings that belong to the active `ProblemStatementScope`, while loose/global findings still render when no scope is active.

**Architecture:** Keep `Finding.scopeId` as the durable finding-to-scope edge already written by `useAnalyzeStore.addFinding`. Add a pure selector in `packages/stores/src/wallSelectors.ts` that returns scope-visible findings for a given active scope id. Both app shells derive the active scope from the transient drill chips (`useAnalysisScopeStore.categoricalFilters`) and persisted scopes (`useAnalyzeStore.scopes`), then pass the scoped finding pool into `WallCanvas`, `FindingsLog`, `AnalyzeConclusion`, origin-step derivation, command/minimap layout, and model-builder capture context. `WallCanvas` remains the renderer/layout consumer; it does not own scope filtering.

**Tech Stack:** Zustand stores/selectors, React Analyze shells in Azure/PWA, shared `@variscout/ui` Wall and Findings components, Vitest + Testing Library, browser verification for PWA and Azure.

---

### Task 1: Add a Pure Scope-Finding Selector

**Files:**

- Modify: `packages/stores/src/wallSelectors.ts`
- Modify: `packages/stores/src/index.ts`
- Create or modify: `packages/stores/src/__tests__/wallSelectors.test.ts`

- [ ] **Step 1: Write failing selector tests**

Add tests for `selectFindingsForScope(findings, activeScopeId)`:

- no active scope returns every finding;
- active scope returns findings whose `scopeId` matches;
- unscoped findings are excluded when a scope is active;
- other-scope findings are excluded when a different scope is active.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/stores test -- src/__tests__/wallSelectors.test.ts
```

Expected before implementation: import/function missing.

- [ ] **Step 3: Implement selector**

Implement the selector as a pure function in `wallSelectors.ts`:

```ts
export function selectFindingsForScope(
  findings: Finding[],
  activeScopeId: string | undefined
): Finding[] {
  if (!activeScopeId) return findings;
  return findings.filter(f => f.scopeId === activeScopeId);
}
```

Export it from `packages/stores/src/index.ts`.

- [ ] **Step 4: Verify green and commit**

Run the targeted stores test. Branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-aw-5-scope-findings`; branch is `feat/aw-5-scope-findings`.

Commit: `feat(stores): select findings for active wall scope`.

### Task 2: Scope Azure Wall and Findings Readers

**Files:**

- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`

- [ ] **Step 1: Write failing Azure seam tests**

Seed two persisted scopes with identical outcome but different predicates and three findings: one in scope A, one in scope B, and one unscoped. Set `useAnalysisScopeStore.categoricalFilters` to scope A. Assert:

- `WallCanvas` receives only the scope-A finding;
- the Findings lens (`FindingsLog`) receives only the scope-A finding;
- switching to no active categorical filters makes `WallCanvas` receive all findings.

Keep the hub clue split untouched: the test should not require mutating `hypothesis.findingIds` or `counterFindingIds`.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
```

Expected before implementation: `WallCanvas`/`FindingsLog` receive all findings even when an active scope exists.

- [ ] **Step 3: Implement Azure filtering**

Import `selectFindingsForScope` from `@variscout/stores`. Derive `scopedFindings = selectFindingsForScope(findingsState.findings, activeScope?.id)` and use it for:

- `WallCanvas.findings`;
- `FindingsLog.findings`;
- `AnalyzeConclusion.findings` in the Wall overlay;
- origin-step labels and any Wall-side layout/pan computations that consume findings.

Leave global app persistence and Report data untouched; this is a view/read filter for Analyze.

- [ ] **Step 4: Verify green and commit**

Run the Azure mapwall seam test. Branch guard and commit: `feat(azure): scope wall findings by active scope`.

### Task 3: Scope PWA Wall and Findings Readers

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`

- [ ] **Step 1: Write failing PWA seam tests**

Use real `useAnalyzeStore` and `useAnalysisScopeStore`. Seed outcome, drill categorical filters, two persisted scopes, and findings in scope A, scope B, and no scope. Assert:

- PWA materializes/selects the active persisted scope from drill filters;
- `WallCanvas` receives only the active-scope finding;
- no active drill filters is the negative control and sends all findings to `WallCanvas`.

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected before implementation: PWA does not derive active scope for Wall filtering and sends all findings.

- [ ] **Step 3: Implement PWA active-scope derivation and filtering**

Import `useAnalysisScopeStore`, `selectFindingsForScope`, `buildConditionFromCategoricalFilters`, and `predicateSetKey` as needed. Mirror Azure's active-scope materialization:

- read `categoricalFilters` and `scopes`;
- call `syncScopeFromDrill(scopeProjectId, outcome, categoricalFilters)` when outcome exists;
- derive `activeScope` by matching `scopeProjectId`, `outcome`, and `predicateSetKey`;
- pass `activeScope` to `WallCanvas`;
- pass `selectFindingsForScope(wallFindings, activeScope?.id)` to `WallCanvas`, Findings, overlay conclusion, origin-step derivation, and Wall layout/pan computations.

Use `activeIP?.id` when available, else the existing canvas viewport hub id/sentinel used by PWA Analyze tests. Do not restore active-IP lineage membership filtering.

- [ ] **Step 4: Verify green and commit**

Run the PWA mapwall seam test. Branch guard and commit: `feat(pwa): scope wall findings by active scope`.

### Task 4: Confirm Wall Renderer Behavior and Loose-Finding Control

**Files:**

- Modify only if coverage is missing:
  - `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`
  - `packages/ui/src/components/AnalyzeWall/wallLayout.ts`

- [ ] **Step 1: Add renderer-level negative control if needed**

Confirm `WallCanvas` still renders loose findings when no active scope is supplied and the caller passes loose findings. This protects the master-plan acceptance that loose findings remain first-class; AW-5 filtering must happen before the renderer, not by deleting the orphan lane.

- [ ] **Step 2: Verify targeted UI coverage**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx
```

- [ ] **Step 3: Commit only if UI coverage changed**

Branch guard and commit: `test(ui): preserve loose wall findings`.

### Task 5: Final Verification and Merge

**Files:**

- PR body with browser screenshots and measurements.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
pnpm --filter @variscout/stores test -- src/__tests__/wallSelectors.test.ts src/__tests__/analyzeStore.test.ts
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

- [ ] **Step 2: Run final merge gate**

Run:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] **Step 3: Browser verify both apps**

Start each app, load `?sample=analyze-showcase`, enter Analyze, create/select a categorical scope if needed, and verify:

- current-scope Wall shows only that scope's findings;
- switching back to all/no scope restores loose/global findings;
- Wall and Findings lens agree on the same finding pool;
- both apps keep Wall/Causes/Findings parity.

Capture screenshots and record DOM measurements for PWA and Azure.

- [ ] **Step 4: Open PR and merge**

Open the PR with screenshot evidence and measurements. After required checks pass, merge with:

```bash
gh pr merge --merge --delete-branch
```

Never use squash.
